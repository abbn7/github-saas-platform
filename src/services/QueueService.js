const { Queue, Worker } = require('bullmq');
const config = require('../config');
const logger = require('../utils/logger');

const connection = {
  host: config.redis.url.includes('@') 
    ? config.redis.url.split('@')[1].split(':')[0]
    : 'localhost',
  port: config.redis.url.includes('@')
    ? parseInt(config.redis.url.split(':')[2] || '6379')
    : 6379,
};

// Create queues
const githubQueue = new Queue('github-operations', { connection });
const uploadQueue = new Queue('file-uploads', { connection });
const notificationQueue = new Queue('notifications', { connection });

class QueueService {
  constructor() {
    this.githubQueue = githubQueue;
    this.uploadQueue = uploadQueue;
    this.notificationQueue = notificationQueue;
  }

  async addGitHubJob(jobName, data, options = {}) {
    try {
      const job = await this.githubQueue.add(jobName, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...options,
      });
      logger.info(`GitHub job added: ${jobName} - ${job.id}`);
      return job;
    } catch (error) {
      logger.error('QueueService addGitHubJob error:', error);
      throw error;
    }
  }

  async addUploadJob(data, options = {}) {
    try {
      const job = await this.uploadQueue.add('process-upload', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...options,
      });
      logger.info(`Upload job added: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('QueueService addUploadJob error:', error);
      throw error;
    }
  }

  async addNotificationJob(data, options = {}) {
    try {
      const job = await this.notificationQueue.add('send-notification', data, {
        attempts: 2,
        ...options,
      });
      logger.info(`Notification job added: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('QueueService addNotificationJob error:', error);
      throw error;
    }
  }

  async getJobStatus(queueName, jobId) {
    try {
      const queue = this[queueName];
      const job = await queue.getJob(jobId);
      
      if (!job) return null;
      
      const state = await job.getState();
      return {
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        state,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      logger.error('QueueService getJobStatus error:', error);
      throw error;
    }
  }

  async getQueueStats(queueName) {
    try {
      const queue = this[queueName];
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    } catch (error) {
      logger.error('QueueService getQueueStats error:', error);
      throw error;
    }
  }
}

module.exports = new QueueService();
