const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  slot_number: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 10
  },
  name_ar: {
    type: String,
    required: true
  },
  name_en: {
    type: String
  },
  start_time: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  end_time: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  type: {
    type: String,
    enum: ['academic', 'assembly', 'activity', 'break'],
    default: 'academic'
  },
  duration_minutes: {
    type: Number,
    default: 45
  },
  is_bookable: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient ordering
timeSlotSchema.index({ order: 1 });
timeSlotSchema.index({ slot_number: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);