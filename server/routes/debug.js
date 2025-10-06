// Debug endpoint to check database status
const express = require('express');
const db = require('../db');

const router = express.Router();

// Get database statistics and status
router.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();
    const bookings = db.getBookings();
    const classrooms = db.getClassrooms();
    const timeSlots = db.getTimeSlots();

    const response = {
      status: 'running',
      timestamp: new Date().toISOString(),
      serverless: true,
      database: {
        type: 'in-memory',
        ...stats
      },
      data: {
        bookingsCount: Object.keys(bookings).length,
        classroomsCount: classrooms.length,
        timeSlotsCount: timeSlots.length,
        recentBookings: Object.entries(bookings)
          .slice(-5)
          .map(([key, booking]) => ({
            key,
            teacher: booking.teacher,
            classroom: booking.classroom,
            date: booking.date,
            time: booking.time
          }))
      }
    };

    console.log('📊 إحصائيات النظام المطلوبة:', response);
    res.json(response);

  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      error: 'فشل في جلب إحصائيات النظام',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Reset database (for testing only)
router.post('/reset', (req, res) => {
  try {
    const success = db.reset();
    
    if (success) {
      console.log('🔄 تم إعادة تعيين قاعدة البيانات');
      res.json({
        success: true,
        message: 'تم إعادة تعيين قاعدة البيانات بنجاح',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'فشل في إعادة تعيين قاعدة البيانات'
      });
    }
  } catch (error) {
    console.error('خطأ في إعادة التعيين:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;