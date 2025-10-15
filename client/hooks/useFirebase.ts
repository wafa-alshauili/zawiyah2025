// Custom Hook لاستخدام Firebase في المكونات
import { useState, useEffect, useCallback } from 'react'
import firebaseService from '../services/firebase'

// Hook للحجوزات مع التزامن الفوري
export function useBookings(options: { 
  date?: string, 
  teacherName?: string,
  autoRefresh?: boolean 
} = {}) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        setLoading(true)
        setError(null)

        if (options.date) {
          // الاستماع لحجوزات يوم محدد
          unsubscribe = firebaseService.subscribeToBookingsByDate(options.date, (updatedBookings) => {
            console.log(`📡 تحديث حجوزات ${options.date}:`, updatedBookings.length)
            setBookings(updatedBookings)
            setLastUpdate(new Date())
            setLoading(false)
          })
        } else if (options.teacherName) {
          // جلب حجوزات معلم محدد (مرة واحدة)
          const teacherBookings = await firebaseService.getBookingsByTeacher(options.teacherName)
          setBookings(teacherBookings)
          setLastUpdate(new Date())
          setLoading(false)
        } else {
          // الاستماع لجميع الحجوزات
          unsubscribe = firebaseService.subscribeToBookings((updatedBookings) => {
            console.log('📡 تحديث جميع الحجوزات:', updatedBookings.length)
            setBookings(updatedBookings)
            setLastUpdate(new Date())
            setLoading(false)
          })
        }
      } catch (err: any) {
        console.error('❌ خطأ في إعداد مستمع الحجوزات:', err)
        setError(err.message || 'حدث خطأ في تحميل البيانات')
        setLoading(false)
      }
    }

    setupListener()

    // تنظيف المستمع عند إزالة المكون
    return () => {
      if (unsubscribe) {
        unsubscribe()
        console.log('🔕 تم إزالة مستمع الحجوزات')
      }
    }
  }, [options.date, options.teacherName])

  // إنشاء حجز جديد
  const createBooking = useCallback(async (bookingData: any) => {
    try {
      setLoading(true)
      const newBooking = await firebaseService.createBooking(bookingData)
      console.log('✅ تم إنشاء الحجز:', newBooking.id)
      return newBooking
    } catch (err: any) {
      console.error('❌ خطأ في إنشاء الحجز:', err)
      setError(err.message || 'فشل في إنشاء الحجز')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // تحديث حجز موجود
  const updateBooking = useCallback(async (bookingId: string, updates: any) => {
    try {
      setLoading(true)
      await firebaseService.updateBooking(bookingId, updates)
      console.log('✅ تم تحديث الحجز:', bookingId)
      return true
    } catch (err: any) {
      console.error('❌ خطأ في تحديث الحجز:', err)
      setError(err.message || 'فشل في تحديث الحجز')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // حذف حجز
  const deleteBooking = useCallback(async (bookingId: string) => {
    try {
      setLoading(true)
      await firebaseService.deleteBooking(bookingId)
      console.log('✅ تم حذف الحجز:', bookingId)
      return true
    } catch (err: any) {
      console.error('❌ خطأ في حذف الحجز:', err)
      setError(err.message || 'فشل في حذف الحجز')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // إلغاء حجز
  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    try {
      setLoading(true)
      await firebaseService.cancelBooking(bookingId, reason)
      console.log('✅ تم إلغاء الحجز:', bookingId)
      return true
    } catch (err: any) {
      console.error('❌ خطأ في إلغاء الحجز:', err)
      setError(err.message || 'فشل في إلغاء الحجز')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    bookings,
    loading,
    error,
    lastUpdate,
    createBooking,
    updateBooking,
    deleteBooking,
    cancelBooking,
    refresh: () => setLastUpdate(new Date())
  }
}

// Hook للقاعات
export function useClassrooms() {
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoading(true)
        setError(null)
        const roomsData = await firebaseService.getAllClassrooms()
        setClassrooms(roomsData)
        console.log('🏫 تم تحميل القاعات:', roomsData.length)
      } catch (err: any) {
        console.error('❌ خطأ في تحميل القاعات:', err)
        setError(err.message || 'فشل في تحميل القاعات')
      } finally {
        setLoading(false)
      }
    }

    loadClassrooms()
  }, [])

  return { classrooms, loading, error }
}

// Hook للفترات الزمنية
export function useTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTimeSlots = async () => {
      try {
        setLoading(true)
        setError(null)
        const slotsData = await firebaseService.getAllTimeSlots()
        setTimeSlots(slotsData)
        console.log('⏰ تم تحميل الفترات الزمنية:', slotsData.length)
      } catch (err: any) {
        console.error('❌ خطأ في تحميل الفترات الزمنية:', err)
        setError(err.message || 'فشل في تحميل الفترات الزمنية')
      } finally {
        setLoading(false)
      }
    }

    loadTimeSlots()
  }, [])

  return { timeSlots, loading, error }
}

// Hook للإحصائيات
export function useStats() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    teachersCount: 0,
    subjectsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const statsData = await firebaseService.getTodayStats()
      setStats(statsData)
      console.log('📊 تم تحميل الإحصائيات:', statsData)
    } catch (err: any) {
      console.error('❌ خطأ في تحميل الإحصائيات:', err)
      setError(err.message || 'فشل في تحميل الإحصائيات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, loading, error, refresh: loadStats }
}

// Hook للاتصال والحالة
export function useFirebaseConnection() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      firebaseService.enableOfflineSync()
      setLastSync(new Date())
      console.log('🌐 تم الاتصال بالإنترنت - تفعيل المزامنة')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('📱 فقدان الاتصال - تفعيل الوضع المحلي')
    }

    // مراقبة حالة الاتصال
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // فحص الحالة الأولية
    setIsOnline(navigator.onLine)
    if (navigator.onLine) {
      setLastSync(new Date())
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastSync }
}

// Hook شامل لجميع بيانات التطبيق
export function useZawiyahApp() {
  const [appReady, setAppReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const bookingsToday = useBookings({ 
    date: new Date().toISOString().split('T')[0] 
  })
  const allBookings = useBookings()
  const classrooms = useClassrooms()
  const timeSlots = useTimeSlots()
  const stats = useStats()
  const connection = useFirebaseConnection()

  useEffect(() => {
    // التحقق من جاهزية جميع البيانات الأساسية
    const checkAppReady = () => {
      const basicDataLoaded = !classrooms.loading && !timeSlots.loading
      const hasMinimalData = classrooms.classrooms.length > 0 && timeSlots.timeSlots.length > 0
      
      if (basicDataLoaded && hasMinimalData) {
        setAppReady(true)
        console.log('🎉 التطبيق جاهز للاستخدام')
      } else if (classrooms.error || timeSlots.error) {
        setInitError('فشل في تحميل البيانات الأساسية')
        console.error('❌ خطأ في تهيئة التطبيق')
      }
    }

    checkAppReady()
  }, [classrooms.loading, classrooms.error, timeSlots.loading, timeSlots.error, classrooms.classrooms.length, timeSlots.timeSlots.length])

  return {
    appReady,
    initError,
    bookingsToday,
    allBookings,
    classrooms,
    timeSlots,
    stats,
    connection
  }
}