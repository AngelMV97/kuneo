/**
 * RECOMMENDATION SERVICE
 * Generates personalized module and ICFES recommendations
 */

const { db } = require('../../infrastructure/db/postgres');
const { getCognitiveProfile } = require('../progress/progressService');

/**
 * Generate module recommendations for user
 * @param {string} userId - User UUID
 * @param {number} limit - Max recommendations
 * @returns {Promise<Array>} Recommended modules
 */
async function generateModuleRecommendations(userId, limit = 3) {
  try {
    // Get cognitive profile
    const cognitiveProfile = await getCognitiveProfile(userId);

    // Identify weakest dimension
    const dimensions = ['comprension', 'representacion', 'razonamiento', 'transferencia', 'metacognicion'];
    const weakestDimension = dimensions.reduce((min, dim) =>
      cognitiveProfile[dim] < cognitiveProfile[min] ? dim : min
    );

    // Get user's completed and in-progress modules
    const { data: progress } = await db.moduleProgress()
      .select('module_id, status')
      .eq('user_id', userId);

    const completedIds = (progress || []).filter(p => p.status === 'completed').map(p => p.module_id);
    const inProgressIds = (progress || []).filter(p => p.status === 'in_progress').map(p => p.module_id);

    // Get user profile for grade level
    const { data: profile } = await db.profiles()
      .select('grade_level')
      .eq('user_id', userId)
      .single();

    const gradeLevel = profile?.grade_level || 6;

    // Get suitable modules
    const { data: modules } = await db.modules()
      .select('*')
      .eq('grade_level', gradeLevel)
      .eq('is_active', true)
      .not('id', 'in', `(${[...completedIds, ...inProgressIds].join(',') || 'null'})`)
      .order('difficulty', { ascending: true });

    const recommendations = (modules || []).slice(0, limit).map(module => ({
      module,
      reason: `Recomendado para fortalecer ${weakestDimension}`,
      priority: calculatePriority(cognitiveProfile, weakestDimension, module.difficulty)
    }));

    // Save recommendations to DB
    await saveRecommendations(userId, recommendations);

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Generate ICFES recommendation
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} ICFES recommendation
 */
async function generateICFESRecommendation(userId) {
  try {
    // Check recent ICFES attempts
    const { data: recentAttempts } = await db.icfesAttempts()
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastAttempt = recentAttempts?.[0];
    const daysSinceLastAttempt = lastAttempt
      ? Math.floor((Date.now() - new Date(lastAttempt.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Recommend ICFES if >7 days since last attempt or score <70%
    if (daysSinceLastAttempt > 7 || (lastAttempt && lastAttempt.score < 70)) {
      const recommendation = {
        type: 'icfes',
        reason: lastAttempt && lastAttempt.score < 70
          ? `Mejora tu puntaje anterior (${lastAttempt.score}%)`
          : 'Practica con un simulacro ICFES',
        subject: lastAttempt?.subject || 'matematicas',
        priority: lastAttempt && lastAttempt.score < 60 ? 3 : 2
      };

      await saveRecommendations(userId, [recommendation]);
      return recommendation;
    }

    return null;
  } catch (error) {
    console.error('Error generating ICFES recommendation:', error);
    return null;
  }
}

/**
 * Calculate recommendation priority
 * @param {Object} cognitiveProfile - Cognitive profile
 * @param {string} weakestDimension - Weakest dimension
 * @param {number} moduleDifficulty - Module difficulty
 * @returns {number} Priority (1-5)
 */
function calculatePriority(cognitiveProfile, weakestDimension, moduleDifficulty) {
  const dimensionScore = cognitiveProfile[weakestDimension];

  if (dimensionScore < 40) return 5; // Highest priority
  if (dimensionScore < 60) return 4;
  if (moduleDifficulty <= 2) return 3;
  if (moduleDifficulty <= 4) return 2;
  return 1;
}

/**
 * Save recommendations to database
 * @param {string} userId - User UUID
 * @param {Array} recommendations - Recommendations
 * @returns {Promise}
 */
async function saveRecommendations(userId, recommendations) {
  const records = recommendations.map(rec => ({
    user_id: userId,
    type: rec.type || 'module',
    target_id: rec.module?.id || rec.target_id || null,
    reason: rec.reason,
    priority: rec.priority || 1
  }));

  const { error } = await db.recommendations().insert(records);

  if (error) {
    console.error('Error saving recommendations:', error);
  }
}

/**
 * Get active recommendations for user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Recommendations
 */
async function getActiveRecommendations(userId) {
  const { data, error } = await db.recommendations()
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('dismissed_at', null)
    .order('priority', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }

  return data || [];
}

/**
 * Dismiss recommendation
 * @param {string} userId - User UUID
 * @param {string} recommendationId - Recommendation UUID
 * @returns {Promise}
 */
async function dismissRecommendation(userId, recommendationId) {
  const { error } = await db.recommendations()
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', recommendationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error dismissing recommendation:', error);
  }
}

module.exports = {
  generateModuleRecommendations,
  generateICFESRecommendation,
  getActiveRecommendations,
  dismissRecommendation
};
