// File: database.js
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('postgresql://postgres:Tirtha@4321@localhost:5432/adminJS');

export default sequelize;
