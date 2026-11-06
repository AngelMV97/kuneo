/**
 * VECTOR CLIENT
 * pgvector operations for semantic search (RAG)
 */

const { supabase } = require('../db/postgres');

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vec1 - First vector
 * @param {Array<number>} vec2 - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Search embeddings by vector similarity
 * Uses pgvector's <=> operator for cosine distance
 * @param {Array<number>} queryEmbedding - Query vector (1536-dim)
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Matching content chunks with similarity scores
 */
async function searchSimilar(queryEmbedding, options = {}) {
  const {
    limit = 5,
    threshold = 0.7,
    subject = null,
    gradeLevel = null
  } = options;

  try {
    // Build the query
    let query = supabase
      .from('kuneo.embeddings')
      .select(`
        id,
        content_id,
        content_text,
        kuneo.content_nodes (
          id,
          subject,
          grade_level,
          type,
          title,
          content
        )
      `);

    // Filter by subject if specified
    if (subject) {
      query = query.eq('kuneo.content_nodes.subject', subject);
    }

    // Filter by grade level if specified
    if (gradeLevel) {
      query = query.eq('kuneo.content_nodes.grade_level', gradeLevel);
    }

    // Get all potentially relevant embeddings (pgvector filtering)
    const { data: embeddings, error } = await query;

    if (error) {
      console.error('Vector search error:', error);
      throw error;
    }

    if (!embeddings || embeddings.length === 0) {
      return [];
    }

    // Calculate similarities client-side (since pgvector ops need raw SQL)
    const results = embeddings
      .map(emb => {
        const similarity = cosineSimilarity(queryEmbedding, emb.embedding);
        return {
          ...emb,
          similarity
        };
      })
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Error in searchSimilar:', error);
    throw error;
  }
}

/**
 * Search embeddings using raw SQL (more efficient with pgvector)
 * @param {Array<number>} queryEmbedding - Query vector
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Matching content
 */
async function searchSimilarRaw(queryEmbedding, options = {}) {
  const {
    limit = 5,
    threshold = 0.7,
    subject = null,
    gradeLevel = null
  } = options;

  try {
    // Convert embedding to pgvector format
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Build WHERE clause
    let whereClause = 'cn.is_active = true';
    if (subject) {
      whereClause += ` AND cn.subject = '${subject}'`;
    }
    if (gradeLevel) {
      whereClause += ` AND cn.grade_level = ${gradeLevel}`;
    }

    // Execute raw SQL query with pgvector cosine distance
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: embeddingStr,
      match_threshold: 1 - threshold, // Convert similarity to distance
      match_count: limit,
      filter_subject: subject,
      filter_grade: gradeLevel
    });

    if (error) {
      console.error('Raw vector search error:', error);
      // Fallback to client-side similarity
      return searchSimilar(queryEmbedding, options);
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchSimilarRaw:', error);
    // Fallback to client-side similarity
    return searchSimilar(queryEmbedding, options);
  }
}

/**
 * Insert embedding for content
 * @param {string} contentId - Content node UUID
 * @param {string} contentText - Text content
 * @param {Array<number>} embedding - Vector embedding
 * @returns {Promise<Object>} Inserted embedding
 */
async function insertEmbedding(contentId, contentText, embedding) {
  const { data, error } = await supabase
    .from('kuneo.embeddings')
    .insert({
      content_id: contentId,
      content_text: contentText,
      embedding
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting embedding:', error);
    throw error;
  }

  return data;
}

/**
 * Batch insert embeddings
 * @param {Array<Object>} embeddingsData - Array of {contentId, contentText, embedding}
 * @returns {Promise<Array>} Inserted embeddings
 */
async function batchInsertEmbeddings(embeddingsData) {
  if (!embeddingsData || embeddingsData.length === 0) {
    return [];
  }

  const records = embeddingsData.map(item => ({
    content_id: item.contentId,
    content_text: item.contentText,
    embedding: item.embedding
  }));

  const { data, error } = await supabase
    .from('kuneo.embeddings')
    .insert(records)
    .select();

  if (error) {
    console.error('Error batch inserting embeddings:', error);
    throw error;
  }

  return data;
}

/**
 * Delete embeddings for content
 * @param {string} contentId - Content node UUID
 * @returns {Promise}
 */
async function deleteEmbeddings(contentId) {
  const { error } = await supabase
    .from('kuneo.embeddings')
    .delete()
    .eq('content_id', contentId);

  if (error) {
    console.error('Error deleting embeddings:', error);
    throw error;
  }
}

/**
 * Get embedding by ID
 * @param {string} embeddingId - Embedding UUID
 * @returns {Promise<Object>} Embedding
 */
async function getEmbeddingById(embeddingId) {
  const { data, error } = await supabase
    .from('kuneo.embeddings')
    .select('*')
    .eq('id', embeddingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Count embeddings for content
 * @param {string} contentId - Content node UUID
 * @returns {Promise<number>} Count
 */
async function countEmbeddings(contentId) {
  const { count, error } = await supabase
    .from('kuneo.embeddings')
    .select('id', { count: 'exact', head: true })
    .eq('content_id', contentId);

  if (error) {
    console.error('Error counting embeddings:', error);
    return 0;
  }

  return count || 0;
}

module.exports = {
  cosineSimilarity,
  searchSimilar,
  searchSimilarRaw,
  insertEmbedding,
  batchInsertEmbeddings,
  deleteEmbeddings,
  getEmbeddingById,
  countEmbeddings
};
