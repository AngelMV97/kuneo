import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import TabBar from '../components/TabBar';
import { 
  CalculatorIcon, 
  LanguageIcon, 
  FlaskIcon, 
  GlobeIcon, 
  MessageSquareIcon,
  ArrowLeftIcon
} from '../components/icons/MinimalIcons';

/**
 * IcfesPrep - Preparación para prueba ICFES Saber 11
 * "Integrador/Transferencia"
 */
const IcfesPrep = () => {
  const navigate = useNavigate();
  const { subject } = useParams();
  const [selectedSubject, setSelectedSubject] = useState(null);

  const subjects = [
    { 
      id: 'matematicas', 
      name: 'Matemáticas', 
      icon: CalculatorIcon,
      skills: 'Razonamiento • Resolución de problemas • Modelación',
      bgColor: 'bg-purple-500',
      iconColor: 'text-purple-500'
    },
    { 
      id: 'lenguaje', 
      name: 'Lectura Crítica', 
      icon: LanguageIcon,
      skills: 'Comprensión • Interpretación • Reflexión',
      bgColor: 'bg-cyan-500',
      iconColor: 'text-cyan-500'
    },
    { 
      id: 'ciencias', 
      name: 'Ciencias Naturales', 
      icon: FlaskIcon,
      skills: 'Indagación • Uso del conocimiento • Explicación',
      bgColor: 'bg-blue-500',
      iconColor: 'text-blue-500'
    },
    { 
      id: 'sociales', 
      name: 'Sociales y Ciudadanas', 
      icon: GlobeIcon,
      skills: 'Pensamiento social • Interpretación • Reflexión',
      bgColor: 'bg-orange-500',
      iconColor: 'text-orange-500'
    },
    { 
      id: 'ingles', 
      name: 'Inglés', 
      icon: MessageSquareIcon,
      skills: 'Reading • Vocabulary • Grammar',
      bgColor: 'bg-yellow-500',
      iconColor: 'text-yellow-500'
    }
  ];

  const handleStartTest = () => {
    if (!selectedSubject) return;
    navigate(`/icfes/${selectedSubject}`);
  };

  // If a subject is selected via URL, show mock test placeholder
  if (subject) {
    const subjectData = subjects.find(s => s.id === subject);
    const SubjectIcon = subjectData?.icon || CalculatorIcon;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] pb-24 pt-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/icfes')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a3149] rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Simulacro de {subjectData?.name || 'Asignatura'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Prueba Saber 11
              </p>
            </div>
          </div>

          {/* Placeholder for mock test */}
          <div className="bg-white dark:bg-[#1e2439] rounded-2xl p-8 border border-gray-200 dark:border-transparent shadow-sm text-center">
            <div className={`w-20 h-20 mx-auto rounded-2xl ${subjectData?.bgColor}/10 dark:${subjectData?.bgColor}/20 flex items-center justify-center mb-6`}>
              <SubjectIcon className={`w-10 h-10 ${subjectData?.iconColor}`} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Simulacro en construcción
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Esta funcionalidad estará disponible próximamente. Podrás practicar con preguntas tipo ICFES para {subjectData?.name}.
            </p>
            
            <button
              onClick={() => navigate('/icfes')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              Volver a la selección
            </button>
          </div>
        </div>

        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] pb-24 pt-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Simulacro ICFES
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practica para la prueba Saber 11 con preguntas adaptadas
          </p>
        </div>

        {/* Tuko motivacional */}
        <div className="bg-white dark:bg-[#1e2439] rounded-3xl p-6 border border-gray-200 dark:border-transparent shadow-sm mb-8">
          <div className="flex items-start gap-4">
            <img 
              src="/image/characters/tuko-home.png" 
              alt="Tuko" 
              className="w-24 h-24 object-contain"
            />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                ¡Prepárate para brillar! ✨
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Estos simulacros te ayudarán a aplicar todo lo que has aprendido. 
                Recuerda que no es solo memorizar, sino comprender y transferir tu conocimiento.
              </p>
            </div>
          </div>
        </div>

        {/* Subject selection */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Selecciona una asignatura
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <motion.button
                key={subject.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSubject(subject.id)}
                className={`relative overflow-hidden rounded-2xl p-6 text-left
                         bg-white dark:bg-[#1e2439] border-2 shadow-sm
                         transition-all duration-200
                         ${selectedSubject === subject.id 
                           ? 'border-purple-500 shadow-lg' 
                           : 'border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-[#2a3149]'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl ${subject.bgColor}/10 dark:${subject.bgColor}/20 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-7 h-7 ${subject.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subject.skills}
                    </p>
                  </div>
                  {selectedSubject === subject.id && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Start button */}
        {selectedSubject && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleStartTest}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                     hover:from-blue-600 hover:to-purple-600
                     text-white text-lg font-bold rounded-2xl shadow-lg
                     transition-all duration-200"
          >
            Comenzar Simulacro →
          </motion.button>
        )}
      </div>

      <TabBar />
    </div>
  );
};

export default IcfesPrep;
