// أداة فحص وضمان سلامة البيانات
const firebaseAdminService = require('./services/firebaseAdmin')
const fs = require('fs').promises
const path = require('path')

class DataIntegrityChecker {
  constructor() {
    this.reportPath = path.join(__dirname, 'data-integrity-report.json')
    this.backupPath = path.join(__dirname, 'persistent-data')
  }

  // فحص شامل لسلامة البيانات
  async runCompleteCheck() {
    console.log('🔍 بدء فحص سلامة البيانات الشامل...')
    
    const report = {
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        total_checks: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      recommendations: []
    }

    try {
      // 1. فحص اتصال Firebase
      report.checks.firebase_connection = await this.checkFirebaseConnection()
      
      // 2. فحص تكامل البيانات
      report.checks.data_integrity = await this.checkDataIntegrity()
      
      // 3. فحص النسخ الاحتياطية
      report.checks.backup_status = await this.checkBackupStatus()
      
      // 4. فحص الأداء
      report.checks.performance = await this.checkPerformance()
      
      // 5. فحص الأمان
      report.checks.security = await this.checkSecurity()
      
      // تلخيص النتائج
      this.summarizeReport(report)
      
      // حفظ التقرير
      await this.saveReport(report)
      
      console.log('✅ تم الانتهاء من فحص سلامة البيانات')
      return report
      
    } catch (error) {
      console.error('❌ خطأ في فحص سلامة البيانات:', error)
      report.checks.critical_error = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      }
      return report
    }
  }

  // فحص اتصال Firebase
  async checkFirebaseConnection() {
    console.log('🔍 فحص اتصال Firebase...')
    
    try {
      const startTime = Date.now()
      
      // محاولة قراءة البيانات
      const bookings = await firebaseAdminService.getAllBookings()
      const responseTime = Date.now() - startTime
      
      return {
        status: 'PASSED',
        connection: 'متصل',
        response_time_ms: responseTime,
        bookings_count: bookings.length,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        status: 'FAILED',
        connection: 'منقطع',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // فحص تكامل البيانات
  async checkDataIntegrity() {
    console.log('🔍 فحص تكامل البيانات...')
    
    try {
      const results = {
        status: 'PASSED',
        checks: {},
        issues: []
      }

      // فحص الحجوزات
      const bookings = await firebaseAdminService.getAllBookings()
      results.checks.bookings_total = bookings.length

      // فحص البيانات المفقودة
      const missingFields = bookings.filter(booking => 
        !booking.teacher_name || !booking.subject || !booking.date
      )
      
      if (missingFields.length > 0) {
        results.status = 'WARNING'
        results.issues.push(`${missingFields.length} حجز يحتوي على بيانات مفقودة`)
      }

      // فحص التواريخ الصحيحة
      const invalidDates = bookings.filter(booking => 
        isNaN(new Date(booking.date).getTime())
      )
      
      if (invalidDates.length > 0) {
        results.status = 'FAILED'
        results.issues.push(`${invalidDates.length} حجز يحتوي على تواريخ غير صحيحة`)
      }

      // فحص الحجوزات المتضاربة
      const conflicts = this.findBookingConflicts(bookings)
      if (conflicts.length > 0) {
        results.status = 'WARNING'
        results.issues.push(`${conflicts.length} تضارب في الحجوزات`)
        results.conflicts = conflicts
      }

      results.checks.missing_fields = missingFields.length
      results.checks.invalid_dates = invalidDates.length
      results.checks.conflicts = conflicts.length
      results.timestamp = new Date().toISOString()

      return results
      
    } catch (error) {
      return {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // فحص حالة النسخ الاحتياطية
  async checkBackupStatus() {
    console.log('🔍 فحص حالة النسخ الاحتياطية...')
    
    try {
      const backupDir = path.join(__dirname, 'backups')
      
      let backupFiles = []
      try {
        const files = await fs.readdir(backupDir)
        backupFiles = files.filter(file => file.endsWith('.json'))
      } catch (error) {
        // مجلد النسخ الاحتياطية غير موجود
      }

      const latestBackup = backupFiles.length > 0 ? 
        backupFiles.sort().pop() : null

      let latestBackupAge = null
      if (latestBackup) {
        const backupPath = path.join(backupDir, latestBackup)
        const stats = await fs.stat(backupPath)
        latestBackupAge = Date.now() - stats.mtime.getTime()
      }

      const status = latestBackupAge && latestBackupAge < 24 * 60 * 60 * 1000 ? 
        'PASSED' : 'WARNING'

      return {
        status,
        backup_files_count: backupFiles.length,
        latest_backup: latestBackup,
        latest_backup_age_hours: latestBackupAge ? 
          Math.round(latestBackupAge / (60 * 60 * 1000)) : null,
        recommendation: latestBackupAge > 24 * 60 * 60 * 1000 ? 
          'يُنصح بإنشاء نسخة احتياطية جديدة' : null,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // فحص الأداء
  async checkPerformance() {
    console.log('🔍 فحص الأداء...')
    
    try {
      const tests = []
      
      // اختبار سرعة قراءة البيانات
      const readStart = Date.now()
      await firebaseAdminService.getAllBookings()
      const readTime = Date.now() - readStart
      tests.push({ operation: 'read_all_bookings', time_ms: readTime })
      
      // اختبار سرعة كتابة البيانات (اختبار وهمي)
      const writeStart = Date.now()
      const testBooking = {
        classroom_id: 'test-room',
        teacher_name: 'اختبار',
        subject: 'اختبار',
        date: new Date().toISOString().split('T')[0],
        time_slot: 1,
        notes: 'بيانات اختبار - سيتم حذفها'
      }
      
      try {
        const createdBooking = await firebaseAdminService.createBooking(testBooking)
        const writeTime = Date.now() - writeStart
        tests.push({ operation: 'create_booking', time_ms: writeTime })
        
        // حذف البيانات التجريبية
        await firebaseAdminService.deleteBooking(createdBooking.id)
      } catch (error) {
        tests.push({ operation: 'create_booking', error: error.message })
      }

      const avgResponseTime = tests
        .filter(t => t.time_ms)
        .reduce((sum, t) => sum + t.time_ms, 0) / tests.length

      const status = avgResponseTime < 1000 ? 'PASSED' : 
                     avgResponseTime < 3000 ? 'WARNING' : 'FAILED'

      return {
        status,
        average_response_time_ms: Math.round(avgResponseTime),
        tests,
        recommendation: avgResponseTime > 1000 ? 
          'الاستجابة بطيئة، تحقق من الاتصال بالإنترنت' : null,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // فحص الأمان
  async checkSecurity() {
    console.log('🔍 فحص الأمان...')
    
    const checks = {
      status: 'PASSED',
      issues: [],
      recommendations: []
    }

    // فحص متغيرات البيئة
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    ]

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        checks.status = 'WARNING'
        checks.issues.push(`متغير البيئة مفقود: ${envVar}`)
      }
    })

    // فحص ملف المفاتيح
    const keyFilePath = path.join(__dirname, 'firebase-admin-key.json')
    try {
      await fs.access(keyFilePath)
    } catch (error) {
      checks.status = 'WARNING'
      checks.issues.push('ملف مفاتيح Firebase غير موجود')
      checks.recommendations.push('أضف ملف firebase-admin-key.json')
    }

    checks.timestamp = new Date().toISOString()
    return checks
  }

  // البحث عن تضارب في الحجوزات
  findBookingConflicts(bookings) {
    const conflicts = []
    const bookingMap = new Map()

    bookings
      .filter(b => b.status === 'active')
      .forEach(booking => {
        const key = `${booking.classroom_id}-${booking.date}-${booking.time_slot}`
        
        if (bookingMap.has(key)) {
          conflicts.push({
            classroom: booking.classroom_id,
            date: booking.date,
            time_slot: booking.time_slot,
            bookings: [bookingMap.get(key), booking]
          })
        } else {
          bookingMap.set(key, booking)
        }
      })

    return conflicts
  }

  // تلخيص التقرير
  summarizeReport(report) {
    const checks = Object.values(report.checks)
    
    report.summary.total_checks = checks.length
    report.summary.passed = checks.filter(c => c.status === 'PASSED').length
    report.summary.failed = checks.filter(c => c.status === 'FAILED').length
    report.summary.warnings = checks.filter(c => c.status === 'WARNING').length

    // إضافة توصيات عامة
    if (report.summary.failed > 0) {
      report.recommendations.push('يوجد مشاكل حرجة تحتاج إصلاح فوري')
    }
    
    if (report.summary.warnings > 0) {
      report.recommendations.push('يوجد تحذيرات تحتاج مراجعة')
    }
    
    if (report.summary.passed === report.summary.total_checks) {
      report.recommendations.push('جميع الفحوصات ناجحة - البيانات آمنة')
    }
  }

  // حفظ التقرير
  async saveReport(report) {
    try {
      await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2))
      console.log(`📊 تم حفظ تقرير سلامة البيانات: ${this.reportPath}`)
    } catch (error) {
      console.error('خطأ في حفظ التقرير:', error)
    }
  }

  // طباعة تقرير مختصر
  printSummary(report) {
    console.log('\n═══════════════════════════════════════')
    console.log('📊 تقرير سلامة البيانات - زاوية 2025')
    console.log('═══════════════════════════════════════')
    console.log(`📅 التاريخ: ${new Date(report.timestamp).toLocaleString('ar-SA')}`)
    console.log(`🔍 إجمالي الفحوصات: ${report.summary.total_checks}`)
    console.log(`✅ نجح: ${report.summary.passed}`)
    console.log(`⚠️  تحذيرات: ${report.summary.warnings}`)
    console.log(`❌ فشل: ${report.summary.failed}`)
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 التوصيات:')
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`)
      })
    }
    
    console.log('═══════════════════════════════════════\n')
  }
}

// تشغيل الفحص إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  const checker = new DataIntegrityChecker()
  
  checker.runCompleteCheck()
    .then(report => {
      checker.printSummary(report)
      
      if (report.summary.failed > 0) {
        console.error('❌ يوجد مشاكل حرجة في البيانات!')
        process.exit(1)
      } else {
        console.log('✅ البيانات آمنة وسليمة!')
        process.exit(0)
      }
    })
    .catch(error => {
      console.error('💥 فشل في فحص البيانات:', error)
      process.exit(1)
    })
}

module.exports = DataIntegrityChecker