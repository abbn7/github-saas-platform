const { ActivityLog } = require('../database/models');
const logger = require('../utils/logger');

class ActivityLogService {
  async createLog(userId, action, resourceType, resourceId, status, metadata = {}) {
    try {
      const log = await ActivityLog.create({
        userId,
        action,
        resourceType,
        resourceId,
        status,
        metadata,
      });
      
      return log;
    } catch (error) {
      logger.error('ActivityLogService createLog error:', error);
      throw error;
    }
  }

  async getUserLogs(userId, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const { rows, count } = await ActivityLog.findAndCountAll({
        where: { userId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });
      
      return {
        logs: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('ActivityLogService getUserLogs error:', error);
      throw error;
    }
  }

  async getAllLogs(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const { rows, count } = await ActivityLog.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: ['user'],
      });
      
      return {
        logs: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('ActivityLogService getAllLogs error:', error);
      throw error;
    }
  }

  async getLogsByAction(action, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const { rows, count } = await ActivityLog.findAndCountAll({
        where: { action },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });
      
      return {
        logs: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('ActivityLogService getLogsByAction error:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const totalLogs = await ActivityLog.count();
      const successLogs = await ActivityLog.count({ where: { status: 'success' } });
      const failedLogs = await ActivityLog.count({ where: { status: 'failed' } });
      
      return {
        total: totalLogs,
        success: successLogs,
        failed: failedLogs,
        successRate: totalLogs > 0 ? (successLogs / totalLogs * 100).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error('ActivityLogService getStats error:', error);
      throw error;
    }
  }
}

module.exports = new ActivityLogService();
