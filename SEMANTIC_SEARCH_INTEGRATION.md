# KUNEO - Integración de Búsqueda Semántica

## 📋 Estado Actual

✅ **Pipeline de Embeddings Completado**
- 1,426 competency units en Supabase
- Embeddings vectoriales (1536 dims) listos
- Índice HNSW para búsqueda rápida
- Funciones RPC configuradas

---

## 🎯 Siguientes Pasos

### 1. Backend: Crear Endpoint de Búsqueda Semántica

**Archivo**: `server/competencies.js` (nuevo)

```javascript
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * POST /api/competencies/search
 * Búsqueda semántica de competency units
 * 
 * Body:
 * {
 *   query: "texto a buscar",
 *   filters: {
 *     subject?: "mathematics" | "natural_sciences" | "social_studies" | "english" | "language",
 *     grade_range?: "1-3" | "4-5" | "6-7" | "8-9" | "10-11",
 *     difficulty?: 1-5,
 *     source?: "dba" | "standard"
 *   },
 *   match_threshold?: 0.5,  // similarity threshold (0-1)
 *   match_count?: 10         // number of results
 * }
 */
router.post('/search', async (req, res) => {
  try {
    const { query, filters = {}, match_threshold = 0.5, match_count = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // 1. Generar embedding del query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float'
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Buscar en Supabase usando RPC
    const { data, error } = await supabase.rpc('search_competency_units', {
      query_embedding: queryEmbedding,
      match_threshold,
      match_count,
      filter_subject: filters.subject || null,
      filter_grade_range: filters.grade_range || null,
      filter_difficulty: filters.difficulty || null,
      filter_source: filters.source || null
    });

    if (error) {
      console.error('Supabase search error:', error);
      return res.status(500).json({ error: 'Search failed', details: error.message });
    }

    res.json({
      query,
      filters,
      results: data,
      count: data.length
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/competencies/filters
 * Obtener competency units con filtros (sin búsqueda semántica)
 */
router.get('/filters', async (req, res) => {
  try {
    const { subject, grade_range, difficulty, source, limit = 50 } = req.query;

    const { data, error } = await supabase.rpc('get_competency_units', {
      filter_subject: subject || null,
      filter_grade_range: grade_range || null,
      filter_difficulty: difficulty ? parseInt(difficulty) : null,
      filter_source: source || null,
      limit_count: parseInt(limit)
    });

    if (error) {
      console.error('Supabase filter error:', error);
      return res.status(500).json({ error: 'Filter failed', details: error.message });
    }

    res.json({
      filters: { subject, grade_range, difficulty, source },
      results: data,
      count: data.length
    });

  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/competencies/:id
 * Obtener un competency unit específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .schema('kuneo')
      .from('competency_units')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Competency unit not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Fetch failed', details: error.message });
    }

    res.json(data);

  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
```

---

### 2. Backend: Montar Router

**Archivo**: `server/index.js` (o donde estén los routers principales)

```javascript
// Agregar al final de los imports
const competenciesRouter = require('./competencies');

// Agregar después de otros routers
app.use('/api/competencies', competenciesRouter);
```

---

### 3. Frontend: Cliente API

**Archivo**: `client/src/utils/kuneoApi.js` (agregar al final)

```javascript
/**
 * Búsqueda semántica de competency units
 */
export const searchCompetencies = async (query, filters = {}, options = {}) => {
  try {
    const response = await api.post('/competencies/search', {
      query,
      filters,
      match_threshold: options.threshold || 0.5,
      match_count: options.limit || 10
    });
    return response.data;
  } catch (error) {
    console.error('Search competencies error:', error);
    throw error;
  }
};

/**
 * Obtener competency units con filtros
 */
export const getCompetenciesByFilters = async (filters = {}, limit = 50) => {
  try {
    const params = new URLSearchParams({
      ...filters,
      limit: limit.toString()
    });
    
    const response = await api.get(`/competencies/filters?${params}`);
    return response.data;
  } catch (error) {
    console.error('Get competencies by filters error:', error);
    throw error;
  }
};

/**
 * Obtener un competency unit específico
 */
export const getCompetencyById = async (id) => {
  try {
    const response = await api.get(`/competencies/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get competency by id error:', error);
    throw error;
  }
};
```

---

### 4. Frontend: Componente de Búsqueda Semántica

**Archivo**: `client/src/components/SemanticSearch.jsx` (nuevo)

```jsx
import React, { useState } from 'react';
import { searchCompetencies } from '../utils/kuneoApi';

const SUBJECTS = [
  { value: 'mathematics', label: 'Matemáticas' },
  { value: 'natural_sciences', label: 'Ciencias Naturales' },
  { value: 'social_studies', label: 'Ciencias Sociales' },
  { value: 'english', label: 'Inglés' },
  { value: 'language', label: 'Lenguaje' }
];

const GRADE_RANGES = [
  { value: '1-3', label: 'Grados 1-3' },
  { value: '4-5', label: 'Grados 4-5' },
  { value: '6-7', label: 'Grados 6-7' },
  { value: '8-9', label: 'Grados 8-9' },
  { value: '10-11', label: 'Grados 10-11' }
];

const SOURCES = [
  { value: 'dba', label: 'DBAs' },
  { value: 'standard', label: 'Estándares' }
];

export default function SemanticSearch({ onResultSelect }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await searchCompetencies(query, filters, { limit: 10 });
      setResults(response.results);
    } catch (err) {
      setError('Error en la búsqueda. Por favor intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  return (
    <div className="semantic-search">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar competencias... (ej: resolver ecuaciones lineales)"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Materia */}
          <div>
            <label className="block text-sm font-medium mb-1">Materia</label>
            <select
              value={filters.subject || ''}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todas</option>
              {SUBJECTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Grado */}
          <div>
            <label className="block text-sm font-medium mb-1">Grado</label>
            <select
              value={filters.grade_range || ''}
              onChange={(e) => handleFilterChange('grade_range', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos</option>
              {GRADE_RANGES.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Fuente */}
          <div>
            <label className="block text-sm font-medium mb-1">Fuente</label>
            <select
              value={filters.source || ''}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todas</option>
              {SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">
            {results.length} resultados encontrados
          </h3>
          
          {results.map((result) => (
            <div
              key={result.id}
              className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition"
              onClick={() => onResultSelect?.(result)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    {SUBJECTS.find(s => s.value === result.subject)?.label || result.subject}
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">
                    Grados {result.grade_range}
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">
                    {result.source === 'dba' ? 'DBA' : 'Estándar'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {(result.similarity * 100).toFixed(0)}% similar
                </span>
              </div>
              
              <p className="text-gray-900 mb-2">
                {result.content.competency}
              </p>
              
              {result.content.evidence?.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>Evidencias:</strong> {result.content.evidence[0]}
                  {result.content.evidence.length > 1 && ` (+${result.content.evidence.length - 1} más)`}
                </div>
              )}
              
              {result.content.concepts?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.content.concepts.slice(0, 5).map((concept, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {concept}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && results.length === 0 && query && (
        <div className="mt-6 text-center text-gray-500">
          No se encontraron resultados para "{query}"
        </div>
      )}
    </div>
  );
}
```

---

### 5. Instalar Dependencias

```bash
# Backend
cd server
npm install openai

# Frontend (si no está instalado)
cd ../client
npm install
```

---

## 🧪 Pruebas

### Probar Backend con cURL

```bash
# Búsqueda semántica
curl -X POST http://localhost:3001/api/competencies/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "resolver ecuaciones lineales",
    "filters": {
      "subject": "mathematics",
      "grade_range": "8-9"
    },
    "match_count": 5
  }'

# Filtros sin búsqueda
curl http://localhost:3001/api/competencies/filters?subject=mathematics&grade_range=6-7&limit=10

# Obtener por ID
curl http://localhost:3001/api/competencies/aab1f7a2-51d6-4f72-bfc5-1e2db0858202
```

---

## ⚠️ Nota Importante: Nombres de Materias

Los datos actualmente tienen nombres en **inglés**:
- `mathematics` (no `matematicas`)
- `natural_sciences` (no `ciencias`)
- `social_studies` (no `sociales`)
- `english` (no `ingles`)
- `language` (no `lenguaje`)

**Opciones**:
1. **Mantener inglés** y actualizar frontend con mapeo (más fácil)
2. **Corregir a español** ejecutando script de migración en Supabase (más consistente)

El componente React arriba ya incluye el mapeo visual para mostrar nombres en español al usuario.

---

## 📊 Métricas a Monitorear

1. **Latencia de búsqueda**: ~500-1000ms (embedding + query)
2. **Precisión**: Similarity > 0.7 = resultados relevantes
3. **Uso de embeddings**: ~$0.10 por 1M tokens (OpenAI)

---

## 🔄 Optimizaciones Futuras

1. **Caché de embeddings**: Guardar embeddings de queries frecuentes
2. **Índice ajustado**: Optimizar parámetros HNSW según uso
3. **Búsqueda híbrida**: Combinar semántica + texto completo (FTS)

---

Fecha: 2025-01-15
