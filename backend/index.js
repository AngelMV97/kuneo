/**
 * KUNEO BACKEND ENTRY POINT
 * Express server for orchestrator and services
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { handleInteraction } = require('./orchestrator/tutorEngine');
const { createSession, completeSession } = require('./orchestrator/stateManager');
const { getModules, getModuleById } = require('./services/content/contentService');
const { getUserProgress, getProgressSummary } = require('./services/progress/progressService');
const { generateModuleRecommendations, getActiveRecommendations } = require('./services/recommendation/recommendationService');
const { generateICFESTest, saveICFESAttempt, getUserICFESAttempts } = require('./services/icfes/icfesService');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kuneo-backend', timestamp: new Date().toISOString() });
});

// ============================================
// TUTOR ENDPOINTS
// ============================================

/**
 * POST /tutor/interact
 * Main tutor interaction endpoint
 */
app.post('/tutor/interact', async (req, res) => {
  try {
    const response = await handleInteraction(req.body);
    res.json(response);
  } catch (error) {
    console.error('Tutor interaction error:', error);
    res.status(500).json({ error: 'Error processing interaction', message: error.message });
  }
});

/**
 * POST /tutor/session/start
 * Start new learning session
 */
app.post('/tutor/session/start', async (req, res) => {
  try {
    const { user_id, module_id } = req.body;
    const session = await createSession(user_id, module_id);
    res.json(session);
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Error starting session', message: error.message });
  }
});

/**
 * POST /tutor/session/:id/complete
 * Complete learning session
 */
app.post('/tutor/session/:id/complete', async (req, res) => {
  try {
    await completeSession(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Session complete error:', error);
    res.status(500).json({ error: 'Error completing session', message: error.message });
  }
});

// ============================================
// CONTENT ENDPOINTS
// ============================================

/**
 * GET /content/modules
 * Get all modules
 */
app.get('/content/modules', async (req, res) => {
  try {
    const { gradeLevel, subject } = req.query;
    const modules = await getModules({ gradeLevel: gradeLevel ? parseInt(gradeLevel) : null, subject });
    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Error fetching modules', message: error.message });
  }
});

/**
 * GET /content/modules/:id
 * Get module by ID
 */
app.get('/content/modules/:id', async (req, res) => {
  try {
    const module = await getModuleById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ error: 'Error fetching module', message: error.message });
  }
});

// ============================================
// PROGRESS ENDPOINTS
// ============================================

/**
 * GET /progress/:userId
 * Get user progress
 */
app.get('/progress/:userId', async (req, res) => {
  try {
    const progress = await getUserProgress(req.params.userId);
    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Error fetching progress', message: error.message });
  }
});

/**
 * GET /progress/:userId/summary
 * Get progress summary
 */
app.get('/progress/:userId/summary', async (req, res) => {
  try {
    const summary = await getProgressSummary(req.params.userId);
    res.json(summary);
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Error fetching progress summary', message: error.message });
  }
});

// ============================================
// RECOMMENDATIONS ENDPOINTS
// ============================================

/**
 * GET /recommendations/:userId
 * Get active recommendations
 */
app.get('/recommendations/:userId', async (req, res) => {
  try {
    const recommendations = await getActiveRecommendations(req.params.userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Error fetching recommendations', message: error.message });
  }
});

/**
 * POST /recommendations/:userId/generate
 * Generate new recommendations
 */
app.post('/recommendations/:userId/generate', async (req, res) => {
  try {
    const recommendations = await generateModuleRecommendations(req.params.userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ error: 'Error generating recommendations', message: error.message });
  }
});

// ============================================
// ICFES ENDPOINTS
// ============================================

/**
 * POST /icfes/generate
 * Generate ICFES test
 */
app.post('/icfes/generate', async (req, res) => {
  try {
    const { subject, questionCount = 20 } = req.body;
    const test = await generateICFESTest(subject, questionCount);
    res.json(test);
  } catch (error) {
    console.error('Generate ICFES error:', error);
    res.status(500).json({ error: 'Error generating ICFES test', message: error.message });
  }
});

/**
 * POST /icfes/submit
 * Submit ICFES attempt
 */
app.post('/icfes/submit', async (req, res) => {
  try {
    const { user_id, subject, answers, questions, duration_seconds } = req.body;
    const result = await saveICFESAttempt(user_id, subject, answers, questions, duration_seconds);
    res.json(result);
  } catch (error) {
    console.error('Submit ICFES error:', error);
    res.status(500).json({ error: 'Error submitting ICFES attempt', message: error.message });
  }
});

/**
 * GET /icfes/:userId/attempts
 * Get user's ICFES attempts
 */
app.get('/icfes/:userId/attempts', async (req, res) => {
  try {
    const { subject } = req.query;
    const attempts = await getUserICFESAttempts(req.params.userId, subject);
    res.json(attempts);
  } catch (error) {
    console.error('Get ICFES attempts error:', error);
    res.status(500).json({ error: 'Error fetching ICFES attempts', message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐻 Kuneo Backend running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
