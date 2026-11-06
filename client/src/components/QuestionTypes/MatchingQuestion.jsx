import EducationalText from '../EducationalText';
import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';

/**
 * MatchingQuestion - Relacionar pares (columna izquierda con columna derecha)
 * @param {Array} leftItems - Items de la columna izquierda
 * @param {Array} rightItems - Items de la columna derecha
 * @param {Function} onAnswerChange - Callback cuando cambia el matching
 * @param {boolean} disabled - Si está deshabilitado
 */
const MatchingQuestion = ({ leftItems = [], rightItems = [], onAnswerChange, disabled = false, initialAnswer = [] }) => {
  // matches = { leftIndex: rightIndex }
  const [matches, setMatches] = useState(() => Object.fromEntries(initialAnswer));
  const [selectedLeft, setSelectedLeft] = useState(null);

  useEffect(() => {
    // Convertir matches a formato para envío: array de pares [leftIndex, rightIndex]
    const matchesArray = Object.entries(matches).map(([left, right]) => [
      parseInt(left),
      parseInt(right)
    ]);
    onAnswerChange(matchesArray);
  }, [matches, onAnswerChange]);

  const handleLeftClick = (index) => {
    if (disabled) return;
    
    if (selectedLeft === index) {
      // Deseleccionar
      setSelectedLeft(null);
    } else {
      setSelectedLeft(index);
    }
  };

  const handleRightClick = (rightIndex) => {
    if (disabled || selectedLeft === null) return;
    
    // Crear/actualizar match
    setMatches(prev => {
      const newMatches = { ...prev };
      
      // Remover match previo del left item si existe
      if (newMatches[selectedLeft] !== undefined) {
        delete newMatches[selectedLeft];
      }
      
      // Remover cualquier left item que apuntaba a este right item
      Object.keys(newMatches).forEach(leftIdx => {
        if (newMatches[leftIdx] === rightIndex) {
          delete newMatches[leftIdx];
        }
      });
      
      // Crear nuevo match
      newMatches[selectedLeft] = rightIndex;
      
      return newMatches;
    });
    
    setSelectedLeft(null);
  };

  const clearMatch = (leftIndex) => {
    if (disabled) return;
    setMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[leftIndex];
      return newMatches;
    });
  };

  const getRightItemForLeft = (leftIndex) => {
    const rightIndex = matches[leftIndex];
    return rightIndex !== undefined ? rightItems[rightIndex] : null;
  };

  const isRightItemMatched = (rightIndex) => {
    return Object.values(matches).includes(rightIndex);
  };

  return (
    <div className="mb-4">
      <p className="text-gray-400 text-sm mb-4">
        Conecta cada elemento de la izquierda con su pareja de la derecha
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna izquierda */}
        <div className="space-y-3">
          <h3 className="text-gray-400 text-xs font-semibold uppercase mb-2">Selecciona</h3>
          {leftItems.map((item, index) => {
            const isSelected = selectedLeft === index;
            const matchedRight = getRightItemForLeft(index);
            
            return (
              <Motion.div key={index} className="relative">
                <button
                  onClick={() => handleLeftClick(index)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : matchedRight
                      ? 'bg-purple-600/20 text-purple-200 border-2 border-purple-500'
                      : 'bg-[#2a3149] text-white hover:bg-[#323a54]'
                  }`}
                  disabled={disabled}
                >
                  <div className="font-medium text-sm min-w-0"><EducationalText>{item}</EducationalText></div>
                </button>
                
                {/* Mostrar match actual */}
                {matchedRight && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 text-xs text-purple-200 bg-purple-900/30 px-2 py-1 rounded">
                      <EducationalText>{`→ ${matchedRight}`}</EducationalText>
                    </div>
                    <button
                      onClick={() => clearMatch(index)}
                      className="text-red-400 hover:text-red-300 text-xs"
                      disabled={disabled}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </Motion.div>
            );
          })}
        </div>
        
        {/* Columna derecha */}
        <div className="space-y-3">
          <h3 className="text-gray-400 text-xs font-semibold uppercase mb-2">
            {selectedLeft !== null ? 'Conecta con' : 'Opciones'}
          </h3>
          {rightItems.map((item, index) => {
            const isMatched = isRightItemMatched(index);
            const isClickable = selectedLeft !== null;
            
            return (
              <Motion.button
                key={index}
                onClick={() => handleRightClick(index)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  isMatched
                    ? 'bg-purple-600/20 text-purple-200 border-2 border-purple-500'
                    : isClickable
                    ? 'bg-[#2a3149] text-white hover:bg-[#323a54] ring-2 ring-orange-500/50'
                    : 'bg-[#2a3149] text-white opacity-60'
                }`}
                disabled={disabled || !isClickable}
                whileTap={{ scale: isClickable ? 0.98 : 1 }}
              >
                <div className="font-medium text-sm min-w-0"><EducationalText>{item}</EducationalText></div>
              </Motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Indicador de progreso */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {Object.keys(matches).length} de {leftItems.length} conectados
      </div>
    </div>
  );
};

export default MatchingQuestion;
