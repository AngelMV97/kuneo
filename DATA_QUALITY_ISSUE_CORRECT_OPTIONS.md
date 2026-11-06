# Data Quality Issue Report: correct_options Formatting

**Date**: 2026-05-19  
**Priority**: HIGH  
**Tests**: Fase 4 Data Quality Validation  
**Status**: ❌ FAIL (86.7%, requires ≥90%)

---

## Executive Summary

35 de 263 preguntas tipo "option" (13.3%) tienen `correct_options` inválido, fallando Test 4 de validación de calidad de datos (86.7% cuando se requiere ≥90%).

**Root causes identificadas**:
1. **Mathematics (1 step)**: Formato legacy `correct_option` (singular) en lugar de `correct_options` (plural)
2. **Language (34 steps)**: `classification_task` steps marcados incorrectamente como answer_type "option" cuando no tienen options tradicionales

---

## Detailed Analysis

### Distribution
- **Total invalid**: 35/263 (13.3%)
- **By subject**:
  - Language: 34 (97%)
  - Mathematics: 1 (3%)
- **By issue type**:
  - Empty array `[]`: 34 (Language classification_tasks)
  - Missing field `undefined`: 1 (Mathematics legacy format)

### Sample Analysis

#### Mathematics Step (00000000-0000-0000-0001-000000000002)
```json
{
  "step_type": "question",
  "content": {
    "question": "Si divides una pizza en 4 partes iguales y tomas 1, ¿qué fracción tomaste?",
    "options": ["1/4", "1/2", "4/1", "1/8"]
  },
  "enriched_content": {
    "expected_answer": {
      "type": "option",
      "correct_option": "1/4",  // ❌ SINGULAR (legacy format)
      "misconceptions": [...]
    }
  }
}
```

**Issue**: Usa `correct_option` (singular) en lugar de `correct_options` (plural array).  
**Fix**: Migrar a `correct_options: [0]` (la respuesta correcta "1/4" está en index 0)

---

#### Language Steps (34 samples - ALL classification_task)
```json
{
  "step_type": "classification_task",  // ❌ NO es "question"
  "content": {
    "prompt": "¿Cuáles de estos son ejemplos de lectura_inferencial y cuáles no?",
    "input_mode": "drag_drop",  // Drag & drop, NO multiple choice
    "concept_key": "lectura_inferencial"
    // ❌ NO hay "options" aquí
  },
  "enriched_content": {
    "expected_answer": {
      "type": "option",  // ❌ INCORRECTO - no debería ser "option"
      "correct_options": [],  // ❌ Vacío porque no hay options
      "misconceptions": [...]
    },
    "step_config": {
      // ❌ NO hay "options" aquí tampoco
    }
  }
}
```

**Issue**: 
- Step type es `classification_task` (drag & drop), NO pregunta de opción múltiple
- OpenAI generó `answer_type: "option"` incorrectamente
- No hay options disponibles para seleccionar
- `correct_options: []` está vacío porque no aplica

**Root Cause**: El prompt de enrichment no maneja correctamente `classification_task` - lo trata como pregunta normal.

---

## Impact Assessment

### Functional Impact
- ❌ **Mathematics step**: No puede evaluarse (correct_options undefined)
- ❌ **Language classification_tasks**: Evaluación incorrecta - marcados como "option" pero no tienen options
- ⚠️ **Test failure**: 86.7% pass rate (necesitamos ≥90%)

### User Impact
- MEDIO-ALTO: 13.3% de preguntas tipo option afectadas
- ❌ Students pueden encontrar errores al responder estas preguntas
- ❌ Evaluación incorrecta de respuestas

### System Confidence
- ⚠️ Reduce confianza general del 100% (functional tests) a 96.9% overall
- ✅ Sistema estable y funcional
- ⚠️ Data quality issue específico que requiere corrección

---

## Fix Strategy

### Option A: Re-enrich with Improved Prompt (RECOMMENDED for Language)

**For Language classification_tasks (34 steps)**:

1. Update enrichment.js system prompt to handle classification_task specifically
2. Generate correct answer_type for classification_task:
   - Use `"text"` with evaluation_strategy: "classification"
   - Or create new answer_type: "classification"
   - Include expected classifications in expected_answer
3. Re-enrich all 34 Language classification_task steps

**Pros**:
- ✅ Fixes root cause (incorrect answer_type)
- ✅ Consistent with step_type semantics
- ✅ Automated solution
- ✅ Cost: ~$0.002 x 34 = ~$0.07

**Cons**:
- ⚠️ Requires enrichment.js update
- ⚠️ Time: ~5 min development + 5 min re-enrich

**Implementation**:
```javascript
// In enrichment.js system prompt, add:
"Para classification_task:
- answer_type debe ser 'text' (no 'option')
- expected_answer debe incluir las clasificaciones correctas
- evaluation_strategy: 'classification'
- step_config debe incluir categories para drag & drop"
```

---

### Option B: Manual SQL Fix (RECOMMENDED for Mathematics)

**For Mathematics legacy format (1 step)**:

```sql
-- Step 00000000-0000-0000-0001-000000000002
UPDATE kuneo.module_steps
SET enriched_content = jsonb_set(
    enriched_content,
    '{expected_answer,correct_options}',
    '[0]'::jsonb
)
WHERE id = '00000000-0000-0000-0001-000000000002';

-- Remove old correct_option field
UPDATE kuneo.module_steps
SET enriched_content = enriched_content - 'expected_answer'::text - 'correct_option'::text
WHERE id = '00000000-0000-0000-0001-000000000002';
```

**Pros**:
- ✅ Fast (1 second)
- ✅ Precise fix for single step
- ✅ No cost

**Cons**:
- ⚠️ Manual intervention
- ⚠️ Need to identify correct index from options array

---

### Option C: Hybrid Approach (RECOMMENDED OVERALL)

1. **Mathematics step (1)**: Manual SQL fix
   - Migrate `correct_option: "1/4"` → `correct_options: [0]`
   - Verify options array index
   - SQL UPDATE query

2. **Language classification_tasks (34)**: Update enrichment + re-enrich
   - Update enrichment.js to handle classification_task
   - Add classification answer type support
   - Re-enrich 34 steps with improved prompt

**Timeline**:
1. SQL fix for Mathematics: 5 minutes
2. Update enrichment.js: 15 minutes
3. Re-enrich Language steps: 5 minutes
4. Re-validate Test 4: 2 minutes
5. **Total: ~30 minutes**

**Expected outcome**: 100% pass rate on Test 4

---

## Lessons Learned

### 1. Step Type Diversity
- Different step_types require different answer_types
- `question` → can use "option"
- `classification_task` → should use "text" or custom type
- `drawing` → uses "drawing"

### 2. Enrichment Prompt Gaps
- Current prompt doesn't differentiate by step_type
- Need step_type-specific enrichment strategies
- classification_task was treated as regular question

### 3. Validation Importance
- Data quality validation (Fase 4) caught this before production
- 13.3% of option-type questions would have failed
- Validates importance of multi-phase testing

### 4. Format Migration Needed
- Legacy `correct_option` (singular) format still exists
- Need migration script for all legacy steps
- Check other subjects for similar issues

---

## Next Actions

### Immediate (Priority: HIGH)
1. ✅ Identify affected steps (DONE - invalid-correct-options.json)
2. ✅ Analyze patterns (DONE - this document)
3. ⏳ **Fix Mathematics step** - SQL UPDATE query
4. ⏳ **Update enrichment.js** - Add classification_task handling
5. ⏳ **Re-enrich Language steps** - Batch re-enrich 34 steps
6. ⏳ **Re-validate** - Run validate-correct-options.js

### Short-term
7. Check other subjects for legacy format steps
8. Create migration script for correct_option → correct_options
9. Update TESTING_REPORT.md when fixed

### Medium-term
10. Enhance enrichment.js with step_type-specific prompts
11. Add classification_task evaluation logic to adaptive.js
12. Document classification_task answer format in ADAPTIVE_ENGINE_MVP.md

---

## Files Generated
- `invalid-correct-options.json` - List of 35 invalid steps with IDs and details
- `DATA_QUALITY_ISSUE_CORRECT_OPTIONS.md` - This document
- Validation scripts:
  - `validate-answer-types.js` ✅
  - `validate-cognitive-dimensions.js` ✅
  - `validate-data-consistency.js` ✅
  - `validate-correct-options.js` ❌

---

## Success Criteria

Fix will be considered successful when:
- ✅ validate-correct-options.js returns ≥90% (currently 86.7%)
- ✅ All 35 steps have valid correct_options format
- ✅ Mathematics step migrated to plural format
- ✅ Language classification_tasks have appropriate answer_type
- ✅ Test 4 passes in Fase 4 Data Quality Validation
- ✅ TESTING_REPORT.md updated to reflect 32/32 tests passed (100%)
