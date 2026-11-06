import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import UserNameModal from '../components/UserNameModal';
import { emitProfileUpdated, onProfileUpdated } from '../utils/profileEvents';
import {
  ArrowLeftIcon,
  UserIcon,
  UsersIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon
} from '../components/icons/MinimalIcons';

/**
 * Settings - Configuración de la aplicación
 */
const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadProfile();
    
    // Listen for profile updates from other components
    const unsubscribe = onProfileUpdated((updatedProfile) => {
      setProfile(updatedProfile);
    });
    
    return unsubscribe;
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .rpc('kuneo_get_user_profile', { p_user_id: user.id });
        if (profileData) {
          // Extract first element from array (RPC returns array)
          const profileObject = Array.isArray(profileData) ? profileData[0] : profileData;
          setProfile(profileObject);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    return 'Explorador';
  };

  const handleSaveUsername = async (newUsername) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .rpc('kuneo_update_username', { 
          p_user_id: user.id, 
          p_username: newUsername 
        });

      if (error) throw error;

      // Update local state
      const updatedProfile = { ...profile, username: newUsername };
      setProfile(updatedProfile);
      
      // Emit event to notify other components
      emitProfileUpdated(updatedProfile);
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate('/home')} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1e2439] 
                     rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-4">
            Configuración
          </h1>
        </div>

        {/* Settings sections */}
        <div className="space-y-4">
          {/* Perfil */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 
                     border border-gray-200 dark:border-transparent shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Perfil
            </h2>
            <button
              onClick={() => setShowUsernameModal(true)}
              className="w-full flex items-center justify-between p-4 
                       hover:bg-gray-50 dark:hover:bg-[#2a3149] 
                       rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-orange-400 
                              flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Nombre de usuario
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getDisplayName()}
                  </p>
                </div>
              </div>
              <ArrowLeftIcon className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
          </motion.div>

          {/* Personaje */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 
                     border border-gray-200 dark:border-transparent shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Personaje
            </h2>
            <button
              onClick={() => navigate('/character-selection')}
              className="w-full flex items-center justify-between p-4 
                       hover:bg-gray-50 dark:hover:bg-[#2a3149] 
                       rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 
                              flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Cambiar personaje
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecciona un nuevo compañero
                  </p>
                </div>
              </div>
              <ArrowLeftIcon className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
          </motion.div>

          {/* Apariencia */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 
                     border border-gray-200 dark:border-transparent shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Apariencia
            </h2>
            <div className="flex gap-4">
              <button
                onClick={toggleTheme}
                className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  theme === 'light' 
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-[#2a3149] text-gray-400'
                }`}
              >
                <SunIcon className="w-5 h-5" />
                Claro
              </button>
              <button
                onClick={toggleTheme}
                className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-[#2a3149] text-gray-400'
                }`}
              >
                <MoonIcon className="w-5 h-5" />
                Oscuro
              </button>
            </div>
          </motion.div>

          {/* Cerrar sesión */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-red-50 dark:bg-red-500/10
                     text-red-600 dark:text-red-400
                     border border-red-200 dark:border-transparent
                     rounded-2xl p-6 shadow-sm font-medium flex items-center justify-center gap-3
                     hover:bg-red-100 dark:hover:bg-red-500/20 
                     transition-all duration-200"
          >
            <LogOutIcon className="w-5 h-5" />
            Cerrar sesión
          </motion.button>
        </div>
      </div>

      {/* Username Modal */}
      <UserNameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        currentUsername={profile?.username}
        onSave={handleSaveUsername}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1e2439] 
                       border border-gray-200 dark:border-transparent
                       rounded-3xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ¿Cerrar sesión?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tu progreso se guardará automáticamente
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-[#2a3149] 
                           text-gray-900 dark:text-white
                           rounded-xl font-medium hover:bg-opacity-80 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium
                           hover:bg-red-600 transition-all"
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
