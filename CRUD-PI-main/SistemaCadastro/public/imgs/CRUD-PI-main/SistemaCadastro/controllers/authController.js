import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'

const authController = {
  loginPage(req, res) {
    res.render('login')
  },

  async login(req, res) {
    const { email, senha } = req.body

    const usuario = await Usuario.findOne({
      where: { email }
    })

    if (!usuario) {
      return res.send('Usuário não encontrado')
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
      return res.send('Senha incorreta')
    }

    req.session.usuario = usuario.id
    res.redirect('/dashboard') 
  },

  cadastroPage(req, res) {
    res.render('cadastro-usuario')
  },

  async cadastrar(req, res) {
    const { email, senha } = req.body
    const senhaHash = await bcrypt.hash(senha, 10)

    await Usuario.create({
      email,
      senha: senhaHash
    })

    res.redirect('/')
  }
}

export default authController