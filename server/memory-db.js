// In-memory database for serverless environments (Vercel)
// البيانات ستُحفظ في الذاكرة أثناء عمل الخادم
// مع نسخة احتياطية في localStorage للعملاء

// قاعدة بيانات في الذاكرة
let memoryBookings = {};
let memoryClassrooms = [];
let memoryTimeSlots = [];

// Initialize default data
const initializeMemoryData = () => {
  // Time slots
  if (memoryTimeSlots.length === 0) {
    memoryTimeSlots = [
      { id: 1, slot_number: 1, name_ar: 'الحصة الأولى', start_time: '07:30', end_time: '08:15', order: 1 },
      { id: 2, slot_number: 2, name_ar: 'الحصة الثانية', start_time: '08:15', end_time: '09:00', order: 2 },
      { id: 3, slot_number: 3, name_ar: 'الحصة الثالثة', start_time: '09:00', end_time: '09:45', order: 3 },
      { id: 4, slot_number: 4, name_ar: 'الحصة الرابعة', start_time: '09:45', end_time: '10:30', order: 4 },
      { id: 5, slot_number: 5, name_ar: 'الحصة الخامسة', start_time: '11:00', end_time: '11:45', order: 6 },
      { id: 6, slot_number: 6, name_ar: 'الحصة السادسة', start_time: '11:45', end_time: '12:30', order: 7 },
      { id: 7, slot_number: 7, name_ar: 'الحصة السابعة', start_time: '12:30', end_time: '13:15', order: 8 },
      { id: 8, slot_number: 8, name_ar: 'الحصة الثامنة', start_time: '13:15', end_time: '14:00', order: 9 },
      { id: 9, slot_number: 9, name_ar: 'الطابور', start_time: '07:00', end_time: '07:30', type: 'assembly', order: 0 },
      { id: 10, slot_number: 10, name_ar: 'النشاط', start_time: '10:30', end_time: '11:00', type: 'activity', order: 5 }
    ];
  }

  // Classrooms
  if (memoryClassrooms.length === 0) {
    memoryClassrooms = [
      { id: 1, name_ar: 'القاعة الذكية', type: 'smart', equipment: ['projector', 'smartboard', 'sound_system'], isActive: true },
      { id: 2, name_ar: 'قاعة المصادر', type: 'resource_center', capacity: 25, equipment: ['computers', 'group_tables'], isActive: true },
      { id: 3, name_ar: 'ساحة الطابور القديم', type: 'assembly', capacity: 200, isActive: true }
    ];

    let id = 4;
    // Add grade classrooms using the correct naming pattern
    const gradeNames = {
      5: 'الخامس', 6: 'السادس', 7: 'السابع', 8: 'الثامن', 
      9: 'التاسع', 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر'
    };

    // Grades 5-10 (3 sections each)
    for (let grade = 5; grade <= 10; grade++) {
      for (let section = 1; section <= 3; section++) {
        memoryClassrooms.push({
          id: id++,
          name_ar: `الصف ${gradeNames[grade]} - الشعبة ${section}`,
          type: 'classroom',
          grade: grade,
          section: section.toString(),
          capacity: 30,
          equipment: ['whiteboard', 'desks'],
          isActive: true
        });
      }
    }

    // Grades 11-12 (6 sections each)
    for (let grade = 11; grade <= 12; grade++) {
      for (let section = 1; section <= 6; section++) {
        memoryClassrooms.push({
          id: id++,
          name_ar: `الصف ${gradeNames[grade]} - الشعبة ${section}`,
          type: 'classroom',
          grade: grade,
          section: section.toString(),
          capacity: 30,
          equipment: ['whiteboard', 'desks'],
          isActive: true
        });
      }
    }
  }
};

// Database operations
const memoryDb = {
  // Initialize data
  initialize: () => {
    initializeMemoryData();
    console.log('🧠 تم تهيئة قاعدة البيانات في الذاكرة');
    console.log('📊 القاعات:', memoryClassrooms.length);
    console.log('📅 الحجوزات:', Object.keys(memoryBookings).length);
  },

  // Classrooms
  getClassrooms: () => {
    if (memoryClassrooms.length === 0) {
      initializeMemoryData();
    }
    return memoryClassrooms;
  },
  
  getClassroomById: (id) => {
    return memoryClassrooms.find(c => c.id == id);
  },

  // Bookings (key-value format for compatibility with frontend)
  getBookings: () => {
    return memoryBookings;
  },
  
  addBooking: (key, booking) => {
    try {
      console.log('💾 حفظ حجز في الذاكرة:', key, '|', booking.teacher);
      memoryBookings[key] = {
        ...booking,
        savedAt: new Date().toISOString()
      };
      console.log('✅ تم حفظ الحجز في الذاكرة. إجمالي الحجوزات:', Object.keys(memoryBookings).length);
      return true;
    } catch (error) {
      console.error('خطأ في إضافة الحجز للذاكرة:', error);
      return false;
    }
  },

  updateBooking: (key, booking) => {
    try {
      console.log('📝 تحديث حجز في الذاكرة:', key);
      if (memoryBookings[key]) {
        memoryBookings[key] = { 
          ...memoryBookings[key], 
          ...booking, 
          updatedAt: new Date().toISOString() 
        };
        console.log('✅ تم تحديث الحجز في الذاكرة');
        return true;
      }
      console.log('❌ لم يتم العثور على الحجز للتحديث');
      return false;
    } catch (error) {
      console.error('خطأ في تحديث الحجز في الذاكرة:', error);
      return false;
    }
  },

  deleteBooking: (referenceNumber) => {
    try {
      console.log('🗑️ حذف حجز من الذاكرة برقم مرجعي:', referenceNumber);
      
      // البحث عن الحجز بالرقم المرجعي
      let keyToDelete = null;
      for (const [key, booking] of Object.entries(memoryBookings)) {
        if (booking.referenceNumber === referenceNumber) {
          keyToDelete = key;
          break;
        }
      }
      
      if (keyToDelete) {
        delete memoryBookings[keyToDelete];
        console.log('✅ تم حذف الحجز من الذاكرة. المتبقي:', Object.keys(memoryBookings).length);
        return true;
      }
      
      console.log('❌ لم يتم العثور على حجز بهذا الرقم المرجعي');
      return false;
    } catch (error) {
      console.error('خطأ في حذف الحجز من الذاكرة:', error);
      return false;
    }
  },

  searchBookingsByPhone: (phone) => {
    try {
      const results = [];
      
      for (const [key, booking] of Object.entries(memoryBookings)) {
        if (booking.phone === phone) {
          results.push({ key, booking });
        }
      }
      
      return results;
    } catch (error) {
      console.error('خطأ في البحث عن حجوزات المعلم:', error);
      return [];
    }
  },

  // Time slots
  getTimeSlots: () => {
    if (memoryTimeSlots.length === 0) {
      initializeMemoryData();
    }
    return memoryTimeSlots;
  },

  // Debug info
  getStats: () => {
    return {
      bookings: Object.keys(memoryBookings).length,
      classrooms: memoryClassrooms.length,
      timeSlots: memoryTimeSlots.length,
      lastAccess: new Date().toISOString()
    };
  },

  // Reset all data (for testing)
  reset: () => {
    memoryBookings = {};
    memoryClassrooms = [];
    memoryTimeSlots = [];
    initializeMemoryData();
    console.log('🔄 تم إعادة تعيين قاعدة البيانات');
  }
};

module.exports = memoryDb;