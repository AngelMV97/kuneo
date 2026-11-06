/**
 * EVALUATION SERVICE
 * Sistema de micro-evidencias y evaluación invisible
 * Mide el desarrollo del pensamiento, no solo la corrección
 */

const { db, updateCognitiveDimension } = require('../../infrastructure/db/postgres');
const { evaluateResponse: llmEvaluate } = require('../../infrastructure/ai/llmClient');

/**
 * RUBRIC LEVELS (1-5) per dimension
 * Niveles cognitivos por dimensión
 */
const RUBRIC_LEVELS = {
  comprension: {
    1: { name: 'Superficial', description: 'Responde con ideas vagas o confusas' },
    2: { name: 'Básico', description: 'Identifica conceptos pero no los relaciona' },
    3: { name: 'Competente', description: 'Explica con propias palabras y ejemplos' },
    4: { name: 'Profundo', description: 'Conecta ideas y detecta implicaciones' },
    5: { name: 'Experto', description: 'Razona con claridad y transferencia' }
  },
  representacion: {
    1: { name: 'Sin modelo', description: 'No utiliza representaciones' },
    2: { name: 'Literal', description: 'Copia representaciones sin entender' },
    3: { name: 'Funcional', description: 'Crea representaciones básicas' },
    4: { name: 'Elaborado', description: 'Representaciones propias efectivas' },
    5: { name: 'Sofisticado', description: 'Representa conceptos complejos con precisión' }
  },
  razonamiento: {
    1: { name: 'Intuitivo', description: 'Responde por intuición sin justificación' },
    2: { name: 'Descriptivo', description: 'Describe pero no explica' },
    3: { name: 'Causal', description: 'Identifica causas y consecuencias' },
    4: { name: 'Analítico', description: 'Analiza y justifica con lógica' },
    5: { name: 'Deductivo', description: 'Razona con precisión y detecta errores' }
  },
  transferencia: {
    1: { name: 'Memorístico', description: 'Solo recuerda información' },
    2: { name: 'Contextual', description: 'Aplica en contexto original' },
    3: { name: 'Adaptativo', description: 'Aplica en contextos similares' },
    4: { name: 'Flexible', description: 'Transfiere a nuevos contextos' },
    5: { name: 'Creativo', description: 'Crea nuevas aplicaciones' }
  },
  metacognicion: {
    1: { name: 'Inconsciente', description: 'No reflexiona sobre su proceso' },
    2: { name: 'Emergente', description: 'Empieza a notar errores' },
    3: { name: 'Consciente', description: 'Identifica lo que sabe/no sabe' },
    4: { name: 'Regulado', description: 'Ajusta estrategias de aprendizaje' },
    5: { name: 'Autorregulado', description: 'Aprende de forma autónoma' }
  }
};

/**
 * Evaluate student response with micro-evidence tracking
 * Sistema de evaluación invisible sin calificaciones explícitas
 * @param {string} question - Original question
 * @param {string} expectedAnswer - Expected answer (optional)
 * @param {string} studentResponse - Student's response
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Evaluation result with micro-evidence
 */
async function evaluateStudentResponse(question, expectedAnswer, studentResponse, context = {}) {
  const {
    useAI = true,
    dimension = 'comprension',
    phase = 'exploration',
    difficulty = 2,
    userId = null,
    moduleId = null,
    sessionId = null
  } = context;

  try {
    let evaluation;

    if (useAI) {
      // Use LLM for micro-evidence evaluation
      evaluation = await llmMicroEvidenceEvaluate(
        question,
        expectedAnswer,
        studentResponse,
        dimension,
        phase,
        difficulty
      );
    } else {
      // Use keyword-based evaluation (fallback)
      evaluation = keywordEvaluation(expectedAnswer, studentResponse, dimension);
    }

    // Determine rubric level based on score and signals
    const rubricLevel = determineRubricLevel(evaluation.score, evaluation.signals, dimension);

    // Create micro-evidence object
    const microEvidence = {
      dimension,
      rubric_level: rubricLevel,
      score: evaluation.score,
      evidence: {
        user_response: studentResponse,
        expected: expectedAnswer || null,
        error_type: evaluation.error_type,
        signals: evaluation.signals, // Array of detected cognitive signals
        feedback: evaluation.feedback
      },
      question_context: {
        phase,
        difficulty,
        type: evaluation.question_type || 'open'
      }
    };

    // Save to database if user context provided
    if (userId && moduleId) {
      await saveEvaluation(userId, moduleId, sessionId, microEvidence);
    }

    // Return evaluation with invisible feedback (no explicit grades)
    return {
      ...evaluation,
      rubric_level: rubricLevel,
      dimension,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Evaluation error:', error);
    return {
      is_correct: false,
      is_partial: false,
      score: 0,
      rubric_level: 1,
      error_type: 'evaluation_failed',
      feedback: 'No se pudo evaluar la respuesta. Por favor, intenta de nuevo.',
      signals: [],
      dimension: dimension
    };
  }
}

/**
 * LLM-based micro-evidence evaluation
 * Evalúa señales cognitivas (no solo corrección)
 * @param {string} question - Question text
 * @param {string} expectedAnswer - Expected answer
 * @param {string} studentResponse - Student response
 * @param {string} dimension - Cognitive dimension
 * @param {string} phase - Module phase
 * @param {number} difficulty - Difficulty level
 * @returns {Promise<Object>} Evaluation with signals
 */
async function llmMicroEvidenceEvaluate(question, expectedAnswer, studentResponse, dimension, phase, difficulty) {
  // Build evaluation prompt with dimension focus
  const evaluationPrompt = `
Evalúa la siguiente respuesta del estudiante buscando MICRO-EVIDENCIAS de ${dimension}.

PREGUNTA: ${question}
${expectedAnswer ? `RESPUESTA ESPERADA: ${expectedAnswer}` : ''}
RESPUESTA DEL ESTUDIANTE: ${studentResponse}

Analiza la respuesta buscando señales de:
${getDimensionSignals(dimension)}

Devuelve un JSON con:
{
  "score": [0-100],
  "signals": ["señal_1", "señal_2", ...],
  "error_type": "tipo de error o null",
  "feedback": "feedback cualitativo sin calificación explícita",
  "question_type": "open|closed|socratic"
}

Reglas:
- NO uses frases como "Correcto", "Incorrecto", "50%", "Bien hecho"
- USA feedback cualitativo: "Veo que...", "Noté que...", "Podrías ampliar..."
- DETECTA señales cognitivas, no solo corrección
  `;

  try {
    const evaluation = await llmEvaluate(evaluationPrompt);
    return evaluation;
  } catch (error) {
    console.error('LLM evaluation failed:', error);
    // Fallback to keyword evaluation
    return keywordEvaluation(expectedAnswer, studentResponse, dimension);
  }
}

/**
 * Get dimension-specific signals to look for
 * @param {string} dimension - Cognitive dimension
 * @returns {string} Signals description
 */
function getDimensionSignals(dimension) {
  const signals = {
    comprension: `
- Usa sus propias palabras
- Da ejemplos propios
- Identifica ideas clave
- Confunde conceptos
- Respuesta vaga`,
    representacion: `
- Usa diagramas o analogías
- Menciona visualizaciones
- Describe procesos paso a paso
- Usa metáforas
- Solo texto sin estructura`,
    razonamiento: `
- Justifica con "porque..."
- Identifica causa-efecto
- Detecta errores lógicos
- Razona sin guía
- Respuesta intuitiva sin justificación`,
    transferencia: `
- Aplica a situaciones nuevas
- Conecta con experiencias previas
- Crea ejemplos originales
- Solo repite lo aprendido
- Limitado al contexto original`,
    metacognicion: `
- Reconoce lo que no entiende
- Explica su proceso de pensamiento
- Identifica sus errores
- Ajusta estrategia
- No reflexiona sobre su aprendizaje`
  };

  return signals[dimension] || signals.comprension;
}

/**
 * Determine rubric level (1-5) based on score and signals
 * @param {number} score - Numeric score (0-100)
 * @param {Array} signals - Detected signals
 * @param {string} dimension - Cognitive dimension
 * @returns {number} Rubric level (1-5)
 */
function determinRubricLevel(score, signals = [], dimension) {
  // Base level on score
  let level;
  if (score < 30) level = 1;
  else if (score < 50) level = 2;
  else if (score < 70) level = 3;
  else if (score < 85) level = 4;
  else level = 5;

  // Adjust based on signals
  // TODO: Implement signal-based adjustment logic

  return Math.max(1, Math.min(5, level));
}

/**
 * Keyword-based evaluation (fallback when AI unavailable)
 * @param {string} expectedAnswer - Expected answer
 * @param {string} studentResponse - Student response
 * @param {string} dimension - Cognitive dimension
 * @returns {Object} Evaluation result
 */
function keywordEvaluation(expectedAnswer, studentResponse, dimension = 'comprension') {
  // Normalize texts
  const normalize = (text) => text.toLowerCase().trim().replace(/\s+/g, ' ');
  const expected = normalize(expectedAnswer || '');
  const response = normalize(studentResponse);

  // Detect non-answers
  const nonAnswers = ['no sé', 'nose', 'no lo sé', 'no idea', 'nada', '???', 'test', 'prueba'];
  const isNonAnswer = nonAnswers.some(na => response.includes(na));

  if (isNonAnswer || response.length < 3) {
    return {
      is_correct: false,
      is_partial: false,
      score: 0,
      rubric_level: 1,
      error_type: 'non_answer',
      feedback: '¿Podrías intentar responder con más detalle? Cuéntame qué piensas.',
      signals: ['non_answer'],
      question_type: 'open'
    };
  }

  if (!expectedAnswer || expected.length === 0) {
    // No expected answer - evaluate based on response length and structure
    const hasExamples = /ejemplo|por ejemplo|como|tal como/.test(response);
    const hasJustification = /porque|ya que|debido|razón/.test(response);
    const wordCount = response.split(/\s+/).length;

    let score = 50; // Base score
    if (wordCount > 20) score += 15;
    if (hasExamples) score += 15;
    if (hasJustification) score += 20;

    return {
      is_correct: null,
      is_partial: null,
      score: Math.min(100, score),
      rubric_level: determineRubricLevel(score, [], dimension),
      error_type: null,
      feedback: hasJustification
        ? 'Veo que justificas tu respuesta. ¿Podrías dar un ejemplo?'
        : 'Interesante. ¿Por qué piensas eso?',
      signals: [
        wordCount > 20 ? 'elaborated' : 'brief',
        hasExamples ? 'has_examples' : 'no_examples',
        hasJustification ? 'has_justification' : 'no_justification'
      ],
      question_type: 'open'
    };
  }

  // Extract keywords from expected answer
  const expectedWords = expected.split(/\s+/).filter(w => w.length > 2);
  const responseWords = response.split(/\s+/).filter(w => w.length > 2);

  if (expectedWords.length === 0) {
    return {
      is_correct: false,
      is_partial: false,
      score: 0,
      rubric_level: 1,
      error_type: 'invalid_expected_answer',
      feedback: 'No se pudo evaluar. Consulta con tu tutor.',
      signals: ['invalid_expected'],
      question_type: 'closed'
    };
  }

  // Calculate match percentage
  const matches = expectedWords.filter(ew =>
    responseWords.some(rw => rw.includes(ew) || ew.includes(rw))
  );

  const matchPercentage = matches.length / expectedWords.length;
  const score = Math.round(matchPercentage * 100);

  // Determine correctness
  const is_correct = matchPercentage >= 0.7;
  const is_partial = !is_correct && matchPercentage >= 0.4;

  // Generate invisible feedback (no explicit grades)
  let feedback;
  if (is_correct) {
    feedback = 'Veo que captas la idea central. ¿Podrías explicarlo de otra manera?';
  } else if (is_partial) {
    feedback = 'Vas por buen camino. ¿Qué más crees que hace falta?';
  } else {
    feedback = 'Pensemos juntos. ¿Qué entiendes por...?';
  }

  return {
    is_correct,
    is_partial,
    score,
    rubric_level: determineRubricLevel(score, [], dimension),
    error_type: is_correct ? null : (is_partial ? 'incomplete' : 'incorrect'),
    feedback,
    signals: [
      is_correct ? 'correct' : is_partial ? 'partial' : 'incorrect',
      `match_${Math.round(matchPercentage * 10) * 10}` // match_70, match_40, etc.
    ],
    question_type: 'closed'
  };
}

/**
 * Save micro-evidence evaluation to database
 * @param {string} userId - User UUID
 * @param {string} moduleId - Module UUID
 * @param {string} sessionId - Session UUID (optional)
 * @param {Object} microEvidence - Micro-evidence object
 * @returns {Promise<Object>} Saved evaluation
 */
async function saveEvaluation(userId, moduleId, sessionId, microEvidence) {
  const { data, error } = await db.evaluations()
    .insert({
      user_id: userId,
      module_id: moduleId,
      session_id: sessionId || null,
      dimension: microEvidence.dimension,
      rubric_level: microEvidence.rubric_level,
      score: microEvidence.score,
      evidence: microEvidence.evidence,
      question_context: microEvidence.question_context
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving evaluation:', error);
    throw error;
  }

  // Update cognitive profile asynchronously with rubric level
  updateCognitiveDimension(
    userId,
    microEvidence.dimension,
    microEvidence.score,
    microEvidence.rubric_level
  ).catch(err => console.error('Error updating cognitive profile:', err));

  return data;
}

/**
 * Get evaluations for user (micro-evidence history)
 * @param {string} userId - User UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Evaluations with micro-evidence
 */
async function getUserEvaluations(userId, filters = {}) {
  let query = db.evaluations()
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.moduleId) {
    query = query.eq('module_id', filters.moduleId);
  }

  if (filters.dimension) {
    query = query.eq('dimension', filters.dimension);
  }

  if (filters.rubricLevel) {
    query = query.eq('rubric_level', filters.rubricLevel);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching evaluations:', error);
    return [];
  }

  return data || [];
}

/**
 * Aggregate micro-evidence by dimension
 * Calcula promedios ponderados por dimensión
 * @param {string} userId - User UUID
 * @param {string} moduleId - Module UUID (optional)
 * @returns {Promise<Object>} Aggregated evidence by dimension
 */
async function aggregateMicroEvidence(userId, moduleId = null) {
  let query = db.evaluations()
    .select('dimension, score, rubric_level, created_at')
    .eq('user_id', userId);

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error aggregating evidence:', error);
    return null;
  }

  // Group by dimension
  const dimensions = ['comprension', 'representacion', 'razonamiento', 'transferencia', 'metacognicion'];
  const aggregated = {};

  dimensions.forEach(dim => {
    const dimData = data.filter(e => e.dimension === dim);
    if (dimData.length === 0) {
      aggregated[dim] = { average_score: 50, count: 0, latest_rubric: 2 };
      return;
    }

    // Calculate weighted average (more recent evaluations weigh more)
    const weights = dimData.map((_, i) => Math.exp(-i * 0.1)); // Exponential decay
    const weightedSum = dimData.reduce((sum, e, i) => sum + e.score * weights[i], 0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const averageScore = Math.round(weightedSum / totalWeight);

    // Get latest rubric level
    const latestRubric = dimData[0].rubric_level;

    aggregated[dim] = {
      average_score: averageScore,
      count: dimData.length,
      latest_rubric: latestRubric
    };
  });

  return aggregated;
}

/**
 * Get rubric level description
 * @param {string} dimension - Cognitive dimension
 * @param {number} level - Rubric level (1-5)
 * @returns {Object} Rubric level description
 */
function getRubricDescription(dimension, level) {
  return RUBRIC_LEVELS[dimension]?.[level] || {
    name: 'Desconocido',
    description: 'Nivel no definido'
  };
}

module.exports = {
  evaluateStudentResponse,
  keywordEvaluation,
  saveEvaluation,
  getUserEvaluations,
  aggregateMicroEvidence,
  getRubricDescription,
  RUBRIC_LEVELS
};
