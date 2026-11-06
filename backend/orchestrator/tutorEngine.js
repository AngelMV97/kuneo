/**
 * TUTOR ENGINE ⭐
 * Main orchestrator - handles all tutor interactions
 * This is the heart of Kuneo's cognitive tutoring system
 */

const { createTutorResponse } = require('../../shared/contracts/tutorResponse');
const { getStateByContext } = require('../../shared/ui-schema/characterStates');
const { decide } = require('./decisionEngine');
const { buildPrompt } = require('./promptBuilder');
const { getSessionState, updateSessionState } = require('./stateManager');

const { generateTutorResponse } = require('../infrastructure/ai/llmClient');
const { generateQueryEmbedding } = require('../infrastructure/ai/embeddingClient');
const { searchSimilar } = require('../infrastructure/vector/vectorClient');
const { evaluateStudentResponse, saveEvaluation } = require('../services/evaluation/evaluationService');
const { updateModuleProgress } = require('../services/progress/progressService');
const { logActivity } = require('../infrastructure/db/postgres');

/**
 * Handle user interaction
 * Main entry point for all tutor interactions
 * @param {Object} input - User input
 * @returns {Promise<Object>} TutorResponse
 */
async function handleInteraction(input) {
  const {
    user_id,
    session_id,
    module_id,
    user_message,
    user_action = null,
    context = {}
  } = input;

  try {
    // 1. Get session state
    const sessionState = await getSessionState(session_id);

    // 2. If user provided a response, evaluate it
    let evaluation = null;
    if (user_message && sessionState.current_question) {
      evaluation = await evaluateStudentResponse(
        sessionState.current_question,
        sessionState.expected_answer || '',
        user_message,
        { dimension: sessionState.current_dimension || 'comprension' }
      );

      // Save evaluation
      await saveEvaluation(user_id, module_id, session_id, evaluation);

      // Update progress
      await updateModuleProgress(user_id, module_id, {
        timeSpent: Math.floor((Date.now() - new Date(sessionState.last_interaction).getTime()) / 1000)
      });
    }

    // 3. Decide next step based on evaluation and state
    const nextStep = decide({
      sessionState,
      evaluation,
      userAction: user_action,
      context
    });

    // 4. Get relevant context via RAG (if needed)
    let ragContext = '';
    if (nextStep.useRAG && user_message) {
      const embedding = await generateQueryEmbedding(user_message);
      const similarContent = await searchSimilar(embedding, {
        limit: 3,
        threshold: 0.7,
        subject: context.subject,
        gradeLevel: context.gradeLevel
      });

      ragContext = similarContent
        .map(item => item.content_text)
        .join('\n\n')
        .substring(0, 1500);
    }

    // 5. Build prompt for LLM
    const { systemPrompt, conversationHistory } = await buildPrompt({
      userId: user_id,
      sessionId: session_id,
      moduleId: module_id,
      phase: nextStep.phase,
      evaluation,
      context: {
        ...context,
        gradeLevel: context.gradeLevel || 6
      }
    });

    // 6. Generate tutor response
    const llmResponse = await generateTutorResponse(
      systemPrompt,
      conversationHistory,
      user_message || nextStep.defaultPrompt || 'Continuar',
      ragContext
    );

    // 7. Determine character state
    const characterState = determineCharacterState(evaluation, nextStep);

    // 8. Build UI response
    const tutorResponse = buildUIResponse({
      message: llmResponse.answer,
      characterState,
      suggestions: llmResponse.suggestions,
      nextStep,
      evaluation
    });

    // 9. Update session state
    await updateSessionState(session_id, {
      current_step: nextStep.step,
      current_phase: nextStep.phase,
      current_question: nextStep.question || null,
      expected_answer: nextStep.expectedAnswer || null,
      current_dimension: nextStep.dimension || 'comprension',
      last_interaction: new Date().toISOString()
    });

    // 10. Log activity
    await logActivity(user_id, 'tutor_interaction', {
      session_id,
      module_id,
      step: nextStep.step,
      evaluation: evaluation ? {
        is_correct: evaluation.is_correct,
        score: evaluation.comprehension_score
      } : null
    });

    return tutorResponse;
  } catch (error) {
    console.error('TutorEngine error:', error);
    return createErrorResponse(error);
  }
}

/**
 * Determine character state based on context
 * @param {Object} evaluation - Evaluation result
 * @param {Object} nextStep - Next step decision
 * @returns {string} Character state
 */
function determineCharacterState(evaluation, nextStep) {
  if (evaluation) {
    if (evaluation.is_correct) return 'correct';
    if (evaluation.is_partial) return 'encouraging';
    return 'incorrect';
  }

  if (nextStep.giveHint) return 'hint';
  if (nextStep.phase === 'reflection') return 'reflection';
  if (nextStep.waitingForResponse) return 'thinking';

  return 'idle';
}

/**
 * Build UI response structure
 * @param {Object} params - Response parameters
 * @returns {Object} TutorResponse
 */
function buildUIResponse({ message, characterState, suggestions, nextStep, evaluation }) {
  const ui_elements = [
    { type: 'bubble', props: { variant: 'tutor' } }
  ];

  const actions = [];

  // Add input or options based on next step
  if (nextStep.expectsInput) {
    ui_elements.push({
      type: 'input',
      props: { placeholder: 'Escribe tu respuesta...' }
    });
    actions.push({
      id: 'submit_response',
      type: 'submit',
      label: 'Enviar',
      value: null
    });
  } else if (nextStep.options) {
    ui_elements.push({
      type: 'options',
      props: { options: nextStep.options }
    });
    nextStep.options.forEach((opt, idx) => {
      actions.push({
        id: `option_${idx}`,
        type: 'option',
        label: opt.label,
        value: opt.value
      });
    });
  }

  // Add hint action if available
  if (nextStep.hintAvailable) {
    actions.push({
      id: 'request_hint',
      type: 'hint',
      label: 'Dame una pista',
      value: 'hint'
    });
  }

  // Add suggested questions as actions
  if (suggestions && suggestions.length > 0) {
    suggestions.forEach((suggestion, idx) => {
      actions.push({
        id: `suggestion_${idx}`,
        type: 'suggestion',
        label: suggestion,
        value: suggestion
      });
    });
  }

  return createTutorResponse({
    character_state: characterState,
    message,
    ui_elements,
    actions,
    metadata: {
      evaluation: evaluation ? {
        is_correct: evaluation.is_correct,
        score: evaluation.comprehension_score
      } : null,
      phase: nextStep.phase,
      step: nextStep.step
    }
  });
}

/**
 * Create error response
 * @param {Error} error - Error object
 * @returns {Object} TutorResponse
 */
function createErrorResponse(error) {
  return createTutorResponse({
    character_state: 'idle',
    message: 'Ups, algo no salió bien. ¿Podemos intentar de nuevo?',
    ui_elements: [
      { type: 'bubble', props: { variant: 'system' } }
    ],
    actions: [
      { id: 'retry', type: 'option', label: 'Reintentar', value: 'retry' }
    ],
    metadata: {
      error: error.message
    }
  });
}

module.exports = {
  handleInteraction
};
