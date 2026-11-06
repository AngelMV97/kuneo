# Performance Optimization Plan
## Adaptive Engine - From 3s to <500ms

**Status**: 🚀 EN PROGRESO  
**Fecha**: 2026-05-20  
**Performance Actual**: ~3,000ms/request  
**Performance Objetivo**: <500ms/request  
**Gap**: 6x improvement needed  

---

## 🔍 Bottlenecks Identificados

### 1. Database Queries (CRÍTICO)
**Problema**: 9-10 queries secuenciales por request

**Queries en submitAnswer()**:
1. SELECT module_steps (con enriched_content)
2. COUNT student_step_attempts (en updateProgress)
3. INSERT student_step_attempts
4. SELECT student_module_progress
5. UPDATE student_module_progress
6. SELECT student_cognitive_profile
7. UPDATE student_cognitive_profile
8. SELECT student_module_progress (again)
9. SELECT student_step_attempts (ORDER BY + LIMIT)

**Impacto**: Cada query ~200-500ms = 2,000-4,500ms total  
**Prioridad**: 🔴 ALTA

### 2. Falta de Índices (CRÍTICO)
**Problema**: Queries lentos sin índices optimizados

**Tablas sin índices adecuados**:
- `module_steps`: (module_id, step_order)
- `student_step_attempts`: (user_id, step_id), (user_id, step_id, created_at)
- `student_module_progress`: (user_id, module_id)
- `student_cognitive_profile`: (user_id)

**Impacto**: 50-200ms adicional por query  
**Prioridad**: 🔴 ALTA

### 3. No Caching (ALTO)
**Problema**: Datos estáticos consultados repetidamente

**Candidatos para cache**:
- `module_steps` con enriched_content (no cambia frecuentemente)
- `student_cognitive_profile` (leer 1x, escribir al final)
- `student_module_progress` (leer 1x, escribir al final)

**Impacto**: Eliminar 2-3 queries = 500-1,000ms ahorro  
**Prioridad**: 🟡 MEDIA

### 4. Queries N+1 Pattern (MEDIO)
**Problema**: SELECT + UPDATE separados (2 queries por entidad)

**Optimización**:
- Usar UPSERT (INSERT ... ON CONFLICT UPDATE)
- Batch updates cuando sea posible

**Impacto**: Reducir de 6 queries a 3 = 300-600ms ahorro  
**Prioridad**: 🟡 MEDIA

### 5. Connection Pool (BAJO)
**Problema**: Posible limitación de conexiones Supabase

**Optimización**:
- Verificar configuración de pool
- Considerar connection reuse

**Impacto**: 50-100ms ahorro  
**Prioridad**: 🟢 BAJA

---

## 🎯 Plan de Acción (Iterativo)

### Fase 1: Quick Wins (Target: 3s → 1.5s)
**Objetivo**: Reducir 50% con cambios mínimos

#### 1.1 Agregar Índices Críticos ⚡
**Tiempo**: 10 minutos  
**Impacto esperado**: -800ms  

```sql
-- module_steps
CREATE INDEX idx_module_steps_module_id_order 
ON kuneo.module_steps(module_id, step_order);

-- student_step_attempts
CREATE INDEX idx_step_attempts_user_step 
ON kuneo.student_step_attempts(user_id, step_id);

CREATE INDEX idx_step_attempts_user_step_created 
ON kuneo.student_step_attempts(user_id, step_id, created_at DESC);

-- student_module_progress
CREATE INDEX idx_module_progress_user_module 
ON kuneo.student_module_progress(user_id, module_id);

-- student_cognitive_profile
CREATE INDEX idx_cognitive_profile_user 
ON kuneo.student_cognitive_profile(user_id);
```

#### 1.2 Eliminar COUNT Query Innecesario ⚡
**Tiempo**: 5 minutos  
**Impacto esperado**: -200ms  

**Cambio**: En lugar de COUNT previo, usar MAX(attempt_number) + 1
```javascript
// ANTES (línea ~340)
const { count: previousAttempts } = await getSupabase()
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('step_id', stepId);

// DESPUÉS
const { data: lastAttempt } = await getSupabase()
  .select('attempt_number')
  .eq('user_id', userId)
  .eq('step_id', stepId)
  .order('attempt_number', { ascending: false })
  .limit(1)
  .maybeSingle();

const actualAttemptNumber = (lastAttempt?.attempt_number || 0) + 1;
```

#### 1.3 Paralelizar Queries Independientes ⚡
**Tiempo**: 15 minutos  
**Impacto esperado**: -500ms  

**Cambio**: Usar Promise.all() para queries que no dependen entre sí
```javascript
// DESPUÉS de INSERT attempt, paralelizar:
const [moduleProgressData, cognitiveProfileData] = await Promise.all([
  getSupabase().from('student_module_progress').select('*').eq('user_id', userId).eq('module_id', moduleId).single(),
  getSupabase().from('student_cognitive_profile').select('*').eq('user_id', userId).single()
]);
```

**Total Fase 1**: ~30 minutos → Reducción esperada: **1,500ms** (3s → 1.5s)

---

### Fase 2: Caching Layer (Target: 1.5s → 800ms)
**Objetivo**: Eliminar queries redundantes

#### 2.1 In-Memory Cache para Module Steps 📦
**Tiempo**: 30 minutos  
**Impacto esperado**: -300ms  

**Implementación**: Node.js Map con TTL 5 minutos
```javascript
const moduleStepsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getStepCached(stepId) {
  const cached = moduleStepsCache.get(stepId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const { data } = await getSupabase()
    .from('module_steps')
    .select('*, enriched_content')
    .eq('id', stepId)
    .single();
  
  moduleStepsCache.set(stepId, { data, timestamp: Date.now() });
  return data;
}
```

#### 2.2 Optimizar Profile Updates con Write-Behind 📦
**Tiempo**: 45 minutos  
**Impaco esperado**: -400ms  

**Cambio**: Acumular updates y escribir en background
- Leer profile 1 vez al inicio
- Acumular cambios en memoria
- Escribir al final (non-blocking)

**Total Fase 2**: ~75 minutos → Reducción adicional: **700ms** (1.5s → 800ms)

---

### Fase 3: Advanced Optimizations (Target: 800ms → <500ms)
**Objetivo**: Llegar al target ideal

#### 3.1 UPSERT Pattern para Progress Tables 🚀
**Tiempo**: 60 minutos  
**Impacto esperado**: -200ms  

**Cambio**: 2 queries (SELECT + UPDATE) → 1 query (UPSERT)

#### 3.2 Redis Cache (Opcional) 🚀
**Tiempo**: 2-3 horas  
**Impacto esperado**: -100ms adicional  

**Total Fase 3**: ~1-4 horas → Reducción adicional: **300ms** (800ms → 500ms)

---

## 📊 Proyección de Resultados

| Fase | Tiempo | Performance | Reducción |
|------|--------|-------------|-----------|
| **Inicial** | - | 3,000ms | - |
| **Fase 1** | 30 min | 1,500ms | -50% |
| **Fase 2** | 75 min | 800ms | -47% |
| **Fase 3** | 1-4 hrs | <500ms | -38% |

**Total**: 2-6 horas para lograr target <500ms

---

## 🧪 Testing Strategy

**Después de cada fase**:
1. Ejecutar `test-performance-quick.js`
2. Medir Avg, P95, P99
3. Validar 0% error rate
4. Comparar con baseline anterior

**Baseline Actual**:
- Avg: 2,973ms
- P95: 3,277ms
- Error Rate: 0%
- Throughput: 1.61 req/s

**Target Final**:
- Avg: <500ms
- P95: <750ms
- Error Rate: <1%
- Throughput: >10 req/s

---

## 🚀 Siguiente Paso

**Recomendación**: Empezar con **Fase 1** (Quick Wins)
- Bajo riesgo
- Alto impacto
- 30 minutos
- 50% improvement

**¿Proceder con Fase 1?**
