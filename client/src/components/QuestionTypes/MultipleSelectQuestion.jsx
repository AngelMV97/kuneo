import EducationalText from '../EducationalText';
import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';

/**
 * MultipleSelectQuestion - Permite seleccionar múltiples opciones correctas
 * @param {Array} options - Array de opciones disponibles
 * @param {Function} onAnswerChange - Callback cuando cambia la selección
 * @param {boolean} disabled - Si está deshabilitado
 */
const MultipleSelectQuestion = ({ options = [], onAnswerChange, disabled = false, initialAnswer = [] }) => {
  const [selectedIndices, setSelectedIndices] = useState(initialAnswer);

  useEffect(() => {
    // Notificar cambio como array de índices
    onAnswerChange(selectedIndices);
  }, [selectedIndices, onAnswerChange]);

  const toggleOption = (index) => {
    if (disabled) return;
    
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  return (
    <div className="space-y-3 mb-4">
      <p className="text-gray-400 text-sm mb-4">Selecciona todas las opciones correctas</p>
      {options.map((option, index) => {
        const isSelected = selectedIndices.includes(index);
        
        return (
          <Motion.button
            key={index}
            onClick={() => toggleOption(index)}
            className={`w-full text-left px-4 py-4 rounded-2xl transition-all flex items-center gap-3 ${
              isSelected
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-[#2a3149] text-white hover:bg-[#323a54]'
            }`}
            disabled={disabled}
            whileTap={{ scale: 0.98 }}
          >
            {/* Checkbox visual */}
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              isSelected 
                ? 'border-white bg-white' 
                : 'border-gray-400'
            }`}>
              {isSelected && (
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="font-medium flex-1 min-w-0"><EducationalText>{option}</EducationalText></div>
          </Motion.button>
        );
      })}
    </div>
  );
};

export default MultipleSelectQuestion;
