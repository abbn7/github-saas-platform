const { User } = require('../database/models');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

class UserService {
  async findOrCreateByTelegram(telegramId, username) {
    try {
      let user = await User.findOne({ where: { telegramId } });
      
      if (!user) {
        user = await User.create({
          telegramId,
          username,
          apiKey: uuidv4(),
        });
        logger.info(`New user created: ${telegramId}`);
      }
      
      return user;
    } catch (error) {
      logger.error('UserService findOrCreateByTelegram error:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      return await User.findByPk(id);
    } catch (error) {
      logger.error('UserService getUserById error:', error);
      throw error;
    }
  }

  async getUserByApiKey(apiKey) {
    try {
      return await User.findOne({ where: { apiKey } });
    } catch (error) {
      logger.error('UserService getUserByApiKey error:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      return await User.findOne({ where: { email } });
    } catch (error) {
      logger.error('UserService getUserByEmail error:', error);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      const user = await User.findByPk(id);
      if (!user) throw new Error('User not found');
      
      await user.update(updates);
      return user;
    } catch (error) {
      logger.error('UserService updateUser error:', error);
      throw error;
    }
  }

  async upgradePlan(userId, plan) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');
      
      await user.update({
        plan,
        subscriptionStatus: 'active',
      });
      
      return user;
    } catch (error) {
      logger.error('UserService upgradePlan error:', error);
      throw error;
    }
  }

  async incrementUsage(userId, action) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');
      
      const usageStats = { ...user.usageStats };
      
      switch (action) {
        case 'repoCreated':
          usageStats.reposCreated = (usageStats.reposCreated || 0) + 1;
          break;
        case 'repoDeleted':
          usageStats.reposDeleted = (usageStats.reposDeleted || 0) + 1;
          break;
        case 'fileUploaded':
          usageStats.filesUploaded = (usageStats.filesUploaded || 0) + 1;
          break;
        case 'apiCall':
          usageStats.apiCalls = (usageStats.apiCalls || 0) + 1;
          break;
      }
      
      await user.update({ usageStats });
      return user;
    } catch (error) {
      logger.error('UserService incrementUsage error:', error);
      throw error;
    }
  }

  async generateJWT(user) {
    try {
      const payload = {
        id: user.id,
        telegramId: user.telegramId,
        email: user.email,
        role: user.role,
      };
      
      return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });
    } catch (error) {
      logger.error('UserService generateJWT error:', error);
      throw error;
    }
  }

  async verifyJWT(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      logger.error('UserService verifyJWT error:', error);
      throw error;
    }
  }

  async getAllUsers(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const { rows, count } = await User.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });
      
      return {
        users: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('UserService getAllUsers error:', error);
      throw error;
    }
  }

  async getUserStats(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: ['repositories', 'activities'],
      });
      
      if (!user) throw new Error('User not found');
      
      return {
        plan: user.plan,
        usageStats: user.usageStats,
        totalRepos: user.repositories.length,
        totalActivities: user.activities.length,
        subscriptionStatus: user.subscriptionStatus,
      };
    } catch (error) {
      logger.error('UserService getUserStats error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
