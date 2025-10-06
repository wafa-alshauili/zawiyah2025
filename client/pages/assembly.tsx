import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import socketService from '../services/socket'

export default function AssemblyPage() {
  const [bookings, setBookings] = useState<Record<string, any>>({})
  const [isClient, setIsClient] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [locationType, setLocationType] = useState('classroom') // نوع المكان: classroom أو external
  const [selectedRoom, setSelectedRoom] = useState('القاعة الذكية') // القاعة المختارة
  const [teacherName, setTeacherName] = useState('')
  const [teacherPhone, setTeacherPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [subjectType, setSubjectType] = useState('core') // أساسية أو اختيارية
  const [customSubject, setCustomSubject] = useState('') // للمواد المخصصة
  const [grade, setGrade] = useState('5')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showTeacherBookings, setShowTeacherBookings] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')
  const [teacherBookingsList, setTeacherBookingsList] = useState<any[]>([])

  // إعداد تاريخ اليوم
  useEffect(() => {
    const today = new Date()
    const arabicDate = today.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    setCurrentDate(arabicDate)
    setIsClient(true)
  }, [])

  // الاتصال بالخادم وتحميل البيانات
  useEffect(() => {
    if (!isClient) return

    socketService.connect()
    
    // تحميل من الخادم
    const loadBookings = async () => {
      try {
        const response = await fetch('/api/bookings')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            // Filter assembly bookings only
            const assemblyBookings = {}
            Object.keys(data.data).forEach(key => {
              if (key.startsWith('assembly-') || data.data[key].type === 'assembly') {
                assemblyBookings[key] = data.data[key]
              }
            })
            setBookings(assemblyBookings)
            console.log('✅ تم تحميل حجوزات الطابور من الخادم')
          }
        }
      } catch (error) {
        console.error('خطأ في تحميل حجوزات الطابور:', error)
      }
    }

    loadBookings()

    // الاستماع لتحديثات Socket.IO
    const handleBookingUpdate = (data: any) => {
      console.log('🔄 تحديث حجز الطابور عبر Socket:', data)
      setBookings(prev => ({ ...prev, [data.key]: data.booking }))
    }

    const handleBookingDelete = (data: any) => {
      console.log('🗑️ حذف حجز الطابور عبر Socket:', data)
      setBookings(prev => {
        const updated = { ...prev }
        delete updated[data.key]
        return updated
      })
    }

    socketService.socket?.on('booking-created', handleBookingUpdate)
    socketService.socket?.on('booking-updated', handleBookingUpdate)
    socketService.socket?.on('booking-deleted', handleBookingDelete)

    return () => {
      socketService.socket?.off('booking-created', handleBookingUpdate)
      socketService.socket?.off('booking-updated', handleBookingUpdate)
      socketService.socket?.off('booking-deleted', handleBookingDelete)
    }
  }, [isClient])

  // خيارات المكان المتاحة
  const availableRooms = [
    'القاعة الذكية',
    'المصادر',
    'قاعة التوجيه',
    'قاعة حاسوب 1',
    'قاعة حاسوب 2',
    'الطابور القديم'
  ]
  
  // خيارات المكان
  const locationOptions = [
    { value: 'classroom', label: 'في الفصل الدراسي الأصلي' },
    { value: 'external', label: 'في قاعة أخرى' }
  ]

  // نظام المواد المتطور
  const subjectsByGrade = {
    '5': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '6': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '7': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '8': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '9': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '10': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '11': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'التاريخ', 'الجغرافيا', 'أخرى'],
    '12': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'التاريخ', 'الجغرافيا', 'أخرى']
  }
  
  // المواد للصفين الحادي عشر والثاني عشر
  const advancedGradeCoreSubjects = ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني']
  const advancedGradeElectiveSubjects = ['العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقى', 'الرياضة', 'الحاسوب', 'التاريخ', 'الجغرافيا']

  // بيانات الفصول حسب المواصفات
  const classesData = [
    // الصفوف 5-10 (3 شعب لكل صف)
    ...Array.from({ length: 6 }, (_, i) => {
      const grade = i + 5
      const gradeNames = {
        5: 'الخامس', 6: 'السادس', 7: 'السابع', 8: 'الثامن',
        9: 'التاسع', 10: 'العاشر'
      }
      return Array.from({ length: 3 }, (_, j) => ({
        id: `${grade}-${j + 1}`,
        name: `الصف ${gradeNames[grade]} - الشعبة ${j + 1}`,
        grade: grade,
        section: j + 1
      }))
    }).flat(),
    
    // الصفوف 11-12 (6 شعب لكل صف)
    ...Array.from({ length: 2 }, (_, i) => {
      const grade = i + 11
      const gradeNames = { 11: 'الحادي عشر', 12: 'الثاني عشر' }
      return Array.from({ length: 6 }, (_, j) => ({
        id: `${grade}-${j + 1}`,
        name: `الصف ${gradeNames[grade]} - الشعبة ${j + 1}`,
        grade: grade,
        section: j + 1
      }))
    }).flat()
  ]

  // التحقق من وجود حجز لفصل معين
  const isClassBooked = (classId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const key = `assembly-${classId}-${today}`
    return bookings[key] ? bookings[key] : null
  }

  // فتح نموذج الحجز
  const openBookingModal = (classId: string, className: string) => {
    const existing = isClassBooked(classId)
    if (existing) {
      alert(`هذا الفصل محجوز بالفعل من قبل: ${existing.teacher}`)
      return
    }
    
    // استخراج رقم الصف من الفصل
    const classGrade = classesData.find(c => c.id === classId)?.grade.toString() || '5'
    
    setSelectedClass(classId)
    setGrade(classGrade)
    setShowModal(true)
    setLocationType('classroom') // إعادة تعيين نوع المكان للافتراضي
    setSelectedRoom('القاعة الذكية') // إعادة تعيين القاعة للافتراضي
    setTeacherName('')
    setTeacherPhone('')
    setSubject('')
    setSubjectType('core')
    setCustomSubject('')
    setReason('')
    setNotes('')
  }

  // حفظ الحجز
  const saveBooking = async () => {
    if (!teacherName.trim()) {
      alert('يرجى إدخال اسم المعلم')
      return
    }
    if (!teacherPhone.trim()) {
      alert('يرجى إدخال رقم هاتف المعلم')
      return
    }
    if (!subject.trim()) {
      alert('يرجى إدخال اسم المادة')
      return
    }
    if (!reason.trim()) {
      alert('يرجى إدخال سبب الحجز')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const key = `assembly-${selectedClass}-${today}`
    const selectedClassData = classesData.find(c => c.id === selectedClass)
    
    // حساب اسم المادة النهائي
    const finalSubject = (grade === '11' || grade === '12') && subject === 'أخرى' 
      ? customSubject 
      : subject

    const booking = {
      type: 'assembly',
      classroom: selectedClassData?.name || selectedClass,
      locationType: locationType, // نوع المكان (فصل أو قاعة)
      room: locationType === 'external' ? selectedRoom : (selectedClassData?.name || selectedClass), // المكان الفعلي
      teacher: teacherName,
      phone: teacherPhone,
      subject: finalSubject,
      subjectType: (grade === '11' || grade === '12') ? subjectType : undefined,
      grade: grade,
      reason: reason,
      date: today,
      time: '07:00 - 07:30',
      timeSlot: 'assembly',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      referenceNumber: `ASM-${Date.now()}`
    }

    try {
      // إرسال للخادم
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, booking })
      })

      if (response.ok) {
        // إشعار عبر Socket.IO
        socketService.socket?.emit('create-booking', { key, booking })
        
        // تحديث الحالة المحلية
        setBookings(prev => ({ ...prev, [key]: booking }))

        setShowModal(false)
        console.log('✅ تم حجز وقت الطابور بنجاح')
      } else {
        throw new Error('فشل في حفظ الحجز')
      }
    } catch (error) {
      console.error('خطأ في حجز الطابور:', error)
      alert('حدث خطأ في الحجز. يرجى المحاولة مرة أخرى.')
    }
  }

  // البحث عن حجوزات المعلم
  const searchTeacherBookings = async () => {
    if (!searchPhone.trim()) {
      alert('يرجى إدخال رقم هاتف المعلم')
      return
    }

    try {
      const response = await fetch(`/api/bookings/search?phone=${searchPhone}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTeacherBookingsList(data.data)
          setShowTeacherBookings(true)
          console.log('✅ تم العثور على حجوزات المعلم:', data.data.length)
        } else {
          alert('لم يتم العثور على حجوزات لهذا الرقم')
        }
      }
    } catch (error) {
      console.error('خطأ في البحث عن حجوزات المعلم:', error)
      alert('حدث خطأ في البحث')
    }
  }

  // حساب الإحصائيات
  const calculateStats = () => {
    const allBookings = Object.values(bookings)
    
    // إحصائيات الفصول
    const classStats = {}
    allBookings.forEach(booking => {
      const className = booking.classroom
      classStats[className] = (classStats[className] || 0) + 1
    })

    // إحصائيات المواد
    const subjectStats = {}
    allBookings.forEach(booking => {
      const subject = booking.subject || 'غير محدد'
      subjectStats[subject] = (subjectStats[subject] || 0) + 1
    })

    // إحصائيات المعلمين
    const teacherStats = {}
    allBookings.forEach(booking => {
      const teacher = booking.teacher
      teacherStats[teacher] = (teacherStats[teacher] || 0) + 1
    })

    // إحصائيات الأسباب
    const reasonStats = {}
    allBookings.forEach(booking => {
      const reason = booking.reason || 'غير محدد'
      reasonStats[reason] = (reasonStats[reason] || 0) + 1
    })

    // ترتيب النتائج
    const sortedClasses = Object.entries(classStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)
    const sortedSubjects = Object.entries(subjectStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)
    const sortedTeachers = Object.entries(teacherStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)
    const sortedReasons = Object.entries(reasonStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)

    return {
      totalBookings: allBookings.length,
      mostBookedClasses: sortedClasses,
      mostUsedSubjects: sortedSubjects,
      mostActiveTeachers: sortedTeachers,
      mostCommonReasons: sortedReasons
    }
  }

  if (!isClient) {
    return <div className="flex justify-center items-center min-h-screen">جاري التحميل...</div>
  }

  const bookedCount = classesData.filter(c => isClassBooked(c.id)).length
  const availableCount = classesData.filter(c => !isClassBooked(c.id)).length

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* رأس الصفحة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              حجز وقت الطابور
            </h1>
            <div className="text-lg text-blue-600 font-semibold">
              📅 {currentDate}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              وقت الطابور: 07:00 - 07:30 صباحاً
            </div>
          </div>

          {/* أدوات البحث والإحصائيات */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            {/* البحث عن حجوزات المعلم */}
            <div className="flex gap-2">
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="رقم هاتف المعلم"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchTeacherBookings}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                🔍 بحث عن حجوزات
              </button>
            </div>

            {/* زر الإحصائيات */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              📊 عرض الإحصائيات
            </button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {classesData.length}
            </div>
            <div className="text-gray-600 font-medium">إجمالي الفصول</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {bookedCount}
            </div>
            <div className="text-gray-600 font-medium">فصول محجوزة</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {availableCount}
            </div>
            <div className="text-gray-600 font-medium">فصول متاحة</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {Math.round((bookedCount / classesData.length) * 100)}%
            </div>
            <div className="text-gray-600 font-medium">نسبة الإشغال</div>
          </div>
        </div>

        {/* جدول الفصول */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="text-xl font-bold">الفصول المتاحة للحجز</h2>
          </div>

          <div className="p-6">
            {/* الصفوف 5-10 */}
            <h3 className="text-lg font-bold text-gray-700 mb-4">
              الصفوف من الخامس إلى العاشر (3 شعب لكل صف)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {classesData.filter(c => c.grade >= 5 && c.grade <= 10).map(classItem => {
                const booking = isClassBooked(classItem.id)
                return (
                  <div
                    key={classItem.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      booking
                        ? 'border-red-300 bg-red-50'
                        : 'border-green-300 bg-green-50 hover:bg-green-100'
                    }`}
                    onClick={() => !booking && openBookingModal(classItem.id, classItem.name)}
                  >
                    <div className="font-bold text-gray-800 mb-2">
                      {classItem.name}
                    </div>
                    {booking ? (
                      <div className="text-sm">
                        <div className="text-red-600 font-semibold">
                          ✅ محجوز
                        </div>
                        <div className="text-gray-600">
                          المعلم: {booking.teacher}
                        </div>
                        {booking.notes && (
                          <div className="text-gray-500 text-xs">
                            {booking.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-green-600 font-semibold text-sm">
                        🟢 متاح للحجز
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* الصفوف 11-12 */}
            <h3 className="text-lg font-bold text-gray-700 mb-4">
              الصف الحادي عشر والثاني عشر (6 شعب لكل صف)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classesData.filter(c => c.grade >= 11 && c.grade <= 12).map(classItem => {
                const booking = isClassBooked(classItem.id)
                return (
                  <div
                    key={classItem.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      booking
                        ? 'border-red-300 bg-red-50'
                        : 'border-green-300 bg-green-50 hover:bg-green-100'
                    }`}
                    onClick={() => !booking && openBookingModal(classItem.id, classItem.name)}
                  >
                    <div className="font-bold text-gray-800 mb-2">
                      {classItem.name}
                    </div>
                    {booking ? (
                      <div className="text-sm">
                        <div className="text-red-600 font-semibold">
                          ✅ محجوز
                        </div>
                        <div className="text-gray-600">
                          المعلم: {booking.teacher}
                        </div>
                        {booking.notes && (
                          <div className="text-gray-500 text-xs">
                            {booking.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-green-600 font-semibold text-sm">
                        🟢 متاح للحجز
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* نموذج الحجز */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pb-2 border-b mb-4">
              <h3 className="text-xl font-bold">حجز وقت الطابور</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفصل
              </label>
              <input
                type="text"
                value={classesData.find(c => c.id === selectedClass)?.name || ''}
                disabled
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            {/* اختيار مكان الحجز */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مكان الحجز *
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {locationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* اختيار القاعة (يظهر فقط عند اختيار "قاعة أخرى") */}
            {locationType === 'external' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القاعة المطلوبة *
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableRooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المعلم *
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسم المعلم"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف *
              </label>
              <input
                type="tel"
                value={teacherPhone}
                onChange={(e) => setTeacherPhone(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل رقم هاتف المعلم"
                dir="ltr"
              />
            </div>

            {/* نظام اختيار المواد المتطور */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المادة *
              </label>
              
              {/* للصفين 11 و 12 - اختيار نوع المادة أولاً */}
              {(grade === '11' || grade === '12') && (
                <div className="mb-3">
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="core"
                        checked={subjectType === 'core'}
                        onChange={(e) => {
                          setSubjectType(e.target.value)
                          setSubject('')
                          setCustomSubject('')
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">مواد أساسية</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="elective"
                        checked={subjectType === 'elective'}
                        onChange={(e) => {
                          setSubjectType(e.target.value)
                          setSubject('')
                          setCustomSubject('')
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">مواد اختيارية</span>
                    </label>
                  </div>
                </div>
              )}

              {/* قائمة المواد */}
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  if (e.target.value !== 'أخرى') {
                    setCustomSubject('')
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر المادة</option>
                {grade === '11' || grade === '12' ? (
                  // للصفين 11 و 12
                  subjectType === 'core' ? (
                    advancedGradeCoreSubjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))
                  ) : (
                    [...advancedGradeElectiveSubjects, 'أخرى'].map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))
                  )
                ) : (
                  // للصفوف 5-10
                  subjectsByGrade[grade as keyof typeof subjectsByGrade]?.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))
                )}
              </select>

              {/* حقل المادة المخصصة */}
              {subject === 'أخرى' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل اسم المادة"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سبب الحجز *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر سبب الحجز</option>
                <option value="حصة تعويضية">حصة تعويضية</option>
                <option value="مراجعة اختبار">مراجعة اختبار</option>
                <option value="أنشطة إضافية">أنشطة إضافية</option>
                <option value="اجتماع أولياء أمور">اجتماع أولياء أمور</option>
                <option value="تدريب طلاب">تدريب طلاب</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveBooking}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                تأكيد الحجز
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإحصائيات */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">📊 إحصائيات حجز الطابور</h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {(() => {
              const stats = calculateStats()
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* أكثر الفصول حجزاً */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-3">🏫 أكثر الفصول حجزاً</h4>
                    {stats.mostBookedClasses.length > 0 ? (
                      <ul className="space-y-2">
                        {stats.mostBookedClasses.map(([className, count], index) => (
                          <li key={className} className="flex justify-between">
                            <span className="text-sm">{index + 1}. {className}</span>
                            <span className="font-semibold text-blue-600">{count as number} مرة</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                    )}
                  </div>

                  {/* أكثر المواد */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-3">📚 أكثر المواد حجزاً</h4>
                    {stats.mostUsedSubjects.length > 0 ? (
                      <ul className="space-y-2">
                        {stats.mostUsedSubjects.map(([subject, count], index) => (
                          <li key={subject} className="flex justify-between">
                            <span className="text-sm">{index + 1}. {subject}</span>
                            <span className="font-semibold text-green-600">{count as number} مرة</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                    )}
                  </div>

                  {/* أكثر المعلمين نشاطاً */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-bold text-purple-800 mb-3">👨‍🏫 أكثر المعلمين نشاطاً</h4>
                    {stats.mostActiveTeachers.length > 0 ? (
                      <ul className="space-y-2">
                        {stats.mostActiveTeachers.map(([teacher, count], index) => (
                          <li key={teacher} className="flex justify-between">
                            <span className="text-sm">{index + 1}. {teacher}</span>
                            <span className="font-semibold text-purple-600">{count as number} حجز</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                    )}
                  </div>

                  {/* أكثر الأسباب */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-bold text-orange-800 mb-3">📝 أكثر أسباب الحجز</h4>
                    {stats.mostCommonReasons.length > 0 ? (
                      <ul className="space-y-2">
                        {stats.mostCommonReasons.map(([reason, count], index) => (
                          <li key={reason} className="flex justify-between">
                            <span className="text-sm">{index + 1}. {reason}</span>
                            <span className="font-semibold text-orange-600">{count as number} مرة</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                    )}
                  </div>
                </div>
              )
            })()}

            <div className="mt-6 text-center">
              <div className="text-lg font-semibold text-gray-700">
                إجمالي الحجوزات: {calculateStats().totalBookings} حجز
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة حجوزات المعلم */}
      {showTeacherBookings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">📋 حجوزات المعلم</h3>
              <button
                onClick={() => setShowTeacherBookings(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {teacherBookingsList.length > 0 ? (
              <div className="space-y-4">
                {teacherBookingsList.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {item.booking.type === 'assembly' ? '🔔 حجز طابور' : '🏫 حجز قاعة'}
                        </h4>
                        <p><strong>الفصل/القاعة:</strong> {item.booking.classroom}</p>
                        <p><strong>المعلم:</strong> {item.booking.teacher}</p>
                        <p><strong>الهاتف:</strong> {item.booking.phone}</p>
                      </div>
                      <div>
                        <p><strong>المادة:</strong> {item.booking.subject}</p>
                        <p><strong>السبب:</strong> {item.booking.reason || 'غير محدد'}</p>
                        <p><strong>التاريخ:</strong> {new Date(item.booking.date).toLocaleDateString('ar-SA')}</p>
                        <p><strong>الوقت:</strong> {item.booking.time}</p>
                      </div>
                    </div>
                    {item.booking.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>ملاحظات:</strong> {item.booking.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">لم يتم العثور على حجوزات لهذا الرقم</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}