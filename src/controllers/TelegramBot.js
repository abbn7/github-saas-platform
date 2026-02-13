const { Telegraf, Markup } = require('telegraf');
const config = require('../config');
const UserService = require('../services/UserService');
const GitHubService = require('../services/GitHubService');
const QueueService = require('../services/QueueService');
const ActivityLogService = require('../services/ActivityLogService');
const logger = require('../utils/logger');

const bot = new Telegraf(config.telegram.botToken);

// Middleware to get or create user
bot.use(async (ctx, next) => {
  if (ctx.from) {
    try {
      ctx.user = await UserService.findOrCreateByTelegram(
        ctx.from.id.toString(),
        ctx.from.username || ctx.from.first_name
      );
    } catch (error) {
      logger.error('Bot middleware error:', error);
    }
  }
  return next();
});

// Start command
bot.start((ctx) => {
  const welcomeMsg = `
✨ *أهلاً بك في GitHub SaaS Platform* ✨

منصة متقدمة لإدارة حساب GitHub بالكامل من Telegram!

📌 *الأوامر المتاحة:*
• /list 📂 - عرض آخر 10 مستودعات
• /stats 📊 - إحصائيات حسابك
• /me 👤 - معلومات حسابك
• /plan 💎 - عرض خطتك الحالية
• /apikey 🔑 - الحصول على API Key

🚀 *رفع المشاريع:*
أرسل ملف \`.zip\` وسأقوم برفعه إلى GitHub!

💡 *جديد:* يمكنك الآن استخدام REST API للتكامل مع تطبيقاتك!
  `;
  ctx.replyWithMarkdown(welcomeMsg);
});

// Me command
bot.command('me', async (ctx) => {
  try {
    const github = new GitHubService();
    const { data: user } = await github.octokit.users.getAuthenticated();
    
    const msg = `
👤 *معلومات الحساب*
━━━━━━━━━━━━━━
🔹 *الاسم:* ${user.login}
🔹 *البريد:* ${user.email || 'غير متوفر'}
🔹 *الخطة:* ${ctx.user.plan.toUpperCase()}
🔹 *المستودعات:* ${user.public_repos}
🔹 *المتابعون:* ${user.followers}
🔹 *الرابط:* [GitHub Profile](${user.html_url})
    `;
    ctx.replyWithMarkdown(msg);
  } catch (error) {
    logger.error('Me command error:', error);
    ctx.reply('❌ حدث خطأ أثناء جلب بيانات الحساب');
  }
});

// Plan command
bot.command('plan', async (ctx) => {
  const planInfo = config.plans[ctx.user.plan];
  const usage = ctx.user.usageStats;
  
  const msg = `
💎 *خطتك الحالية: ${planInfo.name}*
━━━━━━━━━━━━━━

📊 *الاستخدام:*
• المستودعات: ${usage.reposCreated}/${planInfo.maxRepos === -1 ? '∞' : planInfo.maxRepos}
• رفع الملفات: ${usage.filesUploaded}
• API Calls: ${usage.apiCalls}/${planInfo.maxApiCalls === -1 ? '∞' : planInfo.maxApiCalls}

✨ *المميزات:*
${planInfo.features.map(f => `• ${f.replace(/_/g, ' ')}`).join('\n')}

${ctx.user.plan === 'free' ? '\n🚀 *ترقية للخطة Pro للحصول على مزايا أكثر!*' : ''}
  `;
  
  ctx.replyWithMarkdown(msg);
});

// API Key command
bot.command('apikey', async (ctx) => {
  const msg = `
🔑 *مفتاح API الخاص بك:*
\`${ctx.user.apiKey}\`

⚠️ *هام:* لا تشارك هذا المفتاح مع أحد!

📝 *الاستخدام:*
\`\`\`
curl -H "X-API-Key: ${ctx.user.apiKey}" \\
  ${config.appUrl}/api/v1/repos
\`\`\`

📚 *التوثيق الكامل:* ${config.appUrl}/api/docs
  `;
  
  ctx.replyWithMarkdown(msg);
});

// List command
bot.command('list', async (ctx) => {
  try {
    const github = new GitHubService();
    const repos = await github.listRepositories(1, 10);

    if (repos.length === 0) {
      return ctx.reply('📂 لا توجد مستودعات في حسابك حالياً');
    }

    for (const repo of repos) {
      const status = repo.private ? '🔒 خاص' : '🌍 عام';
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🗑️ حذف', `delete_${repo.name}`),
          Markup.button.callback(
            repo.private ? '🔓 عام' : '🔒 خاص',
            `toggle_${repo.name}`
          ),
        ],
        [Markup.button.callback('📥 تحميل ZIP', `download_${repo.name}`)],
      ]);

      const repoMsg = `
📦 *المستودع:* \`${repo.name}\`
━━━━━━━━━━━━━━
🔹 *الحالة:* ${status}
🔹 *النجوم:* ⭐ ${repo.stargazers_count}
🔹 *الرابط:* [فتح](${repo.html_url})
      `;

      await ctx.replyWithMarkdown(repoMsg, keyboard);
    }
  } catch (error) {
    logger.error('List command error:', error);
    ctx.reply('❌ حدث خطأ أثناء جلب المستودعات');
  }
});

// Stats command
bot.command('stats', async (ctx) => {
  try {
    const github = new GitHubService();
    const stats = await github.getStats();
    
    const topLanguages = Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => `• ${lang}: ${count}`)
      .join('\n');

    const msg = `
📊 *إحصائيات GitHub*
━━━━━━━━━━━━━━
🔹 *المستودعات:* ${stats.totalRepos}
🔹 *العامة:* ${stats.publicRepos}
🔹 *الخاصة:* ${stats.privateRepos}
🔹 *النجوم:* ⭐ ${stats.totalStars}
🔹 *المتابعون:* ${stats.followers}

💻 *أكثر اللغات استخداماً:*
${topLanguages || 'لا توجد بيانات'}
    `;
    
    ctx.replyWithMarkdown(msg);
  } catch (error) {
    logger.error('Stats command error:', error);
    ctx.reply('❌ حدث خطأ أثناء جلب الإحصائيات');
  }
});

// Delete repository action
bot.action(/delete_(.+)/, async (ctx) => {
  const repoName = ctx.match[1];
  
  try {
    await ctx.answerCbQuery('⏳ جاري الحذف...');
    
    // Add to queue for background processing
    await QueueService.addGitHubJob('delete-repo', {
      userId: ctx.user.id,
      repoName,
      chatId: ctx.chat.id,
    });
    
    await ctx.editMessageText(
      `⏳ *تم إضافة طلب حذف المستودع إلى قائمة الانتظار*\n\nسيتم إشعارك عند اكتمال العملية.`,
      { parse_mode: 'Markdown' }
    );
    
    await ActivityLogService.createLog(
      ctx.user.id,
      'delete_repo_requested',
      'repository',
      repoName,
      'pending'
    );
  } catch (error) {
    logger.error('Delete action error:', error);
    await ctx.answerCbQuery('❌ فشل الحذف');
  }
});

// Toggle privacy action
bot.action(/toggle_(.+)/, async (ctx) => {
  const repoName = ctx.match[1];
  
  try {
    await ctx.answerCbQuery('⏳ جاري التحديث...');
    
    const github = new GitHubService();
    const user = await github.getUser();
    const repo = await github.getRepository(user.login, repoName);
    const newStatus = !repo.private;
    
    await github.updateRepository(user.login, repoName, {
      private: newStatus,
    });
    
    await ctx.editMessageText(
      `✅ *تم تغيير خصوصية* \`${repoName}\`\n*الحالة الجديدة:* ${newStatus ? '🔒 خاص' : '🌍 عام'}`,
      { parse_mode: 'Markdown' }
    );
    
    await ActivityLogService.createLog(
      ctx.user.id,
      'toggle_repo_privacy',
      'repository',
      repoName,
      'success'
    );
  } catch (error) {
    logger.error('Toggle action error:', error);
    await ctx.answerCbQuery('❌ فشل التحديث');
  }
});

// Download repository action
bot.action(/download_(.+)/, async (ctx) => {
  const repoName = ctx.match[1];
  
  try {
    await ctx.answerCbQuery('⏳ جاري التحضير...');
    
    await QueueService.addGitHubJob('download-repo', {
      userId: ctx.user.id,
      repoName,
      chatId: ctx.chat.id,
    });
    
    await ctx.reply('⏳ جاري تحضير الملف... سيتم إرساله قريباً');
  } catch (error) {
    logger.error('Download action error:', error);
    await ctx.answerCbQuery('❌ فشل التحميل');
  }
});

// Handle document uploads
bot.on('document', async (ctx) => {
  const doc = ctx.message.document;
  
  if (!doc.file_name.endsWith('.zip')) {
    return ctx.reply('⚠️ يرجى إرسال ملف بصيغة `.zip` فقط');
  }

  // Check file size
  const planLimits = config.plans[ctx.user.plan];
  if (doc.file_size > planLimits.maxFileSize) {
    return ctx.reply(
      `⚠️ حجم الملف كبير جداً!\n\n*الحد الأقصى لخطتك:* ${(planLimits.maxFileSize / 1024 / 1024).toFixed(0)}MB\n*حجم الملف:* ${(doc.file_size / 1024 / 1024).toFixed(2)}MB`
    );
  }

  // Check if user can create more repos
  if (!ctx.user.canPerformAction('createRepo')) {
    return ctx.reply(
      `⚠️ لقد وصلت إلى الحد الأقصى للمستودعات في خطتك!\n\n🚀 قم بالترقية للحصول على المزيد.`
    );
  }

  ctx.session = ctx.session || {};
  ctx.session.pendingZip = {
    fileId: doc.file_id,
    fileName: doc.file_name,
    fileSize: doc.file_size,
  };
  
  ctx.replyWithMarkdown('📝 *ما هو اسم المستودع الجديد؟*');
});

// Handle text messages (repo name after uploading zip)
bot.on('text', async (ctx) => {
  if (!ctx.session || !ctx.session.pendingZip) return;

  const repoName = ctx.message.text.trim().replace(/\s+/g, '-');
  const { fileId, fileName, fileSize } = ctx.session.pendingZip;
  delete ctx.session.pendingZip;

  try {
    // Add to upload queue
    const job = await QueueService.addUploadJob({
      userId: ctx.user.id,
      repoName,
      fileId,
      fileName,
      fileSize,
      chatId: ctx.chat.id,
    });

    await ctx.replyWithMarkdown(
      `✅ *تم إضافة المشروع إلى قائمة الانتظار*\n\n📦 *الاسم:* \`${repoName}\`\n⏳ سيتم معالجته قريباً...`
    );

    await ActivityLogService.createLog(
      ctx.user.id,
      'upload_requested',
      'repository',
      repoName,
      'pending',
      { jobId: job.id }
    );
  } catch (error) {
    logger.error('Upload text handler error:', error);
    ctx.reply('❌ حدث خطأ أثناء إضافة المشروع');
  }
});

module.exports = bot;
