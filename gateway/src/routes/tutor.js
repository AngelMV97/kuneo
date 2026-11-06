/**
 * TUTOR ROUTES
 * Forwards tutor interaction requests to backend
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * POST /api/tutor/interact
 * Main tutor interaction
 */
router.post('/interact', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/tutor/interact`, {
      ...req.body,
      user_id: req.userId // Inject authenticated user ID
    });
    res.json(response.data);
  } catch (error) {
    console.error('Tutor interact error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error processing interaction'
    });
  }
});

/**
 * POST /api/tutor/session/start
 * Start new session
 */
router.post('/session/start', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/tutor/session/start`, {
      user_id: req.userId,
      module_id: req.body.module_id
    });
    res.json(response.data);
  } catch (error) {
    console.error('Session start error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error starting session'
    });
  }
});

/**
 * POST /api/tutor/session/:id/complete
 * Complete session
 */
router.post('/session/:id/complete', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/tutor/session/${req.params.id}/complete`);
    res.json(response.data);
  } catch (error) {
    console.error('Session complete error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error completing session'
    });
  }
});

module.exports = router;
