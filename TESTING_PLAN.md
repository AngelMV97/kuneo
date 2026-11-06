# Plan de Testing Exhaustivo - Adaptive Engine

**Fecha:** 2026-05-19  
**Objetivo:** Validar el Adaptive Engine con módulos enriquecidos de múltiples asignaturas

---

## 📋 ESTADO DEL ENRICHMENT

### Completados ✅
- **Mathematics:** 499/500 (99.8%)

### En Progreso 🔄
- **Language:** 287/500 (57.4%) - ETA: ~16 minutos

### Pendientes ⏳
- **Science:** 0/500 - ETA: ~30 minutos
- **Social Studies:** 0/500 - ETA: ~30 minutos

**Total proyectado:** ~1,786 steps enriquecidos (~15.6% del total)

---

## 🧪 PLAN DE TESTING

### Fase 1: Testing Individual por Asignatura

#### 1.1 Mathematics Testing
**Objetivo:** Validar con módulos de matemáticas enriquecidos

**Tests a ejecutar:**
- [ ] Fracciones (ya probado ✅)
- [ ] Álgebra básico
- [ ] Geometría
- [ ] Aritmética

**Escenarios por módulo:**
- Respuestas correctas consecutivas
- Respuestas incorrectas con misconceptions
- Solicitud de hints en diferentes niveles
- Respuestas rápidas (silence rule)
- Progreso multi-dimensional

**Script:** `test-adaptive-flow.ps1` adaptado para cada módulo

---

#### 1.2 Language Testing
**Objetivo:** Validar comprensión lectora y gramática

**Tests a ejecutar:**
- [ ] Comprensión de textos
- [ ] Gramática y sintaxis
- [ ] Vocabulario
- [ ] Ortografía

**Escenarios específicos:**
- Answer type: 'text' con keywords
- Answer type: 'option' en comprensión
- Misconceptions en gramática (confusión b/v, s/c/z, etc.)

---

#### 1.3 Science Testing
**Objetivo:** Validar ciencias naturales

**Tests a ejecutar:**
- [ ] Biología básica
- [ ] Física introductoria
- [ ] Química básica

**Escenarios específicos:**
- Answer type: 'drawing' para diagramas
- Answer type: 'numeric' para cálculos
- Visual explorations con templates

---

#### 1.4 Social Studies Testing
**Objetivo:** Validar historia y geografía

**Tests a ejecutar:**
- [ ] Historia de Colombia
- [ ] Geografía mundial
- [ ] Ciudadanía

**Escenarios específicos:**
- Answer type: 'text' con evaluation_strategy keywords
- Classification tasks (períodos históricos, regiones)
- Transfer tasks (aplicar conceptos históricos)

---

### Fase 2: Testing Cross-Subject

#### 2.1 Student Journey Simulation
**Objetivo:** Simular un estudiante real usando múltiples módulos

**Flujo:**
1. Iniciar con Mathematics (álgebra)
2. Pasar a Science (física - aplicación matemática)
3. Completar Language (comprensión de texto científico)
4. Finalizar con Social Studies (estadísticas poblacionales)

**Métricas a validar:**
- Cognitive profile evolución
- Transferencia de conocimiento entre asignaturas
- Recomendaciones adaptativas
- Mastery level progression

---

#### 2.2 Performance Testing
**Objetivo:** Validar performance bajo carga

**Tests:**
- [ ] 100 respuestas consecutivas (mismo usuario)
- [ ] 10 usuarios simultáneos
- [ ] Response time consistency
- [ ] Database query optimization

**Métricas esperadas:**
- Evaluación: <200ms
- Total API response: <500ms
- Database queries: <50ms
- No memory leaks

---

### Fase 3: Edge Cases & Error Handling

#### 3.1 Edge Cases
- [ ] Usuario sin cognitive profile previo
- [ ] Module con 0 attempts previos
- [ ] Hint request en step sin hints configurados
- [ ] Misconception sin pattern match
- [ ] Answer fuera de expected format

#### 3.2 Error Handling
- [ ] Invalid step_id
- [ ] Invalid user_id
- [ ] Malformed answer payload
- [ ] Database connection errors
- [ ] OpenAI API errors (para futuro LLM evaluation)

---

### Fase 4: Data Quality Validation

#### 4.1 Enriched Content Quality
**SQL Queries a ejecutar:**

```sql
-- Validar distribución de dimensions
SELECT 
  enriched_content->>'cognitive_dimension' as dimension,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM kuneo.module_steps
WHERE enriched_content IS NOT NULL
GROUP BY dimension
ORDER BY count DESC;

-- Validar distribución de answer_types
SELECT 
  enriched_content->'expected_answer'->>'type' as answer_type,
  COUNT(*) as count
FROM kuneo.module_steps
WHERE enriched_content IS NOT NULL
GROUP BY answer_type;

-- Validar misconceptions por asignatura
SELECT 
  m.subject,
  COUNT(DISTINCT ms.id) as steps_con_misconceptions,
  COUNT(misconception) as total_misconceptions
FROM kuneo.modules m
JOIN kuneo.module_steps ms ON m.id = ms.module_id
CROSS JOIN LATERAL jsonb_array_elements(
  ms.enriched_content->'expected_answer'->'misconceptions'
) as misconception
WHERE ms.enriched_content IS NOT NULL
GROUP BY m.subject;
```

#### 4.2 Coverage Analysis
- [ ] % de steps enriquecidos por asignatura
- [ ] % de módulos con enrichment completo
- [ ] Distribución de difficulty levels
- [ ] Cobertura por grado escolar

---

## 📊 CRITERIOS DE ÉXITO

### Funcional
- [x] ✅ Evaluación correcta: 100% accuracy
- [x] ✅ Misconception detection: Functional
- [x] ✅ Hint system: 3 levels working
- [ ] ⏳ Multi-subject flow: Complete journey
- [ ] ⏳ Cognitive profile: Accurate evolution

### Performance
- [x] ✅ Response time: <500ms
- [ ] ⏳ Concurrent users: 10+ simultaneous
- [ ] ⏳ Database optimization: <50ms queries
- [ ] ⏳ Memory usage: Stable under load

### Data Quality
- [x] ✅ Enrichment success rate: >95%
- [ ] ⏳ Misconception relevance: Manual review
- [ ] ⏳ Hint quality: Pedagogically sound
- [ ] ⏳ Coverage: >50% steps enriched

---

## 🔧 HERRAMIENTAS DE TESTING

### Scripts Creados
1. ✅ `test-adaptive-simple.ps1` - Test básico
2. ✅ `test-adaptive-comprehensive.ps1` - 8 escenarios
3. ✅ `test-adaptive-flow.ps1` - Multi-step progression
4. ⏳ `test-multi-subject-flow.ps1` - Cross-subject journey
5. ⏳ `test-performance.ps1` - Load testing
6. ⏳ `validate-enrichment-quality.sql` - Data quality

### SQL Queries
1. ✅ `find-enriched-modules.sql` - Módulos con enrichment completo
2. ✅ `get-fracciones-steps.sql` - Steps específicos
3. ⏳ `analyze-misconceptions.sql` - Análisis de misconceptions
4. ⏳ `coverage-report.sql` - Reporte de cobertura

---

## 📅 CRONOGRAMA

### Hoy (2026-05-19)
- ✅ Mathematics enrichment completado
- 🔄 Language enrichment (57.4%) - ETA: 16 min
- ⏳ Science enrichment - ETA: 30 min
- ⏳ Social Studies enrichment - ETA: 30 min
- **Total tiempo:** ~1h 15min

### Siguiente sesión
- Testing Fase 1: Individual por asignatura (2-3 horas)
- Testing Fase 2: Cross-subject (1 hora)
- Testing Fase 3: Edge cases (1 hora)
- Testing Fase 4: Data quality validation (30 min)

---

## 🎯 PRIORIDADES

**ALTA:**
1. Completar enrichments (language + science + social_studies)
2. Testing Fase 1 con al menos 2 módulos por asignatura
3. Validar data quality (distribuciones, misconceptions)

**MEDIA:**
4. Testing cross-subject journey
5. Performance testing básico
6. Edge cases principales

**BAJA:**
7. Load testing avanzado
8. Optimización de queries (si es necesario)
9. Manual review de misconceptions

---

## 📝 NOTAS

### Lecciones del Testing Actual
- Bug de option evaluation fue crítico - sin él, 25% de steps fallarían
- Silence rule funciona pero necesita más validación en escenarios reales
- Intervention messages están vacías en algunos casos - investigar

### Próximos Pasos Después del Testing
1. **Onboarding System:** Inicialización de student profile
2. **Tutor Selection:** Integración con personajes (Kundi, Lili, etc.)
3. **Misconception Engine Profundo:** Requiere datos reales de uso
4. **LLM Evaluation:** Para respuestas abiertas (text type)

---

**Última actualización:** 2026-05-19 18:15
