import { DataTypes } from 'sequelize'
import sequelize from './database.js'

const Usuario = sequelize.define('Usuario', {

  email: {
    type: DataTypes.STRING,
    allowNull: false
  },

  senha: {
    type: DataTypes.STRING,
    allowNull: false
  }

})

export default Usuario