/**
 * Analysis Routes
 * Handles text and audio analysis requests
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const analysisController = require('../controllers/analysisController');
const { authenticate, rateLimit } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /wav|mp3|ogg|webm|flac|m4a/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format. Allowed: wav, mp3, ogg, webm, flac, m4a'));
    }
  }
});

// All analysis routes require authentication
router.use(authenticate);
router.use(rateLimit);

/**
 * @route   POST /api/analyze/text
 * @desc    Analyze text for syntactic structure
 * @access  Private
 * @body    { text: string, options?: object }
 */
router.post('/text', analysisController.analyzeText);

/**
 * @route   POST /api/analyze/audio
 * @desc    Analyze audio file (transcribe + syntactic analysis)
 * @access  Private
 * @form    audio: file, options?: object
 */
router.post('/audio', upload.single('audio'), analysisController.analyzeAudio);

/**
 * @route   POST /api/analyze/batch
 * @desc    Batch analyze multiple texts
 * @access  Private
 * @body    { texts: string[], options?: object }
 */
router.post('/batch', analysisController.analyzeBatch);

/**
 * @route   GET /api/analyze/history
 * @desc    Get user's analysis history
 * @access  Private
 * @query   page, limit, type
 */
router.get('/history', analysisController.getHistory);

/**
 * @route   GET /api/analyze/:id
 * @desc    Get specific analysis result
 * @access  Private
 */
router.get('/:id', analysisController.getAnalysisById);

/**
 * @route   DELETE /api/analyze/:id
 * @desc    Delete specific analysis result
 * @access  Private
 */
router.delete('/:id', analysisController.deleteAnalysis);

module.exports = router;
