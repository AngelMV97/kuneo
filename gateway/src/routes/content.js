/**
 * CONTENT ROUTES
 * Public routes for browsing modules and content
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * GET /api/content/modules
 * Get all modules
 */
router.get('/modules', async (req, res) => {
  try {
    const { gradeLevel, subject } = req.query;
    const response = await axios.get(`${BACKEND_URL}/content/modules`, {
      params: { gradeLevel, subject }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Get modules error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error fetching modules'
    });
  }
});

/**
 * GET /api/content/modules/:id
 * Get module by ID
 */
router.get('/modules/:id', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/content/modules/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Get module error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error fetching module'
    });
  }
});

module.exports = router;
