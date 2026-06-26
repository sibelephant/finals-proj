import Sequelize from 'sequelize';
import databaseConfig from './database.cjs';

const env = process.env.NODE_ENV || 'development';
const config = databaseConfig[env];

export const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);

export default sequelize;
