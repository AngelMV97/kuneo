/**
 * ICFES SERVICE
 * Manages ICFES mock tests generation and evaluation
 */

const { db } = require('../../infrastructure/db/postgres');
const { generateExercises } = require('../../infrastructure/ai/llmClient');

/**
 * Generate ICFES mock test
 * @param {string} subject - Subject (matematicas, lectura_critica, ciencias, sociales, ingles)
 * @param {number} questionCount - Number of questions (default: 20)
 * @returns {Promise<Array>} Test questions
 */
async function generateICFESTest(subject, questionCount = 20) {
  const competencies = getCompetenciesBySubject(subject);

  try {
    const questions = [];
    const questionsPerCompetency = Math.ceil(questionCount / competencies.length);

    for (const competency of competencies) {
      const competencyQuestions = await generateExercises(
        subject,
        competency,
        3, // Medium difficulty
        questionsPerCompetency
      );

      questions.push(...competencyQuestions.map(q => ({
        ...q,
        competency,
        subject
      })));
    }

    return questions.slice(0, questionCount);
  } catch (error) {
    console.error('Error generating ICFES test:', error);
    return generateMockICFESQuestions(subject, questionCount);
  }
}

/**
 * Save ICFES attempt
 * @param {string} userId - User UUID
 * @param {string} subject - Subject
 * @param {Array} answers - User answers
 * @param {Array} questions - Test questions
 * @param {number} durationSeconds - Duration in seconds
 * @returns {Promise<Object>} Saved attempt with results
 */
async function saveICFESAttempt(userId, subject, answers, questions, durationSeconds) {
  // Evaluate answers
  const evaluatedAnswers = answers.map((answer, index) => {
    const question = questions[index];
    const isCorrect = answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    return {
      ...answer,
      is_correct: isCorrect,
      competency: question.competency,
      difficulty: question.difficulty || 3
    };
  });

  const correctCount = evaluatedAnswers.filter(a => a.is_correct).length;
  const score = Math.round((correctCount / questions.length) * 100);

  // Calculate breakdown by competency
  const breakdown = calculateBreakdown(evaluatedAnswers);

  // Save attempt
  const { data, error } = await db.icfesAttempts()
    .insert({
      user_id: userId,
      subject,
      total_questions: questions.length,
      correct_answers: correctCount,
      score,
      breakdown,
      duration_seconds: durationSeconds,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving ICFES attempt:', error);
    throw error;
  }

  return {
    ...data,
    answers: evaluatedAnswers
  };
}

/**
 * Get user's ICFES attempts
 * @param {string} userId - User UUID
 * @param {string} subject - Optional subject filter
 * @returns {Promise<Array>} Attempts
 */
async function getUserICFESAttempts(userId, subject = null) {
  let query = db.icfesAttempts()
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (subject) {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching ICFES attempts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get competencies by subject
 * @param {string} subject - Subject
 * @returns {Array<string>} Competencies
 */
function getCompetenciesBySubject(subject) {
  const competenciesMap = {
    matematicas: ['razonamiento_cuantitativo', 'resolucion_problemas', 'modelacion'],
    lectura_critica: ['comprension_literal', 'inferencia', 'critica'],
    ciencias: ['uso_conocimiento', 'explicacion_fenomenos', 'indagacion'],
    sociales: ['interpretacion', 'argumentacion', 'proposicion'],
    ingles: ['reading_comprehension', 'vocabulary', 'grammar']
  };

  return competenciesMap[subject] || ['general'];
}

/**
 * Calculate breakdown by competency and difficulty
 * @param {Array} evaluatedAnswers - Evaluated answers
 * @returns {Object} Breakdown
 */
function calculateBreakdown(evaluatedAnswers) {
  const byCompetency = {};
  const byDifficulty = {};

  evaluatedAnswers.forEach(answer => {
    // By competency
    if (!byCompetency[answer.competency]) {
      byCompetency[answer.competency] = { correct: 0, total: 0 };
    }
    byCompetency[answer.competency].total++;
    if (answer.is_correct) {
      byCompetency[answer.competency].correct++;
    }

    // By difficulty
    const diff = answer.difficulty || 3;
    if (!byDifficulty[diff]) {
      byDifficulty[diff] = { correct: 0, total: 0 };
    }
    byDifficulty[diff].total++;
    if (answer.is_correct) {
      byDifficulty[diff].correct++;
    }
  });

  return {
    by_competency: byCompetency,
    by_difficulty: byDifficulty
  };
}

/**
 * Generate mock ICFES questions (fallback)
 * @param {string} subject - Subject
 * @param {number} count - Question count
 * @returns {Array} Mock questions
 */
function generateMockICFESQuestions(subject, count) {
  const competencies = getCompetenciesBySubject(subject);

  return Array.from({ length: count }, (_, i) => ({
    type: 'multiple_choice',
    question: `Pregunta ${i + 1} de ${subject}`,
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'A',
    explanation: 'Explicación...',
    competency: competencies[i % competencies.length],
    subject,
    difficulty: Math.floor(i / (count / 3)) + 1
  }));
}

module.exports = {
  generateICFESTest,
  saveICFESAttempt,
  getUserICFESAttempts,
  getCompetenciesBySubject
};
