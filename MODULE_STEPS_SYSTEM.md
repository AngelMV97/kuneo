# 🎮 Sistema de Module Steps (Pasos Ejecutables)

## 📊 Estado Actual

**✅ COMPLETADO - 11,408 module_steps poblados en Supabase**

---

## 🎯 Arquitectura Implementada

```
MÓDULO (1,426)
  ↓
8 STEPS POR MÓDULO (11,408 total)
  ├─ STEP 1: Exploración (activar intuición)
  ├─ STEP 2: Representación (visualizar concepto)
  ├─ STEP 3: Razonamiento (explicar por qué funciona)
  ├─ STEP 4: Clasificación (distinguir casos y no casos)
  ├─ STEP 5: Aplicación guiada (practicar con apoyo)
  ├─ STEP 6: Transferencia (aplicar en contexto nuevo)
  ├─ STEP 7: Análisis de error (detectar misconception)
  └─ STEP 8: Metacognición (reflexionar sobre aprendizaje)
```

### Filosofía:
> **Kuneo no organiza por repetición lingüística (como Duolingo)**  
> **SÍ organiza por progresión cognitiva profunda**  
> **Cada step es una unidad ejecutable con políticas adaptativas**

---

## 📊 Resultados de Población

### Estadísticas Generales:
- **Total de módulos:** 1,426
- **Total de steps:** 11,408
- **Steps por módulo:** 8 (fijo, secuencia completa)
- **Tiempo promedio por módulo:** ~21 minutos (1,260 segundos)

### Por Dimensión Cognitiva:
| Dimensión | Steps | % | Difficulty | Time (s) | Response Type |
|---|---|---|---|---|---|
| **exploracion** | 1,426 | 12.5% | 1 | 90 | multiple_choice |
| **representacion** | 1,426 | 12.5% | 2 | 120 | selection |
| **razonamiento** | 1,426 | 12.5% | 3 | 180 | open_text |
| **clasificacion** | 1,426 | 12.5% | 3 | 150 | drag_drop |
| **aplicacion_guiada** | 1,426 | 12.5% | 3 | 240 | numeric |
| **transferencia** | 1,426 | 12.5% | 4 | 180 | multiple_choice |
| **analisis_de_error** | 1,426 | 12.5% | 4 | 180 | multiple_choice |
| **metacognicion** | 1,426 | 12.5% | 2 | 120 | open_text |

### Vinculación:
- ✅ **100% con concept_cards** (11,408/11,408)
- ✅ **100% con visual_templates** (11,408/11,408)
- ✅ **8 steps por módulo** (secuencia completa)

---

## 📋 Estructura de Module Steps

### Campos Implementados:

```sql
module_steps {
  -- Identificación
  id UUID
  module_id UUID REFERENCES modules(id)
  step_order INTEGER
  
  -- Tipo y fase
  cognitive_type TEXT               -- exploracion | representacion | razonamiento | etc.
  phase TEXT                         -- exploration | representation | concept_formation | etc.
  step_type TEXT                     -- question | explanation | guided_exercise | etc.
  session_type TEXT                  -- (futuro: para Duolingo-like organization)
  
  -- Contenido
  title TEXT                         -- "Exploración inicial: fracciones"
  instruction TEXT                   -- "Observa y piensa: ¿qué sabes sobre fracciones?"
  content JSONB                      -- {prompt, context, options, input_mode, etc.}
  
  -- Evaluación
  expected_response_type TEXT        -- multiple_choice | open_text | numeric | drag_drop
  success_criteria JSONB             -- {correct_required, max_attempts_before_hint, etc.}
  
  -- Vinculaciones
  concept_card_id UUID               -- Referencia a concept_cards
  visual_template_key TEXT           -- Referencia a visual_templates
  
  -- Políticas adaptativas (CLAVE DEL SISTEMA)
  hint_policy JSONB                  -- {allow_hint, hint_level_sequence, show_card_after_attempts}
  feedback_policy JSONB              -- {immediate, adaptive, show_explanation, show_visual}
  next_step_logic JSONB              -- {if_correct, if_incorrect_once, if_mastered, etc.}
  
  -- Metadata
  estimated_time_seconds INTEGER     -- Tiempo estimado (60-240s)
  difficulty INTEGER                 -- 1-5
  
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}
```

---

## 🎨 8 Dimensiones Cognitivas Detalladas

### 1. **EXPLORACIÓN** (exploracion)
**Objetivo:** Activar intuición y conocimientos previos

**Características:**
- Pregunta corta, sin explicación extensa
- Tuko NO aparece todavía (salvo si el usuario pide ayuda)
- Respuesta multiple_choice
- Difficulty: 1 (bajo) | Time: 90s

**Content JSONB ejemplo:**
```json
{
  "prompt": "Observa la figura. ¿Qué parte está coloreada?",
  "options": ["1/2", "1/3", "1/4", "3/4"],
  "context": "Fracciones como parte de un todo",
  "input_mode": "multiple_choice"
}
```

**Success Criteria:**
```json
{
  "correct_required": false,
  "max_attempts_before_hint": 2,
  "min_confidence": "low",
  "requires_explanation": false
}
```

**Hint Policy:**
```json
{
  "allow_hint": true,
  "hint_level_sequence": ["short_hint", "visual"],
  "show_card_after_attempts": 3,
  "show_card_if_time_seconds": 120
}
```

**Next Step Logic:**
```json
{
  "if_correct": "next",
  "if_incorrect_once": "retry",
  "if_incorrect_twice": "show_hint",
  "if_mastered": "next",
  "if_struggling": "show_visual"
}
```

---

### 2. **REPRESENTACIÓN** (representacion)
**Objetivo:** Ver el concepto visualmente

**Características:**
- Muestra visual_template asociado
- Pregunta exploratoria sobre el visual
- Respuesta selection (click, tap)
- Difficulty: 2 | Time: 120s

**Content JSONB ejemplo:**
```json
{
  "prompt": "Observa cómo se representa 1/2 = 2/4 visualmente",
  "visual_ref": "fraction_part_whole",
  "context": "Fracciones equivalentes",
  "input_mode": "selection"
}
```

**Next Step Logic:**
```json
{
  "if_correct": "next",
  "if_incorrect_once": "show_visual",
  "if_incorrect_twice": "show_concept_card",
  "if_mastered": "next",
  "if_struggling": "remedial_representation"
}
```

---

### 3. **RAZONAMIENTO** (razonamiento)
**Objetivo:** Explicar por qué funciona

**Características:**
- Pregunta abierta que requiere razonamiento
- Respuesta open_text
- Feedback adaptativo (no inmediato)
- Difficulty: 3 | Time: 180s

**Content JSONB ejemplo:**
```json
{
  "prompt": "¿Por qué 1/2 = 2/4?",
  "context": "Razona sobre fracciones equivalentes",
  "input_mode": "open_text"
}
```

**Success Criteria:**
```json
{
  "correct_required": false,
  "max_attempts_before_hint": 2,
  "min_confidence": "medium",
  "requires_explanation": true
}
```

**Next Step Logic:**
```json
{
  "if_correct": "next",
  "if_incorrect_once": "show_hint",
  "if_incorrect_twice": "show_concept_card",
  "if_mastered": "skip_to_transfer",
  "if_struggling": "insert_remedial_step"
}
```

---

### 4. **CLASIFICACIÓN** (clasificacion)
**Objetivo:** Distinguir casos y no casos

**Características:**
- Ejercicio de clasificación (drag & drop)
- Feedback inmediato
- Detecta si el estudiante diferencia conceptos
- Difficulty: 3 | Time: 150s

**Content JSONB ejemplo:**
```json
{
  "prompt": "¿Cuáles de estos son equivalentes a 1/2?",
  "options": ["2/4", "3/6", "1/3", "4/8", "2/5"],
  "correct_answers": ["2/4", "3/6", "4/8"],
  "context": "Clasificación de fracciones equivalentes",
  "input_mode": "drag_drop"
}
```

**Next Step Logic:**
```json
{
  "if_correct": "next",
  "if_incorrect_once": "retry_with_hint",
  "if_incorrect_twice": "show_concept_card",
  "if_mastered": "next",
  "if_struggling": "remedial_classification"
}
```

---

### 5. **APLICACIÓN GUIADA** (aplicacion_guiada)
**Objetivo:** Practicar con apoyo (fase más importante para Tuko)

**Características:**
- Ejercicio práctico con soporte
- Respuesta numeric o open_text
- Tuko interviene si falla 2 veces (corrective_card)
- Difficulty: 3 | Time: 240s (más tiempo)

**Content JSONB ejemplo:**
```json
{
  "prompt": "Si tienes 3/4 de pizza y comes 1/4, ¿cuánto queda?",
  "context": "Aplicación de fracciones",
  "input_mode": "numeric",
  "expected_answer": "1/2"
}
```

**Hint Policy:**
```json
{
  "allow_hint": true,
  "hint_level_sequence": ["short_hint", "worked_example", "concept_card"],
  "show_card_after_attempts": 2,
  "show_card_if_time_seconds": 180
}
```

**Next Step Logic:**
```json
{
  "if_correct": "next",
  "if_incorrect_once": "retry_with_hint",
  "if_incorrect_twice": "show_concept_card",
  "if_mastered": "skip_to_transfer",
  "if_struggling": "remedial_practice"
}
```

---

### 6. **TRANSFERENCIA** (transferencia)
**Objetivo:** Aplicar en contexto nuevo (evitar aprendizaje mecánico)

**Características:**
- Problema nuevo, contexto distinto
- Menor ayuda disponible
- Valida si el estudiante puede generalizar
- Difficulty: 4 (alto) | Time: 180s

**Content JSONB ejemplo:**
```json
{
  "prompt": "Una receta necesita 2/3 de taza de azúcar. Si quieres hacer la mitad de la receta, ¿cuánto necesitas?",
  "options": ["1/3", "1/6", "2/6", "3/6"],
  "correct_answer": "1/3",
  "context": "Transferencia: fracciones en recetas",
  "input_mode": "multiple_choice"
}
```

**Next Step Logic:**
```json
{
  "if_correct": "next",
  "if_incorrect_once": "retry_with_hint",
  "if_incorrect_twice": "remedial_transfer",
  "if_mastered": "next",
  "if_struggling": "back_to_guided_application"
}
```

---

### 7. **ANÁLISIS DE ERROR** (analisis_de_error)
**Objetivo:** Detectar misconception

**Características:**
- Muestra un razonamiento incorrecto
- Pregunta qué está mal
- Detecta si el estudiante identifica el error
- Difficulty: 4 | Time: 180s

**Content JSONB ejemplo:**
```json
{
  "prompt": "Juan dice: '1/2 es lo mismo que 1/4 porque ambos tienen un 1 arriba'. ¿Qué está mal en su razonamiento?",
  "options": [
    "Nada, Juan tiene razón",
    "El denominador importa: 1/2 es más grande que 1/4",
    "Solo importa el numerador",
    "Ambas fracciones son iguales a cero"
  ],
  "correct_answer": "El denominador importa: 1/2 es más grande que 1/4",
  "context": "Análisis de error: misconception sobre fracciones",
  "input_mode": "multiple_choice"
}
```

**Next Step Logic:**
```json
{
  "if_correct": "next",
  "if_incorrect_once": "retry_with_hint",
  "if_incorrect_twice": "show_misconception_card",
  "if_mastered": "next",
  "if_struggling": "remedial_error_analysis"
}
```

---

### 8. **METACOGNICIÓN** (metacognicion)
**Objetivo:** Reflexionar sobre el aprendizaje

**Características:**
- Pregunta reflexiva abierta
- No hay respuesta "correcta"
- Cierra el módulo con conexión
- Difficulty: 2 | Time: 120s

**Content JSONB ejemplo:**
```json
{
  "prompt": "¿Qué aprendiste sobre fracciones equivalentes? ¿En qué situaciones de tu vida las usarías?",
  "context": "Reflexión metacognitiva",
  "input_mode": "open_text"
}
```

**Hint Policy:**
```json
{
  "allow_hint": false,
  "hint_level_sequence": [],
  "show_card_after_attempts": null,
  "show_card_if_time_seconds": null
}
```

**Next Step Logic:**
```json
{
  "if_correct": "complete_module",
  "if_incorrect_once": "complete_module",
  "if_incorrect_twice": "complete_module",
  "if_mastered": "complete_module",
  "if_struggling": "complete_module"
}
```

---

## 🚀 Funciones SQL Auxiliares

### `kuneo.get_steps_by_cognitive_type(module_id, cognitive_type)`
Obtiene todos los steps de un tipo cognitivo específico para un módulo.

```sql
SELECT * FROM kuneo.get_steps_by_cognitive_type(
    'uuid-del-modulo',
    'aplicacion_guiada'
);
```

### `kuneo.validate_module_steps_cards()`
Valida que todos los módulos tengan steps con tarjetas y visuales.

```sql
SELECT * FROM kuneo.validate_module_steps_cards() 
WHERE steps_with_card < steps_count;
```

### `kuneo.get_module_sequence(module_id)`
Obtiene la secuencia completa de steps de un módulo.

```sql
SELECT * FROM kuneo.get_module_sequence('uuid-del-modulo');
```

### `kuneo.get_cognitive_type_stats()`
Estadísticas globales por tipo cognitivo.

```sql
SELECT * FROM kuneo.get_cognitive_type_stats();
```

### Vista: `kuneo.module_steps_with_context`
Vista enriquecida con información de módulo, concept_card y visual_template.

```sql
SELECT * FROM kuneo.module_steps_with_context 
WHERE module_id = 'uuid-del-modulo'
ORDER BY step_order;
```

---

## 🎮 Diferencia con Duolingo

| Aspecto | Duolingo | Kuneo |
|---|---|---|
| **Organización** | Repetición lingüística por skill | Progresión cognitiva por módulo |
| **Secuencia** | Practice → Repeat → Test | Explorar → Representar → Razonar → Clasificar → Aplicar → Transferir → Analizar → Reflexionar |
| **Evaluación** | Correctness (correcto/incorrecto) | Comprensión profunda (por qué, cómo) |
| **Adaptabilidad** | Streaks, XP, gamificación | Detección de misconceptions, pasos remediales inteligentes |
| **Feedback** | Inmediato y fijo | Adaptativo según hint_policy y next_step_logic |
| **Intervención** | Hints genéricos | Tuko con concept_cards contextualizadas |

---

## 🔄 Flujo de Experiencia Completo

```
ESTUDIANTE INICIA MÓDULO: "Fracciones equivalentes"
│
├─ STEP 1 (exploracion)
│   "¿Qué sabes sobre fracciones equivalentes?"
│   → Si responde mal → hint → visual
│   → Si pasa, avanza
│
├─ STEP 2 (representacion)
│   Muestra visual: fraction_part_whole
│   "Observa cómo 1/2 = 2/4"
│   → Si no entiende → concept_card básica
│   → Si pasa, avanza
│
├─ STEP 3 (razonamiento)
│   "¿Por qué 1/2 = 2/4?"
│   → Requiere explicación texto abierto
│   → Feedback adaptativo según respuesta
│
├─ STEP 4 (clasificacion)
│   "Clasifica: ¿cuáles son equivalentes a 1/2?"
│   → Drag & drop
│   → Feedback inmediato
│
├─ STEP 5 (aplicacion_guiada)
│   Ejercicio con apoyo: "3/4 - 1/4 = ?"
│   → Si falla 2 veces → Tuko interviene con corrective_card
│   → Si pasa, avanza
│
├─ STEP 6 (transferencia)
│   Aplicar en contexto nuevo: "Receta con 2/3 de azúcar, hacer la mitad"
│   → Si falla → back to step 5
│   → Si pasa, avanza
│
├─ STEP 7 (analisis_de_error)
│   "¿Qué está mal aquí: 1/2 = 1/4 porque ambos tienen 1 arriba?"
│   → Detecta misconception
│   → Si identifica error, avanza
│
└─ STEP 8 (metacognicion)
    "¿Qué aprendiste? ¿Cómo lo usarías en tu vida?"
    → Reflexión final
    → ✅ MÓDULO COMPLETADO
```

---

## 📝 Próximos Pasos

### ✅ Fase 1 - COMPLETADA
- [x] Actualizar schema con 8 dimensiones cognitivas
- [x] Crear sistema de políticas adaptativas (hint_policy, feedback_policy, next_step_logic)
- [x] Generar 11,408 module_steps (1,426 módulos × 8 steps)
- [x] Vincular 100% con concept_cards y visual_templates
- [x] Implementar funciones SQL auxiliares

### 🔄 Fase 2 - Enriquecimiento con LLM (OpenAI)
- [ ] Expandir content JSONB con contextos más ricos
- [ ] Generar opciones de respuesta más pedagógicas
- [ ] Crear variantes de ejercicios por dificultad
- [ ] Mejorar success_criteria adaptativo
- [ ] Generar feedback personalizado por tipo de error

### 🎨 Fase 3 - Adaptive Engine
- [ ] Implementar lógica de next_step_logic en backend
- [ ] Sistema de pasos remediales dinámicos
- [ ] Detección de patrones de error (stuck, exploración activa, flujo correcto)
- [ ] Inserción de pasos adicionales (remedial_representation, worked_example, etc.)
- [ ] Desbloqueo de módulos según progresión

### 🧪 Fase 4 - Frontend Implementation
- [ ] Crear componentes React para cada step_type
- [ ] Renderizar content JSONB dinámicamente
- [ ] Implementar lógica de hint_policy (mostrar hints progresivos)
- [ ] Sistema de feedback adaptativo visual
- [ ] Progress tracking por dimensión cognitiva

### 📊 Fase 5 - Analytics
- [ ] Tiempo real por step y dimensión cognitiva
- [ ] Detección de pasos con mayor dificultad
- [ ] Heatmap de errores por concepto
- [ ] Eficacia de visuales y concept_cards por step

---

## 📚 Archivos Clave

### Scripts:
- `scripts/database/update_module_steps_table.sql` - Schema update con 8 dimensiones
- `scripts/database/populate_module_steps.py` - Generación y población de steps
- `scripts/database/validate_module_steps.py` - Validación de datos

### Documentación:
- `MODULE_STEPS_SYSTEM.md` - Este documento
- `CONCEPT_CARDS_SYSTEM.md` - Sistema de tarjetas conceptuales
- `VISUAL_TEMPLATES_SYSTEM.md` - Sistema de plantillas visuales
- `UPLOAD_MODULES_GUIDE.md` - Guía general de población

---

## 🔍 Consultas Útiles

### Ver todos los steps de un módulo:
```sql
SELECT step_order, cognitive_type, title, difficulty, estimated_time_seconds
FROM kuneo.module_steps 
WHERE module_id = 'uuid-del-modulo'
ORDER BY step_order;
```

### Steps por tipo cognitivo:
```sql
SELECT cognitive_type, COUNT(*) 
FROM kuneo.module_steps 
GROUP BY cognitive_type 
ORDER BY COUNT(*) DESC;
```

### Steps con mayor dificultad:
```sql
SELECT module_id, step_order, title, difficulty, estimated_time_seconds
FROM kuneo.module_steps 
WHERE difficulty >= 4
ORDER BY difficulty DESC, estimated_time_seconds DESC;
```

### Módulos con secuencia completa:
```sql
SELECT module_id, COUNT(*) as steps_count 
FROM kuneo.module_steps 
GROUP BY module_id 
HAVING COUNT(*) = 8
ORDER BY steps_count DESC;
```

### Steps sin vinculación (debería ser 0):
```sql
SELECT step_order, cognitive_type, title
FROM kuneo.module_steps 
WHERE concept_card_id IS NULL 
   OR visual_template_key IS NULL;
```

---

## 💡 Reglas de Diseño

### ✅ HACER:
- Mantener secuencia fija de 8 steps por módulo
- Usar hint_policy para escalar apoyo gradualmente
- Implementar next_step_logic para adaptabilidad
- Vincular concept_cards según misconception detectada
- Permitir pasos remediales dinámicos (insertados por adaptive engine)

### ❌ NO HACER:
- Saltar steps de la secuencia core (los 8 son obligatorios)
- Hardcodear feedback en content (usar feedback_policy)
- Mostrar tarjetas antes de que el estudiante necesite ayuda
- Crear steps sin concept_card o visual_template asociado
- Mezclar lógica de negocio en content JSONB

---

**🎯 "Cada step es una unidad ejecutable con políticas adaptativas que permiten al adaptive engine tomar decisiones inteligentes en tiempo real"**
