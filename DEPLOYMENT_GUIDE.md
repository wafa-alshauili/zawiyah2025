# دليل النشر على الإنترنت - زاوية 2025

## خطوات النشر الكاملة 🚀

### المرحلة الأولى: إعداد GitHub Repository

1. **إنشاء مستودع GitHub جديد:**
   ```bash
   # في مجلد المشروع الرئيسي
   git init
   git add .
   git commit -m "Initial commit: Zawiyah2025 School Reservation System"
   
   # إنشاء مستودع على github.com باسم "zawiyah2025"
   git remote add origin https://github.com/[your-username]/zawiyah2025.git
   git push -u origin main
   ```

### المرحلة الثانية: نشر الخادم على Railway 🚂

1. **الذهاب إلى [Railway.app](https://railway.app)**
2. **تسجيل الدخول بحساب GitHub**
3. **إنشاء مشروع جديد:**
   - اختر "Deploy from GitHub repo"
   - اختر مستودع `zawiyah2025`
   - اختر مجلد `server` كـ Root Directory

4. **تعيين متغيرات البيئة:**
   ```
   PORT=3001
   NODE_ENV=production
   CLIENT_URL=https://zawiyah2025.vercel.app
   CORS_ORIGIN=https://zawiyah2025.vercel.app
   ```

5. **الحصول على رابط الخادم:**
   - سيكون شكل الرابط: `https://zawiyah-server-production.up.railway.app`

### المرحلة الثالثة: نشر العميل على Vercel 🔥

1. **الذهاب إلى [Vercel.com](https://vercel.com)**
2. **تسجيل الدخول بحساب GitHub**
3. **إنشاء مشروع جديد:**
   - اختر "Import Git Repository"
   - اختر مستودع `zawiyah2025`
   - اختر مجلد `client` كـ Root Directory
   - Framework Preset: Next.js

4. **تعيين متغيرات البيئة:**
   ```
   NEXT_PUBLIC_SERVER_URL=https://zawiyah-server-production.up.railway.app
   ```

5. **تخصيص النطاق (اختياري):**
   - في إعدادات المشروع > Domains
   - يمكن استخدام: `zawiyah2025.vercel.app`

### المرحلة الرابعة: التحقق من النشر ✅

1. **اختبار الاتصال:**
   - زيارة رابط العميل: `https://zawiyah2025.vercel.app`
   - التأكد من عمل التزامن بفتح الموقع من أجهزة مختلفة

2. **اختبار الوظائف:**
   - إنشاء حجز جديد
   - التأكد من ظهوره فوراً في الأجهزة الأخرى
   - اختبار البحث والإحصائيات

### ميزات النشر على الإنترنت 🌐

✅ **الوصول من أي مكان:** يمكن للمعلمات الوصول من المنزل أو المدرسة
✅ **تزامن فوري:** التحديثات تظهر في جميع الأجهزة خلال ثوانٍ
✅ **أمان عالي:** HTTPS والحماية من CORS
✅ **أداء سريع:** خوادم عالمية من Vercel و Railway
✅ **نسخ احتياطية:** Railway يحتفظ بنسخ من البيانات
✅ **مجاني:** كلا الخدمتين تقدمان خطط مجانية كافية

### استكشاف الأخطاء 🔧

**إذا لم يعمل التزامن:**
1. تأكد من صحة رابط الخادم في متغيرات البيئة
2. تحقق من السماح لـ CORS في إعدادات Railway

**إذا لم تظهر البيانات:**
1. تأكد من رفع ملف `bookings.json` الأولي للخادم
2. تحقق من إعدادات قاعدة البيانات

**للحصول على المساعدة:**
- تحقق من لوحة تحكم Railway للأخطاء
- استخدم أدوات المطور في المتصفح (F12)

---

### رابط النظام النهائي 🎉
بعد اكتمال النشر، سيكون النظام متاحاً على:
**https://zawiyah2025.vercel.app**

يمكن للمعلمات استخدام هذا الرابط من أي جهاز متصل بالإنترنت! 📱💻🖥️