import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import TabBar from '../components/TabBar';
import DropdownMenu, { DropdownItem, DropdownDivider } from '../components/DropdownMenu';
import NotificationsDropdown from '../components/NotificationsDropdown';
import UserNameModal from '../components/UserNameModal';
import { supabase } from '../supabaseClient';
import { learningApi } from '../utils/learningApi';
import { useTheme } from '../contexts/ThemeContext';
import { emitProfileUpdated, onProfileUpdated } from '../utils/profileEvents';
import { 
  CheckCircleIcon,
  SearchIcon,
  BellIcon,
  TransferIcon,
  MoreVerticalIcon,
  UserIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
  LogOutIcon
} from '../components/icons/MinimalIcons';

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isUserNameModalOpen, setIsUserNameModalOpen] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Get user profile (RPC returns array, we need first element)
      const { data: profileData, error: profileError } = await supabase
        .rpc('kuneo_get_user_profile', { p_user_id: user.id });

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Extract first element from array
      const profileObject = Array.isArray(profileData) ? profileData[0] : profileData;
      setProfile(profileObject);

      const overview = await learningApi.overview();
      setLastActivity(overview.lastActivity);
      setActivityError(null);

    } catch (error) {
      console.error('Error loading user data:', error);
      setActivityError(error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUserData();
    
    // Listen for profile updates from other components
    const unsubscribe = onProfileUpdated((updatedProfile) => {
      setProfile(updatedProfile);
    });
    
    return unsubscribe;
  }, [loadUserData]);

  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    // Default creative name
    return 'Explorador';
  };

  const handleSaveUsername = async (newUsername) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
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

  const handleMarkAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);

  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);

  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13172a] pb-24 pt-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with notifications and menu */}
        <Motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Hola, {getDisplayName()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ¡Listos para aprender!
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Bell notification dropdown */}
            <DropdownMenu
              align="right"
              trigger={
                <div className="relative">
                  <button className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1e2439]
                                   flex items-center justify-center hover:scale-105 transition-transform">
                    <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                  {/* Red notification dot - only if unread */}
                  {unreadNotifications.length > 0 && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full 
                                  border-2 border-gray-50 dark:border-[#13172a]" />
                  )}
                </div>
              }
            >
              <NotificationsDropdown
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            </DropdownMenu>

            {/* Options menu (three dots) */}
            <DropdownMenu
              align="right"
              trigger={
                <button className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1e2439]
                                 flex items-center justify-center hover:scale-105 transition-transform">
                  <MoreVerticalIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              }
            >
              <DropdownItem
                icon={<UserIcon className="w-5 h-5 text-purple-400" />}
                label="Nombre de usuario"
                onClick={() => setIsUserNameModalOpen(true)}
              />
              <DropdownItem
                icon={theme === 'dark' ? 
                  <SunIcon className="w-5 h-5 text-orange-400" /> : 
                  <MoonIcon className="w-5 h-5 text-purple-400" />
                }
                label={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                onClick={toggleTheme}
              />
              <DropdownItem
                icon={<SettingsIcon className="w-5 h-5 text-blue-400" />}
                label="Configuración"
                onClick={() => navigate('/settings')}
              />
              <DropdownDivider />
              <DropdownItem
                icon={<LogOutIcon className="w-5 h-5 text-red-400" />}
                label="Cerrar sesión"
                onClick={handleLogout}
                variant="danger"
              />
            </DropdownMenu>
          </div>
        </Motion.div>

        {/* Username Modal */}
        <UserNameModal
          isOpen={isUserNameModalOpen}
          onClose={() => setIsUserNameModalOpen(false)}
          currentUsername={profile?.username}
          onSave={handleSaveUsername}
        />

        {/* Tuko character */}
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex justify-center"
        >
          <img 
            src="/image/characters/tuko-home.png" 
            alt="Tuko" 
            className="w-64 h-64 object-contain"
            onError={(e) => {
              e.target.src = '/image/characters/tuko-standing-up.png';
            }}
          />
        </Motion.div>

        {/* Continue lesson card */}
        {lastActivity && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 
                     rounded-3xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Continúa tu Lección
            </h2>
            
            <h3 className="text-xl font-bold text-white mb-2">
              {lastActivity.subject}
            </h3>
            
            <p className="text-purple-100 mb-6">
              {lastActivity.module}
            </p>
            
            <button
              onClick={() => navigate(`/module/${lastActivity.moduleId}`)}
              className="w-full max-w-xs mx-auto block px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 
                       text-white text-lg font-bold rounded-full shadow-lg
                       hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Reanudar
            </button>
            
            {/* Progress bar */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 relative h-2 bg-white/20 rounded-full overflow-hidden">
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${lastActivity.progress}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute top-0 left-0 h-full bg-cyan-400 rounded-full"
                />
              </div>
              <span className="text-white font-bold text-sm">
                {lastActivity.goalsCompleted} de {lastActivity.goalsTotal} objetivos consolidados
              </span>
            </div>
            <p className="text-sm text-purple-100 mt-3">
              {lastActivity.attempts} intentos guardados · {lastActivity.dimensionsCompleted} de {lastActivity.dimensionsTotal} habilidades consolidadas
            </p>
            {lastActivity.goalsCompleted === 0 && <p className="text-sm text-purple-100 mt-2">
              Tu actividad está guardada. Sigue practicando para consolidar el primer objetivo.
            </p>}
          </Motion.div>
        )}

        {activityError && <p role="alert" className="text-amber-500 mb-4">No pudimos cargar tu actividad: {activityError} <button onClick={loadUserData} className="underline">Reintentar</button></p>}
        {!lastActivity && !activityError && <div className="bg-white dark:bg-[#1e2439] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold dark:text-white">Tu próxima aventura comienza aquí</h2>
          <p className="text-gray-500 my-3">Explora una materia para comenzar o continuar practicando.</p>
          <button onClick={() => navigate('/catalog')} className="text-purple-500 font-bold">Explorar módulos</button>
        </div>}
        {/* Action buttons */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4"
        >
          {/* Repaso */}
          <button
            disabled
            className="bg-white dark:bg-[#1e2439] rounded-3xl p-6 flex flex-col items-center justify-center
                     border border-gray-200 dark:border-transparent
                     opacity-50 cursor-not-allowed
                     transition-all duration-200"
          >
            <CheckCircleIcon className="w-10 h-10 text-green-400 mb-3" />
            <span className="text-gray-900 dark:text-white font-medium text-sm">Repaso</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Próximamente</span>
          </button>
          
          {/* Competencias */}
          <button
            onClick={() => navigate('/competencies')}
            className="bg-white dark:bg-[#1e2439] rounded-3xl p-6 flex flex-col items-center justify-center
                     border border-gray-200 dark:border-transparent
                     hover:shadow-xl hover:shadow-purple-500/10 hover:scale-105 
                     transition-all duration-200"
          >
            <SearchIcon className="w-10 h-10 text-purple-400 mb-3" />
            <span className="text-gray-900 dark:text-white font-medium text-sm">Competencias</span>
          </button>
          
          {/* Transferencia */}
          <button
            onClick={() => navigate('/icfes')}
            className="bg-white dark:bg-[#1e2439] rounded-3xl p-6 flex flex-col items-center justify-center
                     border border-gray-200 dark:border-transparent
                     hover:shadow-xl hover:shadow-purple-500/10 hover:scale-105 
                     transition-all duration-200"
          >
            <TransferIcon className="w-10 h-10 text-yellow-400 mb-3" />
            <span className="text-gray-900 dark:text-white font-medium text-sm">Transferencia</span>
          </button>
        </Motion.div>
      </div>

      <TabBar />
    </div>
  );
}
