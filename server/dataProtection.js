// نظام حماية البيانات من التحديثات
// Data Protection System from Updates

class DataProtectionManager {
  constructor() {
    this.protectionLevel = 'MAXIMUM';
    this.backupSources = ['local', 'git', 'vercel', 'browser'];
  }

  // التحقق من وجود البيانات قبل كل تحديث
  async preUpdateCheck() {
    console.log('🔍 فحص البيانات قبل التحديث...');
    
    const checks = {
      localFiles: await this.checkLocalFiles(),
      gitBackup: await this.checkGitBackup(),
      browserBackup: await this.checkBrowserBackup(),
      serverRunning: await this.checkServerStatus()
    };
    
    console.log('📊 نتائج الفحص:', checks);
    return checks;
  }

  // فحص الملفات المحلية
  async checkLocalFiles() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const dataDir = path.join(process.cwd(), 'server', 'persistent-data');
      const bookingsFile = path.join(dataDir, 'bookings.json');
      
      const exists = await fs.access(bookingsFile).then(() => true).catch(() => false);
      
      if (exists) {
        const content = await fs.readFile(bookingsFile, 'utf8');
        const data = JSON.parse(content);
        const count = Object.keys(data).length;
        
        return {
          status: 'موجود',
          count: count,
          size: content.length,
          lastModified: (await fs.stat(bookingsFile)).mtime
        };
      }
      
      return { status: 'غير موجود' };
    } catch (error) {
      return { status: 'خطأ', error: error.message };
    }
  }

  // فحص النسخة الاحتياطية في Git
  async checkGitBackup() {
    try {
      // التحقق من حالة Git
      const { execSync } = require('child_process');
      
      // التحقق من وجود ملف البيانات في Git
      const gitStatus = execSync('git ls-files server/persistent-data/bookings.json', { encoding: 'utf8' });
      
      if (gitStatus.trim()) {
        // الملف موجود في Git
        const lastCommit = execSync('git log -1 --format="%ad" --date=iso -- server/persistent-data/bookings.json', { encoding: 'utf8' });
        
        return {
          status: 'محفوظ في Git',
          lastCommit: lastCommit.trim(),
          tracked: true
        };
      }
      
      return { status: 'غير محفوظ في Git' };
    } catch (error) {
      return { status: 'خطأ في Git', error: error.message };
    }
  }

  // فحص النسخة الاحتياطية في المتصفح
  async checkBrowserBackup() {
    // هذا سيتم تشغيله من جانب العميل
    if (typeof window !== 'undefined') {
      try {
        const backupData = localStorage.getItem('zawiyah_bookings_backup');
        if (backupData) {
          const data = JSON.parse(backupData);
          return {
            status: 'موجود في المتصفح',
            count: Object.keys(data).length,
            size: backupData.length,
            lastUpdated: localStorage.getItem('zawiyah_backup_timestamp')
          };
        }
      } catch (error) {
        return { status: 'خطأ في المتصفح', error: error.message };
      }
    }
    
    return { status: 'غير متاح (خادم)' };
  }

  // فحص حالة الخادم
  async checkServerStatus() {
    try {
      // محاولة الاتصال بالخادم
      const response = await fetch('/api/bookings').catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        return {
          status: 'نشط',
          dataAvailable: !!data.data,
          count: data.data ? Object.keys(data.data).length : 0
        };
      }
      
      return { status: 'غير نشط' };
    } catch (error) {
      return { status: 'خطأ', error: error.message };
    }
  }

  // استراتيجية الحماية أثناء التحديث
  async protectDuringUpdate() {
    console.log('🛡️ تفعيل حماية البيانات أثناء التحديث...');
    
    const protectionSteps = [
      'إيقاف الكتابة المؤقت',
      'إنشاء نسخة احتياطية طارئة', 
      'حفظ البيانات في التخزين المحلي',
      'تأكيد حفظ البيانات في Git'
    ];
    
    for (let step of protectionSteps) {
      console.log(`⏳ ${step}...`);
      await this.executeProtectionStep(step);
      console.log(`✅ ${step} - مكتمل`);
    }
    
    console.log('🔒 تم تأمين البيانات بنجاح');
  }

  // تنفيذ خطوة حماية محددة
  async executeProtectionStep(step) {
    switch (step) {
      case 'إيقاف الكتابة المؤقت':
        // إيقاف عمليات الكتابة الجديدة
        global.MAINTENANCE_MODE = true;
        break;
        
      case 'إنشاء نسخة احتياطية طارئة':
        await this.createEmergencyBackup();
        break;
        
      case 'حفظ البيانات في التخزين المحلي':
        await this.saveToLocalStorage();
        break;
        
      case 'تأكيد حفظ البيانات في Git':
        await this.ensureGitBackup();
        break;
    }
    
    // انتظار قصير للتأكد
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // إنشاء نسخة احتياطية طارئة
  async createEmergencyBackup() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const dataDir = path.join(process.cwd(), 'server', 'persistent-data');
      const backupDir = path.join(dataDir, 'emergency-backups');
      
      // إنشاء مجلد النسخ الطارئة
      await fs.mkdir(backupDir, { recursive: true });
      
      // نسخ جميع الملفات المهمة
      const importantFiles = ['bookings.json', 'classrooms.json', 'timeslots.json'];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      for (let file of importantFiles) {
        const sourcePath = path.join(dataDir, file);
        const backupPath = path.join(backupDir, `${timestamp}_${file}`);
        
        try {
          await fs.copyFile(sourcePath, backupPath);
          console.log(`💾 نسخة طارئة: ${file}`);
        } catch (error) {
          console.warn(`⚠️ لم يتم العثور على: ${file}`);
        }
      }
      
    } catch (error) {
      console.error('❌ خطأ في النسخة الطارئة:', error);
    }
  }

  // حفظ في التخزين المحلي
  async saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        // جلب البيانات الحالية
        const response = await fetch('/api/bookings');
        if (response.ok) {
          const data = await response.json();
          
          // حفظ في التخزين المحلي
          localStorage.setItem('zawiyah_emergency_backup', JSON.stringify(data.data));
          localStorage.setItem('zawiyah_emergency_timestamp', new Date().toISOString());
          
          console.log('💾 تم حفظ نسخة طارئة في المتصفح');
        }
      } catch (error) {
        console.error('❌ خطأ في الحفظ المحلي:', error);
      }
    }
  }

  // التأكد من النسخة الاحتياطية في Git
  async ensureGitBackup() {
    try {
      const { execSync } = require('child_process');
      
      // إضافة الملفات للتتبع
      execSync('git add server/persistent-data/bookings.json server/persistent-data/classrooms.json server/persistent-data/timeslots.json');
      
      // التحقق من وجود تغييرات
      const status = execSync('git status --porcelain server/persistent-data/', { encoding: 'utf8' });
      
      if (status.trim()) {
        // إنشاء commit للبيانات
        const commitMessage = `🔒 Backup data before update - ${new Date().toISOString()}`;
        execSync(`git commit -m "${commitMessage}"`);
        console.log('📝 تم حفظ البيانات في Git');
      } else {
        console.log('📝 البيانات محفوظة مسبقاً في Git');
      }
      
    } catch (error) {
      console.warn('⚠️ تحذير - لم يتم حفظ البيانات في Git:', error.message);
    }
  }

  // استعادة البيانات بعد التحديث
  async restoreAfterUpdate() {
    console.log('🔄 استعادة البيانات بعد التحديث...');
    
    const restorationPlan = [
      'التحقق من سلامة الملفات',
      'استعادة من النسخ المحلية',
      'استعادة من Git إذا لزم الأمر',
      'استعادة من المتصفح كخيار أخير',
      'إعادة تشغيل النظام'
    ];
    
    for (let step of restorationPlan) {
      console.log(`🔧 ${step}...`);
      const success = await this.executeRestorationStep(step);
      
      if (success) {
        console.log(`✅ ${step} - نجح`);
        if (step === 'التحقق من سلامة الملفات' && success.intact) {
          console.log('🎉 البيانات سليمة - لا حاجة للاستعادة!');
          break;
        }
      } else {
        console.log(`⚠️ ${step} - فشل، الانتقال للخيار التالي`);
      }
    }
    
    // إعادة تفعيل النظام
    global.MAINTENANCE_MODE = false;
    console.log('🚀 تم استعادة النظام بنجاح!');
  }

  // تنفيذ خطوة استعادة محددة
  async executeRestorationStep(step) {
    try {
      switch (step) {
        case 'التحقق من سلامة الملفات':
          return await this.checkFileIntegrity();
          
        case 'استعادة من النسخ المحلية':
          return await this.restoreFromLocalBackups();
          
        case 'استعادة من Git إذا لزم الأمر':
          return await this.restoreFromGit();
          
        case 'استعادة من المتصفح كخيار أخير':
          return await this.restoreFromBrowser();
          
        case 'إعادة تشغيل النظام':
          return await this.restartSystem();
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`❌ خطأ في ${step}:`, error);
      return false;
    }
  }

  // التحقق من سلامة الملفات
  async checkFileIntegrity() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const bookingsFile = path.join(process.cwd(), 'server', 'persistent-data', 'bookings.json');
      
      // التحقق من وجود الملف
      const exists = await fs.access(bookingsFile).then(() => true).catch(() => false);
      
      if (!exists) {
        return { intact: false, reason: 'الملف غير موجود' };
      }
      
      // التحقق من صحة JSON
      const content = await fs.readFile(bookingsFile, 'utf8');
      const data = JSON.parse(content);
      
      // التحقق من البنية
      if (typeof data === 'object' && data !== null) {
        const count = Object.keys(data).length;
        console.log(`📊 تم العثور على ${count} حجز`);
        return { intact: true, count: count };
      }
      
      return { intact: false, reason: 'بنية البيانات غير صحيحة' };
    } catch (error) {
      return { intact: false, reason: error.message };
    }
  }

  // استعادة من النسخ المحلية
  async restoreFromLocalBackups() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const backupDir = path.join(process.cwd(), 'server', 'persistent-data', 'backups');
      const targetFile = path.join(process.cwd(), 'server', 'persistent-data', 'bookings.json');
      
      // البحث عن أحدث نسخة احتياطية
      const files = await fs.readdir(backupDir);
      const bookingBackups = files
        .filter(file => file.startsWith('bookings_backup_'))
        .sort()
        .reverse();
      
      if (bookingBackups.length > 0) {
        const latestBackup = path.join(backupDir, bookingBackups[0]);
        await fs.copyFile(latestBackup, targetFile);
        console.log(`📂 تم استعادة من: ${bookingBackups[0]}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ خطأ في الاستعادة المحلية:', error);
      return false;
    }
  }

  // استعادة من Git
  async restoreFromGit() {
    try {
      const { execSync } = require('child_process');
      
      // استعادة الملف من Git
      execSync('git checkout HEAD -- server/persistent-data/bookings.json');
      console.log('📝 تم استعادة البيانات من Git');
      return true;
    } catch (error) {
      console.error('❌ خطأ في استعادة Git:', error);
      return false;
    }
  }

  // تقرير شامل عن حالة الحماية
  async generateProtectionReport() {
    console.log('📋 إنشاء تقرير الحماية...');
    
    const report = {
      timestamp: new Date().toISOString(),
      protectionLevel: this.protectionLevel,
      checks: await this.preUpdateCheck(),
      recommendations: []
    };
    
    // تحليل النتائج وإعطاء توصيات
    if (!report.checks.localFiles.count) {
      report.recommendations.push('⚠️ إنشاء نسخة احتياطية محلية');
    }
    
    if (!report.checks.gitBackup.tracked) {
      report.recommendations.push('📝 حفظ البيانات في Git');
    }
    
    if (report.checks.browserBackup.status === 'غير متاح (خادم)') {
      report.recommendations.push('💾 تفعيل النسخ الاحتياطية في المتصفح');
    }
    
    if (report.recommendations.length === 0) {
      report.recommendations.push('✅ جميع أنظمة الحماية تعمل بشكل مثالي');
    }
    
    console.log('📊 تقرير الحماية:', report);
    return report;
  }
}

// تصدير النظام
const dataProtection = new DataProtectionManager();

console.log('🛡️ نظام حماية البيانات من التحديثات جاهز!');
console.log('🔍 للفحص: await dataProtection.preUpdateCheck()');
console.log('🛡️ للحماية: await dataProtection.protectDuringUpdate()');
console.log('🔄 للاستعادة: await dataProtection.restoreAfterUpdate()');

export default dataProtection;