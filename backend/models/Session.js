const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  topic: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterNow(value) {
        if (new Date(value) <= new Date()) {
          throw new Error('Start time must be in the future');
        }
      }
    }
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStart(value) {
        if (this.startTime && new Date(value) <= new Date(this.startTime)) {
          throw new Error('End time must be after start time');
        }
      }
    }
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: false,
    validate: {
      min: 15,
      max: 480 // 8 hours max
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  sessionType: {
    type: DataTypes.ENUM('one_on_one', 'group', 'workshop', 'assessment'),
    allowNull: false,
    defaultValue: 'one_on_one'
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 50
    }
  },
  currentStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meetingLink: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  materials: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: true
  },
  recurringEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
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
  tableName: 'sessions',
  indexes: [
    {
      fields: ['tutorId']
    },
    {
      fields: ['startTime']
    },
    {
      fields: ['status']
    },
    {
      fields: ['topic']
    }
  ]
});

// Instance methods
Session.prototype.isFull = function() {
  return this.currentStudents >= this.maxStudents;
};

Session.prototype.canJoin = function() {
  return this.status === 'scheduled' && !this.isFull();
};

Session.prototype.getDurationInHours = function() {
  return this.duration / 60;
};

Session.prototype.isRecurringActive = function() {
  if (!this.isRecurring || !this.recurringEndDate) return false;
  return new Date() <= new Date(this.recurringEndDate);
};

// Class methods
Session.findUpcoming = function() {
  return this.findAll({
    where: {
      startTime: {
        [sequelize.Op.gt]: new Date()
      },
      status: 'scheduled'
    },
    order: [['startTime', 'ASC']]
  });
};

Session.findByTutor = function(tutorId) {
  return this.findAll({
    where: { tutorId },
    order: [['startTime', 'DESC']]
  });
};

Session.findByStudent = function(studentId) {
  return this.findAll({
    include: [{
      model: sequelize.models.SessionStudent,
      where: { studentId }
    }],
    order: [['startTime', 'DESC']]
  });
};

module.exports = Session;