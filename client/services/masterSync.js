// Master Synchronization Manager
// المدير الرئيسي للمزامنة - ينسق بين جميع أنظمة المزامنة

import socketService from './socket';
import enhancedSync from './enhancedSync';
import conflictResolver from './conflictResolver';
import autoRecovery from './autoRecovery';
import systemMonitor from './systemMonitor';

class MasterSyncManager {
  constructor() {
    this.isInitialized = false;
    this.syncMode = 'AUTO'; // AUTO, MANUAL, OFFLINE
    this.lastFullSync = null;
    this.pendingOperations = new Map();
    
    // Configuration
    this.config = {
      autoSyncInterval: 30000,    // 30 seconds
      conflictResolution: 'FIRST_COME_FIRST_SERVED',
      maxRetries: 5,
      backupEnabled: true,
      monitoringEnabled: true
    };
    
    this.eventBus = new EventTarget();
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      conflicts: 0,
      recoveries: 0,
      startTime: Date.now()
    };
  }

  // تهيئة المدير الرئيسي
  async init() {
    if (this.isInitialized) return;

    console.log('🚀 تهيئة المدير الرئيسي للمزامنة');

    try {
      // تحميل الإعدادات
      await this.loadConfiguration();
      
      // تهيئة الأنظمة الفرعية
      await this.initializeSubsystems();
      
      // إعداد التنسيق بين الأنظمة
      this.setupInterSystemCommunication();
      
      // بدء العمليات التلقائية
      this.startAutomaticOperations();
      
      this.isInitialized = true;
      console.log('✅ تم تهيئة المدير الرئيسي بنجاح');
      
      // إشعار بالتهيئة الناجحة
      this.emit('initialized', { timestamp: Date.now() });
      
    } catch (error) {
      console.error('❌ فشل في تهيئة المدير الرئيسي:', error);
      throw error;
    }
  }

  // تحميل الإعدادات
  async loadConfiguration() {
    try {
      const savedConfig = localStorage.getItem('zawiyah_sync_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
      
      console.log('⚙️ تم تحميل الإعدادات:', this.config);
    } catch (error) {
      console.warn('⚠️ فشل في تحميل الإعدادات، استخدام الافتراضية');
    }
  }

  // تهيئة الأنظمة الفرعية
  async initializeSubsystems() {
    // تأكد من تهيئة Socket.IO
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // تهيئة نظام المراقبة إذا كان مفعل
    if (this.config.monitoringEnabled) {
      systemMonitor.startMonitoring();
    }

    // تحديث الإحصائيات
    this.stats.startTime = Date.now();
  }

  // إعداد التنسيق بين الأنظمة
  setupInterSystemCommunication() {
    // ربط أحداث المزامنة المحسنة
    enhancedSync.on('sync-started', (data) => {
      this.handleSyncStarted(data);
    });

    enhancedSync.on('sync-completed', (data) => {
      this.handleSyncCompleted(data);
    });

    enhancedSync.on('sync-failed', (data) => {
      this.handleSyncFailed(data);
    });

    // ربط أحداث حل التضارب
    window.addEventListener('conflict-detected', (event) => {
      this.handleConflictDetected(event.detail);
    });

    // ربط أحداث الاسترداد
    window.addEventListener('recovery-needed', (event) => {
      this.handleRecoveryNeeded(event.detail);
    });

    // ربط أحداث المراقبة
    window.addEventListener('system-alert', (event) => {
      this.handleSystemAlert(event.detail);
    });
  }

  // بدء العمليات التلقائية
  startAutomaticOperations() {
    if (this.syncMode === 'AUTO') {
      // مزامنة تلقائية دورية
      setInterval(() => {
        this.performScheduledSync();
      }, this.config.autoSyncInterval);

      // فحص دوري للتضارب
      setInterval(() => {
        this.checkForConflicts();
      }, 60000); // كل دقيقة

      // تنظيف دوري
      setInterval(() => {
        this.performMaintenance();
      }, 300000); // كل 5 دقائق
    }
  }

  // === العمليات الرئيسية ===

  // مزامنة شاملة
  async performFullSync() {
    console.log('🔄 بدء المزامنة الشاملة');
    
    try {
      this.emit('full-sync-started');
      
      // 1. تحديث البيانات من الخادم
      const serverData = await this.fetchServerData();
      
      // 2. مقارنة مع البيانات المحلية
      const conflicts = await this.compareWithLocalData(serverData);
      
      // 3. حل التضارب إن وجد
      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts);
      }
      
      // 4. تطبيق التحديثات
      await this.applyUpdates(serverData);
      
      // 5. مزامنة العمليات المعلقة
      await this.syncPendingOperations();
      
      this.lastFullSync = Date.now();
      this.stats.totalSyncs++;
      this.stats.successfulSyncs++;
      
      console.log('✅ تمت المزامنة الشاملة بنجاح');
      this.emit('full-sync-completed', { timestamp: this.lastFullSync });
      
      return { success: true, timestamp: this.lastFullSync };
      
    } catch (error) {
      console.error('❌ فشلت المزامنة الشاملة:', error);
      this.emit('full-sync-failed', { error: error.message });
      
      // محاولة استرداد
      autoRecovery.handleRecoveryEvent('SYNC_FAILED', { error: error.message });
      
      return { success: false, error: error.message };
    }
  }

  // مزامنة مجدولة
  async performScheduledSync() {
    if (!this.isInitialized || this.syncMode !== 'AUTO') return;

    // فحص الحاجة للمزامنة
    if (!this.shouldPerformSync()) return;

    try {
      await enhancedSync.forcedSync();
    } catch (error) {
      console.warn('⚠️ فشلت المزامنة المجدولة:', error);
    }
  }

  // فحص الحاجة للمزامنة
  shouldPerformSync() {
    // فحص الاتصال بالإنترنت
    if (!navigator.onLine) return false;
    
    // فحص اتصال Socket.IO
    if (!socketService.isConnected()) return false;
    
    // فحص وجود عمليات معلقة
    const syncStats = enhancedSync.getStats();
    if (syncStats.syncQueueLength > 0) return true;
    
    // فحص آخر مزامنة
    if (!this.lastFullSync || Date.now() - this.lastFullSync > 300000) { // 5 دقائق
      return true;
    }
    
    return false;
  }

  // جلب البيانات من الخادم
  async fetchServerData() {
    try {
      const [bookings, classrooms, timeSlots] = await Promise.all([
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/classrooms').then(r => r.json()),
        fetch('/api/timeslots').then(r => r.json())
      ]);

      return {
        bookings: bookings.data || {},
        classrooms: classrooms.data || [],
        timeSlots: timeSlots.data || []
      };
    } catch (error) {
      console.error('❌ فشل في جلب البيانات من الخادم:', error);
      throw error;
    }
  }

  // مقارنة مع البيانات المحلية
  async compareWithLocalData(serverData) {
    const conflicts = [];
    
    try {
      // مقارنة الحجوزات
      const localBookings = JSON.parse(localStorage.getItem('zawiyah_bookings_backup') || '{}');
      
      // البحث عن التضارب
      for (let key in serverData.bookings) {
        const serverBooking = serverData.bookings[key];
        const localBooking = localBookings[key];
        
        if (localBooking) {
          const conflictType = conflictResolver.detectConflictType(localBooking, serverBooking);
          
          if (conflictType !== 'NO_CONFLICT') {
            conflicts.push({
              key,
              localBooking,
              serverBooking,
              conflictType
            });
          }
        }
      }
      
      // البحث عن الحجوزات المحلية غير الموجودة على الخادم
      for (let key in localBookings) {
        if (!serverData.bookings[key]) {
          conflicts.push({
            key,
            localBooking: localBookings[key],
            serverBooking: null,
            conflictType: 'LOCAL_ONLY'
          });
        }
      }
      
    } catch (error) {
      console.error('❌ خطأ في مقارنة البيانات:', error);
    }
    
    return conflicts;
  }

  // حل التضارب
  async resolveConflicts(conflicts) {
    console.log('⚔️ حل التضارب:', conflicts.length, 'تضارب');
    
    for (let conflict of conflicts) {
      try {
        const resolution = await conflictResolver.resolveConflict({
          localBooking: conflict.localBooking,
          serverBooking: conflict.serverBooking,
          conflictType: conflict.conflictType,
          strategy: this.config.conflictResolution
        });
        
        await this.applyConflictResolution(conflict.key, resolution);
        this.stats.conflicts++;
        
      } catch (error) {
        console.error('❌ فشل في حل التضارب:', conflict.key, error);
      }
    }
  }

  // تطبيق قرار حل التضارب
  async applyConflictResolution(key, resolution) {
    const { winner, booking, action } = resolution;
    
    switch (action) {
      case 'accept':
        // قبول من الخادم - لا حاجة لفعل شيء
        break;
        
      case 'update':
        // تحديث الخادم
        await enhancedSync.updateBooking(booking.referenceNumber, booking);
        break;
        
      case 'create':
        // إنشاء جديد
        await enhancedSync.createBooking(booking);
        break;
        
      case 'delete':
        // حذف
        await enhancedSync.deleteBooking(booking.referenceNumber);
        break;
    }
  }

  // تطبيق التحديثات
  async applyUpdates(serverData) {
    try {
      // حفظ البيانات المحدثة محلياً
      localStorage.setItem('zawiyah_bookings_backup', JSON.stringify(serverData.bookings));
      localStorage.setItem('zawiyah_classrooms_backup', JSON.stringify(serverData.classrooms));
      localStorage.setItem('zawiyah_timeslots_backup', JSON.stringify(serverData.timeSlots));
      
      // إشعار التطبيق بالتحديث
      window.dispatchEvent(new CustomEvent('data-updated', {
        detail: serverData
      }));
      
    } catch (error) {
      console.error('❌ فشل في تطبيق التحديثات:', error);
      throw error;
    }
  }

  // مزامنة العمليات المعلقة
  async syncPendingOperations() {
    try {
      const stats = enhancedSync.getStats();
      
      if (stats.syncQueueLength > 0) {
        console.log('📋 مزامنة العمليات المعلقة:', stats.syncQueueLength);
        await enhancedSync.forcedSync();
      }
      
    } catch (error) {
      console.error('❌ فشل في مزامنة العمليات المعلقة:', error);
    }
  }

  // === معالجات الأحداث ===

  handleSyncStarted(data) {
    console.log('🔄 بدء المزامنة:', data);
    this.emit('sync-started', data);
  }

  handleSyncCompleted(data) {
    console.log('✅ اكتملت المزامنة:', data);
    this.stats.successfulSyncs++;
    this.emit('sync-completed', data);
  }

  handleSyncFailed(data) {
    console.log('❌ فشلت المزامنة:', data);
    this.emit('sync-failed', data);
    
    // تشغيل نظام الاسترداد
    autoRecovery.handleRecoveryEvent('SYNC_FAILED', data);
  }

  handleConflictDetected(data) {
    console.log('⚔️ تم اكتشاف تضارب:', data);
    this.stats.conflicts++;
    this.emit('conflict-detected', data);
  }

  handleRecoveryNeeded(data) {
    console.log('🛠️ مطلوب استرداد:', data);
    this.stats.recoveries++;
    this.emit('recovery-needed', data);
  }

  handleSystemAlert(data) {
    console.log('⚠️ تنبيه النظام:', data);
    this.emit('system-alert', data);
  }

  // فحص التضارب
  async checkForConflicts() {
    try {
      // جلب آخر البيانات من الخادم
      const serverData = await this.fetchServerData();
      const conflicts = await this.compareWithLocalData(serverData);
      
      if (conflicts.length > 0) {
        console.log('⚔️ تم اكتشاف تضارب جديد:', conflicts.length);
        
        for (let conflict of conflicts) {
          window.dispatchEvent(new CustomEvent('conflict-detected', {
            detail: conflict
          }));
        }
      }
      
    } catch (error) {
      console.warn('⚠️ فشل فحص التضارب:', error);
    }
  }

  // الصيانة الدورية
  performMaintenance() {
    console.log('🧹 تنفيذ الصيانة الدورية');
    
    try {
      // تنظيف البيانات القديمة
      this.cleanupOldData();
      
      // ضغط التخزين المحلي
      this.optimizeStorage();
      
      // حفظ الإحصائيات
      this.saveStats();
      
    } catch (error) {
      console.error('❌ خطأ في الصيانة:', error);
    }
  }

  // تنظيف البيانات القديمة
  cleanupOldData() {
    // تنظيف الحالة المعلقة
    this.pendingOperations.clear();
    
    // تنظيف السجلات القديمة
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // تنظيف سجل الأحداث
    try {
      const events = JSON.parse(localStorage.getItem('zawiyah_event_log') || '[]');
      const recentEvents = events.filter(event => event.timestamp > oneWeekAgo);
      localStorage.setItem('zawiyah_event_log', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('⚠️ خطأ في تنظيف سجل الأحداث:', error);
    }
  }

  // تحسين التخزين
  optimizeStorage() {
    try {
      // ضغط البيانات المكررة
      const bookings = JSON.parse(localStorage.getItem('zawiyah_bookings_backup') || '{}');
      const optimizedBookings = this.optimizeBookingsData(bookings);
      localStorage.setItem('zawiyah_bookings_backup', JSON.stringify(optimizedBookings));
      
    } catch (error) {
      console.warn('⚠️ خطأ في تحسين التخزين:', error);
    }
  }

  // تحسين بيانات الحجوزات
  optimizeBookingsData(bookings) {
    const optimized = {};
    
    for (let key in bookings) {
      const booking = bookings[key];
      
      // إزالة الحقول الفارغة أو غير الضرورية
      const cleanBooking = {};
      
      for (let field in booking) {
        if (booking[field] !== null && booking[field] !== undefined && booking[field] !== '') {
          cleanBooking[field] = booking[field];
        }
      }
      
      optimized[key] = cleanBooking;
    }
    
    return optimized;
  }

  // === API العامة ===

  // إضافة حجز
  async createBooking(bookingData) {
    try {
      const operationId = enhancedSync.createBooking(bookingData);
      this.pendingOperations.set(operationId, {
        type: 'create',
        data: bookingData,
        timestamp: Date.now()
      });
      
      return operationId;
    } catch (error) {
      console.error('❌ فشل في إضافة الحجز:', error);
      throw error;
    }
  }

  // تحديث حجز
  async updateBooking(referenceNumber, bookingData) {
    try {
      const operationId = enhancedSync.updateBooking(referenceNumber, bookingData);
      this.pendingOperations.set(operationId, {
        type: 'update',
        referenceNumber,
        data: bookingData,
        timestamp: Date.now()
      });
      
      return operationId;
    } catch (error) {
      console.error('❌ فشل في تحديث الحجز:', error);
      throw error;
    }
  }

  // حذف حجز
  async deleteBooking(referenceNumber) {
    try {
      const operationId = enhancedSync.deleteBooking(referenceNumber);
      this.pendingOperations.set(operationId, {
        type: 'delete',
        referenceNumber,
        timestamp: Date.now()
      });
      
      return operationId;
    } catch (error) {
      console.error('❌ فشل في حذف الحجز:', error);
      throw error;
    }
  }

  // البحث عن حجوزات
  async searchBookings(criteria) {
    try {
      if (criteria.phone) {
        // البحث بالهاتف
        const response = await fetch(`/api/bookings/search?phone=${criteria.phone}`);
        const result = await response.json();
        return result.data || [];
      }
      
      // بحث محلي
      const bookings = JSON.parse(localStorage.getItem('zawiyah_bookings_backup') || '{}');
      const results = [];
      
      for (let key in bookings) {
        const booking = bookings[key];
        let matches = true;
        
        if (criteria.teacher && !booking.teacher?.includes(criteria.teacher)) {
          matches = false;
        }
        
        if (criteria.subject && !booking.subject?.includes(criteria.subject)) {
          matches = false;
        }
        
        if (criteria.date && booking.date !== criteria.date) {
          matches = false;
        }
        
        if (matches) {
          results.push(booking);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ فشل في البحث:', error);
      return [];
    }
  }

  // تغيير وضع المزامنة
  setSyncMode(mode) {
    if (!['AUTO', 'MANUAL', 'OFFLINE'].includes(mode)) {
      throw new Error('وضع مزامنة غير صالح');
    }
    
    this.syncMode = mode;
    console.log('⚙️ تم تغيير وضع المزامنة إلى:', mode);
    
    // حفظ الإعداد
    this.config.syncMode = mode;
    this.saveConfiguration();
    
    this.emit('sync-mode-changed', { mode });
  }

  // تحديث الإعدادات
  updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfiguration();
    console.log('⚙️ تم تحديث الإعدادات:', this.config);
    this.emit('config-updated', this.config);
  }

  // حفظ الإعدادات
  saveConfiguration() {
    try {
      localStorage.setItem('zawiyah_sync_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ فشل في حفظ الإعدادات:', error);
    }
  }

  // حفظ الإحصائيات
  saveStats() {
    try {
      localStorage.setItem('zawiyah_sync_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('❌ فشل في حفظ الإحصائيات:', error);
    }
  }

  // الحصول على حالة النظام الشاملة
  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      syncMode: this.syncMode,
      lastFullSync: this.lastFullSync,
      pendingOperations: this.pendingOperations.size,
      stats: this.stats,
      config: this.config,
      subsystems: {
        enhancedSync: enhancedSync.getStats(),
        conflictResolver: conflictResolver.getConflictStats(),
        autoRecovery: autoRecovery.getRecoveryStats(),
        systemMonitor: systemMonitor.getSummary()
      }
    };
  }

  // الحصول على تقرير شامل
  generateReport() {
    const status = this.getSystemStatus();
    
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      systemStatus: status,
      healthCheck: this.performHealthCheck(),
      recommendations: this.generateRecommendations(status)
    };
  }

  // فحص الصحة
  performHealthCheck() {
    const health = {
      overall: 'GOOD',
      issues: [],
      warnings: []
    };

    // فحص الاتصال
    if (!navigator.onLine) {
      health.issues.push('لا يوجد اتصال بالإنترنت');
      health.overall = 'POOR';
    }

    // فحص Socket.IO
    if (!socketService.isConnected()) {
      health.warnings.push('Socket.IO غير متصل');
      if (health.overall === 'GOOD') health.overall = 'FAIR';
    }

    // فحص العمليات المعلقة
    if (this.pendingOperations.size > 10) {
      health.warnings.push(`عدد كبير من العمليات المعلقة: ${this.pendingOperations.size}`);
      if (health.overall === 'GOOD') health.overall = 'FAIR';
    }

    // فحص آخر مزامنة
    if (!this.lastFullSync || Date.now() - this.lastFullSync > 600000) { // 10 دقائق
      health.warnings.push('لم تتم المزامنة منذ فترة طويلة');
      if (health.overall === 'GOOD') health.overall = 'FAIR';
    }

    return health;
  }

  // توليد التوصيات
  generateRecommendations(status) {
    const recommendations = [];

    // توصيات الأداء
    if (status.stats.conflicts > status.stats.totalSyncs * 0.1) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        message: 'معدل التضارب مرتفع، يُنصح بمراجعة استراتيجية حل التضارب'
      });
    }

    // توصيات التخزين
    const storageUsage = JSON.stringify(localStorage).length;
    if (storageUsage > 5 * 1024 * 1024) { // 5MB
      recommendations.push({
        type: 'STORAGE',
        priority: 'MEDIUM',
        message: 'استخدام التخزين المحلي مرتفع، يُنصح بالتنظيف'
      });
    }

    // توصيات المزامنة
    if (status.pendingOperations > 5) {
      recommendations.push({
        type: 'SYNC',
        priority: 'MEDIUM',
        message: 'يوجد عدد كبير من العمليات المعلقة، يُنصح بالمزامنة اليدوية'
      });
    }

    return recommendations;
  }

  // إضافة مستمع أحداث
  on(event, callback) {
    this.eventBus.addEventListener(event, callback);
  }

  // إزالة مستمع أحداث
  off(event, callback) {
    this.eventBus.removeEventListener(event, callback);
  }

  // إرسال حدث
  emit(event, data) {
    this.eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  // إيقاف النظام
  async shutdown() {
    console.log('🛑 إيقاف المدير الرئيسي للمزامنة');
    
    try {
      // حفظ العمليات المعلقة
      await this.syncPendingOperations();
      
      // حفظ الإحصائيات والإعدادات
      this.saveStats();
      this.saveConfiguration();
      
      // إيقاف الأنظمة الفرعية
      systemMonitor.stopMonitoring();
      
      this.isInitialized = false;
      this.emit('shutdown', { timestamp: Date.now() });
      
    } catch (error) {
      console.error('❌ خطأ في إيقاف النظام:', error);
    }
  }
}

// إنشاء instance واحد للمدير الرئيسي
const masterSync = new MasterSyncManager();

export default masterSync;