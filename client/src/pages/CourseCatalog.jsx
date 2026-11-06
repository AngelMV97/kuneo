import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import TabBar from '../components/TabBar';
import { modules as modulesApi } from '../utils/kuneoApi';
import { supabase } from '../supabaseClient';
import { onProfileUpdated } from '../utils/profileEvents';
import { learningApi } from '../utils/learningApi';
import { 
  CalculatorIcon, 
  LanguageIcon, 
  FlaskIcon, 
  GlobeIcon, 
  MessageSquareIcon 
} from '../components/icons/MinimalIcons';

/**
 * CourseCatalog - Catálogo de asignaturas y módulos
 * Tab "Explorar"
 */
const CourseCatalog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const subject = searchParams.get('subject');
    return ['mathematics', 'language', 'natural_sciences', 'social_studies', 'english'].includes(subject) ? subject : null;
  });
  const [modulesList, setModulesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [overviewRetry, setOverviewRetry] = useState(0);
  const userGrade = profile?.grade_level || null;

  useEffect(() => {
    // Get current user and profile
    const getUser = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('No se pudo verificar tu sesión. Vuelve a iniciar sesión.');
      if (user) {
        setUserId(user.id);
        
        // Get profile for username (RPC returns array, we need first element)
        const { data: profileData } = await supabase
          .rpc('kuneo_get_user_profile', { p_user_id: user.id });
        if (profileData) {
          const profileObject = Array.isArray(profileData) ? profileData[0] : profileData;
          setProfile(profileObject);
        }
      }
    };
    getUser().catch(err => setOverviewError(err.message));
    
    // Listen for profile updates from other components
    const unsubscribe = onProfileUpdated((updatedProfile) => {
      setProfile(updatedProfile);
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setOverview(null);
    setOverviewError(null);
    learningApi.overview()
      .then(data => { if (active) setOverview(data); })
      .catch(err => { if (active) setOverviewError(err.message); });
    return () => { active = false; };
  }, [userId, overviewRetry]);

  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    return 'Explorador';
  };

  const subjects = [
    {
      id: 'mathematics',
      name: 'Matemáticas',
      description: 'Resolver problemas, descubrir patrones, pensar mejor.',
      icon: CalculatorIcon,
      bgColor: '#2d1f47',
      iconColor: '#a855f7',
      buttonColor: '#9333ea'
    },
    {
      id: 'language',
      name: 'Lenguaje',
      description: 'Comunicar ideas, leer el mundo, escribir tu historia.',
      icon: LanguageIcon,
      bgColor: '#1f4a4a',
      iconColor: '#06b6d4',
      buttonColor: '#0891b2'
    },
    {
      id: 'natural_sciences',
      name: 'Ciencias',
      description: 'Explorar la naturaleza, entender el mundo, hacer preguntas.',
      icon: FlaskIcon,
      bgColor: '#1f2f4f',
      iconColor: '#3b82f6',
      buttonColor: '#2563eb'
    },
    {
      id: 'social_studies',
      name: 'Ciencias Sociales',
      description: 'Conocer sociedades, comprender culturas, transformar realidades.',
      icon: GlobeIcon,
      bgColor: '#4a3229',
      iconColor: '#f97316',
      buttonColor: '#c2410c'
    },
    {
      id: 'english',
      name: 'Inglés',
      description: 'Abrir puertas, escuchar el mundo, expresar sin límites.',
      icon: MessageSquareIcon,
      bgColor: '#3f3b2a',
      iconColor: '#eab308',
      buttonColor: '#ca8a04',
      fullWidth: true
    }
  ];

  const loadModules = useCallback(async (subjectId) => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Pass user's grade level to filter modules appropriately
      const data = await modulesApi.getModules(subjectId, userGrade);
      setModulesList(data || []);
    } catch (err) {
      console.error('Error loading modules:', err);
      setError('Error al cargar módulos. Por favor intenta de nuevo.');
      setModulesList([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userGrade]);

  useEffect(() => {
    if (selectedSubject && userId && profile) {
      loadModules(selectedSubject);
    }
  }, [selectedSubject, userId, profile, loadModules]);

  const handleModuleClick = (moduleId, isLocked) => {
    if (isLocked) {
      // TODO: Mostrar mensaje de módulo bloqueado
      return;
    }
    navigate(`/module/${moduleId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] pb-24 pt-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Tuko */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Hola, {getDisplayName()}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ¿Qué te gustaría aprender hoy?
            </p>
          </div>
          
          {/* Tuko head with circular frame */}
          <div className="w-14 h-14 rounded-full bg-white dark:bg-[#1e2439] border-2 border-gray-200 dark:border-[#2a3149] 
                        flex items-center justify-center overflow-hidden flex-shrink-0">
            <img 
              src="/image/characters/tuko-head.png" 
              alt="Tuko" 
              className="w-12 h-12 object-cover"
            />
          </div>
        </div>

        {/* Progress card and Tuko section */}
        <div className="mb-6 flex gap-3 relative overflow-hidden">
          {/* Same consolidated-module metric as the Progress tab. */}
          <div className="flex-1 bg-white dark:bg-[#1e2439] rounded-3xl p-5 min-w-0 
                        border border-gray-200 dark:border-transparent shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500 
                              flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                </div>
                <span className="text-gray-900 dark:text-white font-medium text-sm">Módulos consolidados</span>
              </div>
              <button onClick={() => navigate('/progress')} className="text-gray-600 dark:text-gray-400 text-xs hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0">
                Ver más
              </button>
            </div>
            
            {overviewError ? <div role="alert" className="text-amber-600 dark:text-amber-300 text-sm">
              No pudimos cargar tu avance. <button onClick={() => setOverviewRetry(value => value + 1)} className="underline">Reintentar</button>
            </div> : !overview ? <p role="status" className="text-gray-500">Cargando tu avance…</p> : <>
              <div className="text-4xl font-bold text-purple-500 mb-1">
                {overview.total ? `${overview.generalProgress}%` : 'Sin actividad'}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                {overview.total ? `${overview.completed} de ${overview.total} módulos practicados consolidados` : 'Explora una materia para comenzar.'}
              </p>
              <div className="relative w-full h-2 bg-gray-200 dark:bg-[#2a3149] rounded-full overflow-hidden" role="progressbar" aria-label="Módulos consolidados" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overview.generalProgress}>
                <div style={{ width: `${overview.generalProgress}%` }} className="absolute top-0 left-0 h-full bg-purple-500 rounded-full"></div>
              </div>
            </>}
          </div>
          
          {/* Tuko standing with fade effect */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <img 
              src="/image/characters/tuko-standing-up.png" 
              alt="Tuko" 
              className="w-full h-full object-contain relative z-10"
            />
            {/* Fade gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-20 
                          bg-gradient-to-t from-gray-50 dark:from-[#13172a] to-transparent z-20"></div>
          </div>
        </div>

        {/* Section title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Explora las materias
        </h2>

        {/* Subject selector */}
        {!selectedSubject ? (
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((subject, index) => {
              const IconComponent = subject.icon;
              return (
                <Motion.button
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`relative overflow-hidden rounded-3xl p-5 pb-14 text-left
                           shadow-lg hover:shadow-2xl hover:shadow-${subject.iconColor}/20
                           transition-all duration-300 hover:scale-[1.02]
                           ${subject.fullWidth ? 'col-span-2' : ''}`}
                  style={{ 
                    backgroundColor: subject.bgColor,
                    backdropFilter: 'blur(10px)',
                    opacity: 0.95
                  }}
                >
                  <div className="relative z-10">
                    <div className="mb-3">
                      <IconComponent 
                        className="w-12 h-12" 
                        color={subject.iconColor}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {subject.name}
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {subject.description}
                    </p>
                  </div>
                  
                  {/* Arrow button - smaller and better positioned */}
                  <div className="absolute bottom-4 right-4">
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: subject.buttonColor }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Motion.button>
              );
            })}
          </div>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={() => setSelectedSubject(null)}
              className="mb-6 flex items-center gap-2 text-purple-400 
                       hover:text-purple-300 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a asignaturas
            </button>

            {/* Modules list */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 mt-4">Cargando módulos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 text-lg mb-4">⚠️ {error}</div>
                <button
                  onClick={() => loadModules(selectedSubject)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Reintentar
                </button>
              </div>
            ) : modulesList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No hay módulos disponibles para esta asignatura
              </div>
            ) : (
              <div className="space-y-4">
                {modulesList.map((module, index) => (
                  <Motion.button
                    key={module.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleModuleClick(module.id, module.isLocked)}
                    disabled={module.isLocked}
                    className={`w-full text-left p-6 rounded-2xl shadow-lg
                              bg-[#1e2439]
                              transition-all duration-200
                              ${module.isLocked
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-[1.02]'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {module.title}
                          </h3>
                          {module.isLocked && (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-gray-400 mb-3">
                          {module.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span>⏱️</span> {module.duration || '15-20 min'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📊</span> Nivel {module.difficulty || 2}
                          </span>
                        </div>
                      </div>

                      {!module.isLocked && (
                        <div className="ml-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-orange-400 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </Motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <TabBar />
    </div>
  );
};

export default CourseCatalog;
