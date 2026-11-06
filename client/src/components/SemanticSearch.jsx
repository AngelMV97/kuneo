import { useState, useRef, useEffect } from 'react';
import { competencies } from '../utils/kuneoApi';
import { SearchIcon } from './icons/MinimalIcons';

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

export default function SemanticSearch({ onResultSelect, onSearchCompleted }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(null);
  const [submitted, setSubmitted] = useState('');
  const version = useRef(0);
  useEffect(() => () => { version.current++; }, []);
  const reset = () => { version.current++; setResults([]); setPage(null); setSubmitted(''); setError(null); setLoading(false); };
  const search = async (offset = 0) => {
    const current = ++version.current;
    setLoading(true); setError(null);
    if (!offset) { setResults([]); setPage(null); setSubmitted(query.trim()); }
    try {
      const response = await competencies.search(query.trim(), filters, { limit: 20, offset });
      if (current !== version.current) return;
      setResults(prev => offset ? [...new Map([...prev, ...response.results].map(r => [r.id, r])).values()] : response.results);
      setPage(response); onSearchCompleted?.(response.total > 0);
    } catch {
      if (current === version.current) setError('No se pudo completar la búsqueda. Intenta nuevamente.');
    } finally { if (current === version.current) setLoading(false); }
  };
  const handleSearch = e => { e.preventDefault(); if (query.trim()) search(); };
  const handleFilterChange = (key, value) => {
    reset();
    setFilters(prev => { const next = { ...prev }; if (value) next[key] = value; else delete next[key]; return next; });
  };

  return (
    <div className="semantic-search">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => { reset(); setQuery(e.target.value); }}
              maxLength={500}
              placeholder="Buscar competencias... (ej: resolver ecuaciones lineales)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-[#1e2439] text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400
                       transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg 
                     hover:bg-purple-700 dark:hover:bg-purple-600
                     disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed 
                     transition-colors font-medium whitespace-nowrap"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {/* Materia */}
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Materia
            </label>
            <div className="relative">
              <select
                value={filters.subject || ''}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-[#1e2439] text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                         transition-colors appearance-none cursor-pointer
                         text-ellipsis overflow-hidden"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Todas</option>
                {SUBJECTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grado */}
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Grado
            </label>
            <div className="relative">
              <select
                value={filters.grade_range || ''}
                onChange={(e) => handleFilterChange('grade_range', e.target.value)}
                className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-[#1e2439] text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                         transition-colors appearance-none cursor-pointer
                         text-ellipsis overflow-hidden"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Todos</option>
                {GRADE_RANGES.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fuente */}
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Fuente
            </label>
            <div className="relative">
              <select
                value={filters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-[#1e2439] text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                         transition-colors appearance-none cursor-pointer
                         text-ellipsis overflow-hidden"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Todas</option>
                {SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {page?.message && <p role="status" className="mt-4 text-sm text-gray-600 dark:text-gray-300">{page.message}</p>}
      {/* Resultados */}
      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Mostrando {results.length} de {page?.total} coincidencias recuperadas
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">Grados con coincidencias: {page?.grade_ranges?.join(', ')}. Filtra por materia para distinguir los enfoques.</p>
          {results.map((result) => (
            <button
              type="button"
              key={result.id}
              className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                       hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-md 
                       cursor-pointer transition-all
                       bg-white dark:bg-[#1e2439]"
              onClick={() => onResultSelect?.(result)}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 
                                 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                    {SUBJECTS.find(s => s.value === result.subject)?.label || result.subject}
                  </span>
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Grados {result.grade_range}
                  </span>
                  <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 
                                 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded
                                 border border-blue-200 dark:border-blue-800/30">
                    {result.source === 'dba' ? 'DBA' : 'Estándar'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Dificultad: {result.difficulty}/5
                  </span>
                </div>
                <span className="text-xs md:text-sm font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                  {result.retrieval === 'text' ? 'Coincidencia de texto' : result.retrieval === 'hybrid' ? 'Texto y significado' : 'Relación por significado'}
                </span>
              </div>
              
              <p className="text-gray-900 dark:text-white mb-2 text-sm md:text-base line-clamp-2">
                {result.content.competency}
              </p>
              
              {result.content.evidence?.length > 0 && (
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  <strong>Evidencias:</strong> {result.content.evidence[0]}
                  {result.content.evidence.length > 1 && (
                    <span className="text-gray-500 dark:text-gray-500 ml-1">
                      (+{result.content.evidence.length - 1} más)
                    </span>
                  )}
                </div>
              )}
              
              {result.content.concepts?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.content.concepts.slice(0, 5).map((concept, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs rounded"
                    >
                      {concept}
                    </span>
                  ))}
                  {result.content.concepts.length > 5 && (
                    <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                      +{result.content.concepts.length - 5} más
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
          {page?.next_offset != null && <button type="button" disabled={loading} onClick={() => search(page.next_offset)} className="rounded-lg bg-purple-600 px-5 py-3 text-white disabled:opacity-50">{loading ? 'Buscando...' : 'Cargar más competencias'}</button>}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !error && page && results.length === 0 && submitted && (
        <div className="mt-6 text-center p-8 bg-gray-50 dark:bg-[#1e2439] rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron resultados para "{submitted}"
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Intenta con otros términos o ajusta los filtros
          </p>
        </div>
      )}
    </div>
  );
}
