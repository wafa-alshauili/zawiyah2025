// Advanced Conflict Resolution System
// نظام حل التضارب المتقدم للحجوزات المتزامنة

class ConflictResolver {
  constructor() {
    this.conflictStrategies = {
      'FIRST_COME_FIRST_SERVED': this.firstComeFirstServed.bind(this),
      'LAST_UPDATE_WINS': this.lastUpdateWins.bind(this),
      'TEACHER_PRIORITY': this.teacherPriority.bind(this),
      'MANUAL_RESOLUTION': this.manualResolution.bind(this)
    };
    
    this.pendingConflicts = new Map();
    this.conflictLog = [];
    this.teacherPriorities = this.loadTeacherPriorities();
  }

  // تحديد نوع التضارب
  detectConflictType(localBooking, serverBooking) {
    if (!localBooking && !serverBooking) {
      return 'NO_CONFLICT';
    }
    
    if (!localBooking) {
      return 'SERVER_ONLY';
    }
    
    if (!serverBooking) {
      return 'LOCAL_ONLY';
    }
    
    // مقارنة الطوابع الزمنية
    const localTime = new Date(localBooking.updatedAt || localBooking.createdAt);
    const serverTime = new Date(serverBooking.updatedAt || serverBooking.createdAt);
    
    if (Math.abs(localTime - serverTime) < 5000) { // أقل من 5 ثوان
      return 'SIMULTANEOUS_UPDATE';
    }
    
    if (this.isContentDifferent(localBooking, serverBooking)) {
      return 'CONTENT_CONFLICT';
    }
    
    return 'TIMESTAMP_CONFLICT';
  }

  // فحص اختلاف المحتوى
  isContentDifferent(booking1, booking2) {
    const keys = ['teacher', 'subject', 'teacherPhone', 'notes', 'classroomId', 'timeSlot', 'date'];
    
    return keys.some(key => {
      const val1 = booking1[key] ? booking1[key].toString().trim() : '';
      const val2 = booking2[key] ? booking2[key].toString().trim() : '';
      return val1 !== val2;
    });
  }

  // حل التضارب الرئيسي
  async resolveConflict(conflictData) {
    const { localBooking, serverBooking, conflictType, strategy = 'FIRST_COME_FIRST_SERVED' } = conflictData;
    
    console.log('⚔️ حل التضارب:', conflictType, 'الاستراتيجية:', strategy);
    
    // تسجيل التضارب
    this.logConflict(conflictData);
    
    // تطبيق استراتيجية الحل
    const resolution = await this.conflictStrategies[strategy](localBooking, serverBooking, conflictType);
    
    // حفظ القرار
    this.saveResolution(conflictData, resolution);
    
    return resolution;
  }

  // استراتيجية: الأول يحجز يكسب
  firstComeFirstServed(localBooking, serverBooking, conflictType) {
    if (!localBooking) return { winner: 'server', booking: serverBooking, action: 'accept' };
    if (!serverBooking) return { winner: 'local', booking: localBooking, action: 'create' };
    
    const localTime = new Date(localBooking.createdAt);
    const serverTime = new Date(serverBooking.createdAt);
    
    if (localTime < serverTime) {
      return { 
        winner: 'local', 
        booking: localBooking, 
        action: 'update',
        reason: 'Local booking was created first'
      };
    } else {
      return { 
        winner: 'server', 
        booking: serverBooking, 
        action: 'accept',
        reason: 'Server booking was created first'
      };
    }
  }

  // استراتيجية: آخر تحديث يكسب
  lastUpdateWins(localBooking, serverBooking, conflictType) {
    if (!localBooking) return { winner: 'server', booking: serverBooking, action: 'accept' };
    if (!serverBooking) return { winner: 'local', booking: localBooking, action: 'create' };
    
    const localTime = new Date(localBooking.updatedAt || localBooking.createdAt);
    const serverTime = new Date(serverBooking.updatedAt || serverBooking.createdAt);
    
    if (localTime > serverTime) {
      return { 
        winner: 'local', 
        booking: localBooking, 
        action: 'update',
        reason: 'Local booking has more recent update'
      };
    } else {
      return { 
        winner: 'server', 
        booking: serverBooking, 
        action: 'accept',
        reason: 'Server booking has more recent update'
      };
    }
  }

  // استراتيجية: أولوية المعلم
  teacherPriority(localBooking, serverBooking, conflictType) {
    if (!localBooking) return { winner: 'server', booking: serverBooking, action: 'accept' };
    if (!serverBooking) return { winner: 'local', booking: localBooking, action: 'create' };
    
    const localPriority = this.getTeacherPriority(localBooking.teacher);
    const serverPriority = this.getTeacherPriority(serverBooking.teacher);
    
    if (localPriority > serverPriority) {
      return { 
        winner: 'local', 
        booking: localBooking, 
        action: 'update',
        reason: `Higher priority teacher: ${localBooking.teacher} (${localPriority})`
      };
    } else if (serverPriority > localPriority) {
      return { 
        winner: 'server', 
        booking: serverBooking, 
        action: 'accept',
        reason: `Higher priority teacher: ${serverBooking.teacher} (${serverPriority})`
      };
    } else {
      // نفس الأولوية، استخدم الأول يحجز يكسب
      return this.firstComeFirstServed(localBooking, serverBooking, conflictType);
    }
  }

  // استراتيجية: حل يدوي
  async manualResolution(localBooking, serverBooking, conflictType) {
    const conflictId = Date.now() + Math.random();
    
    // إضافة التضارب لقائمة الانتظار
    this.pendingConflicts.set(conflictId, {
      localBooking,
      serverBooking,
      conflictType,
      timestamp: Date.now()
    });
    
    // إشعار المستخدم
    const userChoice = await this.showConflictDialog(conflictId, localBooking, serverBooking);
    
    // إزالة من قائمة الانتظار
    this.pendingConflicts.delete(conflictId);
    
    return userChoice;
  }

  // إظهار حوار التضارب للمستخدم
  async showConflictDialog(conflictId, localBooking, serverBooking) {
    return new Promise((resolve) => {
      // إنشاء نافذة حوار
      const modal = this.createConflictModal(conflictId, localBooking, serverBooking, resolve);
      document.body.appendChild(modal);
    });
  }

  // إنشاء نافذة التضارب
  createConflictModal(conflictId, localBooking, serverBooking, resolve) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" dir="rtl">
        <h2 class="text-xl font-bold text-center mb-4 text-red-600">
          ⚔️ تضارب في الحجز!
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="border rounded-lg p-4 bg-blue-50">
            <h3 class="font-bold text-blue-800 mb-2">الحجز المحلي</h3>
            <p><strong>المعلم:</strong> ${localBooking?.teacher || 'غير محدد'}</p>
            <p><strong>المادة:</strong> ${localBooking?.subject || 'غير محدد'}</p>
            <p><strong>الوقت:</strong> ${this.formatDateTime(localBooking?.date, localBooking?.timeSlot)}</p>
            <p><strong>تم الإنشاء:</strong> ${this.formatDateTime(localBooking?.createdAt)}</p>
          </div>
          
          <div class="border rounded-lg p-4 bg-green-50">
            <h3 class="font-bold text-green-800 mb-2">الحجز من الخادم</h3>
            <p><strong>المعلم:</strong> ${serverBooking?.teacher || 'غير محدد'}</p>
            <p><strong>المادة:</strong> ${serverBooking?.subject || 'غير محدد'}</p>
            <p><strong>الوقت:</strong> ${this.formatDateTime(serverBooking?.date, serverBooking?.timeSlot)}</p>
            <p><strong>تم الإنشاء:</strong> ${this.formatDateTime(serverBooking?.createdAt)}</p>
          </div>
        </div>
        
        <div class="text-center">
          <p class="mb-4 text-gray-700">أيهما تريد الاحتفاظ به؟</p>
          <div class="flex gap-4 justify-center">
            <button class="local-choice bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
              الحجز المحلي
            </button>
            <button class="server-choice bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
              الحجز من الخادم
            </button>
            <button class="merge-choice bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600">
              دمج البيانات
            </button>
          </div>
        </div>
      </div>
    `;

    // إضافة أحداث الأزرار
    modal.querySelector('.local-choice').onclick = () => {
      document.body.removeChild(modal);
      resolve({ winner: 'local', booking: localBooking, action: 'update', reason: 'User choice' });
    };

    modal.querySelector('.server-choice').onclick = () => {
      document.body.removeChild(modal);
      resolve({ winner: 'server', booking: serverBooking, action: 'accept', reason: 'User choice' });
    };

    modal.querySelector('.merge-choice').onclick = () => {
      const mergedBooking = this.mergeBookings(localBooking, serverBooking);
      document.body.removeChild(modal);
      resolve({ winner: 'merged', booking: mergedBooking, action: 'update', reason: 'User merge' });
    };

    return modal;
  }

  // دمج الحجوزات
  mergeBookings(localBooking, serverBooking) {
    const merged = { ...serverBooking }; // البيانات الأساسية من الخادم
    
    // إضافة البيانات المفقودة من المحلي
    if (localBooking.notes && !merged.notes) {
      merged.notes = localBooking.notes;
    }
    
    if (localBooking.teacherPhone && !merged.teacherPhone) {
      merged.teacherPhone = localBooking.teacherPhone;
    }
    
    // استخدام أحدث وقت تحديث
    const localTime = new Date(localBooking.updatedAt || localBooking.createdAt);
    const serverTime = new Date(serverBooking.updatedAt || serverBooking.createdAt);
    
    if (localTime > serverTime) {
      merged.updatedAt = localBooking.updatedAt;
    }
    
    return merged;
  }

  // الحصول على أولوية المعلم
  getTeacherPriority(teacherName) {
    return this.teacherPriorities[teacherName] || 1; // أولوية افتراضية
  }

  // تحميل أولويات المعلمين
  loadTeacherPriorities() {
    try {
      const stored = localStorage.getItem('zawiyah_teacher_priorities');
      return stored ? JSON.parse(stored) : {
        // أولويات افتراضية
        'مدير المدرسة': 10,
        'نائب المدير': 9,
        'رئيس القسم': 8,
        'معلم أول': 7,
        'معلم': 5
      };
    } catch {
      return {};
    }
  }

  // تحديث أولوية معلم
  updateTeacherPriority(teacherName, priority) {
    this.teacherPriorities[teacherName] = priority;
    localStorage.setItem('zawiyah_teacher_priorities', JSON.stringify(this.teacherPriorities));
  }

  // تسجيل التضارب
  logConflict(conflictData) {
    const logEntry = {
      timestamp: Date.now(),
      conflictType: conflictData.conflictType,
      localTeacher: conflictData.localBooking?.teacher,
      serverTeacher: conflictData.serverBooking?.teacher,
      bookingKey: conflictData.localBooking?.referenceNumber || conflictData.serverBooking?.referenceNumber
    };
    
    this.conflictLog.push(logEntry);
    
    // الاحتفاظ بآخر 100 تضارب فقط
    if (this.conflictLog.length > 100) {
      this.conflictLog = this.conflictLog.slice(-100);
    }
    
    // حفظ في localStorage
    localStorage.setItem('zawiyah_conflict_log', JSON.stringify(this.conflictLog));
  }

  // حفظ قرار الحل
  saveResolution(conflictData, resolution) {
    const resolutionEntry = {
      timestamp: Date.now(),
      conflictType: conflictData.conflictType,
      winner: resolution.winner,
      reason: resolution.reason,
      action: resolution.action
    };
    
    const resolutions = this.getResolutionHistory();
    resolutions.push(resolutionEntry);
    
    // الاحتفاظ بآخر 50 قرار فقط
    if (resolutions.length > 50) {
      resolutions.splice(0, resolutions.length - 50);
    }
    
    localStorage.setItem('zawiyah_conflict_resolutions', JSON.stringify(resolutions));
  }

  // الحصول على تاريخ القرارات
  getResolutionHistory() {
    try {
      const stored = localStorage.getItem('zawiyah_conflict_resolutions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // تنسيق التاريخ والوقت
  formatDateTime(dateString, timeSlot) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    const timeString = timeSlot ? ` - ${timeSlot}` : '';
    
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + timeString;
  }

  // تنظيف البيانات القديمة
  cleanup() {
    // إزالة التضارب القديم (أكثر من ساعة)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (let [id, conflict] of this.pendingConflicts) {
      if (conflict.timestamp < oneHourAgo) {
        this.pendingConflicts.delete(id);
      }
    }
    
    // تنظيف سجل التضارب (أكثر من شهر)
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.conflictLog = this.conflictLog.filter(log => log.timestamp > oneMonthAgo);
    localStorage.setItem('zawiyah_conflict_log', JSON.stringify(this.conflictLog));
  }

  // إحصائيات التضارب
  getConflictStats() {
    const recentConflicts = this.conflictLog.filter(log => 
      log.timestamp > Date.now() - (24 * 60 * 60 * 1000) // آخر 24 ساعة
    );
    
    const conflictTypes = {};
    recentConflicts.forEach(conflict => {
      conflictTypes[conflict.conflictType] = (conflictTypes[conflict.conflictType] || 0) + 1;
    });
    
    return {
      totalConflicts: this.conflictLog.length,
      recentConflicts: recentConflicts.length,
      pendingConflicts: this.pendingConflicts.size,
      conflictTypes,
      resolutionHistory: this.getResolutionHistory().length
    };
  }
}

// إنشاء instance واحد
const conflictResolver = new ConflictResolver();

// تنظيف دوري كل ساعة
setInterval(() => {
  conflictResolver.cleanup();
}, 60 * 60 * 1000);

export default conflictResolver;