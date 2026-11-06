import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook para tracking de métricas UX en tiempo real
 * Mide: tiempo percibido, cache hit rate, optimistic accuracy
 */
export function useUXAnalytics() {
  const [metrics, setMetrics] = useState({
    // Tiempos percibidos
    avgPerceivedLatency: 0,
    minPerceivedLatency: Infinity,
    maxPerceivedLatency: 0,
    totalResponses: 0,
    
    // Pre-fetch metrics
    preFetchAttempts: 0,
    preFetchHits: 0,
    preFetchMisses: 0,
    cacheHitRate: 0,
    
    // Optimistic UI metrics
    optimisticAttempts: 0,
    optimisticCorrect: 0,
    optimisticIncorrect: 0,
    optimisticAccuracy: 0,
    
    // Session data
    sessionStart: Date.now(),
    lastUpdated: Date.now(),
  });

  const timingRef = useRef({
    clickTimestamp: null,
    feedbackTimestamp: null,
  });

  // Track cuando usuario hace click en "Responder"
  const trackSubmitClick = useCallback(() => {
    timingRef.current.clickTimestamp = performance.now();
  }, []);

  // Track cuando aparece el primer feedback (optimistic o skeleton)
  const trackFirstFeedback = useCallback(() => {
    if (!timingRef.current.clickTimestamp) return;
    
    timingRef.current.feedbackTimestamp = performance.now();
    const perceivedLatency = timingRef.current.feedbackTimestamp - timingRef.current.clickTimestamp;
    
    setMetrics(prev => {
      const newTotal = prev.totalResponses + 1;
      const newAvg = ((prev.avgPerceivedLatency * prev.totalResponses) + perceivedLatency) / newTotal;
      
      return {
        ...prev,
        avgPerceivedLatency: newAvg,
        minPerceivedLatency: Math.min(prev.minPerceivedLatency, perceivedLatency),
        maxPerceivedLatency: Math.max(prev.maxPerceivedLatency, perceivedLatency),
        totalResponses: newTotal,
        lastUpdated: Date.now(),
      };
    });

    // Reset timers
    timingRef.current.clickTimestamp = null;
    timingRef.current.feedbackTimestamp = null;
  }, []);

  // Track intento de pre-fetch
  const trackPreFetchAttempt = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      preFetchAttempts: prev.preFetchAttempts + 1,
      lastUpdated: Date.now(),
    }));
  }, []);

  // Track si pre-fetch fue exitoso (cache hit)
  const trackPreFetchHit = useCallback(() => {
    setMetrics(prev => {
      const newHits = prev.preFetchHits + 1;
      const total = prev.preFetchAttempts;
      const hitRate = total > 0 ? (newHits / total) * 100 : 0;
      
      return {
        ...prev,
        preFetchHits: newHits,
        cacheHitRate: hitRate,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Track si pre-fetch falló (cache miss)
  const trackPreFetchMiss = useCallback(() => {
    setMetrics(prev => {
      const newMisses = prev.preFetchMisses + 1;
      const total = prev.preFetchAttempts;
      const hitRate = total > 0 ? (prev.preFetchHits / total) * 100 : 0;
      
      return {
        ...prev,
        preFetchMisses: newMisses,
        cacheHitRate: hitRate,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Track predicción optimista
  const trackOptimisticPrediction = useCallback((wasCorrect) => {
    setMetrics(prev => {
      const newCorrect = prev.optimisticCorrect + (wasCorrect ? 1 : 0);
      const newIncorrect = prev.optimisticIncorrect + (wasCorrect ? 0 : 1);
      const newTotal = prev.optimisticAttempts + 1;
      const accuracy = (newCorrect / newTotal) * 100;
      
      return {
        ...prev,
        optimisticAttempts: newTotal,
        optimisticCorrect: newCorrect,
        optimisticIncorrect: newIncorrect,
        optimisticAccuracy: accuracy,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      avgPerceivedLatency: 0,
      minPerceivedLatency: Infinity,
      maxPerceivedLatency: 0,
      totalResponses: 0,
      preFetchAttempts: 0,
      preFetchHits: 0,
      preFetchMisses: 0,
      cacheHitRate: 0,
      optimisticAttempts: 0,
      optimisticCorrect: 0,
      optimisticIncorrect: 0,
      optimisticAccuracy: 0,
      sessionStart: Date.now(),
      lastUpdated: Date.now(),
    });
  }, []);

  // Export metrics to console para debugging
  const exportMetrics = useCallback(() => {
    const report = {
      ...metrics,
      sessionDuration: Date.now() - metrics.sessionStart,
      target_perceivedLatency: 500, // Target: <500ms
      target_cacheHitRate: 80, // Target: >80%
      target_optimisticAccuracy: 70, // Target: >70%
      
      // Status checks
      meetsLatencyTarget: metrics.avgPerceivedLatency < 500,
      meetsCacheTarget: metrics.cacheHitRate > 80,
      meetsAccuracyTarget: metrics.optimisticAccuracy > 70,
    };
    
    console.log('📊 UX Analytics Report:', report);
    return report;
  }, [metrics]);

  // Auto-export cada 30 segundos (solo en desarrollo)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const interval = setInterval(() => {
        if (metrics.totalResponses > 0) {
          exportMetrics();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [metrics, exportMetrics]);

  return {
    metrics,
    trackSubmitClick,
    trackFirstFeedback,
    trackPreFetchAttempt,
    trackPreFetchHit,
    trackPreFetchMiss,
    trackOptimisticPrediction,
    resetMetrics,
    exportMetrics,
  };
}
