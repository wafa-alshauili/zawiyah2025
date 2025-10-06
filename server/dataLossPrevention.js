// Data Loss Prevention System - نظام منع فقدان البيانات
// هذا النظام يراقب البيانات ويحميها من الفقدان

const fs = require('fs').promises;
const path = require('path');

class DataLossPreventionSystem {
  constructor() {
    this.monitoringInterval = null;
    this.lastKnownDataCount = 0;
    this.alertThreshold = 2; // تنبيه إذا فقد أكثر من حجزين
    this.checkInterval = 30000; // فحص كل 30 ثانية
    this.backupHistory = [];
  }

  // بدء مراقبة البيانات
  startMonitoring() {
    console.log('👁️ بدء مراقبة البيانات لمنع الفقدان...');
    
    // فحص أولي
    this.performHealthCheck();
    
    // مراقبة دورية
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);

    console.log(`✅ تم تفعيل المراقبة الدورية كل ${this.checkInterval/1000} ثانية`);
  }

  // إيقاف المراقبة
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ تم إيقاف مراقبة البيانات');
    }
  }

  // فحص صحة البيانات
  async performHealthCheck() {
    try {
      const currentData = await this.getCurrentBookingsData();
      const currentCount = Object.keys(currentData).length;
      
      // تحديث العداد في البداية
      if (this.lastKnownDataCount === 0) {
        this.lastKnownDataCount = currentCount;
        console.log(`📊 البيانات الحالية: ${currentCount} حجز`);
        return;
      }

      // فحص فقدان البيانات
      const dataLoss = this.lastKnownDataCount - currentCount;
      
      if (dataLoss > 0) {
        console.log(`⚠️ تم اكتشاف فقدان ${dataLoss} حجز!`);
        
        if (dataLoss >= this.alertThreshold) {
          await this.handleDataLossAlert(dataLoss, currentData);
        }
      } else if (dataLoss < 0) {
        console.log(`📈 تمت إضافة ${Math.abs(dataLoss)} حجز جديد`);
      }

      // إنشاء نسخة احتياطية تلقائية كل 100 فحص
      if (Math.random() < 0.01) { // 1% احتمال في كل فحص
        await this.createAutomaticBackup(currentData);
      }

      this.lastKnownDataCount = currentCount;

    } catch (error) {
      console.error('❌ خطأ في فحص صحة البيانات:', error);
    }
  }

  // معالجة تنبيه فقدان البيانات
  async handleDataLossAlert(lossCount, currentData) {
    console.log('🚨 تنبيه فقدان البيانات الحرج!');
    
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'DATA_LOSS_ALERT',
      severity: lossCount >= 5 ? 'CRITICAL' : 'WARNING',
      lossCount: lossCount,
      previousCount: this.lastKnownDataCount,
      currentCount: Object.keys(currentData).length,
      action: 'AUTOMATIC_RECOVERY_INITIATED'
    };

    // حفظ تنبيه الفقدان
    await this.logAlert(alert);

    // محاولة الاستعادة التلقائية
    await this.attemptAutoRecovery();

    // إرسال تنبيه للمطور (محاكاة)
    this.sendDeveloperAlert(alert);
  }

  // محاولة الاستعادة التلقائية
  async attemptAutoRecovery() {
    console.log('🔄 بدء الاستعادة التلقائية...');
    
    try {
      // البحث عن أحدث نسخة احتياطية
      const latestBackup = await this.findLatestBackup();
      
      if (latestBackup) {
        console.log(`📂 العثور على نسخة احتياطية: ${latestBackup.name}`);
        
        // استعادة البيانات
        const backupData = JSON.parse(await fs.readFile(latestBackup.path, 'utf8'));
        await this.restoreFromBackup(backupData);
        
        console.log('✅ تمت الاستعادة التلقائية بنجاح');
        return true;
      } else {
        console.log('⚠️ لم يتم العثور على نسخة احتياطية للاستعادة');
        return false;
      }
      
    } catch (error) {
      console.error('❌ فشلت الاستعادة التلقائية:', error);
      return false;
    }
  }

  // البحث عن أحدث نسخة احتياطية
  async findLatestBackup() {
    try {
      const backupDir = path.join(__dirname, 'persistent-data', 'backups');
      const files = await fs.readdir(backupDir);
      
      const backupFiles = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          backupFiles.push({
            name: file,
            path: filePath,
            lastModified: stats.mtime,
            size: stats.size
          });
        }
      }

      // ترتيب حسب التاريخ (الأحدث أولاً)
      backupFiles.sort((a, b) => b.lastModified - a.lastModified);
      
      return backupFiles.length > 0 ? backupFiles[0] : null;
      
    } catch (error) {
      console.error('خطأ في البحث عن النسخ الاحتياطية:', error);
      return null;
    }
  }

  // استعادة من النسخة الاحتياطية
  async restoreFromBackup(backupData) {
    const bookingsFile = path.join(__dirname, 'persistent-data', 'bookings.json');
    
    // إنشاء نسخة من الحالة الحالية قبل الاستعادة
    const currentData = await this.getCurrentBookingsData();
    const emergencyBackup = path.join(__dirname, 'persistent-data', 'backups', `pre_restore_${Date.now()}.json`);
    await fs.writeFile(emergencyBackup, JSON.stringify(currentData, null, 2));
    
    // استعادة البيانات
    await fs.writeFile(bookingsFile, JSON.stringify(backupData, null, 2));
    
    console.log(`💾 تم حفظ النسخة الحالية في: ${emergencyBackup}`);
    console.log('🔄 تمت استعادة البيانات من النسخة الاحتياطية');
  }

  // إنشاء نسخة احتياطية تلقائية
  async createAutomaticBackup(data) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(__dirname, 'persistent-data', 'backups', `auto_backup_${timestamp}.json`);
      
      await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
      
      this.backupHistory.push({
        timestamp: new Date().toISOString(),
        file: backupFile,
        count: Object.keys(data).length
      });

      // الاحتفاظ بآخر 20 نسخة تلقائية فقط
      if (this.backupHistory.length > 20) {
        const oldBackup = this.backupHistory.shift();
        try {
          await fs.unlink(oldBackup.file);
        } catch (error) {
          // تجاهل خطأ حذف الملف القديم
        }
      }

      console.log(`💾 تم إنشاء نسخة احتياطية تلقائية: ${path.basename(backupFile)}`);
      
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية التلقائية:', error);
    }
  }

  // الحصول على بيانات الحجوزات الحالية
  async getCurrentBookingsData() {
    try {
      const bookingsFile = path.join(__dirname, 'persistent-data', 'bookings.json');
      const data = await fs.readFile(bookingsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('خطأ في قراءة البيانات الحالية:', error);
      return {};
    }
  }

  // تسجيل التنبيهات
  async logAlert(alert) {
    try {
      const alertsFile = path.join(__dirname, 'persistent-data', 'alerts.json');
      
      let alerts = [];
      try {
        const existingAlerts = await fs.readFile(alertsFile, 'utf8');
        alerts = JSON.parse(existingAlerts);
      } catch (error) {
        // ملف التنبيهات غير موجود، سيتم إنشاؤه
      }

      alerts.push(alert);
      
      // الاحتفاظ بآخر 100 تنبيه فقط
      if (alerts.length > 100) {
        alerts = alerts.slice(-100);
      }

      await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));
      console.log('📝 تم تسجيل التنبيه في ملف السجلات');
      
    } catch (error) {
      console.error('خطأ في تسجيل التنبيه:', error);
    }
  }

  // إرسال تنبيه للمطور (محاكاة)
  sendDeveloperAlert(alert) {
    console.log('📧 إرسال تنبيه للمطور...');
    console.log(`🚨 ${alert.severity}: فقدان ${alert.lossCount} حجز في ${alert.timestamp}`);
    console.log('💡 يُنصح بفحص النظام فوراً');
  }

  // إنشاء تقرير صحة النظام
  async generateHealthReport() {
    try {
      const currentData = await this.getCurrentBookingsData();
      const backupDir = path.join(__dirname, 'persistent-data', 'backups');
      const backupFiles = await fs.readdir(backupDir);
      
      let alerts = [];
      try {
        const alertsFile = path.join(__dirname, 'persistent-data', 'alerts.json');
        const alertsData = await fs.readFile(alertsFile, 'utf8');
        alerts = JSON.parse(alertsData);
      } catch (error) {
        // لا توجد تنبيهات
      }

      const report = {
        timestamp: new Date().toISOString(),
        systemHealth: {
          status: alerts.length > 0 ? 'WARNING' : 'HEALTHY',
          currentBookings: Object.keys(currentData).length,
          lastKnownCount: this.lastKnownDataCount,
          monitoringActive: this.monitoringInterval !== null
        },
        backupSystem: {
          totalBackups: backupFiles.length,
          automaticBackups: this.backupHistory.length,
          latestBackup: this.backupHistory.length > 0 ? this.backupHistory[this.backupHistory.length - 1] : null
        },
        alertHistory: {
          totalAlerts: alerts.length,
          recentAlerts: alerts.slice(-5), // آخر 5 تنبيهات
          criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length
        }
      };

      const reportFile = path.join(__dirname, 'persistent-data', 'health_report.json');
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

      console.log('📋 تم إنشاء تقرير صحة النظام:', reportFile);
      return report;
      
    } catch (error) {
      console.error('خطأ في إنشاء تقرير الصحة:', error);
      return null;
    }
  }
}

// إنشاء instance واحد للنظام
const dataProtectionSystem = new DataLossPreventionSystem();

// تشغيل المراقبة عند تحميل الملف
dataProtectionSystem.startMonitoring();

// تصدير النظام
module.exports = dataProtectionSystem;

console.log('🛡️ نظام حماية البيانات من الفقدان جاهز!');
console.log('📊 المراقبة النشطة: كل 30 ثانية');
console.log('⚠️ تنبيه عند فقدان: 2+ حجوزات');
console.log('🔄 استعادة تلقائية: مفعلة');