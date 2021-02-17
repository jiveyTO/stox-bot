'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Trade extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
    }
  };
  Trade.init({
    guild: {
      type: DataTypes.STRING,
      allowNull: false
    },
    trader: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ticker: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull: false
    },
    strike: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'trades',
    modelName: 'Trade'
  })
  return Trade
}
