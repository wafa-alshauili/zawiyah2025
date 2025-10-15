// مثال على ضمان حفظ البيانات في Firebase
import firebaseService from '../services/firebase'

// مثال: إنشاء حجز مع ضمان الحفظ الدائم
const createPermanentBooking = async (bookingData) => {
  try {
    console.log('🔄 بدء حفظ الحجز في Firebase...')
    
    // 1. حفظ في Firebase (السحابة) - الأولوية الأولى
    const savedBooking = await firebaseService.createBooking({
      classroom_id: bookingData.room,
      teacher_name: bookingData.teacher,
      subject: bookingData.subject,
      date: bookingData.date,
      time_slot: bookingData.timeSlot,
      notes: bookingData.notes || '',
      phone: bookingData.phone || '',
      
      // معلومات إضافية للحفظ الدائم
      created_by_ip: getClientIP(),
      created_by_device: navigator.userAgent,
      backup_timestamp: new Date().toISOString(),
      permanent_id: generateUniqueId()
    })
    
    console.log('✅ تم حفظ الحجز في Firebase بنجاح!')
    console.log('📍 معرف الحجز الدائم:', savedBooking.id)
    
    // 2. حفظ نسخة احتياطية محلية (للسرعة)
    try {
      const localBackup = {
        ...savedBooking,
        local_backup_time: new Date().toISOString(),
        firebase_synced: true
      }
      localStorage.setItem(`booking_${savedBooking.id}`, JSON.stringify(localBackup))
      console.log('💾 تم حفظ النسخة الاحتياطية المحلية')
    } catch (localError) {
      console.warn('⚠️ فشل في الحفظ المحلي، لكن البيانات محفوظة في Firebase')
    }
    
    // 3. تأكيد الحفظ الدائم
    const verification = await firebaseService.getBookingById(savedBooking.id)
    if (verification) {
      console.log('🎉 تأكيد: البيانات محفوظة بشكل دائم في Firebase!')
      return {
        success: true,
        permanently_saved: true,
        booking_id: savedBooking.id,
        cloud_location: 'Firebase Firestore',
        backup_status: 'متاح',
        recovery_possible: true
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error)
    
    // في حالة فشل Firebase، حفظ محلي مؤقت
    const tempId = Date.now().toString()
    const tempBooking = {
      ...bookingData,
      temp_id: tempId,
      saved_offline: true,
      needs_cloud_sync: true,
      created_at: new Date().toISOString()
    }
    
    localStorage.setItem(`temp_booking_${tempId}`, JSON.stringify(tempBooking))
    
    // محاولة المزامنة لاحقاً
    scheduleCloudSync(tempBooking)
    
    return {
      success: true,
      temporarily_saved: true,
      will_sync_later: true,
      temp_id: tempId
    }
  }
}

// جدولة المزامنة مع السحابة لاحقاً
const scheduleCloudSync = (tempBooking) => {
  const syncInterval = setInterval(async () => {
    try {
      console.log('🔄 محاولة مزامنة البيانات المؤقتة مع Firebase...')
      
      const cloudBooking = await firebaseService.createBooking(tempBooking)
      
      // نجحت المزامنة
      console.log('✅ تمت مزامنة البيانات مع Firebase!')
      localStorage.removeItem(`temp_booking_${tempBooking.temp_id}`)
      clearInterval(syncInterval)
      
    } catch (error) {
      console.log('⏳ المزامنة لم تنجح بعد، سنحاول مرة أخرى...')
    }
  }, 30000) // كل 30 ثانية
}

// فحص البيانات المحفوظة
const verifyDataPermanence = async () => {
  try {
    // فحص البيانات في Firebase
    const cloudBookings = await firebaseService.getAllBookings()
    console.log(`☁️ عدد الحجوزات في Firebase: ${cloudBookings.length}`)
    
    // فحص النسخ الاحتياطية المحلية
    const localKeys = Object.keys(localStorage).filter(key => key.startsWith('booking_'))
    console.log(`💾 عدد النسخ الاحتياطية المحلية: ${localKeys.length}`)
    
    // فحص البيانات المؤقتة
    const tempKeys = Object.keys(localStorage).filter(key => key.startsWith('temp_booking_'))
    console.log(`⏳ عدد البيانات المؤقتة: ${tempKeys.length}`)
    
    return {
      cloud_data: cloudBookings.length,
      local_backups: localKeys.length,
      pending_sync: tempKeys.length,
      data_safe: cloudBookings.length > 0 || localKeys.length > 0
    }
    
  } catch (error) {
    console.error('خطأ في فحص البيانات:', error)
    return { error: true }
  }
}

// مساعدات
const getClientIP = () => {
  // يمكن تنفيذها باستخدام خدمة خارجية
  return 'client-ip-here'
}

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export {
  createPermanentBooking,
  verifyDataPermanence,
  scheduleCloudSync
}