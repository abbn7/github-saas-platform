# 🚀 GitHub SaaS Platform

منصة SaaS متقدمة لإدارة GitHub من خلال Telegram Bot و REST API

## ✨ الميزات الجديدة

### 🏗️ Architecture
- ✅ Clean Architecture مع فصل كامل للطبقات
- ✅ Webhook-based بدلاً من Polling
- ✅ Redis لإدارة الجلسات
- ✅ BullMQ للمعالجة غير المتزامنة
- ✅ PostgreSQL كقاعدة بيانات رئيسية
- ✅ Background Workers

### 💎 نظام الاشتراكات
- **Free Plan**: 5 مستودعات، 10MB حد أقصى للملفات
- **Pro Plan**: 50 مستودع، 100MB حد أقصى للملفات
- **Enterprise Plan**: غير محدود

### 🔌 REST API
- API كامل للتكامل مع تطبيقاتك
- مصادقة عبر JWT أو API Key
- توثيق كامل متاح على `/api/docs`

### 👨‍💼 Admin Dashboard API
- إدارة المستخدمين
- عرض الإحصائيات
- مراقبة الطوابير (Queues)
- سجلات النشاطات

### 🔐 الأمان
- Rate Limiting متقدم
- Validation للملفات
- Sanitization لمنع Path Traversal
- Confirmation قبل الحذف
- JWT Authentication
- API Key Authentication

## 📦 التثبيت السريع على Railway

### 1. إنشاء الخدمات المطلوبة

قم بإنشاء 3 خدمات في Railway:

#### خدمة PostgreSQL
```bash
Railway Dashboard -> New -> Database -> PostgreSQL
```

#### خدمة Redis
```bash
Railway Dashboard -> New -> Database -> Redis
```

#### خدمة التطبيق
```bash
Railway Dashboard -> New -> GitHub Repo -> ربط المشروع
```

### 2. ضبط المتغيرات البيئية

في خدمة التطبيق، أضف المتغيرات التالية:

```env
# Telegram
BOT_TOKEN=your_telegram_bot_token
WEBHOOK_DOMAIN=${{RAILWAY_PUBLIC_DOMAIN}}

# GitHub
GITHUB_TOKEN=your_github_token

# Database (تلقائي من خدمة PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (تلقائي من خدمة Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT
JWT_SECRET=your_super_secret_key_here

# Optional: Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. نشر المشروع

```bash
# 1. ادفع الكود إلى GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main

# 2. Railway سيقوم بالنشر تلقائياً
```

### 4. تشغيل Migration

بعد النشر الأول، قم بتشغيل Migration:

```bash
# في Railway Dashboard -> Service -> Settings -> Custom Start Command
npm run migrate && npm run seed && npm start
```

أو استخدم Railway CLI:
```bash
railway run npm run migrate
railway run npm run seed
```

## 🎯 البدء السريع

### الأوامر المتاحة

```bash
# تشغيل الخادم
npm start

# تشغيل Worker
npm run worker

# Development
npm run dev
npm run dev:worker

# Database
npm run migrate
npm run seed
```

## 📱 استخدام Telegram Bot

### الأوامر الأساسية

- `/start` - البدء
- `/me` - معلومات حسابك
- `/list` - عرض المستودعات
- `/stats` - الإحصائيات
- `/plan` - خطتك الحالية
- `/apikey` - الحصول على API Key

### رفع المشاريع

1. أرسل ملف `.zip`
2. اكتب اسم المستودع
3. انتظر المعالجة في الخلفية
4. سيصلك إشعار عند الانتهاء

## 🔌 استخدام REST API

### المصادقة

#### باستخدام API Key
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://your-app.railway.app/api/v1/repos
```

#### باستخدام JWT
```bash
# 1. تسجيل الدخول
curl -X POST https://your-app.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 2. استخدام Token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.railway.app/api/v1/repos
```

### Endpoints الرئيسية

#### Repositories
- `GET /api/v1/repos` - قائمة المستودعات
- `POST /api/v1/repos` - إنشاء مستودع
- `GET /api/v1/repos/:name` - تفاصيل مستودع
- `PATCH /api/v1/repos/:name` - تحديث مستودع
- `DELETE /api/v1/repos/:name` - حذف مستودع

#### Admin (مطلوب صلاحيات Admin)
- `GET /api/v1/admin/users` - قائمة المستخدمين
- `GET /api/v1/admin/stats/platform` - إحصائيات المنصة
- `GET /api/v1/admin/stats/queues` - حالة الطوابير
- `GET /api/v1/admin/logs` - سجل النشاطات

## 🏗️ هيكل المشروع

```
src/
├── config/          # إعدادات التطبيق
│   ├── index.js
│   ├── database.js
│   └── redis.js
├── database/        # قاعدة البيانات
│   ├── models/      # النماذج (User, Repository, ActivityLog)
│   ├── migrate.js
│   └── seed.js
├── services/        # طبقة الخدمات
│   ├── GitHubService.js
│   ├── UserService.js
│   ├── QueueService.js
│   └── ActivityLogService.js
├── controllers/     # Controllers
│   └── TelegramBot.js
├── middlewares/     # Middlewares
│   ├── auth.js
│   ├── rateLimit.js
│   └── errorHandler.js
├── routes/          # API Routes
│   ├── auth.js
│   ├── repos.js
│   └── admin.js
├── workers/         # Background Workers
├── utils/           # أدوات مساعدة
│   └── logger.js
├── server.js        # الخادم الرئيسي
└── worker.js        # Worker للمعالجة الخلفية
```

## 🔧 التكوين المتقدم

### تشغيل Workers منفصلة

في Railway، يمكنك إضافة خدمة منفصلة للـ Worker:

1. أنشئ خدمة جديدة من نفس Repo
2. في Settings -> Custom Start Command:
```bash
npm run worker
```

### تفعيل Stripe للمدفوعات

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📊 المراقبة

### Logs
```bash
# Railway CLI
railway logs

# أو من Dashboard
Railway Dashboard -> Service -> Logs
```

### Queue Monitoring
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://your-app.railway.app/api/v1/admin/stats/queues
```

## 🛠️ Troubleshooting

### البوت لا يستجيب
```bash
# تأكد من Webhook
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

### Database Connection Failed
```bash
# تأكد من DATABASE_URL في المتغيرات
railway variables
```

### Redis Connection Failed
```bash
# تأكد من REDIS_URL
railway variables
```

## 🔄 التحديث

```bash
git pull origin main
git add .
git commit -m "Update"
git push origin main
# Railway سينشر تلقائياً
```

## 📝 الملاحظات

### الترقيات المستقبلية
- [ ] Stripe Integration كامل
- [ ] Admin Dashboard Frontend
- [ ] Multi-GitHub Accounts
- [ ] Webhooks للإشعارات
- [ ] Analytics Dashboard
- [ ] Teams & Organizations

### الأمان
- يُنصح بتغيير `JWT_SECRET` لقيمة معقدة
- استخدم HTTPS دائماً في الإنتاج
- راجع logs بانتظام
- فعّل 2FA على حساب GitHub

## 🤝 الدعم

للمساعدة أو الإبلاغ عن مشاكل، افتح Issue على GitHub.

## 📄 الترخيص

MIT License - استخدمه بحرية!

---

**ملاحظة مهمة**: هذا المشروع للاستخدام الشخصي. تأكد من مراجعة شروط استخدام GitHub API.
