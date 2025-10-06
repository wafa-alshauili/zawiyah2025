// Auto Recovery System - نظام الاسترداد التلقائي
// يتعامل مع انقطاع الاتصال، فشل المزامنة، وفقدان البيانات

import enhancedSync from './enhancedSync';
import conflictResolver from './conflictResolver';

class AutoRecoverySystem {
  constructor() {
    this.recoveryStrategies = {
      'CONNECTION_LOST': this.handleConnectionLoss.bind(this),
      'SYNC_FAILED': this.handleSyncFailure.bind(this),
      'DATA_CORRUPTION': this.handleDataCorruption.bind(this),
      'SERVER_ERROR': this.handleServerError.bind(this),
      'CONFLICT_DETECTED': this.handleConflictDetected.bind(this)
    };
    
    this.recoveryQueue = [];
    this.recoveryInProgress = false;
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    
    // Storage keys
    this.RECOVERY_QUEUE_KEY = 'zawiyah_recovery_queue';
    this.RECOVERY_LOG_KEY = 'zawiyah_recovery_log';
    this.SYSTEM_STATE_KEY = 'zawiyah_system_state';
    
    this.init();
  }

  // تهيئة نظام الاسترداد
  init() {
    console.log('🔄 تهيئة نظام الاسترداد التلقائي');
    
    // استعادة قائمة الاسترداد
    this.restoreRecoveryQueue();
    
    // مراقبة أحداث النظام
    this.setupSystemMonitoring();
    
    // بدء المعالجة الدورية
    this.startPeriodicRecovery();
    
    // حفظ حالة النظام
    this.saveSystemState('INITIALIZED');
  }

  // مراقبة أحداث النظام
  setupSystemMonitoring() {
    // مراقبة حالة الاتصال
    window.addEventListener('online', () => {
      this.handleRecoveryEvent('CONNECTION_RESTORED');
    });

    window.addEventListener('offline', () => {
      this.handleRecoveryEvent('CONNECTION_LOST');
    });

    // مراقبة أخطاء Socket.IO
    window.addEventListener('socket-error', (event) => {
      this.handleRecoveryEvent('SERVER_ERROR', event.detail);
    });

    // مراقبة فشل المزامنة
    window.addEventListener('sync-failed', (event) => {
      this.handleRecoveryEvent('SYNC_FAILED', event.detail);
    });

    // مراقبة اكتشاف التضارب
    window.addEventListener('conflict-detected', (event) => {
      this.handleRecoveryEvent('CONFLICT_DETECTED', event.detail);
    });

    // مراقبة أخطاء التطبيق العامة
    window.addEventListener('error', (event) => {
      this.handleRecoveryEvent('APPLICATION_ERROR', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    });

    // مراقبة رفض Promise غير المتعامل معه
    window.addEventListener('unhandledrejection', (event) => {
      this.handleRecoveryEvent('PROMISE_REJECTION', {
        reason: event.reason
      });
    });
  }

  // بدء المعالجة الدورية
  startPeriodicRecovery() {
    // معالجة قائمة الاسترداد كل 15 ثانية
    setInterval(() => {
      if (this.recoveryQueue.length > 0 && !this.recoveryInProgress) {
        this.processRecoveryQueue();
      }
    }, 15000);

    // فحص صحة النظام كل دقيقة
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    // تنظيف البيانات القديمة كل ساعة
    setInterval(() => {
      this.cleanup();
    }, 3600000);
  }

  // معالجة حدث الاسترداد
  handleRecoveryEvent(eventType, data = {}) {
    console.log('🚨 حدث يتطلب استرداد:', eventType, data);
    
    const recoveryItem = {
      id: Date.now() + Math.random(),
      eventType,
      data,
      timestamp: Date.now(),
      priority: this.getEventPriority(eventType),
      attempts: 0
    };

    this.addToRecoveryQueue(recoveryItem);
    
    // محاولة معالجة فورية للأحداث عالية الأولوية
    if (recoveryItem.priority >= 8) {
      setTimeout(() => this.processRecoveryQueue(), 1000);
    }
  }

  // تحديد أولوية الحدث
  getEventPriority(eventType) {
    const priorities = {
      'DATA_CORRUPTION': 10,
      'CONFLICT_DETECTED': 9,
      'SYNC_FAILED': 8,
      'SERVER_ERROR': 7,
      'CONNECTION_LOST': 6,
      'CONNECTION_RESTORED': 5,
      'APPLICATION_ERROR': 4,
      'PROMISE_REJECTION': 3
    };
    
    return priorities[eventType] || 1;
  }

  // إضافة عنصر لقائمة الاسترداد
  addToRecoveryQueue(recoveryItem) {
    this.recoveryQueue.push(recoveryItem);
    
    // ترتيب حسب الأولوية (الأعلى أولاً)
    this.recoveryQueue.sort((a, b) => b.priority - a.priority);
    
    this.saveRecoveryQueue();
    console.log('📋 تمت إضافة عنصر لقائمة الاسترداد:', recoveryItem.eventType);
  }

  // معالجة قائمة الاسترداد
  async processRecoveryQueue() {
    if (this.recoveryInProgress) return;

    this.recoveryInProgress = true;
    console.log('🔄 بدء معالجة قائمة الاسترداد:', this.recoveryQueue.length, 'عنصر');

    try {
      const processedItems = [];
      
      for (let item of this.recoveryQueue) {
        try {
          const success = await this.processRecoveryItem(item);
          
          if (success) {
            processedItems.push(item);
            console.log('✅ تم استرداد:', item.eventType);
          } else {
            item.attempts++;
            if (item.attempts >= this.maxRecoveryAttempts) {
              console.warn('⚠️ فشل نهائي في الاسترداد:', item.eventType);
              processedItems.push(item); // إزالة من القائمة
            }
          }
        } catch (error) {
          console.error('❌ خطأ في معالجة الاسترداد:', item.eventType, error);
          item.attempts++;
        }
      }

      // إزالة العناصر المعالجة
      this.recoveryQueue = this.recoveryQueue.filter(item => 
        !processedItems.includes(item)
      );
      
      this.saveRecoveryQueue();
      
    } finally {
      this.recoveryInProgress = false;
    }
  }

  // معالجة عنصر استرداد واحد
  async processRecoveryItem(item) {
    const strategy = this.recoveryStrategies[item.eventType];
    
    if (!strategy) {
      console.warn('⚠️ لا توجد استراتيجية استرداد لـ:', item.eventType);
      return true; // اعتبر معالج لتجنب إعادة المحاولة
    }

    try {
      const result = await strategy(item.data, item.attempts);
      this.logRecoveryResult(item, result);
      return result.success;
    } catch (error) {
      console.error('❌ فشل في استراتيجية الاسترداد:', item.eventType, error);
      this.logRecoveryResult(item, { success: false, error: error.message });
      return false;
    }
  }

  // === استراتيجيات الاسترداد ===

  // التعامل مع فقدان الاتصال
  async handleConnectionLoss(data, attempt) {
    console.log('🔌 معالجة فقدان الاتصال - المحاولة:', attempt + 1);
    
    // انتظار لاستعادة الاتصال
    await this.waitForConnection(30000); // انتظار 30 ثانية
    
    if (navigator.onLine) {
      // محاولة إعادة الاتصال بـ Socket.IO
      try {
        await enhancedSync.forcedSync();
        return { success: true, message: 'تم استعادة الاتصال والمزامنة' };
      } catch (error) {
        return { success: false, error: 'فشل في المزامنة بعد استعادة الاتصال' };
      }
    }
    
    return { success: false, error: 'لا يزال الاتصال مفقود' };
  }

  // التعامل مع فشل المزامنة
  async handleSyncFailure(data, attempt) {
    console.log('⚡ معالجة فشل المزامنة - المحاولة:', attempt + 1);
    
    // إعادة تعيين نظام المزامنة
    if (attempt > 0) {
      console.log('🔄 إعادة تعيين نظام المزامنة');
      enhancedSync.clearAllData();
    }
    
    // محاولة مزامنة جديدة
    try {
      const success = await enhancedSync.forcedSync();
      return { 
        success, 
        message: success ? 'تمت المزامنة بنجاح' : 'فشلت المزامنة مرة أخرى' 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // التعامل مع تلف البيانات
  async handleDataCorruption(data, attempt) {
    console.log('💾 معالجة تلف البيانات - المحاولة:', attempt + 1);
    
    try {
      // محاولة استعادة من النسخة الاحتياطية
      const backupData = this.getBackupData();
      
      if (backupData && this.isDataValid(backupData)) {
        this.restoreFromBackup(backupData);
        return { success: true, message: 'تم الاستعادة من النسخة الاحتياطية' };
      }
      
      // إذا لم تنجح، محاولة إعادة تحميل من الخادم
      await enhancedSync.forcedSync();
      return { success: true, message: 'تم إعادة التحميل من الخادم' };
      
    } catch (error) {
      return { success: false, error: 'فشل في استعادة البيانات' };
    }
  }

  // التعامل مع أخطاء الخادم
  async handleServerError(data, attempt) {
    console.log('🔧 معالجة خطأ الخادم - المحاولة:', attempt + 1);
    
    // انتظار تدريجي قبل إعادة المحاولة
    const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
    await this.sleep(waitTime);
    
    try {
      // فحص حالة الخادم
      const isServerHealthy = await this.checkServerHealth();
      
      if (isServerHealthy) {
        // إعادة محاولة المزامنة
        await enhancedSync.forcedSync();
        return { success: true, message: 'تم حل خطأ الخادم' };
      }
      
      return { success: false, error: 'الخادم لا يزال غير متاح' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // التعامل مع اكتشاف التضارب
  async handleConflictDetected(data, attempt) {
    console.log('⚔️ معالجة التضارب المكتشف - المحاولة:', attempt + 1);
    
    try {
      const resolution = await conflictResolver.resolveConflict({
        localBooking: data.localBooking,
        serverBooking: data.serverBooking,
        conflictType: data.conflictType,
        strategy: 'FIRST_COME_FIRST_SERVED' // استراتيجية افتراضية
      });
      
      // تطبيق القرار
      await this.applyConflictResolution(resolution);
      
      return { success: true, message: 'تم حل التضارب' };
      
    } catch (error) {
      return { success: false, error: 'فشل في حل التضارب' };
    }
  }

  // === طرق مساعدة ===

  // انتظار استعادة الاتصال
  waitForConnection(timeout = 30000) {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve(true);
        return;
      }

      const checkConnection = () => {
        if (navigator.onLine) {
          resolve(true);
        } else {
          setTimeout(checkConnection, 1000);
        }
      };

      setTimeout(() => resolve(false), timeout);
      checkConnection();
    });
  }

  // فحص صحة الخادم
  async checkServerHealth() {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        timeout: 10000 
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // انتظار لفترة محددة
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // الحصول على النسخة الاحتياطية
  getBackupData() {
    try {
      const backup = localStorage.getItem('zawiyah_backup_data');
      return backup ? JSON.parse(backup) : null;
    } catch {
      return null;
    }
  }

  // فحص صحة البيانات
  isDataValid(data) {
    return data && 
           typeof data === 'object' && 
           data.timestamp && 
           (Date.now() - data.timestamp) < 86400000; // أقل من 24 ساعة
  }

  // استعادة من النسخة الاحتياطية
  restoreFromBackup(backupData) {
    try {
      if (backupData.bookings) {
        localStorage.setItem('zawiyah_bookings_backup', JSON.stringify(backupData.bookings));
      }
      
      console.log('✅ تم الاستعادة من النسخة الاحتياطية');
      
      // إشعار التطبيق بالاستعادة
      window.dispatchEvent(new CustomEvent('data-restored', {
        detail: { source: 'backup', data: backupData }
      }));
      
    } catch (error) {
      console.error('❌ فشل في الاستعادة من النسخة الاحتياطية:', error);
      throw error;
    }
  }

  // تطبيق قرار حل التضارب
  async applyConflictResolution(resolution) {
    const { winner, booking, action } = resolution;
    
    switch (action) {
      case 'accept':
        // قبول البيانات من الخادم
        break;
        
      case 'update':
        // تحديث الخادم بالبيانات المحلية
        await enhancedSync.updateBooking(booking.referenceNumber, booking);
        break;
        
      case 'create':
        // إنشاء حجز جديد
        await enhancedSync.createBooking(booking);
        break;
        
      default:
        console.warn('⚠️ إجراء غير معروف في حل التضارب:', action);
    }
  }

  // فحص صحة النظام الدوري
  async performHealthCheck() {
    console.log('🏥 فحص صحة النظام');
    
    const health = {
      timestamp: Date.now(),
      connectivity: navigator.onLine,
      localStorage: this.testLocalStorageHealth(),
      syncSystem: enhancedSync.getStats(),
      recoveryQueue: this.recoveryQueue.length
    };
    
    // حفظ تقرير الصحة
    localStorage.setItem('zawiyah_health_report', JSON.stringify(health));
    
    // إذا كان هناك مشاكل، إضافة لقائمة الاسترداد
    if (!health.connectivity) {
      this.handleRecoveryEvent('CONNECTION_LOST');
    }
    
    if (!health.localStorage) {
      this.handleRecoveryEvent('DATA_CORRUPTION');
    }
    
    return health;
  }

  // فحص صحة localStorage
  testLocalStorageHealth() {
    try {
      const testKey = 'zawiyah_health_test';
      const testValue = 'test_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved === testValue;
    } catch {
      return false;
    }
  }

  // === إدارة التخزين ===

  // حفظ قائمة الاسترداد
  saveRecoveryQueue() {
    try {
      localStorage.setItem(this.RECOVERY_QUEUE_KEY, JSON.stringify(this.recoveryQueue));
    } catch (error) {
      console.error('❌ خطأ في حفظ قائمة الاسترداد:', error);
    }
  }

  // استعادة قائمة الاسترداد
  restoreRecoveryQueue() {
    try {
      const saved = localStorage.getItem(this.RECOVERY_QUEUE_KEY);
      if (saved) {
        this.recoveryQueue = JSON.parse(saved);
        console.log('📋 تم استعادة قائمة الاسترداد:', this.recoveryQueue.length, 'عنصر');
      }
    } catch (error) {
      console.error('❌ خطأ في استعادة قائمة الاسترداد:', error);
      this.recoveryQueue = [];
    }
  }

  // تسجيل نتيجة الاسترداد
  logRecoveryResult(item, result) {
    const logEntry = {
      timestamp: Date.now(),
      eventType: item.eventType,
      attempts: item.attempts + 1,
      success: result.success,
      message: result.message || result.error
    };
    
    try {
      const log = JSON.parse(localStorage.getItem(this.RECOVERY_LOG_KEY) || '[]');
      log.push(logEntry);
      
      // الاحتفاظ بآخر 100 إدخال فقط
      if (log.length > 100) {
        log.splice(0, log.length - 100);
      }
      
      localStorage.setItem(this.RECOVERY_LOG_KEY, JSON.stringify(log));
    } catch (error) {
      console.error('❌ خطأ في تسجيل نتيجة الاسترداد:', error);
    }
  }

  // حفظ حالة النظام
  saveSystemState(state) {
    try {
      const stateData = {
        state,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      localStorage.setItem(this.SYSTEM_STATE_KEY, JSON.stringify(stateData));
    } catch (error) {
      console.error('❌ خطأ في حفظ حالة النظام:', error);
    }
  }

  // تنظيف البيانات القديمة
  cleanup() {
    console.log('🧹 تنظيف بيانات الاسترداد القديمة');
    
    try {
      // تنظيف سجل الاسترداد (أكثر من أسبوع)
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const log = JSON.parse(localStorage.getItem(this.RECOVERY_LOG_KEY) || '[]');
      const cleanLog = log.filter(entry => entry.timestamp > oneWeekAgo);
      
      localStorage.setItem(this.RECOVERY_LOG_KEY, JSON.stringify(cleanLog));
      
      // تنظيف العناصر القديمة من قائمة الاسترداد (أكثر من ساعة)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      this.recoveryQueue = this.recoveryQueue.filter(item => item.timestamp > oneHourAgo);
      this.saveRecoveryQueue();
      
    } catch (error) {
      console.error('❌ خطأ في التنظيف:', error);
    }
  }

  // الحصول على إحصائيات الاسترداد
  getRecoveryStats() {
    try {
      const log = JSON.parse(localStorage.getItem(this.RECOVERY_LOG_KEY) || '[]');
      const recentLog = log.filter(entry => 
        entry.timestamp > Date.now() - (24 * 60 * 60 * 1000)
      );
      
      const successCount = recentLog.filter(entry => entry.success).length;
      const failureCount = recentLog.length - successCount;
      
      return {
        totalRecoveries: log.length,
        recentRecoveries: recentLog.length,
        successRate: recentLog.length > 0 ? (successCount / recentLog.length) * 100 : 0,
        pendingRecoveries: this.recoveryQueue.length,
        successCount,
        failureCount,
        recoveryInProgress: this.recoveryInProgress
      };
    } catch {
      return {
        totalRecoveries: 0,
        recentRecoveries: 0,
        successRate: 0,
        pendingRecoveries: this.recoveryQueue.length,
        successCount: 0,
        failureCount: 0,
        recoveryInProgress: this.recoveryInProgress
      };
    }
  }
}

// إنشاء instance واحد للنظام
const autoRecovery = new AutoRecoverySystem();

export default autoRecovery;