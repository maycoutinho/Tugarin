import mysql from 'mysql2/promise'
import express from 'express'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'
import session from 'express-session'

import sequelize from './models/database.js'
import TartarugaController from './controllers/TartarugaController.js'
import authController from './controllers/authController.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(session({
  secret: 'tartarugas',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs')

// Middleware para impedir que acessem o sistema sem fazer login
function verificarAutenticacao(req, res, next) {
  if (req.session && req.session.usuario) {
    return next()
  }
  res.redirect('/')
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage })




app.get('/', authController.loginPage)
app.post('/login', authController.login)

// Cadastro de usuário
app.get('/cadastro-usuario', authController.cadastroPage)
app.post('/cadastro-usuario', authController.cadastrar)

// Painel de Tartarugas (Protegido por login)
app.get('/dashboard', verificarAutenticacao, TartarugaController.listar)
app.get('/cadastro', verificarAutenticacao, TartarugaController.cadastro)
app.post('/salvar', verificarAutenticacao, upload.single('imagem'), TartarugaController.salvar)
app.get('/editar/:id', verificarAutenticacao, TartarugaController.editarPage)
app.post('/atualizar/:id', verificarAutenticacao, upload.single('imagem'), TartarugaController.atualizar)
app.post('/excluir/:id', verificarAutenticacao, TartarugaController.excluir)

async function criarBanco() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    })
    await connection.query(`CREATE DATABASE IF NOT EXISTS SistemaCadastroTartaruga`)
    console.log('📦 Banco criado ou já existente')
    await connection.end()
  } catch (err) {
    console.log('❌ Erro ao criar banco de dados:', err.message)
  }
}

await criarBanco()

sequelize.sync()
  .then(() => {
    app.listen(8080, () => {
      console.log('🚀 Servidor rodando em http://localhost:8080')
    })
  })
  .catch(err => {
    console.log('❌ Erro na sincronização do Sequelize:', err)
  })