/**
 * PROGRESS SERVICE
 * Sistema de progresión cognitiva basado en dominio, no en puntos
 * Gestiona niveles cognitivos (Explorador → Autónomo) y avance por módulos
 */

const { db } = require('../../infrastructure/db/postgres');
const { aggregateMicroEvidence } = require('../evaluation/evaluationService');

/**
 * COGNITIVE LEVELS (1-5)
 * Niveles de desarrollo cognitivo del estudiante
 */
const COGNITIVE_LEVELS = {
  explorador: {
    level: 1,
    name: 'Explorador',
    description: 'Responde intuitivamente, necesita guía constante',
    min_avg_score: 0,
    max_avg_score: 39,
    characteristics: ['Respuestas vagas', 'Sin justificaciones', 'Necesita ejemplos']
  },
  constructor: {
    level: 2,
    name: 'Constructor',
    description: 'Empieza a explicar, usa representaciones básicas',
    min_avg_score: 40,
    max_avg_score: 54,
    characteristics: ['Explica conceptos', 'Usa ejemplos simples', 'Empieza a justificar']
  },
  analista: {
    level: 3,
    name: 'Analista',
    description: 'Conecta ideas, detecta errores, razona con evidencia',
    min_avg_score: 55,
    max_avg_score: 69,
    characteristics: ['Conecta ideas', 'Detecta errores', 'Justifica con evidencia']
  },
  aplicador: {
    level: 4,
    name: 'Aplicador',
    description: 'Transfiere conocimiento a nuevos contextos',
    min_avg_score: 70,
    max_avg_score: 84,
    characteristics: ['Transfiere conocimiento', 'Crea ejemplos propios', 'Aplica creativamente']
  },
  autonomo: {
    level: 5,
    name: 'Autónomo',
    description: 'Razona sin guía, explica con claridad, aprende de forma autónoma',
    min_avg_score: 85,
    max_avg_score: 100,
    characteristics: ['Razona autónomamente', 'Explica con claridad', 'Regula su aprendizaje']
  }
};

/**
 * Get user's module progress
 * @param {string} userId - User UUID
 * @param {string} moduleId - Optional module ID filter
 * @returns {Promise<Array|Object>} Progress record(s)
 */
async function getUserProgress(userId, moduleId = null) {
  let query = db.moduleProgress()
    .select('*')
    .eq('user_id', userId);

  if (moduleId) {
    query = query.eq('module_id', moduleId).single();
  }

  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Update module progress
 * @param {string} userId - User UUID
 * @param {string} moduleId - Module UUID
 * @param {Object} updates - Progress updates
 * @returns {Promise<Object>} Updated progress
 */
async function updateModuleProgress(userId, moduleId, updates) {
  const {
    status,
    score,
    timeSpent,
    incrementAttempts = false,
    currentPhase = null
  } = updates;

  // Get existing progress or create new
  const existing = await getUserProgress(userId, moduleId);

  const progressData = {
    user_id: userId,
    module_id: moduleId,
    status: status || existing?.status || 'in_progress',
    score: score !== undefined ? score : existing?.score,
    current_phase: currentPhase || existing?.current_phase || 'exploracion',
    time_spent_seconds: timeSpent !== undefined
      ? (existing?.time_spent_seconds || 0) + timeSpent
      : existing?.time_spent_seconds,
    attempts: incrementAttempts
      ? (existing?.attempts || 0) + 1
      : existing?.attempts || 0,
    started_at: existing?.started_at || new Date().toISOString(),
    completed_at: status === 'completed' ? new Date().toISOString() : existing?.completed_at
  };

  if (existing) {
    // Update existing
    const { data, error } = await db.moduleProgress()
      .update(progressData)
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw error;

    // Update cognitive profile based on completed modules
    if (status === 'completed') {
      await updateCognitiveLevelFromModules(userId);
    }

    return data;
  } else {
    // Insert new
    const { data, error } = await db.moduleProgress()
      .insert(progressData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Mark module as completed
 * Desbloquea siguiente fase o módulo si cumple criterios cognitivos
 * @param {string} userId - User UUID
 * @param {string} moduleId - Module UUID
 * @param {number} score - Final score
 * @returns {Promise<Object>} Updated progress
 */
async function completeModule(userId, moduleId, score) {
  return updateModuleProgress(userId, moduleId, {
    status: 'completed',
    score
  });
}

/**
 * Get cognitive profile with calculated level
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Cognitive profile with level
 */
async function getCognitiveProfile(userId) {
  const { data, error } = await db.cognitiveProfile()
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Profile doesn't exist, create default
    return await initializeCognitiveProfile(userId);
  }

  // Calculate cognitive level from dimensions
  const averageScore = (
    data.comprension +
    data.representacion +
    data.razonamiento +
    data.transferencia +
    data.metacognicion
  ) / 5;

  const cognitiveLevel = determineCognitiveLevel(averageScore);

  return {
    ...data,
    average_score: Math.round(averageScore),
    cognitive_level: data.cognitive_level || cognitiveLevel,
    level_details: COGNITIVE_LEVELS[data.cognitive_level || cognitiveLevel]
  };
}

/**
 * Initialize cognitive profile for new user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} New cognitive profile
 */
async function initializeCognitiveProfile(userId) {
  const { data, error } = await db.cognitiveProfile()
    .insert({
      user_id: userId,
      comprension: 50,
      representacion: 50,
      razonamiento: 50,
      transferencia: 50,
      metacognicion: 50,
      cognitive_level: 'explorador',
      total_evaluations: 0,
      total_modules_completed: 0,
      level_history: []
    })
    .select()
    .single();

  if (error) {
    console.error('Error initializing cognitive profile:', error);
    throw error;
  }

  return {
    ...data,
    average_score: 50,
    level_details: COGNITIVE_LEVELS.explorador
  };
}

/**
 * Determine cognitive level based on average score
 * @param {number} averageScore - Average score across dimensions (0-100)
 * @returns {string} Cognitive level key
 */
function determineCognitiveLevel(averageScore) {
  if (averageScore < 40) return 'explorador';
  if (averageScore < 55) return 'constructor';
  if (averageScore < 70) return 'analista';
  if (averageScore < 85) return 'aplicador';
  return 'autonomo';
}

/**
 * Update cognitive level from completed modules and evaluations
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Updated cognitive profile
 */
async function updateCognitiveLevelFromModules(userId) {
  const profile = await getCognitiveProfile(userId);
  
  // Aggregate micro-evidence from all evaluations
  const evidence = await aggregateMicroEvidence(userId);

  if (!evidence) return profile;

  // Update dimension scores with aggregated evidence
  const { data, error } = await db.cognitiveProfile()
    .update({
      comprension: evidence.comprension.average_score,
      representacion: evidence.representacion.average_score,
      razonamiento: evidence.razonamiento.average_score,
      transferencia: evidence.transferencia.average_score,
      metacognicion: evidence.metacognicion.average_score,
      total_modules_completed: profile.total_modules_completed + 1
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating cognitive level:', error);
    return profile;
  }

  // Check if level changed
  const newAverageScore = (
    evidence.comprension.average_score +
    evidence.representacion.average_score +
    evidence.razonamiento.average_score +
    evidence.transferencia.average_score +
    evidence.metacognicion.average_score
  ) / 5;

  const newLevel = determineCognitiveLevel(newAverageScore);

  if (newLevel !== profile.cognitive_level) {
    // Level up! Update level and add to history
    const levelHistory = profile.level_history || [];
    levelHistory.push({
      level: newLevel,
      achieved_at: new Date().toISOString(),
      modules_completed: profile.total_modules_completed + 1
    });

    await db.cognitiveProfile()
      .update({
        cognitive_level: newLevel,
        level_history: levelHistory
      })
      .eq('user_id', userId);

    console.log(`🎉 User ${userId} leveled up to ${newLevel}!`);
  }

  return data;
}

/**
 * Get progress summary for user with cognitive level
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Progress summary with cognitive insights
 */
async function getProgressSummary(userId) {
  const [progress, cognitiveProfile] = await Promise.all([
    getUserProgress(userId),
    getCognitiveProfile(userId)
  ]);

  const progressArray = Array.isArray(progress) ? progress : progress ? [progress] : [];

  const modulesInProgress = progressArray.filter(p => p.status === 'in_progress').length;
  const modulesCompleted = progressArray.filter(p => p.status === 'completed').length;
  const averageScore = progressArray
    .filter(p => p.score !== null && p.score !== undefined)
    .reduce((sum, p, _, arr) => arr.length > 0 ? sum + p.score / arr.length : 0, 0);

  return {
    total_modules: progressArray.length,
    modules_in_progress: modulesInProgress,
    modules_completed: modulesCompleted,
    average_score: Math.round(averageScore * 10) / 10,
    cognitive_profile: cognitiveProfile,
    cognitive_level: cognitiveProfile.cognitive_level,
    level_details: cognitiveProfile.level_details,
    recent_progress: progressArray.slice(0, 5)
  };
}

/**
 * Check if user can unlock next module
 * Criterio: dominio cognitivo, no puntos
 * @param {string} userId - User UUID
 * @param {string} nextModuleId - Module ID to check
 * @param {number} requiredLevel - Required cognitive level (1-5)
 * @returns {Promise<Object>} Unlock status
 */
async function canUnlockModule(userId, nextModuleId, requiredLevel = 2) {
  const profile = await getCognitiveProfile(userId);
  const userLevel = COGNITIVE_LEVELS[profile.cognitive_level].level;

  const canUnlock = userLevel >= requiredLevel;

  return {
    can_unlock: canUnlock,
    user_level: userLevel,
    user_level_name: profile.cognitive_level,
    required_level: requiredLevel,
    message: canUnlock
      ? '¡Puedes acceder a este módulo!'
      : `Necesitas alcanzar nivel ${requiredLevel} para desbloquear este módulo.`
  };
}

/**
 * Get recommended next action for user
 * Basado en perfil cognitivo y progreso
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Recommended action
 */
async function getRecommendedAction(userId) {
  const [profile, progress, evidence] = await Promise.all([
    getCognitiveProfile(userId),
    getUserProgress(userId),
    aggregateMicroEvidence(userId)
  ]);

  const progressArray = Array.isArray(progress) ? progress : progress ? [progress] : [];

  // Find weakest dimension
  const dimensions = ['comprension', 'representacion', 'razonamiento', 'transferencia', 'metacognicion'];
  const dimensionScores = dimensions.map(dim => ({
    dimension: dim,
    score: evidence?.[dim]?.average_score || profile[dim] || 50
  }));

  dimensionScores.sort((a, b) => a.score - b.score);
  const weakestDimension = dimensionScores[0];

  // Check for in-progress modules
  const inProgress = progressArray.find(p => p.status === 'in_progress');

  if (inProgress) {
    return {
      action: 'continue_module',
      module_id: inProgress.module_id,
      message: 'Continúa con el módulo que iniciaste',
      focus_dimension: weakestDimension.dimension,
      focus_score: weakestDimension.score
    };
  }

  // Recommend module that strengthens weakest dimension
  return {
    action: 'start_new_module',
    message: `Intenta un módulo que fortalezca tu ${weakestDimension.dimension}`,
    focus_dimension: weakestDimension.dimension,
    focus_score: weakestDimension.score,
    cognitive_level: profile.cognitive_level
  };
}

/**
 * Get cognitive level details
 * @param {string} levelKey - Level key (explorador, constructor, etc.)
 * @returns {Object} Level details
 */
function getCognitiveLevelDetails(levelKey) {
  return COGNITIVE_LEVELS[levelKey] || COGNITIVE_LEVELS.explorador;
}

module.exports = {
  getUserProgress,
  updateModuleProgress,
  completeModule,
  getCognitiveProfile,
  initializeCognitiveProfile,
  updateCognitiveLevelFromModules,
  getProgressSummary,
  canUnlockModule,
  getRecommendedAction,
  determineCognitiveLevel,
  getCognitiveLevelDetails,
  COGNITIVE_LEVELS
};
