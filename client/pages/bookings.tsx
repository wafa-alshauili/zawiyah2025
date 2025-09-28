import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import socketService from '../services/socket'

export default function BookingsPage() {
  const [selectedRoom, setSelectedRoom] = useState('القاعة الذكية')
  const [showModal, setShowModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState({ day: '', period: '' })
  const [bookings, setBookings] = useState<Record<string, any>>({})
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date())
  const [isClient, setIsClient] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [editingBooking, setEditingBooking] = useState<{key: string, booking: any} | null>(null)
  const [manageAction, setManageAction] = useState('') // 'edit' or 'delete'
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [showTeacherBookings, setShowTeacherBookings] = useState(false)
  const [teacherPhone, setTeacherPhone] = useState('')
  const [teacherBookingsList, setTeacherBookingsList] = useState<{key: string, booking: any}[]>([])
  
  // ضمان التحميل من جانب العميل وإعداد Socket.IO
  useEffect(() => {
    setIsClient(true)
    
    // الاتصال بالخادم
    socketService.connect()
    
    // تحميل البيانات من localStorage كنسخة احتياطية
    loadBookingsFromStorage()
    
    // إعداد مستمعي Socket.IO للتزامن الفوري
    socketService.on('bookings-updated', (data: any) => {
      console.log('📅 تم تحديث الحجوزات عبر Socket:', data)
      setBookings(data.bookings || {})
      // تحديث localStorage أيضاً
      localStorage.setItem('zawiyah-bookings', JSON.stringify(data.bookings || {}))
    })
    
    socketService.on('booking-created', (data: any) => {
      console.log('✅ تم إنشاء حجز جديد عبر Socket:', data)
      setBookings(prev => {
        const updated = { ...prev, [data.key]: data.booking }
        localStorage.setItem('zawiyah-bookings', JSON.stringify(updated))
        return updated
      })
    })
    
    socketService.on('booking-updated', (data: any) => {
      console.log('📝 تم تحديث حجز عبر Socket:', data)
      setBookings(prev => {
        const updated = { ...prev }
        if (updated[data.key]) {
          updated[data.key] = data.booking
          localStorage.setItem('zawiyah-bookings', JSON.stringify(updated))
        }
        return updated
      })
    })
    
    socketService.on('booking-deleted', (data: any) => {
      console.log('🗑️ تم حذف حجز عبر Socket:', data)
      setBookings(prev => {
        const updated = { ...prev }
        delete updated[data.key]
        localStorage.setItem('zawiyah-bookings', JSON.stringify(updated))
        return updated
      })
    })
    
    // طلب البيانات الحالية من الخادم
    socketService.getBookings()
    
    return () => {
      // تنظيف المستمعين عند إلغاء التحميل
      socketService.off('bookings-updated')
      socketService.off('booking-created')
      socketService.off('booking-updated')
      socketService.off('booking-deleted')
    }
  }, [])
  
  // دالة تحميل البيانات من localStorage (نسخة احتياطية)
  const loadBookingsFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedBookings = localStorage.getItem('zawiyah-bookings')
      if (savedBookings) {
        try {
          setBookings(JSON.parse(savedBookings))
        } catch (error) {
          console.error('خطأ في تحميل البيانات من localStorage:', error)
        }
      }
    }
  }
  const [formData, setFormData] = useState({
    teacher: '',
    phone: '',
    grade: '5' as keyof typeof subjectsByGrade,
    section: '1',
    subject: '',
    subjectType: 'core', // للصف 11: 'core' أو 'elective'
    customSubject: '', // للمواد الاختيارية المخصصة
    notes: ''
  })

  // فترات اليوم الدراسي
  const periods = [
    'الطابور',
    'الحصة الأولى',
    'الحصة الثانية',
    'الحصة الثالثة',
    'الاستراحة',
    'الحصة الرابعة',
    'الحصة الخامسة',
    'الحصة السادسة',
    'الحصة السابعة',
    'الحصة الثامنة',
    'النشاط'
  ]

  // أيام الأسبوع - تحديث حسب الأسبوع المختار
  const getWeekDays = (weekStartDate: Date) => {
    const currentDay = weekStartDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    const sunday = new Date(weekStartDate)
    sunday.setDate(weekStartDate.getDate() - currentDay)
    
    const days = []
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
    
    for (let i = 0; i < 5; i++) {
      const day = new Date(sunday)
      day.setDate(sunday.getDate() + i)
      days.push({
        name: dayNames[i],
        date: day.toISOString().split('T')[0],
        fullDate: new Date(day)
      })
    }
    return days
  }
  
  const weekDays = getWeekDays(selectedWeekStart)
  
  // دوال التنقل بين الأسابيع
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedWeekStart)
    newDate.setDate(selectedWeekStart.getDate() - 7)
    setSelectedWeekStart(newDate)
  }
  
  const goToNextWeek = () => {
    const newDate = new Date(selectedWeekStart)
    newDate.setDate(selectedWeekStart.getDate() + 7)
    setSelectedWeekStart(newDate)
  }
  
  const goToCurrentWeek = () => {
    setSelectedWeekStart(new Date())
  }
  
  const selectSpecificDate = (dateString: string) => {
    const selectedDate = new Date(dateString)
    setSelectedWeekStart(selectedDate)
  }
  
  // تنسيق التاريخ بصيغة موحدة وآمنة من hydration
  const formatWeekRange = () => {
    if (!isClient) {
      return '...'
    }
    
    const startDate = weekDays[0].fullDate
    const endDate = weekDays[4].fullDate
    
    // تنسيق يدوي بسيط وموحد
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  // القاعات المتاحة
  const classrooms = [
    // القاعات الخاصة
    'القاعة الذكية',
    'قاعة المصادر',
    'ساحة الطابور القديم',
    
    // الصف الخامس
    'الصف الخامس - شعبة 1',
    'الصف الخامس - شعبة 2',
    'الصف الخامس - شعبة 3',
    
    // الصف السادس
    'الصف السادس - شعبة 1',
    'الصف السادس - شعبة 2',
    'الصف السادس - شعبة 3',
    
    // الصف السابع
    'الصف السابع - شعبة 1',
    'الصف السابع - شعبة 2',
    'الصف السابع - شعبة 3',
    
    // الصف الثامن
    'الصف الثامن - شعبة 1',
    'الصف الثامن - شعبة 2',
    'الصف الثامن - شعبة 3',
    
    // الصف التاسع
    'الصف التاسع - شعبة 1',
    'الصف التاسع - شعبة 2',
    'الصف التاسع - شعبة 3',
    
    // الصف العاشر
    'الصف العاشر - شعبة 1',
    'الصف العاشر - شعبة 2',
    'الصف العاشر - شعبة 3',
    
    // الصف الحادي عشر
    'الصف الحادي عشر - شعبة 1',
    'الصف الحادي عشر - شعبة 2',
    'الصف الحادي عشر - شعبة 3',
    'الصف الحادي عشر - شعبة 4',
    'الصف الحادي عشر - شعبة 5',
    'الصف الحادي عشر - شعبة 6',
    
    // الصف الثاني عشر
    'الصف الثاني عشر - شعبة 1',
    'الصف الثاني عشر - شعبة 2',
    'الصف الثاني عشر - شعبة 3',
    'الصف الثاني عشر - شعبة 4',
    'الصف الثاني عشر - شعبة 5',
    'الصف الثاني عشر - شعبة 6'
  ]

  // المواد حسب الصف
  const subjectsByGrade = {
    '5': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '6': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '7': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '8': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '9': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '10': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'المهارات الحياتية'],
    '11': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'التاريخ', 'الجغرافيا', 'أخرى'],
    '12': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'التاريخ', 'الجغرافيا', 'أخرى']
  }
  
  // المواد للصفين الحادي عشر والثاني عشر
  const advancedGradeCoreSubjects = ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'الإنجليزي', 'هذا وطني']
  const advancedGradeElectiveSubjects = ['العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الفنون', 'الموسيقة', 'الرياضة', 'الحاسوب', 'التاريخ', 'الجغرافيا']

  // الشعب حسب الصف
  const sectionsByGrade = {
    '5': ['1', '2', '3'],
    '6': ['1', '2', '3'],
    '7': ['1', '2', '3'],
    '8': ['1', '2', '3'],
    '9': ['1', '2', '3'],
    '10': ['1', '2', '3'],
    '11': ['1', '2', '3', '4', '5', '6'],
    '12': ['1', '2', '3', '4', '5', '6']
  }

  // فتح نافذة الحجز
  const openBookingModal = (day: string, period: string) => {
    setSelectedSlot({ day, period })
    setShowModal(true)
  }

  // إغلاق النافذة
  const closeModal = () => {
    setShowModal(false)
    setFormData({
      teacher: '',
      phone: '',
      grade: '5',
      section: '1',
      subject: '',
      subjectType: 'core',
      customSubject: '',
      notes: ''
    })
  }

  // توليد رقم مرجعي فريد
  const generateReferenceNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'ZW-'
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // حفظ الحجز
  const saveBooking = () => {
    const bookingKey = `${selectedRoom}-${selectedSlot.day}-${selectedSlot.period}`
    const finalSubject = (formData.grade === '11' || formData.grade === '12') && formData.subject === 'custom' 
      ? formData.customSubject 
      : formData.subject
    
    const referenceNum = generateReferenceNumber()
    const newBooking = {
      teacher: formData.teacher,
      phone: formData.phone,
      grade: formData.grade,
      section: formData.section,
      subject: finalSubject,
      subjectType: (formData.grade === '11' || formData.grade === '12') ? formData.subjectType : undefined,
      notes: formData.notes,
      room: selectedRoom,
      referenceNumber: referenceNum,
      createdAt: new Date().toISOString(),
      day: selectedSlot.day,
      period: selectedSlot.period
    }
    
    // إرسال الحجز للخادم عبر Socket.IO
    socketService.createBooking({
      key: bookingKey,
      booking: newBooking
    })
    
    // تحديث حالة المحلية أيضاً (نسخة احتياطية)
    setBookings(prev => {
      const updatedBookings = {
        ...prev,
        [bookingKey]: newBooking
      }
      // حفظ في localStorage مع الحالة المحدثة
      localStorage.setItem('zawiyah-bookings', JSON.stringify(updatedBookings))
      return updatedBookings
    })
    
    setConfirmationNumber(referenceNum)
    closeModal()
  }

  // الحصول على تفاصيل الحجز
  const getBookingDetails = (day: string, period: string) => {
    const bookingKey = `${selectedRoom}-${day}-${period}`
    return bookings[bookingKey]
  }

  // البحث عن حجز برقم مرجعي
  const findBookingByReference = (refNum: string) => {
    for (const [key, booking] of Object.entries(bookings)) {
      if (booking.referenceNumber === refNum) {
        return { key, booking }
      }
    }
    return null
  }

  // فتح نافذة إدارة الحجز
  const openManageModal = () => {
    setShowManageModal(true)
    setReferenceNumber('')
    setEditingBooking(null)
    setManageAction('')
  }

  // إغلاق نافذة إدارة الحجز
  const closeManageModal = () => {
    setShowManageModal(false)
    setReferenceNumber('')
    setEditingBooking(null)
    setManageAction('')
  }

  // البحث عن الحجز
  const searchBooking = () => {
    const result = findBookingByReference(referenceNumber)
    if (result) {
      setEditingBooking(result)
      // تحديث القاعة والأسبوع المناسب
      setSelectedRoom(result.booking.room)
    } else {
      alert('لم يتم العثور على حجز بهذا الرقم المرجعي')
      setEditingBooking(null)
    }
  }

  // حذف الحجز
  const deleteBooking = () => {
    if (editingBooking && window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      // إرسال طلب الحذف للخادم عبر Socket.IO
      socketService.deleteBooking(editingBooking.booking.referenceNumber)
      
      // حذف من الحالة المحلية أيضاً
      setBookings(prev => {
        const newBookings = { ...prev }
        delete newBookings[editingBooking.key]
        // تحديث localStorage مع الحالة المحدثة
        localStorage.setItem('zawiyah-bookings', JSON.stringify(newBookings))
        return newBookings
      })
      
      alert('تم حذف الحجز بنجاح')
      closeManageModal()
    }
  }

  // تعديل الحجز
  const editBooking = () => {
    if (editingBooking) {
      // ملء النموذج ببيانات الحجز الحالي
      setFormData({
        teacher: editingBooking.booking.teacher,
        phone: editingBooking.booking.phone || '',
        grade: editingBooking.booking.grade,
        section: editingBooking.booking.section,
        subject: editingBooking.booking.subject,
        subjectType: editingBooking.booking.subjectType || 'core',
        customSubject: '',
        notes: editingBooking.booking.notes || ''
      })
      setSelectedSlot({ 
        day: editingBooking.booking.day, 
        period: editingBooking.booking.period 
      })
      closeManageModal()
      setShowModal(true)
    }
  }

  // البحث عن حجوزات المعلم
  const findTeacherBookings = (phone: string) => {
    const teacherBookings = []
    for (const [key, booking] of Object.entries(bookings)) {
      if (booking.phone === phone) {
        teacherBookings.push({ key, booking })
      }
    }
    return teacherBookings
  }

  // فتح نافذة حجوزات المعلم
  const openTeacherBookingsModal = () => {
    setShowTeacherBookings(true)
    setTeacherBookingsList([])
  }

  // إغلاق نافذة حجوزات المعلم
  const closeTeacherBookingsModal = () => {
    setShowTeacherBookings(false)
    setTeacherPhone('')
    setTeacherBookingsList([])
  }

  // البحث عن حجوزات المعلم
  const searchTeacherBookings = () => {
    if (!teacherPhone || teacherPhone.length < 10) {
      alert('يرجى إدخال رقم هاتف صحيح (10 أرقام)')
      return
    }
    
    const foundBookings = findTeacherBookings(teacherPhone.trim())
    setTeacherBookingsList(foundBookings)
    
    if (foundBookings.length === 0) {
      alert('لا توجد حجوزات لهذا الرقم. تأكد من الرقم المدخل.')
    } else {
      alert(`تم العثور على ${foundBookings.length} حجز لهذا الرقم`)
    }
  }

  // حذف حجز محدد من قائمة المعلم
  const deleteTeacherBooking = (bookingKey: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      // البحث عن رقم المرجع للحجز
      const booking = bookings[bookingKey]
      if (booking && booking.referenceNumber) {
        // إرسال طلب الحذف للخادم
        socketService.deleteBooking(booking.referenceNumber)
      }
      
      // حذف من الحالة المحلية
      setBookings(prev => {
        const newBookings = { ...prev }
        delete newBookings[bookingKey]
        // تحديث localStorage مع الحالة المحدثة
        localStorage.setItem('zawiyah-bookings', JSON.stringify(newBookings))
        
        // تحديث القائمة مع البيانات الجديدة
        const updatedList = []
        for (const [key, booking] of Object.entries(newBookings)) {
          if (booking.phone === teacherPhone) {
            updatedList.push({ key, booking })
          }
        }
        setTeacherBookingsList(updatedList)
        
        return newBookings
      })
      alert('تم حذف الحجز بنجاح')
    }
  }

  // حفظ التعديل
  const saveEdit = () => {
    if (editingBooking) {
      const finalSubject = (formData.grade === '11' || formData.grade === '12') && formData.subject === 'custom' 
        ? formData.customSubject 
        : formData.subject
      
      const updatedBooking = {
        ...editingBooking.booking,
        teacher: formData.teacher,
        phone: formData.phone,
        grade: formData.grade,
        section: formData.section,
        subject: finalSubject,
        subjectType: (formData.grade === '11' || formData.grade === '12') ? formData.subjectType : undefined,
        notes: formData.notes,
        updatedAt: new Date().toISOString()
      }
      
      // إرسال التحديث للخادم عبر Socket.IO
      socketService.updateBooking(editingBooking.booking.referenceNumber, {
        key: editingBooking.key,
        booking: updatedBooking
      })
      
      // تحديث الحالة المحلية
      setBookings(prev => ({
        ...prev,
        [editingBooking.key]: updatedBooking
      }))
      
      // تحديث localStorage
      const updatedBookings = { ...bookings, [editingBooking.key]: updatedBooking }
      localStorage.setItem('zawiyah-bookings', JSON.stringify(updatedBookings))
      
      alert('تم تعديل الحجز بنجاح')
      setEditingBooking(null)
      closeModal()
    } else {
      saveBooking()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-cairo">
            جدول حجوزات القاعات الأسبوعي
          </h1>
          <p className="text-xl text-gray-600 font-cairo">
            احجز القاعات الدراسية من خلال الجدول الأسبوعي التفاعلي
          </p>
        </div>

        {/* التنقل بين الأسابيع */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* عناصر التحكم في الأسبوع */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 font-cairo mb-4">📅 اختيار الأسبوع:</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* أزرار التنقل */}
                <div className="flex gap-2">
                  <button
                    onClick={goToPreviousWeek}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-cairo hover:bg-blue-600 transition-colors"
                    title="الأسبوع السابق"
                  >
                    ⬅️ السابق
                  </button>
                  <button
                    onClick={goToCurrentWeek}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-cairo hover:bg-green-600 transition-colors"
                    title="الأسبوع الحالي"
                  >
                    🏠 الحالي
                  </button>
                  <button
                    onClick={goToNextWeek}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-cairo hover:bg-blue-600 transition-colors"
                    title="الأسبوع التالي"
                  >
                    التالي ➡️
                  </button>
                </div>
                
                {/* اختيار تاريخ محدد */}
                <div className="flex items-center gap-2">
                  <label className="font-cairo text-gray-700 whitespace-nowrap">اختر تاريخ:</label>
                  <input
                    type="date"
                    value={selectedWeekStart.toISOString().split('T')[0]}
                    onChange={(e) => selectSpecificDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg font-cairo"
                  />
                </div>
                
                {/* أزرار إدارة الحجوزات */}
                <div className="flex gap-2">
                  <button
                    onClick={openManageModal}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-cairo hover:bg-purple-600 transition-colors whitespace-nowrap"
                    title="تعديل أو حذف حجز"
                  >
                    📝 إدارة الحجز
                  </button>
                  <button
                    onClick={openTeacherBookingsModal}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-cairo hover:bg-indigo-600 transition-colors whitespace-nowrap"
                    title="عرض جميع حجوزات المعلم"
                  >
                    📄 حجوزاتي
                  </button>
                </div>
              </div>
              
              {/* عرض نطاق الأسبوع */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-cairo font-semibold text-center">
                  📊 الأسبوع المعروض: {formatWeekRange()}
                </p>
              </div>
            </div>
            
            {/* اختيار القاعة */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 font-cairo mb-4">🏫 اختر القاعة:</h2>
              <select 
                value={selectedRoom} 
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg font-cairo text-lg"
              >
                {classrooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* الجدول الأسبوعي */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {!isClient && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-cairo">جاري تحميل الجدول...</p>
              </div>
            )}
            {isClient ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 font-cairo mb-2">
                    📋 جدول {selectedRoom}
                  </h2>
                  <p className="text-gray-600 font-cairo">
                    📅 للأسبوع: {formatWeekRange()}
                  </p>
                </div>
            
            {/* مفتاح الألوان ومعلومات النظام */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* مفتاح الألوان */}
                <div>
                  <h3 className="font-cairo font-semibold text-gray-700 mb-3">🗝️ مفتاح الألوان:</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm font-cairo">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                      <span>🌟 اليوم الحالي</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                      <span>✅ محجوز</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                      <span>➕ متاح للحجز</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded opacity-60"></div>
                      <span>⏰ تاريخ ماضي</span>
                    </div>
                  </div>
                </div>
                
                {/* معلومات إدارة الحجوزات */}
                <div>
                  <h3 className="font-cairo font-semibold text-gray-700 mb-3">📋 إدارة الحجوزات:</h3>
                  <div className="text-sm font-cairo space-y-2 text-gray-600">
                    <p>• <strong>📱 رقم الهاتف مطلوب</strong> لكل حجز جديد</p>
                    <p>• بعد كل حجز ستحصل على <strong>رقم مرجعي</strong></p>
                    <p>• زر <strong>"إدارة الحجز"</strong>: تعديل/حذف بالرقم المرجعي</p>
                    <p>• زر <strong>"حجوزاتي"</strong>: عرض جميع حجوزاتك برقم الهاتف</p>
                    <p>• الرقم المرجعي: <code className="bg-gray-200 px-1 rounded">ZW-XXXXXX</code></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-blue-500 p-3 font-cairo text-lg">الفترة/اليوم</th>
                    {weekDays.map(day => (
                      <th key={day.name} className="border border-blue-500 p-3 font-cairo text-lg">
                        <div className="font-bold">{day.name}</div>
                        <div className="text-sm opacity-90 mt-1">
                          {isClient ? (
                            `${day.fullDate.getDate()}/${day.fullDate.getMonth() + 1}`
                          ) : (
                            '--/--'
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-cairo font-semibold bg-gray-100 text-center">
                        {period}
                      </td>
                      {weekDays.map(day => {
                        const booking = getBookingDetails(day.name, period)
                        const today = new Date()
                        const dayDate = day.fullDate
                        const isPastDate = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        const isToday = dayDate.toDateString() === today.toDateString()
                        
                        return (
                          <td 
                            key={`${day.name}-${period}`} 
                            className={`border border-gray-300 p-2 text-center transition-colors ${
                              isPastDate 
                                ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                                : booking 
                                  ? 'bg-green-100 hover:bg-green-200 cursor-pointer' 
                                  : isToday
                                    ? 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer border-yellow-300'
                                    : 'hover:bg-blue-50 cursor-pointer'
                            }`}
                            onClick={() => !isPastDate && openBookingModal(day.name, period)}
                            title={isPastDate ? 'لا يمكن الحجز في التواريخ الماضية' : ''}
                          >
                            {isPastDate ? (
                              <div className="text-gray-400 font-cairo text-xs">
                                <div>⏰ تاريخ ماضي</div>
                                <div>غير متاح</div>
                              </div>
                            ) : booking ? (
                              <div className="text-xs font-cairo">
                                <div className="font-semibold text-green-800">
                                  👨‍🏫 {booking.teacher}
                                </div>
                                <div className="text-green-600">
                                  📚 {booking.grade} - {booking.section}
                                </div>
                                <div className="text-green-600">
                                  📖 {booking.subject}
                                </div>
                              </div>
                            ) : (
                              <div className={`font-cairo text-sm ${isToday ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
                                {isToday ? (
                                  <div>
                                    <div>🌟 اليوم</div>
                                    <div>انقر للحجز</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div>➕ انقر للحجز</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-cairo font-semibold text-gray-700 mb-2">جاري تحميل الجدول</h3>
                <p className="text-gray-500 font-cairo">يرجى الانتظار...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* نافذة عرض رقم التأكيد */}
      {confirmationNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-800 font-cairo mb-4">
                تم تأكيد الحجز بنجاح!
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <p className="text-green-800 font-cairo font-semibold mb-2">
                  🏷️ رقمك المرجعي:
                </p>
                <div className="text-3xl font-bold text-green-600 font-mono bg-white p-3 rounded border-2 border-green-300">
                  {confirmationNumber}
                </div>
                <p className="text-green-700 font-cairo text-sm mt-3">
                  احتفظ بهذا الرقم للتعديل أو الحذف لاحقاً
                </p>
              </div>
              <button
                onClick={() => setConfirmationNumber('')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-cairo hover:bg-green-700 transition-colors"
              >
                ✅ حفظت الرقم
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* نافذة عرض حجوزات المعلم */}
      {showTeacherBookings && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-indigo-800 font-cairo mb-2">
                📄 حجوزات المعلم
              </h3>
              <p className="text-gray-600 font-cairo">
                أدخل رقم هاتفك لعرض جميع حجوزاتك
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-gray-700 font-cairo font-semibold mb-2">
                    📱 رقم الهاتف:
                  </label>
                  <input
                    type="tel"
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg font-cairo text-center text-lg"
                    placeholder="05xxxxxxxx"
                    maxLength={10}
                  />
                </div>
                <button
                  onClick={searchTeacherBookings}
                  disabled={!teacherPhone || teacherPhone.length < 10}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-cairo hover:bg-blue-700 disabled:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  🔍 بحث
                </button>
              </div>
            </div>
            
            {teacherBookingsList.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-blue-800 font-cairo mb-4 text-lg">
                  📋 حجوزاتك ({teacherBookingsList.length} حجز):
                </h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {teacherBookingsList.map((item, index) => (
                    <div key={item.key} className="bg-white border border-blue-300 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm font-cairo">
                        <div className="space-y-1">
                          <p><strong>🏷️ الرقم المرجعي:</strong></p>
                          <div className="font-mono bg-gray-100 p-2 rounded text-center font-bold">
                            {item.booking.referenceNumber}
                          </div>
                        </div>
                        <div className="space-y-1 text-blue-700">
                          <p><strong>🏫 القاعة:</strong> {item.booking.room}</p>
                          <p><strong>📅 اليوم:</strong> {item.booking.day}</p>
                          <p><strong>⏰ الفترة:</strong> {item.booking.period}</p>
                        </div>
                        <div className="space-y-1 text-blue-700">
                          <p><strong>📚 المادة:</strong> {item.booking.subject}</p>
                          <p><strong>🎯 الصف:</strong> {item.booking.grade} - {item.booking.section}</p>
                          {item.booking.notes && (
                            <p><strong>📝 ملاحظات:</strong> {item.booking.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => deleteTeacherBooking(item.key)}
                          className="px-3 py-1 bg-red-500 text-white rounded font-cairo hover:bg-red-600 transition-colors text-sm"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={closeTeacherBookingsModal}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-cairo hover:bg-gray-600 transition-colors"
              >
                ✖️ إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* نافذة إدارة الحجز */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-purple-800 font-cairo mb-2">
                📝 إدارة الحجز
              </h3>
              <p className="text-gray-600 font-cairo">
                أدخل الرقم المرجعي للحجز
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-cairo font-semibold mb-2">
                  🏷️ الرقم المرجعي:
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  className="w-full p-3 border border-gray-300 rounded-lg font-mono text-center text-lg"
                  placeholder="ZW-XXXXXX"
                  maxLength={9}
                />
              </div>
              
              <button
                onClick={searchBooking}
                disabled={!referenceNumber || referenceNumber.length < 9}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-cairo hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                🔍 بحث عن الحجز
              </button>
              
              {editingBooking && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-800 font-cairo mb-3">تفاصيل الحجز:</h4>
                  <div className="text-sm font-cairo space-y-1 text-blue-700">
                    <p><strong>👨‍🏫 المعلم:</strong> {editingBooking.booking.teacher}</p>
                    <p><strong>🏫 القاعة:</strong> {editingBooking.booking.room}</p>
                    <p><strong>📅 اليوم:</strong> {editingBooking.booking.day}</p>
                    <p><strong>⏰ الفترة:</strong> {editingBooking.booking.period}</p>
                    <p><strong>📚 المادة:</strong> {editingBooking.booking.subject}</p>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={editBooking}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-cairo hover:bg-orange-600 transition-colors"
                    >
                      📝 تعديل
                    </button>
                    <button
                      onClick={deleteBooking}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-cairo hover:bg-red-600 transition-colors"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                onClick={closeManageModal}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg font-cairo hover:bg-gray-600 transition-colors"
              >
                ✖️ إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* النافذة المنبثقة للحجز */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-blue-800 font-cairo mb-2">
                📅 حجز جديد
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-cairo font-semibold text-lg">
                  🏫 {selectedRoom}
                </p>
                <p className="text-blue-600 font-cairo mt-1">
                  📅 {selectedSlot.day} - ⏰ {selectedSlot.period}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* اسم المعلم */}
              <div>
                <label className="block text-gray-700 font-cairo font-semibold mb-2">
                  اسم المعلم:
                </label>
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                  placeholder="أدخل اسم المعلم"
                />
              </div>
              
              {/* رقم هاتف المعلم */}
              <div>
                <label className="block text-gray-700 font-cairo font-semibold mb-2">
                  📱 رقم الهاتف:
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                  placeholder="مثال: 05xxxxxxxx"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 font-cairo mt-1">
                  سيتم استخدام هذا الرقم لعرض جميع حجوزاتك
                </p>
              </div>

              {/* الصف */}
              <div>
                <label className="block text-gray-700 font-cairo font-semibold mb-2">
                  الصف:
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => {
                    const newGrade = e.target.value as keyof typeof subjectsByGrade
                    setFormData({
                      ...formData, 
                      grade: newGrade, 
                      section: sectionsByGrade[newGrade][0]
                    })
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                >
                  {Object.keys(subjectsByGrade).map(grade => (
                    <option key={grade} value={grade}>الصف {grade}</option>
                  ))}
                </select>
              </div>

              {/* الشعبة */}
              <div>
                <label className="block text-gray-700 font-cairo font-semibold mb-2">
                  الشعبة:
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                >
                  {sectionsByGrade[formData.grade].map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>

              {/* المادة */}
              <div>
                <label className="block text-gray-700 font-cairo font-semibold mb-2">
                  المادة:
                </label>
                
                {formData.grade === '11' ? (
                  <div className="space-y-3">
                    {/* اختيار نوع المادة للصف 11 */}
                    <div>
                      <label className="block text-gray-600 font-cairo mb-2">نوع المادة:</label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="subjectType"
                            value="core"
                            checked={formData.subjectType === 'core'}
                            onChange={(e) => setFormData({...formData, subjectType: e.target.value, subject: '', customSubject: ''})}
                            className="mr-2"
                          />
                          <span className="font-cairo">مادة أساسية</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="subjectType"
                            value="elective"
                            checked={formData.subjectType === 'elective'}
                            onChange={(e) => setFormData({...formData, subjectType: e.target.value, subject: '', customSubject: ''})}
                            className="mr-2"
                          />
                          <span className="font-cairo">مادة اختيارية</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* اختيار المادة حسب النوع */}
                    {formData.subjectType === 'core' ? (
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                      >
                        <option value="">اختر المادة الأساسية</option>
                        {advancedGradeCoreSubjects.map((subject: string) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-3">
                        <select
                          value={formData.subject}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === 'custom') {
                              setFormData({...formData, subject: 'custom', customSubject: ''})
                            } else {
                              setFormData({...formData, subject: value, customSubject: ''})
                            }
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                        >
                          <option value="">اختر المادة الاختيارية</option>
                          {advancedGradeElectiveSubjects.map((subject: string) => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                          <option value="custom">مادة أخرى - أدخل اسم المادة</option>
                        </select>
                        
                        {formData.subject === 'custom' && (
                          <input
                            type="text"
                            value={formData.customSubject}
                            onChange={(e) => setFormData({...formData, customSubject: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                            placeholder="أدخل اسم المادة الاختيارية"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                  >
                    <option value="">اختر المادة</option>
                    {subjectsByGrade[formData.grade].map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-gray-700 font-cairo font-semibold mb-2">
                  ملاحظات (اختياري):
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg font-cairo"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-cairo font-semibold hover:bg-gray-600 transition-colors duration-200 text-lg"
              >
                ❌ إلغاء
              </button>
              <button
                onClick={editingBooking ? saveEdit : saveBooking}
                disabled={
                  !formData.teacher || 
                  !formData.phone ||
                  !formData.subject || 
                  ((formData.grade === '11' || formData.grade === '12') && formData.subject === 'custom' && !formData.customSubject)
                }
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-cairo font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
              >
                {editingBooking ? '📝 حفظ التعديل' : '✅ تأكيد الحجز'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}