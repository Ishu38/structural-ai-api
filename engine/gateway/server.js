/**
 * Structural AI API - Express Gateway Server
 * Main entry point for the API gateway
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const billingRoutes = require('./routes/billing');
const userRoutes = require('./routes/users');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Configuration
const PORT = process.env.API_PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/structural-ai';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Global rate limiter (fallback)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analyze', analysisRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Structural AI API',
    version: '1.0.0',
    description: 'Deep Chomskyan syntactic analysis API',
    endpoints: {
      health: 'GET /health',
      analyze_text: 'POST /api/analyze/text',
      analyze_audio: 'POST /api/analyze/audio',
      auth_register: 'POST /api/auth/register',
      auth_login: 'POST /api/auth/login',
      billing_usage: 'GET /api/billing/usage',
      users_profile: 'GET /api/users/profile'
    },
    documentation: '/api/docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use(errorHandler);

// Database connection
async function startServer() {
  try {
    // Connect to MongoDB
    if (process.env.NODE_ENV !== 'test') {
      await mongoose.connect(MONGODB_URI);
      console.log('✓ Connected to MongoDB');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Structural AI API running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
