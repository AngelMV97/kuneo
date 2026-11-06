import { useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '../utils/learningApi';
import { useNavigate } from 'react-router-dom';
import SemanticSearch from '../components/SemanticSearch';
import { XIcon, CheckCircleIcon, AlertCircleIcon, LightBulbIcon, ArrowLeftIcon } from '../components/icons/MinimalIcons';

function RelatedModules({ id }) {
  const [state, setState] = useState({ loading: true });
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    apiFetch(`${API_BASE}/api/competencies/${encodeURIComponent(id)}/modules`).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json(); if (active) setState(data);
    }).catch(() => { if (active) setState({ error: true }); });
    return () => { active = false; };
  }, [id]);
  return <section className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-4 text-gray-900 dark:text-white">
    <h3 className="font-semibold mb-3">Módulos relacionados</h3>
    {state.loading ? <p>Cargando módulos...</p> : state.error ? <p>No se pudieron consultar los módulos. Vuelve a abrir la competencia para reintentar.</p> : state.modules?.length ? state.modules.map(module => <button key={module.id} className="block text-left text-purple-600 dark:text-purple-400 mb-3" onClick={() => navigate(`/module/${encodeURIComponent(module.id)}`)}>{module.title} · Grados {module.grade_range} →</button>) : <p>{state.message}</p>}
  </section>;
}

function CompetencySearch() {
  const [selectedCompetency, setSelectedCompetency] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();

  const handleResultSelect = (result) => {
    setSelectedCompetency(result);
  };

  const handleSearchCompleted = (hasResults) => {
    setHasSearched(hasResults);
  };

  const getSubjectLabel = (subject) => {
    const labels = {
      mathematics: 'Matemáticas',
      natural_sciences: 'Ciencias Naturales',
      social_studies: 'Ciencias Sociales',
      english: 'Inglés',
      language: 'Lenguaje'
    };
    return labels[subject] || subject;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] pb-24">
      {/* Top Navbar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#1e2439] border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg
                     text-gray-700 dark:text-gray-300
                     hover:bg-gray-100 dark:hover:bg-gray-700
                     transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Volver</span>
          </button>

          {/* Title */}
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">
            Búsqueda de Competencias
          </h1>

          {/* Info button - only show after search */}
          {hasSearched ? (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showInfo 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <LightBulbIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Ayuda</span>
            </button>
          ) : (
            <div className="w-[68px] sm:w-[88px]"></div> // Spacer for alignment
          )}
        </div>

        {/* Expandable Info Card */}
        {showInfo && hasSearched && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                ¿Cómo funciona?
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 dark:text-purple-400 font-bold mt-0.5">•</span>
                  <span>
                    Escribe tu búsqueda en lenguaje natural (ejemplo: "resolver ecuaciones lineales")
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 font-bold mt-0.5">•</span>
                  <span>
                    Filtra por materia, grado o fuente para resultados más específicos
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 font-bold mt-0.5">•</span>
                  <span>
                    La búsqueda combina coincidencias de texto y relación por significado; los filtros incluyen grados individuales dentro del rango
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 dark:text-orange-400 font-bold mt-0.5">•</span>
                  <span>
                    Haz clic en un resultado para ver todos los detalles de la competencia
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center text-sm md:text-base">
          Encuentra competencias educativas usando búsqueda semántica inteligente
        </p>

        {/* Search Component */}
        <div className="mb-6 md:mb-8">
          <SemanticSearch 
            onResultSelect={handleResultSelect}
            onSearchCompleted={handleSearchCompleted}
          />
        </div>

        {/* Info Card - only show before search */}
        {!hasSearched && (
          <div className="bg-white dark:bg-[#1e2439] rounded-xl shadow-lg p-4 md:p-6 border border-gray-200 dark:border-transparent">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-yellow-400" />
              ¿Cómo funciona?
            </h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 dark:text-purple-400 font-bold mt-0.5">•</span>
                <span>
                  Escribe tu búsqueda en lenguaje natural (ejemplo: "resolver ecuaciones lineales")
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 font-bold mt-0.5">•</span>
                <span>
                  Filtra por materia, grado o fuente para resultados más específicos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 font-bold mt-0.5">•</span>
                <span>
                  La búsqueda combina coincidencias de texto y relación por significado; los filtros incluyen grados individuales dentro del rango
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 dark:text-orange-400 font-bold mt-0.5">•</span>
                <span>
                  Haz clic en un resultado para ver todos los detalles de la competencia
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {selectedCompetency && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedCompetency(null)}
        >
          <div 
            className="bg-white dark:bg-[#1e2439] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1e2439] border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 flex items-start justify-between z-10">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white pr-4">
                Detalles de la Competencia
              </h2>
              <button
                onClick={() => setSelectedCompetency(null)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Materia</p>
                  <p className="font-semibold text-purple-700 dark:text-purple-300 text-sm">
                    {getSubjectLabel(selectedCompetency.subject)}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Grado</p>
                  <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                    {selectedCompetency.grade_range}°
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dificultad</p>
                  <p className="font-semibold text-green-700 dark:text-green-300 text-sm">
                    {selectedCompetency.difficulty || 1} / 5
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fuente</p>
                  <p className="font-semibold text-orange-700 dark:text-orange-300 text-sm">
                    {selectedCompetency.source === 'dba' ? 'DBA' : 'Estándar'}
                  </p>
                </div>
              </div>

              {/* Competency Text */}
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  Competencia
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                  {selectedCompetency.content?.competency}
                </p>
              </div>

              {/* Evidence */}
              {selectedCompetency.content?.evidence?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                    Evidencias
                  </h3>
                  <ul className="space-y-2">
                    {selectedCompetency.content.evidence.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm md:text-base">
                        <span className="text-green-500 dark:text-green-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Example */}
              {selectedCompetency.content?.example && (
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <LightBulbIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    Ejemplo
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                    {selectedCompetency.content.example}
                  </p>
                </div>
              )}

              {/* Concepts */}
              {selectedCompetency.content?.concepts?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Conceptos
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetency.content.concepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs md:text-sm border border-blue-200 dark:border-blue-800/30"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Misconceptions */}
              {selectedCompetency.content?.misconceptions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <AlertCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
                    Errores Comunes
                  </h3>
                  <ul className="space-y-2">
                    {selectedCompetency.content.misconceptions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm md:text-base">
                        <span className="text-red-500 dark:text-red-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <RelatedModules key={selectedCompetency.id} id={selectedCompetency.id} />
              {/* Similarity Score */}
              {selectedCompetency.similarity && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Similitud del vector (no es una probabilidad):{' '}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {(selectedCompetency.similarity * 100).toFixed(1)}%
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetencySearch;
