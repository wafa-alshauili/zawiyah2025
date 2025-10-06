import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import socketService from '../services/socket'

export default function AssemblyPage() {
  const [bookings, setBookings] = useState<Record<string, any>>({})
  const [isClient, setIsClient] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [notes, setNotes] = useState('')
  const [currentDate, setCurrentDate] = useState('')

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
    
    setSelectedClass(classId)
    setShowModal(true)
    setTeacherName('')
    setNotes('')
  }

  // حفظ الحجز
  const saveBooking = async () => {
    if (!teacherName.trim()) {
      alert('يرجى إدخال اسم المعلم')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const key = `assembly-${selectedClass}-${today}`
    const selectedClassData = classesData.find(c => c.id === selectedClass)
    
    const booking = {
      type: 'assembly',
      classroom: selectedClassData?.name || selectedClass,
      teacher: teacherName,
      subject: 'الطابور',
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
          <div className="text-center">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">حجز وقت الطابور</h3>
            
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

      <Footer />
    </div>
  )
}