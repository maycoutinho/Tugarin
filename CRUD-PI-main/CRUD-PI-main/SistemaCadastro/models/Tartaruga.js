import { DataTypes } from 'sequelize'
import sequelize from './database.js'

const Tartaruga = sequelize.define('Tartaruga', {

  identificacao: {
    type: DataTypes.STRING,
    allowNull: false
  },

  especie: {
    type: DataTypes.STRING,
    allowNull: false
  },

  local: {
    type: DataTypes.STRING,
    allowNull: false
  },

  situacao: {
    type: DataTypes.STRING,
    allowNull: false
  },

  observacoes: {
    type: DataTypes.TEXT
  },

  imagem: {
    type: DataTypes.STRING
  }

})

export default Tartaruga