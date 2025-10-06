// Persistent Storage System for Zawiyah2025
// نظام التخزين الدائم لزاوية 2025 - لا يُحذف أبداً

const fs = require('fs').promises;
const path = require('path');

class PersistentStorage {
  constructor() {
    this.dataDir = path.join(__dirname, 'persistent-data');
    this.bookingsFile = path.join(this.dataDir, 'bookings.json');
    this.classroomsFile = path.join(this.dataDir, 'classrooms.json');
    this.timeslotsFile = path.join(this.dataDir, 'timeslots.json');
    this.backupDir = path.join(this.dataDir, 'backups');
    
    this.syncQueue = [];
    this.isInitialized = false;
    
    this.init();
  }

  // تهيئة النظام وإنشاء المجلدات المطلوبة
  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // إنشاء ملفات البيانات الأساسية إذا لم تكن موجودة
      await this.initializeDataFiles();
      
      // بدء المزامنة التلقائية
      this.startAutoSync();
      
      this.isInitialized = true;
      console.log('✅ تم تهيئة نظام التخزين الدائم');
    } catch (error) {
      console.error('❌ خطأ في تهيئة نظام التخزين:', error);
    }
  }

  // إنشاء ملفات البيانات الأساسية
  async initializeDataFiles() {
    const defaultBookings = {};
    const defaultClassrooms = this.getDefaultClassrooms();
    const defaultTimeSlots = this.getDefaultTimeSlots();

    // إنشاء ملف الحجوزات
    if (!await this.fileExists(this.bookingsFile)) {
      await this.writeJsonFile(this.bookingsFile, defaultBookings);
    }

    // إنشاء ملف القاعات
    if (!await this.fileExists(this.classroomsFile)) {
      await this.writeJsonFile(this.classroomsFile, defaultClassrooms);
    }

    // إنشاء ملف الحصص
    if (!await this.fileExists(this.timeslotsFile)) {
      await this.writeJsonFile(this.timeslotsFile, defaultTimeSlots);
    }
  }

  // فحص وجود الملف
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // كتابة ملف JSON مع النسخ الاحتياطي
  async writeJsonFile(filePath, data) {
    try {
      // إنشاء نسخة احتياطية إذا كان الملف موجود
      if (await this.fileExists(filePath)) {
        await this.createBackup(filePath);
      }

      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, jsonData, 'utf8');
      
      console.log(`💾 تم حفظ البيانات: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error(`❌ خطأ في كتابة الملف ${filePath}:`, error);
      return false;
    }
  }

  // قراءة ملف JSON
  async readJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ خطأ في قراءة الملف ${filePath}:`, error);
      return null;
    }
  }

  // إنشاء نسخة احتياطية
  async createBackup(filePath) {
    try {
      const fileName = path.basename(filePath, '.json');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${fileName}_backup_${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFileName);
      
      await fs.copyFile(filePath, backupPath);
      
      // الاحتفاظ بآخر 10 نسخ احتياطية فقط
      await this.cleanOldBackups(fileName);
      
      console.log(`📂 تم إنشاء نسخة احتياطية: ${backupFileName}`);
    } catch (error) {
      console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
    }
  }

  // تنظيف النسخ الاحتياطية القديمة
  async cleanOldBackups(filePrefix) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`${filePrefix}_backup_`))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: null
        }));

      // الحصول على معلومات تاريخ كل ملف
      for (let file of backupFiles) {
        file.stats = await fs.stat(file.path);
      }

      // ترتيب حسب التاريخ (الأحدث أولاً)
      backupFiles.sort((a, b) => b.stats.mtime - a.stats.mtime);

      // حذف الملفات الزائدة عن 10
      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        for (let file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`🗑️ تم حذف النسخة الاحتياطية القديمة: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في تنظيف النسخ الاحتياطية:', error);
    }
  }

  // بدء المزامنة التلقائية كل 5 ثوان
  startAutoSync() {
    setInterval(async () => {
      if (this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
    }, 5000);

    // حفظ دوري كل دقيقة
    setInterval(async () => {
      await this.forceSyncAll();
    }, 60000);
  }

  // معالجة قائمة المزامنة
  async processSyncQueue() {
    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (let operation of operations) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('❌ خطأ في تنفيذ عملية المزامنة:', error);
      }
    }
  }

  // تنفيذ عملية مزامنة
  async executeOperation(operation) {
    const { type, data, filePath } = operation;
    
    switch (type) {
      case 'save':
        await this.writeJsonFile(filePath, data);
        break;
      case 'backup':
        await this.createBackup(filePath);
        break;
      default:
        console.warn('⚠️ نوع عملية غير معروف:', type);
    }
  }

  // إضافة عملية للقائمة
  addToSyncQueue(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now()
    });
  }

  // === طرق إدارة الحجوزات ===

  async getAllBookings() {
    return await this.readJsonFile(this.bookingsFile) || {};
  }

  async saveAllBookings(bookings) {
    const success = await this.writeJsonFile(this.bookingsFile, bookings);
    if (success) {
      // إشعار جميع العملاء المتصلين
      this.notifyClientsDataChanged('bookings-updated', bookings);
    }
    return success;
  }

  async addBooking(bookingData) {
    const allBookings = await this.getAllBookings();
    allBookings[bookingData.referenceNumber] = {
      ...bookingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const success = await this.saveAllBookings(allBookings);
    if (success) {
      this.notifyClientsDataChanged('booking-created', bookingData);
    }
    return success;
  }

  async updateBooking(referenceNumber, updateData) {
    const allBookings = await this.getAllBookings();
    if (allBookings[referenceNumber]) {
      allBookings[referenceNumber] = {
        ...allBookings[referenceNumber],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      const success = await this.saveAllBookings(allBookings);
      if (success) {
        this.notifyClientsDataChanged('booking-updated', allBookings[referenceNumber]);
      }
      return success;
    }
    return false;
  }

  async deleteBooking(referenceNumber) {
    const allBookings = await this.getAllBookings();
    if (allBookings[referenceNumber]) {
      const deletedBooking = allBookings[referenceNumber];
      delete allBookings[referenceNumber];
      
      const success = await this.saveAllBookings(allBookings);
      if (success) {
        this.notifyClientsDataChanged('booking-deleted', { referenceNumber, data: deletedBooking });
      }
      return success;
    }
    return false;
  }

  // === طرق إدارة القاعات ===

  async getAllClassrooms() {
    return await this.readJsonFile(this.classroomsFile) || [];
  }

  async saveAllClassrooms(classrooms) {
    return await this.writeJsonFile(this.classroomsFile, classrooms);
  }

  // === طرق إدارة الحصص ===

  async getAllTimeSlots() {
    return await this.readJsonFile(this.timeslotsFile) || [];
  }

  async saveAllTimeSlots(timeSlots) {
    return await this.writeJsonFile(this.timeslotsFile, timeSlots);
  }

  // === مزامنة إجبارية ===

  async forceSyncAll() {
    try {
      // إنشاء نسخ احتياطية لجميع الملفات
      const files = [this.bookingsFile, this.classroomsFile, this.timeslotsFile];
      
      for (let file of files) {
        if (await this.fileExists(file)) {
          await this.createBackup(file);
        }
      }
      
      console.log('💾 تم تنفيذ المزامنة الإجبارية');
    } catch (error) {
      console.error('❌ خطأ في المزامنة الإجبارية:', error);
    }
  }

  // إشعار العملاء المتصلين
  notifyClientsDataChanged(event, data) {
    // سيتم تنفيذ هذا عبر Socket.IO في الملف الرئيسي
    if (global.io) {
      global.io.emit(event, data);
      console.log(`📡 تم إرسال إشعار ${event} لجميع العملاء`);
    }
  }

  // البيانات الافتراضية للقاعات
  getDefaultClassrooms() {
    const classrooms = [
      { id: 1, name_ar: 'القاعة الذكية', type: 'smart', equipment: ['projector', 'smartboard', 'sound_system'], isActive: true },
      { id: 2, name_ar: 'قاعة المصادر', type: 'resource_center', capacity: 25, equipment: ['computers', 'group_tables'], isActive: true },
      { id: 3, name_ar: 'ساحة الطابور القديم', type: 'assembly', capacity: 200, isActive: true }
    ];

    let id = 4;
    const gradeNames = {
      5: 'الخامس', 6: 'السادس', 7: 'السابع', 8: 'الثامن', 
      9: 'التاسع', 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر'
    };

    // الصفوف 5-10 (3 شعب لكل صف)
    for (let grade = 5; grade <= 10; grade++) {
      for (let section = 1; section <= 3; section++) {
        classrooms.push({
          id: id++,
          name_ar: `الصف ${gradeNames[grade]} - الشعبة ${section}`,
          type: 'classroom',
          grade: grade,
          section: section,
          capacity: 30,
          isActive: true
        });
      }
    }

    // الصفوف 11-12 (6 شعب لكل صف)
    for (let grade = 11; grade <= 12; grade++) {
      for (let section = 1; section <= 6; section++) {
        classrooms.push({
          id: id++,
          name_ar: `الصف ${gradeNames[grade]} - الشعبة ${section}`,
          type: 'classroom',
          grade: grade,
          section: section,
          capacity: 25,
          isActive: true
        });
      }
    }

    return classrooms;
  }

  // البيانات الافتراضية للحصص
  getDefaultTimeSlots() {
    return [
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

  // إحصائيات النظام
  async getSystemStats() {
    const bookings = await this.getAllBookings();
    const classrooms = await this.getAllClassrooms();
    const timeSlots = await this.getAllTimeSlots();

    return {
      bookingsCount: Object.keys(bookings).length,
      classroomsCount: classrooms.length,
      timeSlotsCount: timeSlots.length,
      lastSync: new Date().toISOString(),
      storageInitialized: this.isInitialized,
      backupsCount: await this.getBackupsCount()
    };
  }

  // عدد النسخ الاحتياطية
  async getBackupsCount() {
    try {
      const files = await fs.readdir(this.backupDir);
      return files.length;
    } catch {
      return 0;
    }
  }
}

module.exports = PersistentStorage;