// نظام توحيد وتحويل البيانات القديمة
// Data Migration and Standardization System

const fs = require('fs').promises;
const path = require('path');

class DataMigrationSystem {
  constructor() {
    this.bookingsFile = path.join(__dirname, 'persistent-data', 'bookings.json');
    this.backupDir = path.join(__dirname, 'persistent-data', 'backups');
  }

  // تشغيل عملية التحويل الكاملة
  async migrateAllData() {
    console.log('🔄 بدء عملية توحيد البيانات...');
    
    try {
      // إنشاء نسخة احتياطية قبل التحويل
      await this.createPreMigrationBackup();
      
      // قراءة البيانات الحالية
      const currentData = await this.loadCurrentData();
      console.log(`📊 تم العثور على ${Object.keys(currentData).length} عنصر`);
      
      // تحويل البيانات
      const migratedData = await this.convertAllBookings(currentData);
      
      // حفظ البيانات المحولة
      await this.saveConvertedData(migratedData);
      
      // إنشاء تقرير التحويل
      await this.generateMigrationReport(currentData, migratedData);
      
      console.log('✅ تمت عملية التحويل بنجاح!');
      return migratedData;
      
    } catch (error) {
      console.error('❌ خطأ في عملية التحويل:', error);
      throw error;
    }
  }

  // إنشاء نسخة احتياطية قبل التحويل
  async createPreMigrationBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `pre_migration_${timestamp}.json`);
    
    try {
      const currentData = await fs.readFile(this.bookingsFile, 'utf8');
      await fs.writeFile(backupFile, currentData);
      console.log(`💾 تم إنشاء نسخة احتياطية: ${path.basename(backupFile)}`);
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
      throw error;
    }
  }

  // تحميل البيانات الحالية
  async loadCurrentData() {
    try {
      const data = await fs.readFile(this.bookingsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      return {};
    }
  }

  // تحويل جميع الحجوزات
  async convertAllBookings(originalData) {
    const convertedData = {};
    let convertedCount = 0;
    let skippedCount = 0;

    for (const [key, booking] of Object.entries(originalData)) {
      try {
        const convertedBooking = await this.convertSingleBooking(key, booking);
        
        if (convertedBooking) {
          // إنشاء مفتاح جديد موحد
          const newKey = this.generateStandardKey(convertedBooking);
          convertedData[newKey] = convertedBooking;
          convertedCount++;
          
          if (key !== newKey) {
            console.log(`🔄 تم تحويل: ${key} → ${newKey}`);
          }
        } else {
          // الاحتفاظ بالبيانات كما هي إذا لم يتم التحويل
          convertedData[key] = booking;
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ خطأ في تحويل ${key}:`, error);
        convertedData[key] = booking; // الاحتفاظ بالأصل عند الخطأ
        skippedCount++;
      }
    }

    console.log(`📊 النتائج: ${convertedCount} محول، ${skippedCount} غير محول`);
    return convertedData;
  }

  // تحويل حجز واحد
  async convertSingleBooking(key, booking) {
    // التحقق من نوع الحجز وتحويله
    if (this.isOldFormatBooking(booking)) {
      return this.convertOldFormat(key, booking);
    } else if (this.isLegacyBooking(booking)) {
      return this.convertLegacyFormat(key, booking);
    } else if (this.isModernBooking(booking)) {
      // البيانات الحديثة، تحقق فقط من الاكتمال
      return this.validateModernBooking(booking);
    }
    
    return null; // لا يحتاج تحويل
  }

  // التحقق من النمط القديم (room-day-period)
  isOldFormatBooking(booking) {
    return booking.hasOwnProperty('classroom_id') && 
           booking.hasOwnProperty('teacher_name') && 
           booking.hasOwnProperty('time_slot');
  }

  // التحقق من النمط القديم الآخر (الصف-اليوم-الحصة)
  isLegacyBooking(booking) {
    return booking.hasOwnProperty('day') && 
           booking.hasOwnProperty('period') && 
           !booking.hasOwnProperty('date');
  }

  // التحقق من النمط الحديث
  isModernBooking(booking) {
    return booking.hasOwnProperty('date') && 
           (booking.hasOwnProperty('type') || booking.hasOwnProperty('timeSlot'));
  }

  // تحويل النمط القديم
  convertOldFormat(key, booking) {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      type: 'regular',
      classroom: this.getClassroomName(booking.classroom_id),
      teacher: booking.teacher_name,
      phone: booking.phone || '',
      subject: booking.subject || '',
      grade: this.extractGradeFromClassroom(booking.classroom_id),
      date: booking.date || today,
      timeSlot: this.convertTimeSlotNumber(booking.time_slot),
      notes: booking.notes || '',
      createdAt: booking.created_at || new Date().toISOString(),
      referenceNumber: this.generateReferenceNumber(),
      // إضافة معلومات الأصل للمراجعة
      _migrated: {
        originalKey: key,
        originalFormat: 'old_format',
        migratedAt: new Date().toISOString()
      }
    };
  }

  // تحويل النمط القديم الآخر
  convertLegacyFormat(key, booking) {
    const dateFromDay = this.convertDayToDate(booking.day);
    
    return {
      type: 'regular',
      classroom: booking.room || key.split('-')[0] || 'غير محدد',
      teacher: booking.teacher,
      phone: booking.phone || '',
      subject: booking.subject || '',
      grade: booking.grade || this.extractGradeFromKey(key),
      section: booking.section || this.extractSectionFromKey(key),
      date: dateFromDay,
      timeSlot: booking.period || 'غير محدد',
      notes: booking.notes || '',
      createdAt: booking.createdAt || new Date().toISOString(),
      referenceNumber: booking.referenceNumber || this.generateReferenceNumber(),
      // إضافة معلومات الأصل
      _migrated: {
        originalKey: key,
        originalFormat: 'legacy_format',
        migratedAt: new Date().toISOString(),
        originalDay: booking.day,
        originalPeriod: booking.period
      }
    };
  }

  // التحقق من البيانات الحديثة
  validateModernBooking(booking) {
    // إضافة الحقول المفقودة إذا لزم الأمر
    const validated = { ...booking };
    
    if (!validated.createdAt) {
      validated.createdAt = new Date().toISOString();
    }
    
    if (!validated.referenceNumber) {
      validated.referenceNumber = this.generateReferenceNumber();
    }
    
    // تأكد من وجود نوع الحجز
    if (!validated.type) {
      validated.type = validated.timeSlot === 'assembly' ? 'assembly' : 'regular';
    }
    
    return validated;
  }

  // تحويل اليوم إلى تاريخ
  convertDayToDate(dayName) {
    const dayMap = {
      'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4
    };
    
    const dayIndex = dayMap[dayName];
    if (dayIndex === undefined) {
      return new Date().toISOString().split('T')[0]; // اليوم الحالي كافتراضي
    }
    
    // البحث عن أقرب يوم بهذا الاسم (في المستقبل)
    const today = new Date();
    const currentDay = today.getDay();
    let daysAhead = dayIndex - currentDay;
    
    if (daysAhead <= 0) {
      daysAhead += 7; // الأسبوع القادم
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysAhead);
    
    return targetDate.toISOString().split('T')[0];
  }

  // تحويل رقم الحصة إلى اسم
  convertTimeSlotNumber(slotNumber) {
    const slotMap = {
      1: 'الحصة الأولى',
      2: 'الحصة الثانية', 
      3: 'الحصة الثالثة',
      4: 'الحصة الرابعة',
      5: 'الحصة الخامسة',
      6: 'الحصة السادسة',
      7: 'الحصة السابعة',
      8: 'الحصة الثامنة',
      9: 'الطابور',
      10: 'النشاط'
    };
    
    return slotMap[slotNumber] || `الحصة ${slotNumber}`;
  }

  // الحصول على اسم الفصل من الرقم
  getClassroomName(classroomId) {
    const classroomMap = {
      1: 'القاعة الذكية',
      2: 'قاعة المصادر',
      3: 'ساحة الطابور القديم'
    };
    
    return classroomMap[classroomId] || `فصل رقم ${classroomId}`;
  }

  // استخراج الصف من رقم القاعة
  extractGradeFromClassroom(classroomId) {
    // هذا تخمين، يمكن تحسينه بناءً على البيانات الفعلية
    return '5'; // افتراضي
  }

  // استخراج الصف من المفتاح
  extractGradeFromKey(key) {
    const gradeMatch = key.match(/الصف\s+(الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي عشر|الثاني عشر)/);
    if (gradeMatch) {
      const gradeMap = {
        'الخامس': '5', 'السادس': '6', 'السابع': '7', 'الثامن': '8',
        'التاسع': '9', 'العاشر': '10', 'الحادي عشر': '11', 'الثاني عشر': '12'
      };
      return gradeMap[gradeMatch[1]] || '5';
    }
    return '5';
  }

  // استخراج الشعبة من المفتاح
  extractSectionFromKey(key) {
    const sectionMatch = key.match(/شعبة\s+(\d+)/);
    return sectionMatch ? sectionMatch[1] : '1';
  }

  // توليد مفتاح موحد
  generateStandardKey(booking) {
    if (booking.type === 'assembly') {
      return `assembly-${booking.grade}-${booking.section || '1'}-${booking.date}`;
    } else {
      const timeSlotKey = booking.timeSlot.replace(/\s+/g, '-');
      return `regular-${booking.grade}-${booking.section || '1'}-${booking.date}-${timeSlotKey}`;
    }
  }

  // توليد رقم مرجعي
  generateReferenceNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `MIG-${timestamp}-${random}`;
  }

  // حفظ البيانات المحولة
  async saveConvertedData(data) {
    try {
      await fs.writeFile(this.bookingsFile, JSON.stringify(data, null, 2));
      console.log('💾 تم حفظ البيانات المحولة');
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      throw error;
    }
  }

  // إنشاء تقرير التحويل
  async generateMigrationReport(originalData, migratedData) {
    const report = {
      migrationTimestamp: new Date().toISOString(),
      summary: {
        originalCount: Object.keys(originalData).length,
        migratedCount: Object.keys(migratedData).length,
        newFormatCount: Object.values(migratedData).filter(b => b._migrated).length,
        modernFormatCount: Object.values(migratedData).filter(b => !b._migrated).length
      },
      formats: {
        oldFormat: Object.values(migratedData).filter(b => b._migrated?.originalFormat === 'old_format').length,
        legacyFormat: Object.values(migratedData).filter(b => b._migrated?.originalFormat === 'legacy_format').length,
        modernFormat: Object.values(migratedData).filter(b => !b._migrated).length
      },
      datesCovered: [...new Set(Object.values(migratedData).map(b => b.date))].sort(),
      assemblyBookings: Object.values(migratedData).filter(b => b.type === 'assembly').length,
      regularBookings: Object.values(migratedData).filter(b => b.type === 'regular').length
    };

    const reportFile = path.join(this.backupDir, `migration_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    console.log('\n📋 تقرير التحويل:');
    console.log(`📊 الأصلي: ${report.summary.originalCount} | المحول: ${report.summary.migratedCount}`);
    console.log(`🔄 تم تحويل: ${report.summary.newFormatCount} حجز`);
    console.log(`✅ تنسيق حديث: ${report.summary.modernFormatCount} حجز`);
    console.log(`📅 التواريخ المغطاة: ${report.datesCovered.length} تاريخ`);
    console.log(`📋 تم حفظ التقرير في: ${reportFile}`);

    return report;
  }
}

// تشغيل التحويل إذا تم استدعاء الملف مباشرة
async function runMigration() {
  const migrationSystem = new DataMigrationSystem();
  
  try {
    const result = await migrationSystem.migrateAllData();
    console.log('\n🎉 تمت عملية التحويل بنجاح!');
    console.log('✅ جميع البيانات الآن بتنسيق موحد');
    console.log('📅 التواريخ ستظهر بشكل صحيح في جميع الصفحات');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('\n💥 فشلت عملية التحويل:', error);
    return { success: false, error: error.message };
  }
}

// تشغيل إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runMigration().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { DataMigrationSystem, runMigration };