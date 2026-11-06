/**
 * BUBBLE TYPES
 * Defines message bubble types and their styling configurations
 */

/**
 * Bubble type enumeration
 */
export const BUBBLE_TYPES = {
  TUTOR: 'tutor',           // Message from Tuko
  USER: 'user',             // Message from student
  SYSTEM: 'system',         // System notifications
  HINT: 'hint',             // Hint or help bubble
  FEEDBACK: 'feedback'      // Evaluation feedback
};

/**
 * Bubble variant configurations
 * Defines visual styling for each bubble type
 */
export const BUBBLE_VARIANTS = {
  tutor: {
    name: 'Tutor',
    alignment: 'left',
    backgroundColor: '#E8F5E9',    // Light green
    textColor: '#1B5E20',
    borderColor: '#66BB6A',
    avatar: 'tuko',
    maxWidth: '80%',
    showTimestamp: false,
    animation: 'slideInLeft'
  },
  user: {
    name: 'Usuario',
    alignment: 'right',
    backgroundColor: '#E3F2FD',    // Light blue
    textColor: '#0D47A1',
    borderColor: '#42A5F5',
    avatar: 'user',
    maxWidth: '80%',
    showTimestamp: false,
    animation: 'slideInRight'
  },
  system: {
    name: 'Sistema',
    alignment: 'center',
    backgroundColor: '#F5F5F5',    // Light gray
    textColor: '#616161',
    borderColor: '#BDBDBD',
    avatar: null,
    maxWidth: '90%',
    showTimestamp: true,
    animation: 'fadeIn'
  },
  hint: {
    name: 'Pista',
    alignment: 'left',
    backgroundColor: '#FFF9C4',    // Light yellow
    textColor: '#F57F17',
    borderColor: '#FDD835',
    avatar: 'tuko',
    maxWidth: '75%',
    showTimestamp: false,
    animation: 'bounceIn',
    icon: 'lightbulb'
  },
  feedback: {
    name: 'Retroalimentación',
    alignment: 'center',
    backgroundColor: '#E1F5FE',    // Lighter blue
    textColor: '#01579B',
    borderColor: '#0288D1',
    avatar: null,
    maxWidth: '85%',
    showTimestamp: false,
    animation: 'slideUp',
    icon: 'check-circle'
  }
};

/**
 * Emotion-based bubble styling modifiers
 * Can be applied on top of base bubble variants
 */
export const BUBBLE_EMOTIONS = {
  positive: {
    borderColor: '#4CAF50',
    accentColor: '#81C784',
    icon: 'smile'
  },
  negative: {
    borderColor: '#F44336',
    accentColor: '#E57373',
    icon: 'alert-circle'
  },
  neutral: {
    borderColor: '#9E9E9E',
    accentColor: '#BDBDBD',
    icon: 'info'
  },
  encouraging: {
    borderColor: '#FF9800',
    accentColor: '#FFB74D',
    icon: 'star'
  },
  questioning: {
    borderColor: '#9C27B0',
    accentColor: '#BA68C8',
    icon: 'help-circle'
  }
};

/**
 * Create a bubble configuration
 * @param {string} type - Bubble type
 * @param {Object} options - Additional options
 * @returns {Object} Bubble configuration
 */
export function createBubbleConfig(type, options = {}) {
  const baseConfig = BUBBLE_VARIANTS[type] || BUBBLE_VARIANTS.tutor;
  
  const config = {
    ...baseConfig,
    ...options
  };

  // Apply emotion modifier if specified
  if (options.emotion && BUBBLE_EMOTIONS[options.emotion]) {
    const emotionModifier = BUBBLE_EMOTIONS[options.emotion];
    config.borderColor = emotionModifier.borderColor;
    config.accentColor = emotionModifier.accentColor;
    config.icon = emotionModifier.icon;
  }

  return config;
}

/**
 * Bubble content structure
 * @typedef {Object} BubbleContent
 * @property {string} text - Main bubble text (supports Markdown)
 * @property {string} [subtext] - Optional secondary text
 * @property {Array<string>} [tags] - Optional tags or labels
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * Create a bubble message object
 * @param {string} type - Bubble type
 * @param {string} content - Message content
 * @param {Object} options - Additional options
 * @returns {Object} Bubble message
 */
export function createBubbleMessage(type, content, options = {}) {
  return {
    id: options.id || `bubble_${Date.now()}`,
    type,
    content,
    config: createBubbleConfig(type, options),
    timestamp: options.timestamp || new Date().toISOString(),
    metadata: options.metadata || {}
  };
}

/**
 * Bubble animations
 * CSS animation classes or React Native animation configs
 */
export const BUBBLE_ANIMATIONS = {
  slideInLeft: {
    duration: 300,
    easing: 'ease-out',
    transform: 'translateX(-20px) -> translateX(0)'
  },
  slideInRight: {
    duration: 300,
    easing: 'ease-out',
    transform: 'translateX(20px) -> translateX(0)'
  },
  fadeIn: {
    duration: 200,
    easing: 'ease-in',
    opacity: '0 -> 1'
  },
  bounceIn: {
    duration: 500,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    transform: 'scale(0.3) -> scale(1)'
  },
  slideUp: {
    duration: 300,
    easing: 'ease-out',
    transform: 'translateY(20px) -> translateY(0)'
  }
};

/**
 * Example bubble messages
 */
export const EXAMPLE_BUBBLES = {
  tutorGreeting: createBubbleMessage(
    BUBBLE_TYPES.TUTOR,
    '¡Hola! Soy Tuko. Estoy aquí para acompañarte a pensar, no solo a responder.',
    { emotion: 'encouraging' }
  ),
  
  userResponse: createBubbleMessage(
    BUBBLE_TYPES.USER,
    'Creo que es porque la gravedad atrae los objetos'
  ),
  
  hint: createBubbleMessage(
    BUBBLE_TYPES.HINT,
    'Piensa en qué pasa cuando sueltas una pelota desde lo alto...',
    { icon: 'lightbulb' }
  ),
  
  feedback: createBubbleMessage(
    BUBBLE_TYPES.FEEDBACK,
    '¡Muy bien! Identificaste correctamente la fuerza que actúa.',
    { emotion: 'positive' }
  )
};

export default {
  BUBBLE_TYPES,
  BUBBLE_VARIANTS,
  BUBBLE_EMOTIONS,
  BUBBLE_ANIMATIONS,
  createBubbleConfig,
  createBubbleMessage,
  EXAMPLE_BUBBLES
};
