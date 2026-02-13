const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const ActivityLogService = require('../services/ActivityLogService');
const QueueService = require('../services/QueueService');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await UserService.getAllUsers(parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const stats = await UserService.getUserStats(user.id);
    
    res.json({
      success: true,
      data: { ...user.toJSON(), stats },
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.patch('/users/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { plan, isActive, role } = req.body;
    const updates = {};
    
    if (plan) updates.plan = plan;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;
    if (role) updates.role = role;
    
    const user = await UserService.updateUser(req.params.id, updates);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Get all activity logs
router.get('/logs', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await ActivityLogService.getAllLogs(parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Get activity stats
router.get('/stats/activities', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const stats = await ActivityLogService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Get queue stats
router.get('/stats/queues', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const [github, upload, notification] = await Promise.all([
      QueueService.getQueueStats('githubQueue'),
      QueueService.getQueueStats('uploadQueue'),
      QueueService.getQueueStats('notificationQueue'),
    ]);
    
    res.json({
      success: true,
      data: {
        github,
        upload,
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Platform stats
router.get('/stats/platform', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { User } = require('../database/models');
    
    const [
      totalUsers,
      activeUsers,
      freeUsers,
      proUsers,
      enterpriseUsers,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { plan: 'free' } }),
      User.count({ where: { plan: 'pro' } }),
      User.count({ where: { plan: 'enterprise' } }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        plans: {
          free: freeUsers,
          pro: proUsers,
          enterprise: enterpriseUsers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
