/**
 * KUNEO API GATEWAY
 * Routes requests to backend services with auth and rate limiting
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { authenticate } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/ratelimit');
const tutorRoutes = require('./routes/tutor');
const contentRoutes = require('./routes/content');
const progressRoutes = require('./routes/progress');
const recommendationsRoutes = require('./routes/recommendations');
const icfesRoutes = require('./routes/icfes');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('combined'));

// Apply rate limiting globally
app.use(rateLimiter);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kuneo-gateway', timestamp: new Date().toISOString() });
});

// Public routes (no auth)
app.use('/api/content', contentRoutes); // Module catalog browsing

// Protected routes (require auth)
app.use('/api/tutor', authenticate, tutorRoutes);
app.use('/api/progress', authenticate, progressRoutes);
app.use('/api/recommendations', authenticate, recommendationsRoutes);
app.use('/api/icfes', authenticate, icfesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚪 Kuneo Gateway running on port ${PORT}`);
  console.log(`🔗 Backend URL: ${process.env.BACKEND_URL}`);
});

module.exports = app;
