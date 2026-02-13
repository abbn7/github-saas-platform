const { User } = require('./models');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Create admin user
    const adminExists = await User.findOne({ where: { email: config.admin.email } });
    
    if (!adminExists) {
      await User.create({
        telegramId: '0',
        username: 'admin',
        email: config.admin.email,
        password: config.admin.password,
        role: 'admin',
        plan: 'enterprise',
        apiKey: uuidv4(),
      });
      logger.info('✅ Admin user created');
    } else {
      logger.info('ℹ️ Admin user already exists');
    }
    
    logger.info('✅ Database seeding completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seed();
