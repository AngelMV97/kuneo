# 🚀 PLAN DE ENRICHMENT MASIVO

**Objetivo:** Poblar `enriched_content` en module_steps para que el Adaptive Engine tenga datos reales

**Estado actual:** Adaptive Engine funcional pero solo 1 módulo de prueba con enriched_content

---

## 📊 PASO 1: VERIFICAR ESTADO ACTUAL

Ejecutar en Supabase SQL Editor:

```sql
-- scripts/check-enrichment-status.sql
```

Este script mostrará:
1. Resumen por asignatura (cuántos steps sin enrichment)
2. Top 20 módulos con más steps pendientes
3. Total general de enrichment
4. Módulos 100% listos para testing

---

## 🎯 ESTRATEGIA DE ENRICHMENT

### Orden de Prioridad

1. **Matemáticas** (mathematics) - Asignatura más estructurada
2. **Ciencias Naturales** (natural_sciences)
3. **Lenguaje** (language)
4. **Ciencias Sociales** (social_sciences)
5. **Inglés** (english)

### Lotes Recomendados

- **80-120 steps por ejecución** (para evitar rate limits de OpenAI)
- **Validar 5-10 módulos completos** antes de continuar
- **Reintentar failed** por rate limits o errores de API
- **Continuar hasta completar asignatura**

---

## 🔧 PASO 2: EJECUTAR ENRICHMENT

### Opción A: Script de Enrichment Existente

Si ya tienes un script de enrichment (probablemente `server/enrichment.js` o similar):

```bash
# En terminal server
node enrichment.js --subject mathematics --limit 100
```

### Opción B: Endpoint de Enrichment

Si configuraste un endpoint API:

```powershell
# Enriquecer matemáticas (primeros 100 steps)
$body = @{subject='mathematics'; limit=100} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/enrichment/enrich-batch -Method POST -Body $body -ContentType 'application/json'
```

### Opción C: Enriquecimiento Manual por Lotes

Si no tienes script automatizado, crear uno nuevo:

**server/scripts/batch-enrichment.js**

---

## 📋 PASO 3: VALIDAR RESULTADOS

Después de cada lote, ejecutar:

```sql
-- scripts/check-enrichment-status.sql
```

Verificar:
- ✅ Incremento en `enriched_steps`
- ✅ `enrichment_percentage` aumentó
- ✅ No hay errores en `enrichment_status`

### Query de Validación Detallada

```sql
-- Ver steps enriquecidos recientemente
SELECT 
  m.title,
  ms.step_order,
  ms.step_type,
  ms.enriched_content->'expected_answer'->>'type' as answer_type,
  ms.enriched_content->>'cognitive_dimension' as dimension,
  LENGTH(ms.enriched_content::text) as enriched_size,
  ms.enriched_at
FROM kuneo.modules m
JOIN kuneo.module_steps ms ON m.id = ms.module_id
WHERE ms.enriched_at > NOW() - INTERVAL '1 hour'
  AND m.subject = 'mathematics'
ORDER BY ms.enriched_at DESC
LIMIT 20;
```

---

## 🎯 PASO 4: TESTING CON MÓDULOS REALES

Una vez enriquecidos 5-10 módulos completos de matemáticas:

### 4.1 Seleccionar un módulo completo

```sql
-- scripts/check-enrichment-status.sql (sección 4)
-- Esto muestra módulos 100% enriquecidos
```

### 4.2 Probar con usuario real

```powershell
# Test: Submit answer en módulo real
$body = @{
  user_id='b5d08d8c-2c8a-47aa-85e5-3cd58751f35d'
  module_id='ID_DEL_MODULO_COMPLETO'
  step_id='ID_DEL_PRIMER_STEP'
  answer='respuesta de prueba'
  time_on_task=60
  hint_requests=0
  confidence='medium'
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3001/api/adaptive/submit-answer -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
```

### 4.3 Verificar flujo completo

- ✅ Evaluación correcta (correct/incorrect)
- ✅ Misconception detection funcionando
- ✅ Card variants apropiados
- ✅ Visual templates activados
- ✅ Progress actualizado en BD
- ✅ Next action correcto

---

## 📊 PASO 5: MONITOREO DE PROGRESO

### Dashboard Manual

Crear query SQL para dashboard:

```sql
-- Dashboard de enrichment
WITH enrichment_stats AS (
  SELECT 
    m.subject,
    m.id as module_id,
    m.title,
    COUNT(ms.id) as total_steps,
    COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched,
    MAX(ms.enriched_at) as last_enriched
  FROM kuneo.modules m
  LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
  WHERE m.is_active = true
  GROUP BY m.subject, m.id, m.title
)
SELECT 
  subject,
  COUNT(*) as modules_count,
  SUM(total_steps) as total_steps,
  SUM(enriched) as enriched_steps,
  SUM(total_steps) - SUM(enriched) as pending_steps,
  ROUND(100.0 * SUM(enriched) / NULLIF(SUM(total_steps), 0), 2) as completion_pct
FROM enrichment_stats
GROUP BY subject
ORDER BY pending_steps DESC;
```

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error: Rate Limit de OpenAI

**Síntoma:** `429 Too Many Requests`

**Solución:**
- Reducir batch size (de 100 a 50 steps)
- Agregar delay entre requests (2-3 segundos)
- Usar tier más alto de OpenAI API

### Error: Timeout en enrichment

**Síntoma:** Request toma > 60 segundos

**Solución:**
- Reducir batch size
- Procesar en chunks más pequeños
- Usar background jobs (ej: Bull queue)

### Error: expected_answer inválido

**Síntoma:** JSON malformado en enriched_content

**Solución:**
- Verificar schema de expected_answer
- Añadir validación en script de enrichment
- Re-ejecutar enrichment para ese step

---

## 🎯 CRITERIOS DE ÉXITO

**Milestone 1: Matemáticas 80% enriquecido**
- ≥ 80% de steps de matemáticas con enriched_content
- ≥ 10 módulos completos disponibles para testing
- 0 errores en enrichment_status

**Milestone 2: 3 asignaturas principales**
- Matemáticas, Ciencias Naturales, Lenguaje ≥ 70% enriquecido
- ≥ 30 módulos completos total
- Testing exitoso en 10+ módulos

**Milestone 3: Todas las asignaturas**
- Todas las asignaturas ≥ 60% enriquecido
- ≥ 50 módulos completos total
- Adaptive Engine probado extensivamente

---

## 📅 TIMELINE ESTIMADO

- **Día 1:** Matemáticas (100-200 steps)
- **Día 2:** Matemáticas continuación (200-400 steps)
- **Día 3:** Ciencias Naturales (100-200 steps)
- **Día 4:** Lenguaje (100-200 steps)
- **Día 5:** Ciencias Sociales + Inglés
- **Día 6:** Validación y testing extensivo

**Total:** ~1,000-1,500 steps enriquecidos en 1 semana

---

## 🚀 DESPUÉS DEL ENRICHMENT MASIVO

1. **Onboarding Flow:**
   - Diseñar wizard de bienvenida
   - Selección de grado
   - Selección de asignaturas prioritarias
   - Elección de tutor (Tuko, Pico, etc.)
   - Assessment inicial (opcional)

2. **Misconception Engine Profundo:**
   - Con datos reales de attempts
   - Análisis de patterns por microtopic
   - Detección automática de nuevos misconceptions

3. **Recommendation Engine Avanzado:**
   - Rutas personalizadas por taxonomía
   - Predicción de mastery con ML
   - Desbloqueo inteligente de contenido

---

## 📝 CHECKLIST

- [ ] Ejecutar `scripts/check-enrichment-status.sql` - Ver estado actual
- [ ] Configurar script/endpoint de enrichment masivo
- [ ] Enriquecer matemáticas (primeros 100 steps)
- [ ] Validar results (enrichment_percentage aumentó)
- [ ] Seleccionar 1 módulo completo de matemáticas
- [ ] Probar flujo end-to-end con módulo real
- [ ] Continuar enrichment hasta 80% matemáticas
- [ ] Repetir proceso para ciencias naturales
- [ ] Repetir proceso para lenguaje
- [ ] Milestone 2 alcanzado: 3 asignaturas principales
- [ ] Diseñar Onboarding flow
- [ ] Implementar Onboarding
- [ ] Preparar Misconception Engine profundo

---

**Estado:** LISTO PARA EJECUTAR  
**Siguiente paso:** Ejecutar `scripts/check-enrichment-status.sql` para ver cuántos steps necesitan enrichment
