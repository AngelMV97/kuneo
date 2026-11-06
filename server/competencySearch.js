const OpenAI = require('openai');
const metrics = require('./runtimeMetrics');
const { SUBJECTS } = require('./learningMetrics');
const { cleanRow } = require('./curriculumQuality');
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const stop = new Set('a al algo como con cual de del el en es esta este la las lo los para por que se su sus un una unos unas y o me mi mis'.split(' '));
const stem = word => word.length > 4 && word.endsWith('es') ? word.slice(0, -2) : word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
const tokens = value => [...new Set((normalize(value).match(/[a-z0-9]+/g) || []).filter(t => !stop.has(t)).map(stem))];
function text(value) { return typeof value === 'string' ? value : Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? Object.values(value).map(text).join(' ') : ''; }
function prepare(row) {
  row = cleanRow(row);
  const content = row.content || {};
  // Unknown/manual tags cannot independently create a lexical result. Only
  // corroborated historical labels act as aliases (e.g. estadistica -> datos).
  const known = require('./curriculumDerivationRules.json').concept_keywords;
  const aliases = (content.concepts || []).filter(concept => Object.hasOwn(known, concept));
  return { row, primary: new Set(tokens(content.competency)), all: new Set(tokens([content.competency, text(content.evidence), text(aliases), text(content.example)].join(' '))) };
}
function gradeBounds(value) {
  const numbers = String(value || '').match(/\d+/g)?.map(Number) || [];
  if (!numbers.length || numbers.some(n => n < 1 || n > 11)) return null;
  return [Math.min(...numbers), Math.max(...numbers)];
}
function gradeMatches(rowGrade, filter) {
  if (!filter) return true;
  const row = gradeBounds(rowGrade), target = gradeBounds(filter);
  return !!row && !!target && row[0] <= target[1] && target[0] <= row[1];
}
function validateFilters(filters = {}) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) throw Object.assign(new Error('Filtros inválidos.'), { status: 400 });
  const result = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === '' || value === undefined || value === null) continue;
    if (!['subject', 'grade_range', 'difficulty', 'source'].includes(key)) throw Object.assign(new Error('Filtro desconocido.'), { status: 400 });
    if (key === 'subject' && (typeof value !== 'string' || !Object.hasOwn(SUBJECTS, value))) throw Object.assign(new Error('Materia inválida.'), { status: 400 });
    if (key === 'source' && !['standard', 'dba'].includes(value)) throw Object.assign(new Error('Fuente inválida.'), { status: 400 });
    if (key === 'grade_range' && (typeof value !== 'string' || !/^(?:[1-9]|1[01])(?:-(?:[1-9]|1[01]))?$/.test(value) || !gradeBounds(value) || (value.includes('-') && Number(value.split('-')[0]) > Number(value.split('-')[1])))) throw Object.assign(new Error('Grado inválido.'), { status: 400 });
    if (key === 'difficulty' && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5)) throw Object.assign(new Error('Dificultad inválida.'), { status: 400 });
    result[key] = key === 'difficulty' ? Number(value) : value;
  }
  return result;
}
function matches(row, filters) {
  return (!filters.subject || row.subject === filters.subject) && (!filters.source || row.source === filters.source) &&
    (!filters.difficulty || Number(row.difficulty) === filters.difficulty) && gradeMatches(row.grade_range, filters.grade_range);
}
function lexicalScore(document, queryTokens) {
  if (!queryTokens.length) return 0;
  const present = queryTokens.filter(t => document.all.has(t)).length;
  if (present / queryTokens.length < 0.5) return 0;
  const primary = queryTokens.filter(t => document.primary.has(t)).length;
  return 0.6 * present / queryTokens.length + 0.4 * primary / queryTokens.length;
}
function rank(documents, query, filters, semantic = []) {
  const queryTokens = tokens(query), byId = new Map(semantic.filter(r => r.similarity !== null && Number.isFinite(Number(r.similarity))).map(r => [r.id, Number(r.similarity)]));
  return documents.filter(d => matches(d.row, filters)).map(document => {
    const lexical = lexicalScore(document, queryTokens), similarity = byId.get(document.row.id) ?? null;
    return { ...document.row, similarity, retrieval: lexical ? similarity !== null ? 'hybrid' : 'text' : 'semantic', rank_score: lexical * 0.7 + Math.max(0, similarity || 0) * 0.3, lexical_match: lexical > 0 };
  }).filter(row => row.lexical_match || row.similarity !== null).sort((a, b) => b.rank_score - a.rank_score || (gradeBounds(a.grade_range)?.[0] || 0) - (gradeBounds(b.grade_range)?.[0] || 0) || a.id.localeCompare(b.id));
}
function createSearchService(db, { semanticSearch, client, ttl = 5 * 60 * 1000 } = {}) {
  const ai = client || (process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 10000, maxRetries: 0 }) : null);
  let documents = null, loadedAt = 0, loading = null;
  const cache = new Map(), inflight = new Map();
  async function catalog() {
    if (documents && Date.now() - loadedAt < ttl) return documents;
    if (loading) return loading;
    loading = metrics.measure('competency_catalog', async () => {
      const rows = [];
      for (let start = 0; ; start += 1000) {
        const { data, error } = await db.schema('kuneo').from('competency_units').select('id,type,source,subject,grade_range,difficulty,content').order('id').range(start, start + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) break;
      }
      documents = rows.map(prepare); loadedAt = Date.now(); cache.clear();
      return documents;
    });
    try { return await loading; } finally { loading = null; }
  }
  async function dense(query, count, threshold) {
    if (semanticSearch) return semanticSearch(query, count, threshold);
    if (!ai) throw new Error('Semantic provider unavailable');
    const embedding = await metrics.measure('embedding', () => ai.embeddings.create({ model: 'text-embedding-3-small', input: query, encoding_format: 'float' }));
    metrics.usage('text-embedding-3-small', embedding.usage);
    const { data, error } = await metrics.measure('semantic_rpc', () => db.schema('kuneo').rpc('search_competency_units', {
      query_embedding: embedding.data[0].embedding, match_threshold: threshold, match_count: count,
      filter_subject: null, filter_grade_range: null, filter_difficulty: null, filter_source: null
    }));
    // Grade overlap is deliberately applied after retrieval; the historical RPC
    // matches grade_range strings exactly and would exclude individual grades.
    if (error) throw error;
    return data || [];
  }
  async function search(query, rawFilters = {}, { offset = 0, limit = 20, threshold = 0.5 } = {}) {
    if (typeof query !== 'string' || !query.trim() || query.length > 500 || !Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100 || typeof threshold !== 'number' || threshold < 0 || threshold > 1) throw Object.assign(new Error('Consulta o paginación inválida.'), { status: 400 });
    const filters = validateFilters(rawFilters), docs = await catalog();
    const key = JSON.stringify([normalize(query), filters.subject, filters.grade_range, filters.source, filters.difficulty, threshold]);
    let entry = cache.get(key), cached = !!entry && Date.now() - entry.created < ttl;
    if (!cached) {
      if (!inflight.has(key)) inflight.set(key, (async () => {
        let semantic = [], available = true;
        try { semantic = await dense(normalize(query), docs.length, threshold); }
        catch { available = false; metrics.tag('semantic', 'unavailable'); }
        const result = { rows: rank(docs, query, filters, semantic), semantic_available: available, created: Date.now() };
        // Briefly cache a provider failure to avoid repeated long waits, then retry.
        if (cache.size >= 200) cache.delete(cache.keys().next().value);
        cache.set(key, result);
        return result;
      })());
      try { entry = await inflight.get(key); } finally { inflight.delete(key); }
    }
    // A failed provider is retried after 15 seconds, not the full catalog TTL.
    if (!entry.semantic_available && Date.now() - entry.created > 15000) { cache.delete(key); return search(query, filters, { offset, limit, threshold }); }
    const page = entry.rows.slice(offset, offset + limit);
    return { query, filters, results: page, count: page.length, total: entry.rows.length,
      next_offset: offset + page.length < entry.rows.length ? offset + page.length : null, cached,
      semantic_available: entry.semantic_available, grade_ranges: [...new Set(entry.rows.map(row => row.grade_range))],
      message: entry.semantic_available ? null : 'La búsqueda por texto está disponible. La búsqueda por significado no está disponible en este momento.' };
  }
  return { search, catalog, filters: async raw => (await catalog()).filter(d => matches(d.row, validateFilters(raw))).map(d => d.row),
    invalidate: () => { documents = null; cache.clear(); }, stats: () => ({ catalog_size: documents?.length || 0, cached_queries: cache.size, ttl_seconds: ttl / 1000 }) };
}
module.exports = { createSearchService, normalize, tokens, gradeBounds, gradeMatches, validateFilters, prepare, rank };
