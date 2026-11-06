import LearningDetails, { ActivityHistory } from '../components/LearningDetails';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { learningApi, cognitiveView } from '../utils/learningApi';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  CalculatorIcon,
  LanguageIcon,
  FlaskIcon,
  GlobeIcon,
  MessageSquareIcon,
  ChevronRightIcon,
  BrainIcon,
  CubeIcon,
  TransferIcon,
  LightBulbIcon,
  EditIcon,
  MessageCircleIcon,
  TargetIcon
} from '../components/icons/MinimalIcons';

/**
 * ProgressView - Mi progreso
 * Muestra el progreso académico del usuario con 4 tabs:
 * - Resumen: Visión general con métricas y desempeño
 * - Materias: Detalles por materia
 * - Habilidades: Dimensiones cognitivas
 * - Actividad: Historial de actividad reciente
 */
export default function ProgressView() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = ['materias', 'habilidades', 'actividad'].includes(requestedTab) ? requestedTab : 'resumen';
  const setActiveTab = tab => setSearchParams(tab === 'resumen' ? {} : { tab });
  const openHistory = (kind, item) => setSearchParams({ tab: 'actividad', [kind === 'subject' ? 'subject' : 'dimension']: item.id });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Get user profile
      const { data: profileData } = await supabase
        .rpc('kuneo_get_user_profile', { p_user_id: user.id });
      
      if (profileData) {
        const profileObject = Array.isArray(profileData) ? profileData[0] : profileData;
        setProfile(profileObject);
      }
      const data = await learningApi.overview();
      const icons = { mathematics: CalculatorIcon, language: LanguageIcon, natural_sciences: FlaskIcon, social_studies: GlobeIcon, english: MessageSquareIcon };
      const colors = ['purple', 'green', 'blue', 'orange', 'yellow'];
      const skillIcons = { brain: BrainIcon, check: CheckCircleIcon, cube: CubeIcon, transfer: TransferIcon, lightbulb: LightBulbIcon };
      setProgressData({ ...data, subjects: data.subjects.map((subject, i) => ({ ...subject, icon: icons[subject.id], color: colors[i] })),
        cognitiveSkills: cognitiveView(data).dimensions.map(d => ({ ...d, icon: skillIcons[d.icon] })) });
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const historySubject = progressData?.subjects.find(subject => subject.id === searchParams.get('subject'));
  const historySkill = historySubject ? null : progressData?.cognitiveSkills.find(skill => skill.id === searchParams.get('dimension'));
  const filterId = historySubject?.id || historySkill?.id;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab, filterId]);

  const getDisplayName = () => {
    return profile?.username || 'Explorador';
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'materias', label: 'Materias' },
    { id: 'habilidades', label: 'Habilidades' },
    { id: 'actividad', label: 'Actividad' }
  ];

  const getSubjectColors = (color) => {
    const colors = {
      purple: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', icon: 'text-purple-500', bar: 'bg-purple-500' },
      green: { bg: 'bg-green-500/10 dark:bg-green-500/20', icon: 'text-green-500', bar: 'bg-green-500' },
      blue: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', icon: 'text-blue-500', bar: 'bg-blue-500' },
      orange: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', icon: 'text-orange-500', bar: 'bg-orange-500' },
      yellow: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', icon: 'text-yellow-500', bar: 'bg-yellow-500' }
    };
    return colors[color] || colors.purple;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !progressData) return <div role="alert" className="p-8 dark:text-white">{error || 'No se pudo cargar tu progreso.'} <button className="underline" onClick={loadData}>Reintentar</button></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e2439] border-b border-gray-200 dark:border-[#2a3149] px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a3149] rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mi progreso
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1e2439] border-b border-gray-200 dark:border-[#2a3149] px-4">
        <div className="flex gap-2 max-w-4xl mx-auto overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!progressData.hasActivity && <p className="text-gray-500 mb-4">Empieza un módulo desde Explorar. Aquí verás tus resultados cuando respondas actividades.</p>}
        {/* Tab: Resumen */}
        {activeTab === 'resumen' && (
          <div className="space-y-4">
            {/* Greeting Card with Tuko */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {progressData.hasActivity ? `Tu actividad, ${getDisplayName()}` : `Comienza a aprender, ${getDisplayName()}`}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aquí tienes un resumen de tu progreso académico.
                  </p>
                </div>
                {/* Tuko Avatar - Larger, no frame */}
                <div className="flex-shrink-0 ml-4">
                  <img
                    src="/image/characters/tuko-torso.png"
                    alt="Tuko"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              </div>
            </Motion.div>

            {/* General Summary Card */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Resumen general
              </h3>
              
              <div className="flex items-start gap-6 mb-6">
                {/* Progress Circle */}
                <div className="flex-shrink-0">
                  <div className="relative w-28 h-28">
                    <svg className="transform -rotate-90 w-28 h-28">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 48}`}
                        strokeDashoffset={`${2 * Math.PI * 48 * (1 - progressData.generalProgress / 100)}`}
                        className="text-purple-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {progressData.total ? `${progressData.generalProgress}%` : '—'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Módulos<br />consolidados
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Text */}
                <div className="flex-1 pt-4">
                  <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {progressData.hasActivity ? 'Este es tu progreso registrado.' : 'Aún no tienes actividad registrada.'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {progressData.total ? `${progressData.completed} de ${progressData.total} módulos practicados consolidados.` : 'Aún no has practicado ningún módulo.'} Cada módulo requiere consolidar todos sus objetivos y las cinco habilidades con dos aciertos consecutivos sin pistas.
                  </p>
                </div>
              </div>

              {/* Metrics - Responsive layout */}
              <div className="grid grid-cols-3 gap-4">
                {/* Completed */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {progressData.completed}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      Completados
                    </div>
                  </div>
                </div>

                {/* Study Time */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {progressData.studyTime.hours}h {progressData.studyTime.minutes}m
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      Tiempo de estudio
                    </div>
                  </div>
                </div>

                {/* Improvement */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {progressData.attempts}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      Intentos registrados
                    </div>
                  </div>
                </div>
              </div>
            </Motion.div>

            {/* Subject Performance */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Desempeño por materia
              </h3>
              <p className="text-sm text-gray-500 mb-4">Acierto ponderado de todos los intentos registrados en cada materia; no indica módulos completados.</p>

              <div className="space-y-3">
                {progressData.subjects.map((subject, index) => {
                  const Icon = subject.icon;
                  const colors = getSubjectColors(subject.color);

                  return (
                    <Motion.button
                      key={subject.id}
                      type="button"
                      onClick={() => openHistory('subject', subject)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="w-full text-left focus-visible:ring-2 focus-visible:ring-purple-500 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a3149] p-2 rounded-xl transition-colors"
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={colors.icon} />
                      </div>

                      {/* Name and Progress Bar */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {subject.name}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <Motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${subject.score}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className={`h-2 rounded-full ${colors.bar}`}
                          />
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-xl font-bold text-gray-900 dark:text-white flex-shrink-0">
                        {subject.count ? subject.score + '%' : 'Sin evaluar'}
                      </div>

                      {/* Chevron */}
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                    </Motion.button>
                  );
                })}
              </div>
            </Motion.div>

            {/* Key Skills - Cognitive Dimensions */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Habilidades cognitivas
                </h3>
                <button 
                  onClick={() => setActiveTab('habilidades')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Ver todas
                </button>
              </div>

              <div className="space-y-3">
                {progressData.cognitiveSkills.map((skill, index) => {
                  const Icon = skill.icon;
                  const colors = getSubjectColors(skill.color);

                  return (
                    <div key={skill.id} className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>

                      {/* Name and Progress Bar */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {skill.name}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <Motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.score}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className={`h-1.5 rounded-full ${colors.bar}`}
                          />
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0">
                        {skill.count ? `${skill.score}%` : 'Sin evaluar'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Motion.div>

            {/* Recent Activity */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Actividad reciente
                </h3>
                <button 
                  onClick={() => setActiveTab('actividad')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Ver todas
                </button>
              </div>

              <div className="space-y-3">
                {progressData.recentActivity.slice(0, 3).map((activity, index) => (
                  <Motion.button
                    key={activity.id}
                      type="button"
                      onClick={() => setDetail({ kind: 'activity', item: activity })}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="w-full text-left focus-visible:ring-2 focus-visible:ring-purple-500 flex items-start justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2a3149] rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
                          {activity.subject}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(activity.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activity.title}
                      </h4>
                    </div>
                    
                    <div className={`text-xl font-bold flex-shrink-0 ml-4 ${
                      activity.score >= 80 ? 'text-green-600 dark:text-green-400' :
                      activity.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {activity.score}%
                    </div>
                  </Motion.button>
                ))}
              </div>
            </Motion.div>
          </div>
        )}

        {/* Tab: Materias */}
        {activeTab === 'materias' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Explora tu desempeño detallado en cada materia.
            </p>

            {progressData.subjects.map((subject, index) => {
              const Icon = subject.icon;
              const colors = getSubjectColors(subject.color);

              return (
                <Motion.button
                  key={subject.id}
                      type="button"
                      onClick={() => openHistory('subject', subject)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full text-left focus-visible:ring-2 focus-visible:ring-purple-500 bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={colors.icon} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {subject.name}
                      </h3>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        {subject.count ? subject.score + '%' : 'Sin evaluar'}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                        <Motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.score}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                          className={`h-3 rounded-full ${colors.bar}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {subject.count} intentos registrados
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1">
                          Ver detalles
                          <ChevronRightIcon className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Motion.button>
              );
            })}
          </div>
        )}

        {/* Tab: Habilidades */}
        {activeTab === 'habilidades' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tus habilidades cognitivas medidas a través de tu desempeño.
            </p>

            {progressData.cognitiveSkills.map((skill, index) => {
              const Icon = skill.icon;
              const colors = getSubjectColors(skill.color);

              return (
                <Motion.button
                  key={skill.id}
                      type="button"
                      onClick={() => openHistory('dimension', skill)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full text-left focus-visible:ring-2 focus-visible:ring-purple-500 bg-white dark:bg-[#1e2439] rounded-2xl p-5 border border-gray-200 dark:border-transparent shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                            {skill.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {skill.description}
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {skill.count ? `${skill.score}%` : 'Sin evaluar'}
                          </div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {skill.level}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <Motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.score}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                          className={`h-2 rounded-full ${colors.bar}`}
                        />
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-600 flex-shrink-0 mt-2" />
                  </div>
                </Motion.button>
              );
            })}

            {/* Link to Profile */}
            <Motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate('/profile')}
              className="w-full text-left focus-visible:ring-2 focus-visible:ring-purple-500 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <TargetIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-1">
                    Ver perfil cognitivo completo
                  </h4>
                  <p className="text-sm text-white/90">
                    Explora tu mapa cognitivo y recomendaciones personalizadas.
                  </p>
                </div>
                <ChevronRightIcon className="w-6 h-6 text-white/80 flex-shrink-0" />
              </div>
            </Motion.button>
          </div>
        )}

        {/* Tab: Actividad */}
        {activeTab === 'actividad' && <section className="space-y-5 text-gray-900 dark:text-white">
          <div className="bg-white dark:bg-[#1e2439] rounded-2xl p-5 space-y-3">
            <h2 className="text-xl font-bold">{historySubject?.name || historySkill?.name || 'Tu historial de actividades'}</h2>
            <label className="block text-sm">
              <span className="block text-gray-600 dark:text-gray-400 mb-2">Mostrar actividades de</span>
              <select aria-label="Filtrar actividades" value={historySubject ? `subject:${historySubject.id}` : historySkill ? `dimension:${historySkill.id}` : 'all'} onChange={event => {
                const [kind, id] = event.target.value.split(':');
                setSearchParams(kind === 'all' ? { tab: 'actividad' } : { tab: 'actividad', [kind]: id });
              }} className="w-full rounded-xl p-3 bg-gray-100 dark:bg-[#13172a] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                <option value="all">Todas las actividades</option>
                <optgroup label="Materias">{progressData.subjects.map(subject => <option key={subject.id} value={`subject:${subject.id}`}>{subject.name}</option>)}</optgroup>
                <optgroup label="Habilidades">{progressData.cognitiveSkills.map(skill => <option key={skill.id} value={`dimension:${skill.id}`}>{skill.name}</option>)}</optgroup>
              </select>
            </label>
            {(historySubject || historySkill) && <>
              <p className="font-semibold">{(historySubject || historySkill).count ? `${(historySubject || historySkill).score}% de acierto ponderado` : 'Sin evaluar'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{historySubject ? 'El resultado de la materia considera todos sus intentos.' : 'El resultado de la habilidad considera hasta 20 intentos recientes. Aquí puedes consultar todo su historial.'}</p>
              <button type="button" onClick={() => setActiveTab('actividad')} className="text-purple-600 dark:text-purple-400 underline">Quitar filtro</button>
            </>}
          </div>
          <ActivityHistory subject={historySubject?.id} dimension={historySkill?.id} onSelect={activity => setDetail({ kind: 'activity', item: activity })} />
        </section>}
      </div>
      <LearningDetails selection={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
