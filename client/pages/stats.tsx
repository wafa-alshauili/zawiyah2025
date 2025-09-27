import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { 
  FaChartBar, 
  FaCalendarCheck,
  FaUsers,
  FaDoorOpen,
  FaBookOpen,
  FaCrown,
  FaTrophy,
  FaDownload
} from 'react-icons/fa'

interface DashboardStats {
  summary: {
    todayBookings: number
    weekBookings: number
    monthBookings: number
    totalClassrooms: number
  }
  mostBookedClassrooms: Array<{
    classroomName: string
    bookingCount: number
  }>
  mostActiveTeachers: Array<{
    teacherName: string
    bookingCount: number
  }>
  mostBookedSubjects?: Array<{
    subjectName: string
    bookingCount: number
  }>
}

export default function Stats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  useEffect(() => {
    fetchStats()
  }, [selectedPeriod])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/dashboard')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = (period: string) => {
    const periods: Record<string, string> = {
      'today': 'اليوم',
      'week': 'هذا الأسبوع', 
      'month': 'هذا الشهر',
      'year': 'هذا العام'
    }
    return periods[period] || period
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              الإحصائيات والتقارير
            </h1>
            <p className="text-gray-600">
              تقارير شاملة عن استخدام القاعات الدراسية ونشاط المعلمات
            </p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذا العام</option>
            </select>
            
            <button className="btn-primary flex items-center gap-2">
              <FaDownload />
              تصدير
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="loading-spinner"></div>
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">حجوزات اليوم</p>
                    <p className="text-3xl font-bold">{stats.summary.todayBookings}</p>
                    <p className="text-blue-200 text-xs mt-1">مقارنة بالأمس: +12%</p>
                  </div>
                  <FaCalendarCheck className="text-4xl text-blue-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">حجوزات الأسبوع</p>
                    <p className="text-3xl font-bold">{stats.summary.weekBookings}</p>
                    <p className="text-green-200 text-xs mt-1">مقارنة بالأسبوع الماضي: +8%</p>
                  </div>
                  <FaChartBar className="text-4xl text-green-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">حجوزات الشهر</p>
                    <p className="text-3xl font-bold">{stats.summary.monthBookings}</p>
                    <p className="text-purple-200 text-xs mt-1">مقارنة بالشهر الماضي: +5%</p>
                  </div>
                  <FaUsers className="text-4xl text-purple-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">إجمالي القاعات</p>
                    <p className="text-3xl font-bold">{stats.summary.totalClassrooms}</p>
                    <p className="text-orange-200 text-xs mt-1">معدل الاستخدام: 78%</p>
                  </div>
                  <FaDoorOpen className="text-4xl text-orange-200" />
                </div>
              </div>
            </div>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Most Booked Classrooms */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaTrophy className="text-yellow-500" />
                    أكثر القاعات حجزاً
                  </h3>
                  <span className="text-sm text-gray-500">{getPeriodLabel(selectedPeriod)}</span>
                </div>
                
                {stats.mostBookedClassrooms?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.mostBookedClassrooms.slice(0, 10).map((room, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-100 text-yellow-600' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            index === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {index < 3 ? <FaCrown /> : <span className="font-semibold">{index + 1}</span>}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{room.classroomName}</p>
                            <p className="text-sm text-gray-500">{room.bookingCount} حجز</p>
                          </div>
                        </div>
                        
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-500' :
                              index === 2 ? 'bg-orange-500' :
                              'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min((room.bookingCount / (stats.mostBookedClassrooms?.[0]?.bookingCount || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد بيانات متاحة</p>
                )}
              </div>

              {/* Most Active Teachers */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaUsers className="text-green-500" />
                    أكثر المعلمات نشاطاً
                  </h3>
                  <span className="text-sm text-gray-500">{getPeriodLabel(selectedPeriod)}</span>
                </div>
                
                {stats.mostActiveTeachers?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.mostActiveTeachers.slice(0, 10).map((teacher, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-green-100 text-green-600' :
                            index === 1 ? 'bg-blue-100 text-blue-600' :
                            index === 2 ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <span className="font-semibold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{teacher.teacherName}</p>
                            <p className="text-sm text-gray-500">{teacher.bookingCount} حجز</p>
                          </div>
                        </div>
                        
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min((teacher.bookingCount / (stats.mostActiveTeachers?.[0]?.bookingCount || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد بيانات متاحة</p>
                )}
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Time Slots Usage */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaChartBar className="text-blue-500" />
                  استخدام الفترات الزمنية
                </h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'الحصة الأولى', percentage: 85, bookings: 34 },
                    { name: 'الحصة الثانية', percentage: 72, bookings: 29 },
                    { name: 'الحصة الثالثة', percentage: 68, bookings: 27 },
                    { name: 'الحصة الرابعة', percentage: 45, bookings: 18 },
                    { name: 'النشاط', percentage: 35, bookings: 14 }
                  ].map((slot, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{slot.name}</span>
                        <span className="text-gray-500">{slot.bookings} حجز</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${slot.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Statistics */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaBookOpen className="text-purple-500" />
                  أكثر المواد حجزاً
                </h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'الرياضيات', count: 45, color: 'bg-red-500' },
                    { name: 'العلوم', count: 38, color: 'bg-blue-500' },
                    { name: 'اللغة العربية', count: 32, color: 'bg-green-500' },
                    { name: 'الإنجليزية', count: 28, color: 'bg-yellow-500' },
                    { name: 'التاريخ', count: 22, color: 'bg-purple-500' }
                  ].map((subject, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                        <span className="text-sm font-medium">{subject.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{subject.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات سريعة</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">متوسط الحجوزات اليومية</span>
                    <span className="font-semibold text-gray-900">12.5</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">معدل استخدام القاعات</span>
                    <span className="font-semibold text-green-600">78%</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">أكثر الأيام حجزاً</span>
                    <span className="font-semibold text-gray-900">الثلاثاء</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">أقل الأيام حجزاً</span>
                    <span className="font-semibold text-gray-900">الخميس</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">عدد المعلمات النشطات</span>
                    <span className="font-semibold text-gray-900">24</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">حدث خطأ في تحميل الإحصائيات</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}