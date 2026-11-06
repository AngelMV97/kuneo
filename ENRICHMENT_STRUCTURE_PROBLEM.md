# 🚨 PROBLEMA: Estructura de enriched_content Incompatible

## 📊 ANÁLISIS

**Situación encontrada:**
- ✅ 101 steps tienen `enriched_content` (campo existe, ~3,500 bytes cada uno)
- ❌ Pero la estructura NO es compatible con Adaptive Engine MVP
- ❌ Faltan campos críticos: `expected_answer`, `step_config`, `cognitive_dimension`

**Query 5 - Checklist muestra:**
```
| has_enriched | has_expected_answer | has_step_config | dimension |
| ✓            | ✗                   | ✗               | null      |
```

---

## 🔍 COMPARACIÓN DE ESTRUCTURAS

### Estructura ACTUAL (antigua, incompatible):
```json
{
  "hints": {
    "hints": {
      "visual_hint": "...",
      "hint_level_1": "...",
      "hint_level_2": "...",
      "worked_example": "..."
    }
  },
  "exercise": {
    "prompt": "...",
    "options": [],
    "input_mode": "multiple_choice",
    "explanation": "...",
    "correct_answer": "0"
  },
  "feedback": {
    "correct_feedback": "...",
    "partial_feedback": "...",
    "incorrect_feedback": "...",
    "misconception_feedback": "..."
  },
  "visual_enrichment": {...},
  "concept_card_variants": {...},
  "enrichment_version": "0.1",
  "enriched_at": "2026-05-15T22:51:13.977970"
}
```

### Estructura REQUERIDA (Adaptive Engine MVP):
```json
{
  "cognitive_dimension": "comprension",
  "expected_answer": {
    "type": "option",
    "correct_options": [0],
    "evaluation_strategy": null,
    "misconceptions": [
      {
        "pattern": "^1$",
        "misconception_key": "confunde_numerador_denominador",
        "card_key": "card_fraccion_partes",
        "severity": "medium",
        "common_among_grade": "8-9"
      }
    ]
  },
  "step_config": {
    "expected_time": 90,
    "difficulty_indicator": "medium",
    "hints": [
      "Piensa en cuántas partes están cubiertas",
      "El numerador representa las partes cubiertas",
      "El denominador representa el total de partes"
    ],
    "hint_card_key": "card_fraccion_intro",
    "concept_card_key": "card_fraccion_parte_todo",
    "visual_template_key": "fraction_part_whole",
    "reflection_prompts": []
  },
  "taxonomy_links": {
    "microtopics": [],
    "competencies": []
  }
}
```

---

## 🎯 SOLUCIÓN

### Plan de Re-enrichment

**1. Limpiar enriched_content antiguo** (SQL)
   - Script: `scripts/clear-old-enrichment.sql`
   - Acción: Poner `enriched_content = NULL` en módulo de fracciones

**2. Re-enriquecer con estructura correcta** (Node.js)
   - Script: `server/enrichment.js module 0b0f4668-d41e-42b7-a51c-97c5842566b0`
   - Usa OpenAI GPT-4o-mini
   - Genera estructura compatible con Adaptive Engine

**3. Validar resultados** (SQL)
   - Script: `scripts/test-real-module.sql`
   - Verificar que ahora SÍ tiene `expected_answer`, `step_config`, etc.

**4. Aplicar a otros 9 módulos** (repetir proceso)
   - Total: 93 steps restantes (101 - 8 del módulo de fracciones)

---

## 📋 PASOS A EJECUTAR

### Ejecución Manual:

1. **Limpiar enrichment antiguo:**
   ```sql
   -- En Supabase SQL Editor
   -- Ejecutar: scripts/clear-old-enrichment.sql
   ```

2. **Re-enriquecer módulo:**
   ```powershell
   # En terminal (desde raíz del proyecto)
   cd server
   node enrichment.js module 0b0f4668-d41e-42b7-a51c-97c5842566b0
   ```

3. **Validar resultados:**
   ```sql
   -- En Supabase SQL Editor
   -- Ejecutar: scripts/test-real-module.sql
   ```

### O ejecutar script automatizado:

```powershell
# En terminal (desde raíz del proyecto)
.\scripts\re-enrich-fracciones.ps1
```

---

## ⚠️ REQUISITOS PREVIOS

- [x] OpenAI API Key en `server/.env`
- [x] Dependencia `openai` instalada (ya está en package.json)
- [x] Supabase Service Role Key en `server/.env`
- [x] Script `enrichment.js` creado y testeado

---

## 📊 IMPACTO

**Steps a re-enriquecer:**
- Módulo de fracciones: 8 steps
- Otros 9 módulos de matemáticas: ~93 steps
- **Total inmediato:** 101 steps

**Tiempo estimado:**
- 8 steps × 2 segundos delay = ~16 segundos
- + tiempo de procesamiento OpenAI = ~30-45 segundos total

**Costo estimado:**
- GPT-4o-mini: ~$0.01 por módulo de 8 steps
- Total 10 módulos: ~$0.10 USD

---

## ✅ CRITERIOS DE ÉXITO

Después del re-enrichment, la Query 5 debe mostrar:

```
| has_enriched | has_expected_answer | has_step_config | dimension   |
| ✓            | ✓                   | ✓               | comprension |
```

Y el Adaptive Engine podrá:
- ✅ Evaluar respuestas correctamente
- ✅ Detectar misconceptions
- ✅ Generar intervenciones adaptativas
- ✅ Actualizar progreso cognitivo
- ✅ Resolver next steps

---

## 🚀 SIGUIENTE PASO

**Ejecutar:** `scripts/re-enrich-fracciones.ps1`

Esto limpiará, re-enriquecerá y validará el módulo de fracciones con la estructura correcta.
