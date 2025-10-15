// أداة ترحيل البيانات من النظام المحلي إلى Firebase
const fs = require('fs').promises;
const path = require('path');
const firebaseAdminService = require('./services/firebaseAdmin');

class DataMigration {
  constructor() {
    this.localDataPath = path.join(__dirname, 'data');
    this.persistentDataPath = path.join(__dirname, 'persistent-data');
  }

  // قراءة البيانات المحلية
  async readLocalData() {
    try {
      console.log('📂 قراءة البيانات المحلية...');
      
      const localData = {};

      // قراءة الحجوزات
      try {
        const bookingsPath = path.join(this.localDataPath, 'bookings.json');
        const bookingsData = await fs.readFile(bookingsPath, 'utf8');
        localData.bookings = JSON.parse(bookingsData);
        console.log(`📅 تم العثور على ${Object.keys(localData.bookings).length} حجز`);
      } catch (error) {
        console.log('ℹ️ لم يتم العثور على ملف الحجوزات المحلي');
      }

      // قراءة الحجوزات من المجلد الدائم
      try {
        const persistentBookingsPath = path.join(this.persistentDataPath, 'bookings.json');
        const persistentBookingsData = await fs.readFile(persistentBookingsPath, 'utf8');
        const persistentBookings = JSON.parse(persistentBookingsData);
        
        if (localData.bookings) {
          // دمج البيانات
          localData.bookings = { ...localData.bookings, ...persistentBookings };
        } else {
          localData.bookings = persistentBookings;
        }
        
        console.log(`📅 تم العثور على ${Object.keys(persistentBookings).length} حجز إضافي من البيانات الدائمة`);
      } catch (error) {
        console.log('ℹ️ لم يتم العثور على ملف الحجوزات الدائم');
      }

      // قراءة القاعات
      try {
        const classroomsPath = path.join(this.localDataPath, 'classrooms.json');
        const classroomsData = await fs.readFile(classroomsPath, 'utf8');
        localData.classrooms = JSON.parse(classroomsData);
        console.log(`🏫 تم العثور على ${Object.keys(localData.classrooms).length} قاعة`);
      } catch (error) {
        console.log('ℹ️ لم يتم العثور على ملف القاعات');
        // إنشاء بيانات القاعات الافتراضية
        localData.classrooms = this.createDefaultClassrooms();
      }

      // قراءة الفترات الزمنية
      try {
        const timeslotsPath = path.join(this.localDataPath, 'timeslots.json');
        const timeslotsData = await fs.readFile(timeslotsPath, 'utf8');
        localData.timeslots = JSON.parse(timeslotsData);
        console.log(`⏰ تم العثور على ${Object.keys(localData.timeslots).length} فترة زمنية`);
      } catch (error) {
        console.log('ℹ️ لم يتم العثور على ملف الفترات الزمنية');
        // إنشاء بيانات الفترات الافتراضية
        localData.timeslots = this.createDefaultTimeSlots();
      }

      return localData;
    } catch (error) {
      console.error('❌ خطأ في قراءة البيانات المحلية:', error);
      throw error;
    }
  }

  // إنشاء قاعات افتراضية
  createDefaultClassrooms() {
    const classrooms = {};
    
    // القاعة الذكية
    classrooms['smart-classroom'] = {
      name_ar: 'القاعة الذكية',
      name_en: 'Smart Classroom',
      type: 'smart',
      capacity: 35,
      equipment: ['projector', 'smartboard', 'sound_system'],
      isActive: true
    };

    // ساحة الطابور
    classrooms['assembly-area'] = {
      name_ar: 'ساحة الطابور القديم',
      name_en: 'Old Assembly Area',
      type: 'assembly',
      capacity: 200,
      equipment: ['sound_system'],
      isActive: true
    };

    // الصفوف من 5-10 (3 شعب لكل صف)
    for (let grade = 5; grade <= 10; grade++) {
      for (let section = 1; section <= 3; section++) {
        const sectionLetter = ['أ', 'ب', 'ج'][section - 1];
        const key = `grade-${grade}-section-${section}`;
        
        classrooms[key] = {
          name_ar: `الصف ${grade}${sectionLetter}`,
          name_en: `Grade ${grade} Section ${section}`,
          type: 'classroom',
          grade: grade,
          section: sectionLetter,
          capacity: 30,
          equipment: ['projector'],
          isActive: true
        };
      }
    }

    // الصفوف من 11-12 (6 شعب لكل صف)
    for (let grade = 11; grade <= 12; grade++) {
      for (let section = 1; section <= 6; section++) {
        const sectionLetter = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][section - 1];
        const key = `grade-${grade}-section-${section}`;
        
        classrooms[key] = {
          name_ar: `الصف ${grade}${sectionLetter}`,
          name_en: `Grade ${grade} Section ${section}`,
          type: 'classroom',
          grade: grade,
          section: sectionLetter,
          capacity: 25,
          equipment: ['projector'],
          isActive: true
        };
      }
    }

    console.log(`🏫 تم إنشاء ${Object.keys(classrooms).length} قاعة افتراضية`);
    return classrooms;
  }

  // إنشاء فترات زمنية افتراضية
  createDefaultTimeSlots() {
    const timeslots = {};
    
    const slots = [
      { slot_number: 1, name_ar: 'الحصة الأولى', start_time: '07:30', end_time: '08:15', type: 'academic', order: 1 },
      { slot_number: 2, name_ar: 'الحصة الثانية', start_time: '08:15', end_time: '09:00', type: 'academic', order: 2 },
      { slot_number: 3, name_ar: 'الحصة الثالثة', start_time: '09:00', end_time: '09:45', type: 'academic', order: 3 },
      { slot_number: 4, name_ar: 'الحصة الرابعة', start_time: '10:15', end_time: '11:00', type: 'academic', order: 4 },
      { slot_number: 5, name_ar: 'الحصة الخامسة', start_time: '11:00', end_time: '11:45', type: 'academic', order: 5 },
      { slot_number: 6, name_ar: 'الحصة السادسة', start_time: '11:45', end_time: '12:30', type: 'academic', order: 6 },
      { slot_number: 7, name_ar: 'الحصة السابعة', start_time: '12:30', end_time: '13:15', type: 'academic', order: 7 },
      { slot_number: 8, name_ar: 'الحصة الثامنة', start_time: '13:15', end_time: '14:00', type: 'academic', order: 8 },
      { slot_number: 9, name_ar: 'الطابور', start_time: '07:00', end_time: '07:30', type: 'assembly', order: 0 },
      { slot_number: 10, name_ar: 'النشاط', start_time: '14:00', end_time: '14:30', type: 'activity', order: 9 }
    ];

    slots.forEach(slot => {
      timeslots[`slot-${slot.slot_number}`] = {
        ...slot,
        name_en: `Period ${slot.slot_number}`,
        duration_minutes: 45,
        is_bookable: true
      };
    });

    console.log(`⏰ تم إنشاء ${Object.keys(timeslots).length} فترة زمنية افتراضية`);
    return timeslots;
  }

  // ترحيل البيانات إلى Firebase
  async migrateToFirebase() {
    try {
      console.log('🚀 بدء عملية الترحيل إلى Firebase...');
      
      // قراءة البيانات المحلية
      const localData = await this.readLocalData();
      
      // التأكد من تهيئة Firebase
      firebaseAdminService.initialize();
      
      // ترحيل البيانات
      const result = await firebaseAdminService.migrateFromLocalData(localData);
      
      if (result.success) {
        console.log('✅ تم الترحيل بنجاح!');
        console.log(`📊 تم ترحيل ${result.operations} عنصر`);
        
        // إنشاء نسخة احتياطية من البيانات المحلية
        await this.createBackup(localData);
        
        return result;
      } else {
        throw new Error('فشل في عملية الترحيل');
      }
    } catch (error) {
      console.error('❌ خطأ في الترحيل:', error);
      throw error;
    }
  }

  // إنشاء نسخة احتياطية
  async createBackup(localData) {
    try {
      const backupDir = path.join(__dirname, 'migration-backup');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      
      await fs.writeFile(backupFile, JSON.stringify(localData, null, 2));
      console.log(`💾 تم إنشاء نسخة احتياطية: ${backupFile}`);
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
    }
  }

  // اختبار الاتصال بـ Firebase
  async testConnection() {
    try {
      console.log('🔍 اختبار الاتصال بـ Firebase...');
      
      firebaseAdminService.initialize();
      
      // محاولة قراءة الحجوزات
      const bookings = await firebaseAdminService.getAllBookings();
      console.log(`✅ تم الاتصال بنجاح - العثور على ${bookings.length} حجز`);
      
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بـ Firebase:', error.message);
      return false;
    }
  }
}

// تشغيل الترحيل إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  const migration = new DataMigration();
  
  (async () => {
    try {
      console.log('🌟 أداة ترحيل بيانات زاوية 2025 إلى Firebase');
      console.log('════════════════════════════════════════════════');
      
      // اختبار الاتصال أولاً
      const connected = await migration.testConnection();
      
      if (!connected) {
        console.log('⚠️ يرجى التأكد من:');
        console.log('1. إضافة ملف firebase-admin-key.json');
        console.log('2. تكوين متغيرات البيئة بشكل صحيح');
        console.log('3. إنشاء مشروع Firebase وتفعيل Firestore');
        process.exit(1);
      }
      
      // تشغيل الترحيل
      await migration.migrateToFirebase();
      
      console.log('════════════════════════════════════════════════');
      console.log('🎉 تم الانتهاء من عملية الترحيل بنجاح!');
      
    } catch (error) {
      console.error('💥 فشل في عملية الترحيل:', error);
      process.exit(1);
    }
  })();
}

module.exports = DataMigration;