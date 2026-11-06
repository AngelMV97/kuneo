import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Panel de métricas UX en tiempo real
 * Muestra: latencia percibida, cache hit rate, optimistic accuracy
 * Solo visible en desarrollo
 */
export function UXMetricsPanel({ metrics, onExport, onReset }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // No mostrar en producción
  if (import.meta.env.PROD) return null;

  const {
    avgPerceivedLatency,
    minPerceivedLatency,
    maxPerceivedLatency,
    totalResponses,
    cacheHitRate,
    preFetchHits,
    preFetchAttempts,
    optimisticAccuracy,
    optimisticCorrect,
    optimisticAttempts,
  } = metrics;

  // Determinar color según cumplimiento de targets
  const getLatencyColor = (latency) => {
    if (latency === 0 || latency === Infinity) return 'text-gray-400';
    if (latency < 100) return 'text-green-400';
    if (latency < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCacheColor = (rate) => {
    if (rate === 0) return 'text-gray-400';
    if (rate >= 80) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy === 0) return 'text-gray-400';
    if (accuracy >= 70) return 'text-green-400';
    if (accuracy >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 mb-2 ml-auto"
      >
        <span className="text-xl">📊</span>
        <span className="font-medium">UX Metrics</span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      {/* Metrics Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-[#1e2139] border border-purple-500/30 rounded-xl shadow-2xl p-6 w-96 overflow-hidden"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
                <h3 className="text-white font-semibold text-lg">📈 Métricas UX</h3>
                <div className="flex gap-2">
                  <button
                    onClick={onExport}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    title="Exportar métricas a consola"
                  >
                    Export
                  </button>
                  <button
                    onClick={onReset}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    title="Resetear métricas"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* No Data State */}
              {totalResponses === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Sin datos aún</p>
                  <p className="text-xs mt-1">Responde preguntas para ver métricas</p>
                </div>
              ) : (
                <>
                  {/* Latencia Percibida */}
                  <div className="bg-[#252841] rounded-lg p-4">
                    <h4 className="text-purple-300 font-medium mb-3 flex items-center gap-2">
                      ⚡ Latencia Percibida
                      <span className="text-xs text-gray-400">(Target: &lt;500ms)</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Promedio:</span>
                        <span className={`font-bold text-lg ${getLatencyColor(avgPerceivedLatency)}`}>
                          {avgPerceivedLatency.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Min / Max:</span>
                        <span className="text-gray-300">
                          {minPerceivedLatency === Infinity ? '-' : minPerceivedLatency.toFixed(0)}ms / {maxPerceivedLatency.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Total respuestas:</span>
                        <span className="text-white font-medium">{totalResponses}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-fetch Cache */}
                  <div className="bg-[#252841] rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                      🚀 Pre-fetch Cache
                      <span className="text-xs text-gray-400">(Target: &gt;80%)</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Hit Rate:</span>
                        <span className={`font-bold text-lg ${getCacheColor(cacheHitRate)}`}>
                          {cacheHitRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Hits / Total:</span>
                        <span className="text-gray-300">
                          {preFetchHits} / {preFetchAttempts}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${cacheHitRate}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optimistic UI Accuracy */}
                  <div className="bg-[#252841] rounded-lg p-4">
                    <h4 className="text-green-300 font-medium mb-3 flex items-center gap-2">
                      ✨ Optimistic UI
                      <span className="text-xs text-gray-400">(Target: &gt;70%)</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Precisión:</span>
                        <span className={`font-bold text-lg ${getAccuracyColor(optimisticAccuracy)}`}>
                          {optimisticAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Correctas / Total:</span>
                        <span className="text-gray-300">
                          {optimisticCorrect} / {optimisticAttempts}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <motion.div
                          className="bg-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${optimisticAccuracy}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="bg-[#252841] rounded-lg p-3 border-t-2 border-purple-500/50">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-medium">Estado Global:</span>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${avgPerceivedLatency < 500 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                          {avgPerceivedLatency < 500 ? '✓' : '✗'} Latencia
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${cacheHitRate > 80 ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
                          {cacheHitRate > 80 ? '✓' : '○'} Cache
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${optimisticAccuracy > 70 ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
                          {optimisticAccuracy > 70 ? '✓' : '○'} Optimistic
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
