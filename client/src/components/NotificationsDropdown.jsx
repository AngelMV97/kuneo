import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  TrendingUpIcon,
  BookOpenIcon,
  AlertCircleIcon
} from './icons/MinimalIcons';

// Icon mapping based on notification type
const getNotificationIcon = (type) => {
  switch(type) {
    case 'achievement':
      return <TrendingUpIcon className="w-6 h-6 text-purple-400" />;
    case 'info':
      return <BookOpenIcon className="w-6 h-6 text-blue-400" />;
    case 'warning':
      return <AlertCircleIcon className="w-6 h-6 text-orange-400" />;
    case 'success':
      return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
    default:
      return <BookOpenIcon className="w-6 h-6 text-gray-400" />;
  }
};

export default function NotificationsDropdown({ notifications, onMarkAsRead, onMarkAllAsRead }) {
  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#2a3149] 
                      flex items-center justify-center">
          <CheckCircleIcon className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400 mb-1">No hay notificaciones</p>
        <p className="text-sm text-gray-500">Estás al día con todo</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-[#1e2439] 
                    border-b border-gray-200 dark:border-[#2a3149]
                    px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white">
          Notificaciones
        </h3>
        {notifications.some(n => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="divide-y divide-gray-200 dark:divide-[#2a3149]">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#2a3149]
                       cursor-pointer transition-colors
                       ${!notification.read ? 'bg-purple-500/5' : ''}`}
            onClick={() => onMarkAsRead(notification.id)}
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                            ${notification.type === 'success' ? 'bg-green-500/20' : ''}
                            ${notification.type === 'info' ? 'bg-blue-500/20' : ''}
                            ${notification.type === 'warning' ? 'bg-orange-500/20' : ''}
                            ${notification.type === 'achievement' ? 'bg-purple-500/20' : ''}`}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500">
                  {notification.time}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
