// Firebase Admin Service للسيرفر
const admin = require('firebase-admin');

class FirebaseAdminService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.collections = {
      bookings: 'bookings',
      classrooms: 'classrooms',
      timeslots: 'timeslots',
      stats: 'stats',
      logs: 'logs'
    };
  }

  // تهيئة Firebase Admin
  initialize() {
    if (this.isInitialized) {
      return this.db;
    }

    try {
      // البحث عن ملف المفاتيح أولاً
      let serviceAccount;
      
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // إذا كان المفتاح في متغير البيئة (للنشر)
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } else {
        // البحث عن ملف JSON محلي
        try {
          serviceAccount = require('./firebase-admin-key.json');
        } catch (err) {
          console.warn('⚠️ لم يتم العثور على ملف firebase-admin-key.json');
          console.log('📝 يرجى إضافة ملف المفاتيح أو متغير البيئة FIREBASE_SERVICE_ACCOUNT_KEY');
          
          // استخدام تكوين افتراضي للتطوير
          serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID || 'zawiyah2025',
            // سيحتاج لإضافة المفاتيح الفعلية
          };
        }
      }

      // تهيئة Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID || 'zawiyah2025'
      });

      this.db = admin.firestore();
      this.isInitialized = true;
      
      console.log('🔥 تم تهيئة Firebase Admin بنجاح');
      return this.db;
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة Firebase Admin:', error.message);
      throw error;
    }
  }

  // التأكد من التهيئة
  ensureInitialized() {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.db;
  }

  // === إدارة الحجوزات ===
  
  async createBooking(bookingData) {
    try {
      const db = this.ensureInitialized();
      
      const processedData = {
        ...bookingData,
        date: admin.firestore.Timestamp.fromDate(new Date(bookingData.date)),
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        status: 'active'
      };

      const docRef = await db.collection(this.collections.bookings).add(processedData);
      
      console.log('✅ تم إنشاء حجز جديد من السيرفر:', docRef.id);
      
      return {
        id: docRef.id,
        ...processedData,
        date: bookingData.date
      };
    } catch (error) {
      console.error('خطأ في إنشاء الحجز من السيرفر:', error);
      throw error;
    }
  }

  async updateBooking(bookingId, updates) {
    try {
      const db = this.ensureInitialized();
      
      const updateData = {
        ...updates,
        updated_at: admin.firestore.Timestamp.now()
      };

      if (updates.date) {
        updateData.date = admin.firestore.Timestamp.fromDate(new Date(updates.date));
      }

      await db.collection(this.collections.bookings).doc(bookingId).update(updateData);
      
      console.log('📝 تم تحديث الحجز من السيرفر:', bookingId);
      return true;
    } catch (error) {
      console.error('خطأ في تحديث الحجز من السيرفر:', error);
      throw error;
    }
  }

  async deleteBooking(bookingId) {
    try {
      const db = this.ensureInitialized();
      await db.collection(this.collections.bookings).doc(bookingId).delete();
      
      console.log('🗑️ تم حذف الحجز من السيرفر:', bookingId);
      return true;
    } catch (error) {
      console.error('خطأ في حذف الحجز من السيرفر:', error);
      throw error;
    }
  }

  async getAllBookings() {
    try {
      const db = this.ensureInitialized();
      
      const snapshot = await db
        .collection(this.collections.bookings)
        .orderBy('created_at', 'desc')
        .get();
      
      const bookings = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString?.()?.split('T')?.[0] || data.date,
          created_at: data.created_at?.toDate?.() || data.created_at,
          updated_at: data.updated_at?.toDate?.() || data.updated_at
        });
      });

      return bookings;
    } catch (error) {
      console.error('خطأ في جلب الحجوزات من السيرفر:', error);
      throw error;
    }
  }

  async getBookingsByDate(date) {
    try {
      const db = this.ensureInitialized();
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const snapshot = await db
        .collection(this.collections.bookings)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
        .where('status', '==', 'active')
        .get();

      const bookings = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString?.()?.split('T')?.[0] || data.date
        });
      });

      return bookings;
    } catch (error) {
      console.error('خطأ في جلب حجوزات اليوم من السيرفر:', error);
      throw error;
    }
  }

  // === إدارة القاعات ===
  
  async createClassroom(classroomData) {
    try {
      const db = this.ensureInitialized();
      
      const processedData = {
        ...classroomData,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        isActive: true
      };

      const docRef = await db.collection(this.collections.classrooms).add(processedData);
      
      console.log('✅ تم إنشاء قاعة جديدة:', docRef.id);
      
      return {
        id: docRef.id,
        ...processedData
      };
    } catch (error) {
      console.error('خطأ في إنشاء القاعة:', error);
      throw error;
    }
  }

  async getAllClassrooms() {
    try {
      const db = this.ensureInitialized();
      
      const snapshot = await db
        .collection(this.collections.classrooms)
        .where('isActive', '==', true)
        .orderBy('type')
        .get();
      
      const classrooms = [];
      snapshot.forEach((doc) => {
        classrooms.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return classrooms;
    } catch (error) {
      console.error('خطأ في جلب القاعات من السيرفر:', error);
      throw error;
    }
  }

  // === إدارة الفترات الزمنية ===
  
  async createTimeSlot(timeslotData) {
    try {
      const db = this.ensureInitialized();
      
      const processedData = {
        ...timeslotData,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      };

      const docRef = await db.collection(this.collections.timeslots).add(processedData);
      
      console.log('✅ تم إنشاء فترة زمنية جديدة:', docRef.id);
      
      return {
        id: docRef.id,
        ...processedData
      };
    } catch (error) {
      console.error('خطأ في إنشاء الفترة الزمنية:', error);
      throw error;
    }
  }

  async getAllTimeSlots() {
    try {
      const db = this.ensureInitialized();
      
      const snapshot = await db
        .collection(this.collections.timeslots)
        .orderBy('order')
        .get();
      
      const timeslots = [];
      snapshot.forEach((doc) => {
        timeslots.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return timeslots;
    } catch (error) {
      console.error('خطأ في جلب الفترات الزمنية من السيرفر:', error);
      throw error;
    }
  }

  // === نقل البيانات من النظام المحلي ===
  
  async migrateFromLocalData(localData) {
    try {
      const db = this.ensureInitialized();
      const batch = db.batch();
      let operations = 0;

      console.log('🔄 بدء نقل البيانات إلى Firebase...');

      // نقل الحجوزات
      if (localData.bookings) {
        for (const [key, booking] of Object.entries(localData.bookings)) {
          const docRef = db.collection(this.collections.bookings).doc();
          
          const processedBooking = {
            ...booking,
            date: admin.firestore.Timestamp.fromDate(new Date(booking.date || booking.createdAt)),
            created_at: admin.firestore.Timestamp.fromDate(new Date(booking.created_at || booking.createdAt)),
            updated_at: admin.firestore.Timestamp.now(),
            status: booking.status || 'active',
            // تنظيف البيانات القديمة
            teacher_name: booking.teacher_name || booking.teacher,
            classroom_id: booking.classroom_id || booking.room,
            time_slot: booking.time_slot || this.parseTimeSlot(booking.period),
            notes: booking.notes || ''
          };

          batch.set(docRef, processedBooking);
          operations++;
        }
      }

      // نقل القاعات
      if (localData.classrooms) {
        for (const [key, classroom] of Object.entries(localData.classrooms)) {
          const docRef = db.collection(this.collections.classrooms).doc();
          
          const processedClassroom = {
            ...classroom,
            created_at: admin.firestore.Timestamp.now(),
            updated_at: admin.firestore.Timestamp.now(),
            isActive: classroom.isActive !== false
          };

          batch.set(docRef, processedClassroom);
          operations++;
        }
      }

      // نقل الفترات الزمنية
      if (localData.timeslots) {
        for (const [key, timeslot] of Object.entries(localData.timeslots)) {
          const docRef = db.collection(this.collections.timeslots).doc();
          
          const processedTimeslot = {
            ...timeslot,
            created_at: admin.firestore.Timestamp.now(),
            updated_at: admin.firestore.Timestamp.now()
          };

          batch.set(docRef, processedTimeslot);
          operations++;
        }
      }

      // تنفيذ العمليات دفعياً
      if (operations > 0) {
        await batch.commit();
        console.log(`✅ تم نقل ${operations} عنصر إلى Firebase بنجاح`);
      } else {
        console.log('ℹ️ لا توجد بيانات للنقل');
      }

      return { success: true, operations };
    } catch (error) {
      console.error('❌ خطأ في نقل البيانات:', error);
      throw error;
    }
  }

  // مساعد لتحويل أسماء الفترات إلى أرقام
  parseTimeSlot(periodName) {
    const periodMap = {
      'الحصة الأولى': 1,
      'الحصة الثانية': 2,
      'الحصة الثالثة': 3,
      'الحصة الرابعة': 4,
      'الحصة الخامسة': 5,
      'الحصة السادسة': 6,
      'الحصة السابعة': 7,
      'الحصة الثامنة': 8,
      'الطابور': 9,
      'النشاط': 10
    };
    
    return periodMap[periodName] || 1;
  }

  // === التسجيل والمراقبة ===
  
  async logActivity(activity) {
    try {
      const db = this.ensureInitialized();
      
      const logData = {
        ...activity,
        timestamp: admin.firestore.Timestamp.now(),
        server: true
      };

      await db.collection(this.collections.logs).add(logData);
    } catch (error) {
      console.error('خطأ في تسجيل النشاط:', error);
    }
  }

  // === إحصائيات ===
  
  async getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = await this.getBookingsByDate(today);
      
      return {
        totalBookings: todayBookings.length,
        activeBookings: todayBookings.filter(b => b.status === 'active').length,
        teachersCount: new Set(todayBookings.map(b => b.teacher_name)).size,
        subjectsCount: new Set(todayBookings.map(b => b.subject)).size,
        date: today
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات اليوم:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للسيرفر
const firebaseAdminService = new FirebaseAdminService();

module.exports = firebaseAdminService;