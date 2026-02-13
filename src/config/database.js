const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: config.env === 'production' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
});

// Test connection
sequelize.authenticate()
  .then(() => logger.info('✅ Database connected successfully'))
  .catch(err => logger.error('❌ Database connection failed:', err));

module.exports = sequelize;
