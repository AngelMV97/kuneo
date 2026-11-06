import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * InputWithSuggestions - Entrada guiada del usuario (NO chat típico)
 * Ofrece sugerencias inteligentes según el contexto
 * @param {function} onSubmit - Callback al enviar
 * @param {array} suggestions - Lista de sugerencias contextuales
 * @param {string} placeholder - Placeholder del input
 * @param {boolean} disabled - Si está deshabilitado
 */
const InputWithSuggestions = ({ 
  onSubmit, 
  suggestions = [],
  placeholder = "Escribe tu pensamiento...",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const defaultSuggestions = [
    "Creo que...",
    "No entiendo...",
    "Mi idea es...",
    "Necesito ayuda con...",
    "Puedo explicar que..."
  ];

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSubmit(inputValue);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="input-with-suggestions w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        {/* Input principal */}
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled}
            rows="3"
            className="w-full px-6 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none
                     resize-none transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-lg"
          />
          
          {/* Botón de enviar integrado */}
          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className="absolute right-3 bottom-3 p-3 rounded-xl
                     bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                     text-white transition-all duration-200
                     disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Sugerencias inteligentes */}
        {showSuggestions && activeSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 
                     rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700
                     p-4 z-10"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
              Puedes empezar con:
            </p>
            <div className="flex flex-wrap gap-2">
              {activeSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 
                           text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50
                           transition-all duration-200 text-sm font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
};

export default InputWithSuggestions;
