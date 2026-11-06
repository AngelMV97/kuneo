/**
 * EMBEDDING CLIENT
 * OpenAI Embeddings API wrapper (text-embedding-3-small)
 */

const OpenAI = require('openai');

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDINGS_MODEL = process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536; // text-embedding-3-small dimension

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set - Embeddings will use mock mode');
}

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Generate embedding for text
 * @param {string} text - Input text
 * @param {Object} options - Generation options
 * @returns {Promise<Array<number>>} Embedding vector (1536-dim)
 */
async function generateEmbedding(text, options = {}) {
  const { model = OPENAI_EMBEDDINGS_MODEL } = options;

  // Mock mode if no API key
  if (!openai) {
    return generateMockEmbedding(text);
  }

  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
      encoding_format: 'float'
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimension: expected ${EMBEDDING_DIMENSIONS}, got ${embedding?.length}`);
    }

    return embedding;
  } catch (error) {
    console.error('OpenAI Embeddings API error:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {Array<string>} texts - Array of input texts
 * @param {Object} options - Generation options
 * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
 */
async function generateBatchEmbeddings(texts, options = {}) {
  const { model = OPENAI_EMBEDDINGS_MODEL, batchSize = 100 } = options;

  // Mock mode
  if (!openai) {
    return texts.map(text => generateMockEmbedding(text));
  }

  try {
    // Process in batches to avoid rate limits
    const results = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await openai.embeddings.create({
        model,
        input: batch,
        encoding_format: 'float'
      });

      const embeddings = response.data.map(item => item.embedding);
      results.push(...embeddings);

      // Rate limiting delay between batches
      if (i + batchSize < texts.length) {
        await delay(500);
      }
    }

    return results;
  } catch (error) {
    console.error('Batch embedding error:', error);
    throw new Error(`Batch embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate embedding for query (optimized for search)
 * @param {string} query - Search query
 * @param {Object} options - Options
 * @returns {Promise<Array<number>>} Query embedding
 */
async function generateQueryEmbedding(query, options = {}) {
  // Preprocess query for better search results
  const processedQuery = preprocessQuery(query);
  return generateEmbedding(processedQuery, options);
}

/**
 * Preprocess query text for embedding
 * @param {string} query - Raw query
 * @returns {string} Processed query
 */
function preprocessQuery(query) {
  let processed = query.trim();

  // Remove extra whitespace
  processed = processed.replace(/\s+/g, ' ');

  // Remove special characters that don't add semantic value
  processed = processed.replace(/[^\w\sáéíóúñü¿?]/gi, '');

  return processed;
}

/**
 * Chunk text for embedding
 * Splits long text into chunks suitable for embedding
 * @param {string} text - Text to chunk
 * @param {Object} options - Chunking options
 * @returns {Array<Object>} Array of {text, index, metadata}
 */
function chunkText(text, options = {}) {
  const {
    chunkSize = 1000,
    overlap = 200,
    separator = '\n'
  } = options;

  const chunks = [];
  const paragraphs = text.split(separator).filter(p => p.trim());

  let currentChunk = '';
  let currentSize = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphSize = paragraph.length;

    if (currentSize + paragraphSize > chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        metadata: {
          size: currentSize,
          startsWith: currentChunk.substring(0, 50)
        }
      });

      // Start new chunk with overlap
      const overlapText = currentChunk.substring(Math.max(0, currentChunk.length - overlap));
      currentChunk = overlapText + ' ' + paragraph;
      currentSize = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + paragraph;
      currentSize += paragraphSize;
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      metadata: {
        size: currentChunk.length,
        startsWith: currentChunk.substring(0, 50)
      }
    });
  }

  return chunks;
}

/**
 * Process and embed document
 * Chunks document and generates embeddings for each chunk
 * @param {string} documentText - Full document text
 * @param {Object} metadata - Document metadata
 * @param {Object} options - Processing options
 * @returns {Promise<Array<Object>>} Array of {text, embedding, metadata}
 */
async function processDocument(documentText, metadata = {}, options = {}) {
  try {
    // Chunk the document
    const chunks = chunkText(documentText, options);

    // Generate embeddings for all chunks
    const texts = chunks.map(chunk => chunk.text);
    const embeddings = await generateBatchEmbeddings(texts, options);

    // Combine chunks with embeddings
    const processedChunks = chunks.map((chunk, index) => ({
      text: chunk.text,
      embedding: embeddings[index],
      metadata: {
        ...metadata,
        chunkIndex: chunk.index,
        chunkSize: chunk.metadata.size
      }
    }));

    return processedChunks;
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

/**
 * Mock embedding generator (deterministic for testing)
 * @param {string} text - Input text
 * @returns {Array<number>} Mock embedding vector
 */
function generateMockEmbedding(text) {
  // Create deterministic embedding based on text hash
  const hash = simpleHash(text);
  const embedding = [];

  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    // Generate pseudo-random number based on hash and index
    const seed = (hash + i) * 9301 + 49297;
    const value = (seed % 233280) / 233280.0;
    embedding.push((value - 0.5) * 2); // Normalize to [-1, 1]
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Simple hash function for strings
 * @param {string} str - Input string
 * @returns {number} Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Delay helper
 * @param {number} ms - Milliseconds
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get embedding dimensions
 * @returns {number} Embedding dimensions
 */
function getEmbeddingDimensions() {
  return EMBEDDING_DIMENSIONS;
}

/**
 * Validate embedding
 * @param {Array<number>} embedding - Embedding to validate
 * @returns {boolean} Is valid
 */
function validateEmbedding(embedding) {
  if (!Array.isArray(embedding)) return false;
  if (embedding.length !== EMBEDDING_DIMENSIONS) return false;
  return embedding.every(val => typeof val === 'number' && !isNaN(val));
}

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  generateQueryEmbedding,
  chunkText,
  processDocument,
  getEmbeddingDimensions,
  validateEmbedding,
  EMBEDDING_DIMENSIONS
};
