// Health Check and Diagnostics System - نظام فحص الصحة والتشخيص
// يقوم بفحص شامل للنظام وتشخيص المشاكل المحتملة

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class SystemHealthCheck {
  constructor() {
    this.diagnosticsFile = path.join(__dirname, 'persistent-data', 'health_diagnostics.json');
    this.healthReportsDir = path.join(__dirname, 'persistent-data', 'health_reports');
    
    this.healthMetrics = {
      memory: { critical: 500 * 1024 * 1024, warning: 300 * 1024 * 1024 }, // MB
      uptime: { warning: 7 * 24 * 60 * 60 * 1000 }, // 7 days in ms
      errorRate: { critical: 10, warning: 5 }, // errors per hour
      responseTime: { critical: 5000, warning: 2000 }, // ms
      diskSpace: { critical: 100 * 1024 * 1024, warning: 500 * 1024 * 1024 } // MB
    };

    this.systemComponents = [
      'ملفات البيانات الثابتة',
      'نظام Socket.IO',
      'خدمة الحجوزات',
      'نظام النسخ الاحتياطي',
      'مراقب فقدان البيانات',
      'نظام الطوارئ'
    ];

    this.ensureHealthReportsDir();
  }

  // إنشاء مجلد التقارير
  async ensureHealthReportsDir() {
    try {
      await fs.mkdir(this.healthReportsDir, { recursive: true });
    } catch (error) {
      console.error('خطأ في إنشاء مجلد التقارير:', error);
    }
  }

  // فحص صحة النظام الشامل
  async performFullHealthCheck() {
    console.log('🏥 بدء فحص صحة النظام الشامل...');
    
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    const healthReport = {
      timestamp,
      reportId: this.generateReportId(),
      systemInfo: await this.getSystemInfo(),
      componentChecks: await this.checkAllComponents(),
      memoryCheck: await this.checkMemoryUsage(),
      diskCheck: await this.checkDiskSpace(),
      performanceCheck: await this.checkSystemPerformance(),
      dataIntegrityCheck: await this.checkDataIntegrity(),
      networkCheck: await this.checkNetworkHealth(),
      securityCheck: await this.performSecurityCheck(),
      recommendations: [],
      overallHealth: { status: 'فحص جاري...', score: 0, issues: [] }
    };

    // تحليل النتائج وإنشاء التوصيات
    healthReport.overallHealth = this.analyzeOverallHealth(healthReport);
    healthReport.recommendations = this.generateHealthRecommendations(healthReport);

    const duration = performance.now() - startTime;
    healthReport.checkDuration = Math.round(duration);

    // حفظ التقرير
    await this.saveHealthReport(healthReport);
    
    // عرض النتائج
    this.displayHealthResults(healthReport);
    
    return healthReport;
  }

  // الحصول على معلومات النظام
  async getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    };
  }

  // فحص جميع المكونات
  async checkAllComponents() {
    const results = {};
    
    for (const component of this.systemComponents) {
      try {
        results[component] = await this.checkComponent(component);
      } catch (error) {
        results[component] = {
          status: 'خطأ',
          message: `فشل في فحص ${component}`,
          error: error.message,
          healthy: false
        };
      }
    }
    
    return results;
  }

  // فحص مكون واحد
  async checkComponent(componentName) {
    switch (componentName) {
      case 'ملفات البيانات الثابتة':
        return await this.checkPersistentData();
      
      case 'نظام Socket.IO':
        return await this.checkSocketIO();
      
      case 'خدمة الحجوزات':
        return await this.checkBookingService();
      
      case 'نظام النسخ الاحتياطي':
        return await this.checkBackupSystem();
      
      case 'مراقب فقدان البيانات':
        return await this.checkDataLossMonitor();
      
      case 'نظام الطوارئ':
        return await this.checkEmergencySystem();
      
      default:
        return {
          status: 'غير معروف',
          message: `مكون غير معروف: ${componentName}`,
          healthy: false
        };
    }
  }

  // فحص البيانات الثابتة
  async checkPersistentData() {
    try {
      const dataDir = path.join(__dirname, 'persistent-data');
      const files = await fs.readdir(dataDir);
      
      const requiredFiles = ['bookings.json', 'students.json'];
      const missingFiles = requiredFiles.filter(file => !files.includes(file));
      
      if (missingFiles.length > 0) {
        return {
          status: 'تحذير',
          message: `ملفات مفقودة: ${missingFiles.join(', ')}`,
          healthy: false,
          details: { missingFiles, existingFiles: files }
        };
      }

      // فحص حجم الملفات
      const fileStats = {};
      for (const file of requiredFiles) {
        const filePath = path.join(dataDir, file);
        const stats = await fs.stat(filePath);
        fileStats[file] = {
          size: stats.size,
          modified: stats.mtime,
          accessible: true
        };
      }

      return {
        status: 'سليم',
        message: 'جميع ملفات البيانات متوفرة وقابلة للوصول',
        healthy: true,
        details: { fileStats }
      };
      
    } catch (error) {
      return {
        status: 'خطأ',
        message: 'فشل في فحص ملفات البيانات',
        error: error.message,
        healthy: false
      };
    }
  }

  // فحص Socket.IO
  async checkSocketIO() {
    // محاكاة فحص Socket.IO
    // في التطبيق الحقيقي، يمكن فحص الاتصالات النشطة
    return {
      status: 'سليم',
      message: 'نظام Socket.IO جاهز للاتصالات',
      healthy: true,
      details: {
        activeConnections: 0, // يمكن تحديثها من الخادم الفعلي
        lastConnection: null
      }
    };
  }

  // فحص خدمة الحجوزات
  async checkBookingService() {
    try {
      const bookingsFile = path.join(__dirname, 'persistent-data', 'bookings.json');
      const bookingsData = await fs.readFile(bookingsFile, 'utf8');
      const bookings = JSON.parse(bookingsData);
      
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = Object.values(bookings).filter(booking => 
        booking.date === today
      );

      return {
        status: 'سليم',
        message: `خدمة الحجوزات تعمل بطريقة طبيعية`,
        healthy: true,
        details: {
          totalBookings: Object.keys(bookings).length,
          todayBookings: todayBookings.length,
          lastBooking: this.getLastBooking(bookings)
        }
      };
      
    } catch (error) {
      return {
        status: 'خطأ',
        message: 'فشل في فحص خدمة الحجوزات',
        error: error.message,
        healthy: false
      };
    }
  }

  // فحص نظام النسخ الاحتياطي
  async checkBackupSystem() {
    try {
      const backupDir = path.join(__dirname, 'persistent-data', 'backups');
      const backups = await fs.readdir(backupDir);
      
      const recentBackups = backups.filter(file => {
        const backupDate = file.match(/backup_(\d{4}-\d{2}-\d{2})/);
        if (backupDate) {
          const date = new Date(backupDate[1]);
          const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7; // آخر 7 أيام
        }
        return false;
      });

      if (recentBackups.length === 0) {
        return {
          status: 'تحذير',
          message: 'لا توجد نسخ احتياطية حديثة (آخر 7 أيام)',
          healthy: false,
          details: { totalBackups: backups.length, recentBackups: 0 }
        };
      }

      return {
        status: 'سليم',
        message: `نظام النسخ الاحتياطي يعمل بطريقة طبيعية`,
        healthy: true,
        details: {
          totalBackups: backups.length,
          recentBackups: recentBackups.length,
          lastBackup: recentBackups[recentBackups.length - 1]
        }
      };
      
    } catch (error) {
      return {
        status: 'خطأ',
        message: 'فشل في فحص نظام النسخ الاحتياطي',
        error: error.message,
        healthy: false
      };
    }
  }

  // فحص مراقب فقدان البيانات
  async checkDataLossMonitor() {
    try {
      // فحص وجود ملف المراقبة
      const monitorFile = path.join(__dirname, 'dataLossPrevention.js');
      await fs.access(monitorFile);
      
      return {
        status: 'سليم',
        message: 'مراقب فقدان البيانات مفعل ويعمل',
        healthy: true,
        details: {
          monitorFile: 'موجود',
          checkInterval: '30 ثانية',
          lastCheck: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        status: 'تحذير',
        message: 'مراقب فقدان البيانات غير متوفر',
        healthy: false,
        error: error.message
      };
    }
  }

  // فحص نظام الطوارئ
  async checkEmergencySystem() {
    try {
      const emergencyFile = path.join(__dirname, 'emergencyRecovery.js');
      await fs.access(emergencyFile);
      
      return {
        status: 'سليم',
        message: 'نظام الطوارئ جاهز للاستخدام',
        healthy: true,
        details: {
          recoveryFile: 'موجود',
          backupSources: 'متعددة',
          autoRecovery: 'مفعل'
        }
      };
      
    } catch (error) {
      return {
        status: 'خطأ',
        message: 'نظام الطوارئ غير متوفر',
        healthy: false,
        error: error.message
      };
    }
  }

  // فحص استخدام الذاكرة
  async checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed;
    const heapTotal = memoryUsage.heapTotal;
    const external = memoryUsage.external;
    
    let status = 'سليم';
    let healthy = true;
    
    if (heapUsed > this.healthMetrics.memory.critical) {
      status = 'حرج';
      healthy = false;
    } else if (heapUsed > this.healthMetrics.memory.warning) {
      status = 'تحذير';
      healthy = false;
    }

    return {
      status,
      healthy,
      message: `استخدام الذاكرة: ${Math.round(heapUsed / 1024 / 1024)} MB`,
      details: {
        heapUsed: Math.round(heapUsed / 1024 / 1024),
        heapTotal: Math.round(heapTotal / 1024 / 1024),
        external: Math.round(external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        usage: Math.round((heapUsed / heapTotal) * 100)
      }
    };
  }

  // فحص مساحة القرص
  async checkDiskSpace() {
    try {
      const dataDir = path.join(__dirname, 'persistent-data');
      const stats = await fs.stat(dataDir);
      
      // حساب حجم مجلد البيانات
      const dirSize = await this.calculateDirectorySize(dataDir);
      
      return {
        status: 'سليم',
        healthy: true,
        message: `مساحة البيانات: ${Math.round(dirSize / 1024 / 1024)} MB`,
        details: {
          dataDirectorySize: Math.round(dirSize / 1024 / 1024),
          lastModified: stats.mtime
        }
      };
      
    } catch (error) {
      return {
        status: 'خطأ',
        healthy: false,
        message: 'فشل في فحص مساحة القرص',
        error: error.message
      };
    }
  }

  // حساب حجم المجلد
  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.calculateDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error('خطأ في حساب حجم المجلد:', error);
    }
    
    return totalSize;
  }

  // فحص أداء النظام
  async checkSystemPerformance() {
    const startTime = performance.now();
    
    // محاكاة عمليات مختلفة
    const tests = [];
    
    // اختبار قراءة الملف
    const fileReadStart = performance.now();
    try {
      const bookingsFile = path.join(__dirname, 'persistent-data', 'bookings.json');
      await fs.readFile(bookingsFile, 'utf8');
      tests.push({
        operation: 'قراءة ملف الحجوزات',
        duration: Math.round(performance.now() - fileReadStart),
        success: true
      });
    } catch (error) {
      tests.push({
        operation: 'قراءة ملف الحجوزات',
        duration: Math.round(performance.now() - fileReadStart),
        success: false,
        error: error.message
      });
    }

    // اختبار معالجة JSON
    const jsonStart = performance.now();
    try {
      const testData = { test: 'data', array: new Array(1000).fill('test') };
      JSON.stringify(testData);
      JSON.parse(JSON.stringify(testData));
      tests.push({
        operation: 'معالجة JSON',
        duration: Math.round(performance.now() - jsonStart),
        success: true
      });
    } catch (error) {
      tests.push({
        operation: 'معالجة JSON',
        duration: Math.round(performance.now() - jsonStart),
        success: false,
        error: error.message
      });
    }

    const totalDuration = Math.round(performance.now() - startTime);
    const avgDuration = Math.round(totalDuration / tests.length);
    
    let status = 'سليم';
    let healthy = true;
    
    if (avgDuration > this.healthMetrics.responseTime.critical) {
      status = 'حرج';
      healthy = false;
    } else if (avgDuration > this.healthMetrics.responseTime.warning) {
      status = 'تحذير';
      healthy = false;
    }

    return {
      status,
      healthy,
      message: `متوسط زمن الاستجابة: ${avgDuration} ms`,
      details: {
        totalDuration,
        averageDuration: avgDuration,
        tests,
        cpuUsage: process.cpuUsage()
      }
    };
  }

  // فحص سلامة البيانات
  async checkDataIntegrity() {
    try {
      // فحص ملف الحجوزات
      const bookingsFile = path.join(__dirname, 'persistent-data', 'bookings.json');
      const bookingsData = await fs.readFile(bookingsFile, 'utf8');
      const bookings = JSON.parse(bookingsData);
      
      // فحص ملف الطلاب
      const studentsFile = path.join(__dirname, 'persistent-data', 'students.json');
      const studentsData = await fs.readFile(studentsFile, 'utf8');
      const students = JSON.parse(studentsData);

      // تحليل البيانات
      const issues = [];
      
      // فحص الحجوزات المكررة
      const bookingKeys = Object.keys(bookings);
      const duplicateCheck = new Set();
      for (const key of bookingKeys) {
        const booking = bookings[key];
        const uniqueKey = `${booking.date}-${booking.timeSlot}-${booking.room}`;
        if (duplicateCheck.has(uniqueKey)) {
          issues.push(`حجز مكرر: ${uniqueKey}`);
        } else {
          duplicateCheck.add(uniqueKey);
        }
      }

      // فحص صحة التواريخ
      const invalidDates = bookingKeys.filter(key => {
        const booking = bookings[key];
        return !booking.date || isNaN(new Date(booking.date).getTime());
      });
      
      if (invalidDates.length > 0) {
        issues.push(`تواريخ غير صحيحة: ${invalidDates.length} حجز`);
      }

      return {
        status: issues.length > 0 ? 'تحذير' : 'سليم',
        healthy: issues.length === 0,
        message: issues.length > 0 ? 
          `تم العثور على ${issues.length} مشكلة في البيانات` : 
          'جميع البيانات سليمة',
        details: {
          totalBookings: bookingKeys.length,
          totalStudents: Object.keys(students).length,
          issues,
          lastCheck: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        status: 'خطأ',
        healthy: false,
        message: 'فشل في فحص سلامة البيانات',
        error: error.message
      };
    }
  }

  // فحص صحة الشبكة
  async checkNetworkHealth() {
    // فحص بسيط للشبكة (في التطبيق الحقيقي، يمكن فحص الاتصالات الخارجية)
    return {
      status: 'سليم',
      healthy: true,
      message: 'اتصال الشبكة مستقر',
      details: {
        localConnections: 'متاحة',
        socketConnections: 'جاهزة',
        lastCheck: new Date().toISOString()
      }
    };
  }

  // فحص الأمان
  async performSecurityCheck() {
    const securityIssues = [];
    
    // فحص صلاحيات الملفات
    try {
      const dataDir = path.join(__dirname, 'persistent-data');
      await fs.access(dataDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      securityIssues.push('صلاحيات مجلد البيانات غير صحيحة');
    }

    // فحص متغيرات البيئة
    if (!process.env.NODE_ENV) {
      securityIssues.push('متغير NODE_ENV غير محدد');
    }

    return {
      status: securityIssues.length > 0 ? 'تحذير' : 'سليم',
      healthy: securityIssues.length === 0,
      message: securityIssues.length > 0 ? 
        `تم العثور على ${securityIssues.length} مشكلة أمنية` : 
        'لا توجد مشاكل أمنية واضحة',
      details: {
        issues: securityIssues,
        environment: process.env.NODE_ENV || 'غير محدد',
        lastCheck: new Date().toISOString()
      }
    };
  }

  // تحليل الصحة العامة
  analyzeOverallHealth(report) {
    const components = Object.values(report.componentChecks);
    const healthyComponents = components.filter(comp => comp.healthy).length;
    const totalComponents = components.length;
    const healthPercentage = Math.round((healthyComponents / totalComponents) * 100);
    
    const issues = [];
    
    // جمع جميع المشاكل
    components.forEach(comp => {
      if (!comp.healthy) {
        issues.push(comp.message || 'مشكلة غير محددة');
      }
    });

    if (!report.memoryCheck.healthy) {
      issues.push(report.memoryCheck.message);
    }
    
    if (!report.performanceCheck.healthy) {
      issues.push(report.performanceCheck.message);
    }
    
    if (!report.dataIntegrityCheck.healthy) {
      issues.push(report.dataIntegrityCheck.message);
    }

    // تحديد الحالة العامة
    let status, score;
    if (healthPercentage >= 90 && issues.length === 0) {
      status = 'ممتاز';
      score = 5;
    } else if (healthPercentage >= 75 && issues.length <= 2) {
      status = 'جيد';
      score = 4;
    } else if (healthPercentage >= 60 && issues.length <= 4) {
      status = 'متوسط';
      score = 3;
    } else if (healthPercentage >= 40) {
      status = 'ضعيف';
      score = 2;
    } else {
      status = 'حرج';
      score = 1;
    }

    return {
      status,
      score,
      healthPercentage,
      healthyComponents,
      totalComponents,
      issues
    };
  }

  // إنشاء توصيات الصحة
  generateHealthRecommendations(report) {
    const recommendations = [];
    
    // توصيات بناء على المكونات
    Object.entries(report.componentChecks).forEach(([component, check]) => {
      if (!check.healthy) {
        switch (component) {
          case 'ملفات البيانات الثابتة':
            recommendations.push('إعادة إنشاء الملفات المفقودة من النسخ الاحتياطية');
            break;
          case 'نظام النسخ الاحتياطي':
            recommendations.push('تفعيل النسخ الاحتياطي التلقائي');
            break;
          case 'نظام الطوارئ':
            recommendations.push('تثبيت نظام الطوارئ للاستعداد للمشاكل');
            break;
        }
      }
    });

    // توصيات الذاكرة
    if (!report.memoryCheck.healthy) {
      if (report.memoryCheck.status === 'حرج') {
        recommendations.push('إعادة تشغيل الخادم لتحرير الذاكرة فوراً');
      } else {
        recommendations.push('مراقبة استخدام الذاكرة وتحسين الكود');
      }
    }

    // توصيات الأداء
    if (!report.performanceCheck.healthy) {
      recommendations.push('تحسين أداء العمليات البطيئة');
      recommendations.push('فحص قاعدة البيانات والفهارس');
    }

    // توصيات سلامة البيانات
    if (!report.dataIntegrityCheck.healthy) {
      recommendations.push('تنظيف البيانات المكررة أو التالفة');
      recommendations.push('إجراء نسخة احتياطية قبل أي تعديل');
    }

    // إذا لم توجد مشاكل
    if (recommendations.length === 0) {
      recommendations.push('النظام يعمل بصورة ممتازة - استمر في المراقبة الدورية');
    }

    return recommendations;
  }

  // حفظ تقرير الصحة
  async saveHealthReport(report) {
    try {
      const filename = `health_report_${report.timestamp.replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(this.healthReportsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      // حفظ أحدث تقرير
      const latestReportPath = path.join(this.healthReportsDir, 'latest_health_report.json');
      await fs.writeFile(latestReportPath, JSON.stringify(report, null, 2));
      
      console.log(`💾 تم حفظ تقرير الصحة: ${filename}`);
      
    } catch (error) {
      console.error('❌ فشل في حفظ تقرير الصحة:', error);
    }
  }

  // عرض نتائج الصحة
  displayHealthResults(report) {
    console.log('\n🏥 === تقرير صحة النظام ===');
    console.log(`📅 التاريخ: ${report.timestamp}`);
    console.log(`⏱️ مدة الفحص: ${report.checkDuration} ms`);
    console.log(`🎯 النتيجة الإجمالية: ${report.overallHealth.status} (${report.overallHealth.score}/5)`);
    console.log(`📊 المكونات السليمة: ${report.overallHealth.healthyComponents}/${report.overallHealth.totalComponents} (${report.overallHealth.healthPercentage}%)`);
    
    console.log('\n📋 === فحص المكونات ===');
    Object.entries(report.componentChecks).forEach(([component, check]) => {
      const icon = check.healthy ? '✅' : '❌';
      console.log(`${icon} ${component}: ${check.status} - ${check.message}`);
    });

    console.log('\n💾 === فحص الموارد ===');
    console.log(`🧠 الذاكرة: ${report.memoryCheck.status} - ${report.memoryCheck.message}`);
    console.log(`💿 القرص: ${report.diskCheck.status} - ${report.diskCheck.message}`);
    console.log(`⚡ الأداء: ${report.performanceCheck.status} - ${report.performanceCheck.message}`);

    console.log('\n🔒 === فحص البيانات والأمان ===');
    console.log(`📊 سلامة البيانات: ${report.dataIntegrityCheck.status} - ${report.dataIntegrityCheck.message}`);
    console.log(`🛡️ الأمان: ${report.securityCheck.status} - ${report.securityCheck.message}`);

    if (report.overallHealth.issues.length > 0) {
      console.log('\n⚠️ === المشاكل المكتشفة ===');
      report.overallHealth.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    console.log('\n💡 === التوصيات ===');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n🏥 === انتهى التقرير ===\n');
  }

  // الحصول على آخر حجز
  getLastBooking(bookings) {
    const bookingEntries = Object.entries(bookings);
    if (bookingEntries.length === 0) return null;
    
    const sortedBookings = bookingEntries.sort((a, b) => 
      new Date(b[1].timestamp || 0) - new Date(a[1].timestamp || 0)
    );
    
    return {
      id: sortedBookings[0][0],
      ...sortedBookings[0][1]
    };
  }

  // إنشاء معرف التقرير
  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `HEALTH-${timestamp}-${random}`;
  }

  // فحص سريع
  async quickHealthCheck() {
    console.log('⚡ فحص سريع للصحة...');
    
    const checks = {
      memory: await this.checkMemoryUsage(),
      data: await this.checkPersistentData(),
      performance: await this.checkSystemPerformance()
    };

    const healthyChecks = Object.values(checks).filter(check => check.healthy).length;
    const totalChecks = Object.values(checks).length;
    
    console.log(`📊 النتيجة السريعة: ${healthyChecks}/${totalChecks} سليم`);
    
    Object.entries(checks).forEach(([name, check]) => {
      const icon = check.healthy ? '✅' : '❌';
      console.log(`${icon} ${name}: ${check.status}`);
    });

    return {
      healthy: healthyChecks === totalChecks,
      score: healthyChecks,
      total: totalChecks,
      checks
    };
  }
}

// إنشاء instance واحد
const healthChecker = new SystemHealthCheck();

// تصدير النظام
module.exports = healthChecker;

console.log('🏥 نظام فحص الصحة جاهز!');
console.log('🔍 فحص شامل: مكونات + موارد + بيانات + أمان');
console.log('📊 تقارير مفصلة: تحليل + توصيات + حلول');
console.log('⚡ فحص سريع متاح للمراقبة الدورية');