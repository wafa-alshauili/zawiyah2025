# 🔍 دليل مفصل: أين تجد كود التكوين في Firebase

## 📍 الطريقة الأولى: من Project Settings

### 1. افتح Firebase Console
```
https://console.firebase.google.com
```

### 2. اختر مشروعك
- انقر على مشروع `zawiyah2025` (أو اللي أنشأته)

### 3. اذهب إلى إعدادات المشروع
- **انقر على أيقونة الترس ⚙️** في الشريط الجانبي الأيسر (بجانب "Project Overview")
- اختر **"Project settings"**

### 4. ابحث عن قسم Your apps
- اسكرول للأسفل حتى تجد قسم **"Your apps"**
- إذا لم يكن عندك تطبيق، انقر **"Add app"** > أيقونة الويب `</>`

### 5. اختر تطبيقك أو أنشئ واحد جديد
- إذا كان عندك تطبيق، انقر على **أيقونة الكود `</>`** بجانبه
- إذا لم يكن عندك، أدخل اسم التطبيق: `zawiyah2025-web`

### 6. انسخ الكود
سيظهر لك كود مثل هذا:
```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "zawiyah2025.firebaseapp.com",
  projectId: "zawiyah2025",
  storageBucket: "zawiyah2025.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

## 📍 الطريقة الثانية: من قائمة التطبيقات

### 1. في الصفحة الرئيسية للمشروع
- ستجد في الوسط كروت التطبيقات
- انقر على **"Web app"** أو أيقونة `</>`

### 2. انقر على Settings/Config
- ستجد أيقونة إعدادات أو "Config"
- انقر عليها لعرض الكود

## 📋 كيف تستخدم الكود في مشروعك

### 1. انسخ القيم وضعها في `.env.local`:
```bash
# في ملف client/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zawiyah2025.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zawiyah2025
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zawiyah2025.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

### 2. تأكد من إعادة تشغيل التطبيق
```bash
# أوقف السيرفر والكلاينت (Ctrl+C)
# ثم شغلهم من جديد
cd server && npm start
cd client && npm run dev
```

## 🚨 ملاحظات مهمة

### ⚠️ لا تنس:
1. **إنشاء Firestore Database** أولاً (خطوة مهمة!)
2. **اختيار "test mode"** للبداية
3. **حفظ المفاتيح بأمان** - لا تشاركها علناً

### 🔒 للأمان:
- لا تضع المفاتيح في ملفات `.js` عادية
- استخدم فقط ملفات `.env` 
- أضف `.env.local` إلى `.gitignore`

## 🆘 إذا لم تجد الكود

### جرب هذه الخطوات:
1. **أعد تحميل الصفحة** - أحياناً تحتاج refresh
2. **أنشئ تطبيق جديد** - انقر "Add app" مرة أخرى
3. **تأكد من إنشاء المشروع بنجاح** - راجع اسم المشروع
4. **اتصل بالإنترنت** - تأكد من الاتصال قوي

## ✅ كيف تعرف أن الكود صحيح

بعد إضافة المفاتيح، شغل التطبيق:
```bash
cd client && npm run dev
```

افتح `http://localhost:3001` وابحث عن:
- 🔥 أيقونة Firebase برتقالية في الصفحة الرئيسية
- لوحة تحكم Firebase تظهر حالة الاتصال
- إذا ظهرت "Firebase متصل" - مبروك! ✅

## 📞 تحتاج مساعدة؟

إذا ما زلت تواجه مشاكل:
1. تأكد من أن المشروع تم إنشاؤه بنجاح
2. راجع أن Firestore Database تم إنشاؤه
3. تحقق من إملاء المفاتيح (لا توجد مسافات زائدة)
4. جرب إنشاء مشروع جديد بالكامل