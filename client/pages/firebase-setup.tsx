import { useState } from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'

export default function FirebaseSetup() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const setupFirebase = async () => {
    if (loading) return
    
    setLoading(true)
    setStatus('جاري تهيئة Firebase...')
    setError('')

    try {
      // استخدام المتصفح console بدلاً من dynamic import
      const setupScript = `
        // تهيئة Firebase والبيانات الأساسية
        (async function() {
          try {
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
            const { getFirestore, collection, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const firebaseConfig = {
              apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
              authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
              projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
              storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
              messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
              appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"
            };
            
            const app = initializeApp(firebaseConfig, 'setup-' + Date.now());
            const db = getFirestore(app);
            
            const classrooms = [
              { name_ar: 'القاعة الذكية', type: 'special', capacity: 30, grade: 0, section: '', isActive: true },
              { name_ar: 'الصف الخامس - شعبة أ', type: 'classroom', capacity: 25, grade: 5, section: 'أ', isActive: true },
              { name_ar: 'الصف الخامس - شعبة ب', type: 'classroom', capacity: 25, grade: 5, section: 'ب', isActive: true },
              { name_ar: 'الصف السادس - شعبة أ', type: 'classroom', capacity: 25, grade: 6, section: 'أ', isActive: true }
            ];
            
            const timeSlots = [
              { name_ar: 'الحصة الأولى', start_time: '07:00', end_time: '07:45', type: 'academic', order: 1 },
              { name_ar: 'الحصة الثانية', start_time: '07:45', end_time: '08:30', type: 'academic', order: 2 },
              { name_ar: 'وقت الطابور', start_time: '08:30', end_time: '08:45', type: 'assembly', order: 3 },
              { name_ar: 'الحصة الثالثة', start_time: '08:45', end_time: '09:30', type: 'academic', order: 4 }
            ];
            
            console.log('📤 بدء رفع البيانات...');
            
            for (let i = 0; i < classrooms.length; i++) {
              await setDoc(doc(db, 'classrooms', 'classroom-' + (i+1)), {
                ...classrooms[i],
                id: 'classroom-' + (i+1),
                created_at: new Date()
              });
              console.log('✅ تم رفع: ' + classrooms[i].name_ar);
            }
            
            for (let i = 0; i < timeSlots.length; i++) {
              await setDoc(doc(db, 'timeslots', 'timeslot-' + (i+1)), {
                ...timeSlots[i],
                id: 'timeslot-' + (i+1),
                created_at: new Date()
              });
              console.log('✅ تم رفع: ' + timeSlots[i].name_ar);
            }
            
            window.parent.postMessage({ type: 'FIREBASE_SETUP_SUCCESS' }, '*');
            
          } catch (error) {
            console.error('❌ خطأ في الإعداد:', error);
            window.parent.postMessage({ type: 'FIREBASE_SETUP_ERROR', error: error.message }, '*');
          }
        })();
      `

      // تشغيل السكريبت
      const script = document.createElement('script')
      script.type = 'module'
      script.textContent = setupScript
      document.head.appendChild(script)

      // الاستماع للنتيجة
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'FIREBASE_SETUP_SUCCESS') {
          setStatus('✅ تم إعداد Firebase بنجاح!')
          localStorage.setItem('useFirebase', 'true')
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        } else if (event.data.type === 'FIREBASE_SETUP_ERROR') {
          setError('❌ خطأ في الإعداد: ' + event.data.error)
          setLoading(false)
        }
      }

      window.addEventListener('message', handleMessage)

      // تنظيف بعد 30 ثانية
      setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        if (loading) {
          setError('انتهت المهلة الزمنية. يرجى المحاولة مرة أخرى.')
          setLoading(false)
        }
      }, 30000)

    } catch (err: any) {
      setError('خطأ في تشغيل الإعداد: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔥</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                إعداد Firebase
              </h1>
              <p className="text-gray-600">
                اضغط على الزر أدناه لتهيئة قاعدة البيانات ورفع البيانات الأساسية
              </p>
            </div>

            {!loading && !status && !error && (
              <div className="text-center">
                <button
                  onClick={setupFirebase}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
                >
                  🚀 بدء الإعداد
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-lg text-gray-700 mb-2">{status}</p>
                <p className="text-sm text-gray-500">
                  قد يستغرق هذا بضع ثوان... يرجى عدم إغلاق الصفحة
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">⚠️</div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">حدث خطأ</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      setError('')
                      setStatus('')
                      setLoading(false)
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              </div>
            )}

            {status && !loading && status.includes('✅') && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">تم بنجاح!</h3>
                  <p className="text-green-700 mb-4">{status}</p>
                  <p className="text-sm text-green-600">
                    جاري إعادة توجيهك إلى الصفحة الرئيسية...
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <a
                  href="/"
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  العودة إلى الصفحة الرئيسية
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}