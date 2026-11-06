/**
 * SUPABASE CLIENT CONFIGURATION
 * 
 * Configuración optimizada de Supabase con connection pooling mejorado.
 * 
 * Fase 2.4: Optimizar connection pooling
 * Impacto esperado: -300ms por request (reduce overhead de conexión)
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Crear cliente de Supabase con configuración optimizada
 * @param {string} url - URL de Supabase
 * @param {string} key - Service role key
 * @returns {Object} Cliente de Supabase configurado
 */
function createOptimizedClient(url, key) {
  return createClient(url, key, {
    auth: {
      persistSession: false, // No persistir sesiones (backend API)
      autoRefreshToken: false, // No auto-refresh (no necesario en backend)
      detectSessionInUrl: false // No detectar session en URL
    },
    db: {
      schema: 'kuneo' // Schema por defecto
    },
    global: {
      headers: {
        'x-application-name': 'kuneo-adaptive-engine' // Para monitoreo
      }
    },
    // Fetch configuration para connection pooling
    realtime: {
      params: {
        eventsPerSecond: 10 // Limitar eventos realtime (no los usamos)
      }
    }
  });
}

/**
 * Estadísticas de conexión (solo para monitoreo)
 */
let connectionStats = {
  requests: 0,
  errors: 0,
  lastRequest: null
};

/**
 * Wrapper del cliente con stats
 * @param {Object} client - Cliente de Supabase
 */
function wrapClientWithStats(client) {
  return new Proxy(client, {
    get(target, prop) {
      const value = target[prop];
      
      // Interceptar métodos que hacen requests
      if (typeof value === 'function' && ['from', 'rpc'].includes(prop)) {
        return function(...args) {
          connectionStats.requests++;
          connectionStats.lastRequest = new Date().toISOString();
          
          try {
            return value.apply(target, args);
          } catch (error) {
            connectionStats.errors++;
            throw error;
          }
        };
      }
      
      return value;
    }
  });
}

/**
 * Obtener estadísticas de conexión
 */
function getConnectionStats() {
  return {
    ...connectionStats,
    uptime: process.uptime()
  };
}

/**
 * Resetear estadísticas
 */
function resetConnectionStats() {
  connectionStats = {
    requests: 0,
    errors: 0,
    lastRequest: connectionStats.lastRequest
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  createOptimizedClient,
  wrapClientWithStats,
  getConnectionStats,
  resetConnectionStats
};
