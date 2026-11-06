import EducationalText from './EducationalText';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { VisualEngine } from '../visual-engine';

/**
 * ConceptCard - Tarjeta conceptual expandible
 * Tipos: concept (🟢), representation (🟡), example (🔵), reflection (🔴)
 * Principio: 1 idea + 1 visual + 1 insight
 * 
 * @param {string} type - Tipo de tarjeta ('concept', 'representation', 'example', 'reflection')
 * @param {string} title - Título de la tarjeta
 * @param {string} content - Contenido principal
 * @param {string} visual - Componente visual legacy (gráfica, diagrama, etc.)
 * @param {string} visualTemplateKey - Key del visual_template (nuevo sistema)
 * @param {string} cardVariant - Variante de la tarjeta (basic, hint, corrective, reflective, deepening)
 * @param {string} misconceptionKey - Key del misconception para overlay específico
 * @param {string} insight - Insight clave
 * @param {boolean} initiallyExpanded - Si inicia expandida
 */
const ConceptCard = ({ 
  type = 'concept', 
  title, 
  content, 
  visual, // Legacy: componente React directo
  visualTemplateKey, // Nuevo: template_key para VisualEngine
  cardVariant = 'basic',
  misconceptionKey = null,
  insight,
  mathContent,
  initiallyExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const typeConfig = {
    concept: {
      color: 'green',
      icon: '📖',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      borderColor: 'border-green-300 dark:border-green-700',
      textColor: 'text-green-700 dark:text-green-300'
    },
    representation: {
      color: 'yellow',
      icon: '🎨',
      bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      textColor: 'text-yellow-700 dark:text-yellow-300'
    },
    example: {
      color: 'blue',
      icon: '💡',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      borderColor: 'border-blue-300 dark:border-blue-700',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    reflection: {
      color: 'red',
      icon: '🤔',
      bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      borderColor: 'border-red-300 dark:border-red-700',
      textColor: 'text-red-700 dark:text-red-300'
    }
  };

  const config = typeConfig[type] || typeConfig.concept;

  return (
    <Motion.div
      layout
      className={`concept-card rounded-2xl overflow-hidden shadow-lg 
                 bg-gradient-to-br ${config.bgGradient} 
                 border-2 ${config.borderColor} mb-4`}
    >
      {/* Header expandible */}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <h3 className={`text-lg font-bold ${config.textColor}`}>
            {title}
          </h3>
        </div>
        
        {/* Ícono de hint (assets/icons/hint.png) */}
        <Motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <img 
            src="/assets/icons/hint.png" 
            alt="Expandir" 
            className="w-6 h-6 opacity-70"
            onError={(e) => {
              // Fallback a SVG si no existe la imagen
              e.target.style.display = 'none';
            }}
          />
          {/* Fallback: flecha SVG */}
          <svg className="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Motion.div>
      </button>

      {/* Contenido expandible */}
      <AnimatePresence>
        {isExpanded && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {/* Contenido principal */}
              {content && (
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {typeof content === 'string' ? <EducationalText>{content}</EducationalText> : content}
                </div>
              )}

              {/* Contenido matemático */}
              {mathContent && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                  <BlockMath math={mathContent} />
                </div>
              )}

              {/* Visual - Nuevo sistema con VisualEngine */}
              {visualTemplateKey && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <VisualEngine
                    visualTemplateKey={visualTemplateKey}
                    cardVariant={cardVariant}
                    cognitiveType={type} // Mapeo: representation, example, etc.
                    misconceptionKey={misconceptionKey}
                    showCaption={true}
                    showOverlay={true}
                  />
                </div>
              )}

              {/* Visual legacy (gráfica, diagrama, etc.) */}
              {!visualTemplateKey && visual && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  {visual}
                </div>
              )}

              {/* Insight clave */}
              {insight && (
                <div className={`bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border-l-4 ${config.borderColor}`}>
                  <div className={`font-semibold ${config.textColor} flex items-start gap-2`}>
                    <span className="text-xl">✨</span>
                    <div><EducationalText>{insight}</EducationalText></div>
                  </div>
                </div>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
};

export default ConceptCard;
