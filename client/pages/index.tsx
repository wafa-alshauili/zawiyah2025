import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import LiveClock from '../components/LiveClock'
import socketService from '../services/socket'
import { 
  FaCalendarCheck, 
  FaDoorOpen, 
  FaUsers, 
  FaFlag,
  FaArrowRight,
  FaClock,
  FaPhoneAlt,
  FaBook
} from 'react-icons/fa'
import Link from 'next/link'

interface BookingItem {
  key: string
  booking: {
    teacher: string
    phone: string
    room: string
    day: string
    period: string
    subject: string
    grade: string
    section: string
    referenceNumber: string
    createdAt: string
    notes?: string
  }
}

export default function Home() {
  const router = useRouter()
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([])
  const [assemblyBookings, setAssemblyBookings] = useState<BookingItem[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    
    // الاتصال بالخادم
    socketService.connect()
    
    // تحديث البيانات عند تحديث الحجوزات
    socketService.on('bookings-updated', (data) => {
      console.log('🏠 الصفحة الرئيسية: تحديث جميع الحجوزات')
      // تحديث localStorage مع البيانات الجديدة
      if (data.bookings) {
        localStorage.setItem('zawiyah-bookings', JSON.stringify(data.bookings))
      }
      fetchData()
    })
    
    socketService.on('booking-created', (data) => {
      console.log('🏠 الصفحة الرئيسية: حجز جديد -', data.booking.teacher)
      fetchData()
    })
    
    socketService.on('booking-deleted', (data) => {
      console.log('🏠 الصفحة الرئيسية: تم حذف حجز -', data.referenceNumber)
      fetchData()
    })
    
    // تحديث دوري كل 30 ثانية
    const interval = setInterval(fetchData, 30000)
    
    return () => {
      clearInterval(interval)
      socketService.disconnect()
    }
  }, [])

  const fetchData = () => {
    try {
      // جلب بيانات الحجوزات من localStorage
      const bookingsData = localStorage.getItem('zawiyah-bookings')
      const bookings = bookingsData ? JSON.parse(bookingsData) : {}
      
      const today = new Date()
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      const todayName = dayNames[today.getDay()]
      
      const allBookings = Object.entries(bookings).map(([key, booking]: [string, any]) => ({ 
        key, 
        booking: booking as BookingItem['booking']
      }))
      
      // ترتيب الحجوزات من الأحدث إلى الأقدم
      const sortedBookings = allBookings.sort((a, b) => {
        const dateA = new Date(a.booking.createdAt)
        const dateB = new Date(b.booking.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
      
      // أحدث 8 حجوزات
      const recent = sortedBookings.slice(0, 8)
      setRecentBookings(recent)
      
      // حجوزات فترة الطابور لليوم
      const assembly = sortedBookings.filter(item => 
        item.booking.period === 'الطابور' && item.booking.day === todayName
      )
      setAssemblyBookings(assembly)
      
      // عدد حجوزات اليوم
      const todayBookings = sortedBookings.filter(item => {
        const bookingDate = new Date(item.booking.createdAt)
        return bookingDate.toDateString() === today.toDateString() || item.booking.day === todayName
      })
      setTodayCount(todayBookings.length)
      
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA')
  }

  // وظيفة الانتقال لصفحة الحجوزات مع التمرير للحجز المحدد
  const navigateToBooking = (booking: BookingItem['booking']) => {
    // حفظ معلومات الحجز في sessionStorage للعثور عليه
    sessionStorage.setItem('highlightBooking', JSON.stringify({
      room: booking.room,
      day: booking.day,
      period: booking.period,
      teacher: booking.teacher
    }))
    
    // الانتقال لصفحة الحجوزات
    router.push('/bookings')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-cairo">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 rtl">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 font-cairo mb-4">
            🏫 زاوية 2025
          </h1>
          <p className="text-xl text-gray-700 font-cairo mb-4">
            مدرسة بسياء للتعليم الأساسي (5-12) - نظام حجز القاعات الدراسية
          </p>
          
          {/* وصف الموقع */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft p-6 max-w-4xl mx-auto mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700">
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <FaCalendarCheck className="text-2xl text-blue-600" />
                </div>
                <h3 className="font-semibold font-cairo mb-2">حجز سهل وسريع</h3>
                <p className="text-sm text-center font-cairo">
                  احجز القاعات الدراسية بسهولة من خلال الجدول الأسبوعي التفاعلي
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <FaUsers className="text-2xl text-green-600" />
                </div>
                <h3 className="font-semibold font-cairo mb-2">تزامن فوري</h3>
                <p className="text-sm text-center font-cairo">
                  تحديثات مباشرة لجميع المستخدمين لضمان عدم تضارب الحجوزات
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="bg-purple-100 p-3 rounded-full mb-3">
                  <FaDoorOpen className="text-2xl text-purple-600" />
                </div>
                <h3 className="font-semibold font-cairo mb-2">إدارة شاملة</h3>
                <p className="text-sm text-center font-cairo">
                  متابعة جميع القاعات والحجوزات مع إحصائيات مفصلة ومرونة عالية
                </p>
              </div>
            </div>
          </div>
          
          <LiveClock />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-cairo font-semibold">حجوزات اليوم</p>
                <p className="text-3xl font-bold text-blue-800">{todayCount}</p>
              </div>
              <FaCalendarCheck className="text-4xl text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-cairo font-semibold">القاعات المتاحة</p>
                <p className="text-3xl font-bold text-green-800">33</p>
              </div>
              <FaDoorOpen className="text-4xl text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-cairo font-semibold">فترة الطابور</p>
                <p className="text-3xl font-bold text-purple-800">{assemblyBookings.length}</p>
              </div>
              <FaFlag className="text-4xl text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/bookings" className="block">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-cairo mb-2">📅 حجز قاعة</h3>
                  <p className="font-cairo opacity-90">احجز قاعة دراسية الآن</p>
                </div>
                <FaArrowRight className="text-3xl" />
              </div>
            </div>
          </Link>

          <Link href="/rooms" className="block">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-8 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-cairo mb-2">🏫 إدارة القاعات</h3>
                  <p className="font-cairo opacity-90">عرض وإدارة القاعات</p>
                </div>
                <FaArrowRight className="text-3xl" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Bookings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest Bookings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-cairo flex items-center">
                <FaClock className="text-blue-500 ml-3" />
                آخر الحجوزات
              </h2>
              <Link href="/bookings" className="text-blue-500 hover:text-blue-700 font-cairo">
                عرض الكل
              </Link>
            </div>
            
            {recentBookings.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentBookings.map((item) => (
                  <div 
                    key={item.key} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer transform hover:scale-[1.02]"
                    onClick={() => navigateToBooking(item.booking)}
                    title="انقر للانتقال إلى موقع الحجز في صفحة الحجوزات"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <FaUsers className="text-blue-500 ml-2 text-sm" />
                          <span className="font-semibold text-gray-800 font-cairo">{item.booking.teacher}</span>
                        </div>
                        <div className="flex items-center mb-1">
                          <FaDoorOpen className="text-green-500 ml-2 text-sm" />
                          <span className="text-gray-600 font-cairo">{item.booking.room}</span>
                        </div>
                        <div className="flex items-center">
                          <FaBook className="text-purple-500 ml-2 text-sm" />
                          <span className="text-gray-600 font-cairo">{item.booking.subject}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-gray-500 font-cairo">{item.booking.day}</div>
                        <div className="text-sm text-gray-500 font-cairo">{item.booking.period}</div>
                        <div className="text-xs text-gray-400 font-cairo">{formatTime(item.booking.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <FaPhoneAlt className="text-gray-400 ml-2 text-xs" />
                        <span className="text-gray-500 font-cairo">{item.booking.phone}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-500 font-cairo">{item.booking.grade} - {item.booking.section}</span>
                      </div>
                      <div className="text-xs text-blue-500 font-cairo opacity-0 group-hover:opacity-100 transition-opacity">
                        انقر للعرض →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 font-cairo">
                <FaCalendarCheck className="text-4xl mx-auto mb-4 opacity-50" />
                <p>لا توجد حجوزات حالياً</p>
              </div>
            )}
          </div>

          {/* Assembly Period Bookings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-cairo flex items-center">
                <FaFlag className="text-purple-500 ml-3" />
                حجوزات فترة الطابور
              </h2>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-cairo">
                اليوم
              </span>
            </div>
            
            {assemblyBookings.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {assemblyBookings.map((item) => (
                  <div 
                    key={item.key} 
                    className="border border-purple-200 rounded-lg p-4 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all cursor-pointer transform hover:scale-[1.02]"
                    onClick={() => navigateToBooking(item.booking)}
                    title="انقر للانتقال إلى موقع الحجز في صفحة الحجوزات"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <FaUsers className="text-purple-600 ml-2 text-sm" />
                          <span className="font-semibold text-purple-800 font-cairo">{item.booking.teacher}</span>
                        </div>
                        <div className="flex items-center mb-1">
                          <FaDoorOpen className="text-purple-600 ml-2 text-sm" />
                          <span className="text-purple-700 font-cairo">{item.booking.room}</span>
                        </div>
                        <div className="flex items-center">
                          <FaBook className="text-purple-600 ml-2 text-sm" />
                          <span className="text-purple-700 font-cairo">{item.booking.subject}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-purple-600 font-cairo font-semibold">فترة الطابور</div>
                        <div className="text-xs text-purple-500 font-cairo">{formatTime(item.booking.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <FaPhoneAlt className="text-purple-500 ml-2 text-xs" />
                        <span className="text-purple-600 font-cairo">{item.booking.phone}</span>
                        <span className="mx-2 text-purple-300">|</span>
                        <span className="text-purple-600 font-cairo">{item.booking.grade} - {item.booking.section}</span>
                      </div>
                      <div className="text-xs text-purple-600 font-cairo opacity-0 group-hover:opacity-100 transition-opacity">
                        انقر للعرض →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-purple-400 font-cairo">
                <FaFlag className="text-4xl mx-auto mb-4 opacity-50" />
                <p>لا توجد حجوزات لفترة الطابور اليوم</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}