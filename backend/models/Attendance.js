const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sessions',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused', 'pending'),
    allowNull: false,
    defaultValue: 'pending'
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true,
    validate: {
      min: 0
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  markedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  markedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  evidence: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'attendance',
  indexes: [
    {
      unique: true,
      fields: ['sessionId', 'studentId']
    },
    {
      fields: ['studentId']
    },
    {
      fields: ['sessionId']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance methods
Attendance.prototype.isPresent = function() {
  return this.status === 'present';
};

Attendance.prototype.isAbsent = function() {
  return this.status === 'absent';
};

Attendance.prototype.isLate = function() {
  return this.status === 'late';
};

Attendance.prototype.calculateDuration = function() {
  if (this.checkInTime && this.checkOutTime) {
    const duration = Math.round((new Date(this.checkOutTime) - new Date(this.checkInTime)) / (1000 * 60));
    this.duration = duration;
    return duration;
  }
  return 0;
};

Attendance.prototype.markPresent = function(markedBy) {
  this.status = 'present';
  this.checkInTime = new Date();
  this.markedBy = markedBy;
  this.markedAt = new Date();
};

Attendance.prototype.markAbsent = function(markedBy, reason = null) {
  this.status = 'absent';
  this.reason = reason;
  this.markedBy = markedBy;
  this.markedAt = new Date();
};

Attendance.prototype.markLate = function(markedBy) {
  this.status = 'late';
  this.checkInTime = new Date();
  this.markedBy = markedBy;
  this.markedAt = new Date();
};

// Class methods
Attendance.findBySession = function(sessionId) {
  return this.findAll({
    where: { sessionId },
    include: [
      {
        model: sequelize.models.User,
        as: 'student',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }
    ],
    order: [['createdAt', 'ASC']]
  });
};

Attendance.findByStudent = function(studentId, options = {}) {
  const where = { studentId };
  
  if (options.startDate) {
    where.createdAt = {
      [sequelize.Op.gte]: options.startDate
    };
  }
  
  if (options.endDate) {
    where.createdAt = {
      ...where.createdAt,
      [sequelize.Op.lte]: options.endDate
    };
  }
  
  return this.findAll({
    where,
    include: [
      {
        model: sequelize.models.Session,
        as: 'session',
        attributes: ['id', 'title', 'topic', 'startTime', 'endTime']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};

Attendance.getAttendanceStats = function(studentId, startDate, endDate) {
  return this.findAll({
    where: {
      studentId,
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('status')), 'count']
    ],
    group: ['status']
  });
};

module.exports = Attendance;