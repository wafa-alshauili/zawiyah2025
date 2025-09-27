import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import LiveClock from '../components/LiveClock'
import socketService from '../services/socket'
import { 
  FaCalendarCheck, 
  FaDoorOpen, 
  FaUsers, 
  FaChartLine,
  FaArrowRight 
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

interface DashboardStats {
  todayBookings: number
  weekBookings: number  
  monthBookings: number
  totalClassrooms: number
  mostBookedClassrooms: Array<{
    classroomName: string
    bookingCount: number
  }>
  mostActiveTeachers: Array<{
    teacherName: string
    bookingCount: number
  }>
  todayBookingsList: BookingItem[]
  assemblyBookings: BookingItem[]
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard stats
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // جلب بيانات الحجوزات من localStorage (للتزامن مع صفحة الحجوزات)
      const bookingsData = localStorage.getItem('zawiyah-bookings')
      const bookings = bookingsData ? JSON.parse(bookingsData) : {}
      
      const today = new Date()
      const todayString = today.toLocaleDateString('ar-SA')
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      const todayName = dayNames[today.getDay()]
      
      const allBookings = Object.entries(bookings).map(([key, booking]: [string, any]) => ({ 
        key, 
        booking: booking as {
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
      }))
      
      // حجوزات اليوم
      const todayBookings = allBookings.filter(item => {
        const bookingDate = new Date(item.booking.createdAt)
        return bookingDate.toDateString() === today.toDateString() || item.booking.day === todayName
      })
      
      // حجوزات فترة الطابور ليوم اليوم
      const assemblyBookings = allBookings.filter(item => 
        item.booking.period === 'الطابور' && item.booking.day === todayName
      )
      
      // إحصائيات أخرى
      const weekBookings = allBookings.filter(item => {
        const bookingDate = new Date(item.booking.createdAt)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return bookingDate >= weekAgo
      })
      
      const monthBookings = allBookings.filter(item => {
        const bookingDate = new Date(item.booking.createdAt)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        return bookingDate >= monthAgo
      })
      
      // أكثر القاعات حجزاً
      const roomCounts: Record<string, number> = {}
      allBookings.forEach(item => {
        const room = item.booking.room
        roomCounts[room] = (roomCounts[room] || 0) + 1
      })
      
      const mostBookedClassrooms = Object.entries(roomCounts)
        .map(([room, count]) => ({ classroomName: room, bookingCount: count }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
      
      // أكثر المعلمين نشاطاً
      const teacherCounts: Record<string, number> = {}
      allBookings.forEach(item => {
        const teacher = item.booking.teacher
        teacherCounts[teacher] = (teacherCounts[teacher] || 0) + 1
      })
      
      const mostActiveTeachers = Object.entries(teacherCounts)
        .map(([teacher, count]) => ({ teacherName: teacher, bookingCount: count }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
      
      setStats({
        todayBookings: todayBookings.length,
        weekBookings: weekBookings.length,
        monthBookings: monthBookings.length,
        totalClassrooms: 23, // عدد القاعات المتاحة
        mostBookedClassrooms,
        mostActiveTeachers,
        todayBookingsList: todayBookings,
        assemblyBookings
      })
      
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // الاتصال بالخادم
    socketService.connect()
    
    // إعداد مستمعي Socket.IO للتحديث الفوري
    socketService.on('bookings-updated', () => {
      fetchStats()
    })
    
    socketService.on('booking-created', () => {
      fetchStats()
    })
    
    socketService.on('booking-updated', () => {
      fetchStats()
    })
    
    socketService.on('booking-deleted', () => {
      fetchStats()
    })
    
    // تحديث البيانات كل 30 ثانية كنسخة احتياطية
    const interval = setInterval(fetchStats, 30000)
    
    // تحديث البيانات عند تغيير localStorage (نسخة احتياطية)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zawiyah-bookings') {
        fetchStats()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // تحديث البيانات عند التركيز على النافذة
    const handleFocus = () => {
      fetchStats()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      
      // تنظيف مستمعي Socket.IO
      socketService.off('bookings-updated')
      socketService.off('booking-created')
      socketService.off('booking-updated') 
      socketService.off('booking-deleted')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            مرحباً بك في منصة زاوية لحجز القاعات الدراسية
          </h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              يهدف الموقع إلى تسهيل عملية حجز القاعات وإدارتها إلكترونياً في مدرسة بسياء للتعليم الأساسي (5-12) 
              مع توفير تجربة سهلة لجميع المستخدمين في بيئة تعليمية متكاملة
            </p>
          </div>
          
          {/* Live Date and Time */}
          <LiveClock />
        </div>

        {/* Quick Stats Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="loading-spinner"></div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">حجوزات اليوم</p>
                    <p className="text-3xl font-bold">{stats.todayBookings}</p>
                  </div>
                  <FaCalendarCheck className="text-4xl text-blue-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">حجوزات الأسبوع</p>
                    <p className="text-3xl font-bold">{stats.weekBookings}</p>
                  </div>
                  <FaChartLine className="text-4xl text-green-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">حجوزات الشهر</p>
                    <p className="text-3xl font-bold">{stats.monthBookings}</p>
                  </div>
                  <FaUsers className="text-4xl text-purple-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">إجمالي القاعات</p>
                    <p className="text-3xl font-bold">{stats.totalClassrooms}</p>
                  </div>
                  <FaDoorOpen className="text-4xl text-orange-200" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link href="/bookings" className="block">
                <div className="card hover:shadow-medium transition-shadow duration-200 cursor-pointer">
                  <div className="text-center">
                    <FaCalendarCheck className="text-4xl text-primary-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      إنشاء حجز جديد
                    </h3>
                    <p className="text-gray-600">
                      احجز قاعة دراسية لحصصك القادمة
                    </p>
                    <div className="mt-4 flex items-center justify-center text-primary-600">
                      <span className="ml-2">ابدأ الحجز</span>
                      <FaArrowRight />
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/rooms" className="block">
                <div className="card hover:shadow-medium transition-shadow duration-200 cursor-pointer">
                  <div className="text-center">
                    <FaDoorOpen className="text-4xl text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      إدارة القاعات
                    </h3>
                    <p className="text-gray-600">
                      تصفح واستعرض جميع القاعات المتاحة
                    </p>
                    <div className="mt-4 flex items-center justify-center text-green-600">
                      <span className="ml-2">عرض القاعات</span>
                      <FaArrowRight />
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/stats" className="block">
                <div className="card hover:shadow-medium transition-shadow duration-200 cursor-pointer">
                  <div className="text-center">
                    <FaChartLine className="text-4xl text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      الإحصائيات والتقارير
                    </h3>
                    <p className="text-gray-600">
                      تقارير مفصلة عن استخدام القاعات
                    </p>
                    <div className="mt-4 flex items-center justify-center text-purple-600">
                      <span className="ml-2">عرض التقارير</span>
                      <FaArrowRight />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* حجوزات اليوم وفترة الطابور */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* حجوزات اليوم */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📅 حجوزات اليوم
                  </h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.todayBookingsList.length} حجز
                  </span>
                </div>
                {stats.todayBookingsList.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {stats.todayBookingsList.slice(0, 10).map((item, index) => (
                      <div key={item.key} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-blue-800">
                            👨‍🏫 {item.booking.teacher}
                          </div>
                          <div className="text-xs text-blue-600 font-mono">
                            {item.booking.referenceNumber}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                          <div>🏫 {item.booking.room}</div>
                          <div>⏰ {item.booking.period}</div>
                          <div>📚 {item.booking.subject}</div>
                          <div>🎯 {item.booking.grade}-{item.booking.section}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-gray-500">لا توجد حجوزات ليوم اليوم</p>
                  </div>
                )}
              </div>
              
              {/* حجوزات فترة الطابور */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    🏺 فترة الطابور اليوم
                  </h3>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {stats.assemblyBookings.length} حجز
                  </span>
                </div>
                {stats.assemblyBookings.length > 0 ? (
                  <div className="space-y-3">
                    {stats.assemblyBookings.map((item, index) => (
                      <div key={item.key} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-orange-800">
                            👨‍🏫 {item.booking.teacher}
                          </div>
                          <div className="text-xs text-orange-600 font-mono">
                            {item.booking.referenceNumber}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-orange-700">
                          <div>🏫 {item.booking.room}</div>
                          <div>📚 {item.booking.subject}</div>
                          <div>🎯 {item.booking.grade}-{item.booking.section}</div>
                          <div>📱 {item.booking.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏺</div>
                    <p className="text-gray-500">لا توجد حجوزات لفترة الطابور اليوم</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Most Booked Classrooms & Active Teachers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Booked Classrooms */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  أكثر القاعات حجزاً
                </h3>
                {stats.mostBookedClassrooms?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.mostBookedClassrooms.slice(0, 5).map((room, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center ml-3">
                            <span className="text-primary-600 font-semibold">{index + 1}</span>
                          </div>
                          <span className="font-medium">{room.classroomName}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {room.bookingCount} حجز
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    لا توجد بيانات متاحة
                  </p>
                )}
              </div>

              {/* Most Active Teachers */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  أكثر المعلمات نشاطاً
                </h3>
                {stats.mostActiveTeachers?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.mostActiveTeachers.slice(0, 5).map((teacher, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center ml-3">
                            <span className="text-green-600 font-semibold">{index + 1}</span>
                          </div>
                          <span className="font-medium">{teacher.teacherName}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {teacher.bookingCount} حجز
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    لا توجد بيانات متاحة
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">حدث خطأ في تحميل البيانات</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}