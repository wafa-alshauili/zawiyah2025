// System Diagnostics Runner - منفذ تشخيص النظام
// يقوم بتشغيل جميع أنظمة المراقبة والتشخيص

const errorMonitor = require('./errorMonitoring');
const healthChecker = require('./healthCheck');

async function runFullDiagnostics() {
  console.log('🚀 بدء التشخيص الشامل لنظام زاوية 2025...\n');
  
  try {
    // 1. فحص صحة النظام الشامل
    console.log('🏥 === فحص صحة النظام ===');
    const healthReport = await healthChecker.performFullHealthCheck();
    
    // 2. إنشاء تقرير الأخطاء
    console.log('\n📊 === تقرير الأخطاء ===');
    const errorReport = await errorMonitor.generateErrorReport(24);
    
    if (errorReport) {
      console.log(`📈 إجمالي الأخطاء (24 ساعة): ${errorReport.summary.totalErrors}`);
      console.log(`⚠️ أخطاء حرجة: ${errorReport.summary.criticalErrors}`);
      console.log(`🔔 تحذيرات: ${errorReport.summary.warnings}`);
      console.log(`🏥 صحة النظام: ${errorReport.analysis.systemHealth.status}`);
    }

    // 3. عرض التوصيات المدمجة
    console.log('\n💡 === التوصيات المدمجة ===');
    const allRecommendations = [
      ...healthReport.recommendations,
      ...(errorReport?.recommendations || [])
    ];
    
    // إزالة التوصيات المكررة
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    uniqueRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // 4. خلاصة النتائج
    console.log('\n📋 === خلاصة التشخيص ===');
    console.log(`🎯 صحة النظام: ${healthReport.overallHealth.status} (${healthReport.overallHealth.score}/5)`);
    console.log(`📊 نسبة المكونات السليمة: ${healthReport.overallHealth.healthPercentage}%`);
    console.log(`⏱️ مدة التشخيص: ${healthReport.checkDuration} ms`);
    
    if (healthReport.overallHealth.issues.length > 0) {
      console.log(`⚠️ المشاكل المكتشفة: ${healthReport.overallHealth.issues.length}`);
      healthReport.overallHealth.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ لا توجد مشاكل واضحة');
    }

    // 5. اختبار تسجيل الأخطاء
    console.log('\n🧪 === اختبار نظام تسجيل الأخطاء ===');
    await errorMonitor.logSystemInfo('INFO', 'تم إجراء تشخيص شامل للنظام', {
      healthScore: healthReport.overallHealth.score,
      totalErrors: errorReport?.summary.totalErrors || 0,
      recommendations: uniqueRecommendations.length
    });
    
    console.log('✅ تم اختبار نظام تسجيل الأخطاء بنجاح');

    // 6. النتيجة النهائية
    console.log('\n🏁 === النتيجة النهائية ===');
    
    if (healthReport.overallHealth.score >= 4 && (errorReport?.summary.criticalErrors || 0) === 0) {
      console.log('🎉 النظام في حالة ممتازة وجاهز للإنتاج!');
      console.log('🚀 يمكن الآن نشر النظام بثقة تامة');
    } else if (healthReport.overallHealth.score >= 3) {
      console.log('👍 النظام يعمل بصورة جيدة مع توصيات للتحسين');
      console.log('⚠️ يُنصح بمعالجة التوصيات قبل النشر');
    } else {
      console.log('🚨 النظام يحتاج إلى انتباه عاجل');
      console.log('❌ لا يُنصح بالنشر حتى حل المشاكل');
    }

    return {
      healthy: healthReport.overallHealth.score >= 3,
      healthReport,
      errorReport,
      recommendations: uniqueRecommendations
    };

  } catch (error) {
    console.error('❌ فشل في التشخيص الشامل:', error);
    
    await errorMonitor.logError('ERROR', 'DIAGNOSTICS', 'فشل في التشخيص الشامل', error);
    
    return {
      healthy: false,
      error: error.message
    };
  }
}

async function quickSystemCheck() {
  console.log('⚡ فحص سريع للنظام...\n');
  
  try {
    // فحص سريع للصحة
    const quickHealth = await healthChecker.quickHealthCheck();
    
    // فحص سجلات الأخطاء الحديثة
    const recentErrors = await errorMonitor.getRecentErrorLogs(60); // آخر ساعة
    
    console.log('📊 === النتائج السريعة ===');
    console.log(`🏥 صحة النظام: ${quickHealth.score}/${quickHealth.total} مكونات سليمة`);
    console.log(`🚨 أخطاء حديثة (آخر ساعة): ${recentErrors.length}`);
    
    const criticalErrors = recentErrors.filter(log => log.level === 'خطأ').length;
    if (criticalErrors > 0) {
      console.log(`⚠️ أخطاء حرجة: ${criticalErrors}`);
    }
    
    const systemStatus = quickHealth.healthy && criticalErrors === 0 ? 
      '✅ سليم' : 
      criticalErrors > 0 ? '🚨 يحتاج انتباه' : '⚠️ تحذير';
    
    console.log(`🎯 الحالة العامة: ${systemStatus}`);
    
    return {
      healthy: quickHealth.healthy && criticalErrors === 0,
      score: quickHealth.score,
      total: quickHealth.total,
      recentErrors: recentErrors.length,
      criticalErrors
    };
    
  } catch (error) {
    console.error('❌ فشل في الفحص السريع:', error);
    await errorMonitor.logError('ERROR', 'QUICK_CHECK', 'فشل في الفحص السريع', error);
    return { healthy: false, error: error.message };
  }
}

// التحقق من المعاملات المرسلة من سطر الأوامر
const args = process.argv.slice(2);
const command = args[0] || 'full';

async function main() {
  try {
    if (command === 'quick') {
      const result = await quickSystemCheck();
      process.exit(result.healthy ? 0 : 1);
    } else if (command === 'full') {
      const result = await runFullDiagnostics();
      process.exit(result.healthy ? 0 : 1);
    } else {
      console.log('استخدام:');
      console.log('  node diagnostics.js quick  - فحص سريع');
      console.log('  node diagnostics.js full   - فحص شامل (افتراضي)');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ خطأ في تشغيل التشخيص:', error);
    process.exit(1);
  }
}

// تشغيل التشخيص
if (require.main === module) {
  main();
}

module.exports = {
  runFullDiagnostics,
  quickSystemCheck
};

console.log('🩺 نظام التشخيص الشامل جاهز!');
console.log('📊 فحص شامل: تحليل كامل + تقارير + توصيات');
console.log('⚡ فحص سريع: مراقبة لحظية للحالة');
console.log('🚀 جاهز للاستخدام من سطر الأوامر أو كموديول');