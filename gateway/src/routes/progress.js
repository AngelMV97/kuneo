/**
 * PROGRESS ROUTES
 * User progress and cognitive profile endpoints
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * GET /api/progress
 * Get user progress (uses authenticated user ID)
 */
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/progress/${req.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Get progress error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error fetching progress'
    });
  }
});

/**
 * GET /api/progress/summary
 * Get progress summary
 */
router.get('/summary', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/progress/${req.userId}/summary`);
    res.json(response.data);
  } catch (error) {
    console.error('Get progress summary error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error fetching progress summary'
    });
  }
});

module.exports = router;
