/**
 * TUTOR RESPONSE CONTRACT
 * Universal response structure from Orchestrator to Mobile/Web clients
 * 
 * This contract ensures consistency across all tutor interactions
 */

/**
 * @typedef {Object} TutorResponse
 * @property {string} character_state - Current state of Tuko character (idle, thinking, encouraging, etc.)
 * @property {string} message - The tutor's message content (supports Markdown)
 * @property {Array<UIElement>} ui_elements - Array of UI elements to render
 * @property {Array<Card>} cards - Optional cards to display (concepts, examples)
 * @property {Array<Action>} actions - Available user actions (options, input, etc.)
 * @property {Object} metadata - Additional metadata for tracking/analytics
 */

/**
 * @typedef {Object} UIElement
 * @property {string} type - Type of UI element (bubble, options, input, card)
 * @property {Object} props - Properties specific to the UI element type
 */

/**
 * @typedef {Object} Card
 * @property {string} type - Card type (concept, example, hint, exercise)
 * @property {string} title - Card title
 * @property {string} content - Card content
 * @property {Object} metadata - Additional card metadata
 */

/**
 * @typedef {Object} Action
 * @property {string} id - Unique action identifier
 * @property {string} type - Action type (option, submit, skip, hint)
 * @property {string} label - Display label for the action
 * @property {*} value - Value to send when action is triggered
 */

export const TutorResponseSchema = {
  character_state: String,
  message: String,
  ui_elements: Array,
  cards: Array,
  actions: Array,
  metadata: Object
};

/**
 * Create a TutorResponse object
 * @param {Object} params - Response parameters
 * @returns {TutorResponse}
 */
export function createTutorResponse({
  character_state = 'idle',
  message = '',
  ui_elements = [],
  cards = [],
  actions = [],
  metadata = {}
}) {
  return {
    character_state,
    message,
    ui_elements,
    cards,
    actions,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Validate TutorResponse structure
 * @param {Object} response - Response to validate
 * @returns {boolean}
 */
export function validateTutorResponse(response) {
  if (!response || typeof response !== 'object') return false;
  
  const required = ['character_state', 'message', 'ui_elements', 'actions'];
  return required.every(field => field in response);
}

/**
 * Example TutorResponse instances
 */
export const EXAMPLE_RESPONSES = {
  greeting: createTutorResponse({
    character_state: 'idle',
    message: '¡Hola! Soy Tuko, tu compañero de aprendizaje. ¿Listo para explorar juntos?',
    ui_elements: [
      { type: 'bubble', props: { variant: 'tutor' } }
    ],
    actions: [
      { id: 'start', type: 'option', label: 'Empecemos', value: 'start' },
      { id: 'later', type: 'option', label: 'Más tarde', value: 'later' }
    ]
  }),

  thinking: createTutorResponse({
    character_state: 'thinking',
    message: 'Interesante... ¿Qué te hace pensar eso?',
    ui_elements: [
      { type: 'bubble', props: { variant: 'tutor' } },
      { type: 'input', props: { placeholder: 'Escribe tu respuesta...' } }
    ],
    actions: [
      { id: 'submit', type: 'submit', label: 'Enviar', value: null }
    ]
  }),

  encouraging: createTutorResponse({
    character_state: 'encouraging',
    message: '¡Muy bien! Vas por buen camino. Sigamos explorando...',
    ui_elements: [
      { type: 'bubble', props: { variant: 'tutor', emotion: 'positive' } }
    ],
    cards: [
      {
        type: 'hint',
        title: 'Pista',
        content: 'Piensa en cómo funciona esto en tu vida diaria',
        metadata: { dismissible: true }
      }
    ],
    actions: [
      { id: 'continue', type: 'option', label: 'Continuar', value: 'continue' }
    ]
  })
};

export default {
  TutorResponseSchema,
  createTutorResponse,
  validateTutorResponse,
  EXAMPLE_RESPONSES
};
