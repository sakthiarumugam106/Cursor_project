const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sessions',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  paymentMethod: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'cash', 'waiver', 'dev_mode'),
    allowNull: false,
    defaultValue: 'dev_mode'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  transactionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  gatewayResponse: {
    type: DataTypes.JSON,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  refundReason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  receiptUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  environment: {
    type: DataTypes.ENUM('dev', 'prod'),
    allowNull: false,
    defaultValue: 'dev'
  }
}, {
  tableName: 'payments',
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['sessionId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['transactionId']
    },
    {
      fields: ['dueDate']
    }
  ],
  hooks: {
    beforeCreate: async (payment) => {
      // Auto-complete payments in dev environment
      if (process.env.ENVIRONMENT === 'dev') {
        payment.status = 'completed';
        payment.paidAt = new Date();
        payment.paymentMethod = 'dev_mode';
        payment.amount = 0.00;
        payment.environment = 'dev';
      }
      
      // Generate invoice number if not provided
      if (!payment.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await Payment.count({
          where: {
            createdAt: {
              [sequelize.Op.between]: [
                new Date(date.getFullYear(), date.getMonth(), 1),
                new Date(date.getFullYear(), date.getMonth() + 1, 0)
              ]
            }
          }
        });
        payment.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      }
    }
  }
});

// Instance methods
Payment.prototype.isCompleted = function() {
  return this.status === 'completed';
};

Payment.prototype.isPending = function() {
  return this.status === 'pending';
};

Payment.prototype.isFailed = function() {
  return this.status === 'failed';
};

Payment.prototype.isRefunded = function() {
  return this.status === 'refunded';
};

Payment.prototype.isOverdue = function() {
  if (!this.dueDate || this.isCompleted()) return false;
  return new Date() > new Date(this.dueDate);
};

Payment.prototype.getDaysOverdue = function() {
  if (!this.isOverdue()) return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
};

Payment.prototype.markAsCompleted = function(transactionId = null, gatewayResponse = null) {
  this.status = 'completed';
  this.paidAt = new Date();
  if (transactionId) this.transactionId = transactionId;
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
};

Payment.prototype.markAsFailed = function(gatewayResponse = null) {
  this.status = 'failed';
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
};

Payment.prototype.refund = function(amount, reason) {
  this.status = 'refunded';
  this.refundAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
};

// Class methods
Payment.findByStudent = function(studentId, options = {}) {
  const where = { studentId };
  
  if (options.status) {
    where.status = options.status;
  }
  
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
        attributes: ['id', 'title', 'topic', 'startTime']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};

Payment.findOverdue = function() {
  return this.findAll({
    where: {
      status: 'pending',
      dueDate: {
        [sequelize.Op.lt]: new Date()
      }
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'student',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }
    ],
    order: [['dueDate', 'ASC']]
  });
};

Payment.getPaymentStats = function(studentId, startDate, endDate) {
  return this.findAll({
    where: {
      studentId,
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'status',
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status']
  });
};

Payment.getRevenueStats = function(startDate, endDate) {
  return this.findAll({
    where: {
      status: 'completed',
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('paidAt')), 'date'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'transactions']
    ],
    group: [sequelize.fn('DATE', sequelize.col('paidAt'))],
    order: [[sequelize.fn('DATE', sequelize.col('paidAt')), 'ASC']]
  });
};

module.exports = Payment;