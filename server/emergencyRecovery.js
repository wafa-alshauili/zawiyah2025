// Emergency Data Recovery System - نظام استعادة البيانات الطارئ
// هذا الملف يقوم بتشغيل عملية استعادة فورية للحجوزات المفقودة

const fs = require('fs').promises;
const path = require('path');

class EmergencyRecovery {
  constructor() {
    this.recoveryLog = [];
  }

  async startRecovery() {
    console.log('🚨 بدء عملية الاستعادة الطارئة...');
    this.logRecovery('بدء عملية الاستعادة الطارئة');

    try {
      // الخطوة 1: فحص جميع مصادر البيانات
      const sources = await this.scanAllDataSources();
      console.log('📊 مصادر البيانات الموجودة:', sources);

      // الخطوة 2: استعادة من أفضل مصدر متاح
      const recoveredData = await this.recoverFromBestSource(sources);
      
      // الخطوة 3: إعادة إنشاء نظام التخزين
      await this.rebuildStorage(recoveredData);

      // الخطوة 4: إنشاء نسخة احتياطية جديدة
      await this.createEmergencyBackup(recoveredData);

      console.log('✅ تمت الاستعادة بنجاح!');
      return recoveredData;

    } catch (error) {
      console.error('❌ فشلت عملية الاستعادة:', error);
      this.logRecovery(`خطأ في الاستعادة: ${error.message}`);
      throw error;
    }
  }

  async scanAllDataSources() {
    const sources = {};

    try {
      // فحص الملف القديم في data/
      const oldFile = path.join(__dirname, 'data', 'bookings.json');
      if (await this.fileExists(oldFile)) {
        const oldData = JSON.parse(await fs.readFile(oldFile, 'utf8'));
        sources.oldFile = {
          path: oldFile,
          count: Object.keys(oldData).length,
          data: oldData,
          lastModified: (await fs.stat(oldFile)).mtime
        };
        console.log(`📁 العثور على ${Object.keys(oldData).length} حجز في الملف القديم`);
      }
    } catch (error) {
      console.log('⚠️ لم يتم العثور على ملف البيانات القديم');
    }

    try {
      // فحص memory-db
      const memoryDb = require('./memory-db.js');
      if (memoryDb && memoryDb.memoryBookings) {
        sources.memoryDb = {
          count: Object.keys(memoryDb.memoryBookings).length,
          data: memoryDb.memoryBookings
        };
        console.log(`💾 العثور على ${Object.keys(memoryDb.memoryBookings).length} حجز في الذاكرة`);
      }
    } catch (error) {
      console.log('⚠️ لم يتم العثور على بيانات في الذاكرة');
    }

    try {
      // فحص أي ملفات احتياطية مخفية
      const hiddenBackups = await this.findHiddenBackups();
      if (hiddenBackups.length > 0) {
        sources.hiddenBackups = hiddenBackups;
        console.log(`🔍 العثور على ${hiddenBackups.length} نسخة احتياطية مخفية`);
      }
    } catch (error) {
      console.log('⚠️ لم يتم العثور على نسخ احتياطية مخفية');
    }

    return sources;
  }

  async recoverFromBestSource(sources) {
    let recoveredData = {};

    // أولوية الاستعادة: الملف القديم -> الذاكرة -> النسخ المخفية
    if (sources.oldFile && sources.oldFile.count > 0) {
      console.log('🔄 استعادة من الملف القديم...');
      recoveredData = sources.oldFile.data;
      this.logRecovery(`استعادة ${sources.oldFile.count} حجز من الملف القديم`);
    } else if (sources.memoryDb && sources.memoryDb.count > 0) {
      console.log('🔄 استعادة من الذاكرة...');
      recoveredData = sources.memoryDb.data;
      this.logRecovery(`استعادة ${sources.memoryDb.count} حجز من الذاكرة`);
    } else if (sources.hiddenBackups && sources.hiddenBackups.length > 0) {
      console.log('🔄 استعادة من النسخ المخفية...');
      const latestBackup = sources.hiddenBackups[0];
      recoveredData = JSON.parse(await fs.readFile(latestBackup.path, 'utf8'));
      this.logRecovery(`استعادة من النسخة المخفية: ${latestBackup.path}`);
    }

    console.log(`📊 تم استعادة ${Object.keys(recoveredData).length} حجز`);
    return recoveredData;
  }

  async rebuildStorage(data) {
    console.log('🔧 إعادة بناء نظام التخزين...');

    // إنشاء مجلدات التخزين
    const dataDir = path.join(__dirname, 'persistent-data');
    const backupDir = path.join(dataDir, 'backups');
    
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(backupDir, { recursive: true });

    // إنشاء ملف البيانات الجديد
    const bookingsFile = path.join(dataDir, 'bookings.json');
    await fs.writeFile(bookingsFile, JSON.stringify(data, null, 2));

    console.log('✅ تم إعادة بناء نظام التخزين');
    this.logRecovery('إعادة بناء نظام التخزين');
  }

  async createEmergencyBackup(data) {
    console.log('💾 إنشاء نسخة احتياطية طارئة...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'persistent-data', 'backups');
    const backupFile = path.join(backupDir, `emergency_recovery_${timestamp}.json`);

    await fs.writeFile(backupFile, JSON.stringify({
      recoveryTimestamp: new Date().toISOString(),
      recoveryLog: this.recoveryLog,
      recoveredData: data
    }, null, 2));

    console.log(`💾 تم إنشاء نسخة احتياطية طارئة: ${backupFile}`);
    this.logRecovery('إنشاء نسخة احتياطية طارئة');
  }

  async findHiddenBackups() {
    const possiblePaths = [
      path.join(__dirname, 'data'),
      path.join(__dirname, '..', 'data'),
      path.join(__dirname, 'backups'),
      path.join(__dirname, '..', 'backups'),
      path.join(__dirname, '..', 'client', 'data')
    ];

    const backups = [];

    for (const searchPath of possiblePaths) {
      try {
        if (await this.fileExists(searchPath)) {
          const files = await fs.readdir(searchPath);
          for (const file of files) {
            if (file.includes('backup') && file.endsWith('.json')) {
              const fullPath = path.join(searchPath, file);
              const stats = await fs.stat(fullPath);
              backups.push({
                path: fullPath,
                name: file,
                lastModified: stats.mtime,
                size: stats.size
              });
            }
          }
        }
      } catch (error) {
        // تجاهل الأخطاء وتابع البحث
      }
    }

    return backups.sort((a, b) => b.lastModified - a.lastModified);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  logRecovery(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${message}`;
    this.recoveryLog.push(logEntry);
    console.log(`📝 ${logEntry}`);
  }

  async generateRecoveryReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'completed',
      recoveryLog: this.recoveryLog,
      nextSteps: [
        'تحقق من البيانات المستعادة',
        'تشغيل الخادم للتأكد من عمل النظام',
        'إجراء حجز تجريبي للتأكد',
        'مراقبة النظام لمدة 24 ساعة'
      ]
    };

    const reportFile = path.join(__dirname, 'persistent-data', 'recovery_report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    console.log('📋 تم إنشاء تقرير الاستعادة:', reportFile);
    return report;
  }
}

// تشغيل الاستعادة الطارئة
async function runEmergencyRecovery() {
  const recovery = new EmergencyRecovery();
  
  try {
    const recoveredData = await recovery.startRecovery();
    const report = await recovery.generateRecoveryReport();
    
    console.log('\n🎉 الاستعادة مكتملة!');
    console.log(`📊 تم استعادة ${Object.keys(recoveredData).length} حجز`);
    console.log('📋 راجع تقرير الاستعادة للتفاصيل الكاملة');
    
    return { success: true, data: recoveredData, report };
    
  } catch (error) {
    console.error('\n💥 فشلت الاستعادة الطارئة:', error);
    return { success: false, error: error.message };
  }
}

// تشغيل إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runEmergencyRecovery().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { EmergencyRecovery, runEmergencyRecovery };