/**
 * RECOMMENDATIONS ROUTES
 * Personalized learning recommendations
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * GET /api/recommendations
 * Get active recommendations
 */
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/recommendations/${req.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Get recommendations error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error fetching recommendations'
    });
  }
});

/**
 * POST /api/recommendations/generate
 * Generate new recommendations
 */
router.post('/generate', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/recommendations/${req.userId}/generate`);
    res.json(response.data);
  } catch (error) {
    console.error('Generate recommendations error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error generating recommendations'
    });
  }
});

module.exports = router;
