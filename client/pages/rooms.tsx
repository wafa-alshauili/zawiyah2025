import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import RoomStatsModal from '../components/RoomStatsModal'
import { 
  FaDoorOpen, 
  FaUsers, 
  FaChalkboardTeacher,
  FaProjectDiagram,
  FaBook,
  FaPlus,
  FaEdit,
  FaEye,
  FaSearch,
  FaChartBar
} from 'react-icons/fa'

interface Classroom {
  id: number
  name_ar: string
  type: string
  grade?: number
  section?: string
  capacity: number
  equipment?: string[]
  isActive: boolean
}

interface ClassroomStats {
  totalBookings: number
  uniqueTeachers: number
  uniqueSubjects: number
  mostRecentBooking: string | null
}

export default function Rooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    fetchClassrooms()
    fetchBookings()
  }, [])

  const fetchBookings = () => {
    try {
      const savedBookings = localStorage.getItem('zawiyah-bookings')
      if (savedBookings) {
        const bookingsData = JSON.parse(savedBookings)
        const bookingsArray = Object.entries(bookingsData)
        setBookings(bookingsArray)
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات الحجوزات:', error)
    }
  }

  const fetchClassrooms = async () => {
    try {
      // تحديد عنوان الخادم
      let serverUrl = 'http://localhost:3001';
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && !hostname.startsWith('192.168')) {
          serverUrl = 'https://zawiyah2025.onrender.com';
        }
      }
      
      try {
        const response = await fetch(`${serverUrl}/api/classrooms`)
        const data = await response.json()
        if (data.success) {
          setClassrooms(data.data)
        } else {
          throw new Error('Failed to fetch from server')
        }
      } catch (serverError) {
        // استخدام البيانات الافتراضية عند فشل الاتصال بالخادم
        console.log('استخدام البيانات الافتراضية للقاعات')
        setClassrooms(getDefaultClassrooms())
      }
    } catch (error) {
      console.error('خطأ في جلب القاعات:', error)
      // استخدام البيانات الافتراضية كحل احتياطي
      setClassrooms(getDefaultClassrooms())
    } finally {
      setLoading(false)
    }
  }

  // البيانات الافتراضية للقاعات
  const getDefaultClassrooms = (): Classroom[] => {
    const defaultClassrooms: Classroom[] = [
      // القاعات الخاصة
      {
        id: 1,
        name_ar: 'القاعة الذكية',
        type: 'smart',
        capacity: 30,
        equipment: ['بروجكتر', 'سبورة ذكية', 'نظام صوتي'],
        isActive: true
      },
      {
        id: 2,
        name_ar: 'قاعة المصادر',
        type: 'resource_center',
        capacity: 25,
        equipment: ['كمبيوترات', 'طاولات مجموعات'],
        isActive: true
      },
      {
        id: 3,
        name_ar: 'ساحة الطابور القديم',
        type: 'assembly',
        capacity: 200,
        equipment: ['نظام صوتي', 'منصة'],
        isActive: true
      }
    ]
    
    let id = 4
    
    // إضافة الصفوف من 5 إلى 10 (3 شعب لكل صف)
    for (let grade = 5; grade <= 10; grade++) {
      for (let section = 1; section <= 3; section++) {
        defaultClassrooms.push({
          id: id++,
          name_ar: `الصف ${getGradeText(grade)} - الشعبة ${section}`,
          type: 'classroom',
          grade: grade,
          section: section.toString(),
          capacity: 30,
          equipment: ['سبورة', 'مقاعد'],
          isActive: true
        })
      }
    }
    
    // إضافة الصفوف 11 و 12 (6 شعب لكل صف)
    for (let grade = 11; grade <= 12; grade++) {
      for (let section = 1; section <= 6; section++) {
        defaultClassrooms.push({
          id: id++,
          name_ar: `الصف ${getGradeText(grade)} - الشعبة ${section}`,
          type: 'classroom',
          grade: grade,
          section: section.toString(),
          capacity: 30,
          equipment: ['سبورة', 'مقاعد'],
          isActive: true
        })
      }
    }
    
    return defaultClassrooms
  }
  
  // تحويل رقم الصف إلى نص عربي
  const getGradeText = (grade: number): string => {
    const gradeNames: Record<number, string> = {
      5: 'الخامس',
      6: 'السادس', 
      7: 'السابع',
      8: 'الثامن',
      9: 'التاسع',
      10: 'العاشر',
      11: 'الحادي عشر',
      12: 'الثاني عشر'
    }
    return gradeNames[grade] || grade.toString()
  }

  // Group classrooms by type
  const groupedClassrooms = classrooms.reduce((acc, classroom) => {
    if (!acc[classroom.type]) {
      acc[classroom.type] = []
    }
    acc[classroom.type].push(classroom)
    return acc
  }, {} as Record<string, Classroom[]>)

  // Filter classrooms
  const filteredClassrooms = classrooms.filter(classroom => {
    const searchMatch = classroom.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
    const typeMatch = !selectedType || classroom.type === selectedType
    const gradeMatch = !selectedGrade || classroom.grade?.toString() === selectedGrade
    return searchMatch && typeMatch && gradeMatch && classroom.isActive
  })

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'smart': 'القاعة الذكية',
      'resource_center': 'قاعة المصادر',
      'assembly': 'ساحة الطابور',
      'classroom': 'قاعة دراسية',
      'lab': 'مختبر'
    }
    return types[type] || type
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'smart':
        return <FaChalkboardTeacher className="w-5 h-5 text-blue-500" />
      case 'resource_center':
        return <FaBook className="w-5 h-5 text-indigo-500" />
      case 'assembly':
        return <FaUsers className="w-5 h-5 text-green-500" />
      case 'classroom':
        return <FaDoorOpen className="w-5 h-5 text-orange-500" />
      case 'lab':
        return <FaProjectDiagram className="w-5 h-5 text-purple-500" />
      default:
        return <FaDoorOpen className="w-5 h-5 text-gray-500" />
    }
  }

  const openStatsModal = (roomName: string) => {
    setSelectedRoom(roomName)
    setShowStatsModal(true)
    // تحديث البيانات قبل فتح الـ modal
    fetchBookings()
  }

  const getGradeOptions = () => {
    const gradeSet = new Set(classrooms.map(c => c.grade).filter(Boolean))
    const grades = Array.from(gradeSet)
    return grades.sort((a, b) => (a || 0) - (b || 0))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إدارة القاعات الدراسية
          </h1>
          <p className="text-gray-600">
            عرض وإدارة جميع القاعات والمرافق التعليمية في المدرسة
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي القاعات</p>
                <p className="text-3xl font-bold">{classrooms.filter(c => c.isActive).length}</p>
              </div>
              <FaDoorOpen className="text-4xl text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">القاعات الذكية</p>
                <p className="text-3xl font-bold">
                  {classrooms.filter(c => c.type === 'smart' && c.isActive).length}
                </p>
              </div>
              <FaChalkboardTeacher className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">القاعات الدراسية</p>
                <p className="text-3xl font-bold">
                  {classrooms.filter(c => c.type === 'classroom' && c.isActive).length}
                </p>
              </div>
              <FaDoorOpen className="text-4xl text-purple-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">المرافق الأخرى</p>
                <p className="text-3xl font-bold">
                  {classrooms.filter(c => !['smart', 'classroom'].includes(c.type) && c.isActive).length}
                </p>
              </div>
              <FaUsers className="text-4xl text-orange-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث
              </label>
              <div className="relative">
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pr-10"
                  placeholder="ابحث عن قاعة..."
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع القاعة
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field"
              >
                <option value="">جميع الأنواع</option>
                <option value="smart">القاعات الذكية</option>
                <option value="classroom">القاعات الدراسية</option>
                <option value="assembly">ساحات الطابور</option>
                <option value="lab">المختبرات</option>
              </select>
            </div>

            {/* Grade Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الصف الدراسي
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="input-field"
              >
                <option value="">جميع الصفوف</option>
                {getGradeOptions().map(grade => (
                  <option key={grade} value={grade}>الصف {grade}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Classrooms Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClassrooms.map((classroom) => (
              <div key={classroom.id} className="card hover:shadow-medium transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(classroom.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{classroom.name_ar}</h3>
                      <p className="text-sm text-gray-500">{getTypeLabel(classroom.type)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    classroom.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {classroom.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                {/* Classroom Details */}
                <div className="space-y-2 mb-4">
                  {classroom.grade && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-20 font-medium">الصف:</span>
                      <span>الصف {classroom.grade}{classroom.section}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-20 font-medium">السعة:</span>
                    <span>{classroom.capacity} طالب</span>
                  </div>

                  {classroom.equipment && classroom.equipment.length > 0 && (
                    <div className="flex items-start text-sm text-gray-600">
                      <span className="w-20 font-medium">المعدات:</span>
                      <div className="flex-1">
                        {classroom.equipment.map((eq, index) => (
                          <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs ml-1 mb-1">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2">
                    <FaEye className="w-4 h-4" />
                    عرض
                  </button>
                  <button 
                    onClick={() => openStatsModal(classroom.name_ar)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200"
                  >
                    <FaChartBar className="w-4 h-4" />
                    إحصائيات
                  </button>
                  <button className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
                    <FaEdit className="w-4 h-4" />
                    تعديل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredClassrooms.length === 0 && (
          <div className="text-center py-12">
            <FaDoorOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد قاعات</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType || selectedGrade 
                ? 'لم يتم العثور على قاعات تطابق معايير البحث' 
                : 'لا توجد قاعات متاحة حالياً'
              }
            </p>
          </div>
        )}

        {/* Classrooms by Type Section */}
        {!searchTerm && !selectedType && !selectedGrade && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">القاعات حسب النوع</h2>
            
            {Object.entries(groupedClassrooms).map(([type, typeClassrooms]) => {
              if (typeClassrooms.length === 0) return null;
              
              return (
                <div key={type} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    {getTypeIcon(type)}
                    <h3 className="text-xl font-semibold text-gray-800">
                      {getTypeLabel(type)} ({typeClassrooms.filter(c => c.isActive).length})
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {typeClassrooms.filter(c => c.isActive).map((classroom) => (
                      <div key={classroom.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-soft transition-shadow">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {classroom.name_ar}
                        </div>
                        <div className="text-xs text-gray-500">
                          السعة: {classroom.capacity}
                        </div>
                        {classroom.grade && (
                          <div className="text-xs text-blue-600">
                            الصف {classroom.grade}{classroom.section}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Room Statistics Modal */}
      {showStatsModal && (
        <RoomStatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          roomName={selectedRoom}
          bookings={bookings}
        />
      )}
      <Footer />
    </div>
  )
}