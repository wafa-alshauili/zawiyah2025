import { useState, useEffect } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import LiveClock from '../components/LiveClock'
import FirebaseDashboard from '../components/FirebaseDashboard'
import { useZawiyahApp } from '../hooks/useFirebase'
import socketService from '../services/socket'
import { 
  FaCalendarCheck, 
  FaDoorOpen, 
  FaUsers, 
  FaFlag,
  FaArrowRight,
  FaClock,
  FaPhoneAlt,
  FaBook,
  FaFireAlt
} from 'react-icons/fa'
import Link from 'next/link'

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)
  const [useFirebase, setUseFirebase] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayBookings: 0,
    availableRooms: 24,
    activeTeachers: 0,
    activeBookings: 0
  })

  // استخدام Firebase Hook
  const {
    appReady,
    initError,
    bookingsToday,
    stats: firebaseStats,
    connection
  } = useZawiyahApp()

  useEffect(() => {
    setIsClient(true)
    
    // فحص إعدادات المستخدم - Firebase افتراضي في الإنتاج
    const isDevelopment = process.env.NODE_ENV === 'development'
    const storedPreference = localStorage.getItem('useFirebase')
    
    let firebaseEnabled
    if (storedPreference !== null) {
      // إذا كان هناك تفضيل محفوظ، استخدمه
      firebaseEnabled = storedPreference === 'true'
    } else {
      // الافتراضي: Firebase في الإنتاج، التقليدي في التطوير
      firebaseEnabled = !isDevelopment
      localStorage.setItem('useFirebase', firebaseEnabled.toString())
    }
    
    setUseFirebase(firebaseEnabled)
    
    if (firebaseEnabled) {
      // استخدام Firebase
      console.log('🔥 استخدام نظام Firebase')
    } else {
      // استخدام النظام التقليدي
      console.log('📡 استخدام النظام التقليدي')
      initTraditionalSystem()
    }
  }, [])

  // تهيئة النظام التقليدي
  const initTraditionalSystem = () => {
    socketService.connect()
    
    socketService.on('bookings-updated', (data) => {
      const bookings = Object.values(data.bookings || {})
      const today = new Date().toISOString().split('T')[0]
      const todayBookings = bookings.filter((b: any) => 
        b.date === today || b.createdAt?.startsWith(today)
      )
      
      setStats(prev => ({
        ...prev,
        todayBookings: todayBookings.length,
        activeBookings: bookings.filter((b: any) => b.status !== 'cancelled').length,
        activeTeachers: new Set(bookings.map((b: any) => b.teacher || b.teacher_name)).size
      }))
      setLoading(false)
    })
    
    // تحميل البيانات المحلية
    loadLocalStats()
  }

  const loadLocalStats = () => {
    try {
      const storedBookings = localStorage.getItem('zawiyah-bookings')
      if (storedBookings) {
        const bookings = Object.values(JSON.parse(storedBookings))
        const today = new Date().toISOString().split('T')[0]
        const todayBookings = bookings.filter((b: any) => 
          b.date === today || b.createdAt?.startsWith(today)
        )
        
        setStats(prev => ({
          ...prev,
          todayBookings: todayBookings.length,
          activeBookings: bookings.filter((b: any) => b.status !== 'cancelled').length,
          activeTeachers: new Set(bookings.map((b: any) => b.teacher || b.teacher_name)).size
        }))
      }
      setLoading(false)
    } catch (error) {
      console.error('خطأ في تحميل البيانات المحلية:', error)
      setLoading(false)
    }
  }

  // تحديث إحصائيات Firebase
  useEffect(() => {
    if (useFirebase && firebaseStats) {
      setStats({
        todayBookings: firebaseStats.stats.totalBookings || 0,
        availableRooms: 24,
        activeTeachers: firebaseStats.stats.teachersCount || 0,
        activeBookings: firebaseStats.stats.activeBookings || 0
      })
      setLoading(false)
    }
  }, [useFirebase, firebaseStats])

  const toggleFirebase = () => {
    const newValue = !useFirebase
    setUseFirebase(newValue)
    localStorage.setItem('useFirebase', newValue.toString())
    window.location.reload()
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

  // إذا كان Firebase مفعل ولكن هناك خطأ
  if (useFirebase && initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-red-800 mb-4">
                  خطأ في تهيئة Firebase
                </h1>
                <p className="text-red-700 mb-6">{initError}</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      localStorage.removeItem('useFirebase')
                      window.location.reload()
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    العودة للنظام التقليدي
                  </button>
                  
                  <div>
                    <a 
                      href="/FIREBASE_SETUP_GUIDE.md" 
                      className="text-red-600 hover:text-red-700 underline"
                      target="_blank"
                    >
                      مراجعة دليل إعداد Firebase
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    )
  }

  const today = new Date()
  const todayDateString = today.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            مرحباً بك في زاوية 2025
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            نظام حجز القاعات المدرسية الذكي
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            <LiveClock />
            <div className="text-lg text-gray-700 font-medium">
              {todayDateString}
            </div>
          </div>
          
          {/* مفتاح تبديل النظام */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">النظام التقليدي</span>
                <button
                  onClick={toggleFirebase}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useFirebase ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useFirebase ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <FaFireAlt className="text-orange-500" />
                  Firebase المطور
                </span>
              </div>
              
              {/* زر إعداد Firebase السريع */}
              {useFirebase && !appReady && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        console.log('🔥 إعداد Firebase السريع...');
                        
                        // تهيئة البيانات الأساسية
                        const { initializeApp } = await import('firebase/app');
                        const { getFirestore, collection, doc, setDoc } = await import('firebase/firestore');
                        
                        const firebaseConfig = {
                          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
                        };
                        
                        const app = initializeApp(firebaseConfig, 'setup-app');
                        const db = getFirestore(app);
                        
                        // بيانات أساسية
                        const basicClassrooms = [
                          { name_ar: 'القاعة الذكية', type: 'special', capacity: 30, grade: 0, section: '', isActive: true },
                          { name_ar: 'الصف الخامس - أ', type: 'classroom', capacity: 25, grade: 5, section: 'أ', isActive: true },
                          { name_ar: 'الصف السادس - أ', type: 'classroom', capacity: 25, grade: 6, section: 'أ', isActive: true }
                        ];
                        
                        const basicTimeSlots = [
                          { name_ar: 'الحصة الأولى', start_time: '07:00', end_time: '07:45', type: 'academic', order: 1 },
                          { name_ar: 'الحصة الثانية', start_time: '07:45', end_time: '08:30', type: 'academic', order: 2 },
                          { name_ar: 'وقت الطابور', start_time: '08:30', end_time: '08:45', type: 'assembly', order: 3 }
                        ];
                        
                        // رفع البيانات
                        for (let i = 0; i < basicClassrooms.length; i++) {
                          await setDoc(doc(db, 'classrooms', `classroom-${i+1}`), {
                            ...basicClassrooms[i],
                            id: `classroom-${i+1}`
                          });
                        }
                        
                        for (let i = 0; i < basicTimeSlots.length; i++) {
                          await setDoc(doc(db, 'timeslots', `timeslot-${i+1}`), {
                            ...basicTimeSlots[i],
                            id: `timeslot-${i+1}`
                          });
                        }
                        
                        console.log('✅ تم إعداد البيانات الأساسية');
                        setTimeout(() => window.location.reload(), 1000);
                        
                      } catch (error) {
                        console.error('❌ خطأ في الإعداد السريع:', error);
                        alert('حدث خطأ في الإعداد. يرجى المحاولة مرة أخرى.');
                      }
                    }}
                    className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  >
                    🔥 إعداد Firebase السريع
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* مؤشر نوع النظام */}
          <div className="flex justify-center">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              useFirebase 
                ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {useFirebase ? '🔥 نظام Firebase المطور' : '📡 النظام التقليدي'}
              {useFirebase && connection?.isOnline && (
                <span className="ml-2">• متصل</span>
              )}
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        {useFirebase && appReady ? (
          // Firebase Dashboard
          <FirebaseDashboard />
        ) : useFirebase && !appReady ? (
          // Loading Firebase
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600 mb-2">جاري تحميل Firebase...</p>
            <p className="text-sm text-gray-500">قد يستغرق هذا بضع ثوان</p>
          </div>
        ) : (
          // Traditional Dashboard
          <div className="space-y-8">
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">حجوزات اليوم</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {loading ? '...' : stats.todayBookings}
                    </p>
                  </div>
                  <FaCalendarCheck className="text-3xl text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">القاعات المتاحة</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {stats.availableRooms}
                    </p>
                  </div>
                  <FaDoorOpen className="text-3xl text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">المعلمين النشطين</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {loading ? '...' : stats.activeTeachers}
                    </p>
                  </div>
                  <FaUsers className="text-3xl text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">الحجوزات النشطة</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {loading ? '...' : stats.activeBookings}
                    </p>
                  </div>
                  <FaFlag className="text-3xl text-orange-500" />
                </div>
              </div>
            </div>

            {/* روابط سريعة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/bookings" className="group">
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border hover:border-blue-300">
                  <div className="text-center">
                    <FaCalendarCheck className="text-5xl text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">إدارة الحجوزات</h3>
                    <p className="text-gray-600 mb-4">حجز القاعات وإدارة المواعيد</p>
                    <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700">
                      <span className="ml-2">ابدأ الآن</span>
                      <FaArrowRight />
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/rooms" className="group">
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border hover:border-green-300">
                  <div className="text-center">
                    <FaDoorOpen className="text-5xl text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">القاعات المتاحة</h3>
                    <p className="text-gray-600 mb-4">عرض وإدارة القاعات المدرسية</p>
                    <div className="flex items-center justify-center text-green-600 group-hover:text-green-700">
                      <span className="ml-2">استعراض</span>
                      <FaArrowRight />
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/statistics" className="group">
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border hover:border-purple-300">
                  <div className="text-center">
                    <FaUsers className="text-5xl text-purple-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">الإحصائيات</h3>
                    <p className="text-gray-600 mb-4">تقارير وإحصائيات مفصلة</p>
                    <div className="flex items-center justify-center text-purple-600 group-hover:text-purple-700">
                      <span className="ml-2">عرض التقارير</span>
                      <FaArrowRight />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* معلومات إضافية */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              نظام إدارة القاعات الذكي
            </h2>
            <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
              نظام زاوية 2025 يوفر حلولاً متكاملة لإدارة حجوزات القاعات المدرسية بكفاءة عالية، 
              مع إمكانيات التزامن الفوري وإدارة شاملة للبيانات.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <FaClock className="text-3xl text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">تزامن فوري</h4>
                <p className="text-sm text-gray-600">تحديثات لحظية عبر جميع الأجهزة</p>
              </div>
              
              <div className="text-center">
                <FaPhoneAlt className="text-3xl text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">سهولة الاستخدام</h4>
                <p className="text-sm text-gray-600">واجهة بسيطة ومناسبة للجميع</p>
              </div>
              
              <div className="text-center">
                <FaBook className="text-3xl text-purple-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">إدارة شاملة</h4>
                <p className="text-sm text-gray-600">تتبع كامل للحجوزات والإحصائيات</p>
              </div>
              
              <div className="text-center">
                <FaFireAlt className="text-3xl text-orange-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">موثوقية عالية</h4>
                <p className="text-sm text-gray-600">نسخ احتياطية وحماية البيانات</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}