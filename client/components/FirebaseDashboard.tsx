// مكون Dashboard محدث لاستخدام Firebase
import React from 'react'
import { useBookings, useStats, useFirebaseConnection } from '../hooks/useFirebase'
import Link from 'next/link'

interface DashboardProps {
  className?: string
}

const FirebaseDashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useStats()
  const { bookings: todayBookings, loading: bookingsLoading } = useBookings({ 
    date: new Date().toISOString().split('T')[0] 
  })
  const { isOnline, lastSync } = useFirebaseConnection()

  // حساب الإحصائيات من البيانات المحملة
  const todayStats = React.useMemo(() => {
    const activeBookings = todayBookings.filter(b => b.status === 'active')
    const teachers = new Set(activeBookings.map(b => b.teacher_name))
    const subjects = new Set(activeBookings.map(b => b.subject))
    const classrooms = new Set(activeBookings.map(b => b.classroom_id))

    return {
      totalBookings: todayBookings.length,
      activeBookings: activeBookings.length,
      teachersCount: teachers.size,
      subjectsCount: subjects.size,
      classroomsInUse: classrooms.size
    }
  }, [todayBookings])

  // أكثر المعلمين نشاطاً اليوم
  const topTeachers = React.useMemo(() => {
    const teacherCounts: Record<string, number> = {}
    
    todayBookings
      .filter(b => b.status === 'active')
      .forEach(booking => {
        const teacher = booking.teacher_name
        teacherCounts[teacher] = (teacherCounts[teacher] || 0) + 1
      })

    return Object.entries(teacherCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([teacher, count]) => ({ teacher, count }))
  }, [todayBookings])

  // أكثر المواد طلباً اليوم
  const topSubjects = React.useMemo(() => {
    const subjectCounts: Record<string, number> = {}
    
    todayBookings
      .filter(b => b.status === 'active')
      .forEach(booking => {
        const subject = booking.subject
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
      })

    return Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subject, count]) => ({ subject, count }))
  }, [todayBookings])

  if (statsError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-red-800">خطأ في تحميل البيانات</h3>
        </div>
        <p className="text-red-700 mb-4">{statsError}</p>
        <button 
          onClick={refreshStats}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* شريط الحالة */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {isOnline ? '🌐 متصل بـ Firebase' : '📱 وضع محلي'}
              </span>
            </div>
            {lastSync && (
              <div className="text-sm text-gray-500">
                آخر مزامنة: {lastSync.toLocaleTimeString('ar-SA')}
              </div>
            )}
          </div>
          
          {(statsLoading || bookingsLoading) && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">جاري التحديث...</span>
            </div>
          )}
        </div>
      </div>

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي الحجوزات */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي الحجوزات</p>
              <p className="text-3xl font-bold">{todayStats.totalBookings}</p>
              <p className="text-blue-100 text-xs mt-1">اليوم</p>
            </div>
            <div className="text-4xl opacity-80">📅</div>
          </div>
        </div>

        {/* الحجوزات النشطة */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">الحجوزات النشطة</p>
              <p className="text-3xl font-bold">{todayStats.activeBookings}</p>
              <p className="text-green-100 text-xs mt-1">قيد التنفيذ</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        {/* عدد المعلمين */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">المعلمين النشطين</p>
              <p className="text-3xl font-bold">{todayStats.teachersCount}</p>
              <p className="text-purple-100 text-xs mt-1">معلم</p>
            </div>
            <div className="text-4xl opacity-80">👩‍🏫</div>
          </div>
        </div>

        {/* القاعات المستخدمة */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">القاعات المحجوزة</p>
              <p className="text-3xl font-bold">{todayStats.classroomsInUse}</p>
              <p className="text-orange-100 text-xs mt-1">قاعة</p>
            </div>
            <div className="text-4xl opacity-80">🏫</div>
          </div>
        </div>
      </div>

      {/* الرسوم البيانية والتفاصيل */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أكثر المعلمين نشاطاً */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🌟 أكثر المعلمين نشاطاً اليوم
          </h3>
          
          {topTeachers.length > 0 ? (
            <div className="space-y-3">
              {topTeachers.map(({ teacher, count }, index) => (
                <div key={teacher} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800">{teacher}</span>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {count} حجز
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>لا توجد حجوزات اليوم</p>
            </div>
          )}
        </div>

        {/* أكثر المواد طلباً */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📚 أكثر المواد طلباً اليوم
          </h3>
          
          {topSubjects.length > 0 ? (
            <div className="space-y-3">
              {topSubjects.map(({ subject, count }, index) => (
                <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800">{subject}</span>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {count} حجز
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📖</div>
              <p>لا توجد مواد محجوزة اليوم</p>
            </div>
          )}
        </div>
      </div>

      {/* أزرار سريعة */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">إجراءات سريعة</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/bookings" className="group">
            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-4 text-center border border-blue-200">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📅</div>
              <p className="font-medium text-blue-800">عرض الحجوزات</p>
            </div>
          </Link>
          
          <Link href="/rooms" className="group">
            <div className="bg-green-50 hover:bg-green-100 transition-colors rounded-lg p-4 text-center border border-green-200">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏫</div>
              <p className="font-medium text-green-800">إدارة القاعات</p>
            </div>
          </Link>
          
          <Link href="/statistics" className="group">
            <div className="bg-purple-50 hover:bg-purple-100 transition-colors rounded-lg p-4 text-center border border-purple-200">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
              <p className="font-medium text-purple-800">الإحصائيات</p>
            </div>
          </Link>
          
          <button 
            onClick={refreshStats}
            className="group bg-orange-50 hover:bg-orange-100 transition-colors rounded-lg p-4 text-center border border-orange-200"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔄</div>
            <p className="font-medium text-orange-800">تحديث البيانات</p>
          </button>
        </div>
      </div>

      {/* معلومات Firebase */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔥</div>
          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">
              نظام التزامن الفوري مع Firebase
            </h3>
            <p className="text-yellow-700 text-sm mb-3">
              جميع التحديثات تظهر فوراً على جميع الأجهزة المتصلة. 
              البيانات محفوظة بأمان في السحابة مع نسخ احتياطية تلقائية.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs">تزامن فوري</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs">نسخ احتياطية</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs">موثوقية عالية</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs">وضع دون اتصال</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FirebaseDashboard