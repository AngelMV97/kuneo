// client/src/components/LoadingSkeleton.jsx
import { motion } from 'framer-motion';

export function SkeletonCard({ height = "200px", width = "100%" }) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width,
        height,
        background: "linear-gradient(90deg, #2a3149 25%, #3a4159 50%, #2a3149 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: "12px",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
}

export function SkeletonText({ width = "100%", height = "16px" }) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width,
        height,
        background: "linear-gradient(90deg, #2a3149 25%, #3a4159 50%, #2a3149 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: "4px",
      }}
    />
  );
}

export function SkeletonCircle({ size = "40px" }) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(90deg, #2a3149 25%, #3a4159 50%, #2a3149 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: "50%",
      }}
    />
  );
}

/**
 * Skeleton loader specifically for evaluation state
 * Shows animated thinking dots
 */
export function EvaluationSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="w-3 h-3 bg-purple-500 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-3 h-3 bg-purple-500 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
        />
        <motion.div
          className="w-3 h-3 bg-purple-500 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
        />
      </motion.div>
      <motion.p
        className="text-gray-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Analizando tu respuesta...
      </motion.p>
    </div>
  );
}

/**
 * Skeleton loader for Tuko character and message
 */
export function TukoSkeleton() {
  return (
    <div className="flex flex-col items-center mb-6">
      <SkeletonCircle size="128px" />
      <div className="mt-4 w-64">
        <SkeletonText height="60px" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, gap = "1rem" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height="100px" />
      ))}
    </div>
  );
}
