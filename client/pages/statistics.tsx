import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import AdvancedChart from '../components/AdvancedChart'
import socketService from '../services/socket'
import { 
  FaChartBar, 
  FaChartPie, 
  FaChartLine,
  FaPrint,
  FaDownload,
  FaSync,
  FaDoorOpen,
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaUserTie,
  FaBook,
  FaPercent
} from 'react-icons/fa'

export default function Statistics() {
  const [bookings, setBookings] = useState<Record<string, any>>({})
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedPeriod, setSelectedPeriod] = useState('week') // week, month, all
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRooms: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    roomStats: [] as any[],
    teacherStats: [] as any[],
    subjectStats: [] as any[],
    timeStats: [] as any[],
    weeklyTrend: [] as any[],
    roomUtilization: [] as any[]
  })

  // قائمة جميع القاعات والفصول
  const allRooms = [
    // القاعات الخاصة
    'القاعة الذكية',
    'المصادر', 
    'قاعة التوجيه',
    'قاعة حاسوب 1',
    'قاعة حاسوب 2',
    'الطابور القديم',
    // الفصول الدراسية
    ...Array.from({ length: 6 }, (_, i) => Array.from({ length: 3 }, (_, j) => `الصف ${i + 5} - شعبة ${j + 1}`)).flat(),
    ...Array.from({ length: 2 }, (_, i) => Array.from({ length: 6 }, (_, j) => `الصف ${i + 11} - شعبة ${j + 1}`)).flat()
  ]

  useEffect(() => {
    setIsClient(true)
    loadData()
    
    // الاتصال بالخادم للتحديثات المتزامنة
    socketService.connect()
    
    // الاستماع لتحديثات الحجوزات
    const handleBookingUpdate = () => {
      loadData()
      setLastUpdate(new Date())
    }
    
    socketService.socket?.on('booking-created', handleBookingUpdate)
    socketService.socket?.on('booking-updated', handleBookingUpdate)
    socketService.socket?.on('booking-deleted', handleBookingUpdate)
    
    return () => {
      socketService.socket?.off('booking-created', handleBookingUpdate)
      socketService.socket?.off('booking-updated', handleBookingUpdate)
      socketService.socket?.off('booking-deleted', handleBookingUpdate)
    }
  }, [])

  useEffect(() => {
    if (Object.keys(bookings).length > 0) {
      calculateStats()
    }
  }, [bookings, selectedPeriod])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setBookings(data.data)
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const bookingsList = Object.entries(bookings).map(([key, booking]) => ({ key, ...booking }))
    
    // تصفية البيانات حسب الفترة المختارة
    const now = new Date()
    const filteredBookings = bookingsList.filter(booking => {
      const bookingDate = new Date(booking.createdAt)
      const daysDiff = Math.floor((now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (selectedPeriod) {
        case 'week':
          return daysDiff <= 7
        case 'month':
          return daysDiff <= 30
        default:
          return true
      }
    })

    // إحصائيات القاعات
    const roomCounts: Record<string, number> = {}
    allRooms.forEach(room => roomCounts[room] = 0)
    
    filteredBookings.forEach(booking => {
      const room = booking.classroom || booking.room || 'غير محدد'
      roomCounts[room] = (roomCounts[room] || 0) + 1
    })

    const roomStats = Object.entries(roomCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // إحصائيات المعلمين
    const teacherCounts: Record<string, number> = {}
    filteredBookings.forEach(booking => {
      const teacher = booking.teacher || 'غير محدد'
      teacherCounts[teacher] = (teacherCounts[teacher] || 0) + 1
    })

    const teacherStats = Object.entries(teacherCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // إحصائيات المواد
    const subjectCounts: Record<string, number> = {}
    filteredBookings.forEach(booking => {
      const subject = booking.subject || 'غير محدد'
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
    })

    const subjectStats = Object.entries(subjectCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    // إحصائيات الوقت
    const timeCounts: Record<string, number> = {}
    filteredBookings.forEach(booking => {
      const period = booking.period || booking.timeSlot || 'غير محدد'
      timeCounts[period] = (timeCounts[period] || 0) + 1
    })

    const timeStats = Object.entries(timeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // الاتجاه الأسبوعي
    const weeklyData: Record<string, number> = {}
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    days.forEach(day => weeklyData[day] = 0)
    
    filteredBookings.forEach(booking => {
      const day = booking.day || 'غير محدد'
      if (weeklyData[day] !== undefined) {
        weeklyData[day]++
      }
    })

    const weeklyTrend = days.map(day => ({ name: day, value: weeklyData[day] }))

    // معدل استخدام القاعات
    const totalPossibleSlots = allRooms.length * 8 * 5 // القاعات × الحصص × الأيام
    const utilizationRate = (filteredBookings.length / totalPossibleSlots) * 100

    const roomUtilization = [
      { name: 'مستخدم', value: Math.round(utilizationRate) },
      { name: 'متاح', value: Math.round(100 - utilizationRate) }
    ]

    setStats({
      totalBookings: filteredBookings.length,
      totalRooms: Object.keys(roomCounts).filter(room => roomCounts[room] > 0).length,
      totalTeachers: Object.keys(teacherCounts).length,
      totalSubjects: Object.keys(subjectCounts).length,
      roomStats,
      teacherStats,
      subjectStats,
      timeStats,
      weeklyTrend,
      roomUtilization
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(stats, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `statistics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const refreshData = () => {
    loadData()
    setLastUpdate(new Date())
  }

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* رأس الصفحة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 إحصائيات شاملة</h1>
              <p className="text-gray-600">
                آخر تحديث: {lastUpdate.toLocaleString('ar-SA')}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* اختيار الفترة */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">الأسبوع الماضي</option>
                <option value="month">الشهر الماضي</option>
                <option value="all">جميع الفترات</option>
              </select>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <FaSync className={loading ? 'animate-spin' : ''} />
                تحديث
              </button>
              
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 print:hidden"
              >
                <FaPrint />
                طباعة
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 print:hidden"
              >
                <FaDownload />
                تصدير
              </button>
            </div>
          </div>
        </div>

        {/* المؤشرات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">إجمالي الحجوزات</p>
                <p className="text-3xl font-bold">{stats.totalBookings}</p>
                <p className="text-xs text-blue-200 mt-1">
                  {selectedPeriod === 'week' ? 'هذا الأسبوع' : selectedPeriod === 'month' ? 'هذا الشهر' : 'جميع الفترات'}
                </p>
              </div>
              <FaCalendarAlt className="text-4xl text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">القاعات المستخدمة</p>
                <p className="text-3xl font-bold">{stats.totalRooms}</p>
                <p className="text-xs text-green-200 mt-1">من أصل {allRooms.length} قاعة</p>
              </div>
              <FaDoorOpen className="text-4xl text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">عدد المعلمين</p>
                <p className="text-3xl font-bold">{stats.totalTeachers}</p>
                <p className="text-xs text-purple-200 mt-1">معلم نشط</p>
              </div>
              <FaUserTie className="text-4xl text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">عدد المواد</p>
                <p className="text-3xl font-bold">{stats.totalSubjects}</p>
                <p className="text-xs text-orange-200 mt-1">مادة مختلفة</p>
              </div>
              <FaBook className="text-4xl text-orange-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-100">معدل الاستخدام</p>
                <p className="text-3xl font-bold">
                  {stats.totalBookings > 0 ? Math.round((stats.totalRooms / allRooms.length) * 100) : 0}%
                </p>
                <p className="text-xs text-pink-200 mt-1">من القاعات المتاحة</p>
              </div>
              <FaPercent className="text-4xl text-pink-200" />
            </div>
          </div>
        </div>

        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AdvancedChart 
            data={stats.roomStats} 
            type="bar" 
            title="أكثر القاعات استخداماً" 
          />
          
          <AdvancedChart 
            data={stats.roomUtilization} 
            type="doughnut" 
            title="معدل استخدام القاعات" 
          />
          
          <AdvancedChart 
            data={stats.teacherStats} 
            type="bar" 
            title="أكثر المعلمين حجزاً" 
          />
          
          <AdvancedChart 
            data={stats.subjectStats} 
            type="pie" 
            title="توزيع المواد" 
          />
          
          <AdvancedChart 
            data={stats.weeklyTrend} 
            type="line" 
            title="الحجوزات حسب أيام الأسبوع" 
          />
          
          <AdvancedChart 
            data={stats.timeStats} 
            type="bar" 
            title="الحجوزات حسب الفترات الزمنية" 
          />
        </div>

        {/* تحليلات متقدمة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">📈 تحليلات وتوصيات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-800 mb-2">أكثر القاعات طلباً</h4>
              <p className="text-sm text-blue-700">
                {stats.roomStats.length > 0 ? (
                  <>
                    <strong>{stats.roomStats[0]?.name}</strong> بـ {stats.roomStats[0]?.value} حجزاً
                    ({((stats.roomStats[0]?.value / stats.totalBookings) * 100).toFixed(1)}%)
                  </>
                ) : 'لا توجد بيانات'}
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-800 mb-2">أكثر الأيام ازدحاماً</h4>
              <p className="text-sm text-green-700">
                {stats.weeklyTrend.length > 0 ? (
                  <>
                    <strong>{stats.weeklyTrend.reduce((max, day) => day.value > max.value ? day : max, stats.weeklyTrend[0])?.name}</strong>
                    {' '}بـ {stats.weeklyTrend.reduce((max, day) => day.value > max.value ? day : max, stats.weeklyTrend[0])?.value} حجزاً
                  </>
                ) : 'لا توجد بيانات'}
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-bold text-purple-800 mb-2">أكثر المعلمين نشاطاً</h4>
              <p className="text-sm text-purple-700">
                {stats.teacherStats.length > 0 ? (
                  <>
                    <strong>{stats.teacherStats[0]?.name}</strong> بـ {stats.teacherStats[0]?.value} حجزاً
                  </>
                ) : 'لا توجد بيانات'}
              </p>
            </div>
          </div>
        </div>

        {/* جداول تفصيلية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* جدول القاعات */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaDoorOpen />
                تفاصيل استخدام القاعات
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الترتيب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القاعة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد الحجوزات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.roomStats.map((room, index) => (
                    <tr key={index} className={index < 3 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{room.value}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(room.value / stats.totalBookings) * 100}%` }}
                            ></div>
                          </div>
                          {((room.value / stats.totalBookings) * 100).toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* جدول المعلمين */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaUserTie />
                أكثر المعلمين نشاطاً
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الترتيب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المعلم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد الحجوزات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.teacherStats.map((teacher, index) => (
                    <tr key={index} className={index < 3 ? 'bg-purple-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{teacher.value}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${(teacher.value / stats.totalBookings) * 100}%` }}
                            ></div>
                          </div>
                          {((teacher.value / stats.totalBookings) * 100).toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* أنماط الطباعة */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            font-size: 12px;
          }
          
          .container {
            max-width: none;
            margin: 0;
            padding: 0;
          }
          
          .shadow-md {
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
          
          .bg-gray-50 {
            background-color: white;
          }
          
          h1 {
            font-size: 24px;
          }
          
          h3 {
            font-size: 18px;
          }
          
          .grid {
            break-inside: avoid;
          }
          
          table {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}