import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * CharacterAvatar - Personaje animado (Tuko u otros)
 * Muestra el personaje con micro-animaciones y estados emocionales
 * @param {string} character - Nombre del personaje ('tuko', 'pico', etc.)
 * @param {string} state - Estado emocional ('idle', 'thinking', 'listening', 'encouraging', 'explaining')
 * @param {string} ageGroup - Grupo de edad ('kid', 'teen', 'young_adult')
 * @param {string} size - Tamaño ('small', 'medium', 'large')
 */
const CharacterAvatar = ({ 
  character = 'tuko', 
  state = 'idle', 
  ageGroup = 'kid',
  size = 'medium' 
}) => {
  const [currentState, setCurrentState] = useState(state);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (state !== currentState) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentState(state);
        setIsAnimating(false);
      }, 300);
    }
  }, [state, currentState]);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  // Micro-animaciones según el estado
  const getAnimation = () => {
    switch (currentState) {
      case 'thinking':
        return {
          rotate: [0, -5, 5, -5, 0],
          y: [0, -10, 0],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        };
      case 'listening':
        return {
          scale: [1, 1.05, 1],
          transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        };
      case 'encouraging':
        return {
          y: [0, -5, 0, -5, 0],
          transition: { duration: 0.6, ease: "easeOut" }
        };
      case 'explaining':
        return {
          rotate: [0, 3, -3, 0],
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        };
      default:
        return {
          y: [0, -3, 0],
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        };
    }
  };

  // Path a la imagen del personaje
  const imagePath = `/image/characters/${character}/${ageGroup}/source/png/${currentState}.png`;
  const fallbackPath = `/image/characters/${character}/${ageGroup}/source/png/idle.png`;

  return (
    <div className={`character-avatar ${sizeClasses[size]} flex items-center justify-center`}>
      <motion.div
        className="relative w-full h-full"
        animate={getAnimation()}
      >
        <img
          src={imagePath}
          alt={`${character} ${currentState}`}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = fallbackPath;
          }}
        />
        
        {/* Glow effect cuando está animando */}
        {isAnimating && (
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default CharacterAvatar;
