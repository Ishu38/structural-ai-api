/**
 * Analysis Controller
 * Handles text and audio analysis requests
 */
const axios = require('axios');
const FormData = require('form-data');
const { AnalysisResult, UsageLog } = require('../models');

// Python pipeline service URL
const PIPELINE_SERVICE_URL = process.env.PIPELINE_SERVICE_URL || 'http://localhost:5000';

/**
 * Analyze text
 */
exports.analyzeText = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { text, options = {} } = req.body;
    
    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Text field is required and must be a string'
      });
    }
    
    // Check token limit
    const maxTokens = req.rateLimits?.maxTokensPerRequest || 50000;
    const estimatedTokens = text.length / 4; // Rough estimate
    
    if (estimatedTokens > maxTokens) {
      return res.status(400).json({
        error: 'Text Too Long',
        message: `Text exceeds maximum token limit of ${maxTokens} tokens`,
        estimatedTokens: Math.round(estimatedTokens)
      });
    }
    
    // Call Python pipeline service
    const response = await axios.post(`${PIPELINE_SERVICE_URL}/analyze`, {
      text,
      options
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000 // 2 minute timeout
    });
    
    const processingTime = Date.now() - startTime;
    const result = response.data;
    
    // Save analysis result
    const analysisRecord = new AnalysisResult({
      user: req.user._id,
      apiKey: req.apiKey.key,
      inputType: 'text',
      input: { text },
      result,
      metadata: {
        tokenCount: result.metadata?.tokenCount || Math.round(estimatedTokens),
        sentenceCount: result.metadata?.sentenceCount || 0,
        npCount: result.metadata?.npCount || 0,
        vpCount: result.metadata?.vpCount || 0,
        ambiguityCount: result.metadata?.ambiguityCount || 0,
        processingTimeMs: processingTime,
        model: result.metadata?.model || 'default'
      },
      status: 'completed'
    });
    
    await analysisRecord.save();
    
    // Log usage for billing
    const usageLog = new UsageLog({
      user: req.user._id,
      apiKey: req.apiKey.key,
      endpoint: 'analyze/text',
      requestType: 'text',
      tokens: Math.round(estimatedTokens),
      processingTimeMs: processingTime,
      status: 'success',
      metadata: {
        model: result.metadata?.model,
        language: result.metadata?.language,
        complexity: result.metadata?.complexity
      }
    });
    
    await usageLog.save();
    
    // Send response
    res.json({
      id: analysisRecord._id,
      status: 'completed',
      processingTimeMs: processingTime,
      result,
      billing: {
        tokens: Math.round(estimatedTokens),
        billable: true
      }
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Text analysis error:', error);
    
    // Log failed request
    try {
      await UsageLog.create({
        user: req.user._id,
        apiKey: req.apiKey.key,
        endpoint: 'analyze/text',
        requestType: 'text',
        processingTimeMs: processingTime,
        status: 'error',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    // Handle different error types
    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'Analysis Failed',
        message: error.response.data?.message || 'The analysis service returned an error',
        details: error.response.data
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'The analysis service is currently unavailable'
      });
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request Timeout',
        message: 'The analysis request took too long to complete'
      });
    }
    
    res.status(500).json({
      error: 'Internal Error',
      message: 'An unexpected error occurred during analysis'
    });
  }
};

/**
 * Analyze audio
 */
exports.analyzeAudio = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Audio file is required'
      });
    }
    
    const { language, options = {} } = req.body;
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('audio', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('language', language || 'en');
    formData.append('options', JSON.stringify(options));
    
    // Call Python pipeline service
    const response = await axios.post(`${PIPELINE_SERVICE_URL}/analyze/audio`, formData, {
      headers: formData.getHeaders(),
      timeout: 300000 // 5 minute timeout for audio
    });
    
    const processingTime = Date.now() - startTime;
    const result = response.data;
    
    // Save analysis result
    const analysisRecord = new AnalysisResult({
      user: req.user._id,
      apiKey: req.apiKey.key,
      inputType: 'audio',
      input: {
        audioFile: req.file.originalname,
        duration: result.acoustic?.duration || 0
      },
      result,
      metadata: {
        tokenCount: result.metadata?.tokenCount || 0,
        sentenceCount: result.metadata?.sentenceCount || 0,
        npCount: result.metadata?.npCount || 0,
        vpCount: result.metadata?.vpCount || 0,
        processingTimeMs: processingTime,
        model: result.metadata?.whisper_model || 'default',
        language: result.acoustic?.language
      },
      status: 'completed'
    });
    
    await analysisRecord.save();
    
    // Log usage for billing
    const audioSeconds = result.acoustic?.duration || 0;
    const usageLog = new UsageLog({
      user: req.user._id,
      apiKey: req.apiKey.key,
      endpoint: 'analyze/audio',
      requestType: 'audio',
      audioSeconds,
      processingTimeMs: processingTime,
      status: 'success',
      metadata: {
        model: result.metadata?.whisper_model,
        language: result.acoustic?.language
      }
    });
    
    await usageLog.save();
    
    // Send response
    res.json({
      id: analysisRecord._id,
      status: 'completed',
      processingTimeMs: processingTime,
      result,
      billing: {
        audioSeconds,
        audioMinutes: Math.ceil(audioSeconds / 60),
        billable: true
      }
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Audio analysis error:', error);
    
    // Log failed request
    try {
      await UsageLog.create({
        user: req.user._id,
        apiKey: req.apiKey.key,
        endpoint: 'analyze/audio',
        requestType: 'audio',
        processingTimeMs: processingTime,
        status: 'error',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    // Handle different error types
    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'Analysis Failed',
        message: error.response.data?.message || 'The analysis service returned an error'
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'The analysis service is currently unavailable'
      });
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request Timeout',
        message: 'The audio analysis request took too long to complete'
      });
    }
    
    res.status(500).json({
      error: 'Internal Error',
      message: 'An unexpected error occurred during audio analysis'
    });
  }
};

/**
 * Batch analyze multiple texts
 */
exports.analyzeBatch = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { texts, options = {} } = req.body;
    
    // Validate input
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Texts field is required and must be a non-empty array'
      });
    }
    
    // Limit batch size
    const maxBatchSize = 100;
    if (texts.length > maxBatchSize) {
      return res.status(400).json({
        error: 'Batch Too Large',
        message: `Maximum batch size is ${maxBatchSize} texts`
      });
    }
    
    // Process each text
    const results = [];
    const errors = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const text = texts[i];
        
        if (typeof text !== 'string') {
          errors.push({ index: i, error: 'Invalid text type' });
          continue;
        }
        
        const response = await axios.post(`${PIPELINE_SERVICE_URL}/analyze`, {
          text,
          options
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000
        });
        
        results.push({
          index: i,
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          result: response.data,
          status: 'success'
        });
        
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      processingTimeMs: processingTime,
      total: texts.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
    
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Batch Analysis Failed',
      message: 'An error occurred during batch processing'
    });
  }
};

/**
 * Get analysis history
 */
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    const query = { user: req.user._id };
    if (type) {
      query.inputType = type;
    }
    
    const analyses = await AnalysisResult.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-result'); // Exclude full result for list view
    
    const count = await AnalysisResult.countDocuments(query);
    
    res.json({
      analyses,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: 'An error occurred while fetching analysis history'
    });
  }
};

/**
 * Get specific analysis by ID
 */
exports.getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const analysis = await AnalysisResult.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!analysis) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis result not found'
      });
    }
    
    res.json({ analysis });
    
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      error: 'Failed to get analysis',
      message: 'An error occurred while fetching the analysis result'
    });
  }
};

/**
 * Delete analysis
 */
exports.deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await AnalysisResult.findOneAndDelete({
      _id: id,
      user: req.user._id
    });
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis result not found'
      });
    }
    
    res.json({
      message: 'Analysis deleted successfully',
      id
    });
    
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      error: 'Delete Failed',
      message: 'An error occurred while deleting the analysis'
    });
  }
};
