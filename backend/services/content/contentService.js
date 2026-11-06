/**
 * CONTENT SERVICE
 * Manages modules and content nodes retrieval
 */

const { db } = require('../../infrastructure/db/postgres');

/**
 * Get all active modules for a grade level
 * @param {number} gradeLevel - Grade level (1-11)
 * @param {string} subject - Optional subject filter
 * @returns {Promise<Array>} Modules
 */
async function getModules(gradeLevel, subject = null) {
  let query = db.modules()
    .select('*')
    .eq('grade_level', gradeLevel)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (subject) {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get module by ID
 * @param {string} moduleId - Module UUID
 * @returns {Promise<Object>} Module
 */
async function getModuleById(moduleId) {
  const { data, error } = await db.modules()
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Get content nodes for module
 * @param {string} subject - Subject
 * @param {number} gradeLevel - Grade level
 * @param {Object} options - Additional filters
 * @returns {Promise<Array>} Content nodes
 */
async function getContentNodes(subject, gradeLevel, options = {}) {
  let query = db.contentNodes()
    .select('*')
    .eq('subject', subject)
    .eq('grade_level', gradeLevel)
    .eq('is_active', true);

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.tags) {
    query = query.contains('tags', options.tags);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching content nodes:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get content node by ID
 * @param {string} contentId - Content UUID
 * @returns {Promise<Object>} Content node
 */
async function getContentById(contentId) {
  const { data, error } = await db.contentNodes()
    .select('*')
    .eq('id', contentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Search content by keywords
 * @param {string} keywords - Search keywords
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Matching content
 */
async function searchContent(keywords, filters = {}) {
  let query = db.contentNodes()
    .select('*')
    .eq('is_active', true)
    .textSearch('title', keywords);

  if (filters.subject) {
    query = query.eq('subject', filters.subject);
  }

  if (filters.gradeLevel) {
    query = query.eq('grade_level', filters.gradeLevel);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching content:', error);
    return [];
  }

  return data || [];
}

/**
 * Get recommended modules for user
 * @param {string} userId - User UUID
 * @param {number} gradeLevel - Grade level
 * @returns {Promise<Array>} Recommended modules
 */
async function getRecommendedModules(userId, gradeLevel) {
  // Get user's completed modules
  const { data: progress } = await db.moduleProgress()
    .select('module_id, status')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const completedModuleIds = (progress || []).map(p => p.module_id);

  // Get all modules for grade level
  const allModules = await getModules(gradeLevel);

  // Filter out completed modules
  const notCompleted = allModules.filter(m => !completedModuleIds.includes(m.id));

  // Sort by difficulty (start with easier)
  notCompleted.sort((a, b) => a.difficulty - b.difficulty);

  return notCompleted.slice(0, 5);
}

module.exports = {
  getModules,
  getModuleById,
  getContentNodes,
  getContentById,
  searchContent,
  getRecommendedModules
};
