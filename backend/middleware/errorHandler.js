/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message: `Validation Error: ${message}`,
      errors: err.errors.map(val => ({
        field: val.path,
        message: val.message,
        value: val.value
      }))
    };
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 409,
      message: `Duplicate Error: ${message}`,
      errors: err.errors.map(val => ({
        field: val.path,
        message: val.message,
        value: val.value
      }))
    };
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      statusCode: 400,
      message: 'Referenced record does not exist',
      field: err.fields ? Object.keys(err.fields)[0] : 'unknown'
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired'
    };
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'File size too large'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      statusCode: 400,
      message: 'Unexpected file field'
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      statusCode: 429,
      message: 'Too many requests, please try again later'
    };
  }

  // Cast errors (usually from MongoDB, but handling for consistency)
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'Invalid ID format'
    };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack }),
    ...(isDevelopment && { details: error }),
    ...(error.errors && { errors: error.errors }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * Async error wrapper to catch async errors in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Validation error handler
 * @param {Array} errors - Validation errors array
 * @param {Response} res - Express response object
 */
const handleValidationErrors = (errors, res) => {
  return res.status(400).json({
    success: false,
    message: 'Validation errors',
    errors: errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    })),
    timestamp: new Date().toISOString()
  });
};

/**
 * Database connection error handler
 * @param {Error} err - Database error
 * @param {Response} res - Express response object
 */
const handleDatabaseError = (err, res) => {
  console.error('Database error:', err);
  
  return res.status(503).json({
    success: false,
    message: 'Database service unavailable',
    timestamp: new Date().toISOString()
  });
};

/**
 * File upload error handler
 * @param {Error} err - File upload error
 * @param {Response} res - Express response object
 */
const handleFileUploadError = (err, res) => {
  let message = 'File upload failed';
  let statusCode = 400;

  if (err.code === 'LIMIT_FILE_SIZE') {
    message = `File size exceeds limit of ${process.env.MAX_FILE_SIZE || '10MB'}`;
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files uploaded';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field';
  } else if (err.message.includes('File type not allowed')) {
    message = 'File type not allowed';
  }

  return res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * External service error handler (WhatsApp, Email, etc.)
 * @param {Error} err - External service error
 * @param {Response} res - Express response object
 * @param {string} serviceName - Name of the external service
 */
const handleExternalServiceError = (err, res, serviceName = 'External service') => {
  console.error(`${serviceName} error:`, err);
  
  return res.status(502).json({
    success: false,
    message: `${serviceName} temporarily unavailable`,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  handleValidationErrors,
  handleDatabaseError,
  handleFileUploadError,
  handleExternalServiceError
};