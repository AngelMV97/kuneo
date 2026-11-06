import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/**
 * Panel de control para A/B Testing
 * Solo visible en desarrollo
 */
export function ABTestControl({ testGroup, config, metrics, onOverride, onReset, onExport }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // No mostrar en producción
  if (import.meta.env.PROD) return null;

  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 mb-2"
      >
        <span className="text-xl">🧪</span>
        <span className="font-medium">A/B Test</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          testGroup === 'A' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          Group {testGroup || '?'}
        </span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      {/* Control Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-[#1e2139] border border-indigo-500/30 rounded-xl shadow-2xl p-6 w-96 overflow-hidden"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-indigo-500/30 pb-3">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  🧪 A/B Test Control
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Comparando con/sin optimizaciones UX
                </p>
              </div>

              {/* Current Group */}
              <div className="bg-[#252841] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 font-medium">Grupo Actual:</span>
                  <span className={`px-3 py-1 rounded-lg font-bold ${
                    testGroup === 'A' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                  }`}>
                    {testGroup === 'A' ? 'A - Control' : 'B - Treatment'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {config.groupName}
                </p>
              </div>

              {/* Feature Flags */}
              <div className="bg-[#252841] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 text-sm">Features Activas:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Optimistic UI:</span>
                    <span className={config.enableOptimisticUI ? 'text-green-400' : 'text-red-400'}>
                      {config.enableOptimisticUI ? '✓ ON' : '✗ OFF'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Pre-fetch:</span>
                    <span className={config.enablePreFetch ? 'text-green-400' : 'text-red-400'}>
                      {config.enablePreFetch ? '✓ ON' : '✗ OFF'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Streaming:</span>
                    <span className={config.enableStreaming ? 'text-green-400' : 'text-red-400'}>
                      {config.enableStreaming ? '✓ ON' : '✗ OFF'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enhanced Skeletons:</span>
                    <span className={config.enableEnhancedSkeletons ? 'text-green-400' : 'text-red-400'}>
                      {config.enableEnhancedSkeletons ? '✓ ON' : '✗ OFF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="bg-[#252841] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 text-sm">Métricas Comparativas:</h4>
                <div className="space-y-3 text-xs">
                  {/* Group A */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-red-300 font-medium">Group A (Control):</span>
                      <span className="text-gray-400">{metrics.groupA.sessions} sesiones</span>
                    </div>
                    <div className="pl-3 space-y-1 text-gray-400">
                      <div>Respuestas: {metrics.groupA.totalResponses}</div>
                      <div>Tiempo avg: {metrics.groupA.avgResponseTime.toFixed(0)}ms</div>
                      <div>Satisfacción: {metrics.groupA.userSatisfaction.toFixed(1)}/5</div>
                    </div>
                  </div>

                  {/* Group B */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-300 font-medium">Group B (Treatment):</span>
                      <span className="text-gray-400">{metrics.groupB.sessions} sesiones</span>
                    </div>
                    <div className="pl-3 space-y-1 text-gray-400">
                      <div>Respuestas: {metrics.groupB.totalResponses}</div>
                      <div>Tiempo avg: {metrics.groupB.avgResponseTime.toFixed(0)}ms</div>
                      <div>Satisfacción: {metrics.groupB.userSatisfaction.toFixed(1)}/5</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Override Controls */}
              <div className="bg-[#252841] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 text-sm">Manual Override:</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => onOverride('A')}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                      testGroup === 'A' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                    }`}
                  >
                    Forzar A
                  </button>
                  <button
                    onClick={() => onOverride('B')}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                      testGroup === 'B' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-600/20 text-green-300 hover:bg-green-600/30'
                    }`}
                  >
                    Forzar B
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onExport}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Export Data
                </button>
                <button
                  onClick={onReset}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Reset Test
                </button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-300 text-xs">
                  ⚠️ Los cambios de grupo reiniciarán la sesión actual
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
