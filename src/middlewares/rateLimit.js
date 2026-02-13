const rateLimit = require('express-rate-limit');
const config = require('../config');

const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const generalLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests
);

const strictLimiter = createRateLimiter(60000, 10); // 10 requests per minute
const uploadLimiter = createRateLimiter(300000, 5); // 5 uploads per 5 minutes

module.exports = {
  generalLimiter,
  strictLimiter,
  uploadLimiter,
};
