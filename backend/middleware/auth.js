const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user is student
const requireStudent = requireRole('student');

// Middleware to check if user is tutor
const requireTutor = requireRole('tutor');

// Middleware to check if user is admin
const requireAdmin = requireRole(['admin', 'super_admin']);

// Middleware to check if user is super admin
const requireSuperAdmin = requireRole('super_admin');

// Middleware to check if user can access resource (owner or admin)
const requireOwnershipOrAdmin = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Super admins can access everything
      if (req.user.isSuperAdmin()) {
        return next();
      }

      // Admins can access everything
      if (req.user.isAdmin()) {
        return next();
      }

      // Get resource ID from request
      const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID required'
        });
      }

      // Find the resource
      const resource = await resourceModel.findByPk(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource
      const userIdField = req.user.isStudent() ? 'studentId' : 'tutorId';
      
      if (resource[userIdField] === req.user.id) {
        return next();
      }

      // Check if user is the tutor for a session
      if (resourceModel.name === 'Session' && resource.tutorId === req.user.id) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Middleware to check if user can access session
const requireSessionAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const sessionId = req.params.sessionId || req.body.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required'
      });
    }

    const Session = require('../models/Session');
    const SessionStudent = require('../models/SessionStudent');
    
    const session = await Session.findByPk(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Super admins and admins can access everything
    if (req.user.isAdmin()) {
      return next();
    }

    // Tutors can access their own sessions
    if (req.user.isTutor() && session.tutorId === req.user.id) {
      return next();
    }

    // Students can access sessions they're enrolled in
    if (req.user.isStudent()) {
      const enrollment = await SessionStudent.findOne({
        where: {
          sessionId: sessionId,
          studentId: req.user.id
        }
      });

      if (enrollment) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied - insufficient permissions for this session'
    });
  } catch (error) {
    console.error('Session access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking session access'
    });
  }
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Generate refresh token
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireStudent,
  requireTutor,
  requireAdmin,
  requireSuperAdmin,
  requireOwnershipOrAdmin,
  requireSessionAccess,
  generateToken,
  generateRefreshToken
};