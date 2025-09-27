# دليل نشر الخادم على Render 🎯

## الخطوة 1: إنشاء حساب Render
1. اذهبي إلى: **[render.com](https://render.com)**
2. اضغطي **"Get Started for Free"**
3. اختاري **"Login with GitHub"**
4. ادخلي بيانات GitHub: wafa-alshauili

## الخطوة 2: إنشاء Web Service
1. في لوحة التحكم، اضغطي **"New +"**
2. اختاري **"Web Service"**
3. اضغطي **"Connect a repository"**
4. ابحثي عن **"zawiyah2025"** واضغطي **"Connect"**

## الخطوة 3: إعدادات المشروع (مهمة جداً!)

### الإعدادات الأساسية:
```
Name: zawiyah2025-server
Region: Frankfurt (أقرب لعُمان)
Branch: master
Root Directory: server
Runtime: Node
```

### أوامر البناء والتشغيل:
```
Build Command: npm install
Start Command: npm start
```

### متغيرات البيئة (Environment Variables):
```
NODE_ENV = production
PORT = 10000
CLIENT_URL = https://zawiyah2025.vercel.app
CORS_ORIGIN = https://zawiyah2025.vercel.app
```

## الخطوة 4: النشر
1. راجعي جميع الإعدادات
2. اضغطي **"Create Web Service"**
3. انتظري 3-5 دقائق للنشر الأول

## الخطوة 5: الحصول على رابط الخادم
بعد النشر الناجح، ستحصلين على رابط مثل:
`https://zawiyah2025-server-xxxx.onrender.com`

**احفظي هذا الرابط - ستحتاجينه لنشر العميل!**

## الخطوة 6: اختبار الخادم
1. افتحي الرابط في المتصفح
2. يجب أن ترى: `{"message": "Zawiyah Server is running"}`
3. جربي: `[الرابط]/api/classrooms` - يجب أن ترى بيانات JSON

## مميزات Render لمشروع زاوية:
✅ **750 ساعة مجانية** شهرياً (كافية للمدرسة)
✅ **نشر تلقائي** من GitHub
✅ **SSL مجاني** (HTTPS)
✅ **خادم Frankfurt** (سريع لعُمان)
✅ **سجلات مفصلة** لتتبع الأخطاء
✅ **إعادة تشغيل تلقائي** عند الأخطاء

---

## استكشاف الأخطاء:
- **Build Failed**: تحققي من وجود package.json في مجلد server
- **Start Failed**: تأكدي من أن PORT=10000 في متغيرات البيئة
- **CORS Error**: تأكدي من إضافة CLIENT_URL صحيح

**بعد نجاح نشر الخادم، سنستكمل بنشر العميل على Vercel!**