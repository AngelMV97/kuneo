/**
 * ICFES ROUTES
 * Mock ICFES test generation and evaluation
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * POST /api/icfes/generate
 * Generate ICFES test
 */
router.post('/generate', async (req, res) => {
  try {
    const { subject, questionCount } = req.body;
    const response = await axios.post(`${BACKEND_URL}/icfes/generate`, {
      subject,
      questionCount
    });
    res.json(response.data);
  } catch (error) {
    console.error('Generate ICFES error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error generating ICFES test'
    });
  }
});

/**
 * POST /api/icfes/submit
 * Submit ICFES attempt
 */
router.post('/submit', async (req, res) => {
  try {
    const { subject, answers, questions, duration_seconds } = req.body;
    const response = await axios.post(`${BACKEND_URL}/icfes/submit`, {
      user_id: req.userId,
      subject,
      answers,
      questions,
      duration_seconds
    });
    res.json(response.data);
  } catch (error) {
    console.error('Submit ICFES error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error submitting ICFES attempt'
    });
  }
});

/**
 * GET /api/icfes/attempts
 * Get user's ICFES attempts
 */
router.get('/attempts', async (req, res) => {
  try {
    const { subject } = req.query;
    const response = await axios.get(`${BACKEND_URL}/icfes/${req.userId}/attempts`, {
      params: { subject }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Get ICFES attempts error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error fetching ICFES attempts'
    });
  }
});

module.exports = router;
