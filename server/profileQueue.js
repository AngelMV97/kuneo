/**
 * WRITE-BEHIND QUEUE MODULE
 * 
 * Sistema de cola asíncrona para actualizar cognitive profiles.
 * Permite eliminar UPDATEs bloqueantes del path crítico del request.
 * 
 * Fase 2.3: Write-behind pattern para profile updates
 * Impacto esperado: -400ms por request (elimina UPDATE profile del critical path)
 * 
 * Trade-off: Eventual consistency (acceptable para perfiles cognitivos)
 */

// ============================================
// CONFIGURACIÓN
// ============================================

const BATCH_SIZE = 10; // Agrupar updates en batches
const FLUSH_INTERVAL = 2000; // Flush cada 2 segundos
const MAX_RETRIES = 3;

// Cola en memoria
const queue = [];
let processing = false;
let flushTimer = null;
let supabaseClient = null;

// Stats
let stats = {
  enqueued: 0,
  processed: 0,
  failed: 0,
  batches_processed: 0,
  last_flush: null,
  queue_size_max: 0
};

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializar queue con cliente de Supabase
 * @param {Object} supabase - Cliente de Supabase
 */
function initialize(supabase) {
  supabaseClient = supabase;
  console.log('[ProfileQueue] Initialized');
  
  // Iniciar flush periódico
  startFlushTimer();
}

function getSupabase() {
  if (!supabaseClient) {
    throw new Error('ProfileQueue not initialized. Call initialize() first.');
  }
  return supabaseClient;
}

// ============================================
// ENQUEUE
// ============================================

/**
 * Agregar update a la cola (non-blocking)
 * @param {string} userId - UUID del usuario
 * @param {Object} updates - Campos a actualizar
 */
function enqueueProfileUpdate(userId, updates) {
  // Buscar si ya existe un update pendiente para este usuario
  const existingIndex = queue.findIndex(item => item.userId === userId);
  
  if (existingIndex >= 0) {
    // Merge updates (último valor gana)
    queue[existingIndex].updates = {
      ...queue[existingIndex].updates,
      ...updates
    };
    queue[existingIndex].timestamp = Date.now();
  } else {
    // Agregar nuevo item
    queue.push({
      userId,
      updates,
      timestamp: Date.now(),
      retries: 0
    });
  }
  
  stats.enqueued++;
  if (queue.length > stats.queue_size_max) {
    stats.queue_size_max = queue.length;
  }
  
  // Si la cola está grande, flush inmediato
  if (queue.length >= BATCH_SIZE) {
    processQueue();
  }
}

// ============================================
// PROCESSING
// ============================================

/**
 * Procesar cola de updates (ejecuta en background)
 */
async function processQueue() {
  if (processing || queue.length === 0) {
    return;
  }
  
  processing = true;
  
  try {
    // Tomar batch de la cola
    const batch = queue.splice(0, BATCH_SIZE);
    
    console.log(`[ProfileQueue] Processing batch of ${batch.length} updates`);
    
    // Procesar updates en paralelo
    const promises = batch.map(item => processUpdate(item));
    const results = await Promise.allSettled(promises);
    
    // Contar éxitos/fallos
    let succeeded = 0;
    let failed = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        succeeded++;
        stats.processed++;
      } else {
        failed++;
        stats.failed++;
        
        // Reintentar si no superó max retries
        const item = batch[index];
        if (item.retries < MAX_RETRIES) {
          item.retries++;
          queue.push(item); // Volver a encolar
          console.warn(`[ProfileQueue] Retry ${item.retries}/${MAX_RETRIES} for user ${item.userId}`);
        } else {
          console.error(`[ProfileQueue] Max retries exceeded for user ${item.userId}:`, result.reason);
        }
      }
    });
    
    stats.batches_processed++;
    stats.last_flush = new Date().toISOString();
    
    console.log(`[ProfileQueue] Batch processed: ${succeeded} succeeded, ${failed} failed`);
    
  } catch (error) {
    console.error('[ProfileQueue] Error processing batch:', error);
  } finally {
    processing = false;
    
    // Si quedan items, seguir procesando
    if (queue.length > 0) {
      setImmediate(() => processQueue());
    }
  }
}

/**
 * Procesar un update individual
 * @param {Object} item - Item de la cola
 */
async function processUpdate(item) {
  const { userId, updates } = item;
  
  try {
    const { error } = await getSupabase()
      .schema('kuneo')
      .from('student_cognitive_profile')
      .update(updates)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`[ProfileQueue] Error updating profile for user ${userId}:`, error);
    throw error;
  }
}

// ============================================
// FLUSH TIMER
// ============================================

/**
 * Iniciar timer de flush periódico
 */
function startFlushTimer() {
  if (flushTimer) {
    clearInterval(flushTimer);
  }
  
  flushTimer = setInterval(() => {
    if (queue.length > 0) {
      console.log(`[ProfileQueue] Periodic flush: ${queue.length} items in queue`);
      processQueue();
    }
  }, FLUSH_INTERVAL);
  
  console.log(`[ProfileQueue] Flush timer started (interval: ${FLUSH_INTERVAL}ms)`);
}

/**
 * Detener timer de flush
 */
function stopFlushTimer() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
    console.log('[ProfileQueue] Flush timer stopped');
  }
}

// ============================================
// ADMIN
// ============================================

/**
 * Flush manual de la cola (útil para testing o shutdown)
 */
async function flush() {
  console.log(`[ProfileQueue] Manual flush requested: ${queue.length} items`);
  
  while (queue.length > 0) {
    await processQueue();
    // Pequeña pausa para no saturar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('[ProfileQueue] Manual flush completed');
}

/**
 * Obtener estadísticas de la cola
 */
function getStats() {
  return {
    ...stats,
    queue_size_current: queue.length,
    processing
  };
}

/**
 * Resetear estadísticas
 */
function resetStats() {
  stats = {
    enqueued: 0,
    processed: 0,
    failed: 0,
    batches_processed: 0,
    last_flush: stats.last_flush,
    queue_size_max: 0
  };
}

/**
 * Shutdown graceful (procesar cola antes de cerrar)
 */
async function shutdown() {
  console.log('[ProfileQueue] Shutdown requested...');
  stopFlushTimer();
  await flush();
  console.log('[ProfileQueue] Shutdown complete');
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  initialize,
  enqueueProfileUpdate,
  flush,
  getStats,
  resetStats,
  shutdown
};
