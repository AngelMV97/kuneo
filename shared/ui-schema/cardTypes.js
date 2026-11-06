/**
 * CARD TYPES
 * Defines UI card types for displaying content, exercises, and interactions
 */

/**
 * Card type enumeration
 */
export const CARD_TYPES = {
  CONCEPT: 'concept',           // Conceptual explanation
  EXAMPLE: 'example',           // Worked example
  EXERCISE: 'exercise',         // Practice exercise
  HINT: 'hint',                 // Hint or clue
  REFLECTION: 'reflection',     // Reflection prompt
  SUMMARY: 'summary',           // Summary or recap
  PROGRESS: 'progress',         // Progress indicator
  RECOMMENDATION: 'recommendation' // Recommended next step
};

/**
 * Card variant configurations
 * Defines visual styling and behavior for each card type
 */
export const CARD_VARIANTS = {
  concept: {
    name: 'Concepto',
    icon: 'book-open',
    color: '#2196F3',           // Blue
    backgroundColor: '#E3F2FD',
    borderColor: '#42A5F5',
    dismissible: false,
    collapsible: true,
    showProgress: false
  },
  example: {
    name: 'Ejemplo',
    icon: 'file-text',
    color: '#4CAF50',           // Green
    backgroundColor: '#E8F5E9',
    borderColor: '#66BB6A',
    dismissible: true,
    collapsible: true,
    showProgress: false
  },
  exercise: {
    name: 'Ejercicio',
    icon: 'edit',
    color: '#FF9800',           // Orange
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
    dismissible: false,
    collapsible: false,
    showProgress: true
  },
  hint: {
    name: 'Pista',
    icon: 'lightbulb',
    color: '#FFC107',           // Amber
    backgroundColor: '#FFF9C4',
    borderColor: '#FDD835',
    dismissible: true,
    collapsible: false,
    showProgress: false
  },
  reflection: {
    name: 'Reflexión',
    icon: 'message-circle',
    color: '#9C27B0',           // Purple
    backgroundColor: '#F3E5F5',
    borderColor: '#BA68C8',
    dismissible: false,
    collapsible: true,
    showProgress: false
  },
  summary: {
    name: 'Resumen',
    icon: 'check-square',
    color: '#00BCD4',           // Cyan
    backgroundColor: '#E0F7FA',
    borderColor: '#4DD0E1',
    dismissible: false,
    collapsible: true,
    showProgress: false
  },
  progress: {
    name: 'Progreso',
    icon: 'trending-up',
    color: '#8BC34A',           // Light Green
    backgroundColor: '#F1F8E9',
    borderColor: '#AED581',
    dismissible: false,
    collapsible: false,
    showProgress: true
  },
  recommendation: {
    name: 'Recomendación',
    icon: 'compass',
    color: '#673AB7',           // Deep Purple
    backgroundColor: '#EDE7F6',
    borderColor: '#9575CD',
    dismissible: true,
    collapsible: false,
    showProgress: false
  }
};

/**
 * Exercise subtypes
 * Different types of exercises within exercise cards
 */
export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SHORT_ANSWER: 'short_answer',
  TRUE_FALSE: 'true_false',
  MATCHING: 'matching',
  ORDERING: 'ordering',
  OPEN_ENDED: 'open_ended'
};

/**
 * Card action types
 * Actions that can be performed on cards
 */
export const CARD_ACTIONS = {
  EXPAND: 'expand',
  COLLAPSE: 'collapse',
  DISMISS: 'dismiss',
  SUBMIT: 'submit',
  SKIP: 'skip',
  VIEW_HINT: 'view_hint',
  VIEW_SOLUTION: 'view_solution'
};

/**
 * Create a card configuration
 * @param {string} type - Card type
 * @param {Object} content - Card content
 * @param {Object} options - Additional options
 * @returns {Object} Card configuration
 */
export function createCard(type, content, options = {}) {
  const variant = CARD_VARIANTS[type] || CARD_VARIANTS.concept;

  return {
    id: options.id || `card_${Date.now()}`,
    type,
    variant,
    title: content.title || variant.name,
    content: content.body || content.text || '',
    metadata: {
      ...options.metadata,
      createdAt: new Date().toISOString()
    },
    state: {
      expanded: options.expanded !== false,
      dismissed: false,
      completed: false
    },
    actions: options.actions || []
  };
}

/**
 * Create an exercise card
 * @param {Object} exercise - Exercise data
 * @param {Object} options - Additional options
 * @returns {Object} Exercise card
 */
export function createExerciseCard(exercise, options = {}) {
  return createCard(CARD_TYPES.EXERCISE, {
    title: exercise.question || 'Ejercicio',
    body: exercise.question
  }, {
    ...options,
    metadata: {
      exerciseType: exercise.type || EXERCISE_TYPES.SHORT_ANSWER,
      difficulty: exercise.difficulty || 1,
      points: exercise.points || 1,
      ...options.metadata
    },
    actions: [
      { type: CARD_ACTIONS.SUBMIT, label: 'Enviar', enabled: true },
      { type: CARD_ACTIONS.VIEW_HINT, label: 'Ver pista', enabled: true },
      { type: CARD_ACTIONS.SKIP, label: 'Saltar', enabled: false }
    ]
  });
}

/**
 * Create a concept card
 * @param {string} title - Concept title
 * @param {string} content - Concept explanation
 * @param {Object} options - Additional options
 * @returns {Object} Concept card
 */
export function createConceptCard(title, content, options = {}) {
  return createCard(CARD_TYPES.CONCEPT, {
    title,
    body: content
  }, {
    ...options,
    actions: [
      { type: CARD_ACTIONS.COLLAPSE, label: 'Minimizar', enabled: true }
    ]
  });
}

/**
 * Create a hint card
 * @param {string} hint - Hint text
 * @param {Object} options - Additional options
 * @returns {Object} Hint card
 */
export function createHintCard(hint, options = {}) {
  return createCard(CARD_TYPES.HINT, {
    title: 'Pista',
    body: hint
  }, {
    ...options,
    actions: [
      { type: CARD_ACTIONS.DISMISS, label: 'Entendido', enabled: true }
    ]
  });
}

/**
 * Create a reflection card
 * @param {string} prompt - Reflection prompt
 * @param {Object} options - Additional options
 * @returns {Object} Reflection card
 */
export function createReflectionCard(prompt, options = {}) {
  return createCard(CARD_TYPES.REFLECTION, {
    title: 'Reflexiona',
    body: prompt
  }, {
    ...options,
    actions: [
      { type: CARD_ACTIONS.SUBMIT, label: 'Compartir reflexión', enabled: true }
    ]
  });
}

/**
 * Card layout configurations
 * How cards should be arranged in the UI
 */
export const CARD_LAYOUTS = {
  SINGLE: 'single',        // One card at a time
  STACK: 'stack',          // Stacked vertically
  CAROUSEL: 'carousel',    // Horizontal carousel
  GRID: 'grid'            // Grid layout
};

/**
 * Example cards
 */
export const EXAMPLE_CARDS = {
  concept: createConceptCard(
    'La Gravedad',
    'La gravedad es la fuerza de atracción que ejerce la Tierra sobre todos los objetos. Es por esto que las cosas caen cuando las soltamos.'
  ),

  exercise: createExerciseCard({
    question: '¿Qué fuerza hace que una manzana caiga del árbol?',
    type: EXERCISE_TYPES.MULTIPLE_CHOICE,
    options: ['Gravedad', 'Magnetismo', 'Fricción', 'Inercia'],
    difficulty: 1
  }),

  hint: createHintCard(
    'Piensa en qué pasa cuando saltas: siempre vuelves al suelo. ¿Qué fuerza te atrae de vuelta?'
  ),

  reflection: createReflectionCard(
    '¿Cómo crees que sería la vida sin gravedad? Describe 3 cosas que serían diferentes.'
  )
};

export default {
  CARD_TYPES,
  CARD_VARIANTS,
  EXERCISE_TYPES,
  CARD_ACTIONS,
  CARD_LAYOUTS,
  createCard,
  createExerciseCard,
  createConceptCard,
  createHintCard,
  createReflectionCard,
  EXAMPLE_CARDS
};
