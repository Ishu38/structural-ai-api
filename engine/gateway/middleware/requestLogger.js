/**
 * Request Logger Middleware
 * Logs incoming requests for debugging and analytics
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - ` +
      `${res.statusCode} - ${duration}ms`
    );
    
    // Log additional info for authenticated requests
    if (req.user) {
      console.log(`  User: ${req.user.email} (${req.user._id})`);
    }
  });
  
  next();
};

module.exports = requestLogger;
