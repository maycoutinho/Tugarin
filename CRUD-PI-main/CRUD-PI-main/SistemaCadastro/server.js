
import mysql from 'mysql2/promise'
import express from 'express'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'
import session from 'express-session'

import sequelize from './models/database.js'
import TartarugaController from './controllers/tartarugaController.js'
import authController from './controllers/authController.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuração da sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'tugarin-sessao-local',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

// Configurações do Express
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Verificação de autenticação
function verificarAutenticacao(req, res, next) {
  if (req.session && req.session.usuario) {
    return next()
  }

  return res.redirect('/')
}

// Configuração do upload de imagens
const pastaUploads = path.join(__dirname, 'public', 'uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({ storage })

// --------------------------------------------------
// INTEGRAÇÃO COM O ROBOFLOW
// --------------------------------------------------

const ROBOFLOW_WORKFLOW_URL =
  'https://serverless.roboflow.com/tugarin/workflows/tugarin-tartarugas-vtugarin-tartarugas-2-rfdetr-small-t1-logic'

app.post(
  '/api/detectar-tartarugas',
  verificarAutenticacao,
  async (req, res) => {
    try {
      const { imagem } = req.body

      if (
        typeof imagem !== 'string' ||
        !imagem.startsWith('data:image/')
      ) {
        return res.status(400).json({
          erro: 'Imagem inválida ou não enviada.'
        })
      }

      const apiKey = process.env.ROBOFLOW_API_KEY

      if (!apiKey) {
        return res.status(500).json({
          erro: 'Configure a variável ROBOFLOW_API_KEY no terminal.'
        })
      }

      const imagemBase64 = imagem.replace(
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
        ''
      )

      const resposta = await fetch(ROBOFLOW_WORKFLOW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          inputs: {
            image: {
              type: 'base64',
              value: imagemBase64
            }
          }
        })
      })

      const resultado = await resposta.json()

      if (!resposta.ok) {
        console.error('Erro do Roboflow:', resultado)

        return res.status(502).json({
          erro: 'O Roboflow recusou ou não conseguiu processar a imagem.',
          detalhes: resultado
        })
      }

      return res.json(resultado)
    } catch (erro) {
      console.error('Erro na integração com o Roboflow:', erro)

      return res.status(500).json({
        erro: 'Falha ao enviar a imagem para o detector.'
      })
    }
  }
)

// --------------------------------------------------
// PÁGINAS DO SISTEMA
// --------------------------------------------------

app.get('/home', verificarAutenticacao, (req, res) => {
  res.render('home', { pagina: 'home' })
})

// Câmeras de demonstração
app.get('/camera', verificarAutenticacao, (req, res) => {
  const cameras = {
    CAM_01: 'Cananéia Norte',
    CAM_02: 'Boqueirão Sul',
    CAM_05: 'Baía dos Golfinhos'
  }

  const codigoSolicitado = String(req.query.cam || 'CAM_05')

  const codigoCamera = Object.prototype.hasOwnProperty.call(
    cameras,
    codigoSolicitado
  ) ? codigoSolicitado : 'CAM_05'

  const nomeCamera = cameras[codigoCamera]

  return res.render('camera', {
    pagina: 'camera',
    codigoCamera,
    nomeCamera
  })
})

// Login e cadastro de usuários
app.get('/', authController.loginPage)
app.post('/login', authController.login)

app.get('/cadastro-usuario', authController.cadastroPage)
app.post('/cadastro-usuario', authController.cadastrar)

// Cadastro e gerenciamento de tartarugas
app.get('/dashboard', verificarAutenticacao, TartarugaController.listar)
app.get('/cadastro', verificarAutenticacao, TartarugaController.cadastro)

app.post(
  '/salvar',
  verificarAutenticacao,
  upload.single('imagem'),
  TartarugaController.salvar
)

app.get(
  '/editar/:id',
  verificarAutenticacao,
  TartarugaController.editarPage
)

app.post(
  '/atualizar/:id',
  verificarAutenticacao,
  upload.single('imagem'),
  TartarugaController.atualizar
)

app.post(
  '/excluir/:id',
  verificarAutenticacao,
  TartarugaController.excluir
)

// --------------------------------------------------
// CRIAÇÃO DO BANCO E INICIALIZAÇÃO
// --------------------------------------------------

async function criarBanco() {
  let connection

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    })

    await connection.query(
      'CREATE DATABASE IF NOT EXISTS SistemaCadastroTartaruga'
    )

    console.log('Banco criado ou já existente')
  } catch (erro) {
    console.error('Erro ao criar banco de dados:', erro.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

async function iniciarServidor() {
  await criarBanco()

  try {
    await sequelize.sync()

    app.listen(8080, () => {
      console.log('Servidor rodando em http://localhost:8080')
    })
  } catch (erro) {
    console.error('Erro na sincronização do Sequelize:', erro)
  }
}

iniciarServidor()
