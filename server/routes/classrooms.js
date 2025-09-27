const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');

// Get all classrooms
router.get('/', async (req, res) => {
  try {
    const { type, grade, active } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (grade) query.grade = parseInt(grade);
    if (active !== undefined) query.isActive = active === 'true';

    const classrooms = await Classroom.find(query).sort({ 
      type: 1, 
      grade: 1, 
      section: 1 
    });

    // Group classrooms by type for better organization
    const groupedClassrooms = {
      smart: classrooms.filter(c => c.type === 'smart'),
      assembly: classrooms.filter(c => c.type === 'assembly'),
      classroom: classrooms.filter(c => c.type === 'classroom'),
      lab: classrooms.filter(c => c.type === 'lab')
    };

    res.json({
      success: true,
      data: classrooms,
      grouped: groupedClassrooms,
      count: classrooms.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع القاعات',
      error: error.message
    });
  }
});

// Get classrooms by grade
router.get('/grade/:grade', async (req, res) => {
  try {
    const { grade } = req.params;
    const classrooms = await Classroom.find({ 
      grade: parseInt(grade),
      type: 'classroom',
      isActive: true 
    }).sort({ section: 1 });

    res.json({
      success: true,
      data: classrooms,
      grade: parseInt(grade),
      count: classrooms.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع صفوف المرحلة',
      error: error.message
    });
  }
});

// Get a single classroom
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'القاعة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع القاعة',
      error: error.message
    });
  }
});

// Create a new classroom
router.post('/', async (req, res) => {
  try {
    const classroomData = req.body;
    
    // Validate required fields based on type
    if (classroomData.type === 'classroom') {
      if (!classroomData.grade || !classroomData.section) {
        return res.status(400).json({
          success: false,
          message: 'الصف والشعبة مطلوبان للقاعات الدراسية'
        });
      }
      
      // Check for duplicate classroom
      const existing = await Classroom.findOne({
        type: 'classroom',
        grade: classroomData.grade,
        section: classroomData.section,
        isActive: true
      });
      
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'هذه القاعة موجودة مسبقاً'
        });
      }
    }

    const classroom = new Classroom(classroomData);
    await classroom.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء القاعة بنجاح',
      data: classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء القاعة',
      error: error.message
    });
  }
});

// Update a classroom
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'القاعة غير موجودة'
      });
    }

    // Check for conflicts if updating grade/section
    if (updates.grade || updates.section) {
      const checkGrade = updates.grade || classroom.grade;
      const checkSection = updates.section || classroom.section;
      
      if (classroom.type === 'classroom') {
        const conflict = await Classroom.findOne({
          _id: { $ne: id },
          type: 'classroom',
          grade: checkGrade,
          section: checkSection,
          isActive: true
        });

        if (conflict) {
          return res.status(409).json({
            success: false,
            message: 'هذه القاعة موجودة مسبقاً'
          });
        }
      }
    }

    Object.assign(classroom, updates);
    await classroom.save();

    res.json({
      success: true,
      message: 'تم تحديث القاعة بنجاح',
      data: classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث القاعة',
      error: error.message
    });
  }
});

// Deactivate a classroom (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'القاعة غير موجودة'
      });
    }

    classroom.isActive = false;
    await classroom.save();

    res.json({
      success: true,
      message: 'تم إلغاء تفعيل القاعة بنجاح',
      data: classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إلغاء تفعيل القاعة',
      error: error.message
    });
  }
});

// Get classroom statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'القاعة غير موجودة'
      });
    }

    // Build date filter
    let dateFilter = { status: 'active' };
    if (start_date && end_date) {
      dateFilter.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const Booking = require('../models/Booking');
    
    // Get booking statistics
    const stats = await Booking.aggregate([
      {
        $match: {
          classroom_id: classroom._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          uniqueTeachers: { $addToSet: '$teacher_name' },
          uniqueSubjects: { $addToSet: '$subject' },
          mostRecentBooking: { $max: '$date' }
        }
      }
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      uniqueTeachers: [],
      uniqueSubjects: [],
      mostRecentBooking: null
    };

    res.json({
      success: true,
      data: {
        classroom,
        statistics: {
          totalBookings: result.totalBookings,
          uniqueTeachersCount: result.uniqueTeachers.length,
          uniqueSubjectsCount: result.uniqueSubjects.length,
          mostRecentBooking: result.mostRecentBooking,
          teachers: result.uniqueTeachers,
          subjects: result.uniqueSubjects
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع إحصائيات القاعة',
      error: error.message
    });
  }
});

module.exports = router;