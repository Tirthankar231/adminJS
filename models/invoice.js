// models/Invoice.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class Invoice extends Model {}

Invoice.init(
  {
    billingAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    invoiceLink: {
      type: DataTypes.STRING,
      allowNull: false
    },
    finderFees: {
      type: DataTypes.FLOAT,
      defaultValue: 0 // Default value for finder fees
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'invoices',
    modelName: 'Invoice',
  }
);

export {Invoice};
