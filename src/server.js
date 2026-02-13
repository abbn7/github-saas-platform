const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');
const bot = require('./controllers/TelegramBot');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimit');

// Import routes
const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repos');
const adminRoutes = require('./routes/admin');

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    version: '2.0.0',
    endpoints: {
      auth: {
        'POST /api/v1/auth/login': 'Login with email and password',
        'GET /api/v1/auth/me': 'Get current user info',
        'POST /api/v1/auth/regenerate-key': 'Regenerate API key',
      },
      repos: {
        'GET /api/v1/repos': 'List all repositories',
        'GET /api/v1/repos/:name': 'Get repository by name',
        'POST /api/v1/repos': 'Create new repository',
        'PATCH /api/v1/repos/:name': 'Update repository',
        'DELETE /api/v1/repos/:name': 'Delete repository',
      },
      admin: {
        'GET /api/v1/admin/users': 'List all users (admin only)',
        'GET /api/v1/admin/users/:id': 'Get user by ID (admin only)',
        'PATCH /api/v1/admin/users/:id': 'Update user (admin only)',
        'GET /api/v1/admin/logs': 'Get activity logs (admin only)',
        'GET /api/v1/admin/stats/activities': 'Get activity stats (admin only)',
        'GET /api/v1/admin/stats/queues': 'Get queue stats (admin only)',
        'GET /api/v1/admin/stats/platform': 'Get platform stats (admin only)',
      },
    },
    authentication: {
      methods: ['Bearer Token', 'API Key'],
      headers: {
        bearer: 'Authorization: Bearer YOUR_JWT_TOKEN',
        apiKey: 'X-API-Key: YOUR_API_KEY',
      },
    },
  });
});

// Telegram Webhook
app.use(bot.webhookCallback('/webhook'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/repos', repoRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize database
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    // Initialize Redis
    const redis = require('./config/redis');
    await redis.ping();
    logger.info('✅ Redis connected');

    // Set webhook for Telegram bot
    const webhookUrl = `${config.telegram.webhookDomain}/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    logger.info(`✅ Telegram webhook set: ${webhookUrl}`);

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📱 Telegram bot: @${bot.botInfo?.username}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`📖 API Docs: ${config.appUrl}/api/docs`);
    });
  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  const sequelize = require('./config/database');
  await sequelize.close();
  
  const redis = require('./config/redis');
  await redis.quit();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  
  const sequelize = require('./config/database');
  await sequelize.close();
  
  const redis = require('./config/redis');
  await redis.quit();
  
  process.exit(0);
});

startServer();

module.exports = app;
