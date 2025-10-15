const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Persistent Storage System - نظام التخزين الدائم
const PersistentStorage = require('./PersistentStorage');
const persistentDB = new PersistentStorage();

// Data Loss Prevention System - نظام منع فقدان البيانات
const dataLossPrevention = require('./dataLossPrevention');

// Error Monitoring and Health Check Systems - أنظمة مراقبة الأخطاء وفحص الصحة
const errorMonitor = require('./errorMonitoring');
const healthChecker = require('./healthCheck');

// Fallback to in-memory database for compatibility
const db = require('./db');

const app = express();
const server = http.createServer(app);

// إعداد CORS للنشر على الإنترنت
const allowedOrigins = [
  'http://localhost:3000',
  'https://zawiyah2025.vercel.app',
  'https://zawiyah-2025.vercel.app',
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// جعل Socket.IO متاح globally للنظام الدائم
global.io = io;

const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Add Error Monitoring and Performance Monitoring Middleware
app.use(errorMonitor.performanceMonitor());

// Health check endpoint for Render
app.get('/api/health', async (req, res) => {
  try {
    // إجراء فحص سريع للصحة
    const quickCheck = await healthChecker.quickHealthCheck();
    
    res.json({ 
      status: quickCheck.healthy ? 'healthy' : 'warning',
      message: quickCheck.healthy ? 'Zawiyah Server is running perfectly' : 'Zawiyah Server has some issues',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      healthScore: `${quickCheck.score}/${quickCheck.total}`,
      details: quickCheck.checks
    });
  } catch (error) {
    await errorMonitor.logError('ERROR', 'NETWORK', 'Health check failed', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      message: 'Health check failed',
      error: error.message
    });
  }
});

// System diagnostics endpoint - نقطة نهاية التشخيص
app.get('/api/diagnostics', async (req, res) => {
  try {
    const fullReport = await healthChecker.performFullHealthCheck();
    res.json({
      success: true,
      report: fullReport
    });
  } catch (error) {
    await errorMonitor.logError('ERROR', 'DIAGNOSTICS', 'Failed to generate diagnostics', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء تقرير التشخيص',
      error: error.message
    });
  }
});

// Error logs endpoint - نقطة نهاية سجلات الأخطاء
app.get('/api/error-logs', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const logs = await errorMonitor.getRecentErrorLogs(hours * 60); // convert to minutes
    res.json({
      success: true,
      logs,
      period: `آخر ${hours} ساعة`
    });
  } catch (error) {
    await errorMonitor.logError('ERROR', 'NETWORK', 'Failed to fetch error logs', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب سجلات الأخطاء',
      error: error.message
    });
  }
});

// Error report endpoint - نقطة نهاية تقرير الأخطاء
app.get('/api/error-report', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const report = await errorMonitor.generateErrorReport(hours);
    res.json({
      success: true,
      report
    });
  } catch (error) {
    await errorMonitor.logError('ERROR', 'NETWORK', 'Failed to generate error report', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء تقرير الأخطاء',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'مرحباً بك في نظام زاوية لحجز القاعات',
    status: 'active',
    endpoints: ['/api/classrooms', '/api/bookings', '/api/stats']
  });
});;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug routes
const debugRoutes = require('./routes/debug');
app.use('/api/debug', debugRoutes);

// API routes with Persistent Storage Support
app.get('/api/classrooms', async (req, res) => {
  try {
    // محاولة استخدام النظام الدائم أولاً
    let classrooms = await persistentDB.getAllClassrooms();
    
    // إذا فشل، استخدام النظام الاحتياطي
    if (!classrooms || classrooms.length === 0) {
      classrooms = db.getClassrooms();
    }
    
    res.json({ success: true, data: classrooms });
  } catch (error) {
    console.error('خطأ في جلب القاعات:', error);
    // fallback to in-memory
    const classrooms = db.getClassrooms();
    res.json({ success: true, data: classrooms });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    // محاولة استخدام النظام الدائم أولاً
    let bookings = await persistentDB.getAllBookings();
    
    // إذا فشل، استخدام النظام الاحتياطي
    if (!bookings) {
      bookings = db.getBookings();
    }
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('خطأ في جلب الحجوزات:', error);
    // fallback to in-memory
    const bookings = db.getBookings();
    res.json({ success: true, data: bookings });
  }
});

// Get assembly bookings specifically
app.get('/api/assembly', async (req, res) => {
  try {
    // محاولة استخدام النظام الدائم أولاً
    let allBookings = await persistentDB.getAllBookings();
    
    // إذا فشل، استخدام النظام الاحتياطي
    if (!allBookings) {
      allBookings = db.getBookings();
    }
    
    // Filter assembly bookings only
    const assemblyBookings = {};
    Object.keys(allBookings).forEach(key => {
      if (key.startsWith('assembly-') || allBookings[key].type === 'assembly') {
        assemblyBookings[key] = allBookings[key];
      }
    });
    
    console.log('📋 طلب حجوزات الطابور:', Object.keys(assemblyBookings).length);
    res.json({ success: true, data: assemblyBookings });
  } catch (error) {
    console.error('خطأ في جلب حجوزات الطابور:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search bookings by phone number
app.get('/api/bookings/search', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مطلوب' });
    }

    console.log('🔍 البحث عن حجوزات برقم الهاتف:', phone);
    
    // محاولة استخدام النظام الدائم أولاً
    let allBookings = await persistentDB.getAllBookings();
    
    // إذا فشل، استخدام النظام الاحتياطي
    if (!allBookings) {
      const results = db.searchBookingsByPhone(phone);
      console.log('✅ نتائج البحث (احتياطي):', results.length, 'حجز');
      return res.json({ success: true, data: results });
    }
    
    // البحث في النظام الدائم
    const results = [];
    Object.values(allBookings).forEach(booking => {
      if (booking.teacherPhone && booking.teacherPhone.includes(phone)) {
        results.push(booking);
      }
    });
    
    console.log('✅ نتائج البحث (دائم):', results.length, 'حجز');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('خطأ في البحث عن الحجوزات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/stats/dashboard', (req, res) => {
  const bookings = db.getBookings();
  const classrooms = db.getClassrooms();
  
  const today = new Date().toDateString();
  const todayBookings = bookings.filter(b => 
    b.status === 'active' && new Date(b.date).toDateString() === today
  );

  // Mock stats for demonstration
  const stats = {
    summary: {
      todayBookings: todayBookings.length,
      weekBookings: bookings.filter(b => b.status === 'active').length,
      monthBookings: bookings.filter(b => b.status === 'active').length,
      totalClassrooms: classrooms.length
    },
    mostBookedClassrooms: [
      { classroomName: 'القاعة الذكية', bookingCount: 15 },
      { classroomName: 'الصف 10أ', bookingCount: 12 },
      { classroomName: 'الصف 11ب', bookingCount: 10 }
    ],
    mostActiveTeachers: [
      { teacherName: 'أ. فاطمة أحمد', bookingCount: 20 },
      { teacherName: 'أ. سارة محمد', bookingCount: 18 },
      { teacherName: 'أ. مريم علي', bookingCount: 15 }
    ]
  };

  res.json({ success: true, data: stats });
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { key, booking } = req.body;
    
    // إضافة الرقم المرجعي إذا لم يكن موجود
    if (!booking.referenceNumber && key) {
      booking.referenceNumber = key;
    }
    
    // محاولة استخدام النظام الدائم أولاً
    let success = await persistentDB.addBooking(booking);
    
    // إذا فشل، استخدام النظام الاحتياطي
    if (!success) {
      success = db.addBooking(key, booking);
    }
    
    if (success) {
      console.log('✅ تم حفظ الحجز بنجاح (دائم)');
      res.json({ success: true, data: { key, booking } });
    } else {
      console.error('❌ فشل في حفظ الحجز');
      res.status(500).json({ success: false, message: 'فشل في حفظ الحجز' });
    }
  } catch (error) {
    console.error('خطأ في إنشاء الحجز:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete booking by reference number
app.delete('/api/bookings', async (req, res) => {
  try {
    const { referenceNumber } = req.body;
    
    if (!referenceNumber) {
      return res.status(400).json({ success: false, error: 'الرقم المرجعي مطلوب' });
    }

    console.log('🗑️ طلب حذف حجز برقم مرجعي:', referenceNumber);
    
    // محاولة استخدام النظام الدائم أولاً
    let success = await persistentDB.deleteBooking(referenceNumber);
    
    // إذا فشل، استخدام النظام الاحتياطي
    if (!success) {
      success = db.deleteBooking(referenceNumber);
    }
    
    if (success) {
      console.log('✅ تم حذف الحجز بنجاح (دائم)');
      res.json({ success: true, message: 'تم حذف الحجز بنجاح' });
    } else {
      res.status(404).json({ success: false, error: 'لم يتم العثور على الحجز' });
    }
  } catch (error) {
    console.error('خطأ في حذف الحجز:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Zawiyah2025 API'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔗 مستخدم جديد متصل:', socket.id, '| إجمالي المتصلين:', io.engine.clientsCount);

  // Join classroom room for real-time updates
  socket.on('join-classroom', (classroomId) => {
    socket.join(`classroom-${classroomId}`);
    console.log(`المستخدم ${socket.id} انضم لقاعة ${classroomId}`);
  });

  // Leave classroom room
  socket.on('leave-classroom', (classroomId) => {
    socket.leave(`classroom-${classroomId}`);
    console.log(`المستخدم ${socket.id} غادر قاعة ${classroomId}`);
  });

  // طلب جميع الحجوزات
  socket.on('get-bookings', async () => {
    try {
      // محاولة استخدام النظام الدائم أولاً
      let bookings = await persistentDB.getAllBookings();
      
      // إذا فشل، استخدام النظام الاحتياطي
      if (!bookings) {
        bookings = db.getBookings();
      }
      
      console.log('📋 إرسال الحجوزات للعميل (دائم):', Object.keys(bookings).length, 'حجز');
      socket.emit('bookings-updated', { bookings });
    } catch (error) {
      console.error('خطأ في جلب الحجوزات:', error);
      socket.emit('booking-error', { message: 'خطأ في جلب الحجوزات' });
    }
  });

  // إنشاء حجز جديد
  socket.on('create-booking', async (data) => {
    try {
      console.log('📝 طلب إنشاء حجز جديد:', data.key, '|', data.booking.teacher);
      
      // التحقق من عدم وجود تضارب في الحجز
      let existingBookings = await persistentDB.getAllBookings();
      if (!existingBookings) {
        existingBookings = db.getBookings();
      }
      
      if (existingBookings[data.key]) {
        console.log('⚠️ حجز موجود مسبقاً في هذا الوقت');
        socket.emit('booking-error', { 
          message: 'هذا الوقت محجوز مسبقاً، يرجى اختيار وقت آخر' 
        });
        return;
      }
      
      // إضافة الرقم المرجعي
      data.booking.referenceNumber = data.key;
      
      // حفظ الحجز في النظام الدائم أولاً
      let success = await persistentDB.addBooking(data.booking);
      
      // إذا فشل، استخدام النظام الاحتياطي
      if (!success) {
        success = db.addBooking(data.key, data.booking);
      }
      
      if (success) {
        console.log('✅ تم حفظ الحجز في قاعدة البيانات:', data.key);
        
        // إرسال تأكيد للمرسل أولاً
        socket.emit('booking-success', { key: data.key, booking: data.booking });
        
        // إرسال التحديث لجميع المتصلين (بما في ذلك المرسل)
        io.emit('booking-created', { key: data.key, booking: data.booking });
        
        console.log('📡 تم إرسال التحديث لجميع المتصلين:', io.engine.clientsCount, 'عميل');
      } else {
        console.error('❌ فشل في حفظ الحجز');
        socket.emit('booking-error', { message: 'فشل في حفظ الحجز، يرجى المحاولة مرة أخرى' });
      }
    } catch (error) {
      console.error('خطأ في إنشاء الحجز:', error);
      socket.emit('booking-error', { 
        message: error.message || 'خطأ في إنشاء الحجز'
      });
    }
  });

  // تحديث حجز موجود
  socket.on('update-booking', async (data) => {
    try {
      console.log('📝 طلب تحديث حجز:', data);
      
      // محاولة استخدام النظام الدائم أولاً
      let success = await persistentDB.updateBooking(data.key, data.booking);
      
      // إذا فشل، استخدام النظام الاحتياطي
      if (!success) {
        success = db.updateBooking(data.key, data.booking);
      }
      
      if (success) {
        // إرسال تأكيد للمرسل
        socket.emit('booking-update-success', { key: data.key, booking: data.booking });
        
        // إرسال التحديث لجميع المتصلين
        io.emit('booking-updated', { key: data.key, booking: data.booking });
        
        console.log('✅ تم تحديث الحجز بنجاح:', data.key);
      } else {
        socket.emit('booking-error', { message: 'فشل في تحديث الحجز' });
      }
    } catch (error) {
      console.error('خطأ في تحديث الحجز:', error);
      socket.emit('booking-error', { 
        message: error.message || 'خطأ في تحديث الحجز'
      });
    }
  });

  // حذف حجز
  socket.on('delete-booking', async (data) => {
    try {
      console.log('🗑️ طلب حذف حجز برقم مرجعي:', data.referenceNumber);
      
      // محاولة استخدام النظام الدائم أولاً
      let success = await persistentDB.deleteBooking(data.referenceNumber);
      
      // إذا فشل، استخدام النظام الاحتياطي
      if (!success) {
        success = db.deleteBooking(data.referenceNumber);
      }
      
      if (success) {
        console.log('✅ تم حذف الحجز من قاعدة البيانات (دائم):', data.referenceNumber);
        
        // إرسال تأكيد للمرسل
        socket.emit('booking-delete-success', { referenceNumber: data.referenceNumber });
        
        // إرسال التحديث لجميع المتصلين
        io.emit('booking-deleted', { referenceNumber: data.referenceNumber });
        
        console.log('📡 تم إرسال تحديث الحذف لجميع المتصلين:', io.engine.clientsCount, 'عميل');
      } else {
        console.log('❌ لم يتم العثور على حجز للحذف');
        socket.emit('booking-error', { message: 'لم يتم العثور على الحجز المطلوب حذفه' });
      }
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      socket.emit('booking-error', { 
        message: error.message || 'خطأ في حذف الحجز'
      });
    }
  });

  // البحث عن حجوزات المعلم بالهاتف
  socket.on('search-bookings-by-phone', async (data) => {
    try {
      // محاولة استخدام النظام الدائم أولاً
      let allBookings = await persistentDB.getAllBookings();
      let bookings = [];
      
      if (allBookings) {
        // البحث في النظام الدائم
        Object.values(allBookings).forEach(booking => {
          if (booking.teacherPhone && booking.teacherPhone.includes(data.phone)) {
            bookings.push(booking);
          }
        });
      } else {
        // استخدام النظام الاحتياطي
        bookings = db.searchBookingsByPhone(data.phone);
      }
      
      socket.emit('teacher-bookings-found', { 
        phone: data.phone, 
        bookings: bookings 
      });
    } catch (error) {
      console.error('خطأ في البحث عن حجوزات المعلم:', error);
      socket.emit('booking-error', { 
        message: 'خطأ في البحث عن الحجوزات'
      });
    }
  });

  socket.on('cancel-booking', (bookingId) => {
    try {
      const success = db.deleteBooking(bookingId);
      if (!success) {
        return socket.emit('booking-error', { message: 'الحجز غير موجود' });
      }

      // Broadcast cancellation
      io.emit('booking-cancelled', { id: bookingId });
      io.emit('booking-stats-updated');
      
      socket.emit('cancellation-success', { id: bookingId });
    } catch (error) {
      socket.emit('booking-error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ مستخدم انقطع الاتصال:', socket.id, '| المتبقي:', io.engine.clientsCount - 1);
  });
});

// Add Express Error Handler - إضافة معالج أخطاء Express
app.use(errorMonitor.expressErrorHandler());

// Database is initialized automatically via db.js
console.log('تم تهيئة قاعدة البيانات المحلية بنجاح');

// تسجيل بدء الخادم
errorMonitor.logSystemInfo('INFO', 'بدء تشغيل خادم زاوية 2025', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
  corsOrigins: allowedOrigins.length
});

// Start server
const HOST = process.env.HOST || '0.0.0.0'

server.listen(PORT, HOST, async () => {
  console.log(`🚀 خادم زاوية 2025 يعمل على المنفذ ${PORT}`);
  console.log(`📱 الواجهة المحلية: http://localhost:3000`);
  console.log(`🌐 الواجهة على الشبكة: http://192.168.1.14:3000`);
  console.log(`🔗 API محلي: http://localhost:${PORT}/api`);
  console.log(`🔗 API على الشبكة: http://192.168.1.14:${PORT}/api`);
  console.log('🏥 فحص الصحة: http://localhost:' + PORT + '/api/health');
  console.log('🚨 التشخيص: http://localhost:' + PORT + '/api/diagnostics');
  console.log('📊 سجلات الأخطاء: http://localhost:' + PORT + '/api/error-logs');
  console.log('');
  console.log('📋 للاختبار على أجهزة أخرى:');
  console.log('   1. تأكد أن الأجهزة متصلة بنفس شبكة الواي فاي');
  console.log('   2. افتح المتصفح واذهب إلى: http://192.168.1.14:3000');
  console.log('   3. اختبر إنشاء حجز ومراقبة التزامن الفوري');
  
  // تسجيل نجاح بدء الخادم
  await errorMonitor.logSystemInfo('INFO', 'تم بدء الخادم بنجاح', {
    host: HOST,
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });

  // إجراء فحص صحة أولي
  try {
    console.log('\n🏥 إجراء فحص صحة أولي...');
    const healthReport = await healthChecker.performFullHealthCheck();
    
    if (healthReport.overallHealth.score >= 4) {
      console.log('✅ النظام في حالة ممتازة وجاهز للعمل!');
    } else if (healthReport.overallHealth.score >= 3) {
      console.log('⚠️ النظام يعمل بحالة جيدة مع بعض التحذيرات');
    } else {
      console.log('🚨 النظام يحتاج إلى انتباه - يرجى مراجعة التقرير');
    }
  } catch (error) {
    await errorMonitor.logError('WARNING', 'SYSTEM', 'فشل في فحص الصحة الأولي', error);
    console.log('⚠️ تم تخطي فحص الصحة الأولي');
  }
});

// Handle server shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('🛑 تلقي إشارة إيقاف الخادم...');
  await errorMonitor.logSystemInfo('INFO', 'إيقاف الخادم', { reason: 'SIGTERM' });
  
  server.close(() => {
    console.log('✅ تم إيقاف الخادم بنجاح');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 تلقي إشارة مقاطعة (Ctrl+C)...');
  await errorMonitor.logSystemInfo('INFO', 'إيقاف الخادم', { reason: 'SIGINT' });
  
  server.close(() => {
    console.log('✅ تم إيقاف الخادم بنجاح');
    process.exit(0);
  });
});