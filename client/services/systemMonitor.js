// System Performance Monitor & Statistics
// نظام مراقبة الأداء والإحصائيات للمزامنة الدائمة

import enhancedSync from './enhancedSync';
import conflictResolver from './conflictResolver';
import autoRecovery from './autoRecovery';

class SystemMonitor {
  constructor() {
    this.isActive = false;
    this.metrics = {
      sync: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0,
        lastSyncTime: null
      },
      conflicts: {
        totalConflicts: 0,
        resolvedConflicts: 0,
        pendingConflicts: 0,
        conflictTypes: {}
      },
      recovery: {
        totalRecoveries: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        averageRecoveryTime: 0
      },
      connectivity: {
        uptime: 0,
        downtimeEvents: 0,
        totalDowntime: 0,
        reconnections: 0
      },
      performance: {
        memoryUsage: 0,
        storageUsage: 0,
        cpuUsage: 0,
        networkLatency: 0
      }
    };
    
    this.performanceHistory = [];
    this.alertThresholds = {
      syncFailureRate: 0.1, // 10%
      conflictRate: 0.05,   // 5%
      recoveryTime: 30000,  // 30 seconds
      networkLatency: 2000  // 2 seconds
    };
    
    this.alerts = [];
    this.monitoringInterval = null;
    
    this.init();
  }

  // تهيئة النظام
  init() {
    console.log('📊 تهيئة نظام مراقبة الأداء');
    
    // استعادة البيانات المحفوظة
    this.restoreMetrics();
    
    // إعداد مستمعي الأحداث
    this.setupEventListeners();
    
    // بدء المراقبة
    this.startMonitoring();
  }

  // إعداد مستمعي الأحداث
  setupEventListeners() {
    // مراقبة عمليات المزامنة
    window.addEventListener('sync-started', (event) => {
      this.recordSyncStart(event.detail);
    });

    window.addEventListener('sync-completed', (event) => {
      this.recordSyncSuccess(event.detail);
    });

    window.addEventListener('sync-failed', (event) => {
      this.recordSyncFailure(event.detail);
    });

    // مراقبة التضارب
    window.addEventListener('conflict-detected', (event) => {
      this.recordConflictDetected(event.detail);
    });

    window.addEventListener('conflict-resolved', (event) => {
      this.recordConflictResolved(event.detail);
    });

    // مراقبة الاسترداد
    window.addEventListener('recovery-started', (event) => {
      this.recordRecoveryStart(event.detail);
    });

    window.addEventListener('recovery-completed', (event) => {
      this.recordRecoverySuccess(event.detail);
    });

    // مراقبة الاتصال
    window.addEventListener('online', () => {
      this.recordConnectivityChange(true);
    });

    window.addEventListener('offline', () => {
      this.recordConnectivityChange(false);
    });
  }

  // بدء المراقبة
  startMonitoring() {
    if (this.isActive) return;

    this.isActive = true;
    console.log('▶️ بدء مراقبة النظام');

    // مراقبة دورية كل 30 ثانية
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // تسجيل وقت البدء
    this.metrics.connectivity.startTime = Date.now();
  }

  // إيقاف المراقبة
  stopMonitoring() {
    if (!this.isActive) return;

    this.isActive = false;
    console.log('⏹️ إيقاف مراقبة النظام');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // جمع المقاييس الدورية
  async collectMetrics() {
    try {
      // مقاييس الأداء
      await this.collectPerformanceMetrics();
      
      // مقاييس التخزين
      this.collectStorageMetrics();
      
      // مقاييس الشبكة
      await this.collectNetworkMetrics();
      
      // تحديث الإحصائيات المشتقة
      this.updateDerivedMetrics();
      
      // فحص التنبيهات
      this.checkAlerts();
      
      // حفظ النقطة الزمنية
      this.savePerformanceSnapshot();
      
    } catch (error) {
      console.error('❌ خطأ في جمع المقاييس:', error);
    }
  }

  // جمع مقاييس الأداء
  async collectPerformanceMetrics() {
    // Memory usage
    if (performance.memory) {
      this.metrics.performance.memoryUsage = performance.memory.usedJSHeapSize;
    }

    // Navigation timing (if available)
    if (performance.timing) {
      const timing = performance.timing;
      this.metrics.performance.loadTime = timing.loadEventEnd - timing.navigationStart;
    }
  }

  // جمع مقاييس التخزين
  collectStorageMetrics() {
    try {
      let totalSize = 0;
      
      // حساب حجم localStorage
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      
      this.metrics.performance.storageUsage = totalSize;
    } catch (error) {
      console.error('❌ خطأ في حساب حجم التخزين:', error);
    }
  }

  // جمع مقاييس الشبكة
  async collectNetworkMetrics() {
    try {
      const startTime = Date.now();
      
      // اختبار ping بسيط
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        this.metrics.performance.networkLatency = Date.now() - startTime;
      }
    } catch (error) {
      this.metrics.performance.networkLatency = -1; // خطأ في الاتصال
    }
  }

  // تحديث المقاييس المشتقة
  updateDerivedMetrics() {
    // معدل نجاح المزامنة
    const { totalOperations, successfulOperations } = this.metrics.sync;
    if (totalOperations > 0) {
      this.metrics.sync.successRate = (successfulOperations / totalOperations) * 100;
    }

    // معدل التضارب
    const { totalConflicts, resolvedConflicts } = this.metrics.conflicts;
    if (totalConflicts > 0) {
      this.metrics.conflicts.resolutionRate = (resolvedConflicts / totalConflicts) * 100;
    }

    // وقت التشغيل
    if (this.metrics.connectivity.startTime) {
      this.metrics.connectivity.uptime = Date.now() - this.metrics.connectivity.startTime;
    }
  }

  // فحص التنبيهات
  checkAlerts() {
    const alerts = [];

    // تنبيه معدل فشل المزامنة
    if (this.getSyncFailureRate() > this.alertThresholds.syncFailureRate) {
      alerts.push({
        type: 'SYNC_FAILURE_RATE_HIGH',
        severity: 'WARNING',
        message: 'معدل فشل المزامنة مرتفع',
        value: this.getSyncFailureRate(),
        threshold: this.alertThresholds.syncFailureRate
      });
    }

    // تنبيه معدل التضارب
    if (this.getConflictRate() > this.alertThresholds.conflictRate) {
      alerts.push({
        type: 'CONFLICT_RATE_HIGH',
        severity: 'WARNING',
        message: 'معدل التضارب مرتفع',
        value: this.getConflictRate(),
        threshold: this.alertThresholds.conflictRate
      });
    }

    // تنبيه زمن الاستجابة للشبكة
    if (this.metrics.performance.networkLatency > this.alertThresholds.networkLatency) {
      alerts.push({
        type: 'NETWORK_LATENCY_HIGH',
        severity: 'WARNING',
        message: 'زمن الاستجابة للشبكة مرتفع',
        value: this.metrics.performance.networkLatency,
        threshold: this.alertThresholds.networkLatency
      });
    }

    // إضافة التنبيهات الجديدة
    alerts.forEach(alert => this.addAlert(alert));
  }

  // إضافة تنبيه
  addAlert(alert) {
    const existingAlert = this.alerts.find(a => 
      a.type === alert.type && a.timestamp > Date.now() - 300000 // آخر 5 دقائق
    );

    if (!existingAlert) {
      alert.id = Date.now() + Math.random();
      alert.timestamp = Date.now();
      this.alerts.push(alert);
      
      console.warn('⚠️ تنبيه جديد:', alert.message, alert.value);
      
      // إشعار التطبيق
      window.dispatchEvent(new CustomEvent('system-alert', {
        detail: alert
      }));
      
      // الاحتفاظ بآخر 50 تنبيه فقط
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }
    }
  }

  // حفظ نقطة زمنية للأداء
  savePerformanceSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      metrics: JSON.parse(JSON.stringify(this.metrics)),
      systemStats: {
        enhancedSync: enhancedSync.getStats(),
        conflictResolver: conflictResolver.getConflictStats(),
        autoRecovery: autoRecovery.getRecoveryStats()
      }
    };

    this.performanceHistory.push(snapshot);
    
    // الاحتفاظ بآخر 100 نقطة فقط (50 دقيقة تقريباً)
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }

    // حفظ في localStorage
    this.saveMetrics();
  }

  // === تسجيل الأحداث ===

  recordSyncStart(data) {
    this.metrics.sync.totalOperations++;
    data.startTime = Date.now();
  }

  recordSyncSuccess(data) {
    this.metrics.sync.successfulOperations++;
    this.metrics.sync.lastSyncTime = Date.now();
    
    if (data.startTime) {
      const responseTime = Date.now() - data.startTime;
      this.updateAverageResponseTime(responseTime);
    }
  }

  recordSyncFailure(data) {
    this.metrics.sync.failedOperations++;
  }

  recordConflictDetected(data) {
    this.metrics.conflicts.totalConflicts++;
    this.metrics.conflicts.pendingConflicts++;
    
    const conflictType = data.conflictType || 'UNKNOWN';
    this.metrics.conflicts.conflictTypes[conflictType] = 
      (this.metrics.conflicts.conflictTypes[conflictType] || 0) + 1;
  }

  recordConflictResolved(data) {
    this.metrics.conflicts.resolvedConflicts++;
    this.metrics.conflicts.pendingConflicts = Math.max(0, this.metrics.conflicts.pendingConflicts - 1);
  }

  recordRecoveryStart(data) {
    this.metrics.recovery.totalRecoveries++;
    data.startTime = Date.now();
  }

  recordRecoverySuccess(data) {
    this.metrics.recovery.successfulRecoveries++;
    
    if (data.startTime) {
      const recoveryTime = Date.now() - data.startTime;
      this.updateAverageRecoveryTime(recoveryTime);
    }
  }

  recordConnectivityChange(isOnline) {
    if (isOnline) {
      this.metrics.connectivity.reconnections++;
    } else {
      this.metrics.connectivity.downtimeEvents++;
      this.metrics.connectivity.lastDowntimeStart = Date.now();
    }
  }

  // تحديث متوسط وقت الاستجابة
  updateAverageResponseTime(responseTime) {
    if (this.metrics.sync.averageResponseTime === 0) {
      this.metrics.sync.averageResponseTime = responseTime;
    } else {
      // Moving average
      this.metrics.sync.averageResponseTime = 
        (this.metrics.sync.averageResponseTime * 0.8) + (responseTime * 0.2);
    }
  }

  // تحديث متوسط وقت الاسترداد
  updateAverageRecoveryTime(recoveryTime) {
    if (this.metrics.recovery.averageRecoveryTime === 0) {
      this.metrics.recovery.averageRecoveryTime = recoveryTime;
    } else {
      // Moving average
      this.metrics.recovery.averageRecoveryTime = 
        (this.metrics.recovery.averageRecoveryTime * 0.8) + (recoveryTime * 0.2);
    }
  }

  // === حسابات المقاييس ===

  getSyncFailureRate() {
    const { totalOperations, failedOperations } = this.metrics.sync;
    return totalOperations > 0 ? failedOperations / totalOperations : 0;
  }

  getConflictRate() {
    const { totalConflicts } = this.metrics.conflicts;
    const { totalOperations } = this.metrics.sync;
    return totalOperations > 0 ? totalConflicts / totalOperations : 0;
  }

  getSystemHealth() {
    const health = {
      overall: 'GOOD',
      sync: 'GOOD',
      conflicts: 'GOOD',
      recovery: 'GOOD',
      connectivity: 'GOOD',
      performance: 'GOOD'
    };

    // تقييم المزامنة
    if (this.getSyncFailureRate() > 0.1) {
      health.sync = 'POOR';
      health.overall = 'POOR';
    } else if (this.getSyncFailureRate() > 0.05) {
      health.sync = 'FAIR';
      if (health.overall === 'GOOD') health.overall = 'FAIR';
    }

    // تقييم التضارب
    if (this.getConflictRate() > 0.05) {
      health.conflicts = 'POOR';
      health.overall = 'POOR';
    } else if (this.getConflictRate() > 0.02) {
      health.conflicts = 'FAIR';
      if (health.overall === 'GOOD') health.overall = 'FAIR';
    }

    // تقييم الشبكة
    if (this.metrics.performance.networkLatency > 2000) {
      health.connectivity = 'POOR';
      health.overall = 'POOR';
    } else if (this.metrics.performance.networkLatency > 1000) {
      health.connectivity = 'FAIR';
      if (health.overall === 'GOOD') health.overall = 'FAIR';
    }

    return health;
  }

  // === إدارة البيانات ===

  saveMetrics() {
    try {
      localStorage.setItem('zawiyah_system_metrics', JSON.stringify(this.metrics));
      localStorage.setItem('zawiyah_performance_history', JSON.stringify(this.performanceHistory.slice(-20))); // آخر 20 نقطة فقط
      localStorage.setItem('zawiyah_system_alerts', JSON.stringify(this.alerts.slice(-10))); // آخر 10 تنبيهات
    } catch (error) {
      console.error('❌ خطأ في حفظ المقاييس:', error);
    }
  }

  restoreMetrics() {
    try {
      const savedMetrics = localStorage.getItem('zawiyah_system_metrics');
      const savedHistory = localStorage.getItem('zawiyah_performance_history');
      const savedAlerts = localStorage.getItem('zawiyah_system_alerts');

      if (savedMetrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(savedMetrics) };
      }

      if (savedHistory) {
        this.performanceHistory = JSON.parse(savedHistory);
      }

      if (savedAlerts) {
        this.alerts = JSON.parse(savedAlerts);
      }

      console.log('📊 تم استعادة مقاييس النظام');
    } catch (error) {
      console.error('❌ خطأ في استعادة المقاييس:', error);
    }
  }

  // تصدير التقرير
  exportReport() {
    const report = {
      timestamp: Date.now(),
      period: {
        start: this.metrics.connectivity.startTime,
        end: Date.now(),
        duration: this.metrics.connectivity.uptime
      },
      metrics: this.metrics,
      systemHealth: this.getSystemHealth(),
      recentAlerts: this.alerts.slice(-10),
      performanceTrend: this.performanceHistory.slice(-10)
    };

    return report;
  }

  // مسح البيانات
  clearData() {
    this.metrics = {
      sync: { totalOperations: 0, successfulOperations: 0, failedOperations: 0, averageResponseTime: 0, lastSyncTime: null },
      conflicts: { totalConflicts: 0, resolvedConflicts: 0, pendingConflicts: 0, conflictTypes: {} },
      recovery: { totalRecoveries: 0, successfulRecoveries: 0, failedRecoveries: 0, averageRecoveryTime: 0 },
      connectivity: { uptime: 0, downtimeEvents: 0, totalDowntime: 0, reconnections: 0 },
      performance: { memoryUsage: 0, storageUsage: 0, cpuUsage: 0, networkLatency: 0 }
    };
    
    this.performanceHistory = [];
    this.alerts = [];
    
    localStorage.removeItem('zawiyah_system_metrics');
    localStorage.removeItem('zawiyah_performance_history');
    localStorage.removeItem('zawiyah_system_alerts');
    
    console.log('🗑️ تم مسح بيانات المراقبة');
  }

  // الحصول على الملخص
  getSummary() {
    return {
      isActive: this.isActive,
      uptime: this.metrics.connectivity.uptime,
      totalOperations: this.metrics.sync.totalOperations,
      successRate: this.metrics.sync.successRate || 0,
      conflictRate: this.getConflictRate(),
      systemHealth: this.getSystemHealth(),
      activeAlerts: this.alerts.filter(a => a.timestamp > Date.now() - 300000).length,
      lastUpdate: Date.now()
    };
  }
}

// إنشاء instance واحد
const systemMonitor = new SystemMonitor();

export default systemMonitor;