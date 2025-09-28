import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { 
  FaChartBar, 
  FaFlag,
  FaUsers,
  FaDoorOpen,
  FaBookOpen,
  FaCrown,
  FaTrophy,
  FaDownload,
  FaBrain,
  FaGraduationCap,
  FaPhoneAlt
} from 'react-icons/fa'

interface AssemblyStats {
  gradeStats: Array<{
    grade: string
    bookingCount: number
    subjects: Array<{
      subject: string
      count: number
    }>
  }>
  teacherStats: Array<{
    teacherName: string
    phone: string
    bookingCount: number
    subjects: string[]
  }>
  subjectStats: Array<{
    subject: string
    bookingCount: number
    grades: string[]
  }>
}

interface SmartClassroomStats {
  subjects: Array<{
    subject: string
    bookingCount: number
  }>
  teachers: Array<{
    teacherName: string
    phone: string
    bookingCount: number
  }>
  grades: Array<{
    grade: string
    bookingCount: number
  }>
}

export default function AdvancedStats() {
  const [assemblyStats, setAssemblyStats] = useState<AssemblyStats | null>(null)
  const [smartClassroomStats, setSmartClassroomStats] = useState<SmartClassroomStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdvancedStats()
  }, [])

  const fetchAdvancedStats = () => {
    try {
      // جلب بيانات الحجوزات من localStorage
      const bookingsData = localStorage.getItem('zawiyah-bookings')
      const bookings = bookingsData ? JSON.parse(bookingsData) : {}
      
      const allBookings = Object.entries(bookings).map(([key, booking]: [string, any]) => ({ 
        key, 
        booking 
      }))
      
      // تحليل إحصائيات فترة الطابور
      const assemblyBookings = allBookings.filter(item => 
        item.booking.period === 'الطابور'
      )
      
      // إحصائيات الفصول في فترة الطابور
      const gradeStats: Record<string, { count: number, subjects: Record<string, number> }> = {}
      assemblyBookings.forEach(item => {
        const grade = `${item.booking.grade} - ${item.booking.section}`
        const subject = item.booking.subject
        
        if (!gradeStats[grade]) {
          gradeStats[grade] = { count: 0, subjects: {} }
        }
        gradeStats[grade].count++
        gradeStats[grade].subjects[subject] = (gradeStats[grade].subjects[subject] || 0) + 1
      })
      
      const assemblyGradeStats = Object.entries(gradeStats).map(([grade, data]) => ({
        grade,
        bookingCount: data.count,
        subjects: Object.entries(data.subjects).map(([subject, count]) => ({
          subject,
          count
        })).sort((a, b) => b.count - a.count)
      })).sort((a, b) => b.bookingCount - a.bookingCount)
      
      // إحصائيات المعلمات في فترة الطابور
      const teacherStats: Record<string, { count: number, subjects: Set<string>, phone: string }> = {}
      assemblyBookings.forEach(item => {
        const teacher = item.booking.teacher
        const subject = item.booking.subject
        const phone = item.booking.phone
        
        if (!teacherStats[teacher]) {
          teacherStats[teacher] = { count: 0, subjects: new Set(), phone }
        }
        teacherStats[teacher].count++
        teacherStats[teacher].subjects.add(subject)
      })
      
      const assemblyTeacherStats = Object.entries(teacherStats).map(([teacher, data]) => ({
        teacherName: teacher,
        phone: data.phone,
        bookingCount: data.count,
        subjects: Array.from(data.subjects)
      })).sort((a, b) => b.bookingCount - a.bookingCount)
      
      // إحصائيات المواد في فترة الطابور
      const subjectStats: Record<string, { count: number, grades: Set<string> }> = {}
      assemblyBookings.forEach(item => {
        const subject = item.booking.subject
        const grade = `${item.booking.grade} - ${item.booking.section}`
        
        if (!subjectStats[subject]) {
          subjectStats[subject] = { count: 0, grades: new Set() }
        }
        subjectStats[subject].count++
        subjectStats[subject].grades.add(grade)
      })
      
      const assemblySubjectStats = Object.entries(subjectStats).map(([subject, data]) => ({
        subject,
        bookingCount: data.count,
        grades: Array.from(data.grades)
      })).sort((a, b) => b.bookingCount - a.bookingCount)
      
      setAssemblyStats({
        gradeStats: assemblyGradeStats,
        teacherStats: assemblyTeacherStats,
        subjectStats: assemblySubjectStats
      })
      
      // تحليل إحصائيات القاعة الذكية
      const smartClassroomBookings = allBookings.filter(item => 
        item.booking.room === 'القاعة الذكية'
      )
      
      // إحصائيات المواد في القاعة الذكية
      const smartSubjects: Record<string, number> = {}
      smartClassroomBookings.forEach(item => {
        const subject = item.booking.subject
        smartSubjects[subject] = (smartSubjects[subject] || 0) + 1
      })
      
      const smartSubjectStats = Object.entries(smartSubjects).map(([subject, count]) => ({
        subject,
        bookingCount: count
      })).sort((a, b) => b.bookingCount - a.bookingCount)
      
      // إحصائيات المعلمات في القاعة الذكية
      const smartTeachers: Record<string, { count: number, phone: string }> = {}
      smartClassroomBookings.forEach(item => {
        const teacher = item.booking.teacher
        const phone = item.booking.phone
        
        if (!smartTeachers[teacher]) {
          smartTeachers[teacher] = { count: 0, phone }
        }
        smartTeachers[teacher].count++
      })
      
      const smartTeacherStats = Object.entries(smartTeachers).map(([teacher, data]) => ({
        teacherName: teacher,
        phone: data.phone,
        bookingCount: data.count
      })).sort((a, b) => b.bookingCount - a.bookingCount)
      
      // إحصائيات الفصول في القاعة الذكية
      const smartGrades: Record<string, number> = {}
      smartClassroomBookings.forEach(item => {
        const grade = `${item.booking.grade} - ${item.booking.section}`
        smartGrades[grade] = (smartGrades[grade] || 0) + 1
      })
      
      const smartGradeStats = Object.entries(smartGrades).map(([grade, count]) => ({
        grade,
        bookingCount: count
      })).sort((a, b) => b.bookingCount - a.bookingCount)
      
      setSmartClassroomStats({
        subjects: smartSubjectStats,
        teachers: smartTeacherStats,
        grades: smartGradeStats
      })
      
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-cairo">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 rtl">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 font-cairo mb-4">
            📊 الإحصائيات المتقدمة
          </h1>
          <p className="text-xl text-gray-700 font-cairo">
            تحليل شامل لحجوزات فترة الطابور والقاعة الذكية
          </p>
        </div>

        {/* إحصائيات فترة الطابور */}
        <div className="mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-purple-800 font-cairo mb-6 flex items-center">
              <FaFlag className="ml-3" />
              إحصائيات فترة الطابور
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* إحصائيات الفصول */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-purple-700 font-cairo mb-4 flex items-center">
                  <FaGraduationCap className="ml-2" />
                  الفصول الدراسية
                </h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {assemblyStats?.gradeStats.map((grade, index) => (
                    <div key={grade.grade} className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-purple-800 font-cairo">{grade.grade}</h4>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-cairo">
                          {grade.bookingCount} حجز
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 font-cairo font-semibold">المواد المحجوزة:</p>
                        {grade.subjects.map((subject, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 font-cairo">{subject.subject}</span>
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {subject.count} مرة
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* إحصائيات المعلمات */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-blue-700 font-cairo mb-4 flex items-center">
                  <FaUsers className="ml-2" />
                  أكثر المعلمات حجزاً
                </h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {assemblyStats?.teacherStats.slice(0, 10).map((teacher, index) => (
                    <div key={teacher.teacherName} className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-blue-800 font-cairo">{teacher.teacherName}</h4>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FaPhoneAlt className="ml-1 text-xs" />
                            <span className="font-cairo">{teacher.phone}</span>
                          </div>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-cairo">
                          {teacher.bookingCount} حجز
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-cairo mb-1">المواد:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((subject, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-cairo">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* إحصائيات المواد */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-green-700 font-cairo mb-4 flex items-center">
                  <FaBookOpen className="ml-2" />
                  أكثر المواد حجزاً
                </h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {assemblyStats?.subjectStats.map((subject, index) => (
                    <div key={subject.subject} className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-green-800 font-cairo">{subject.subject}</h4>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-cairo">
                          {subject.bookingCount} حجز
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-cairo font-semibold mb-2">الفصول:</p>
                        <div className="flex flex-wrap gap-1">
                          {subject.grades.map((grade, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-cairo">
                              {grade}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* إحصائيات القاعة الذكية */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-orange-800 font-cairo mb-6 flex items-center">
              <FaBrain className="ml-3" />
              إحصائيات القاعة الذكية
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* أكثر المواد حجزاً */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-orange-700 font-cairo mb-4 flex items-center">
                  <FaBookOpen className="ml-2" />
                  أكثر المواد حجزاً
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {smartClassroomStats?.subjects.map((subject, index) => (
                    <div key={subject.subject} className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-orange-800 font-cairo">{subject.subject}</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-cairo">
                          {subject.bookingCount} حجز
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* أكثر المعلمات حجزاً */}
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-red-700 font-cairo mb-4 flex items-center">
                  <FaUsers className="ml-2" />
                  أكثر المعلمات حجزاً
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {smartClassroomStats?.teachers.map((teacher, index) => (
                    <div key={teacher.teacherName} className="bg-white rounded-lg p-3 border border-red-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-semibold text-red-800 font-cairo block">{teacher.teacherName}</span>
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <FaPhoneAlt className="ml-1" />
                            <span className="font-cairo">{teacher.phone}</span>
                          </div>
                        </div>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-cairo">
                          {teacher.bookingCount} حجز
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* أكثر الفصول حجزاً */}
              <div className="bg-indigo-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-indigo-700 font-cairo mb-4 flex items-center">
                  <FaGraduationCap className="ml-2" />
                  أكثر الفصول حجزاً
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {smartClassroomStats?.grades.map((grade, index) => (
                    <div key={grade.grade} className="bg-white rounded-lg p-3 border border-indigo-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-indigo-800 font-cairo">{grade.grade}</span>
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm font-cairo">
                          {grade.bookingCount} حجز
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 font-cairo mb-4 flex items-center">
            <FaChartBar className="ml-2" />
            ملخص الإحصائيات
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-purple-100 rounded-lg p-4">
              <div className="text-center">
                <FaFlag className="text-2xl text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-purple-600 font-cairo">إجمالي حجوزات الطابور</p>
                <p className="text-2xl font-bold text-purple-800">{assemblyStats?.gradeStats.reduce((total, grade) => total + grade.bookingCount, 0) || 0}</p>
              </div>
            </div>
            <div className="bg-orange-100 rounded-lg p-4">
              <div className="text-center">
                <FaBrain className="text-2xl text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-orange-600 font-cairo">إجمالي حجوزات القاعة الذكية</p>
                <p className="text-2xl font-bold text-orange-800">{smartClassroomStats?.subjects.reduce((total, subject) => total + subject.bookingCount, 0) || 0}</p>
              </div>
            </div>
            <div className="bg-blue-100 rounded-lg p-4">
              <div className="text-center">
                <FaUsers className="text-2xl text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-600 font-cairo">معلمات فترة الطابور</p>
                <p className="text-2xl font-bold text-blue-800">{assemblyStats?.teacherStats.length || 0}</p>
              </div>
            </div>
            <div className="bg-green-100 rounded-lg p-4">
              <div className="text-center">
                <FaBookOpen className="text-2xl text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-600 font-cairo">مواد فترة الطابور</p>
                <p className="text-2xl font-bold text-green-800">{assemblyStats?.subjectStats.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}