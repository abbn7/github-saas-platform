const { Worker } = require('bullmq');
const config = require('./config');
const logger = require('./utils/logger');
const GitHubService = require('./services/GitHubService');
const UserService = require('./services/UserService');
const ActivityLogService = require('./services/ActivityLogService');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const admZip = require('adm-zip');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(config.telegram.botToken);

const connection = {
  host: config.redis.url.includes('@') 
    ? config.redis.url.split('@')[1].split(':')[0]
    : 'localhost',
  port: config.redis.url.includes('@')
    ? parseInt(config.redis.url.split(':')[2] || '6379')
    : 6379,
};

const TEMP_DIR = path.join(__dirname, '../temp');
fs.ensureDirSync(TEMP_DIR);

// GitHub Operations Worker
const githubWorker = new Worker(
  'github-operations',
  async (job) => {
    const { name, data } = job;
    logger.info(`Processing GitHub job: ${name}`, data);

    try {
      const github = new GitHubService();
      const user = await github.getUser();

      switch (name) {
        case 'delete-repo':
          await github.deleteRepository(user.login, data.repoName);
          await bot.telegram.sendMessage(
            data.chatId,
            `✅ *تم حذف المستودع بنجاح:* \`${data.repoName}\``,
            { parse_mode: 'Markdown' }
          );
          await ActivityLogService.createLog(
            data.userId,
            'delete_repo',
            'repository',
            data.repoName,
            'success'
          );
          await UserService.incrementUsage(data.userId, 'repoDeleted');
          break;

        case 'download-repo':
          const archive = await github.downloadRepository(user.login, data.repoName);
          const zipPath = path.join(TEMP_DIR, `${data.repoName}.zip`);
          await fs.writeFile(zipPath, Buffer.from(archive));
          
          await bot.telegram.sendDocument(
            data.chatId,
            { source: zipPath, filename: `${data.repoName}.zip` },
            {
              caption: `📦 *المستودع:* \`${data.repoName}\``,
              parse_mode: 'Markdown',
            }
          );
          
          await fs.remove(zipPath);
          await ActivityLogService.createLog(
            data.userId,
            'download_repo',
            'repository',
            data.repoName,
            'success'
          );
          break;

        default:
          throw new Error(`Unknown job: ${name}`);
      }

      return { success: true };
    } catch (error) {
      logger.error(`GitHub worker error for ${name}:`, error);
      
      if (data.chatId) {
        await bot.telegram.sendMessage(
          data.chatId,
          `❌ *فشلت العملية:* ${error.message}`,
          { parse_mode: 'Markdown' }
        );
      }

      await ActivityLogService.createLog(
        data.userId,
        name,
        'repository',
        data.repoName,
        'failed',
        { error: error.message }
      );

      throw error;
    }
  },
  { connection }
);

// File Upload Worker
const uploadWorker = new Worker(
  'file-uploads',
  async (job) => {
    const { data } = job;
    logger.info('Processing upload job:', data);

    try {
      const { userId, repoName, fileId, chatId } = data;

      // Download file from Telegram
      const fileLink = await bot.telegram.getFileLink(fileId);
      const zipPath = path.join(TEMP_DIR, `${repoName}-${Date.now()}.zip`);
      const extractPath = path.join(TEMP_DIR, `${repoName}-${Date.now()}`);

      const response = await axios({
        url: fileLink.href,
        method: 'GET',
        responseType: 'stream',
      });

      await fs.ensureDir(extractPath);
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Extract zip
      const zip = new admZip(zipPath);
      zip.extractAllTo(extractPath, true);

      // Create repository
      const github = new GitHubService();
      const newRepo = await github.createRepository(repoName, true);

      // Get all files
      const files = await getAllFiles(extractPath);
      const fileObjects = await Promise.all(
        files.map(async (file) => {
          const relativePath = path.relative(extractPath, file);
          const content = await fs.readFile(file, { encoding: 'base64' });
          return { path: relativePath, content };
        })
      );

      // Upload files using Git Trees API
      const user = await github.getUser();
      await github.uploadFiles(user.login, repoName, fileObjects);

      // Send success message
      await bot.telegram.sendMessage(
        chatId,
        `✅ *تم إنشاء المستودع ورفع الملفات بنجاح!*\n\n📦 *الاسم:* \`${repoName}\`\n🔗 [فتح المستودع](${newRepo.html_url})`,
        { parse_mode: 'Markdown' }
      );

      // Clean up
      await fs.remove(zipPath);
      await fs.remove(extractPath);

      // Update usage
      await UserService.incrementUsage(userId, 'repoCreated');
      await UserService.incrementUsage(userId, 'fileUploaded');

      // Log activity
      await ActivityLogService.createLog(
        userId,
        'upload_repo',
        'repository',
        repoName,
        'success',
        { filesCount: files.length, repoUrl: newRepo.html_url }
      );

      return { success: true, repoUrl: newRepo.html_url };
    } catch (error) {
      logger.error('Upload worker error:', error);

      if (data.chatId) {
        await bot.telegram.sendMessage(
          data.chatId,
          `❌ *حدث خطأ أثناء الرفع:*\n\`${error.message}\``,
          { parse_mode: 'Markdown' }
        );
      }

      await ActivityLogService.createLog(
        data.userId,
        'upload_repo',
        'repository',
        data.repoName,
        'failed',
        { error: error.message }
      );

      throw error;
    }
  },
  { connection }
);

// Notification Worker
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { data } = job;
    logger.info('Processing notification job:', data);

    try {
      const { chatId, message } = data;
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      return { success: true };
    } catch (error) {
      logger.error('Notification worker error:', error);
      throw error;
    }
  },
  { connection }
);

// Helper function
async function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  
  return arrayOfFiles;
}

// Worker event handlers
githubWorker.on('completed', (job) => {
  logger.info(`GitHub job completed: ${job.id}`);
});

githubWorker.on('failed', (job, err) => {
  logger.error(`GitHub job failed: ${job.id}`, err);
});

uploadWorker.on('completed', (job) => {
  logger.info(`Upload job completed: ${job.id}`);
});

uploadWorker.on('failed', (job, err) => {
  logger.error(`Upload job failed: ${job.id}`, err);
});

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job completed: ${job.id}`);
});

logger.info('✅ Workers started successfully');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await githubWorker.close();
  await uploadWorker.close();
  await notificationWorker.close();
  process.exit(0);
});
