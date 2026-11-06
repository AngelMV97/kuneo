/**
 * POSTGRES CLIENT
 * Supabase PostgreSQL client configured for kuneo schema
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Create Supabase client with service role permissions
 * This client bypasses RLS policies and has full access
 */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'kuneo' // Default schema for all queries
  }
});

/**
 * Create a user-scoped client (for RLS-enforced operations)
 * @param {string} token - JWT token from authenticated user
 * @returns {Object} Scoped Supabase client
 */
function createUserClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    db: {
      schema: 'kuneo'
    }
  });
}

/**
 * Query builder helpers for kuneo schema tables
 */
const db = {
  profiles: () => supabase.from('kuneo.profiles'),
  modules: () => supabase.from('kuneo.modules'),
  sessions: () => supabase.from('kuneo.sessions'),
  messages: () => supabase.from('kuneo.messages'),
  moduleProgress: () => supabase.from('kuneo.module_progress'),
  cognitiveProfile: () => supabase.from('kuneo.cognitive_profile'),
  evaluations: () => supabase.from('kuneo.evaluations'),
  recommendations: () => supabase.from('kuneo.recommendations'),
  icfesAttempts: () => supabase.from('kuneo.icfes_attempts'),
  contentNodes: () => supabase.from('kuneo.content_nodes'),
  embeddings: () => supabase.from('kuneo.embeddings'),
  studentActivity: () => supabase.from('kuneo.student_activity')
};

/**
 * Transaction helper
 * Execute multiple operations in a transaction context
 * @param {Function} callback - Function containing transaction logic
 * @returns {Promise} Transaction result
 */
async function transaction(callback) {
  try {
    return await callback(supabase);
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

/**
 * Batch insert helper
 * @param {string} table - Table name
 * @param {Array} records - Array of records to insert
 * @returns {Promise} Insert result
 */
async function batchInsert(table, records) {
  if (!records || records.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from(`kuneo.${table}`)
    .insert(records)
    .select();

  if (error) {
    console.error(`Batch insert error for ${table}:`, error);
    throw error;
  }

  return { data, error };
}

/**
 * Get user profile by user_id
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User profile
 */
async function getUserProfile(userId) {
  const { data, error } = await db.profiles()
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw error;
  }

  return data;
}

/**
 * Get or create user profile
 * @param {string} userId - User UUID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} User profile
 */
async function getOrCreateProfile(userId, profileData = {}) {
  let profile = await getUserProfile(userId);

  if (!profile) {
    const { data, error } = await db.profiles()
      .insert({
        user_id: userId,
        grade_level: profileData.grade_level || 6,
        character_preference: 'tuko',
        onboarding_completed: false
      })
      .select()
      .single();

    if (error) throw error;
    profile = data;
  }

  return profile;
}

/**
 * Update cognitive profile dimension
 * Uses the stored procedure from schema
 * @param {string} userId - User UUID
 * @param {string} dimension - Cognitive dimension
 * @param {number} score - Score (0-100)
 * @returns {Promise}
 */
async function updateCognitiveDimension(userId, dimension, score) {
  const { error } = await supabase.rpc('update_cognitive_dimension', {
    p_user_id: userId,
    p_dimension: dimension,
    p_score: score
  });

  if (error) {
    console.error('Error updating cognitive dimension:', error);
    throw error;
  }
}

/**
 * Log student activity
 * @param {string} userId - User UUID
 * @param {string} eventType - Event type
 * @param {Object} payload - Event payload
 * @returns {Promise}
 */
async function logActivity(userId, eventType, payload = {}) {
  const { error } = await db.studentActivity()
    .insert({
      user_id: userId,
      event_type: eventType,
      payload
    });

  if (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging should not break main flow
  }
}

/**
 * Health check
 * @returns {Promise<boolean>} Connection status
 */
async function healthCheck() {
  try {
    const { error } = await supabase
      .from('kuneo.modules')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

module.exports = {
  supabase,
  db,
  createUserClient,
  transaction,
  batchInsert,
  getUserProfile,
  getOrCreateProfile,
  updateCognitiveDimension,
  logActivity,
  healthCheck
};
