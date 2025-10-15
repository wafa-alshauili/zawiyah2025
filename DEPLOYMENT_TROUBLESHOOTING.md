# 🚨 حل مشاكل النشر - Deployment Troubleshooting

## 📋 مشاكل النشر الشائعة وحلولها

### ❗ إذا كان هناك خطأ في النشر، اتبع هذه الخطوات:

---

## 🔧 الإصلاحات الفورية

### 1. إصلاح مشكلة Repository URL:
تم إصلاح URL في `package.json` من:
```
❌ https://github.com/zawiyah2025/classroom-booking.git
```
إلى:
```
✅ https://github.com/wafa-alshauili/zawiyah2025.git
```

### 2. التأكد من ملفات البيئة:
```bash
# تأكد من وجود هذه الملفات:
client/.env.local        # ✅ موجود
client/.env.example      # ✅ موجود
server/.env             # ✅ موجود
```

### 3. حل مشكلة Firebase Keys:
```bash
# في النشر، تأكد من إضافة متغيرات البيئة:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAGZPhBsOGIkMUfw1CjbohrUIj9KoSlCbY
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zawiyah2025-e5c17
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zawiyah2025-e5c17.firebaseapp.com
# ... باقي المتغيرات
```

---

## 🚀 حلول حسب منصة النشر

### Vercel (للواجهة الأمامية):
```bash
# 1. تأكد من وجود vercel.json في مجلد client
cd client
# 2. نشر الكلاينت
vercel --prod
```

**متغيرات البيئة المطلوبة في Vercel:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_SERVER_URL
```

### Railway (للسيرفر):
```bash
# 1. تأكد من وجود railway.toml
# 2. نشر السيرفر
railway deploy
```

**متغيرات البيئة المطلوبة في Railway:**
```
PORT=3001
NODE_ENV=production
FIREBASE_PROJECT_ID=zawiyah2025-e5c17
```

### Render (للمشروع كامل):
```bash
# 1. تأكد من وجود render.yaml
# 2. يتم النشر تلقائياً من GitHub
```

---

## 🔍 تشخيص المشاكل

### مشكلة 1: "Build Failed"
**الأسباب المحتملة:**
- متغيرات البيئة مفقودة
- Dependencies غير مثبتة
- أخطاء TypeScript

**الحل:**
```bash
# محلياً، تأكد من عمل Build
cd client
npm run build

# إذا فشل، أصلح الأخطاء أولاً
```

### مشكلة 2: "Firebase Errors in Production"
**الأسباب:**
- مفاتيح Firebase مفقودة
- قواعد Firestore مقيدة
- Service Account غير موجود

**الحل:**
```bash
# 1. تأكد من إضافة جميع مفاتيح Firebase
# 2. راجع قواعد Firestore:
# allow read, write: if true; // للتطوير
```

### مشكلة 3: "Server Won't Start"
**الأسباب:**
- PORT غير محدد
- Dependencies مفقودة
- ملفات البيانات غير موجودة

**الحل:**
```bash
# في server/package.json تأكد من:
"scripts": {
  "start": "node index.js"
}
```

### مشكلة 4: "CORS Errors"
**الحل:**
```javascript
// في server/index.js تأكد من:
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
```

---

## 🛠️ خطوات الإصلاح العامة

### 1. تنظيف المشروع:
```bash
# حذف node_modules وإعادة التثبيت
npm run clean
npm run install:all
```

### 2. اختبار محلي:
```bash
# تأكد من عمل النظام محلياً
npm run build  # للكلاينت
npm start      # للسيرفر
```

### 3. رفع الإصلاحات:
```bash
git add .
git commit -m "🔧 إصلاح مشاكل النشر"
git push origin master
```

### 4. إعادة النشر:
```bash
# حسب المنصة المستخدمة
npm run deploy:vercel   # للواجهة
npm run deploy:railway  # للسيرفر
npm run deploy:render   # للمشروع كامل
```

---

## 📊 ملفات النشر الموجودة

### ✅ ملفات النشر المتوفرة:
- `vercel.json` (client/) - لنشر الواجهة على Vercel
- `railway.toml` - لنشر السيرفر على Railway  
- `render.yaml` - لنشر المشروع كامل على Render
- `nixpacks.toml` - إعدادات البناء
- `Procfile` - لـ Heroku وبعض المنصات

### 🔧 إعدادات مهمة:
- **Node.js version**: >= 18.0.0
- **NPM version**: >= 8.0.0
- **Build command**: `npm run build`
- **Start command**: `npm start`

---

## 🆘 إذا استمرت المشكلة

### خطوات التشخيص المتقدم:

1. **تحقق من Logs:**
```bash
# في منصة النشر، راجع:
# - Build logs
# - Runtime logs  
# - Error logs
```

2. **اختبر في بيئة مماثلة:**
```bash
# تشغيل في production mode محلياً:
NODE_ENV=production npm start
```

3. **تحقق من Network:**
```bash
# تأكد من أن API endpoints صحيحة
# راجع CORS settings
# تحقق من Firewall rules
```

---

## 📞 الدعم السريع

### لكل منصة نشر:

**Vercel:**
- Dashboard: https://vercel.com/dashboard
- راجع "Functions" tab للسيرفر
- تحقق من "Environment Variables"

**Railway:**  
- Dashboard: https://railway.app/dashboard
- راجع "Deployments" tab
- تحقق من "Variables" tab

**Render:**
- Dashboard: https://dashboard.render.com  
- راجع "Logs" tab
- تحقق من "Environment" tab

---

## ✅ بعد حل المشكلة

### تأكد من:
- ✅ الموقع يفتح بدون أخطاء
- ✅ Firebase يعمل (إذا تم إعداده)
- ✅ Socket.IO متصل
- ✅ إنشاء الحجوزات يعمل
- ✅ التزامن يعمل بين الأجهزة

**🚀 بعد الإصلاح، المشروع سيعمل بسلاسة على الإنترنت!**