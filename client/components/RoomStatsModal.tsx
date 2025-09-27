import React, { useState, useEffect, useRef } from 'react';
import { 
  FaTimes, 
  FaDownload, 
  FaChartBar, 
  FaUsers, 
  FaBook, 
  FaClock,
  FaGraduationCap,
  FaFilePdf
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RoomStatsModalProps {
  isOpen: boolean
  onClose: () => void
  roomName: string
  bookings: any[]
}

interface StatsData {
  teachers: Array<{ name: string; count: number; percentage: number }>
  periods: Array<{ name: string; count: number; percentage: number }>
  subjects: Array<{ name: string; count: number; percentage: number }>
  grades: Array<{ name: string; count: number; percentage: number }>
  totalBookings: number
  uniqueTeachers: number
  uniqueSubjects: number
  mostActiveDay: string
  utilizationRate: number
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function RoomStatsModal({ isOpen, onClose, roomName, bookings }: RoomStatsModalProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [activeTab, setActiveTab] = useState('teachers')
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && bookings.length > 0) {
      calculateStats()
    }
  }, [isOpen, bookings])

  const calculateStats = () => {
    // فلترة الحجوزات الخاصة بهذه القاعة
    const roomBookings = bookings.filter(([key, booking]) => 
      booking.room === roomName
    )

    if (roomBookings.length === 0) {
      setStats({
        teachers: [],
        periods: [],
        subjects: [],
        grades: [],
        totalBookings: 0,
        uniqueTeachers: 0,
        uniqueSubjects: 0,
        mostActiveDay: 'لا توجد بيانات',
        utilizationRate: 0
      })
      return
    }

    // حساب إحصائيات المعلمات
    const teacherCounts: Record<string, number> = {}
    const periodCounts: Record<string, number> = {}
    const subjectCounts: Record<string, number> = {}
    const gradeCounts: Record<string, number> = {}
    const dayCounts: Record<string, number> = {}

    roomBookings.forEach(([key, booking]) => {
      // المعلمات
      teacherCounts[booking.teacher] = (teacherCounts[booking.teacher] || 0) + 1
      
      // الفترات
      periodCounts[booking.period] = (periodCounts[booking.period] || 0) + 1
      
      // المواد
      subjectCounts[booking.subject] = (subjectCounts[booking.subject] || 0) + 1
      
      // الصفوف
      const gradeSection = `${booking.grade}-${booking.section}`
      gradeCounts[gradeSection] = (gradeCounts[gradeSection] || 0) + 1
      
      // الأيام
      dayCounts[booking.day] = (dayCounts[booking.day] || 0) + 1
    })

    const totalBookings = roomBookings.length

    // تحويل البيانات إلى مصفوفات مرتبة
    const teachers = Object.entries(teacherCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalBookings) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const periods = Object.entries(periodCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalBookings) * 100)
      }))
      .sort((a, b) => b.count - a.count)

    const subjects = Object.entries(subjectCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalBookings) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const grades = Object.entries(gradeCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalBookings) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // اليوم الأكثر نشاطاً
    const mostActiveDay = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'لا توجد بيانات'

    // معدل الاستخدام (افتراضي: 11 فترة في اليوم × 5 أيام = 55 فترة في الأسبوع)
    const utilizationRate = Math.round((totalBookings / 55) * 100)

    setStats({
      teachers,
      periods,
      subjects,
      grades,
      totalBookings,
      uniqueTeachers: Object.keys(teacherCounts).length,
      uniqueSubjects: Object.keys(subjectCounts).length,
      mostActiveDay,
      utilizationRate: Math.min(utilizationRate, 100)
    })
  }

  const exportToPDF = async () => {
    if (!chartRef.current || !stats) return

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // إضافة العنوان
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(20)
      pdf.text(`Room Statistics: ${roomName}`, 20, 20)
      
      // إضافة التاريخ
      const today = new Date().toLocaleDateString('ar-SA')
      pdf.setFontSize(12)
      pdf.text(`Generated on: ${today}`, 20, 35)
      
      // إضافة الإحصائيات العامة
      pdf.setFontSize(14)
      pdf.text('General Statistics:', 20, 50)
      pdf.setFontSize(10)
      pdf.text(`Total Bookings: ${stats.totalBookings}`, 25, 60)
      pdf.text(`Unique Teachers: ${stats.uniqueTeachers}`, 25, 70)
      pdf.text(`Unique Subjects: ${stats.uniqueSubjects}`, 25, 80)
      pdf.text(`Most Active Day: ${stats.mostActiveDay}`, 25, 90)
      pdf.text(`Utilization Rate: ${stats.utilizationRate}%`, 25, 100)
      
      // إضافة الرسم البياني
      const imgWidth = 170
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 20, 110, imgWidth, imgHeight)
      
      // حفظ الملف
      pdf.save(`${roomName}-statistics-${today}.pdf`)
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error)
      alert('حدث خطأ في تصدير التقرير')
    }
  }

  if (!isOpen || !stats) return null

  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'teachers':
        return stats.teachers
      case 'periods':
        return stats.periods
      case 'subjects':
        return stats.subjects
      case 'grades':
        return stats.grades
      default:
        return []
    }
  }

  const getCurrentTabTitle = () => {
    switch (activeTab) {
      case 'teachers':
        return 'أكثر المعلمات حجزاً'
      case 'periods':
        return 'أكثر الفترات حجزاً'
      case 'subjects':
        return 'أكثر المواد تفعيلاً'
      case 'grades':
        return 'أكثر الفصول حجزاً'
      default:
        return ''
    }
  }

  const getCurrentTabIcon = () => {
    switch (activeTab) {
      case 'teachers':
        return <FaUsers className="text-blue-500" />
      case 'periods':
        return <FaClock className="text-green-500" />
      case 'subjects':
        return <FaBook className="text-purple-500" />
      case 'grades':
        return <FaGraduationCap className="text-orange-500" />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-screen overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaChartBar className="text-2xl text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{roomName}</h2>
              <p className="text-gray-600">إحصائيات تفصيلية للقاعة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload />
              تصدير PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <div className="p-6" ref={chartRef}>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalBookings}</div>
              <div className="text-sm text-blue-500">إجمالي الحجوزات</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.uniqueTeachers}</div>
              <div className="text-sm text-green-500">عدد المعلمات</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.uniqueSubjects}</div>
              <div className="text-sm text-purple-500">عدد المواد</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.utilizationRate}%</div>
              <div className="text-sm text-orange-500">معدل الاستخدام</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-red-600">{stats.mostActiveDay}</div>
              <div className="text-sm text-red-500">اليوم الأكثر نشاطاً</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
            {[
              { key: 'teachers', label: 'المعلمات', icon: <FaUsers /> },
              { key: 'periods', label: 'الفترات', icon: <FaClock /> },
              { key: 'subjects', label: 'المواد', icon: <FaBook /> },
              { key: 'grades', label: 'الفصول', icon: <FaGraduationCap /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {getCurrentTabIcon()}
                {getCurrentTabTitle()} - عمود بياني
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCurrentTabData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {getCurrentTabIcon()}
                {getCurrentTabTitle()} - دائرة بيانية
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCurrentTabData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getCurrentTabData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {getCurrentTabIcon()}
                {getCurrentTabTitle()} - جدول تفصيلي
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الترتيب</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الاسم</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">عدد الحجوزات</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">النسبة المئوية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getCurrentTabData().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.count}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="font-medium">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}