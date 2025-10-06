// Enhanced Client Synchronization System
// نظام المزامنة المحسن للعملاء - مع المعالجة المتقدمة للانقطاع والاستعادة

import socketService from './socket';

class EnhancedClientSync {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.conflictQueue = [];
    this.lastSyncTimestamp = null;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.syncInProgress = false;
    
    // Local storage keys
    this.SYNC_QUEUE_KEY = 'zawiyah_sync_queue';
    this.CONFLICT_QUEUE_KEY = 'zawiyah_conflict_queue';
    this.LAST_SYNC_KEY = 'zawiyah_last_sync';
    this.BACKUP_DATA_KEY = 'zawiyah_backup_data';
    
    this.init();
  }

  // تهيئة النظام
  init() {
    console.log('🔄 تهيئة نظام المزامنة المحسن');
    
    // استعادة البيانات المحفوظة
    this.restoreQueues();
    
    // مراقبة حالة الاتصال
    this.setupConnectivityMonitoring();
    
    // إعداد مستمعي Socket.IO
    this.setupSocketListeners();
    
    // بدء المزامنة الدورية
    this.startPeriodicSync();
    
    // معالجة إغلاق النافذة
    this.setupBeforeUnloadHandler();
  }

  // مراقبة حالة الاتصال
  setupConnectivityMonitoring() {
    window.addEventListener('online', () => {
      console.log('🌐 تم استعادة الاتصال بالإنترنت');
      this.isOnline = true;
      this.handleReconnection();
    });

    window.addEventListener('offline', () => {
      console.log('❌ انقطع الاتصال بالإنترنت');
      this.isOnline = false;
    });

    // مراقبة Socket.IO
    socketService.on('connect', () => {
      console.log('🔗 Socket.IO متصل');
      this.handleReconnection();
    });

    socketService.on('disconnect', () => {
      console.log('❌ Socket.IO منقطع');
    });

    socketService.on('reconnect', () => {
      console.log('🔄 Socket.IO أعيد الاتصال');
      this.handleReconnection();
    });
  }

  // إعداد مستمعي Socket.IO
  setupSocketListeners() {
    // مستمعي تحديث البيانات
    socketService.on('booking-created', (data) => {
      this.handleServerUpdate('booking-created', data);
    });

    socketService.on('booking-updated', (data) => {
      this.handleServerUpdate('booking-updated', data);
    });

    socketService.on('booking-deleted', (data) => {
      this.handleServerUpdate('booking-deleted', data);
    });

    socketService.on('bookings-updated', (data) => {
      this.handleServerUpdate('bookings-updated', data);
    });

    // مستمعي الأخطاء
    socketService.on('booking-error', (error) => {
      console.error('❌ خطأ من الخادم:', error);
      this.handleServerError(error);
    });
  }

  // بدء المزامنة الدورية
  startPeriodicSync() {
    // مزامنة كل 10 ثوان
    setInterval(() => {
      if (this.shouldSync()) {
        this.performSync();
      }
    }, 10000);

    // مزامنة إجبارية كل دقيقة
    setInterval(() => {
      this.forcedSync();
    }, 60000);
  }

  // التحقق من ضرورة المزامنة
  shouldSync() {
    return (
      this.isOnline &&
      socketService.isConnected() &&
      (this.syncQueue.length > 0 || this.conflictQueue.length > 0) &&
      !this.syncInProgress
    );
  }

  // تنفيذ المزامنة
  async performSync() {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    console.log('🔄 بدء عملية المزامنة');

    try {
      // معالجة قائمة المزامنة
      await this.processSyncQueue();
      
      // معالجة التضارب
      await this.processConflictQueue();
      
      // تحديث الطابع الزمني
      this.lastSyncTimestamp = Date.now();
      localStorage.setItem(this.LAST_SYNC_KEY, this.lastSyncTimestamp.toString());
      
      this.retryAttempts = 0;
      console.log('✅ تمت المزامنة بنجاح');
      
    } catch (error) {
      console.error('❌ فشلت المزامنة:', error);
      this.handleSyncError(error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // معالجة قائمة المزامنة
  async processSyncQueue() {
    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (let operation of operations) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('❌ فشل في تنفيذ العملية:', operation.type, error);
        // إعادة العملية إلى القائمة للمحاولة لاحقاً
        this.conflictQueue.push({
          ...operation,
          error: error.message,
          retryCount: (operation.retryCount || 0) + 1
        });
      }
    }

    this.saveQueues();
  }

  // تنفيذ عملية واحدة
  async executeOperation(operation) {
    const { type, data, timestamp } = operation;

    switch (type) {
      case 'create-booking':
        return new Promise((resolve, reject) => {
          socketService.createBooking(data);
          
          // انتظار رد من الخادم
          const timeout = setTimeout(() => {
            reject(new Error('انتهت مهلة الانتظار'));
          }, 10000);

          const successHandler = () => {
            clearTimeout(timeout);
            resolve();
          };

          const errorHandler = (error) => {
            clearTimeout(timeout);
            reject(error);
          };

          socketService.on('booking-success', successHandler);
          socketService.on('booking-error', errorHandler);
        });

      case 'update-booking':
        return new Promise((resolve, reject) => {
          socketService.updateBooking(data.referenceNumber, data);
          
          const timeout = setTimeout(() => {
            reject(new Error('انتهت مهلة الانتظار'));
          }, 10000);

          const successHandler = () => {
            clearTimeout(timeout);
            resolve();
          };

          const errorHandler = (error) => {
            clearTimeout(timeout);
            reject(error);
          };

          socketService.on('booking-update-success', successHandler);
          socketService.on('booking-error', errorHandler);
        });

      case 'delete-booking':
        return new Promise((resolve, reject) => {
          socketService.deleteBooking(data.referenceNumber);
          
          const timeout = setTimeout(() => {
            reject(new Error('انتهت مهلة الانتظار'));
          }, 10000);

          const successHandler = () => {
            clearTimeout(timeout);
            resolve();
          };

          const errorHandler = (error) => {
            clearTimeout(timeout);
            reject(error);
          };

          socketService.on('booking-delete-success', successHandler);
          socketService.on('booking-error', errorHandler);
        });

      default:
        throw new Error(`نوع عملية غير معروف: ${type}`);
    }
  }

  // معالجة قائمة التضارب
  async processConflictQueue() {
    const conflicts = [...this.conflictQueue];
    this.conflictQueue = [];

    for (let conflict of conflicts) {
      if (conflict.retryCount > this.maxRetries) {
        console.warn('⚠️ تم تجاهل العملية بعد محاولات متعددة:', conflict);
        continue;
      }

      try {
        await this.executeOperation(conflict);
        console.log('✅ تم حل التضارب:', conflict.type);
      } catch (error) {
        // إعادة إلى قائمة التضارب
        this.conflictQueue.push({
          ...conflict,
          retryCount: conflict.retryCount + 1
        });
      }
    }

    this.saveQueues();
  }

  // معالجة إعادة الاتصال
  async handleReconnection() {
    if (this.syncInProgress) return;

    console.log('🔄 معالجة إعادة الاتصال - بدء المزامنة');
    
    // انتظار قصير للتأكد من استقرار الاتصال
    setTimeout(() => {
      this.performSync();
    }, 2000);

    // طلب البيانات المحدثة من الخادم
    socketService.getBookings();
  }

  // معالجة تحديث من الخادم
  handleServerUpdate(eventType, data) {
    console.log('📡 تحديث من الخادم:', eventType, data);
    
    // إشعار المكونات بالتحديث
    window.dispatchEvent(new CustomEvent('server-data-updated', {
      detail: { eventType, data }
    }));

    // حفظ البيانات كنسخة احتياطية
    this.saveBackupData(eventType, data);
  }

  // معالجة خطأ من الخادم
  handleServerError(error) {
    console.error('❌ خطأ من الخادم:', error);
    
    // إشعار المكونات بالخطأ
    window.dispatchEvent(new CustomEvent('server-error', {
      detail: { error }
    }));
  }

  // معالجة خطأ المزامنة
  handleSyncError(error) {
    this.retryAttempts++;
    
    if (this.retryAttempts < this.maxRetries) {
      const retryDelay = Math.pow(2, this.retryAttempts) * 1000; // Exponential backoff
      console.log(`🔄 إعادة المحاولة بعد ${retryDelay}ms`);
      
      setTimeout(() => {
        this.performSync();
      }, retryDelay);
    } else {
      console.error('❌ فشل نهائي في المزامنة بعد محاولات متعددة');
      
      // إشعار المستخدم
      window.dispatchEvent(new CustomEvent('sync-failed', {
        detail: { error, attempts: this.retryAttempts }
      }));
    }
  }

  // === طرق عامة للاستخدام ===

  // إضافة عملية للمزامنة
  addToSyncQueue(type, data) {
    const operation = {
      id: Date.now() + Math.random(), // معرف فريد
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.push(operation);
    this.saveQueues();

    console.log('📋 تمت إضافة عملية للمزامنة:', type);

    // محاولة مزامنة فورية إذا كان الاتصال متاح
    if (this.shouldSync()) {
      setTimeout(() => this.performSync(), 100);
    }

    return operation.id;
  }

  // إضافة حجز جديد
  createBooking(bookingData) {
    return this.addToSyncQueue('create-booking', bookingData);
  }

  // تحديث حجز
  updateBooking(referenceNumber, bookingData) {
    return this.addToSyncQueue('update-booking', { referenceNumber, ...bookingData });
  }

  // حذف حجز
  deleteBooking(referenceNumber) {
    return this.addToSyncQueue('delete-booking', { referenceNumber });
  }

  // مزامنة إجبارية
  async forcedSync() {
    if (!this.isOnline || !socketService.isConnected()) {
      console.log('⚠️ لا يمكن المزامنة - غير متصل');
      return false;
    }

    console.log('🔄 مزامنة إجبارية');
    await this.performSync();
    return true;
  }

  // === طرق التخزين المحلي ===

  // حفظ القوائم
  saveQueues() {
    try {
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
      localStorage.setItem(this.CONFLICT_QUEUE_KEY, JSON.stringify(this.conflictQueue));
    } catch (error) {
      console.error('❌ خطأ في حفظ قوائم المزامنة:', error);
    }
  }

  // استعادة القوائم 
  restoreQueues() {
    try {
      const syncQueue = localStorage.getItem(this.SYNC_QUEUE_KEY);
      const conflictQueue = localStorage.getItem(this.CONFLICT_QUEUE_KEY);
      const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);

      if (syncQueue) {
        this.syncQueue = JSON.parse(syncQueue);
        console.log('📋 تم استعادة قائمة المزامنة:', this.syncQueue.length, 'عملية');
      }

      if (conflictQueue) {
        this.conflictQueue = JSON.parse(conflictQueue);
        console.log('⚠️ تم استعادة قائمة التضارب:', this.conflictQueue.length, 'عملية');
      }

      if (lastSync) {
        this.lastSyncTimestamp = parseInt(lastSync);
      }
    } catch (error) {
      console.error('❌ خطأ في استعادة قوائم المزامنة:', error);
    }
  }

  // حفظ نسخة احتياطية من البيانات
  saveBackupData(eventType, data) {
    try {
      const backupData = {
        eventType,
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.BACKUP_DATA_KEY, JSON.stringify(backupData));
    } catch (error) {
      console.error('❌ خطأ في حفظ النسخة الاحتياطية:', error);
    }
  }

  // معالجة إغلاق النافذة
  setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.saveQueues();
      
      // محاولة مزامنة سريعة قبل الإغلاق
      if (this.syncQueue.length > 0 && this.isOnline) {
        navigator.sendBeacon('/api/sync', JSON.stringify({
          queue: this.syncQueue
        }));
      }
    });
  }

  // === إحصائيات النظام ===

  getStats() {
    return {
      isOnline: this.isOnline,
      isSocketConnected: socketService.isConnected(),
      syncQueueLength: this.syncQueue.length,
      conflictQueueLength: this.conflictQueue.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
      retryAttempts: this.retryAttempts,
      syncInProgress: this.syncInProgress
    };
  }

  // مسح جميع البيانات المحلية
  clearAllData() {
    this.syncQueue = [];
    this.conflictQueue = [];
    this.lastSyncTimestamp = null;
    this.retryAttempts = 0;
    
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
    localStorage.removeItem(this.CONFLICT_QUEUE_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);
    localStorage.removeItem(this.BACKUP_DATA_KEY);
    
    console.log('🗑️ تم مسح جميع بيانات المزامنة');
  }
}

// إنشاء instance واحد للتطبيق
const enhancedSync = new EnhancedClientSync();

export default enhancedSync;