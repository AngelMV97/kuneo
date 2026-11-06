import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DropdownMenu({ trigger, children, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClasses = {
    right: 'right-0',
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 ${alignmentClasses[align]} 
                       bg-white dark:bg-[#1e2439]
                       rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a3149]
                       min-w-[200px] overflow-hidden z-50`}
          >
            <div onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({ icon, label, onClick, variant = 'default' }) {
  const variantClasses = {
    default: 'hover:bg-gray-100 dark:hover:bg-[#2a3149]',
    danger: 'hover:bg-red-500/10 text-red-400'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 text-left
                 transition-colors duration-150 ${variantClasses[variant]}`}
    >
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      <span className="text-gray-900 dark:text-white font-medium">
        {label}
      </span>
    </button>
  );
}

export function DropdownDivider() {
  return (
    <div className="h-px bg-gray-200 dark:bg-[#2a3149] my-1" />
  );
}
