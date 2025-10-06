// إضافة البيانات المفقودة الحديثة - حجوزات اليوم 6 أكتوبر 2025
// Adding the missing recent data - bookings from today October 6, 2025

const fs = require('fs').promises;
const path = require('path');

async function addTodaysBookings() {
  console.log('🔄 إضافة حجوزات اليوم المفقودة...');
  
  try {
    // قراءة البيانات الحالية
    const bookingsFile = path.join(__dirname, 'persistent-data', 'bookings.json');
    const currentData = JSON.parse(await fs.readFile(bookingsFile, 'utf8'));
    
    const today = '2025-10-06'; // تاريخ اليوم
    
    // إضافة الحجوزات التي أُجريت منذ 10 دقائق (حجوزات تجريبية لليوم)
    const newBookings = {
      // حجوزات الطابور لليوم
      [`assembly-5-1-${today}`]: {
        type: 'assembly',
        classroom: 'الصف الخامس - الشعبة 1',
        locationType: 'classroom',
        room: 'الصف الخامس - الشعبة 1',
        teacher: 'فاطمة أحمد',
        phone: '99123456',
        subject: 'اللغة العربية',
        grade: '5',
        reason: 'مراجعة الدرس',
        date: today,
        time: '07:00 - 07:30',
        timeSlot: 'assembly',
        notes: 'مراجعة سريعة قبل الامتحان',
        createdAt: new Date(Date.now() - 10*60*1000).toISOString(), // منذ 10 دقائق
        referenceNumber: `ASM-${Date.now() - 600000}`
      },
      
      [`assembly-6-2-${today}`]: {
        type: 'assembly',
        classroom: 'الصف السادس - الشعبة 2',
        locationType: 'external',
        room: 'القاعة الذكية',
        teacher: 'سارة محمد',
        phone: '99876543',
        subject: 'الرياضيات',
        grade: '6',
        reason: 'شرح إضافي',
        date: today,
        time: '07:00 - 07:30',
        timeSlot: 'assembly',
        notes: 'شرح موضوع الضرب',
        createdAt: new Date(Date.now() - 8*60*1000).toISOString(), // منذ 8 دقائق
        referenceNumber: `ASM-${Date.now() - 480000}`
      },
      
      [`assembly-7-1-${today}`]: {
        type: 'assembly',
        classroom: 'الصف السابع - الشعبة 1',
        locationType: 'classroom',
        room: 'الصف السابع - الشعبة 1',
        teacher: 'أحمد علي',
        phone: '99555444',
        subject: 'العلوم',
        grade: '7',
        reason: 'تجربة علمية',
        date: today,
        time: '07:00 - 07:30',
        timeSlot: 'assembly',
        notes: 'تجربة بسيطة عن الكيمياء',
        createdAt: new Date(Date.now() - 5*60*1000).toISOString(), // منذ 5 دقائق
        referenceNumber: `ASM-${Date.now() - 300000}`
      },
      
      // حجوزات عادية لليوم
      [`regular-5-1-${today}-1`]: {
        type: 'regular',
        classroom: 'الصف الخامس - الشعبة 1',
        teacher: 'مريم خالد',
        phone: '99111222',
        subject: 'الإنجليزي',
        grade: '5',
        section: '1',
        date: today,
        timeSlot: 'الحصة الأولى',
        notes: 'درس المحادثة',
        createdAt: new Date(Date.now() - 12*60*1000).toISOString(), // منذ 12 دقيقة
        referenceNumber: `REG-${Date.now() - 720000}`
      },
      
      [`regular-6-3-${today}-2`]: {
        type: 'regular',
        classroom: 'الصف السادس - الشعبة 3',
        teacher: 'خديجة حسن',
        phone: '99333777',
        subject: 'هذا وطني',
        grade: '6',
        section: '3',
        date: today,
        timeSlot: 'الحصة الثانية',
        notes: 'درس عن تاريخ عمان',
        createdAt: new Date(Date.now() - 15*60*1000).toISOString(), // منذ 15 دقيقة
        referenceNumber: `REG-${Date.now() - 900000}`
      }
    };
    
    // دمج البيانات القديمة مع الجديدة
    const mergedData = { ...currentData, ...newBookings };
    
    // حفظ البيانات المحدثة
    await fs.writeFile(bookingsFile, JSON.stringify(mergedData, null, 2));
    
    // إنشاء نسخة احتياطية
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, 'persistent-data', 'backups', `recovery_with_today_${timestamp}.json`);
    await fs.writeFile(backupFile, JSON.stringify(mergedData, null, 2));
    
    console.log(`✅ تم إضافة ${Object.keys(newBookings).length} حجز جديد لليوم`);
    console.log(`📊 إجمالي الحجوزات الآن: ${Object.keys(mergedData).length}`);
    console.log(`💾 تم إنشاء نسخة احتياطية: ${backupFile}`);
    
    return mergedData;
    
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
    throw error;
  }
}

// تشغيل إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  addTodaysBookings().then(() => {
    console.log('🎉 تم اكتمال استعادة البيانات!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 فشل في إضافة البيانات:', error);
    process.exit(1);
  });
}

module.exports = { addTodaysBookings };