import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import { useBookings, useFirebaseConnection } from '../hooks/useFirebase'
import socketService from '../services/socket'

export default function BookingsPage() {
  const [isClient, setIsClient] = useState(false)
  const [useFirebase, setUseFirebase] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState('القاعة الذكية')
  const [showModal, setShowModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState({ day: '', period: '' })
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date())

  // Firebase hooks
  const { bookings: firebaseBookings, loading: firebaseLoading, createBooking } = useBookings()
  const { isOnline } = useFirebaseConnection()

  // Traditional system state
  const [traditionalBookings, setTraditionalBookings] = useState<Record<string, any>>({})
  const [traditionalLoading, setTraditionalLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    
    const firebaseEnabled = localStorage.getItem('useFirebase') === 'true'
    setUseFirebase(firebaseEnabled)

    if (firebaseEnabled) {
      console.log('🔥 استخدام Firebase في صفحة الحجوزات')
    } else {
      console.log('📡 استخدام النظام التقليدي في صفحة الحجوزات')
      initTraditionalSystem()
    }
  }, [])

  const initTraditionalSystem = () => {
    socketService.connect()
    
    socketService.on('bookings-updated', (data) => {
      setTraditionalBookings(data.bookings || {})
      setTraditionalLoading(false)
    })

    // تحميل البيانات المحلية
    try {
      const stored = localStorage.getItem('zawiyah-bookings')
      if (stored) {
        setTraditionalBookings(JSON.parse(stored))
      }
      setTraditionalLoading(false)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      setTraditionalLoading(false)
    }
  }

  const getBookingsForDisplay = () => {
    return useFirebase ? firebaseBookings : Object.values(traditionalBookings)
  }

  const getLoadingState = () => {
    return useFirebase ? firebaseLoading : traditionalLoading
  }

  const handleCreateBooking = async (bookingData: any) => {
    try {
      if (useFirebase) {
        await createBooking(bookingData)
        alert('تم إنشاء الحجز بنجاح!')
      } else {
        // النظام التقليدي
        socketService.createBooking(bookingData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('خطأ في إنشاء الحجز:', error)
      alert('حدث خطأ في إنشاء الحجز')
    }
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const rooms = [
    'القاعة الذكية',
    'ساحة الطابور القديم',
    ...Array.from({ length: 18 }, (_, i) => {
      const grade = Math.floor(i / 3) + 5
      const section = (i % 3) + 1
      return `الصف ${grade} - شعبة ${section}`
    })
  ]

  const periods = [
    'الحصة الأولى', 'الحصة الثانية', 'الحصة الثالثة', 'الحصة الرابعة',
    'الحصة الخامسة', 'الحصة السادسة', 'الحصة السابعة', 'الحصة الثامنة',
    'الطابور', 'النشاط'
  ]

  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">إدارة الحجوزات</h1>
              <p className="text-gray-600">حجز وإدارة القاعات المدرسية</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* مؤشر النظام المستخدم */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                useFirebase 
                  ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {useFirebase ? '🔥 Firebase' : '📡 تقليدي'}
                {useFirebase && isOnline && <span className="ml-1">• متصل</span>}
              </div>
              
              {/* مؤشر التحميل */}
              {getLoadingState() && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">جاري التحديث...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* اختيار القاعة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">اختيار القاعة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {rooms.map((room) => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  selectedRoom === room
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {room}
              </button>
            ))}
          </div>
        </div>

        {/* جدول الحجوزات */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">جدول الحجوزات - {selectedRoom}</h2>
            <div className="text-sm text-gray-600">
              عدد الحجوزات: {getBookingsForDisplay().length}
            </div>
          </div>
          
          {/* الجدول */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-right">الفترة</th>
                  {arabicDays.map(day => (
                    <th key={day} className="border border-gray-200 p-3 text-center min-w-32">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period, periodIndex) => (
                  <tr key={period}>
                    <td className="border border-gray-200 p-3 font-medium bg-gray-50">
                      {period}
                    </td>
                    {arabicDays.map((day, dayIndex) => {
                      const bookingKey = `${selectedRoom}-${day}-${period}`
                      const hasBooking = getBookingsForDisplay().some((booking: any) => 
                        booking.room === selectedRoom && 
                        booking.day === day && 
                        booking.period === period
                      )
                      
                      return (
                        <td key={`${day}-${period}`} className="border border-gray-200 p-1">
                          {hasBooking ? (
                            <div className="bg-red-100 text-red-800 p-2 rounded text-center text-xs">
                              محجوز
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedSlot({ day, period })
                                setShowModal(true)
                              }}
                              className="w-full p-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                            >
                              متاح
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* نافذة إنشاء حجز */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4">إنشاء حجز جديد</h3>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const bookingData = {
                  room: selectedRoom,
                  day: selectedSlot.day,
                  period: selectedSlot.period,
                  teacher: formData.get('teacher'),
                  phone: formData.get('phone'),
                  subject: formData.get('subject'),
                  notes: formData.get('notes')
                }
                handleCreateBooking(bookingData)
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">القاعة</label>
                    <input 
                      type="text" 
                      value={selectedRoom} 
                      disabled 
                      className="w-full p-2 border border-gray-300 rounded bg-gray-50" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">اليوم</label>
                      <input 
                        type="text" 
                        value={selectedSlot.day} 
                        disabled 
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الفترة</label>
                      <input 
                        type="text" 
                        value={selectedSlot.period} 
                        disabled 
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">اسم المعلم *</label>
                    <input 
                      name="teacher"
                      type="text" 
                      required 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                      placeholder="أدخل اسم المعلم"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
                    <input 
                      name="phone"
                      type="tel" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                      placeholder="رقم الهاتف (اختياري)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">المادة *</label>
                    <input 
                      name="subject"
                      type="text" 
                      required 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                      placeholder="أدخل اسم المادة"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">ملاحظات</label>
                    <textarea 
                      name="notes"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                      rows={3}
                      placeholder="ملاحظات إضافية (اختياري)"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    إنشاء الحجز
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}