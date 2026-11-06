import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * ThinkingBubble - Burbuja de pensamiento orgánica (NO chat bubble típica)
 * Se construye progresivamente con efecto de typing
 * @param {string} content - Contenido del pensamiento
 * @param {boolean} isTyping - Si está en modo typing
 * @param {function} onComplete - Callback cuando termina de mostrar el contenido
 */
const ThinkingBubble = ({ content, isTyping = true, onComplete }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!content) return;

    if (isTyping) {
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typingInterval);
          setIsComplete(true);
          onComplete?.();
        }
      }, 30); // Velocidad de typing suave

      return () => clearInterval(typingInterval);
    } else {
      setDisplayedContent(content);
      setIsComplete(true);
    }
  }, [content, isTyping, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="thinking-bubble-container mb-6"
      >
        {/* Burbuja orgánica con forma personalizada */}
        <div className="relative max-w-2xl mx-auto">
          {/* Burbuja principal */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
                          rounded-3xl px-6 py-5 shadow-lg border-2 border-blue-200/50 dark:border-blue-700/30
                          relative">
            {/* Contenido con typing effect */}
            <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
              {displayedContent}
              {!isComplete && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1 h-5 ml-1 bg-blue-500"
                />
              )}
            </p>

            {/* Decoración orgánica - pequeñas burbujas */}
            <div className="absolute -left-2 bottom-8 w-4 h-4 bg-gradient-to-br from-blue-50 to-purple-50 
                          dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border-2 border-blue-200/50 
                          dark:border-blue-700/30" />
            <div className="absolute -left-4 bottom-4 w-2 h-2 bg-gradient-to-br from-blue-50 to-purple-50 
                          dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border-2 border-blue-200/50 
                          dark:border-blue-700/30" />
          </div>

          {/* Animación de pensamiento activo */}
          {isTyping && !isComplete && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThinkingBubble;
