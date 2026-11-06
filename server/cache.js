/**
 * IN-MEMORY CACHE MODULE
 * 
 * Sistema de cache para optimizar queries frecuentes.
 * Reduce latencia de DB eliminando SELECT repetitivos.
 * 
 * Fase 2.1: Cache para module_steps.enriched_content
 * Impacto esperado: -300ms por request
 */

const NodeCache = require('node-cache');

// ============================================
// CONFIGURACIÓN
// ============================================

// Cache para module_steps (TTL: 1 hora, checkperiod: 10 min)
const stepsCache = new NodeCache({
  stdTTL: 3600, // 1 hora
  checkperiod: 600, // Revisar cada 10 minutos
  useClones: false // Para mejor performance (cuidado con mutations)
});

// Cache para module metadata (TTL: 30 min)
const modulesCache = new NodeCache({
  stdTTL: 1800, // 30 minutos
  checkperiod: 600,
  useClones: false
});

// Stats para monitoreo
let stats = {
  steps_hits: 0,
  steps_misses: 0,
  steps_preloaded: 0,
  modules_hits: 0,
  modules_misses: 0,
  last_preload: null
};

// ============================================
// STEPS CACHE
// ============================================

/**
 * Obtener step del cache o DB
 * @param {string} stepId - UUID del step
 * @param {Function} fetchFn - Función para obtener de DB si no está en cache
 * @returns {Object} Step data con enriched_content
 */
async function getStep(stepId, fetchFn) {
  // Intentar obtener del cache
  const cached = stepsCache.get(stepId);
  
  if (cached) {
    stats.steps_hits++;
    return cached;
  }
  
  // Cache miss: obtener de DB
  stats.steps_misses++;
  const stepData = await fetchFn(stepId);
  
  if (stepData) {
    stepsCache.set(stepId, stepData);
  }
  
  return stepData;
}

/**
 * Precargar steps de un módulo en cache
 * @param {string} moduleId - UUID del módulo
 * @param {Function} fetchFn - Función para obtener steps de DB
 */
async function preloadModuleSteps(moduleId, fetchFn) {
  try {
    const steps = await fetchFn(moduleId);
    
    if (!steps || steps.length === 0) {
      // No warning - module might not have enriched steps yet
      return 0;
    }
    
    let loaded = 0;
    steps.forEach(step => {
      if (step.id && step.enriched_content) {
        stepsCache.set(step.id, step);
        loaded++;
      }
    });
    
    if (loaded > 0) {
      stats.steps_preloaded += loaded;
      console.log(`[Cache] ✅ Preloaded ${loaded} steps for module ${moduleId}`);
    }
    
    return loaded;
  } catch (error) {
    console.error('[Cache] Error preloading steps:', error);
    return 0;
  }
}

/**
 * Precargar módulos activos al iniciar servidor
 * @param {Function} fetchActiveModulesFn - Función para obtener módulos activos
 * @param {Function} fetchStepsFn - Función para obtener steps
 */
async function warmupCache(fetchActiveModulesFn, fetchStepsFn) {
  console.log('[Cache] Starting warmup...');
  const startTime = Date.now();
  
  try {
    const activeModules = await fetchActiveModulesFn();
    console.log(`[Cache] Found ${activeModules.length} active modules`);
    
    let totalSteps = 0;
    
    // Precargar steps de cada módulo (en paralelo, lotes de 5)
    const batchSize = 5;
    for (let i = 0; i < activeModules.length; i += batchSize) {
      const batch = activeModules.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(module => preloadModuleSteps(module.id, fetchStepsFn))
      );
      totalSteps += results.reduce((sum, count) => sum + count, 0);
    }
    
    const duration = Date.now() - startTime;
    stats.last_preload = new Date().toISOString();
    
    if (totalSteps > 0) {
      console.log(`[Cache] ✅ Warmup complete: ${totalSteps} enriched steps cached in ${duration}ms`);
      console.log(`[Cache] Estimated memory: ~${Math.round(totalSteps * 50)}KB`);
    } else {
      console.log(`[Cache] ⚠️ Warmup complete: No enriched steps found (${duration}ms)`);
      console.log(`[Cache] Tip: Run enrichment scripts to populate step_config in module_steps`);
    }
    
    return { totalSteps, duration };
  } catch (error) {
    console.error('[Cache] Warmup failed:', error);
    return { totalSteps: 0, duration: 0 };
  }
}

/**
 * Invalidar step del cache (cuando se actualiza)
 * @param {string} stepId - UUID del step
 */
function invalidateStep(stepId) {
  const deleted = stepsCache.del(stepId);
  if (deleted) {
    console.log(`[Cache] Invalidated step ${stepId}`);
  }
  return deleted;
}

/**
 * Invalidar todos los steps de un módulo
 * @param {string} moduleId - UUID del módulo
 */
function invalidateModule(moduleId) {
  // Buscar todas las keys que correspondan al módulo
  // (requiere mantener un index module_id -> step_ids)
  // Por ahora, limpiamos todo el cache
  stepsCache.flushAll();
  console.log(`[Cache] Flushed all steps cache`);
}

// ============================================
// MODULES CACHE
// ============================================

/**
 * Obtener módulo del cache o DB
 * @param {string} moduleId - UUID del módulo
 * @param {Function} fetchFn - Función para obtener de DB
 */
async function getModule(moduleId, fetchFn) {
  const cached = modulesCache.get(moduleId);
  
  if (cached) {
    stats.modules_hits++;
    return cached;
  }
  
  stats.modules_misses++;
  const moduleData = await fetchFn(moduleId);
  
  if (moduleData) {
    modulesCache.set(moduleId, moduleData);
  }
  
  return moduleData;
}

// ============================================
// STATS & MONITORING
// ============================================

/**
 * Obtener estadísticas del cache
 */
function getStats() {
  const stepsStats = stepsCache.getStats();
  const modulesStats = modulesCache.getStats();
  
  return {
    steps: {
      keys: stepsCache.keys().length,
      hits: stats.steps_hits,
      misses: stats.steps_misses,
      hit_rate: stats.steps_hits > 0 
        ? ((stats.steps_hits / (stats.steps_hits + stats.steps_misses)) * 100).toFixed(2) + '%'
        : '0%',
      preloaded: stats.steps_preloaded,
      ...stepsStats
    },
    modules: {
      keys: modulesCache.keys().length,
      hits: stats.modules_hits,
      misses: stats.modules_misses,
      hit_rate: stats.modules_hits > 0
        ? ((stats.modules_hits / (stats.modules_hits + stats.modules_misses)) * 100).toFixed(2) + '%'
        : '0%',
      ...modulesStats
    },
    last_preload: stats.last_preload
  };
}

/**
 * Resetear estadísticas
 */
function resetStats() {
  stats = {
    steps_hits: 0,
    steps_misses: 0,
    steps_preloaded: 0,
    modules_hits: 0,
    modules_misses: 0,
    last_preload: stats.last_preload
  };
}

/**
 * Limpiar todo el cache
 */
function flushAll() {
  stepsCache.flushAll();
  modulesCache.flushAll();
  console.log('[Cache] Flushed all caches');
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Steps cache
  getStep,
  preloadModuleSteps,
  warmupCache,
  invalidateStep,
  invalidateModule,
  
  // Modules cache
  getModule,
  
  // Admin
  getStats,
  resetStats,
  flushAll
};
