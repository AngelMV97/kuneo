/**
 * LLM CLIENT
 * OpenAI API wrapper for chat completions (GPT-4o-mini)
 */

const OpenAI = require('openai');

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set - LLM will use mock mode');
}

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Generate chat completion
 * @param {Array<Object>} messages - Array of {role, content} messages
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated response
 */
async function generateChatCompletion(messages, options = {}) {
  const {
    model = OPENAI_MODEL,
    temperature = 0.7,
    maxTokens = 1500,
    stream = false
  } = options;

  // Mock mode if no API key
  if (!openai) {
    return generateMockResponse(messages);
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined
    });

    if (stream) {
      return response; // Return stream object
    }

    const content = response.choices[0]?.message?.content || '';
    return content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`LLM generation failed: ${error.message}`);
  }
}

/**
 * Generate structured JSON response
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} schema - Expected JSON schema
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Parsed JSON response
 */
async function generateStructuredResponse(messages, schema, options = {}) {
  try {
    const response = await generateChatCompletion(messages, {
      ...options,
      jsonMode: true
    });

    const parsed = JSON.parse(response);
    return parsed;
  } catch (error) {
    console.error('Error parsing structured response:', error);
    throw new Error('Failed to generate structured response');
  }
}

/**
 * Generate tutor response with specific formatting
 * @param {string} systemPrompt - System prompt defining tutor behavior
 * @param {Array<Object>} conversationHistory - Previous messages
 * @param {string} userMessage - Current user message
 * @param {string} context - RAG context (relevant material)
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Tutor response with answer and suggestions
 */
async function generateTutorResponse(systemPrompt, conversationHistory, userMessage, context, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    {
      role: 'user',
      content: `Contexto relevante:\n${context}\n\nPregunta del estudiante:\n${userMessage}`
    }
  ];

  try {
    const response = await generateChatCompletion(messages, options);

    // Extract suggested questions if present
    const suggestions = extractSuggestions(response);
    const mainAnswer = removeSuggestionsSection(response);

    return {
      answer: mainAnswer,
      suggestions,
      rawResponse: response
    };
  } catch (error) {
    console.error('Error generating tutor response:', error);
    throw error;
  }
}

/**
 * Generate practice exercises
 * @param {string} subject - Subject area
 * @param {string} topic - Specific topic
 * @param {number} difficulty - Difficulty level (1-5)
 * @param {number} count - Number of exercises
 * @returns {Promise<Array>} Generated exercises
 */
async function generateExercises(subject, topic, difficulty, count = 3) {
  const prompt = `Genera ${count} ejercicios de práctica para la asignatura ${subject}, tema: ${topic}, nivel de dificultad: ${difficulty}/5.

Formato JSON:
{
  "exercises": [
    {
      "type": "multiple_choice" | "short_answer" | "true_false",
      "question": "...",
      "options": ["a", "b", "c", "d"], // solo para multiple_choice
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}`;

  const messages = [
    { role: 'system', content: 'Eres un experto en educación colombiana. Genera ejercicios alineados con estándares MEN.' },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await generateStructuredResponse(messages, {});
    return response.exercises || [];
  } catch (error) {
    console.error('Error generating exercises:', error);
    return generateMockExercises(subject, topic, difficulty, count);
  }
}

/**
 * Evaluate student response
 * @param {string} question - Original question
 * @param {string} correctAnswer - Expected answer
 * @param {string} studentResponse - Student's response
 * @param {Object} options - Evaluation options
 * @returns {Promise<Object>} Evaluation result
 */
async function evaluateResponse(question, correctAnswer, studentResponse, options = {}) {
  const prompt = `Evalúa la respuesta del estudiante a la siguiente pregunta.

Pregunta: ${question}
Respuesta esperada: ${correctAnswer}
Respuesta del estudiante: ${studentResponse}

Proporciona:
1. ¿Es correcta? (sí/parcial/no)
2. Nivel de comprensión (0-100)
3. Tipo de error (si aplica)
4. Feedback constructivo

Formato JSON:
{
  "is_correct": true/false,
  "is_partial": true/false,
  "comprehension_score": 0-100,
  "error_type": "...",
  "feedback": "..."
}`;

  const messages = [
    { role: 'system', content: 'Eres un evaluador pedagógico. Usa el método socrático para el feedback.' },
    { role: 'user', content: prompt }
  ];

  try {
    return await generateStructuredResponse(messages, {});
  } catch (error) {
    console.error('Error evaluating response:', error);
    return {
      is_correct: false,
      is_partial: false,
      comprehension_score: 0,
      error_type: 'evaluation_error',
      feedback: 'No se pudo evaluar la respuesta. Intenta de nuevo.'
    };
  }
}

/**
 * Extract suggested questions from response
 * @param {string} response - Full response text
 * @returns {Array<string>} Suggested questions
 */
function extractSuggestions(response) {
  const suggestions = [];
  const regex = /(?:Preguntas Sugeridas|Sugerencias):?\s*\n((?:[-•*]\s*.+\n?)+)/i;
  const match = response.match(regex);

  if (match && match[1]) {
    const lines = match[1].split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const question = line.replace(/^[-•*]\s*/, '').trim();
      if (question) {
        suggestions.push(question);
      }
    });
  }

  return suggestions;
}

/**
 * Remove suggestions section from response
 * @param {string} response - Full response text
 * @returns {string} Clean response
 */
function removeSuggestionsSection(response) {
  return response.replace(/(?:Preguntas Sugeridas|Sugerencias):?\s*\n((?:[-•*]\s*.+\n?)+)/i, '').trim();
}

/**
 * Mock response generator (when no API key)
 * @param {Array<Object>} messages - Chat messages
 * @returns {string} Mock response
 */
function generateMockResponse(messages) {
  const userMessage = messages[messages.length - 1]?.content || '';

  const mockResponses = [
    '¡Excelente pregunta! Para entender esto mejor, piensa en un ejemplo de tu vida diaria...',
    'Interesante perspectiva. ¿Qué te hace pensar eso? ¿Puedes explicar tu razonamiento?',
    'Vas por buen camino. Ahora, ¿cómo se relaciona esto con lo que vimos antes?',
    'Déjame hacerte una pregunta: ¿qué pasaría si...?'
  ];

  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  return `${randomResponse}\n\nPreguntas Sugeridas:\n- ¿Puedes dar un ejemplo?\n- ¿Cómo se relaciona con el concepto principal?`;
}

/**
 * Mock exercise generator
 * @param {string} subject - Subject
 * @param {string} topic - Topic
 * @param {number} difficulty - Difficulty
 * @param {number} count - Count
 * @returns {Array} Mock exercises
 */
function generateMockExercises(subject, topic, difficulty, count) {
  return Array.from({ length: count }, (_, i) => ({
    type: 'short_answer',
    question: `Pregunta ${i + 1} sobre ${topic} (dificultad: ${difficulty})`,
    correct_answer: 'Respuesta de ejemplo',
    explanation: 'Explicación pedagógica...'
  }));
}

/**
 * Token usage estimation
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

module.exports = {
  generateChatCompletion,
  generateStructuredResponse,
  generateTutorResponse,
  generateExercises,
  evaluateResponse,
  extractSuggestions,
  estimateTokens
};
