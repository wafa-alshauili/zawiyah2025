const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  classroom_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  teacher_name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time_slot: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // 8 periods + assembly + activity
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  },
  created_by: {
    type: String,
    default: 'system'
  },
  cancelled_at: Date,
  cancellation_reason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for day of week in Arabic
bookingSchema.virtual('dayOfWeek').get(function() {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[this.date.getDay()];
});

// Virtual for time slot name in Arabic
bookingSchema.virtual('timeSlotName').get(function() {
  const slots = {
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
  return slots[this.time_slot] || `الحصة ${this.time_slot}`;
});

// Compound index to prevent double booking
bookingSchema.index({ 
  classroom_id: 1, 
  date: 1, 
  time_slot: 1,
  status: 1
}, { 
  unique: true,
  partialFilterExpression: { status: 'active' }
});

// Index for efficient queries
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ teacher_name: 1 });
bookingSchema.index({ subject: 1 });
bookingSchema.index({ created_at: -1 });

// Pre-save middleware to validate school days (Sunday-Thursday)
bookingSchema.pre('save', function(next) {
  const dayOfWeek = this.date.getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
    return next(new Error('لا يمكن الحجز في أيام الجمعة والسبت'));
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);