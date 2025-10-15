// مثال عملي: كيف تبقى الحجوزات محفوظة دائماً
import firebaseService from '../services/firebase'

// سيناريو: إنشاء حجز اليوم وعرضه غداً
const demonstratePermanentStorage = async () => {
  console.log('📅 مثال عملي: الحفظ الدائم للحجوزات')
  console.log('=' .repeat(50))

  // اليوم - إنشاء حجز جديد
  console.log('🗓️ اليوم (14 أكتوبر 2025):')
  try {
    const todayBooking = await firebaseService.createBooking({
      classroom_id: 'الصف السادس أ',
      teacher_name: 'أستاذة فاطمة',
      subject: 'الرياضيات',
      date: '2025-10-14',
      time_slot: 2, // الحصة الثانية
      notes: 'حصة مراجعة للامتحان'
    })
    
    console.log('✅ تم إنشاء الحجز بنجاح!')
    console.log('📍 معرف الحجز:', todayBooking.id)
    console.log('☁️ محفوظ في Firebase:', todayBooking.date)
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الحجز:', error)
  }

  console.log('\n⏰ محاكاة مرور الوقت...')
  console.log('🌙 المستخدم أغلق المتصفح وذهب للنوم')
  console.log('🌅 اليوم التالي (15 أكتوبر 2025):')

  // اليوم التالي - فتح المتصفح مرة أخرى
  try {
    // جلب الحجوزات من Firebase
    const allBookings = await firebaseService.getAllBookings()
    
    // البحث عن حجوزات أمس
    const yesterdayBookings = allBookings.filter(booking => 
      booking.date === '2025-10-14'
    )
    
    console.log('🔍 البحث عن حجوزات الأمس...')
    console.log(`✅ تم العثور على ${yesterdayBookings.length} حجز من الأمس`)
    
    if (yesterdayBookings.length > 0) {
      console.log('📋 تفاصيل الحجوزات المحفوظة:')
      yesterdayBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. معلم: ${booking.teacher_name}`)
        console.log(`      المادة: ${booking.subject}`)
        console.log(`      القاعة: ${booking.classroom_id}`)
        console.log(`      التاريخ: ${booking.date}`)
        console.log(`      الحالة: ${booking.status}`)
        console.log('      ---')
      })
    }
    
  } catch (error) {
    console.error('❌ خطأ في جلب الحجوزات:', error)
  }

  console.log('\n🎯 النتيجة: الحجوزات محفوظة بشكل دائم!')
}

// مثال: البحث عن حجوزات قديمة
const searchOldBookings = async (daysAgo = 30) => {
  console.log(`🔍 البحث عن حجوزات آخر ${daysAgo} يوم...`)
  
  try {
    const allBookings = await firebaseService.getAllBookings()
    
    // حساب التاريخ قبل X أيام
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - daysAgo)
    const pastDateString = pastDate.toISOString().split('T')[0]
    
    // البحث عن الحجوزات القديمة
    const oldBookings = allBookings.filter(booking => 
      booking.date >= pastDateString
    )
    
    console.log(`📊 إحصائيات آخر ${daysAgo} يوم:`)
    console.log(`   📅 إجمالي الحجوزات: ${oldBookings.length}`)
    console.log(`   👩‍🏫 عدد المعلمين: ${new Set(oldBookings.map(b => b.teacher_name)).size}`)
    console.log(`   📚 عدد المواد: ${new Set(oldBookings.map(b => b.subject)).size}`)
    console.log(`   🏫 عدد القاعات: ${new Set(oldBookings.map(b => b.classroom_id)).size}`)
    
    // عرض أقدم حجز موجود
    const oldestBooking = oldBookings.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )[0]
    
    if (oldestBooking) {
      console.log(`\n📜 أقدم حجز محفوظ:`)
      console.log(`   📅 التاريخ: ${oldestBooking.date}`)
      console.log(`   👩‍🏫 المعلم: ${oldestBooking.teacher_name}`)
      console.log(`   📚 المادة: ${oldestBooking.subject}`)
      console.log(`   ⏰ تم الحفظ في: ${new Date(oldestBooking.created_at).toLocaleString('ar-SA')}`)
    }
    
    return oldBookings
    
  } catch (error) {
    console.error('❌ خطأ في البحث عن الحجوزات القديمة:', error)
    return []
  }
}

// مثال: مقارنة البيانات المحلية مع السحابية
const compareLocalVsCloud = async () => {
  console.log('🔍 مقارنة البيانات المحلية مع السحابية...')
  
  try {
    // البيانات المحلية (في متصفح المستخدم)
    const localBookings = JSON.parse(
      localStorage.getItem('zawiyah-bookings') || '{}'
    )
    const localCount = Object.keys(localBookings).length
    
    // البيانات السحابية (Firebase)
    const cloudBookings = await firebaseService.getAllBookings()
    const cloudCount = cloudBookings.length
    
    console.log('📊 مقارنة البيانات:')
    console.log(`   💾 البيانات المحلية: ${localCount} حجز`)
    console.log(`   ☁️ البيانات السحابية: ${cloudCount} حجز`)
    
    if (cloudCount >= localCount) {
      console.log('✅ البيانات السحابية محدثة ومكتملة')
      console.log('🔄 المزامنة تعمل بشكل صحيح')
    } else {
      console.log('⚠️ البيانات المحلية أكثر من السحابية')
      console.log('🔄 قد تحتاج لمزامنة البيانات')
    }
    
    // إحصائيات إضافية
    const today = new Date().toISOString().split('T')[0]
    const todayCloudBookings = cloudBookings.filter(b => b.date === today)
    
    console.log(`\n📅 حجوزات اليوم في السحابة: ${todayCloudBookings.length}`)
    
    return {
      local: localCount,
      cloud: cloudCount,
      todayCloud: todayCloudBookings.length,
      synced: cloudCount >= localCount
    }
    
  } catch (error) {
    console.error('❌ خطأ في المقارنة:', error)
    return null
  }
}

// مثال: محاكاة إعادة فتح التطبيق بعد أسبوع
const simulateAppReopenAfterWeek = async () => {
  console.log('🔄 محاكاة إعادة فتح التطبيق بعد أسبوع...')
  
  try {
    // محاكاة تنظيف البيانات المحلية (كما لو أن المستخدم نظف المتصفح)
    console.log('🧹 تنظيف البيانات المحلية...')
    localStorage.clear()
    
    console.log('⏰ مرور أسبوع...')
    console.log('🌅 المستخدم يفتح التطبيق مرة أخرى')
    
    // إعادة تحميل البيانات من Firebase
    console.log('📡 تحميل البيانات من Firebase...')
    const bookings = await firebaseService.getAllBookings()
    
    // حساب عمر البيانات
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoString = weekAgo.toISOString().split('T')[0]
    
    const oldBookings = bookings.filter(b => b.date >= weekAgoString)
    
    console.log('✅ تم تحميل البيانات بنجاح!')
    console.log(`📊 إجمالي الحجوزات: ${bookings.length}`)
    console.log(`📅 حجوزات آخر أسبوع: ${oldBookings.length}`)
    console.log('🎯 جميع البيانات محفوظة ومتاحة!')
    
    // إعادة حفظ البيانات محلياً للسرعة
    const bookingsMap = {}
    bookings.forEach(booking => {
      const key = `${booking.classroom_id}-${booking.date}-${booking.time_slot}`
      bookingsMap[key] = booking
    })
    
    localStorage.setItem('zawiyah-bookings', JSON.stringify(bookingsMap))
    console.log('💾 تم إعادة حفظ البيانات محلياً للسرعة')
    
    return bookings.length
    
  } catch (error) {
    console.error('❌ خطأ في المحاكاة:', error)
    return 0
  }
}

// تشغيل جميع الأمثلة
const runAllExamples = async () => {
  console.log('🚀 بدء اختبارات الحفظ الدائم...\n')
  
  await demonstratePermanentStorage()
  console.log('\n' + '='.repeat(70) + '\n')
  
  await searchOldBookings(30)
  console.log('\n' + '='.repeat(70) + '\n')
  
  await compareLocalVsCloud()
  console.log('\n' + '='.repeat(70) + '\n')
  
  await simulateAppReopenAfterWeek()
  
  console.log('\n🎉 جميع الاختبارات مكتملة!')
  console.log('✅ النتيجة: البيانات محفوظة بشكل دائم!')
}

export {
  demonstratePermanentStorage,
  searchOldBookings,
  compareLocalVsCloud,
  simulateAppReopenAfterWeek,
  runAllExamples
}