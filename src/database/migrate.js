const sequelize = require('../config/database');
const models = require('./models');
const logger = require('../utils/logger');

async function migrate() {
  try {
    logger.info('🔄 Starting database migration...');
    
    await sequelize.sync({ force: false, alter: true });
    
    logger.info('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

migrate();
