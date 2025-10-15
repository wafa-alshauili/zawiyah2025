# إعداد Firebase لنظام زاوية 2025

هذا الدليل يوضح كيفية إعداد Firebase لنظام حجز القاعات المدرسية مع التزامن الفوري عبر جميع الأجهزة.

## 🌟 المزايا الجديدة مع Firebase

- **تزامن فوري**: تحديثات الحجوزات تظهر فوراً على جميع الأجهزة
- **موثوقية عالية**: نسخ احتياطية تلقائية وحماية من فقدان البيانات
- **أداء سريع**: تخزين سحابي سريع مع تخزين محلي للوضع دون اتصال
- **قابلية التوسع**: يدعم آلاف المستخدمين المتزامنين
- **أمان متقدم**: قواعد أمان على مستوى قاعدة البيانات

## 🚀 خطوات الإعداد

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "إنشاء مشروع" (Create a project)
3. أدخل اسم المشروع: `zawiyah2025`
4. فعّل Google Analytics (اختياري)
5. انقر على "إنشاء المشروع"

### 2. إعداد Firestore Database

1. في Firebase Console، اذهب إلى **Firestore Database**
2. انقر على "إنشاء قاعدة بيانات" (Create database)
3. اختر "Start in test mode" للبداية
4. اختر الموقع الأقرب (مثل `europe-west3` للشرق الأوسط)

### 3. الحصول على مفاتيح التكوين

#### للواجهة الأمامية (Frontend):
1. اذهب إلى **Project Settings** > **General**
   - انقر على أيقونة الترس ⚙️ في الشريط الجانبي الأيسر
   - اختر "Project settings"
   
2. في قسم "Your apps"، انقر على "إضافة تطبيق" > "Web"
   - ستجد قسم "Your apps" في منتصف الصفحة
   - انقر على أيقونة الويب `</>`
   
3. أدخل اسم التطبيق: `zawiyah2025-client`
   - لا تختر "Firebase Hosting" الآن
   - انقر "Register app"
   
4. **انسخ كود التكوين من الصندوق الظاهر:**
   ```javascript
   // ستظهر شاشة مثل هذه - انسخ القيم منها:
   const firebaseConfig = {
     apiKey: "AIzaSyD...",                    // انسخ هذا
     authDomain: "zawiyah2025.firebaseapp.com",
     projectId: "zawiyah2025",               // انسخ هذا
     storageBucket: "zawiyah2025.appspot.com",
     messagingSenderId: "123456789",         // انسخ هذا
     appId: "1:123456789:web:abc123def456"   // انسخ هذا
   };
   ```
   
5. **إذا لم تجد الكود، يمكنك الوصول إليه لاحقاً:**
   - اذهب إلى Project Settings > General
   - ابحث عن تطبيقك في قسم "Your apps"
   - انقر على أيقونة "Config" أو `</>`

#### للخادم (Backend):
1. اذهب إلى **Project Settings** > **Service accounts**
2. انقر على "Generate new private key"
3. احفظ الملف كـ `firebase-admin-key.json` في مجلد `/server`

### 4. تكوين متغيرات البيئة

إنشاء ملف `.env` في الجذر الرئيسي:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zawiyah2025.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zawiyah2025
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zawiyah2025.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Backend Firebase Admin
FIREBASE_PROJECT_ID=zawiyah2025

# Server
PORT=3001
NODE_ENV=development
```

### 5. إعداد قواعد الأمان في Firestore

في Firebase Console > Firestore > Rules، استبدل القواعد بالتالي:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قواعد الحجوزات
    match /bookings/{bookingId} {
      allow read, write: if true; // مفتوح للجميع في البداية
    }
    
    // قواعد القاعات
    match /classrooms/{classroomId} {
      allow read: if true;
      allow write: if true; // يمكن تقييده لاحقاً
    }
    
    // قواعد الفترات الزمنية
    match /timeslots/{timeslotId} {
      allow read: if true;
      allow write: if true; // يمكن تقييده لاحقاً
    }
  }
}
```

## 📦 تشغيل النظام

### 1. تثبيت التبعيات

```bash
# في مجلد الكلاينت
cd client
npm install

# في مجلد السيرفر
cd server
npm install
```

### 2. ترحيل البيانات الموجودة

```bash
cd server
node firebase-migration.js
```

### 3. تشغيل التطبيق

```bash
# تشغيل السيرفر
cd server
npm start

# تشغيل الكلاينت (في terminal آخر)
cd client
npm run dev
```

## 🔧 الاستخدام

### في المكونات React:

```javascript
import firebaseService from '../services/firebase';
import { useEffect, useState } from 'react';

function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // الاستماع للتحديثات الفورية
    const unsubscribe = firebaseService.subscribeToBookings(setBookings);
    
    // تنظيف المستمع عند إزالة المكون
    return () => unsubscribe();
  }, []);

  const createBooking = async (bookingData) => {
    try {
      await firebaseService.createBooking(bookingData);
      // التحديث سيحدث تلقائياً عبر المستمع
    } catch (error) {
      console.error('خطأ في إنشاء الحجز:', error);
    }
  };

  return (
    <div>
      {bookings.map(booking => (
        <div key={booking.id}>{booking.teacher_name}</div>
      ))}
    </div>
  );
}
```

### في السيرفر:

```javascript
const firebaseAdminService = require('./services/firebaseAdmin');

// إنشاء حجز جديد
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await firebaseAdminService.createBooking(req.body);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 هيكل البيانات في Firestore

### Collection: bookings
```javascript
{
  classroom_id: "classroom_doc_id",
  teacher_name: "اسم المعلم",
  subject: "اسم المادة",
  date: Timestamp,
  time_slot: 1-10,
  notes: "ملاحظات",
  status: "active|cancelled|completed",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Collection: classrooms
```javascript
{
  name_ar: "الصف السادس أ",
  name_en: "Grade 6 A",
  type: "classroom|smart|assembly|lab",
  grade: 6,
  section: "أ",
  capacity: 30,
  equipment: ["projector", "smartboard"],
  isActive: true
}
```

### Collection: timeslots
```javascript
{
  slot_number: 1,
  name_ar: "الحصة الأولى",
  name_en: "Period 1",
  start_time: "07:30",
  end_time: "08:15",
  type: "academic|assembly|activity",
  order: 1,
  is_bookable: true
}
```

## 🔍 استكشاف الأخطاء

### خطأ في الاتصال:
- تأكد من صحة مفاتيح التكوين
- تحقق من أن Firestore مفعل في المشروع
- تأكد من وجود ملف `firebase-admin-key.json`

### خطأ في الأذونات:
- راجع قواعد Firestore Security Rules
- تأكد من أن القواعد تسمح بالقراءة والكتابة

### مشاكل في التزامن:
- تحقق من أن المستمعين يعملون بشكل صحيح
- راجع console للأخطاء في JavaScript

## 🚀 النشر للإنتاج

1. **تحديث قواعد الأمان** لتقييد الوصول
2. **إضافة متغيرات البيئة** في منصة النشر
3. **تفعيل Backup** التلقائي في Firebase
4. **مراقبة الأداء** عبر Firebase Performance Monitoring

## 📞 الدعم

للمساعدة أو الاستفسارات، يرجى مراجعة:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- ملفات المشروع في `/client/services/firebase.js` و `/server/services/firebaseAdmin.js`