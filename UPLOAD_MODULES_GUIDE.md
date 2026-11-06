# 🚀 Guía de Carga de Módulos a Supabase

## ✅ Prerrequisitos

- [x] Módulos generados en `data/processed/modules/all_modules.json` (1,426 módulos)
- [x] Tablas del module system creadas (`module_steps`, `concept_cards`, etc.)
- [ ] Tabla `modules` actualizada con nueva estructura

---

## 📋 Paso 1: Actualizar Tabla Modules en Supabase

La tabla `modules` existente tiene una estructura antigua que no coincide con los módulos generados. Necesitas actualizarla.

### Ejecutar en Supabase SQL Editor:

1. Ve a: https://app.supabase.com/project/zbcruqhuxfvcrntmospc/sql/new
2. Copia todo el contenido de: `scripts/database/update_modules_table.sql`
3. Ejecuta el script

### ¿Qué hace este script?

- Renombra la tabla antigua `modules` a `modules_old` (backup)
- Crea nueva tabla `modules` con estructura optimizada:
  - Campos: `id`, `source_unit_id`, `source`, `subject`, `grade_range`, `difficulty`, `title`, `learning_objective`, `context`, `core_concept`, `content` (JSONB)
  - Índices optimizados para búsqueda
  - RLS policies configuradas
  - 3 funciones útiles:
    - `search_modules_by_concept(concept)`
    - `get_modules_by_subject_grade(subject, grade_range)`
    - `count_modules_by_subject()`

---

## 📋 Paso 2: Cargar Módulos a Supabase

Una vez actualizada la tabla, ejecuta el script de carga:

```powershell
cd "d:\USER EAT\ANGEL MOTTA\Ángel Motta\kuneo"
python scripts/database/upload_modules_to_supabase.py
```

### ¿Qué hace el script?

1. Lee `data/processed/modules/all_modules.json`
2. Transforma cada módulo al formato de la tabla
3. Sube en lotes de 100 a `kuneo.modules`
4. Valida la carga (cuenta por materia)

### Resultado Esperado:

```
============================================================
🚀 KUNEO MODULE UPLOADER
============================================================

📂 Leyendo módulos desde: D:\...\all_modules.json
✅ 1426 módulos cargados

🔄 Subiendo 1426 módulos en lotes de 100...
   ✓ Lote 1/15: 100 módulos subidos (100/1426)
   ✓ Lote 2/15: 100 módulos subidos (200/1426)
   ...
   ✓ Lote 15/15: 26 módulos subidos (1426/1426)

============================================================
📊 RESUMEN DE CARGA
============================================================
✅ Subidos exitosamente: 1426

🔍 Validando datos subidos...

✅ Total de módulos en Supabase: 1426

📚 Por materia:
   english: 285 módulos
   language: 123 módulos
   mathematics: 291 módulos
   natural_sciences: 395 módulos
   social_studies: 332 módulos

============================================================
✅ CARGA COMPLETADA
============================================================

💾 Módulos disponibles en: kuneo.modules
```

---

## 🔍 Paso 3: Verificar en Supabase

### En Supabase Table Editor:

1. Ve a: https://app.supabase.com/project/zbcruqhuxfvcrntmospc/editor
2. Selecciona: `kuneo` schema → `modules` table
3. Deberías ver 1,426 registros

### Consultas de Verificación:

```sql
-- Total de módulos
SELECT COUNT(*) FROM kuneo.modules;

-- Por materia
SELECT * FROM kuneo.count_modules_by_subject();

-- Ver un módulo completo
SELECT * FROM kuneo.modules LIMIT 1;

-- Buscar módulos de fracciones
SELECT * FROM kuneo.search_modules_by_concept('fracciones');

-- Módulos de matemáticas grado 4-5
SELECT * FROM kuneo.get_modules_by_subject_grade('mathematics', '4-5');
```

---

## 📊 Estructura de un Módulo en DB

```json
{
  "id": "uuid",
  "source_unit_id": "uuid",
  "source": "dba",
  "subject": "mathematics",
  "grade_range": "4-5",
  "difficulty": 2,
  "title": "¿Cómo entender fracciones?",
  "learning_objective": "Interpreto las fracciones en diferentes contextos...",
  "context": "Vamos a explorar fracciones...",
  "core_concept": "fracciones",
  "is_active": true,
  "order_index": 0,
  "content": {
    "concepts": ["fracciones"],
    "cognitive_type": "representational_thinking",
    "skills": ["identificar", "explicar"],
    "diagnostic": { ... },
    "phases": [ ... ],
    "guided_exercises": [ ... ],
    "error_map": { ... },
    "hints": [ ... ],
    "reflection_prompts": [ ... ],
    "evaluation": { ... },
    "visual_triggers": [ ... ],
    "metadata": { ... }
  },
  "created_at": "2026-05-12T...",
  "updated_at": "2026-05-12T..."
}
```

---

## ⚠️ Notas Importantes

### Sobre la Tabla Antigua

Si tienes datos importantes en `modules_old`, puedes:
- Migrarlos manualmente
- O simplemente eliminar la tabla: `DROP TABLE kuneo.modules_old;`

### Sobre los Subjects

Los módulos usan nombres en **inglés**:
- `mathematics` (no "matematicas")
- `natural_sciences` (no "ciencias")
- `social_studies` (no "sociales")
- `language` (no "lenguaje")
- `english` (no "ingles")

Si necesitas mapear al enum español del schema original, podríamos crear una función de mapeo.

### Sobre grade_range

Los módulos usan **texto** para grade_range:
- `"4-5"` (rango)
- `"7"` (grado individual)
- `"1-3"`, `"6-7"`, `"8-9"`, `"10-11"`

No es un entero como en el schema antiguo.

---

## 🚀 Próximos Pasos

Una vez cargados los módulos:

1. ✅ **Integrar con el backend** - COMPLETADO
   - Router: `server/modules.js`
   - 6 endpoints funcionales (modules, search, by-id, taxonomies, subjects, by-subject)
   - Probados exitosamente

2. ✅ **Vincular con taxonomías** - COMPLETADO
   - Tabla: `kuneo.module_taxonomy_link`
   - 11,154 links generados
   - 100% módulos vinculados, 32% taxonomías vinculadas (cobertura esperada)
   - 0 casos de cross-contamination

3. ✅ **Poblar concept_cards** - COMPLETADO
   - **44 tarjetas conceptuales** generadas desde 1,426 módulos
   - Extracción multi-fuente (error_map, hints, examples, taxonomies)
   - 100% con misconception, hint y visual sugerido
   - 81.8% con ejemplo práctico
   - Documentación: [CONCEPT_CARDS_SYSTEM.md](CONCEPT_CARDS_SYSTEM.md)

4. ✅ **Poblar visual_templates** - COMPLETADO
   - **23 plantillas visuales** renderizables generadas
   - Sistema de configs JSONB parametrizables (NO imágenes estáticas)
   - Clasificación inteligente: 5 visual_types, 6 renderers, 4 interaction_levels
   - 100% vinculación con concept_cards (0 tarjetas huérfanas)
   - Documentación: [VISUAL_TEMPLATES_SYSTEM.md](VISUAL_TEMPLATES_SYSTEM.md)
   - Renderers: svg_custom (10), react_flow (5), recharts (4), concept_map (2), mermaid (1), timeline (1)

5. ✅ **Poblar module_steps** - COMPLETADO
   - **11,408 pasos ejecutables** generados (1,426 módulos × 8 steps)
   - **8 dimensiones cognitivas:** exploración, representación, razonamiento, clasificación, aplicación guiada, transferencia, análisis de error, metacognición
   - Sistema de políticas adaptativas: hint_policy, feedback_policy, next_step_logic
   - 100% vinculación con concept_cards y visual_templates
   - Documentación: [MODULE_STEPS_SYSTEM.md](MODULE_STEPS_SYSTEM.md)
   - Distribución perfecta: 1,426 steps por dimensión cognitiva
   - Tiempo promedio por módulo: ~21 minutos (1,260 segundos)

6. ✅ **Pedagogical Foundations (Cerebro Pedagógico)** - COMPLETADO
   - **16 archivos de fundamentos pedagógicos** creados en `pedagogical_foundations/`
   - **7 políticas JSON:** pedagogical_principles, llm_enrichment_policy, tuko_intervention_policy, feedback_policy, reflection_policy, socioemotional_policy, assessment_policy
   - **5 prompt blocks MD:** system_pedagogy, feedback_rules, tuko_voice, metacognition_rules, safety_and_quality
   - **3 JSON schemas:** enriched_step.schema.json, enriched_concept_card.schema.json, enriched_visual_template.schema.json
   - **Documentación master:** README.md con guía de uso completa
   - **Principio fundamental:** "El LLM NO decide currículo. El LLM NO decide arquitectura. El LLM NO decide progresión. El LLM: llena, contextualiza, adapta, enriquece."
   - Documentación: [pedagogical_foundations/README.md](pedagogical_foundations/README.md)

7. ✅ **Schema de Enrichment para module_steps** - COMPLETADO
   - Nuevos campos agregados a `kuneo.module_steps`:
     - `enriched_content` (JSONB): Contenido enriquecido por OpenAI
     - `enrichment_status` (TEXT): pending | in_progress | completed | failed | skipped
     - `enriched_at` (TIMESTAMPTZ): Timestamp de enriquecimiento
     - `enrichment_version` (TEXT): Versión de pedagogical_foundations usada (ej: "0.1")
   - **Funciones helper:**
     - `get_pending_enrichments(limit, subject, grade_range)`: Obtener steps pendientes
     - `get_enrichment_stats()`: Estadísticas de enriquecimiento
     - `reset_failed_enrichments()`: Reintentar enrichments fallidos
   - **Vista dashboard:** `enrichment_dashboard` para monitorear progreso
   - Script: [scripts/database/update_module_steps_enrichment.sql](scripts/database/update_module_steps_enrichment.sql)

8. ⏳ **Enriquecimiento con OpenAI (Multi-Etapa)** - EN PROGRESO
   - **Script:** [scripts/openai_enrichment/enrich_module_steps.py](scripts/openai_enrichment/enrich_module_steps.py)
   - **Arquitectura multi-etapa (6 stages):**
     1. **Exercise Generation:** Generar prompt, opciones, respuesta correcta, distractores por misconceptions
     2. **Hint Generation:** Generar hints progresivos (short_hint → visual_hint → worked_example)
     3. **Feedback Generation:** Generar feedback formativo (correct, incorrect, misconception-specific)
     4. **Card Variants:** Generar variantes de concept_cards (hint, corrective, reflective)
     5. **Visual Enrichment:** Enriquecer visual_templates con labels, captions, overlays
     6. **Metacognition:** Generar prompts metacognitivos (solo para step 8)
   - **Uso:**
     ```powershell
     # Ejecutar schema update primero
     # En Supabase SQL Editor: scripts/database/update_module_steps_enrichment.sql
     
     # Dry run (10 steps de prueba, no guarda)
     python scripts/openai_enrichment/enrich_module_steps.py --limit 10 --dry-run
     
     # Enriquecer 10 steps reales de matemáticas
     python scripts/openai_enrichment/enrich_module_steps.py --limit 10 --subject matematicas
     
     # Enriquecer 1 módulo completo (8 steps)
     python scripts/openai_enrichment/enrich_module_steps.py --limit 8 --subject matematicas --grade-range "4-5"
     ```
   - **Fases recomendadas de enriquecimiento:**
     - **Fase 1 (Piloto):** 10 steps de prueba con --dry-run → validar calidad pedagógica
     - **Fase 2 (Módulo):** 1 módulo completo (8 steps) → validar coherencia entre steps
     - **Fase 3 (Materia):** 10 módulos por asignatura → validar consistencia por subject
     - **Fase 4 (Producción):** Todos los módulos activos → enriquecimiento completo
     - **Fase 5 (Variantes):** Generar variantes adaptativas extras → personalización
   - **IMPORTANTE:** NO enriquecer los 11,408 steps de una sola vez. Validar calidad antes de escalar.

9. ✅ **Enriquecimiento de Concept Cards (4 Stages)** - COMPLETO
   - **Script:** [scripts/openai_enrichment/enrich_concept_cards.py](scripts/openai_enrichment/enrich_concept_cards.py)
   - **Schema:** [pedagogical_foundations/schemas/enriched_concept_card.schema.json](pedagogical_foundations/schemas/enriched_concept_card.schema.json)
   - **SQL Migration:** [scripts/database/update_concept_cards_enrichment.sql](scripts/database/update_concept_cards_enrichment.sql)
   - **Objetivo:** Enriquecer concept_cards SIN cambiar identidad curricular
     - **Preserva:** `concept_key`, `subject`, `grade_range`, `taxonomy_ids`, `visual_template_key`, `source_module_ids`
     - **Genera:** Contenido refinado, variantes de tarjetas, patrones de error, reglas adaptativas
   - **Arquitectura de 4 stages:**
     1. **Refine Base Card:** Mejorar definición, extraer core_insight, generar ejemplo contextualizado, identificar misconception principal
     2. **Generate Variants:** Crear 5 variantes de tarjeta:
        - `basic`: Tarjeta de rescate cuando el estudiante está bloqueado
        - `hint`: Guía sin revelar respuesta
        - `corrective`: Corrige misconception específica (no punitiva)
        - `reflective`: Profundiza después de éxito (metacognitiva)
        - `deepening`: Conexión con otros conceptos (opcional, para avanzados)
     3. **Generate Error Patterns:** Identificar respuestas incorrectas típicas, clues de diagnóstico, feedback correctivo, visual overlays
     4. **Generate Adaptive Usage:** Reglas de cuándo mostrar/no mostrar, cognitive_types recomendados, nivel de intervención, cooldown rules
   - **Campos agregados a `concept_cards`:**
     - `enriched_content` (JSONB): Contiene refined, variants, error_patterns, adaptive_usage
     - `enrichment_status` (TEXT): pending, in_progress, completed, failed, skipped
     - `enriched_at` (TIMESTAMPTZ): Timestamp de enriquecimiento
     - `enrichment_version` (TEXT): Versión de pedagogical_foundations (ej: "0.1")
   - **Funciones helper:**
     - `get_pending_card_enrichments(limit, subject, grade_range)`: Obtener cards pendientes
     - `get_card_enrichment_stats()`: Estadísticas de enriquecimiento
     - `reset_failed_card_enrichments()`: Reintentar enrichments fallidos
   - **Vista dashboard:** `card_enrichment_dashboard` para monitorear progreso
   - **Uso:**
     ```powershell
     # Ejecutar schema update primero
     # En Supabase SQL Editor: scripts/database/update_concept_cards_enrichment.sql
     
     # Dry run (5 cards de prueba, no guarda)
     python scripts/openai_enrichment/enrich_concept_cards.py --limit 5 --dry-run
     
     # Enriquecer 5 cards reales de matemáticas
     python scripts/openai_enrichment/enrich_concept_cards.py --limit 5 --subject matematicas
     
     # Enriquecer cards de grado específico
     python scripts/openai_enrichment/enrich_concept_cards.py --limit 10 --grade-range "4-5"
     
     # Enriquecer todas las 44 cards
     python scripts/openai_enrichment/enrich_concept_cards.py --limit 44
     ```
   - **Fases recomendadas de enriquecimiento:**
     - **Fase 1 (Validación Multi-Subject):** 5 cards de diferentes asignaturas con --dry-run → validar calidad pedagógica y variantes
     - **Fase 2 (Piloto):** 5 cards reales de diferentes asignaturas → validar guardado y estructura
     - **Fase 3 (Producción):** Todas las 44 cards → enriquecimiento completo
   - **Estructura de `enriched_content`:**
     ```json
     {
       "version": "0.1",
       "source": "openai_enrichment",
       "refined": {
         "concept_name": "...",
         "one_line_definition": "...",
         "core_insight": "...",
         "student_friendly_explanation": "...",
         "practical_example": "...",
         "common_misconception": "...",
         "hint_prompt": "...",
         "visual_caption": "..."
       },
       "variants": {
         "basic": { "title": "...", "body": "...", "example": "...", "tuko_line": "...", "when_to_show": [] },
         "hint": { "does_not_reveal_answer": true, ... },
         "corrective": { "misconception": "...", "correction": "...", ... },
         "reflective": { "reflection_prompt": "...", ... },
         "deepening": { "connection": "...", "transfer_question": "...", ... }
       },
       "error_patterns": {
         "patterns": [
           {
             "misconception_key": "...",
             "diagnostic_clue": "...",
             "corrective_feedback": "...",
             "visual_overlay_key": "...",
             "recommended_card_variant": "corrective"
           }
         ]
       },
       "adaptive_usage": {
         "show_when": ["stuck", "two_failed_attempts", ...],
         "do_not_show_when": ["first_attempt", "correct_and_fast", ...],
         "recommended_cognitive_types": ["representacion", "analisis_de_error", ...],
         "intervention_level": "moderate",
         "cooldown_rules": { "min_minutes_between_shows": 5, "max_shows_per_session": 3 }
       },
       "metadata": {
         "model": "gpt-4o-mini",
         "enriched_at": "2026-05-15T..."
       }
     }
     ```
   - **IMPORTANTE:** 
     - Las 44 concept_cards pueden generar ~220 variantes funcionales (44 × 5 variantes)
     - Las variantes se guardan en `enriched_content` como JSONB (no se crean 220 filas nuevas)
     - El runtime adaptativo selecciona qué variante mostrar según contexto
     - Cada card conserva su identidad curricular (concept_key, subject, grade_range)

10. 🚧 **Enriquecimiento de Visual Templates (6 Stages)** - EN PROGRESO
   - **Script:** [scripts/openai_enrichment/enrich_visual_templates.py](scripts/openai_enrichment/enrich_visual_templates.py)
   - **Schema:** [pedagogical_foundations/schemas/visual_enriched_config.schema.json](pedagogical_foundations/schemas/visual_enriched_config.schema.json)
   - **SQL Migration:** [scripts/database/update_visual_templates_enrichment.sql](scripts/database/update_visual_templates_enrichment.sql)
   - **Objetivo:** Enriquecer visual_templates SIN cambiar su estructura técnica base
     - **Preserva:** `template_key`, `renderer`, `visual_type`, `subject`, estructura base del `config`
     - **Genera:** Captions pedagógicos, labels claros, overlays para misconceptions, animaciones, reglas de interacción, texto de accesibilidad
   - **Arquitectura de 6 stages:**
     1. **Enrich Base Visual:** Generar caption, main_question, student_focus, labels, accessibility_text
     2. **Generate Misconception Overlays:** Crear overlays (explanation/misconception/hint/corrective) con visual_actions (highlight, dim, compare, annotate, isolate, connect, zoom)
     3. **Generate Animation Steps:** Crear secuencia de animación pedagógica (show → highlight → compare → reveal), pasos cortos y calmados (300-900ms)
     4. **Generate Interaction Rules:** Generar reglas de interacción apropiadas para el renderer (svg_custom: hover/click/drag, recharts: hover datapoint, react_flow: expand node, etc.)
     5. **Validate Output:** Verificar que preserva template_key/renderer/visual_type y tiene todas las secciones requeridas
     6. **Save to Supabase:** Actualizar `enriched_config`, `enrichment_status='completed'`, `enriched_at` timestamp
   - **Campos agregados a `visual_templates`:**
     - `enriched_config` (JSONB): Contiene pedagogical_visual, labels, overlays, animation_steps, interaction_rules, usage_by_card_type
     - `enrichment_status` (TEXT): pending, in_progress, completed, failed, skipped
     - `enriched_at` (TIMESTAMPTZ): Timestamp de enriquecimiento
     - `enrichment_version` (TEXT): Versión de pedagogical_foundations (ej: "0.1")
   - **Funciones helper:**
     - `get_pending_visual_enrichments(limit, visual_type, renderer)`: Obtener templates pendientes
     - `get_visual_enrichment_stats()`: Estadísticas de enriquecimiento
     - `reset_failed_visual_enrichments()`: Reintentar enrichments fallidos
   - **Vista dashboard:** `visual_enrichment_dashboard` para monitorear progreso
   - **Uso:**
     ```powershell
     # Ejecutar SQL migration primero
     # En Supabase SQL Editor: scripts/database/update_visual_templates_enrichment.sql
     
     # Dry run (5 templates de prueba, no guarda)
     python scripts/openai_enrichment/enrich_visual_templates.py --limit 5 --dry-run
     
     # Enriquecer 5 templates reales tipo svg_custom
     python scripts/openai_enrichment/enrich_visual_templates.py --limit 5 --renderer svg_custom
     
     # Enriquecer templates de visual_type específico
     python scripts/openai_enrichment/enrich_visual_templates.py --limit 10 --visual-type math_visual
     
     # Enriquecer todos los 23 templates
     python scripts/openai_enrichment/enrich_visual_templates.py --limit 23
     ```
   - **Fases recomendadas de enriquecimiento:**
     - **Fase 1 (Dry-run):** 5 templates de diferentes renderers con --dry-run → validar calidad pedagógica visual
     - **Fase 2 (Piloto):** 5 templates reales de diferentes renderers → validar guardado y overlays
     - **Fase 3 (Producción):** Los 23 templates restantes → enriquecimiento completo
   - **Estructura de `enriched_config`:**
     ```json
     {
       "version": "0.1",
       "source": "openai_enrichment",
       "pedagogical_visual": {
         "caption": "Main pedagogical caption explaining what to observe",
         "main_question": "Guiding question to focus student attention",
         "student_focus": "What the student should look at first",
         "accessibility_text": "Text description for screen readers"
       },
       "labels": {
         "title": "Visual title",
         "elements": [
           { "element_id": "...", "label": "...", "purpose": "..." }
         ],
         "legend": [
           { "symbol": "color/shape", "meaning": "what it represents" }
         ]
       },
       "overlays": {
         "explanation": [
           { "overlay_id": "...", "target": "...", "visual_action": "highlight", "message": "...", "position": "top" }
         ],
         "misconception": [
           { "misconception_key": "...", "target": "...", "visual_action": "compare", "message": "...", "card_variant": "corrective" }
         ],
         "hint": [ /* overlays for hints */ ],
         "corrective": [ /* overlays for corrective feedback */ ]
       },
       "animation_steps": [
         { "step": 1, "action": "show", "target": "...", "caption": "...", "duration_ms": 500, "delay_ms": 0 },
         { "step": 2, "action": "highlight", "target": "...", "caption": "...", "duration_ms": 400, "delay_ms": 200 }
       ],
       "interaction_rules": {
         "hover": [
           { "target": "element_id", "action": "show tooltip", "feedback": "..." }
         ],
         "click": [ /* click interaction rules */ ],
         "drag": [ /* drag interaction rules */ ],
         "fallback_static": "Message when interactions unavailable"
       },
       "usage_by_card_type": {
         "basic": {
           "recommended_overlays": ["overlay_1", "overlay_2"],
           "recommended_animations": [1, 2, 3],
           "emphasis": "What to emphasize for basic cards",
           "interaction_level": "passive"
         },
         "hint": { /* hint card usage */ },
         "corrective": { /* corrective card usage */ },
         "reflective": { /* reflective card usage */ },
         "deepening": { /* deepening card usage */ }
       },
       "metadata": {
         "model": "gpt-4o-mini",
         "enriched_at": "2026-05-15T...",
         "template_key": "...",
         "renderer": "...",
         "visual_type": "..."
       }
     }
     ```
   - **IMPORTANTE:**
     - Los 23 visual_templates se convierten en visuales pedagógicos ricos con overlays, animaciones e interacciones
     - Los overlays se generan por misconception_key para guiar correcciones visuales
     - Las animaciones son micro-secuencias (3-7 pasos, 300-900ms cada uno) para revelar complejidad gradualmente
     - Las interaction_rules se adaptan al renderer (svg_custom tiene más interacciones que mermaid)
     - El runtime del Visual Engine decide qué overlay/animación mostrar según error detectado, card_type y cognitive_type
   - **ESTADO ACTUAL:** 
     - ✅ SQL migration creada (197 líneas)
     - ✅ JSON Schema creada (400+ líneas)
     - ✅ Script Python creado con pipeline de 6 stages
     - ⏳ Falta ejecutar SQL en Supabase
     - ⏳ Falta ejecutar dry-run y validar output
     - ⏳ Falta ejecutar piloto y producción

---

## 🆘 Troubleshooting

### Error: "relation 'kuneo.modules' already exists"

La tabla ya existe. Dos opciones:
1. Eliminarla primero: `DROP TABLE kuneo.modules CASCADE;`
2. Modificar el script para usar `ALTER TABLE` en lugar de `CREATE TABLE`

### Error: "permission denied for schema kuneo"

Asegúrate de ejecutar el SQL como `postgres` o `service_role`, no como usuario autenticado.

### Error: "violates check constraint"

Verifica que:
- `difficulty` esté entre 1 y 5
- `source` sea "dba" o "standard"
- Todos los campos requeridos existan

### Los conceptos siguen incorrectos

Si después de regenerar los módulos aún ves conceptos incorrectos (ej: "reading" en matemáticas):
1. Revisa el normalizador universal: `scripts/parsers/universal_normalizer.py`
2. Ajusta el enriquecimiento de ontología cruzada
3. Regenera competency_units
4. Regenera módulos

---

**🎓 "De la generación a la base de datos: módulos listos para enseñar"**
