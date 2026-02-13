# 🚀 دليل النشر السريع على Railway

## الخطوات البسيطة للنشر

### 1️⃣ إعداد Railway

1. اذهب إلى [Railway.app](https://railway.app)
2. سجل دخول بحساب GitHub
3. أنشئ Project جديد

### 2️⃣ إضافة الخدمات

#### أ) PostgreSQL
```
New Service -> Database -> PostgreSQL
```
✅ سيُنشأ تلقائياً وسيُضاف `DATABASE_URL`

#### ب) Redis
```
New Service -> Database -> Redis
```
✅ سيُنشأ تلقائياً وسيُضاف `REDIS_URL`

#### ج) التطبيق
```
New Service -> GitHub Repo
```
اختر repository الخاص بك

### 3️⃣ ضبط المتغيرات

في خدمة التطبيق، اذهب إلى Variables وأضف:

```env
BOT_TOKEN=6123456789:AAH...
GITHUB_TOKEN=ghp_...
WEBHOOK_DOMAIN=${{RAILWAY_PUBLIC_DOMAIN}}
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

**ملاحظة**: `DATABASE_URL` و `REDIS_URL` سيُضافان تلقائياً عند ربط الخدمات

### 4️⃣ دفع الكود

```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

✅ Railway سينشر تلقائياً!

### 5️⃣ تشغيل Migration (مرة واحدة فقط)

بعد أول نشر ناجح:

**الطريقة 1: من Railway Dashboard**
```
Service -> Settings -> Custom Start Command
```
غيّر إلى:
```
npm run migrate && npm run seed && npm start
```

**الطريقة 2: من Railway CLI**
```bash
railway run npm run migrate
railway run npm run seed
```

بعدها ارجع Custom Start Command إلى:
```
npm start
```

### 6️⃣ اختبار البوت

1. افتح Telegram
2. ابحث عن بوتك
3. اضغط `/start`
4. يجب أن يرد البوت فوراً

---

## ⚡ النشر بأوامر واحدة (للمطورين)

إذا كنت تستخدم Railway CLI:

```bash
# تثبيت Railway CLI
npm i -g @railway/cli

# تسجيل الدخول
railway login

# ربط المشروع
railway link

# رفع المتغيرات
railway variables set BOT_TOKEN=your_token
railway variables set GITHUB_TOKEN=your_token
railway variables set JWT_SECRET=your_secret

# نشر
railway up
```

---

## 🎯 التحديثات المستقبلية

فقط ادفع الكود الجديد:

```bash
git add .
git commit -m "Update features"
git push origin main
```

Railway سيعيد النشر تلقائياً!

---

## 🆘 حل المشاكل الشائعة

### البوت لا يستجيب
```bash
# تحقق من Webhook
curl https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo
```

يجب أن يظهر:
```json
{
  "url": "https://your-app.railway.app/webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0
}
```

### Database Connection Error
- تأكد من إضافة PostgreSQL Service
- تأكد من وجود `DATABASE_URL` في Variables
- انتظر دقيقة بعد إضافة Database

### Redis Connection Error
- تأكد من إضافة Redis Service
- تأكد من وجود `REDIS_URL` في Variables

### Migration لم يتم تشغيلها
```bash
railway run npm run migrate
railway run npm run seed
```

---

## ✅ قائمة التحقق

- [ ] PostgreSQL Service مُضاف
- [ ] Redis Service مُضاف
- [ ] BOT_TOKEN مُضاف
- [ ] GITHUB_TOKEN مُضاف
- [ ] JWT_SECRET مُضاف
- [ ] الكود مدفوع إلى GitHub
- [ ] Migration تم تشغيلها
- [ ] البوت يرد على `/start`

---

**🎉 مبروك! بوتك الآن يعمل في Production!**
