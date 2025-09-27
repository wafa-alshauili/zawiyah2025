// Simple JSON file database for development
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CLASSROOMS_FILE = path.join(DATA_DIR, 'classrooms.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const TIMESLOTS_FILE = path.join(DATA_DIR, 'timeslots.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initializeFiles = () => {
  // Time slots
  if (!fs.existsSync(TIMESLOTS_FILE)) {
    const timeSlots = [
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
    fs.writeFileSync(TIMESLOTS_FILE, JSON.stringify(timeSlots, null, 2));
  }

  // Classrooms
  if (!fs.existsSync(CLASSROOMS_FILE)) {
    const classrooms = [
      { id: 1, name_ar: 'القاعة الذكية', type: 'smart', equipment: ['projector', 'smartboard', 'sound_system'], isActive: true },
      { id: 2, name_ar: 'ساحة الطابور القديم', type: 'assembly', capacity: 200, isActive: true }
    ];

    let id = 3;
    // Add grade classrooms (5-10: 3 sections each, 11-12: 6 sections each)
    const sections5to10 = ['أ', 'ب', 'ج'];
    const sections11to12 = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

    // Grades 5-10
    for (let grade = 5; grade <= 10; grade++) {
      sections5to10.forEach(section => {
        classrooms.push({
          id: id++,
          name_ar: `الصف ${grade}${section}`,
          type: 'classroom',
          grade: grade,
          section: section,
          capacity: 30,
          isActive: true
        });
      });
    }

    // Grades 11-12
    for (let grade = 11; grade <= 12; grade++) {
      sections11to12.forEach(section => {
        classrooms.push({
          id: id++,
          name_ar: `الصف ${grade}${section}`,
          type: 'classroom',
          grade: grade,
          section: section,
          capacity: 30,
          isActive: true
        });
      });
    }

    fs.writeFileSync(CLASSROOMS_FILE, JSON.stringify(classrooms, null, 2));
  }

  // Bookings
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({}, null, 2));
  }
};

// Helper functions to read/write data
const readData = (filename) => {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`خطأ في قراءة ${filename}:`, error);
    return [];
  }
};

const writeData = (filename, data) => {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`خطأ في كتابة ${filename}:`, error);
    return false;
  }
};

// Database operations
const db = {
  // Classrooms
  getClassrooms: () => readData(CLASSROOMS_FILE),
  
  getClassroomById: (id) => {
    const classrooms = readData(CLASSROOMS_FILE);
    return classrooms.find(c => c.id == id);
  },

  // Bookings (key-value format for compatibility with frontend)
  getBookings: () => {
    try {
      const data = readData(BOOKINGS_FILE);
      // إذا كان الملف يحتوي على مصفوفة، نحوله إلى object
      if (Array.isArray(data)) {
        const bookingsObject = {};
        data.forEach((booking, index) => {
          if (booking.key) {
            bookingsObject[booking.key] = booking;
          } else {
            // إنشاء key للبيانات القديمة
            const key = `${booking.room || 'room'}-${booking.day || 'day'}-${booking.period || 'period'}-${index}`;
            bookingsObject[key] = booking;
          }
        });
        // حفظ التحويل
        writeData(BOOKINGS_FILE, bookingsObject);
        return bookingsObject;
      }
      return data || {};
    } catch (error) {
      console.error('خطأ في جلب الحجوزات:', error);
      return {};
    }
  },
  
  addBooking: (key, booking) => {
    try {
      console.log('💾 حفظ حجز جديد:', key, booking);
      const bookings = db.getBookings();
      bookings[key] = booking;
      const success = writeData(BOOKINGS_FILE, bookings);
      console.log('✅ تم حفظ الحجز:', success);
      return success;
    } catch (error) {
      console.error('خطأ في إضافة الحجز:', error);
      return false;
    }
  },

  updateBooking: (key, booking) => {
    try {
      console.log('📝 تحديث حجز:', key, booking);
      const bookings = db.getBookings();
      if (bookings[key]) {
        bookings[key] = { ...bookings[key], ...booking, updatedAt: new Date().toISOString() };
        const success = writeData(BOOKINGS_FILE, bookings);
        console.log('✅ تم تحديث الحجز:', success);
        return success;
      }
      console.log('❌ لم يتم العثور على الحجز للتحديث');
      return false;
    } catch (error) {
      console.error('خطأ في تحديث الحجز:', error);
      return false;
    }
  },

  deleteBooking: (referenceNumber) => {
    try {
      console.log('🗑️ حذف حجز برقم مرجعي:', referenceNumber);
      const bookings = db.getBookings();
      
      // البحث عن الحجز بالرقم المرجعي
      let keyToDelete = null;
      for (const [key, booking] of Object.entries(bookings)) {
        if (booking.referenceNumber === referenceNumber) {
          keyToDelete = key;
          break;
        }
      }
      
      if (keyToDelete) {
        delete bookings[keyToDelete];
        const success = writeData(BOOKINGS_FILE, bookings);
        console.log('✅ تم حذف الحجز:', success);
        return success;
      }
      
      console.log('❌ لم يتم العثور على حجز بهذا الرقم المرجعي');
      return false;
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      return false;
    }
  },

  searchBookingsByPhone: (phone) => {
    try {
      const bookings = db.getBookings();
      const results = [];
      
      for (const [key, booking] of Object.entries(bookings)) {
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
  getTimeSlots: () => readData(TIMESLOTS_FILE)
};

// Initialize files on module load
initializeFiles();

module.exports = db;