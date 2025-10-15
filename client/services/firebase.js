// Firebase Configuration and Services
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';

// تكوين Firebase - يجب إضافة المعلومات الصحيحة من Firebase Console
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "zawiyah2025.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zawiyah2025",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "zawiyah2025.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class FirebaseService {
  constructor() {
    this.db = db;
    this.listeners = new Map();
    this.collections = {
      bookings: 'bookings',
      classrooms: 'classrooms', 
      timeslots: 'timeslots',
      stats: 'stats'
    };
  }

  // إدارة حالة الشبكة
  async enableOfflineSync() {
    try {
      await enableNetwork(this.db);
      console.log('🌐 تم تفعيل المزامنة مع Firebase');
    } catch (error) {
      console.error('خطأ في تفعيل المزامنة:', error);
    }
  }

  async disableOfflineSync() {
    try {
      await disableNetwork(this.db);
      console.log('📱 تم تفعيل الوضع المحلي');
    } catch (error) {
      console.error('خطأ في تعطيل المزامنة:', error);
    }
  }

  // === إدارة الحجوزات ===
  
  // إنشاء حجز جديد
  async createBooking(bookingData) {
    try {
      // تحويل التاريخ إلى Timestamp
      const processedData = {
        ...bookingData,
        date: Timestamp.fromDate(new Date(bookingData.date)),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        status: 'active'
      };

      const docRef = await addDoc(collection(this.db, this.collections.bookings), processedData);
      console.log('✅ تم إنشاء حجز جديد:', docRef.id);
      
      return {
        id: docRef.id,
        ...processedData,
        date: bookingData.date // إرجاع التاريخ في الشكل الأصلي
      };
    } catch (error) {
      console.error('خطأ في إنشاء الحجز:', error);
      throw error;
    }
  }

  // تحديث حجز موجود
  async updateBooking(bookingId, updates) {
    try {
      const bookingRef = doc(this.db, this.collections.bookings, bookingId);
      const updateData = {
        ...updates,
        updated_at: Timestamp.now()
      };

      if (updates.date) {
        updateData.date = Timestamp.fromDate(new Date(updates.date));
      }

      await updateDoc(bookingRef, updateData);
      console.log('📝 تم تحديث الحجز:', bookingId);
      return true;
    } catch (error) {
      console.error('خطأ في تحديث الحجز:', error);
      throw error;
    }
  }

  // حذف حجز
  async deleteBooking(bookingId) {
    try {
      const bookingRef = doc(this.db, this.collections.bookings, bookingId);
      await deleteDoc(bookingRef);
      console.log('🗑️ تم حذف الحجز:', bookingId);
      return true;
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      throw error;
    }
  }

  // إلغاء حجز (تغيير الحالة)
  async cancelBooking(bookingId, reason = '') {
    try {
      return await this.updateBooking(bookingId, {
        status: 'cancelled',
        cancelled_at: Timestamp.now(),
        cancellation_reason: reason
      });
    } catch (error) {
      console.error('خطأ في إلغاء الحجز:', error);
      throw error;
    }
  }

  // جلب جميع الحجوزات
  async getAllBookings() {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(this.db, this.collections.bookings),
          orderBy('created_at', 'desc')
        )
      );
      
      const bookings = [];
      querySnapshot.forEach((doc) => {
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
      console.error('خطأ في جلب الحجوزات:', error);
      throw error;
    }
  }

  // جلب حجوزات يوم معين
  async getBookingsByDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(this.db, this.collections.bookings),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay)),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString?.()?.split('T')?.[0] || data.date
        });
      });

      return bookings;
    } catch (error) {
      console.error('خطأ في جلب حجوزات اليوم:', error);
      throw error;
    }
  }

  // البحث في الحجوزات بحسب المعلم
  async getBookingsByTeacher(teacherName) {
    try {
      const q = query(
        collection(this.db, this.collections.bookings),
        where('teacher_name', '==', teacherName),
        where('status', '==', 'active'),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString?.()?.split('T')?.[0] || data.date
        });
      });

      return bookings;
    } catch (error) {
      console.error('خطأ في البحث بحسب المعلم:', error);
      throw error;
    }
  }

  // === إدارة القاعات ===
  
  async getAllClassrooms() {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(this.db, this.collections.classrooms),
          where('isActive', '==', true),
          orderBy('type'),
          orderBy('grade'),
          orderBy('section')
        )
      );
      
      const classrooms = [];
      querySnapshot.forEach((doc) => {
        classrooms.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return classrooms;
    } catch (error) {
      console.error('خطأ في جلب القاعات:', error);
      throw error;
    }
  }

  // === إدارة الفترات الزمنية ===
  
  async getAllTimeSlots() {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(this.db, this.collections.timeslots),
          orderBy('order')
        )
      );
      
      const timeslots = [];
      querySnapshot.forEach((doc) => {
        timeslots.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return timeslots;
    } catch (error) {
      console.error('خطأ في جلب الفترات الزمنية:', error);
      throw error;
    }
  }

  // === الاستماع للتغييرات الفورية ===
  
  // الاستماع لتحديثات الحجوزات
  subscribeToBookings(callback) {
    const q = query(
      collection(this.db, this.collections.bookings),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookings = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString?.()?.split('T')?.[0] || data.date,
          created_at: data.created_at?.toDate?.() || data.created_at,
          updated_at: data.updated_at?.toDate?.() || data.updated_at
        });
      });
      
      console.log('📡 تحديث فوري للحجوزات:', bookings.length);
      callback(bookings);
    }, (error) => {
      console.error('خطأ في الاستماع للحجوزات:', error);
    });

    // حفظ مرجع المستمع للإلغاء لاحقاً
    this.listeners.set('bookings', unsubscribe);
    return unsubscribe;
  }

  // الاستماع لحجوزات يوم معين
  subscribeToBookingsByDate(date, callback) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(this.db, this.collections.bookings),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookings = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString?.()?.split('T')?.[0] || data.date
        });
      });
      
      console.log(`📡 تحديث فوري لحجوزات ${date}:`, bookings.length);
      callback(bookings);
    }, (error) => {
      console.error('خطأ في الاستماع لحجوزات اليوم:', error);
    });

    const listenerId = `bookings-${date}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // إلغاء جميع المستمعين
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
        console.log(`🔕 تم إلغاء المستمع: ${key}`);
      }
    });
    this.listeners.clear();
  }

  // إلغاء مستمع محدد
  unsubscribe(listenerId) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
      this.listeners.delete(listenerId);
      console.log(`🔕 تم إلغاء المستمع: ${listenerId}`);
      return true;
    }
    return false;
  }

  // === إحصائيات وتقارير ===
  
  async getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = await this.getBookingsByDate(today);
      
      return {
        totalBookings: todayBookings.length,
        activeBookings: todayBookings.filter(b => b.status === 'active').length,
        teachersCount: new Set(todayBookings.map(b => b.teacher_name)).size,
        subjectsCount: new Set(todayBookings.map(b => b.subject)).size
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات اليوم:', error);
      throw error;
    }
  }

  // جلب أكثر القاعات حجزاً
  async getMostBookedRooms(limit = 5) {
    try {
      const bookings = await this.getAllBookings();
      const roomStats = {};
      
      bookings
        .filter(b => b.status === 'active')
        .forEach(booking => {
          const roomId = booking.classroom_id;
          roomStats[roomId] = (roomStats[roomId] || 0) + 1;
        });

      return Object.entries(roomStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([roomId, count]) => ({ roomId, count }));
    } catch (error) {
      console.error('خطأ في جلب أكثر القاعات حجزاً:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للتطبيق كله
const firebaseService = new FirebaseService();

export default firebaseService;
export { db };