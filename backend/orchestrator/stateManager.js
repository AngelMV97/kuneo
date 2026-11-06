/**
 * STATE MANAGER
 * Manages session state for learning interactions
 */

const { db } = require('../infrastructure/db/postgres');

// In-memory cache for active sessions (optional optimization)
const sessionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get session state
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Object>} Session state
 */
async function getSessionState(sessionId) {
  // Check cache first
  if (sessionCache.has(sessionId)) {
    const cached = sessionCache.get(sessionId);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.state;
    }
    sessionCache.delete(sessionId);
  }

  // Fetch from database
  const { data, error } = await db.sessions()
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    // Session doesn't exist
    return createDefaultState();
  }

  const state = {
    ...data.state,
    session_id: data.id,
    user_id: data.user_id,
    module_id: data.module_id,
    status: data.status,
    started_at: data.started_at
  };

  // Cache it
  sessionCache.set(sessionId, {
    state,
    timestamp: Date.now()
  });

  return state;
}

/**
 * Update session state
 * @param {string} sessionId - Session UUID
 * @param {Object} updates - State updates
 * @returns {Promise}
 */
async function updateSessionState(sessionId, updates) {
  // Get current state
  const currentState = await getSessionState(sessionId);

  // Merge updates
  const newState = {
    ...currentState,
    ...updates
  };

  // Update in database
  const { error } = await db.sessions()
    .update({
      state: newState,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session state:', error);
    throw error;
  }

  // Update cache
  sessionCache.set(sessionId, {
    state: newState,
    timestamp: Date.now()
  });

  return newState;
}

/**
 * Create new session
 * @param {string} userId - User UUID
 * @param {string} moduleId - Module UUID
 * @param {Object} initialState - Initial state
 * @returns {Promise<Object>} Created session
 */
async function createSession(userId, moduleId, initialState = {}) {
  const state = {
    ...createDefaultState(),
    ...initialState
  };

  const { data, error } = await db.sessions()
    .insert({
      user_id: userId,
      module_id: moduleId,
      state,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data;
}

/**
 * Complete session
 * @param {string} sessionId - Session UUID
 * @returns {Promise}
 */
async function completeSession(sessionId) {
  const { error } = await db.sessions()
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error completing session:', error);
    throw error;
  }

  // Clear from cache
  sessionCache.delete(sessionId);
}

/**
 * Pause session
 * @param {string} sessionId - Session UUID
 * @returns {Promise}
 */
async function pauseSession(sessionId) {
  const { error } = await db.sessions()
    .update({ status: 'paused' })
    .eq('id', sessionId);

  if (error) {
    console.error('Error pausing session:', error);
    throw error;
  }

  // Clear from cache
  sessionCache.delete(sessionId);
}

/**
 * Resume session
 * @param {string} sessionId - Session UUID
 * @returns {Promise}
 */
async function resumeSession(sessionId) {
  const { error } = await db.sessions()
    .update({ status: 'active' })
    .eq('id', sessionId);

  if (error) {
    console.error('Error resuming session:', error);
    throw error;
  }

  // Clear cache to force refresh
  sessionCache.delete(sessionId);
}

/**
 * Create default session state
 * @returns {Object} Default state
 */
function createDefaultState() {
  return {
    current_phase: 'exploration',
    current_step: 0,
    current_question: null,
    expected_answer: null,
    current_dimension: 'comprension',
    steps_in_phase: 3,
    attempts_on_current: 0,
    hints_used: 0,
    last_interaction: new Date().toISOString(),
    context: {}
  };
}

/**
 * Save message to session
 * @param {string} sessionId - Session UUID
 * @param {string} role - Message role (user/tutor)
 * @param {string} content - Message content
 * @param {Object} metadata - Optional metadata
 * @returns {Promise}
 */
async function saveMessage(sessionId, role, content, metadata = {}) {
  const { error } = await db.messages()
    .insert({
      session_id: sessionId,
      role,
      content,
      metadata
    });

  if (error) {
    console.error('Error saving message:', error);
    // Don't throw - message saving should not break main flow
  }
}

/**
 * Clear session cache (for maintenance)
 */
function clearCache() {
  sessionCache.clear();
}

module.exports = {
  getSessionState,
  updateSessionState,
  createSession,
  completeSession,
  pauseSession,
  resumeSession,
  saveMessage,
  clearCache
};
