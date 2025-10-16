// نقل البيانات الأساسية إلى Firestore
// ===============================================
// يجب تشغيل هذا السكريبت من المتصفح console على الموقع المباشر

console.log('🔥 بدء نقل البيانات الأساسية إلى Firestore...');

// بيانات القاعات الأساسية
const classroomsData = [
  // القاعة الذكية
  { id: 'smart-classroom', name_ar: 'القاعة الذكية', type: 'special', capacity: 30, grade: 0, section: '', isActive: true },
  
  // ساحة الطابور
  { id: 'assembly-old', name_ar: 'ساحة الطابور القديم', type: 'assembly', capacity: 200, grade: 0, section: '', isActive: true },
  
  // الصف الخامس - 3 شعب
  { id: 'grade5-1', name_ar: 'الصف الخامس - شعبة أ', type: 'classroom', capacity: 25, grade: 5, section: 'أ', isActive: true },
  { id: 'grade5-2', name_ar: 'الصف الخامس - شعبة ب', type: 'classroom', capacity: 25, grade: 5, section: 'ب', isActive: true },
  { id: 'grade5-3', name_ar: 'الصف الخامس - شعبة ج', type: 'classroom', capacity: 25, grade: 5, section: 'ج', isActive: true },
  
  // الصف السادس - 3 شعب
  { id: 'grade6-1', name_ar: 'الصف السادس - شعبة أ', type: 'classroom', capacity: 25, grade: 6, section: 'أ', isActive: true },
  { id: 'grade6-2', name_ar: 'الصف السادس - شعبة ب', type: 'classroom', capacity: 25, grade: 6, section: 'ب', isActive: true },
  { id: 'grade6-3', name_ar: 'الصف السادس - شعبة ج', type: 'classroom', capacity: 25, grade: 6, section: 'ج', isActive: true },
  
  // الصف السابع - 3 شعب
  { id: 'grade7-1', name_ar: 'الصف السابع - شعبة أ', type: 'classroom', capacity: 25, grade: 7, section: 'أ', isActive: true },
  { id: 'grade7-2', name_ar: 'الصف السابع - شعبة ب', type: 'classroom', capacity: 25, grade: 7, section: 'ب', isActive: true },
  { id: 'grade7-3', name_ar: 'الصف السابع - شعبة ج', type: 'classroom', capacity: 25, grade: 7, section: 'ج', isActive: true },
  
  // الصف الثامن - 3 شعب
  { id: 'grade8-1', name_ar: 'الصف الثامن - شعبة أ', type: 'classroom', capacity: 25, grade: 8, section: 'أ', isActive: true },
  { id: 'grade8-2', name_ar: 'الصف الثامن - شعبة ب', type: 'classroom', capacity: 25, grade: 8, section: 'ب', isActive: true },
  { id: 'grade8-3', name_ar: 'الصف الثامن - شعبة ج', type: 'classroom', capacity: 25, grade: 8, section: 'ج', isActive: true },
  
  // الصف التاسع - 3 شعب
  { id: 'grade9-1', name_ar: 'الصف التاسع - شعبة أ', type: 'classroom', capacity: 25, grade: 9, section: 'أ', isActive: true },
  { id: 'grade9-2', name_ar: 'الصف التاسع - شعبة ب', type: 'classroom', capacity: 25, grade: 9, section: 'ب', isActive: true },
  { id: 'grade9-3', name_ar: 'الصف التاسع - شعبة ج', type: 'classroom', capacity: 25, grade: 9, section: 'ج', isActive: true },
  
  // الصف العاشر - 3 شعب
  { id: 'grade10-1', name_ar: 'الصف العاشر - شعبة أ', type: 'classroom', capacity: 25, grade: 10, section: 'أ', isActive: true },
  { id: 'grade10-2', name_ar: 'الصف العاشر - شعبة ب', type: 'classroom', capacity: 25, grade: 10, section: 'ب', isActive: true },
  { id: 'grade10-3', name_ar: 'الصف العاشر - شعبة ج', type: 'classroom', capacity: 25, grade: 10, section: 'ج', isActive: true },
  
  // الصف الحادي عشر - 6 شعب
  { id: 'grade11-1', name_ar: 'الصف الحادي عشر - شعبة أ', type: 'classroom', capacity: 25, grade: 11, section: 'أ', isActive: true },
  { id: 'grade11-2', name_ar: 'الصف الحادي عشر - شعبة ب', type: 'classroom', capacity: 25, grade: 11, section: 'ب', isActive: true },
  { id: 'grade11-3', name_ar: 'الصف الحادي عشر - شعبة ج', type: 'classroom', capacity: 25, grade: 11, section: 'ج', isActive: true },
  { id: 'grade11-4', name_ar: 'الصف الحادي عشر - شعبة د', type: 'classroom', capacity: 25, grade: 11, section: 'د', isActive: true },
  { id: 'grade11-5', name_ar: 'الصف الحادي عشر - شعبة هـ', type: 'classroom', capacity: 25, grade: 11, section: 'هـ', isActive: true },
  { id: 'grade11-6', name_ar: 'الصف الحادي عشر - شعبة و', type: 'classroom', capacity: 25, grade: 11, section: 'و', isActive: true },
  
  // الصف الثاني عشر - 6 شعب
  { id: 'grade12-1', name_ar: 'الصف الثاني عشر - شعبة أ', type: 'classroom', capacity: 25, grade: 12, section: 'أ', isActive: true },
  { id: 'grade12-2', name_ar: 'الصف الثاني عشر - شعبة ب', type: 'classroom', capacity: 25, grade: 12, section: 'ب', isActive: true },
  { id: 'grade12-3', name_ar: 'الصف الثاني عشر - شعبة ج', type: 'classroom', capacity: 25, grade: 12, section: 'ج', isActive: true },
  { id: 'grade12-4', name_ar: 'الصف الثاني عشر - شعبة د', type: 'classroom', capacity: 25, grade: 12, section: 'د', isActive: true },
  { id: 'grade12-5', name_ar: 'الصف الثاني عشر - شعبة هـ', type: 'classroom', capacity: 25, grade: 12, section: 'هـ', isActive: true },
  { id: 'grade12-6', name_ar: 'الصف الثاني عشر - شعبة و', type: 'classroom', capacity: 25, grade: 12, section: 'و', isActive: true }
];

// بيانات الفترات الزمنية
const timeSlotsData = [
  { id: 'period-1', name_ar: 'الحصة الأولى', start_time: '07:00', end_time: '07:45', type: 'academic', order: 1 },
  { id: 'period-2', name_ar: 'الحصة الثانية', start_time: '07:45', end_time: '08:30', type: 'academic', order: 2 },
  { id: 'assembly', name_ar: 'وقت الطابور', start_time: '08:30', end_time: '08:45', type: 'assembly', order: 3 },
  { id: 'period-3', name_ar: 'الحصة الثالثة', start_time: '08:45', end_time: '09:30', type: 'academic', order: 4 },
  { id: 'period-4', name_ar: 'الحصة الرابعة', start_time: '09:30', end_time: '10:15', type: 'academic', order: 5 },
  { id: 'break-1', name_ar: 'الاستراحة الأولى', start_time: '10:15', end_time: '10:30', type: 'break', order: 6 },
  { id: 'period-5', name_ar: 'الحصة الخامسة', start_time: '10:30', end_time: '11:15', type: 'academic', order: 7 },
  { id: 'period-6', name_ar: 'الحصة السادسة', start_time: '11:15', end_time: '12:00', type: 'academic', order: 8 },
  { id: 'break-2', name_ar: 'الاستراحة الثانية', start_time: '12:00', end_time: '12:15', type: 'break', order: 9 },
  { id: 'period-7', name_ar: 'الحصة السابعة', start_time: '12:15', end_time: '13:00', type: 'academic', order: 10 },
  { id: 'period-8', name_ar: 'الحصة الثامنة', start_time: '13:00', end_time: '13:45', type: 'academic', order: 11 },
  { id: 'activity', name_ar: 'النشاط', start_time: '13:45', end_time: '14:30', type: 'activity', order: 12 }
];

// دالة لرفع البيانات
async function uploadBasicData() {
  try {
    console.log('📤 بدء رفع القاعات...');
    
    // رفع القاعات
    for (const classroom of classroomsData) {
      try {
        await firebaseService.db.collection('classrooms').doc(classroom.id).set(classroom);
        console.log(`✅ تم رفع قاعة: ${classroom.name_ar}`);
      } catch (error) {
        console.error(`❌ خطأ في رفع قاعة ${classroom.name_ar}:`, error);
      }
    }
    
    console.log('📤 بدء رفع الفترات الزمنية...');
    
    // رفع الفترات الزمنية
    for (const timeSlot of timeSlotsData) {
      try {
        await firebaseService.db.collection('timeslots').doc(timeSlot.id).set(timeSlot);
        console.log(`✅ تم رفع فترة: ${timeSlot.name_ar}`);
      } catch (error) {
        console.error(`❌ خطأ في رفع فترة ${timeSlot.name_ar}:`, error);
      }
    }
    
    console.log('🎉 تم رفع جميع البيانات الأساسية بنجاح!');
    console.log(`📊 القاعات: ${classroomsData.length}`);
    console.log(`⏰ الفترات الزمنية: ${timeSlotsData.length}`);
    
    // إعادة تحميل الصفحة لتفعيل Firebase
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ خطأ عام في رفع البيانات:', error);
  }
}

// تشغيل الرفع
uploadBasicData();