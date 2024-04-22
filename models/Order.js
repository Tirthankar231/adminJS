// models/Order.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class Order extends Model {}

Order.init(
  {
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered'),
      defaultValue: 'pending'
    },
    deliveryAddress: {
      type: DataTypes.STRING
    },
    amount: {
      type: DataTypes.FLOAT
    }
  },
  {
    sequelize,
    tableName: 'orders',
    modelName: 'Order',
  }
);

export {Order};
