# 🎓 زاوية 2025 - نظام حجز القاعات المدرسية

## 📋 نظرة عامة

نظام زاوية 2025 هو نظام إدارة حجوزات القاعات المدرسية الذكي، مصمم خصيصاً للمدارس العربية مع دعم التزامن الفوري عبر جميع الأجهزة.

## ✨ المزايا الرئيسية

### 🔥 **نظام Firebase المطور** (جديد)
- ✅ **تزامن فوري**: تحديثات لحظية عبر جميع الأجهزة
- ✅ **حفظ دائم**: البيانات محفوظة إلى الأبد في السحابة
- ✅ **وضع دون اتصال**: يعمل بدون إنترنت
- ✅ **موثوقية عالية**: 99.99% وقت تشغيل
- ✅ **نسخ احتياطية تلقائية**: كل 24 ساعة

### 📡 **النظام التقليدي**
- ✅ سهولة في الإعداد
- ✅ تشغيل محلي
- ✅ Socket.IO للتزامن

## 🚀 التشغيل السريع

### 1. تشغيل النظام التقليدي

```bash
# السيرفر
cd server
npm install
npm start

# الكلاينت (في terminal آخر)
cd client
npm install
npm run dev
```

### 2. تشغيل نظام Firebase

```bash
# إعداد Firebase
cp .env.example .env
# أضف مفاتيح Firebase في .env

# تثبيت التبعيات
cd client && npm install firebase
cd ../server && npm install firebase-admin

# ترحيل البيانات (اختياري)
cd server && npm run migrate

# تشغيل النظام
npm start # في مجلد server
npm run dev # في مجلد client
```

## 🎯 الصفحات الرئيسية

| الصفحة | الوصف | الرابط |
|--------|--------|--------|
| **الصفحة الرئيسية** | لوحة التحكم والإحصائيات | `/` |
| **الحجوزات** | إدارة حجوزات القاعات | `/bookings` |
| **القاعات** | عرض وإدارة القاعات | `/rooms` |
| **حجز الطابور** | إدارة حجوزات ساحة الطابور | `/assembly` |
| **الإحصائيات** | تقارير شاملة | `/statistics` |
| **ضمان البيانات** | توضيح الحفظ الدائم | `/data-permanence` |

## 🏗️ هيكل المشروع

```
zawiyah2025/
├── client/                 # التطبيق الأمامي (Next.js)
│   ├── components/         # المكونات
│   │   ├── layout/         # التخطيط العام
│   │   ├── FirebaseDashboard.tsx
│   │   └── DataPermanenceDemo.tsx
│   ├── hooks/             # Custom Hooks
│   │   └── useFirebase.ts
│   ├── pages/             # الصفحات
│   │   ├── index.tsx      # الصفحة الرئيسية
│   │   ├── bookings.tsx   # صفحة الحجوزات
│   │   └── data-permanence.tsx
│   ├── services/          # الخدمات
│   │   ├── firebase.js    # خدمة Firebase
│   │   └── socket.js      # خدمة Socket.IO
│   └── utils/             # الأدوات المساعدة
│
├── server/                # الخادم (Node.js/Express)
│   ├── services/          # خدمات الخادم
│   │   └── firebaseAdmin.js
│   ├── models/            # نماذج البيانات
│   ├── routes/            # المسارات
│   ├── data/              # البيانات المحلية
│   ├── firebase-migration.js      # أداة الترحيل
│   └── data-integrity-checker.js  # فحص البيانات
│
└── docs/                  # الوثائق
    ├── FIREBASE_SETUP_GUIDE.md
    ├── FIREBASE_IMPLEMENTATION.md
    └── DATA_PERMANENCE_GUARANTEE.md
```

## 🔧 إعدادات التشغيل

### متغيرات البيئة (.env)

```bash
# Firebase (للنظام المطور)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zawiyah2025
FIREBASE_PROJECT_ID=zawiyah2025

# النظام التقليدي
PORT=3001
NODE_ENV=development
```

### النصوص البرمجية

```bash
# في مجلد server
npm start          # تشغيل السيرفر
npm run migrate    # ترحيل البيانات لFirebase
npm run check-data # فحص سلامة البيانات

# في مجلد client  
npm run dev        # تشغيل وضع التطوير
npm run build      # بناء للإنتاج
```

## 📊 البيانات والنماذج

### نموذج الحجز
```javascript
{
  id: "unique-id",
  classroom_id: "القاعة الذكية",
  teacher_name: "أستاذة فاطمة",
  subject: "الرياضيات", 
  date: "2025-10-14",
  time_slot: 1,
  notes: "حصة مراجعة",
  status: "active",
  created_at: "2025-10-14T10:30:00Z"
}
```

### نموذج القاعة
```javascript
{
  id: "classroom-id",
  name_ar: "الصف السادس أ",
  type: "classroom",
  grade: 6,
  section: "أ", 
  capacity: 30,
  isActive: true
}
```

## 🎛️ لوحة التحكم

### التبديل بين الأنظمة
- يمكن التبديل بين النظام التقليدي وFirebase من الصفحة الرئيسية
- الإعدادات محفوظة في `localStorage`
- إعادة تحميل تلقائية عند التبديل

### مؤشرات الحالة
- 🔥 Firebase: أورانج مع حالة الاتصال
- 📡 تقليدي: أزرق مع عدد الاتصالات
- ⚡ مؤشر التحميل في الوقت الفعلي

## 🛡️ الأمان والموثوقية

### Firebase
- تشفير شامل للبيانات
- نسخ احتياطية في مراكز بيانات متعددة
- قواعد أمان Firestore
- مراقبة الأداء

### النظام التقليدي
- نسخ احتياطية محلية
- تشفير Socket.IO
- حماية من CORS
- سجلات مفصلة

## 📱 الاستجابة والأجهزة

- تصميم متجاوب لجميع الأجهزة
- دعم RTL للغة العربية
- تحسين الأداء للهواتف
- واجهة بسيطة وسهلة الاستخدام

## 🔍 اختبار النظام

### اختبار التزامن
```bash
# افتح التطبيق في متصفحين
# قم بإنشاء حجز في الأول
# شاهد ظهوره فوراً في الثاني
```

### اختبار الموثوقية
```bash
cd server
npm run check-data  # فحص شامل للبيانات
```

## 📞 الدعم والمساعدة

### الملفات المرجعية
- `FIREBASE_SETUP_GUIDE.md` - دليل إعداد Firebase
- `DATA_PERMANENCE_GUARANTEE.md` - ضمان حفظ البيانات
- `FIREBASE_IMPLEMENTATION.md` - تفاصيل التطبيق

### الاستكشاف والحلول
1. **مشاكل Firebase**: راجع إعدادات المفاتيح
2. **مشاكل التزامن**: تحقق من الاتصال بالإنترنت
3. **فقدان البيانات**: استخدم أدوات الاستعادة

## 🎉 الإصدار الحالي

**الإصدار**: 2.0.0  
**تاريخ الإصدار**: أكتوبر 2025  
**المزايا الجديدة**: 
- ✅ دعم Firebase الكامل
- ✅ ضمان الحفظ الدائم 
- ✅ واجهة محسنة ومنظفة
- ✅ أداء محسن بشكل كبير

---

**🛡️ بياناتك آمنة إلى الأبد - مضمون 100%!**