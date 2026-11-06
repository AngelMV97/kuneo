import LearningDetails from '../components/LearningDetails';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { learningApi, cognitiveView } from '../utils/learningApi';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { 
  ArrowLeftIcon, 
  InfoIcon, 
  BrainIcon, 
  CheckCircleIcon, 
  CubeIcon, 
  TransferIcon, 
  LightBulbIcon,
  ChevronRightIcon,
  TargetIcon
} from '../components/icons/MinimalIcons';

/**
 * Profile - Mi perfil cognitivo
 * Muestra las dimensiones cognitivas del usuario con gráfico radar
 */
export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [detail, setDetail] = useState(null);
  const [cognitiveProfile, setCognitiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfileData = useCallback(async () => {
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

      setCognitiveProfile(cognitiveView(await learningApi.overview()));
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const getDisplayName = () => {
    return profile?.username || 'Explorador';
  };

  const getDimensionIcon = (iconType) => {
    const icons = {
      brain: BrainIcon,
      check: CheckCircleIcon,
      cube: CubeIcon,
      transfer: TransferIcon,
      lightbulb: LightBulbIcon
    };
    return icons[iconType] || BrainIcon;
  };

  const getDimensionColors = (color) => {
    const colors = {
      purple: {
        icon: 'text-purple-500',
        bg: 'bg-purple-500/10',
        bar: 'bg-purple-500'
      },
      green: {
        icon: 'text-green-500',
        bg: 'bg-green-500/10',
        bar: 'bg-green-500'
      },
      blue: {
        icon: 'text-blue-500',
        bg: 'bg-blue-500/10',
        bar: 'bg-blue-500'
      },
      orange: {
        icon: 'text-orange-500',
        bg: 'bg-orange-500/10',
        bar: 'bg-orange-500'
      },
      yellow: {
        icon: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        bar: 'bg-yellow-500'
      }
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

  if (error) return <div role="alert" className="p-8 dark:text-white">{error} <button className="underline" onClick={loadProfileData}>Reintentar</button></div>;

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
            Mi perfil cognitivo
          </h1>
          <button type="button" onClick={() => setDetail({ kind: 'info' })} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a3149] rounded-lg transition-colors">
            <InfoIcon className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Card */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm"
        >
          <div className="flex items-start gap-4">
            {/* Character Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 p-1">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#13172a] flex items-center justify-center overflow-hidden">
                  <img
                    src="/image/characters/tuko-torso.png"
                    alt="Tuko"
                    className="w-20 h-20 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Greeting and Description */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Hola, {getDisplayName()}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conoce tus fortalezas cognitivas y áreas de crecimiento.
              </p>
            </div>

            {/* Overall Score Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-20 h-20">
                <svg className="transform -rotate-90 w-20 h-20">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - cognitiveProfile?.overallScore / 100)}`}
                    className="text-purple-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {cognitiveProfile?.assessedDimensions ? `${cognitiveProfile.overallScore}%` : '—'}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                Promedio evaluado
              </p>
              <p className="text-xs text-center font-medium text-purple-600 dark:text-purple-400">
                {cognitiveProfile?.level}
              </p>
            </div>
          </div>
        </Motion.div>

        {/* Cognitive Map Card */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 border border-gray-200 dark:border-transparent shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tu mapa cognitivo
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vista general de tus habilidades cognitivas
              </p>
            </div>
            <button type="button" onClick={() => setDetail({ kind: 'info' })} className="text-purple-600 dark:text-purple-400 flex items-center gap-1 text-sm font-medium hover:underline">
              <InfoIcon className="w-4 h-4" />
              Según tus intentos registrados
            </button>
          </div>

          <div className="h-64 w-full" role="img" aria-label="Resultados por habilidad cognitiva">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={(cognitiveProfile?.dimensions || []).map(d => ({ ...d, evaluatedScore: d.count ? d.score : null }))}>
                <PolarGrid stroke="#6b7280" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar dataKey="evaluatedScore" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} dot />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500">Acierto ponderado de hasta 20 intentos recientes por habilidad; las pistas reducen el peso del acierto. El promedio solo incluye habilidades evaluadas. Las demás no cuentan como cero ni como habilidades dominadas. Es una estimación de práctica, no un diagnóstico.</p>
        </Motion.div>

        {/* Dimensions Breakdown */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white px-1">
            Desglose por habilidad
          </h3>

          {cognitiveProfile?.dimensions.map((dimension, index) => {
            const Icon = getDimensionIcon(dimension.icon);
            const colors = getDimensionColors(dimension.color);

            return (
              <Motion.button
                key={dimension.id}
                type="button"
                onClick={() => navigate(`/progress?tab=actividad&dimension=${encodeURIComponent(dimension.id)}`)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
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
                          {dimension.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dimension.description}
                        </p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dimension.count ? `${dimension.score}%` : '—'}
                        </div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {dimension.level}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <Motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dimension.score}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
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
        </Motion.div>

        {/* Personalized Recommendation */}
        <Motion.button type="button" onClick={() => navigate('/catalog')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full text-left focus-visible:ring-2 focus-visible:ring-purple-500 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <TargetIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white mb-2">
                Recomendación personalizada
              </h4>
              <p className="text-sm text-white/90 mb-3">
                {cognitiveProfile?.dimensions.some(d => d.count) ? `Practica ${[...cognitiveProfile.dimensions].sort((a, b) => a.score - b.score)[0].name.toLowerCase()} con nuevas actividades.` : 'Completa tus primeras actividades para conocer tus habilidades.'}
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-white/80 flex-shrink-0 mt-1" />
          </div>
        </Motion.button>
      </div>
      <LearningDetails selection={detail} onClose={() => setDetail(null)} />
    </div>
  );
} 
