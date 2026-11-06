import { motion } from 'framer-motion';

/**
 * NotificationBadge - Badge de notificaciones con contador
 * @param {number} count - Número de notificaciones
 * @param {boolean} showDot - Mostrar solo punto sin número
 */
const NotificationBadge = ({ count = 0, showDot = false }) => {
  if (count === 0 && !showDot) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 z-10"
    >
      {showDot || count > 0 ? (
        <div className="relative">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            {!showDot && count > 0 && (
              <span className="text-white text-xs font-bold">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </div>
          {/* Animación de pulso */}
          <motion.div
            className="absolute inset-0 bg-red-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      ) : null}
    </motion.div>
  );
};

export default NotificationBadge;
