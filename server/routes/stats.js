const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Classroom = require('../models/Classroom');
const moment = require('moment');

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = moment().startOf('day');
    const weekStart = moment().startOf('week'); // Sunday
    const monthStart = moment().startOf('month');

    // Today's bookings count
    const todayBookings = await Booking.countDocuments({
      date: {
        $gte: today.toDate(),
        $lt: today.clone().add(1, 'day').toDate()
      },
      status: 'active'
    });

    // This week's bookings count
    const weekBookings = await Booking.countDocuments({
      date: {
        $gte: weekStart.toDate(),
        $lt: weekStart.clone().add(5, 'days').toDate() // Sunday to Thursday
      },
      status: 'active'
    });

    // This month's bookings count
    const monthBookings = await Booking.countDocuments({
      date: {
        $gte: monthStart.toDate(),
        $lt: monthStart.clone().add(1, 'month').toDate()
      },
      status: 'active'
    });

    // Most booked classrooms (this month)
    const mostBookedClassrooms = await Booking.aggregate([
      {
        $match: {
          date: {
            $gte: monthStart.toDate(),
            $lt: monthStart.clone().add(1, 'month').toDate()
          },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$classroom_id',
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'classrooms',
          localField: '_id',
          foreignField: '_id',
          as: 'classroom'
        }
      },
      {
        $unwind: '$classroom'
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          classroomName: '$classroom.name_ar',
          fullName: '$classroom.fullName',
          bookingCount: 1
        }
      }
    ]);

    // Most active teachers (this month)
    const mostActiveTeachers = await Booking.aggregate([
      {
        $match: {
          date: {
            $gte: monthStart.toDate(),
            $lt: monthStart.clone().add(1, 'month').toDate()
          },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$teacher_name',
          bookingCount: { $sum: 1 },
          uniqueSubjects: { $addToSet: '$subject' },
          uniqueClassrooms: { $addToSet: '$classroom_id' }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          teacherName: '$_id',
          bookingCount: 1,
          subjectsCount: { $size: '$uniqueSubjects' },
          classroomsCount: { $size: '$uniqueClassrooms' }
        }
      }
    ]);

    // Most booked subjects (this month)
    const mostBookedSubjects = await Booking.aggregate([
      {
        $match: {
          date: {
            $gte: monthStart.toDate(),
            $lt: monthStart.clone().add(1, 'month').toDate()
          },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$subject',
          bookingCount: { $sum: 1 },
          uniqueTeachers: { $addToSet: '$teacher_name' }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          subjectName: '$_id',
          bookingCount: 1,
          teachersCount: { $size: '$uniqueTeachers' }
        }
      }
    ]);

    // Total active classrooms
    const totalClassrooms = await Classroom.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        summary: {
          todayBookings,
          weekBookings,
          monthBookings,
          totalClassrooms
        },
        mostBookedClassrooms,
        mostActiveTeachers,
        mostBookedSubjects,
        period: {
          today: today.format('YYYY-MM-DD'),
          weekStart: weekStart.format('YYYY-MM-DD'),
          monthStart: monthStart.format('YYYY-MM-DD')
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع إحصائيات لوحة التحكم',
      error: error.message
    });
  }
});

// Get booking trends (daily bookings over time)
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = moment().subtract(parseInt(days), 'days').startOf('day');
    const endDate = moment().endOf('day');

    const trends = await Booking.aggregate([
      {
        $match: {
          date: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate()
          },
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Fill in missing dates with zero counts
    const trendData = [];
    const current = startDate.clone();
    
    while (current <= endDate) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayOfWeek = current.day();
      
      // Only include school days (Sunday = 0 to Thursday = 4)
      if (dayOfWeek >= 0 && dayOfWeek <= 4) {
        const trend = trends.find(t => t._id === dateStr);
        trendData.push({
          date: dateStr,
          dayName: current.format('dddd'),
          dayNameAr: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][dayOfWeek],
          count: trend ? trend.count : 0
        });
      }
      
      current.add(1, 'day');
    }

    res.json({
      success: true,
      data: trendData,
      period: {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        days: parseInt(days)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع اتجاهات الحجوزات',
      error: error.message
    });
  }
});

// Get usage statistics by time slot
router.get('/time-slots', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = { status: 'active' };
    if (start_date && end_date) {
      dateFilter.date = {
        $gte: moment(start_date).startOf('day').toDate(),
        $lte: moment(end_date).endOf('day').toDate()
      };
    } else {
      // Default to current month
      const monthStart = moment().startOf('month');
      dateFilter.date = {
        $gte: monthStart.toDate(),
        $lt: monthStart.clone().add(1, 'month').toDate()
      };
    }

    const timeSlotStats = await Booking.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$time_slot',
          bookingCount: { $sum: 1 },
          uniqueClassrooms: { $addToSet: '$classroom_id' },
          uniqueTeachers: { $addToSet: '$teacher_name' }
        }
      },
      {
        $sort: { '_id': 1 }
      },
      {
        $project: {
          timeSlot: '$_id',
          bookingCount: 1,
          classroomsCount: { $size: '$uniqueClassrooms' },
          teachersCount: { $size: '$uniqueTeachers' }
        }
      }
    ]);

    // Add time slot names
    const timeSlotNames = {
      1: 'الحصة الأولى',
      2: 'الحصة الثانية',
      3: 'الحصة الثالثة',
      4: 'الحصة الرابعة',
      5: 'الحصة الخامسة',
      6: 'الحصة السادسة',
      7: 'الحصة السابعة',
      8: 'الحصة الثامنة',
      9: 'الطابور',
      10: 'النشاط'
    };

    const enrichedStats = timeSlotStats.map(stat => ({
      ...stat,
      timeSlotName: timeSlotNames[stat.timeSlot] || `الحصة ${stat.timeSlot}`
    }));

    res.json({
      success: true,
      data: enrichedStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع إحصائيات الفترات الزمنية',
      error: error.message
    });
  }
});

// Get classroom utilization report
router.get('/utilization', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = {};
    if (start_date && end_date) {
      dateFilter = {
        $gte: moment(start_date).startOf('day').toDate(),
        $lte: moment(end_date).endOf('day').toDate()
      };
    } else {
      // Default to current week
      const weekStart = moment().startOf('week');
      dateFilter = {
        $gte: weekStart.toDate(),
        $lt: weekStart.clone().add(5, 'days').toDate()
      };
    }

    const utilizationStats = await Booking.aggregate([
      {
        $match: {
          date: dateFilter,
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$classroom_id',
          totalBookings: { $sum: 1 },
          uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
          subjects: { $addToSet: '$subject' },
          teachers: { $addToSet: '$teacher_name' }
        }
      },
      {
        $lookup: {
          from: 'classrooms',
          localField: '_id',
          foreignField: '_id',
          as: 'classroom'
        }
      },
      {
        $unwind: '$classroom'
      },
      {
        $project: {
          classroomName: '$classroom.name_ar',
          classroomType: '$classroom.type',
          totalBookings: 1,
          daysUsed: { $size: '$uniqueDays' },
          subjectsCount: { $size: '$subjects' },
          teachersCount: { $size: '$teachers' },
          utilizationRate: {
            $multiply: [
              { $divide: ['$totalBookings', 40] }, // 5 days * 8 periods
              100
            ]
          }
        }
      },
      {
        $sort: { utilizationRate: -1 }
      }
    ]);

    res.json({
      success: true,
      data: utilizationStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع تقرير الاستخدام',
      error: error.message
    });
  }
});

module.exports = router;