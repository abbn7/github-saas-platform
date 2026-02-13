# 🔌 أمثلة استخدام API

## 🔐 المصادقة (Authentication)

### 1. باستخدام API Key (الأسهل)

احصل على API Key من البوت باستخدام `/apikey`

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://your-app.railway.app/api/v1/repos
```

### 2. باستخدام JWT Token

```bash
# تسجيل الدخول
curl -X POST https://your-app.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "plan": "enterprise"
    }
  }
}

# استخدام Token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.railway.app/api/v1/repos
```

---

## 📦 إدارة المستودعات (Repositories)

### عرض جميع المستودعات

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://your-app.railway.app/api/v1/repos?page=1&perPage=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123456,
      "name": "my-repo",
      "full_name": "username/my-repo",
      "private": true,
      "html_url": "https://github.com/username/my-repo",
      "description": "My awesome repo",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-02-13T00:00:00Z",
      "stargazers_count": 5,
      "language": "JavaScript"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10
  }
}
```

### إنشاء مستودع جديد

```bash
curl -X POST https://your-app.railway.app/api/v1/repos \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-new-repo",
    "isPrivate": true,
    "description": "My awesome new repository"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789012,
    "name": "my-new-repo",
    "full_name": "username/my-new-repo",
    "html_url": "https://github.com/username/my-new-repo",
    "private": true,
    "description": "My awesome new repository"
  }
}
```

### تفاصيل مستودع محدد

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://your-app.railway.app/api/v1/repos/my-repo
```

### تحديث مستودع

```bash
curl -X PATCH https://your-app.railway.app/api/v1/repos/my-repo \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "private": false
  }'
```

### حذف مستودع

```bash
curl -X DELETE https://your-app.railway.app/api/v1/repos/my-repo \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "message": "Repository deleted successfully"
}
```

---

## 👤 إدارة الحساب

### الحصول على معلومات الحساب

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://your-app.railway.app/api/v1/auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "telegram_user",
      "plan": "pro",
      "apiKey": "your-api-key",
      "subscriptionStatus": "active"
    },
    "stats": {
      "plan": "pro",
      "usageStats": {
        "reposCreated": 15,
        "reposDeleted": 2,
        "filesUploaded": 50,
        "apiCalls": 120
      },
      "totalRepos": 13,
      "totalActivities": 67
    }
  }
}
```

### إعادة إنشاء API Key

```bash
curl -X POST https://your-app.railway.app/api/v1/auth/regenerate-key \
  -H "X-API-Key: YOUR_OLD_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": "new-api-key-here"
  }
}
```

---

## 👨‍💼 Admin API (مطلوب صلاحيات Admin)

### عرض جميع المستخدمين

```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "https://your-app.railway.app/api/v1/admin/users?page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "user1",
        "email": "user1@example.com",
        "plan": "free",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 15
  }
}
```

### تفاصيل مستخدم محدد

```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  https://your-app.railway.app/api/v1/admin/users/USER_UUID
```

### تحديث مستخدم

```bash
curl -X PATCH https://your-app.railway.app/api/v1/admin/users/USER_UUID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "isActive": true
  }'
```

### إحصائيات المنصة

```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  https://your-app.railway.app/api/v1/admin/stats/platform
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 500,
      "active": 450,
      "inactive": 50
    },
    "plans": {
      "free": 400,
      "pro": 80,
      "enterprise": 20
    }
  }
}
```

### حالة الطوابير (Queues)

```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  https://your-app.railway.app/api/v1/admin/stats/queues
```

**Response:**
```json
{
  "success": true,
  "data": {
    "github": {
      "waiting": 5,
      "active": 2,
      "completed": 1234,
      "failed": 10,
      "delayed": 0
    },
    "upload": {
      "waiting": 3,
      "active": 1,
      "completed": 890,
      "failed": 5,
      "delayed": 0
    }
  }
}
```

### سجلات النشاط

```bash
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "https://your-app.railway.app/api/v1/admin/logs?page=1&limit=50"
```

---

## 🐍 أمثلة بلغات برمجة مختلفة

### Python

```python
import requests

API_KEY = "your-api-key"
BASE_URL = "https://your-app.railway.app/api/v1"

headers = {
    "X-API-Key": API_KEY
}

# عرض المستودعات
response = requests.get(f"{BASE_URL}/repos", headers=headers)
repos = response.json()
print(repos)

# إنشاء مستودع
data = {
    "name": "python-repo",
    "isPrivate": True,
    "description": "Created from Python"
}
response = requests.post(f"{BASE_URL}/repos", headers=headers, json=data)
print(response.json())
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_KEY = 'your-api-key';
const BASE_URL = 'https://your-app.railway.app/api/v1';

const headers = {
  'X-API-Key': API_KEY
};

// عرض المستودعات
axios.get(`${BASE_URL}/repos`, { headers })
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// إنشاء مستودع
axios.post(`${BASE_URL}/repos`, {
  name: 'js-repo',
  isPrivate: true,
  description: 'Created from JavaScript'
}, { headers })
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

### PHP

```php
<?php

$apiKey = 'your-api-key';
$baseUrl = 'https://your-app.railway.app/api/v1';

$headers = [
    'X-API-Key: ' . $apiKey,
    'Content-Type: application/json'
];

// عرض المستودعات
$ch = curl_init($baseUrl . '/repos');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;

// إنشاء مستودع
$data = json_encode([
    'name' => 'php-repo',
    'isPrivate' => true,
    'description' => 'Created from PHP'
]);

$ch = curl_init($baseUrl . '/repos');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>
```

---

## ⚠️ أخطاء شائعة

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```
**الحل:** تأكد من إرسال API Key أو JWT Token صحيح

### 403 Forbidden
```json
{
  "success": false,
  "message": "Repository limit reached for your plan"
}
```
**الحل:** قم بالترقية لخطة أعلى

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```
**الحل:** انتظر قليلاً قبل إعادة المحاولة

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```
**الحل:** تأكد من صحة اسم المستودع أو المعرف

---

## 📚 المزيد

لمزيد من التفاصيل، راجع:
- [README.md](./README.md) - الوثائق الكاملة
- [DEPLOYMENT.md](./DEPLOYMENT.md) - دليل النشر
- `/api/docs` - توثيق API التفاعلي
