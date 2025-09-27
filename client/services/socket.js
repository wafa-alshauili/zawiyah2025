import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(serverPath) {
    // تحديد عنوان الخادم للنشر على الإنترنت
    if (!serverPath) {
      // استخدام متغير البيئة أو الرابط الافتراضي
      if (process.env.NEXT_PUBLIC_SERVER_URL) {
        serverPath = process.env.NEXT_PUBLIC_SERVER_URL;
      } else if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname.startsWith('192.168')) {
          serverPath = `http://${hostname}:3001`;
        } else {
          // للنشر على الإنترنت - Render server
          serverPath = 'https://zawiyah2025.onrender.com';
        }
      } else {
        serverPath = 'http://localhost:3001';
      }
    }
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(serverPath, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // إعداد المستمعين الأساسيين
    this.socket.on('connect', () => {
      console.log('🔗 متصل بخادم زاوية 2025');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ انقطع الاتصال مع خادم زاوية 2025');
    });

    this.socket.on('connect_error', (error) => {
      console.error('خطأ في الاتصال:', error);
    });

    // مستمعي البيانات الرئيسيين
    this.socket.on('bookings-updated', (data) => {
      console.log('📅 تم تحديث الحجوزات:', data);
      this.notifyListeners('bookings-updated', data);
    });

    this.socket.on('booking-created', (data) => {
      console.log('✅ تم إنشاء حجز جديد:', data);
      this.notifyListeners('booking-created', data);
    });

    this.socket.on('booking-updated', (data) => {
      console.log('📝 تم تحديث حجز:', data);
      this.notifyListeners('booking-updated', data);
    });

    this.socket.on('booking-deleted', (data) => {
      console.log('🗑️ تم حذف حجز:', data);
      this.notifyListeners('booking-deleted', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // إضافة مستمع لحدث معين
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // إزالة مستمع
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // إشعار جميع المستمعين
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`خطأ في مستمع ${event}:`, error);
        }
      });
    }
  }

  // إرسال البيانات للخادم
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('غير متصل بالخادم، لا يمكن إرسال البيانات');
    }
  }

  // أساليب إدارة الحجوزات
  createBooking(bookingData) {
    this.emit('create-booking', bookingData);
  }

  updateBooking(referenceNumber, bookingData) {
    this.emit('update-booking', { referenceNumber, data: bookingData });
  }

  deleteBooking(referenceNumber) {
    this.emit('delete-booking', { referenceNumber });
  }

  getBookings() {
    this.emit('get-bookings');
  }

  searchBookingsByPhone(phone) {
    this.emit('search-bookings-by-phone', { phone });
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// إنشاء instance واحد للتطبيق كله
const socketService = new SocketService();

export default socketService;