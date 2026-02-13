const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const { authMiddleware } = require('../middlewares/auth');

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await UserService.getUserByEmail(email);
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled',
      });
    }

    const token = await UserService.generateJWT(user);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          plan: user.plan,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const stats = await UserService.getUserStats(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          githubUsername: req.user.githubUsername,
          plan: req.user.plan,
          role: req.user.role,
          apiKey: req.user.apiKey,
          subscriptionStatus: req.user.subscriptionStatus,
        },
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Regenerate API key
router.post('/regenerate-key', authMiddleware, async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const newApiKey = uuidv4();
    
    await UserService.updateUser(req.user.id, { apiKey: newApiKey });
    
    res.json({
      success: true,
      data: {
        apiKey: newApiKey,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
