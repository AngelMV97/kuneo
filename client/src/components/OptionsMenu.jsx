import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/**
 * OptionsMenu - Menú desplegable de opciones
 * @param {array} options - Lista de opciones [{label, icon, onClick, danger}]
 * @param {string} triggerIcon - Path al ícono del trigger
 */
const OptionsMenu = ({ options = [], triggerIcon = '/assets/icons/menu-vertical-points.svg' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (onClick) => {
    onClick?.();
    setIsOpen(false);
  };

  return (
    <div className="options-menu relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <img src={triggerIcon} alt="Opciones" className="w-6 h-6" />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para cerrar al hacer clic fuera */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 
                       rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 
                       overflow-hidden z-20"
            >
              <div className="py-2">
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(option.onClick)}
                    className={`w-full px-4 py-3 flex items-center gap-3 
                              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                              ${option.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {option.icon && (
                      typeof option.icon === 'string' ? (
                        <img src={option.icon} alt="" className="w-5 h-5" />
                      ) : (
                        <span className="text-xl">{option.icon}</span>
                      )
                    )}
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OptionsMenu;
