/**
 * CHARACTER STATES
 * Defines all possible states for Tuko character
 * Maps to Lottie animation files in assets/character/kid/lottie/
 */

/**
 * Available character states
 * Each state corresponds to a specific Lottie animation and emotional context
 */
export const CHARACTER_STATES = [
  'idle',           // tuko_idle.json - Default resting state
  'thinking',       // tuko_thinking.json - Processing, analyzing
  'encouraging',    // tuko_encouragement.json - Positive reinforcement
  'reflection',     // tuko_reflection.json - Deep thought, reflection
  'hint',           // tuko_hint.json - Giving a hint or clue
  'correct',        // tuko_correct.json - User got something right
  'incorrect'       // tuko_incorrect.json - Gentle correction needed
];

/**
 * Character state metadata
 * Provides additional context for each state
 */
export const CHARACTER_STATE_METADATA = {
  idle: {
    name: 'Reposo',
    description: 'Estado neutral, esperando interacción',
    emotion: 'neutral',
    duration: 'loop',
    lottieFile: 'tuko_idle.json'
  },
  thinking: {
    name: 'Pensando',
    description: 'Procesando respuesta del estudiante',
    emotion: 'curious',
    duration: 'loop',
    lottieFile: 'tuko_thinking.json'
  },
  encouraging: {
    name: 'Animando',
    description: 'Refuerzo positivo y motivación',
    emotion: 'happy',
    duration: 'once',
    lottieFile: 'tuko_encouragement.json'
  },
  reflection: {
    name: 'Reflexionando',
    description: 'Momento de reflexión profunda',
    emotion: 'contemplative',
    duration: 'loop',
    lottieFile: 'tuko_reflection.json'
  },
  hint: {
    name: 'Dando Pista',
    description: 'Ofreciendo una pista o ayuda',
    emotion: 'helpful',
    duration: 'once',
    lottieFile: 'tuko_hint.json'
  },
  correct: {
    name: 'Correcto',
    description: 'Celebrando respuesta correcta',
    emotion: 'excited',
    duration: 'once',
    lottieFile: 'tuko_correct.json'
  },
  incorrect: {
    name: 'Incorrecto',
    description: 'Corrección gentil y guía',
    emotion: 'thoughtful',
    duration: 'once',
    lottieFile: 'tuko_incorrect.json'
  }
};

/**
 * Get Lottie file path for a character state
 * @param {string} state - Character state
 * @param {string} character - Character name (default: 'tuko')
 * @param {string} ageGroup - Age group (kid, teen, young_adult) - MVP uses only 'kid'
 * @returns {string} Path to Lottie JSON file
 */
export function getLottieFilePath(state, character = 'tuko', ageGroup = 'kid') {
  if (!CHARACTER_STATES.includes(state)) {
    console.warn(`Unknown character state: ${state}, falling back to 'idle'`);
    state = 'idle';
  }

  const metadata = CHARACTER_STATE_METADATA[state];
  return `/lottie/characters/${character}/${metadata.lottieFile}`;
}

/**
 * Get PNG source path for a character state (fallback)
 * @param {string} state - Character state
 * @param {string} character - Character name (default: 'tuko')
 * @param {string} ageGroup - Age group (kid, teen, young_adult)
 * @returns {string} Path to PNG file
 */
export function getPngFilePath(state, character = 'tuko', ageGroup = 'kid') {
  if (!CHARACTER_STATES.includes(state)) {
    state = 'idle';
  }

  // Map state names to PNG filenames
  const pngMapping = {
    idle: 'idle.png',
    thinking: 'thinking.png',
    encouraging: 'encouraging.png',
    reflection: 'reflecing.png', // Note: typo in original filename
    hint: 'hint.png',
    correct: 'correct.png',
    incorrect: 'incorrect.png'
  };

  return `/images/characters/${character}/${ageGroup}/${pngMapping[state]}`;
}

/**
 * Validate character state
 * @param {string} state - State to validate
 * @returns {boolean}
 */
export function isValidCharacterState(state) {
  return CHARACTER_STATES.includes(state);
}

/**
 * Get character state by emotion/context
 * Useful for backend to decide which state to use
 * @param {string} context - Context keyword
 * @returns {string} Character state
 */
export function getStateByContext(context) {
  const contextMap = {
    neutral: 'idle',
    waiting: 'idle',
    processing: 'thinking',
    analyzing: 'thinking',
    question: 'thinking',
    success: 'correct',
    right: 'correct',
    well_done: 'encouraging',
    keep_going: 'encouraging',
    motivation: 'encouraging',
    mistake: 'incorrect',
    wrong: 'incorrect',
    redirect: 'incorrect',
    help: 'hint',
    clue: 'hint',
    tip: 'hint',
    deep_thought: 'reflection',
    metacognition: 'reflection'
  };

  return contextMap[context] || 'idle';
}

export default {
  CHARACTER_STATES,
  CHARACTER_STATE_METADATA,
  getLottieFilePath,
  getPngFilePath,
  isValidCharacterState,
  getStateByContext
};
