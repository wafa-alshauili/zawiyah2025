const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Serverless-compatible in-memory database
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

const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Zawiyah Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
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

// Simple API routes
app.get('/api/classrooms', (req, res) => {
  const classrooms = db.getClassrooms();
  res.json({ success: true, data: classrooms });
});

app.get('/api/bookings', (req, res) => {
  const bookings = db.getBookings();
  res.json({ success: true, data: bookings });
});

// Get assembly bookings specifically
app.get('/api/assembly', (req, res) => {
  try {
    const allBookings = db.getBookings();
    
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
app.get('/api/bookings/search', (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مطلوب' });
    }

    console.log('🔍 البحث عن حجوزات برقم الهاتف:', phone);
    
    const results = db.searchBookingsByPhone(phone);
    
    console.log('✅ نتائج البحث:', results.length, 'حجز');
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

app.post('/api/bookings', (req, res) => {
  try {
    const booking = db.addBooking(req.body);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  socket.on('get-bookings', () => {
    try {
      const bookings = db.getBookings();
      console.log('📋 إرسال الحجوزات للعميل:', Object.keys(bookings).length, 'حجز');
      socket.emit('bookings-updated', { bookings });
    } catch (error) {
      console.error('خطأ في جلب الحجوزات:', error);
      socket.emit('booking-error', { message: 'خطأ في جلب الحجوزات' });
    }
  });

  // إنشاء حجز جديد
  socket.on('create-booking', (data) => {
    try {
      console.log('📝 طلب إنشاء حجز جديد:', data.key, '|', data.booking.teacher);
      
      // التحقق من عدم وجود تضارب في الحجز
      const existingBookings = db.getBookings();
      if (existingBookings[data.key]) {
        console.log('⚠️ حجز موجود مسبقاً في هذا الوقت');
        socket.emit('booking-error', { 
          message: 'هذا الوقت محجوز مسبقاً، يرجى اختيار وقت آخر' 
        });
        return;
      }
      
      // حفظ الحجز
      const success = db.addBooking(data.key, data.booking);
      
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
  socket.on('update-booking', (data) => {
    try {
      console.log('📝 طلب تحديث حجز:', data);
      
      const success = db.updateBooking(data.key, data.booking);
      
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
  socket.on('delete-booking', (data) => {
    try {
      console.log('🗑️ طلب حذف حجز برقم مرجعي:', data.referenceNumber);
      
      const success = db.deleteBooking(data.referenceNumber);
      
      if (success) {
        console.log('✅ تم حذف الحجز من قاعدة البيانات:', data.referenceNumber);
        
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
  socket.on('search-bookings-by-phone', (data) => {
    try {
      const bookings = db.searchBookingsByPhone(data.phone);
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

// Database is initialized automatically via db.js
console.log('تم تهيئة قاعدة البيانات المحلية بنجاح');

// Start server
const HOST = process.env.HOST || '0.0.0.0'

server.listen(PORT, HOST, () => {
  console.log(`🚀 خادم زاوية 2025 يعمل على المنفذ ${PORT}`);
  console.log(`📱 الواجهة المحلية: http://localhost:3000`);
  console.log(`🌐 الواجهة على الشبكة: http://192.168.1.14:3000`);
  console.log(`🔗 API محلي: http://localhost:${PORT}/api`);
  console.log(`🔗 API على الشبكة: http://192.168.1.14:${PORT}/api`);
  console.log('');
  console.log('📋 للاختبار على أجهزة أخرى:');
  console.log('   1. تأكد أن الأجهزة متصلة بنفس شبكة الواي فاي');
  console.log('   2. افتح المتصفح واذهب إلى: http://192.168.1.14:3000');
  console.log('   3. اختبر إنشاء حجز ومراقبة التزامن الفوري');
});