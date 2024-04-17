import { DataTypes } from 'sequelize';

const defineUserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });

  return User;
};

export default defineUserModel;
