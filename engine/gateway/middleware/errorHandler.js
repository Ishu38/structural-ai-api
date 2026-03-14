/**
 * Error Handler Middleware
 * Centralized error handling
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(', ')
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: `A record with this ${field} already exists`
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: `Invalid ${err.path}: ${err.value}`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'The provided authentication token is invalid'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'The provided authentication token has expired'
    });
  }
  
  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: 'The uploaded file exceeds the maximum size limit'
      });
    }
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
