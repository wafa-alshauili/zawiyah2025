# 🔑 كيفية الحصول على Service Account Key للسيرفر

## 📋 خطوات الحصول على ملف firebase-service-account.json

### 1. اذهب إلى Firebase Console
```
https://console.firebase.google.com
```

### 2. اختر مشروع zawiyah2025-e5c17

### 3. اذهب إلى Project Settings
- انقر على أيقونة الترس ⚙️
- اختر "Project settings"

### 4. اذهب إلى تبويب Service accounts
- انقر على تبويب **"Service accounts"** في الأعلى
- ستجده بجانب "General" و "Usage and billing"

### 5. اختر Node.js
- ستجد قسم "Firebase Admin SDK"
- تأكد أن "Node.js" مختار

### 6. إنشاء Private Key
- انقر على **"Generate new private key"**
- ستظهر نافذة تأكيد
- انقر **"Generate key"**

### 7. حفظ الملف
- سيتم تحميل ملف JSON تلقائياً
- **اسم الملف مهم**: غير اسمه إلى `firebase-service-account.json`
- ضعه في مجلد `server/` في مشروعك

## 📁 مكان الملف الصحيح
```
zawiyah2025/
├── server/
│   ├── firebase-service-account.json  ← هنا!
│   ├── .env
│   ├── index.js
│   └── ...
├── client/
└── ...
```

## ⚠️ تحذيرات مهمة

### 🔒 للأمان:
- **لا تشارك هذا الملف** مع أحد
- **لا ترفعه على GitHub** 
- أضف `firebase-service-account.json` إلى `.gitignore`

### 📝 محتوى الملف يجب أن يكون مثل:
```json
{
  "type": "service_account",
  "project_id": "zawiyah2025-e5c17",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@zawiyah2025-e5c17.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

## ✅ كيف تتأكد أن كل شيء صحيح

بعد حفظ الملف في `server/firebase-service-account.json`:

```bash
# تأكد أن الملف موجود
ls server/firebase-service-account.json

# شغل السيرفر
cd server
npm start
```

إذا كان كل شيء صحيح، ستشاهد:
```
🔥 Firebase Admin SDK initialized successfully
🚀 خادم زاوية 2025 يعمل على المنفذ 3002
```

## 🆘 إذا واجهت مشاكل

### خطأ: "Service account key not found"
- تأكد أن اسم الملف صحيح: `firebase-service-account.json`
- تأكد أن الملف في مجلد `server/`

### خطأ: "Invalid service account"
- تأكد أن الملف تم تحميله كاملاً (لم ينقطع التحميل)
- جرب إنشاء service account جديد

### خطأ: "Permission denied"
- تأكد أن Service Account له الصلاحيات الكافية
- في Firebase Console > IAM، تأكد أن له دور "Firebase Admin SDK Administrator Service Agent"