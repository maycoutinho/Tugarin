import Tartaruga from '../models/Tartaruga.js'

const TartarugaController = {
  async listar(req, res) {
    const tartarugas = await Tartaruga.findAll({
      order: [['id', 'DESC']]
    })
    res.render('index', { tartarugas })
  },

  cadastro(req, res) {
    res.render('cadastro')
  },

  async salvar(req, res) {
    const { identificacao, especie, local, observacoes } = req.body
    let imagem = ''

    if (req.file) {
      imagem = req.file.filename
    }

    await Tartaruga.create({
      identificacao,
      especie,
      local,
      situacao: req.body.situacao,
      observacoes,
      imagem
    })

    res.redirect('/dashboard')
  },

  async excluir(req, res) {
    const { id } = req.params
    await Tartaruga.destroy({ where: { id } })
    res.redirect('/dashboard')
  },

  async editarPage(req, res) {
    const { id } = req.params
    const tartaruga = await Tartaruga.findByPk(id)
    res.render('editar', { tartaruga })
  },

  async atualizar(req, res) {
    const { id } = req.params
    const dadosAtualizados = { ...req.body }

    if (req.file) {
      dadosAtualizados.imagem = req.file.filename
    }

    await Tartaruga.update(dadosAtualizados, {
      where: { id }
    })

    res.redirect('/dashboard')
  }
}

export default TartarugaController