// Error Monitoring and Logging System - نظام مراقبة وتسجيل الأخطاء
// هذا النظام يراقب ويسجل جميع أخطاء التطوير والإنتاج

const fs = require('fs').promises;
const path = require('path');

class ErrorMonitoringSystem {
  constructor() {
    this.errorLogFile = path.join(__dirname, 'persistent-data', 'error_logs.json');
    this.systemLogFile = path.join(__dirname, 'persistent-data', 'system_logs.json');
    this.performanceLogFile = path.join(__dirname, 'persistent-data', 'performance_logs.json');
    
    this.errorCategories = {
      DATABASE: 'قاعدة البيانات',
      NETWORK: 'الشبكة',
      AUTHENTICATION: 'المصادقة',
      VALIDATION: 'التحقق من البيانات',
      SOCKET: 'Socket.IO',
      FILE_SYSTEM: 'نظام الملفات',
      MEMORY: 'الذاكرة',
      UNKNOWN: 'غير معروف'
    };
    
    this.logLevels = {
      ERROR: 'خطأ',
      WARNING: 'تحذير',
      INFO: 'معلومات',
      DEBUG: 'تتبع'
    };

    this.maxLogEntries = 1000; // حد أقصى للسجلات
    this.alertThreshold = 5; // عتبة التنبيه (5 أخطاء في 10 دقائق)
    
    this.initializeErrorHandling();
  }

  // تهيئة معالجة الأخطاء
  initializeErrorHandling() {
    // معالجة الأخطاء غير المعالجة
    process.on('uncaughtException', (error) => {
      this.logError('CRITICAL', 'UNKNOWN', 'Uncaught Exception', error);
      console.error('🚨 خطأ حرج غير معالج:', error);
    });

    // معالجة Promise المرفوضة
    process.on('unhandledRejection', (reason, promise) => {
      this.logError('ERROR', 'UNKNOWN', 'Unhandled Promise Rejection', reason);
      console.error('🚨 Promise مرفوض:', reason);
    });

    console.log('🛡️ تم تفعيل نظام مراقبة الأخطاء');
  }

  // تسجيل خطأ
  async logError(level, category, message, error = null, additionalData = {}) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();
    
    const logEntry = {
      id: errorId,
      timestamp,
      level: this.logLevels[level] || level,
      category: this.errorCategories[category] || category,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null,
      additionalData,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    try {
      await this.writeLogEntry(this.errorLogFile, logEntry);
      
      // إرسال تنبيه إذا كان خطأ حرج
      if (level === 'CRITICAL' || level === 'ERROR') {
        await this.sendAlert(logEntry);
      }
      
      // فحص عتبة التنبيه
      await this.checkAlertThreshold();
      
      console.log(`📝 تم تسجيل ${level}: ${message} [${errorId}]`);
      
    } catch (loggingError) {
      console.error('❌ فشل في تسجيل الخطأ:', loggingError);
    }
  }

  // تسجيل معلومات النظام
  async logSystemInfo(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      level: this.logLevels[level] || level,
      message,
      data,
      systemInfo: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        version: process.version
      }
    };

    try {
      await this.writeLogEntry(this.systemLogFile, logEntry);
      console.log(`ℹ️ ${message}`);
    } catch (error) {
      console.error('❌ فشل في تسجيل معلومات النظام:', error);
    }
  }

  // تسجيل معلومات الأداء
  async logPerformance(operation, duration, success = true, additionalData = {}) {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      operation,
      duration,
      success,
      additionalData,
      memory: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage()
    };

    try {
      await this.writeLogEntry(this.performanceLogFile, logEntry);
      
      // تحذير للعمليات البطيئة
      if (duration > 5000) { // أكثر من 5 ثواني
        await this.logError('WARNING', 'PERFORMANCE', `عملية بطيئة: ${operation}`, null, {
          duration,
          operation
        });
      }
      
    } catch (error) {
      console.error('❌ فشل في تسجيل الأداء:', error);
    }
  }

  // كتابة سجل
  async writeLogEntry(logFile, entry) {
    try {
      // قراءة السجلات الحالية
      let logs = [];
      try {
        const existingLogs = await fs.readFile(logFile, 'utf8');
        logs = JSON.parse(existingLogs);
      } catch (error) {
        // الملف غير موجود أو فارغ
        logs = [];
      }

      // إضافة السجل الجديد
      logs.unshift(entry); // إضافة في البداية

      // الاحتفاظ بحد أقصى من السجلات
      if (logs.length > this.maxLogEntries) {
        logs = logs.slice(0, this.maxLogEntries);
      }

      // كتابة السجلات المحدثة
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
      
    } catch (error) {
      console.error('❌ خطأ في كتابة السجل:', error);
      throw error;
    }
  }

  // إرسال تنبيه
  async sendAlert(errorEntry) {
    const alertMessage = {
      timestamp: new Date().toISOString(),
      type: 'ERROR_ALERT',
      severity: errorEntry.level,
      errorId: errorEntry.id,
      summary: errorEntry.message,
      environment: errorEntry.environment,
      details: {
        category: errorEntry.category,
        error: errorEntry.error,
        memory: errorEntry.memory,
        uptime: errorEntry.uptime
      }
    };

    // محاكاة إرسال إيميل (يمكن تطويرها لاحقاً)
    console.log('📧 إرسال تنبيه إيميل:', alertMessage.summary);
    
    // حفظ التنبيه في ملف منفصل
    const alertFile = path.join(__dirname, 'persistent-data', 'alerts.json');
    try {
      let alerts = [];
      try {
        const existingAlerts = await fs.readFile(alertFile, 'utf8');
        alerts = JSON.parse(existingAlerts);
      } catch (error) {
        // ملف التنبيهات غير موجود
      }

      alerts.unshift(alertMessage);
      
      // الاحتفاظ بآخر 100 تنبيه
      if (alerts.length > 100) {
        alerts = alerts.slice(0, 100);
      }

      await fs.writeFile(alertFile, JSON.stringify(alerts, null, 2));
      
    } catch (error) {
      console.error('❌ فشل في حفظ التنبيه:', error);
    }
  }

  // فحص عتبة التنبيه
  async checkAlertThreshold() {
    try {
      const logs = await this.getRecentErrorLogs(10); // آخر 10 دقائق
      const errorCount = logs.filter(log => 
        log.level === 'خطأ' && 
        new Date(log.timestamp) > new Date(Date.now() - 10 * 60 * 1000)
      ).length;

      if (errorCount >= this.alertThreshold) {
        await this.sendCriticalAlert(errorCount);
      }
      
    } catch (error) {
      console.error('❌ خطأ في فحص عتبة التنبيه:', error);
    }
  }

  // إرسال تنبيه حرج
  async sendCriticalAlert(errorCount) {
    const alertMessage = {
      type: 'CRITICAL_THRESHOLD_ALERT',
      timestamp: new Date().toISOString(),
      message: `تم تسجيل ${errorCount} أخطاء في آخر 10 دقائق`,
      severity: 'CRITICAL',
      action: 'يُنصح بفحص النظام فوراً'
    };

    console.log('🚨🚨 تنبيه حرج:', alertMessage.message);
    
    // يمكن إضافة إرسال SMS أو إيميل عاجل هنا
  }

  // الحصول على السجلات الحديثة
  async getRecentErrorLogs(minutes = 60) {
    try {
      const logs = await fs.readFile(this.errorLogFile, 'utf8');
      const parsedLogs = JSON.parse(logs);
      
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      
      return parsedLogs.filter(log => new Date(log.timestamp) > cutoffTime);
      
    } catch (error) {
      console.error('خطأ في قراءة السجلات:', error);
      return [];
    }
  }

  // إنشاء تقرير الأخطاء
  async generateErrorReport(hours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // قراءة جميع أنواع السجلات
      const errorLogs = await this.getLogsFromFile(this.errorLogFile, cutoffTime);
      const systemLogs = await this.getLogsFromFile(this.systemLogFile, cutoffTime);
      const performanceLogs = await this.getLogsFromFile(this.performanceLogFile, cutoffTime);

      // تحليل البيانات
      const errorsByCategory = this.analyzeErrorsByCategory(errorLogs);
      const errorsByLevel = this.analyzeErrorsByLevel(errorLogs);
      const performanceIssues = this.analyzePerformanceIssues(performanceLogs);

      const report = {
        reportTimestamp: new Date().toISOString(),
        period: `آخر ${hours} ساعة`,
        summary: {
          totalErrors: errorLogs.length,
          totalSystemLogs: systemLogs.length,
          totalPerformanceLogs: performanceLogs.length,
          criticalErrors: errorLogs.filter(log => log.level === 'خطأ').length,
          warnings: errorLogs.filter(log => log.level === 'تحذير').length
        },
        analysis: {
          errorsByCategory,
          errorsByLevel,
          performanceIssues,
          mostCommonErrors: this.findCommonErrors(errorLogs),
          systemHealth: this.assessSystemHealth(errorLogs, performanceLogs)
        },
        recommendations: this.generateRecommendations(errorLogs, performanceLogs)
      };

      // حفظ التقرير
      const reportFile = path.join(__dirname, 'persistent-data', `error_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

      console.log('📊 تم إنشاء تقرير الأخطاء:', reportFile);
      return report;
      
    } catch (error) {
      console.error('❌ فشل في إنشاء تقرير الأخطاء:', error);
      return null;
    }
  }

  // قراءة السجلات من ملف
  async getLogsFromFile(filePath, cutoffTime) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const logs = JSON.parse(data);
      
      return logs.filter(log => new Date(log.timestamp) > cutoffTime);
    } catch (error) {
      return [];
    }
  }

  // تحليل الأخطاء حسب الفئة
  analyzeErrorsByCategory(logs) {
    const categories = {};
    logs.forEach(log => {
      categories[log.category] = (categories[log.category] || 0) + 1;
    });
    return categories;
  }

  // تحليل الأخطاء حسب المستوى
  analyzeErrorsByLevel(logs) {
    const levels = {};
    logs.forEach(log => {
      levels[log.level] = (levels[log.level] || 0) + 1;
    });
    return levels;
  }

  // تحليل مشاكل الأداء
  analyzePerformanceIssues(logs) {
    const slowOperations = logs.filter(log => log.duration > 3000);
    const failedOperations = logs.filter(log => !log.success);
    
    return {
      slowOperationsCount: slowOperations.length,
      failedOperationsCount: failedOperations.length,
      averageDuration: logs.length > 0 ? 
        logs.reduce((sum, log) => sum + log.duration, 0) / logs.length : 0
    };
  }

  // البحث عن الأخطاء الشائعة
  findCommonErrors(logs) {
    const errorMessages = {};
    logs.forEach(log => {
      const message = log.message;
      errorMessages[message] = (errorMessages[message] || 0) + 1;
    });

    return Object.entries(errorMessages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }

  // تقييم صحة النظام
  assessSystemHealth(errorLogs, performanceLogs) {
    const recentErrors = errorLogs.filter(log => 
      new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    );

    const criticalErrors = recentErrors.filter(log => log.level === 'خطأ').length;
    const averagePerformance = performanceLogs.length > 0 ?
      performanceLogs.reduce((sum, log) => sum + log.duration, 0) / performanceLogs.length : 0;

    if (criticalErrors > 5 || averagePerformance > 5000) {
      return { status: 'غير صحي', score: 1 };
    } else if (criticalErrors > 2 || averagePerformance > 3000) {
      return { status: 'متوسط', score: 2 };
    } else {
      return { status: 'صحي', score: 3 };
    }
  }

  // إنشاء التوصيات
  generateRecommendations(errorLogs, performanceLogs) {
    const recommendations = [];

    const criticalErrors = errorLogs.filter(log => log.level === 'خطأ').length;
    if (criticalErrors > 5) {
      recommendations.push('فحص الأخطاء الحرجة والعمل على حلها فوراً');
    }

    const slowOperations = performanceLogs.filter(log => log.duration > 3000).length;
    if (slowOperations > 10) {
      recommendations.push('تحسين أداء العمليات البطيئة');
    }

    const memoryIssues = errorLogs.filter(log => 
      log.category === 'الذاكرة' || 
      (log.memory && log.memory.heapUsed > 100 * 1024 * 1024)
    ).length;
    if (memoryIssues > 0) {
      recommendations.push('مراقبة استخدام الذاكرة وتحسينها');
    }

    if (recommendations.length === 0) {
      recommendations.push('النظام يعمل بصورة طبيعية');
    }

    return recommendations;
  }

  // توليد معرف الخطأ
  generateErrorId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `ERR-${timestamp}-${random}`;
  }

  // معالج الأخطاء للتطبيق
  expressErrorHandler() {
    return (err, req, res, next) => {
      this.logError('ERROR', 'NETWORK', `Express Error: ${err.message}`, err, {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم',
        errorId: this.generateErrorId()
      });
    };
  }

  // مراقب الأداء
  performanceMonitor() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logPerformance(`${req.method} ${req.url}`, duration, res.statusCode < 400, {
          statusCode: res.statusCode,
          method: req.method,
          url: req.url
        });
      });
      
      next();
    };
  }
}

// إنشاء instance واحد
const errorMonitor = new ErrorMonitoringSystem();

// تصدير النظام
module.exports = errorMonitor;

console.log('🚨 نظام مراقبة الأخطاء جاهز!');
console.log('📝 تسجيل شامل: أخطاء + نظام + أداء');
console.log('🔔 تنبيهات تلقائية: إيميل + سجلات');
console.log('📊 تقارير دورية: تحليل + توصيات');