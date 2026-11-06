/**
 * DECISION ENGINE
 * Sistema de decisión pedagógica basado en micro-evidencias y 5 fases cognitivas
 * Decide el siguiente paso en el proceso de aprendizaje
 */

/**
 * MODULE PHASES (5-phase cognitive progression)
 * Fases del módulo basadas en dimensiones cognitivas
 */
const MODULE_PHASES = {
  exploracion: {
    id: 'exploracion',
    name: 'Exploración',
    dimension: 'comprension',
    goal: 'Entender conceptos básicos',
    steps_required: 3,
    next_phase: 'representacion'
  },
  representacion: {
    id: 'representacion',
    name: 'Representación',
    dimension: 'representacion',
    goal: 'Modelar y visualizar conceptos',
    steps_required: 3,
    next_phase: 'refinamiento'
  },
  refinamiento: {
    id: 'refinamiento',
    name: 'Refinamiento',
    dimension: 'razonamiento',
    goal: 'Razonar con evidencia',
    steps_required: 4,
    next_phase: 'aplicacion'
  },
  aplicacion: {
    id: 'aplicacion',
    name: 'Aplicación',
    dimension: 'transferencia',
    goal: 'Transferir a nuevos contextos',
    steps_required: 3,
    next_phase: 'metacognicion'
  },
  metacognicion: {
    id: 'metacognicion',
    name: 'Metacognición',
    dimension: 'metacognicion',
    goal: 'Reflexionar sobre el aprendizaje',
    steps_required: 2,
    next_phase: 'completed'
  }
};

/**
 * Decide next step based on micro-evidence and cognitive signals
 * @param {Object} params - Decision parameters
 * @returns {Object} Next step decision
 */
function decide({ sessionState, evaluation, userAction, context }) {
  const currentPhase = sessionState?.current_phase || 'exploracion';
  const currentStep = sessionState?.current_step || 0;

  // Handle explicit user actions
  if (userAction) {
    return handleUserAction(userAction, sessionState);
  }

  // If no evaluation, continue current phase
  if (!evaluation) {
    return continueCurrentPhase(currentPhase, currentStep, sessionState);
  }

  // Decision based on micro-evidence evaluation
  return decideFromMicroEvidence(evaluation, currentPhase, currentStep, sessionState);
}

/**
 * Decide next step from micro-evidence evaluation
 * @param {Object} evaluation - Evaluation with micro-evidence
 * @param {string} currentPhase - Current phase
 * @param {number} currentStep - Current step
 * @param {Object} sessionState - Session state
 * @returns {Object} Next step decision
 */
function decideFromMicroEvidence(evaluation, currentPhase, currentStep, sessionState) {
  const phaseInfo = MODULE_PHASES[currentPhase];
  const rubricLevel = evaluation.rubric_level || 1;
  const signals = evaluation.signals || [];

  // Check if ready to progress phase
  const stepsCompleted = currentStep + 1;
  const canProgressPhase = stepsCompleted >= phaseInfo.steps_required && rubricLevel >= 3;

  if (canProgressPhase) {
    return progressToNextPhase(currentPhase, sessionState);
  }

  // Decide based on rubric level and signals
  if (rubricLevel >= 4) {
    // Strong understanding, can progress quickly
    return {
      step: currentStep + 1,
      phase: currentPhase,
      expectsInput: true,
      hintAvailable: true,
      useRAG: currentPhase === 'exploracion' || currentPhase === 'aplicacion',
      dimension: phaseInfo.dimension,
      character_state: 'encouraging'
    };
  }

  if (rubricLevel >= 3) {
    // Adequate understanding, continue with support
    return {
      step: currentStep + 1,
      phase: currentPhase,
      expectsInput: true,
      hintAvailable: true,
      useRAG: currentPhase === 'exploracion',
      dimension: phaseInfo.dimension,
      character_state: 'idle'
    };
  }

  // Low rubric level (1-2), need more support
  const attempts = sessionState.attempts_on_current || 0;

  if (attempts >= 2) {
    // Too many attempts, give hint and move on
    return {
      step: currentStep + 1,
      phase: currentPhase,
      expectsInput: true,
      hintAvailable: false,
      giveHint: true,
      useRAG: true,
      dimension: phaseInfo.dimension,
      character_state: 'hint'
    };
  }

  // Give another chance with guidance
  return {
    step: currentStep,
    phase: currentPhase,
    expectsInput: true,
    hintAvailable: true,
    provideGuidance: true,
    useRAG: true,
    dimension: phaseInfo.dimension,
    character_state: 'reflection'
  };
}

/**
 * Handle user-initiated action
 * @param {string} action - Action type
 * @param {Object} sessionState - Session state
 * @returns {Object} Next step
 */
function handleUserAction(action, sessionState) {
  const currentPhase = sessionState.current_phase || 'exploracion';
  const phaseInfo = MODULE_PHASES[currentPhase];

  switch (action) {
    case 'hint':
      return {
        step: sessionState.current_step,
        phase: currentPhase,
        giveHint: true,
        expectsInput: true,
        hintAvailable: false,
        useRAG: true,
        dimension: phaseInfo.dimension,
        character_state: 'hint'
      };

    case 'skip':
      return {
        step: sessionState.current_step + 1,
        phase: currentPhase,
        expectsInput: true,
        useRAG: false,
        dimension: phaseInfo.dimension,
        character_state: 'idle'
      };

    case 'next':
      return progressToNextPhase(currentPhase, sessionState);

    default:
      return continueCurrentPhase(currentPhase, sessionState.current_step, sessionState);
  }
}

/**
 * Continue current phase
 * @param {string} phase - Current phase
 * @param {number} step - Current step
 * @param {Object} sessionState - Session state
 * @returns {Object} Next step
 */
function continueCurrentPhase(phase, step, sessionState) {
  const phaseInfo = MODULE_PHASES[phase] || MODULE_PHASES.exploracion;

  return {
    step: step + 1,
    phase,
    expectsInput: true,
    hintAvailable: true,
    useRAG: phase === 'exploracion' || phase === 'aplicacion',
    dimension: phaseInfo.dimension,
    character_state: 'idle'
  };
}

/**
 * Progress to next phase
 * @param {string} currentPhase - Current phase
 * @param {Object} sessionState - Session state
 * @returns {Object} Next step
 */
function progressToNextPhase(currentPhase, sessionState) {
  const currentPhaseInfo = MODULE_PHASES[currentPhase];
  const nextPhaseName = currentPhaseInfo?.next_phase || 'completed';

  if (nextPhaseName === 'completed') {
    return {
      step: 0,
      phase: 'completed',
      expectsInput: false,
      useRAG: false,
      moduleCompleted: true,
      character_state: 'correct'
    };
  }

  const nextPhaseInfo = MODULE_PHASES[nextPhaseName];

  return {
    step: 0,
    phase: nextPhaseName,
    expectsInput: true,
    hintAvailable: true,
    useRAG: nextPhaseName === 'exploracion' || nextPhaseName === 'aplicacion',
    dimension: nextPhaseInfo.dimension,
    character_state: 'encouraging',
    phaseTransition: true
  };
}

/**
 * Get cognitive dimension for phase
 * @param {string} phase - Phase name
 * @returns {string} Dimension
 */
function getDimensionForPhase(phase) {
  return MODULE_PHASES[phase]?.dimension || 'comprension';
}

/**
 * Get phase info
 * @param {string} phase - Phase name
 * @returns {Object} Phase info
 */
function getPhaseInfo(phase) {
  return MODULE_PHASES[phase] || MODULE_PHASES.exploracion;
}

/**
 * Check if phase is complete
 * @param {string} phase - Phase name
 * @param {number} currentStep - Current step
 * @param {number} averageRubricLevel - Average rubric level in phase
 * @returns {boolean} Is phase complete
 */
function isPhaseComplete(phase, currentStep, averageRubricLevel = 3) {
  const phaseInfo = MODULE_PHASES[phase];
  if (!phaseInfo) return false;

  return currentStep >= phaseInfo.steps_required && averageRubricLevel >= 3;
}

module.exports = {
  decide,
  MODULE_PHASES,
  getDimensionForPhase,
  getPhaseInfo,
  isPhaseComplete
};
