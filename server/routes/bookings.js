const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Classroom = require('../models/Classroom');
const moment = require('moment');

// Get all bookings with optional filters
router.get('/', async (req, res) => {
  try {
    const { 
      classroom_id, 
      date, 
      teacher_name, 
      status = 'active',
      start_date,
      end_date 
    } = req.query;

    let query = { status };

    if (classroom_id) query.classroom_id = classroom_id;
    if (teacher_name) query.teacher_name = new RegExp(teacher_name, 'i');
    
    if (date) {
      const targetDate = moment(date).startOf('day');
      query.date = {
        $gte: targetDate.toDate(),
        $lt: targetDate.clone().add(1, 'day').toDate()
      };
    } else if (start_date && end_date) {
      query.date = {
        $gte: moment(start_date).startOf('day').toDate(),
        $lte: moment(end_date).endOf('day').toDate()
      };
    }

    const bookings = await Booking.find(query)
      .populate('classroom_id')
      .sort({ date: 1, time_slot: 1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع الحجوزات',
      error: error.message
    });
  }
});

// Get bookings for a specific classroom and week
router.get('/classroom/:classroomId/week/:date', async (req, res) => {
  try {
    const { classroomId, date } = req.params;
    
    // Get start of week (Sunday) and end of week (Thursday) for Arabic school week
    const weekStart = moment(date).startOf('week'); // Sunday
    const weekEnd = weekStart.clone().add(4, 'days').endOf('day'); // Thursday

    const bookings = await Booking.find({
      classroom_id: classroomId,
      status: 'active',
      date: {
        $gte: weekStart.toDate(),
        $lte: weekEnd.toDate()
      }
    }).sort({ date: 1, time_slot: 1 });

    // Create a grid structure for easy frontend consumption
    const weekGrid = {};
    
    for (let i = 0; i < 5; i++) { // Sunday to Thursday
      const dayDate = weekStart.clone().add(i, 'days');
      const dayKey = dayDate.format('YYYY-MM-DD');
      weekGrid[dayKey] = {
        date: dayDate.toDate(),
        dayName: dayDate.format('dddd'),
        dayNameAr: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][i],
        slots: {}
      };
      
      // Initialize all time slots as available
      for (let slot = 1; slot <= 10; slot++) {
        weekGrid[dayKey].slots[slot] = {
          available: true,
          booking: null
        };
      }
    }

    // Fill in the bookings
    bookings.forEach(booking => {
      const dayKey = moment(booking.date).format('YYYY-MM-DD');
      if (weekGrid[dayKey]) {
        weekGrid[dayKey].slots[booking.time_slot] = {
          available: false,
          booking: booking
        };
      }
    });

    res.json({
      success: true,
      data: weekGrid,
      weekStart: weekStart.toDate(),
      weekEnd: weekEnd.toDate()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع جدول الحجوزات',
      error: error.message
    });
  }
});

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    const requiredFields = ['classroom_id', 'teacher_name', 'subject', 'date', 'time_slot'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({
          success: false,
          message: `الحقل ${field} مطلوب`
        });
      }
    }

    // Check if classroom exists
    const classroom = await Classroom.findById(bookingData.classroom_id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'القاعة غير موجودة'
      });
    }

    // Check for existing booking
    const existingBooking = await Booking.findOne({
      classroom_id: bookingData.classroom_id,
      date: moment(bookingData.date).startOf('day').toDate(),
      time_slot: bookingData.time_slot,
      status: 'active'
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'هذه الفترة محجوزة مسبقاً'
      });
    }

    const booking = new Booking({
      ...bookingData,
      date: moment(bookingData.date).startOf('day').toDate()
    });

    await booking.save();
    await booking.populate('classroom_id');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحجز بنجاح',
      data: booking
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'هذه الفترة محجوزة مسبقاً'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الحجز',
      error: error.message
    });
  }
});

// Update a booking
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'الحجز غير موجود'
      });
    }

    // If updating time or date, check for conflicts
    if (updates.date || updates.time_slot || updates.classroom_id) {
      const checkDate = updates.date ? moment(updates.date).startOf('day').toDate() : booking.date;
      const checkSlot = updates.time_slot || booking.time_slot;
      const checkClassroom = updates.classroom_id || booking.classroom_id;

      const conflict = await Booking.findOne({
        _id: { $ne: id },
        classroom_id: checkClassroom,
        date: checkDate,
        time_slot: checkSlot,
        status: 'active'
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'هذه الفترة محجوزة مسبقاً'
        });
      }
    }

    Object.assign(booking, updates);
    if (updates.date) {
      booking.date = moment(updates.date).startOf('day').toDate();
    }
    
    await booking.save();
    await booking.populate('classroom_id');

    res.json({
      success: true,
      message: 'تم تحديث الحجز بنجاح',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الحجز',
      error: error.message
    });
  }
});

// Cancel a booking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'الحجز غير موجود'
      });
    }

    booking.status = 'cancelled';
    booking.cancelled_at = new Date();
    if (reason) booking.cancellation_reason = reason;

    await booking.save();
    await booking.populate('classroom_id');

    res.json({
      success: true,
      message: 'تم إلغاء الحجز بنجاح',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إلغاء الحجز',
      error: error.message
    });
  }
});

// Get today's bookings
router.get('/today', async (req, res) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = today.clone().add(1, 'day');

    const bookings = await Booking.find({
      date: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      },
      status: 'active'
    })
    .populate('classroom_id')
    .sort({ time_slot: 1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length,
      date: today.format('YYYY-MM-DD')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع حجوزات اليوم',
      error: error.message
    });
  }
});

module.exports = router;