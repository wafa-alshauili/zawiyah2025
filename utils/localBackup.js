// Local storage backup system for serverless compatibility
// نظام نسخ احتياطي محلي متوافق مع Serverless

class LocalBackupStorage {
  constructor() {
    this.storageKey = 'zawiyah_bookings_backup';
    this.lastSyncKey = 'zawiyah_last_sync';
    this.isClient = typeof window !== 'undefined';
    
    if (this.isClient) {
      console.log('💾 تم تهيئة نظام النسخ الاحتياطي المحلي');
      this.loadFromStorage();
      
      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Auto-save every 30 seconds
      setInterval(this.autoSave.bind(this), 30000);
    }
  }

  // Save bookings to localStorage
  saveBookings(bookings) {
    if (!this.isClient) return false;
    
    try {
      const backupData = {
        bookings,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(backupData));
      localStorage.setItem(this.lastSyncKey, Date.now().toString());
      
      console.log('💾 تم حفظ النسخة الاحتياطية:', Object.keys(bookings).length, 'حجز');
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('bookings-updated'));
      
      return true;
    } catch (error) {
      console.error('خطأ في حفظ النسخة الاحتياطية:', error);
      return false;
    }
  }

  // Load bookings from localStorage
  loadFromStorage() {
    if (!this.isClient) return {};
    
    try {
      const backupData = localStorage.getItem(this.storageKey);
      if (!backupData) return {};
      
      const parsed = JSON.parse(backupData);
      console.log('📂 تم تحميل النسخة الاحتياطية:', Object.keys(parsed.bookings || {}).length, 'حجز');
      
      return parsed.bookings || {};
    } catch (error) {
      console.error('خطأ في تحميل النسخة الاحتياطية:', error);
      return {};
    }
  }

  // Get last sync timestamp
  getLastSync() {
    if (!this.isClient) return null;
    
    const lastSync = localStorage.getItem(this.lastSyncKey);
    return lastSync ? parseInt(lastSync) : null;
  }

  // Handle storage changes from other tabs
  handleStorageChange(event) {
    if (event.key === this.storageKey) {
      console.log('🔄 تم اكتشاف تغيير في النسخة الاحتياطية من علامة تبويب أخرى');
      window.dispatchEvent(new Event('external-bookings-updated'));
    }
  }

  // Auto-save current bookings
  autoSave() {
    // This will be called by components that have access to current bookings
    console.log('⏰ تشغيل الحفظ التلقائي...');
  }

  // Merge server and local data
  mergeBookings(serverBookings, localBookings) {
    const merged = { ...localBookings };
    
    // Server data takes priority for existing keys
    Object.keys(serverBookings).forEach(key => {
      const serverBooking = serverBookings[key];
      const localBooking = localBookings[key];
      
      if (!localBooking || 
          new Date(serverBooking.createdAt || 0) > new Date(localBooking.createdAt || 0)) {
        merged[key] = serverBooking;
      }
    });
    
    console.log('🔄 تم دمج البيانات:', Object.keys(merged).length, 'حجز');
    return merged;
  }

  // Clear all local data
  clearStorage() {
    if (!this.isClient) return;
    
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.lastSyncKey);
      console.log('🗑️ تم مسح النسخة الاحتياطية المحلية');
    } catch (error) {
      console.error('خطأ في مسح التخزين:', error);
    }
  }

  // Get storage statistics
  getStats() {
    if (!this.isClient) return null;
    
    const backupData = this.loadFromStorage();
    const lastSync = this.getLastSync();
    
    return {
      bookingsCount: Object.keys(backupData).length,
      lastSync: lastSync ? new Date(lastSync).toISOString() : null,
      storageSize: localStorage.getItem(this.storageKey)?.length || 0
    };
  }
}

// Export singleton instance
const localBackup = new LocalBackupStorage();

export default localBackup;