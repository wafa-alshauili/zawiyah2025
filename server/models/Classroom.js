const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name_ar: {
    type: String,
    required: true,
    trim: true
  },
  name_en: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['classroom', 'smart', 'assembly', 'lab'],
    default: 'classroom'
  },
  grade: {
    type: Number,
    min: 5,
    max: 12,
    required: function() {
      return this.type === 'classroom';
    }
  },
  section: {
    type: String,
    required: function() {
      return this.type === 'classroom';
    },
    validate: {
      validator: function(v) {
        if (this.type !== 'classroom') return true;
        return /^[أ-ي]$/.test(v); // Arabic letters
      },
      message: 'يجب أن تكون الشعبة حرف عربي'
    }
  },
  capacity: {
    type: Number,
    default: 30,
    min: 1
  },
  equipment: [{
    type: String,
    enum: ['projector', 'smartboard', 'computers', 'laboratory', 'sound_system']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  location: {
    floor: Number,
    building: String,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full classroom name
classroomSchema.virtual('fullName').get(function() {
  if (this.type === 'classroom') {
    return `الصف ${this.grade}${this.section}`;
  }
  return this.name_ar;
});

// Index for efficient queries
classroomSchema.index({ type: 1, grade: 1, section: 1 });
classroomSchema.index({ isActive: 1 });

module.exports = mongoose.model('Classroom', classroomSchema);