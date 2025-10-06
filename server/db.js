// Serverless-compatible database using in-memory storage
// متوافق مع Vercel Serverless Functions
const memoryDb = require('./memory-db');

// Initialize memory database on first load
memoryDb.initialize();

console.log('🚀 تم تحميل قاعدة البيانات المتوافقة مع Vercel Serverless');

// Database operations - wrapper around memory database
const db = {
  // Classrooms
  getClassrooms: () => {
    try {
      return memoryDb.getClassrooms();
    } catch (error) {
      console.error('خطأ في جلب القاعات:', error);
      return [];
    }
  },

  getClassroomById: (id) => {
    try {
      return memoryDb.getClassroomById(id);
    } catch (error) {
      console.error('خطأ في جلب القاعة:', error);
      return null;
    }
  },

  // Bookings
  getBookings: () => {
    try {
      return memoryDb.getBookings();
    } catch (error) {
      console.error('خطأ في جلب الحجوزات:', error);
      return {};
    }
  },

  addBooking: (key, booking) => {
    try {
      console.log('💾 إضافة حجز جديد:', key);
      return memoryDb.addBooking(key, booking);
    } catch (error) {
      console.error('خطأ في إضافة الحجز:', error);
      return false;
    }
  },

  updateBooking: (key, booking) => {
    try {
      console.log('📝 تحديث حجز:', key);
      return memoryDb.updateBooking(key, booking);
    } catch (error) {
      console.error('خطأ في تحديث الحجز:', error);
      return false;
    }
  },

  deleteBooking: (referenceNumber) => {
    try {
      console.log('🗑️ حذف حجز برقم مرجعي:', referenceNumber);
      return memoryDb.deleteBooking(referenceNumber);
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      return false;
    }
  },

  searchBookingsByPhone: (phone) => {
    try {
      return memoryDb.searchBookingsByPhone(phone);
    } catch (error) {
      console.error('خطأ في البحث عن حجوزات المعلم:', error);
      return [];
    }
  },

  // Time slots
  getTimeSlots: () => {
    try {
      return memoryDb.getTimeSlots();
    } catch (error) {
      console.error('خطأ في جلب الحصص:', error);
      return [];
    }
  },

  // Statistics and maintenance
  getStats: () => {
    try {
      return memoryDb.getStats();
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      return { bookings: 0, classrooms: 0, timeSlots: 0, error: true };
    }
  },

  // Force reset (for debugging)
  reset: () => {
    try {
      memoryDb.reset();
      console.log('🔄 تم إعادة تعيين قاعدة البيانات');
      return true;
    } catch (error) {
      console.error('خطأ في إعادة التعيين:', error);
      return false;
    }
  }
};

module.exports = db;