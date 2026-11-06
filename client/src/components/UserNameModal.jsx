import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, UserIcon } from './icons/MinimalIcons';

export default function UserNameModal({ isOpen, onClose, currentUsername, onSave }) {
  const [username, setUsername] = useState(currentUsername || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername || '');
    }
  }, [isOpen, currentUsername]);

  const handleSave = async () => {
    if (!username.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(username.trim());
      onClose();
    } catch (error) {
      console.error('Error saving username:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1e2439]                        border border-gray-200 dark:border-transparent                       rounded-3xl shadow-2xl max-w-md w-full p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-orange-400 
                                flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nombre de Usuario
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a3149]
                           flex items-center justify-center transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  ¿Cómo te gustaría que te llamemos?
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: Ana, Carlos, Exploradora..."
                  maxLength={30}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-[#2a3149]
                           text-gray-900 dark:text-white
                           rounded-xl border-2 border-transparent
                           focus:border-purple-500 focus:outline-none
                           placeholder-gray-500 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && username.trim()) {
                      handleSave();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {username.length}/30 caracteres
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-[#2a3149]
                           text-gray-900 dark:text-white
                           rounded-xl font-medium hover:bg-opacity-80
                           transition-all duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!username.trim() || isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-400
                           text-white rounded-xl font-medium
                           hover:shadow-lg hover:shadow-purple-500/30
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent 
                                    rounded-full animate-spin" />
                      Guardando...
                    </div>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
