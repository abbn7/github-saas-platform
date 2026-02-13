require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  telegram: {
    botToken: process.env.BOT_TOKEN,
    webhookDomain: process.env.WEBHOOK_DOMAIN || process.env.APP_URL,
  },
  
  github: {
    token: process.env.GITHUB_TOKEN,
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    url: process.env.REDIS_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  
  plans: {
    free: {
      name: 'Free',
      maxRepos: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxApiCalls: 100,
      features: ['basic_operations', 'telegram_bot'],
    },
    pro: {
      name: 'Pro',
      price: 9.99,
      maxRepos: 50,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxApiCalls: 1000,
      features: ['basic_operations', 'telegram_bot', 'api_access', 'priority_support'],
    },
    enterprise: {
      name: 'Enterprise',
      price: 49.99,
      maxRepos: -1, // unlimited
      maxFileSize: 500 * 1024 * 1024, // 500MB
      maxApiCalls: -1, // unlimited
      features: ['basic_operations', 'telegram_bot', 'api_access', 'priority_support', 'custom_integrations', 'dedicated_support'],
    },
  },
};
