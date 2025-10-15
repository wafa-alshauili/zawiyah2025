import React from 'react'
import Navigation from '../components/layout/Navigation'
import Footer from '../components/layout/Footer'
import DataPermanenceDemo from '../components/DataPermanenceDemo'

export default function DataPermanencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🛡️ ضمان الحفظ الدائم
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            الحجوزات محفوظة إلى الأبد - لن تختفي أبداً!
          </p>
          
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ❓ السؤال الشائع: "هل ستختفي الحجوزات في اليوم التالي؟"
            </h2>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ❌ لا، أبداً!
            </div>
            <p className="text-gray-700">
              مع نظام Firebase، جميع الحجوزات محفوظة بشكل دائم في السحابة. 
              حتى لو أغلقت المتصفح أو أطفأت الجهاز أو مر شهر كامل، 
              ستجد جميع حجوزاتك موجودة عند إعادة فتح التطبيق.
            </p>
          </div>
        </div>

        {/* المكون التفاعلي */}
        <DataPermanenceDemo />

        {/* أمثلة عملية */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            🌟 أمثلة من الواقع
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* المثال الأول */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-4xl mb-4 text-center">👩‍🏫</div>
              <h3 className="text-lg font-bold text-blue-800 mb-3">المعلمة سارة</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>الإثنين:</strong> حجزت 5 قاعات للأسبوع</p>
                <p><strong>الثلاثاء:</strong> أغلقت الجهاز لمدة يومين</p>
                <p><strong>الخميس:</strong> فتحت التطبيق مرة أخرى</p>
                <div className="bg-green-100 border border-green-200 rounded p-2 mt-3">
                  <p className="font-semibold text-green-800">
                    ✅ النتيجة: جميع الحجوزات موجودة!
                  </p>
                </div>
              </div>
            </div>

            {/* المثال الثاني */}
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-4xl mb-4 text-center">💻</div>
              <h3 className="text-lg font-bold text-green-800 mb-3">تغيير الجهاز</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>المكتب:</strong> إنشاء حجوزات كثيرة</p>
                <p><strong>البيت:</strong> فتح التطبيق من اللابتوب</p>
                <p><strong>المدرسة:</strong> استخدام جهاز آخر</p>
                <div className="bg-green-100 border border-green-200 rounded p-2 mt-3">
                  <p className="font-semibold text-green-800">
                    ✅ النتيجة: نفس البيانات في كل مكان!
                  </p>
                </div>
              </div>
            </div>

            {/* المثال الثالث */}
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-4xl mb-4 text-center">🔄</div>
              <h3 className="text-lg font-bold text-purple-800 mb-3">بعد شهر كامل</h3>
              <div className="space-y-2 text-sm text-purple-700">
                <p><strong>سبتمبر:</strong> حجوزات كثيرة</p>
                <p><strong>إجازة:</strong> عدم استخدام لأسابيع</p>
                <p><strong>أكتوبر:</strong> العودة للعمل</p>
                <div className="bg-green-100 border border-green-200 rounded p-2 mt-3">
                  <p className="font-semibold text-green-800">
                    ✅ النتيجة: التاريخ كامل محفوظ!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* مقارنة الأنظمة */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            ⚖️ مقارنة مع الأنظمة التقليدية
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-right">الموقف</th>
                  <th className="border border-gray-200 px-4 py-3 text-center">النظام التقليدي</th>
                  <th className="border border-gray-200 px-4 py-3 text-center">زاوية 2025 + Firebase</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">حجز اليوم</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ موجود</span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ موجود</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">بعد إغلاق المتصفح</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">❌ قد يختفي</span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ محفوظ</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">في اليوم التالي</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">❌ غير مضمون</span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ موجود 100%</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">بعد أسبوع</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">❌ مفقود غالباً</span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ موجود</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-3 font-medium">من جهاز آخر</td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">❌ غير متاح</span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ متاح فوراً</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* الضمان النهائي */}
        <div className="mt-12 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-4xl font-bold mb-4">🛡️ ضماننا لك</h2>
          <p className="text-xl mb-6">
            جميع حجوزاتك محفوظة بشكل دائم في السحابة العالمية
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold">تحميل فوري</h3>
              <p className="text-sm opacity-90">البيانات تظهر في أقل من ثانية</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">🌍</div>
              <h3 className="font-bold">وصول عالمي</h3>
              <p className="text-sm opacity-90">من أي مكان في العالم</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-bold">أمان تام</h3>
              <p className="text-sm opacity-90">تشفير وحماية متقدمة</p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-white bg-opacity-10 rounded-lg">
            <p className="text-2xl font-bold">
              "لن تفقد أي حجز أبداً - مضمون 100%!"
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}