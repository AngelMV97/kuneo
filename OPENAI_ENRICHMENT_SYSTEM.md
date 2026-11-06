# 🤖 Sistema de Enriquecimiento con OpenAI

## 📊 Estado Actual

| Componente | Estado | Archivos |
|------------|--------|----------|
| **Pedagogical Foundations** | ✅ Completado | 16 archivos (7 JSON, 5 MD, 3 schemas, 1 README) |
| **Schema Enrichment (Module Steps)** | ✅ Completado | `update_module_steps_enrichment.sql` |
| **Script Enrichment (Module Steps)** | ✅ Completado | `enrich_module_steps.py` |
| **Enriquecimiento Module Steps** | ✅ En Progreso | 98/11,408 steps enriquecidos (Fases 1-3 validadas) |
| **Schema Enrichment (Concept Cards)** | ✅ Completado | `update_concept_cards_enrichment.sql` |
| **Script Enrichment (Concept Cards)** | ✅ Completado | `enrich_concept_cards.py` |
| **Enriquecimiento Concept Cards** | ⏳ Pendiente | 0/44 cards enriquecidas (listo para Fase 1) |
| **Visual Templates Enrichment** | ⏳ Pendiente | Script por crear |

---

## 🧠 Principio Fundamental

> **"El LLM NO decide currículo. El LLM NO decide arquitectura. El LLM NO decide progresión. El LLM: llena, contextualiza, adapta, enriquece."**

El sistema de enriquecimiento con OpenAI es **controlado por pedagogical_foundations**, que actúa como "cerebro pedagógico" y garantiza que todo contenido generado:

1. ✅ Respete los 8 principios pedagógicos de Kuneo
2. ✅ Mantenga el currículo (competency_units, taxonomías) intacto
3. ✅ Preserve la progresión cognitiva (8 module_steps)
4. ✅ Use tono empático y formativo (nunca punitivo)
5. ✅ Sea culturalmente sensible e inclusivo
6. ✅ Promueva razonamiento, no solo recall

---

## 🏗️ Arquitectura del Sistema

```
pedagogical_foundations/
    ├── pedagogical_principles.json      [8 principios filosóficos]
    ├── llm_enrichment_policy.json       [Qué PUEDE/NO PUEDE hacer el LLM]
    ├── tuko_intervention_policy.json    [Cuándo Tuko interviene]
    ├── feedback_policy.json             [Reglas de feedback formativo]
    ├── reflection_policy.json           [Prompts metacognitivos]
    ├── socioemotional_policy.json       [Tono socioemocional]
    ├── assessment_policy.json           [Evaluación formativa]
    ├── prompt_blocks/
    │   ├── system_pedagogy.md           [System prompt base]
    │   ├── feedback_rules.md            [Reglas de feedback detalladas]
    │   ├── tuko_voice.md                [Voz de Tuko]
    │   ├── metacognition_rules.md       [Reglas de reflexión]
    │   └── safety_and_quality.md        [Validación de seguridad]
    ├── schemas/
    │   ├── enriched_step.schema.json
    │   ├── enriched_concept_card.schema.json
    │   └── enriched_visual_template.schema.json
    └── README.md                        [Documentación master]

                    ↓
            load_foundations()
                    ↓
      [Foundations cargados en memoria]
                    ↓
        ┌───────────┴───────────┐
        │  System Prompt Base   │ ← Inyecta policies
        └───────────┬───────────┘
                    ↓
          [OpenAI GPT-4o-mini]
                    ↓
    ┌───────────────┼───────────────┐
    │ Stage 1: Exercise Generation  │
    │ Stage 2: Hint Generation       │
    │ Stage 3: Feedback Generation   │
    │ Stage 4: Card Variants         │
    │ Stage 5: Visual Enrichment     │
    │ Stage 6: Metacognition         │
    └───────────────┬───────────────┘
                    ↓
        [Validate against schema]
                    ↓
       [Save to enriched_content]
                    ↓
    kuneo.module_steps.enriched_content (JSONB)
```

---

## 🔄 Pipeline Multi-Etapa (6 Stages)

### **Stage 1: Exercise Generation**

**Objetivo:** Generar contenido del ejercicio (prompt, opciones, respuesta correcta)

**Input:**
- `step`: step_number, cognitive_type, title, instruction
- `module`: subject, grade_range, core_concept
- `concept_card`: core_concept, one_line_definition, common_misconception
- `visual_template`: template_key, template_name

**Output:**
```json
{
  "prompt": "¿Cuántas partes del círculo están coloreadas?",
  "context": "María dividió un pastel en 4 partes iguales...",
  "options": [
    {"id": "A", "text": "1 de 4"},
    {"id": "B", "text": "4 de 1", "misconception": "confunde numerador con denominador"}
  ],
  "correct_answer": "A",
  "explanation": "Hay 1 parte coloreada de un total de 4 partes iguales.",
  "input_mode": "multiple_choice"
}
```

**Políticas aplicadas:**
- `pedagogical_principles` → Contextual learning
- `llm_enrichment_policy` → Generate exercise prompts, answer options
- `safety_and_quality` → Age-appropriate language

---

### **Stage 2: Hint Generation**

**Objetivo:** Generar hints progresivos (short → visual → worked example)

**Input:**
- `step`: cognitive_type, title
- `exercise`: prompt, options, correct_answer

**Output:**
```json
{
  "hint_level_1": "Cuenta primero cuántas partes hay en total.",
  "hint_level_2": "Luego cuenta solo las partes que están coloreadas.",
  "worked_example": "Si un círculo tiene 4 partes y 1 está coloreada, la fracción es 1/4.",
  "visual_hint": "fraction_part_whole with overlay highlighting 1 colored part"
}
```

**Políticas aplicadas:**
- `tuko_intervention_policy` → Intervention levels (1-4)
- `pedagogical_principles` → Reflection before answer
- `tuko_voice` → Max 35 words, guiding questions

---

### **Stage 3: Feedback Generation**

**Objetivo:** Generar feedback formativo (correct, incorrect, misconception-specific)

**Input:**
- `step`: cognitive_type
- `exercise`: prompt, options, correct_answer
- `hints`: hint_level_1, hint_level_2

**Output:**
```json
{
  "correct_feedback": "Correcto. Identificaste 1 parte coloreada de 4 en total.",
  "incorrect_feedback": "Revisa cuántas partes hay en total y cuántas están coloreadas.",
  "misconception_feedback": {
    "confunde_numerador_denominador": "El numerador (arriba) indica las partes coloreadas. El denominador (abajo) indica el total.",
    "no_cuenta_todas_las_partes": "Asegúrate de contar todas las partes del círculo."
  }
}
```

**Políticas aplicadas:**
- `feedback_policy` → Correct, incorrect, misconception feedback styles
- `pedagogical_principles` → Error as information
- `socioemotional_policy` → Non-punitive tone

---

### **Stage 4: Card Variants**

**Objetivo:** Generar variantes de concept_cards (hint, corrective, reflective)

**Input:**
- `step`: cognitive_type, title
- `module`: subject, grade_range, core_concept
- `base_concept_card`: Original card data
- `exercise`: Exercise generated in Stage 1

**Output:**
```json
{
  "hint_card": {
    "card_type": "hint",
    "content": "Observa cómo se divide el círculo en partes iguales.",
    "visual_template_key": "fraction_part_whole",
    "max_words": 50
  },
  "corrective_card": {
    "card_type": "corrective",
    "misconception": "confunde_numerador_denominador",
    "content": "El numerador (arriba) cuenta las partes coloreadas...",
    "visual_template_key": "fraction_part_whole"
  },
  "reflective_card": {
    "card_type": "reflective",
    "content": "¿Qué te ayudó a notar la diferencia entre numerador y denominador?",
    "prompt_type": "how_did_you_know"
  }
}
```

**Políticas aplicadas:**
- `tuko_intervention_policy` → Card types by cognitive step
- `pedagogical_principles` → One idea, one example, one visual
- `reflection_policy` → Question types for reflective cards

---

### **Stage 5: Visual Enrichment**

**Objetivo:** Enriquecer visual_template con labels, captions, overlays

**Input:**
- `step`: cognitive_type
- `visual_template`: template_key, template_name, visual_type, renderer, config
- `exercise`: Exercise generated in Stage 1

**Output:**
```json
{
  "caption": "Cada parte representa 1/4 del círculo completo.",
  "labels": {
    "title": "¿Qué fracción está coloreada?",
    "legend": [
      {"label": "Parte coloreada", "color": "#4CAF50"},
      {"label": "Parte no coloreada", "color": "#E0E0E0"}
    ]
  },
  "overlays": {
    "highlight": [
      {
        "element_id": "part_1",
        "reason": "Esta es la parte coloreada (numerador).",
        "color": "#FFD700"
      }
    ],
    "misconception": [
      {
        "element_id": "all_parts",
        "error_explanation": "Algunos suman todas las partes en lugar de contar las coloreadas.",
        "color": "#FF0000"
      }
    ]
  }
}
```

**Políticas aplicadas:**
- `llm_enrichment_policy` → Generate visual labels, overlays
- `safety_and_quality` → Caption max 200 chars
- **Preserva:** renderer, template_key (NO modificables)

---

### **Stage 6: Metacognition** (Solo para step 8)

**Objetivo:** Generar prompts metacognitivos para reflexión

**Input:**
- `step`: cognitive_type (debe ser "metacognicion"), title
- `module`: grade_range, core_concept
- `exercise`: Exercise generated in Stage 1

**Output:**
```json
{
  "reflection_prompt": "¿Cómo supiste identificar la fracción correcta?",
  "confidence_question": "¿Qué tan seguro te sientes con fracciones ahora?",
  "self_assessment_prompt": "¿Qué parte de fracciones entiendes mejor?",
  "question_type": "how_did_you_know",
  "grade_adapted": true
}
```

**Políticas aplicadas:**
- `reflection_policy` → Question types, grade adaptation
- `metacognition_rules` → 6 types of reflective questions
- `pedagogical_principles` → Reflection before answer

---

## 💾 Schema de Enriched Content

### Campos agregados a `kuneo.module_steps`:

```sql
-- Contenido enriquecido (JSONB)
enriched_content JSONB

-- Status del enriquecimiento
enrichment_status TEXT DEFAULT 'pending'
  -- pending: No enriquecido aún
  -- in_progress: En proceso de enriquecimiento
  -- completed: Enriquecimiento completado
  -- failed: Error durante enriquecimiento
  -- skipped: Intencionalmente no enriquecido

-- Timestamp del enriquecimiento
enriched_at TIMESTAMPTZ

-- Versión de pedagogical_foundations usada
enrichment_version TEXT DEFAULT '0.1'
```

### Estructura de `enriched_content`:

```json
{
  "exercise": {
    "prompt": "string",
    "context": "string (optional)",
    "options": [{"id": "A", "text": "string", "misconception": "string"}],
    "correct_answer": "string | array",
    "explanation": "string",
    "input_mode": "multiple_choice | open_text | numeric"
  },
  "hints": {
    "hint_level_1": "string (max 35 words)",
    "hint_level_2": "string (max 50 words)",
    "worked_example": "string (max 500 chars)",
    "visual_hint": "string (reference to visual_template_key)"
  },
  "feedback": {
    "correct_feedback": "string (max 20 words)",
    "incorrect_feedback": "string (max 25 words)",
    "misconception_feedback": {
      "misconception_key": "string (max 30 words)"
    },
    "partial_feedback": "string (optional)"
  },
  "concept_card_variants": {
    "hint_card": {...},
    "corrective_card": {...},
    "reflective_card": {...}
  },
  "visual_enrichment": {
    "caption": "string (max 200 chars)",
    "labels": {...},
    "overlays": {...}
  },
  "metacognition": {
    "reflection_prompt": "string",
    "confidence_question": "string",
    "self_assessment_prompt": "string"
  },
  "enriched_at": "ISO 8601 timestamp",
  "enrichment_version": "0.1"
}
```

---

## 🚀 Uso del Script

### **Instalación de dependencias:**

```powershell
pip install openai supabase python-dotenv jsonschema
```

### **Configuración (.env):**

```bash
# server/.env
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://zbcruqhuxfvcrntmospc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### **Ejecutar schema update (SOLO UNA VEZ):**

1. Ve a Supabase SQL Editor: https://app.supabase.com/project/zbcruqhuxfvcrntmospc/sql/new
2. Copia y ejecuta: `scripts/database/update_module_steps_enrichment.sql`
3. Verifica que los campos se agregaron: `SELECT * FROM kuneo.get_enrichment_stats();`

### **Comandos:**

```powershell
# Dry run: 10 steps de prueba (NO guarda en DB)
python scripts/openai_enrichment/enrich_module_steps.py --limit 10 --dry-run

# Enriquecer 10 steps reales de matemáticas
python scripts/openai_enrichment/enrich_module_steps.py --limit 10 --subject matematicas

# Enriquecer 1 módulo completo (8 steps) de grado 4-5
python scripts/openai_enrichment/enrich_module_steps.py --limit 8 --subject matematicas --grade-range "4-5"

# Enriquecer 50 steps de ciencias naturales
python scripts/openai_enrichment/enrich_module_steps.py --limit 50 --subject ciencias

# Enriquecer todos los pending de inglés
python scripts/openai_enrichment/enrich_module_steps.py --limit 285 --subject ingles
```

### **Argumentos:**

| Argumento | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `--limit` | int | 10 | Max número de steps a enriquecer |
| `--subject` | str | None | Filtrar por materia (matematicas, ciencias, sociales, lenguaje, ingles) |
| `--grade-range` | str | None | Filtrar por grado (4-5, 6-7, 8-9, 10-11) |
| `--dry-run` | flag | False | NO guardar en DB (para testing) |

---

## 📊 Fases de Enriquecimiento Recomendadas

### **Fase 1: Piloto (Validación Pedagógica)**

```powershell
# Dry run: 10 steps de prueba
python scripts/openai_enrichment/enrich_module_steps.py --limit 10 --dry-run
```

**Objetivo:** Validar que el contenido generado cumple con:
- Calidad pedagógica (foundations respetados)
- Edad-apropiado (lenguaje según grade_range)
- Culturalmente sensible (sin estereotipos)
- Factualmente correcto

**Acción:** Revisar manualmente los 10 steps generados. Ajustar foundations si es necesario.

---

### **Fase 2: Módulo Completo (Coherencia)**

```powershell
# 1 módulo completo (8 steps)
python scripts/openai_enrichment/enrich_module_steps.py --limit 8 --subject matematicas --grade-range "4-5"
```

**Objetivo:** Validar coherencia entre los 8 cognitive steps de un módulo:
- Progresión lógica (exploración → metacognición)
- Hints que no revelan respuestas demasiado pronto
- Feedback consistente a través de steps
- Concept cards que se complementan

**Acción:** Revisar 1 módulo completo paso a paso. Verificar que el flujo cognitivo tenga sentido.

---

### **Fase 3: Por Asignatura (Consistencia)**

```powershell
# 10 módulos de matemáticas (80 steps)
python scripts/openai_enrichment/enrich_module_steps.py --limit 80 --subject matematicas
```

**Objetivo:** Validar consistencia dentro de una materia:
- Vocabulario técnico consistente
- Misconceptions comunes identificadas correctamente
- Visual templates usados apropiadamente
- Contextos relevantes para la materia

**Acción:** Revisar muestreo de 10 módulos (80 steps) de la misma materia. Buscar inconsistencias.

---

### **Fase 4: Producción (Enriquecimiento Completo)**

```powershell
# Todos los módulos activos (11,408 steps)
# EJECUTAR POR LOTES, NO DE UNA VEZ

# Matemáticas: 291 módulos × 8 = 2,328 steps
python scripts/openai_enrichment/enrich_module_steps.py --limit 2328 --subject matematicas

# Ciencias: 395 módulos × 8 = 3,160 steps
python scripts/openai_enrichment/enrich_module_steps.py --limit 3160 --subject ciencias

# Sociales: 332 módulos × 8 = 2,656 steps
python scripts/openai_enrichment/enrich_module_steps.py --limit 2656 --subject sociales

# Lenguaje: 123 módulos × 8 = 984 steps
python scripts/openai_enrichment/enrich_module_steps.py --limit 984 --subject lenguaje

# Inglés: 285 módulos × 8 = 2,280 steps
python scripts/openai_enrichment/enrich_module_steps.py --limit 2280 --subject ingles
```

**Objetivo:** Enriquecimiento completo de toda la base de datos.

**Estimación de costos (GPT-4o-mini):**
- Promedio: ~1,500 tokens/step (input) + ~500 tokens/step (output) = 2,000 tokens/step
- 11,408 steps × 2,000 tokens = 22,816,000 tokens ≈ 23M tokens
- Costo GPT-4o-mini: $0.15/1M input + $0.60/1M output ≈ $5-10 USD total

**Acción:** Ejecutar por lotes. Monitorear errores con `get_enrichment_stats()`.

---

### **Fase 5: Variantes Adaptativas (Personalización)**

```powershell
# Generar variantes para steps ya enriquecidos
# TODO: Script por crear
python scripts/openai_enrichment/generate_adaptive_variants.py --limit 100
```

**Objetivo:** Crear variantes adaptativas:
- Variantes para niveles (simplificada, estándar, desafiante)
- Variantes por estilo de aprendizaje (visual, verbal, kinestésico)
- Variantes por contexto cultural (urbano, rural)

**Acción:** Post-producción. Generar variantes después de validar base.

---

## 🔍 Monitoreo y Validación

### **Ver estadísticas de enriquecimiento:**

```sql
-- Total por status
SELECT * FROM kuneo.get_enrichment_stats();

-- Dashboard completo (por materia, grado, cognitive_type)
SELECT * FROM kuneo.enrichment_dashboard
ORDER BY subject, grade_range, cognitive_type, enrichment_status;

-- Pasos pendientes de matemáticas grado 4-5
SELECT * FROM kuneo.get_pending_enrichments(10, 'matematicas', '4-5');
```

### **Reintentar enrichments fallidos:**

```sql
-- Ver cuántos fallaron
SELECT COUNT(*) FROM kuneo.module_steps WHERE enrichment_status = 'failed';

-- Ver errores
SELECT id, enriched_content->>'error' 
FROM kuneo.module_steps 
WHERE enrichment_status = 'failed';

-- Resetear para reintentar
SELECT kuneo.reset_failed_enrichments();
```

### **Ver contenido enriquecido:**

```sql
-- Ver un step enriquecido completo
SELECT 
    ms.id,
    ms.step_number,
    ms.cognitive_type,
    m.core_concept,
    ms.enriched_content,
    ms.enriched_at
FROM kuneo.module_steps ms
JOIN kuneo.modules m ON ms.module_id = m.id
WHERE ms.enrichment_status = 'completed'
LIMIT 1;

-- Ver solo exercise de steps enriquecidos
SELECT 
    ms.step_number,
    ms.cognitive_type,
    ms.enriched_content->'exercise'->>'prompt' AS prompt,
    ms.enriched_content->'exercise'->'options' AS options
FROM kuneo.module_steps ms
WHERE ms.enrichment_status = 'completed'
LIMIT 10;
```

---

## ⚠️ Principios de Calidad

### **Validación Automática (en el script):**

1. ✅ **Brevedad:** Prompts max 500 chars, hints max 35 words, feedback max 25 words
2. ✅ **Estructura:** JSON válido según schema
3. ✅ **Campos requeridos:** exercise, hints, feedback siempre presentes
4. ✅ **Preservación:** subject, grade_range, cognitive_type, core_concept NO cambian

### **Validación Manual (sampling):**

1. ✅ **Edad-apropiado:** Lenguaje match con grade_range
2. ✅ **Factual:** Contenido correcto según estándares MEN
3. ✅ **Cultural:** Sin estereotipos, contextos inclusivos
4. ✅ **Pedagógico:** Promueve razonamiento, no solo recall
5. ✅ **Tono:** Empático, formativo, nunca punitivo

### **Alertas (Requieren Revisión Humana):**

- Temas sensibles (historia, religión, género)
- Misconceptions que no coinciden con literatura pedagógica
- Feedback que suena punitivo o shaming
- Hints que revelan respuesta demasiado pronto
- Contextos culturalmente excluyentes

---

## 🎴 Enriquecimiento de Concept Cards

### **Objetivo**

Enriquecer las 44 concept_cards existentes SIN cambiar su identidad curricular, generando:
- Contenido refinado (definiciones, insights, ejemplos mejorados)
- 5 variantes de tarjeta (basic, hint, corrective, reflective, deepening)
- Patrones de error diagnósticables
- Reglas adaptativas de cuándo mostrar cada variante

### **Preserva (NO cambia):**
- ✅ `concept_key`
- ✅ `subject`
- ✅ `grade_range`
- ✅ `taxonomy_ids`
- ✅ `visual_template_key`
- ✅ `source_module_ids`

### **Genera (enriquece):**
- 🔧 Definiciones mejoradas (student-friendly)
- 🔧 Core insights pedagógicos
- 🔧 Ejemplos contextualizados
- 🔧 Misconceptions principales
- 🔧 5 variantes de tarjeta adaptativas
- 🔧 Patrones de error detectables
- 🔧 Reglas de intervención adaptativa

---

### **Arquitectura de 4 Stages**

```
concept_cards base
     ↓
Stage 1: Refine Base Card
     ↓
Stage 2: Generate Variants
     ↓
Stage 3: Generate Error Patterns
     ↓
Stage 4: Generate Adaptive Usage
     ↓
enriched_content (JSONB)
```

---

### **Stage 1: Refine Base Card**

**Objetivo:** Mejorar el contenido base del concept card

**Input:**
- `card`: concept_key, subject, grade_range, definition, visual_template_key
- `related_modules`: Módulos que usan este concepto
- `related_taxonomies`: Taxonomías vinculadas
- `visual_template`: Template visual asociado

**Output:**
```json
{
  "concept_name": "Fracciones Equivalentes",
  "one_line_definition": "Fracciones que representan la misma cantidad pero con números diferentes",
  "core_insight": "Dos fracciones son equivalentes si multiplicamos o dividimos numerador y denominador por el mismo número",
  "student_friendly_explanation": "Imagina dos pizzas iguales. Una cortada en 4 partes con 2 coloreadas (2/4). Otra cortada en 8 partes con 4 coloreadas (4/8). Ambas tienen la misma cantidad coloreada: ¡la mitad!",
  "practical_example": "María tiene 2/4 de pizza. Luis tiene 4/8 de pizza del mismo tamaño. ¿Quién tiene más? Ninguno, tienen la misma cantidad.",
  "common_misconception": "Pensar que 4/8 es más grande que 2/4 porque 4 y 8 son números más grandes",
  "misconception_explanation": "Los números más grandes no significan fracción más grande. Lo que importa es la relación entre numerador y denominador.",
  "hint_prompt": "Piensa: ¿qué relación hay entre 2 y 4? ¿Y entre 4 y 8?",
  "visual_caption": "Dos círculos del mismo tamaño: uno dividido en 4 partes con 2 coloreadas, otro en 8 partes con 4 coloreadas"
}
```

**Políticas aplicadas:**
- `pedagogical_principles` → ONE idea, ONE example, ONE visual
- `llm_enrichment_policy` → Refine definitions, generate examples
- `socioemotional_policy` → Age-appropriate, culturally inclusive

---

### **Stage 2: Generate Variants**

**Objetivo:** Crear 5 variantes de tarjeta para diferentes contextos de intervención

#### **Variante 1: basic_card**
Rescate cuando el estudiante está bloqueado.

```json
{
  "title": "¿Qué son fracciones equivalentes?",
  "body": "Son fracciones que representan la misma cantidad, aunque se escriban con números diferentes. Por ejemplo: 1/2 = 2/4 = 3/6",
  "example": "Si cortas una manzana en 2 partes y tomas 1, es lo mismo que si la cortas en 4 partes y tomas 2.",
  "tuko_line": "Recuerda: lo importante no es el tamaño de los números, sino qué parte del entero representan.",
  "when_to_show": ["stuck", "two_failed_attempts"],
  "visual_template_key": "fraction_equivalent_comparison"
}
```

#### **Variante 2: hint_card**
Guía sin revelar la respuesta.

```json
{
  "title": "Pista sobre fracciones equivalentes",
  "body": "Observa el numerador (arriba) y el denominador (abajo). ¿Qué pasa si multiplicas o divides ambos por el mismo número?",
  "example": "Si tienes 1/2 y multiplicas 1×2 y 2×2, obtienes 2/4. ¿Son equivalentes?",
  "tuko_line": "Piensa: ¿qué operación convierte un número en el otro?",
  "when_to_show": ["hint_requested", "one_failed_attempt"],
  "visual_template_key": "fraction_equivalent_comparison",
  "hint_level": 2,
  "does_not_reveal_answer": true
}
```

#### **Variante 3: corrective_card**
Corrige misconception específica (no punitiva).

```json
{
  "title": "Aclarando una confusión común",
  "body": "A veces pensamos que números más grandes significan fracción más grande. Pero no es así.",
  "misconception": "confunde_tamano_numeros_con_tamano_fraccion",
  "correction": "En fracciones, lo que importa es la RELACIÓN entre numerador y denominador, no el tamaño absoluto de los números. 4/8 no es mayor que 2/4 porque ambos representan 1/2.",
  "example": "Compara: 1/2 de una pizza grande vs 100/200 de la misma pizza. Son la misma cantidad, aunque 100 y 200 son números mucho más grandes.",
  "tuko_line": "No te dejes engañar por los números grandes. Mira la relación.",
  "when_to_show": ["misconception_detected"],
  "visual_template_key": "fraction_equivalent_comparison"
}
```

#### **Variante 4: reflective_card**
Profundiza después de éxito (metacognitiva).

```json
{
  "title": "Reflexionando sobre fracciones equivalentes",
  "body": "¡Lo lograste! Ahora piensa: ¿cómo supiste que estas fracciones eran equivalentes?",
  "reflection_prompt": "¿Qué estrategia usaste? ¿Visualizaste las partes? ¿Usaste operaciones?",
  "deepening_question": "¿Puedes encontrar otra fracción equivalente a 1/2? ¿Y otra más?",
  "tuko_line": "Pensar sobre cómo piensas te ayuda a aprender mejor.",
  "when_to_show": ["after_success", "metacognition_phase"],
  "visual_template_key": "fraction_equivalent_comparison"
}
```

#### **Variante 5: deepening_card (opcional)**
Conexión con otros conceptos (para avanzados).

```json
{
  "title": "Conectando con otros conceptos",
  "body": "Las fracciones equivalentes son como diferentes formas de escribir el mismo número. ¿Sabías que esto también pasa con los decimales?",
  "connection": "1/2 = 2/4 = 0.5 = 50%. Son todas formas de representar la mitad.",
  "transfer_question": "Si 1/3 y 2/6 son equivalentes, ¿qué decimal representan? ¿Y qué porcentaje?",
  "tuko_line": "Matemáticas es conectar ideas. ¿Qué otras conexiones ves?",
  "when_to_show": ["after_success", "high_performance"],
  "visual_template_key": "fraction_decimal_percent_equivalence"
}
```

**Políticas aplicadas:**
- `tuko_intervention_policy` → Intervention levels (minimal → rescue)
- `feedback_policy` → Non-punitive corrective feedback
- `reflection_policy` → Metacognitive prompts
- `pedagogical_principles` → Reflection before answer

---

### **Stage 3: Generate Error Patterns**

**Objetivo:** Identificar patrones de error detectables para diagnóstico automático

**Output:**
```json
{
  "patterns": [
    {
      "misconception_key": "confunde_numerador_denominador",
      "misconception_description": "Estudiante confunde cuál número va arriba (numerador) y cuál abajo (denominador)",
      "likely_wrong_answers": ["4/2 en lugar de 2/4", "8/4 en lugar de 4/8"],
      "diagnostic_clue": "Escribe la fracción al revés o invierte numerador y denominador en operaciones",
      "corrective_feedback": "Recuerda: el numerador (arriba) indica cuántas partes tienes. El denominador (abajo) indica en cuántas partes se dividió el entero.",
      "visual_overlay_key": "fraction_numerator_denominator_highlight",
      "recommended_card_variant": "corrective"
    },
    {
      "misconception_key": "suma_numeradores_y_denominadores",
      "misconception_description": "Suma numeradores y denominadores por separado sin considerar equivalencia",
      "likely_wrong_answers": ["1/2 + 1/2 = 2/4 (correcto por casualidad)", "1/3 + 1/2 = 2/5 (incorrecto)"],
      "diagnostic_clue": "En problemas de suma, suma numeradores entre sí y denominadores entre sí sin buscar común denominador",
      "corrective_feedback": "Para sumar fracciones, primero debemos tener el mismo denominador. No sumes numeradores y denominadores por separado.",
      "visual_overlay_key": "fraction_addition_common_denominator",
      "recommended_card_variant": "corrective"
    }
  ]
}
```

**Políticas aplicadas:**
- `assessment_policy` → Error as diagnostic information
- `feedback_policy` → Misconception-specific feedback
- `pedagogical_principles` → Error as learning opportunity

---

### **Stage 4: Generate Adaptive Usage**

**Objetivo:** Definir reglas de cuándo y cómo mostrar cada tarjeta

**Output:**
```json
{
  "show_when": [
    "stuck",
    "two_failed_attempts",
    "misconception_detected",
    "hint_requested",
    "after_success"
  ],
  "do_not_show_when": [
    "first_attempt",
    "student_is_typing",
    "correct_and_fast",
    "recently_shown_same_card",
    "during_assessment"
  ],
  "recommended_cognitive_types": [
    "representacion",
    "clasificacion",
    "analisis_de_error",
    "metacognicion"
  ],
  "recommended_step_types": [
    "exercise",
    "practice",
    "reflection"
  ],
  "intervention_level": "moderate",
  "cooldown_rules": {
    "min_minutes_between_shows": 5,
    "max_shows_per_session": 3
  }
}
```

**Políticas aplicadas:**
- `tuko_intervention_policy` → When to intervene
- `llm_enrichment_policy` → Cooldown policies
- `pedagogical_principles` → Student agency

---

### **💾 Schema de Enriched Content (Concept Cards)**

### Campos agregados a `kuneo.concept_cards`:

```sql
-- Contenido enriquecido (JSONB)
enriched_content JSONB

-- Status del enriquecimiento
enrichment_status TEXT DEFAULT 'pending'
  -- pending, in_progress, completed, failed, skipped

-- Timestamp del enriquecimiento
enriched_at TIMESTAMPTZ

-- Versión de pedagogical_foundations usada
enrichment_version TEXT DEFAULT '0.1'
```

### Estructura de `enriched_content`:

```json
{
  "version": "0.1",
  "source": "openai_enrichment",
  "refined": {
    "concept_name": "string",
    "one_line_definition": "string (10-200 chars)",
    "core_insight": "string (10-300 chars)",
    "student_friendly_explanation": "string (20-500 chars)",
    "practical_example": "string (20-400 chars)",
    "common_misconception": "string (max 300 chars)",
    "misconception_explanation": "string (max 400 chars)",
    "hint_prompt": "string (max 300 chars)",
    "visual_caption": "string (max 150 chars)"
  },
  "variants": {
    "basic": {
      "title": "string",
      "body": "string (max 500 chars)",
      "example": "string",
      "tuko_line": "string (max 200 chars)",
      "when_to_show": ["stuck", "two_failed_attempts"],
      "visual_template_key": "string"
    },
    "hint": {
      "title": "string",
      "body": "string",
      "hint_level": 2,
      "does_not_reveal_answer": true,
      "..."
    },
    "corrective": {
      "title": "string",
      "misconception": "string",
      "correction": "string (max 400 chars)",
      "..."
    },
    "reflective": {
      "title": "string",
      "reflection_prompt": "string (max 250 chars)",
      "deepening_question": "string",
      "..."
    },
    "deepening": {
      "title": "string",
      "connection": "string",
      "transfer_question": "string",
      "..."
    }
  },
  "error_patterns": {
    "patterns": [
      {
        "misconception_key": "string",
        "diagnostic_clue": "string",
        "corrective_feedback": "string",
        "visual_overlay_key": "string",
        "recommended_card_variant": "corrective"
      }
    ]
  },
  "adaptive_usage": {
    "show_when": ["array of conditions"],
    "do_not_show_when": ["array of conditions"],
    "recommended_cognitive_types": ["array"],
    "intervention_level": "minimal | moderate | intensive | rescue",
    "cooldown_rules": {
      "min_minutes_between_shows": 5,
      "max_shows_per_session": 3
    }
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "enriched_at": "ISO 8601 timestamp"
  }
}
```

---

### **🚀 Uso del Script (Concept Cards)**

### **Instalación (si aún no instalaste):**

```powershell
pip install openai supabase python-dotenv jsonschema
```

### **Ejecutar schema update (SOLO UNA VEZ):**

1. Ve a Supabase SQL Editor
2. Copia y ejecuta: `scripts/database/update_concept_cards_enrichment.sql`
3. Verifica: `SELECT * FROM kuneo.get_card_enrichment_stats();`

### **Comandos:**

```powershell
# Dry run: 5 cards de prueba (NO guarda en DB)
python scripts/openai_enrichment/enrich_concept_cards.py --limit 5 --dry-run

# Enriquecer 5 cards reales de matemáticas
python scripts/openai_enrichment/enrich_concept_cards.py --limit 5 --subject matematicas

# Enriquecer cards de grado específico
python scripts/openai_enrichment/enrich_concept_cards.py --limit 10 --grade-range "4-5"

# Enriquecer todas las 44 cards
python scripts/openai_enrichment/enrich_concept_cards.py --limit 44
```

### **Argumentos:**

| Argumento | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `--limit` | int | 5 | Max número de cards a enriquecer |
| `--subject` | str | None | Filtrar por materia (matematicas, ciencias, sociales, lenguaje, ingles) |
| `--grade-range` | str | None | Filtrar por grado (4-5, 6-7, 8-9, 10-11) |
| `--dry-run` | flag | False | NO guardar en DB (para testing) |

---

### **📊 Fases de Enriquecimiento Recomendadas (Concept Cards)**

#### **Fase 1: Validación Multi-Subject (5 cards)**

```powershell
# Dry run: 5 cards de diferentes asignaturas
python scripts/openai_enrichment/enrich_concept_cards.py --limit 5 --dry-run
```

**Objetivo:** Validar calidad pedagógica de variantes en diferentes subjects.

**Criterios de éxito:**
- ✅ Las 5 variantes (basic, hint, corrective, reflective, deepening) son pedagógicamente apropiadas
- ✅ El contenido refinado mejora la definición base sin cambiar concept_key
- ✅ Los error_patterns son detectables y realistas
- ✅ Las reglas adaptativas tienen sentido por cognitive_type

---

#### **Fase 2: Piloto (5 cards reales)**

```powershell
# 5 cards de distintas asignaturas
python scripts/openai_enrichment/enrich_concept_cards.py --limit 5
```

**Objetivo:** Validar que el guardado funciona y la estructura es correcta.

**Validación:**
```sql
-- Ver cards enriquecidas
SELECT concept_key, enrichment_status, enriched_at 
FROM kuneo.concept_cards 
WHERE enrichment_status = 'completed';

-- Ver contenido de una card
SELECT enriched_content 
FROM kuneo.concept_cards 
WHERE concept_key = 'fracciones_equivalentes';
```

---

#### **Fase 3: Producción (44 cards)**

```powershell
# Enriquecer todas las concept_cards
python scripts/openai_enrichment/enrich_concept_cards.py --limit 44
```

**Objetivo:** Enriquecer todo el catálogo de concept_cards.

**Resultado esperado:**
- 44 concept_cards enriquecidas
- ~220 variantes funcionales (44 × 5 variantes por card)
- Todas con error_patterns y adaptive_usage
- Listas para usar en runtime adaptativo

---

## 📚 Próximos Pasos

1. ✅ **module_steps enrichment** - Script completado, 98/11,408 steps enriquecidos (Fase 1-3 validadas)
2. ✅ **concept_cards enrichment** - Script completado, listo para Fase 1 (validación multi-subject)
3. ⏳ **visual_templates enrichment** - Enriquecer overlays, animations, labels
4. ⏳ **Adaptive engine** - Usar enriched_content para adaptar runtime
5. ⏳ **Frontend integration** - Renderizar enriched_content en UI
6. ⏳ **Analytics** - Medir efectividad pedagógica de contenido enriquecido

---

**🎓 "Del currículo fijo al contenido adaptativo: inteligencia artificial al servicio de la pedagogía"**
