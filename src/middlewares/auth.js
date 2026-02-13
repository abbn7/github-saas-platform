const UserService = require('../services/UserService');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const apiKey = req.headers['x-api-key'];
    
    if (!token && !apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let user;
    
    if (apiKey) {
      user = await UserService.getUserByApiKey(apiKey);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key',
        });
      }
    } else if (token) {
      const decoded = await UserService.verifyJWT(token);
      user = await UserService.getUserById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token or API key',
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
