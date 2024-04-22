// models/Return.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';
import { Order } from './Order.js';


class Return extends Model {}

Return.init(
  {
    itemId: {
      type: DataTypes.INTEGER, // Assuming Order ID is an integer in Sequelize
      allowNull: false,
      references: {
        model: Order,
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    returnImages: {
      type: DataTypes.ARRAY(DataTypes.STRING) // Array of image URLs
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  },
  {
    sequelize,
    tableName: 'returns',
    modelName: 'Return',
  }
);

export {Return};
