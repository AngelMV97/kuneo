# ADAPTIVE ENGINE MVP - ARQUITECTURA Y PLAN

## VISIÓN EVOLUTIVA

### Principios originales (mantener)
✅ **Progresión por capacidades cognitivas, no por contenido**  
✅ **Evaluación del proceso de pensamiento, no del resultado**  
✅ **Evaluación invisible (disfrazada de aprendizaje)**  
✅ **Feedback cualitativo, no puntajes**  
✅ **Sistema de entrenamiento del pensamiento**  

### Evolución necesaria (conectar con lo existente)
🔄 **Conectar con:**
- taxonomías (disciplinas, microtopics)
- module_steps (8 steps con cognitive_dimension)
- concept_cards (enriched con card_variant)
- visual_templates (enriched con overlays)
- pedagogical_foundations (silence, reflection, metacognition)

---

## ARQUITECTURA ADAPTIVE ENGINE MVP

```txt
Usuario responde
↓
[Adaptive Engine]
├─ Answer Evaluator       → correct/incorrect/partial/misconception
├─ Intervention Decider   → Tuko, card, visual, overlay, silencio
├─ Progress Updater       → perfil cognitivo, mastery
├─ Next Step Resolver     → avanzar, repetir, remedial
└─ Recommendation Engine  → siguiente módulo/microtopic
↓
Runtime Response
↓
Frontend renderiza (texto + tarjeta + visual + overlay)
```

---

## 1. DIMENSIONES COGNITIVAS CONECTADAS A MODULE_STEPS

### 5 Dimensiones Macro

| Dimensión | Descripción | Nivel rango |
|-----------|-------------|-------------|
| `comprension` | ¿Entiende el concepto? | 0-100 |
| `representacion` | ¿Puede modelarlo? | 0-100 |
| `razonamiento` | ¿Puede justificar? | 0-100 |
| `transferencia` | ¿Aplica en nuevo contexto? | 0-100 |
| `metacognicion` | ¿Reflexiona sobre su proceso? | 0-100 |

### Mapeo module_steps → Dimensiones

```txt
exploracion          → comprension
representacion       → representacion
razonamiento         → razonamiento
clasificacion        → comprension + razonamiento
aplicacion_guiada    → razonamiento
transferencia        → transferencia
analisis_de_error    → razonamiento + metacognicion
metacognicion        → metacognicion
```

Cada respuesta en un `step` actualiza la(s) dimensión(es) correspondiente(s).

---

## 2. TABLAS DE BASE DE DATOS

### 2.1 `student_step_attempts`
Registro de cada intento del usuario en un step.

```sql
CREATE TABLE kuneo.student_step_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  module_id UUID NOT NULL REFERENCES kuneo.modules(module_id),
  step_id UUID NOT NULL REFERENCES kuneo.module_steps(step_id),
  
  -- Respuesta del usuario
  answer TEXT NOT NULL,
  answer_type TEXT, -- 'text', 'option', 'numeric', 'drawing'
  
  -- Evaluación
  result TEXT NOT NULL CHECK (result IN ('correct', 'incorrect', 'partial', 'skipped')),
  misconception_key TEXT, -- ej: 'confunde_numerador_denominador'
  cognitive_dimension TEXT NOT NULL, -- 'comprension', 'representacion', etc.
  
  -- Contexto
  attempt_number INT NOT NULL DEFAULT 1,
  time_on_task INT, -- segundos
  hint_requests INT DEFAULT 0,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Intervención aplicada
  intervention_type TEXT, -- 'none', 'hint', 'card', 'visual', 'remedial'
  card_variant TEXT, -- 'basic', 'hint', 'corrective', 'reflective'
  visual_overlay TEXT, -- 'hint', 'corrective', null
  tuko_showed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, step_id, attempt_number)
);

CREATE INDEX idx_attempts_user_module ON kuneo.student_step_attempts(user_id, module_id);
CREATE INDEX idx_attempts_result ON kuneo.student_step_attempts(result);
CREATE INDEX idx_attempts_misconception ON kuneo.student_step_attempts(misconception_key);
```

### 2.2 `student_module_progress`
Progreso del usuario en cada módulo.

```sql
CREATE TABLE kuneo.student_module_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  module_id UUID NOT NULL REFERENCES kuneo.modules(module_id),
  
  -- Estado del módulo
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
  current_step_id UUID REFERENCES kuneo.module_steps(step_id),
  steps_completed INT DEFAULT 0,
  total_steps INT NOT NULL,
  
  -- Progreso cognitivo en este módulo
  comprension_score DECIMAL(5,2) DEFAULT 0 CHECK (comprension_score BETWEEN 0 AND 100),
  representacion_score DECIMAL(5,2) DEFAULT 0 CHECK (representacion_score BETWEEN 0 AND 100),
  razonamiento_score DECIMAL(5,2) DEFAULT 0 CHECK (razonamiento_score BETWEEN 0 AND 100),
  transferencia_score DECIMAL(5,2) DEFAULT 0 CHECK (transferencia_score BETWEEN 0 AND 100),
  metacognicion_score DECIMAL(5,2) DEFAULT 0 CHECK (metacognicion_score BETWEEN 0 AND 100),
  
  -- Métricas
  total_attempts INT DEFAULT 0,
  correct_attempts INT DEFAULT 0,
  hints_used INT DEFAULT 0,
  avg_time_per_step INT, -- segundos promedio
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_progress_user ON kuneo.student_module_progress(user_id);
CREATE INDEX idx_progress_status ON kuneo.student_module_progress(status);
CREATE INDEX idx_progress_module ON kuneo.student_module_progress(module_id);
```

### 2.3 `student_cognitive_profile`
Perfil cognitivo global del usuario (acumulado de todos los módulos).

```sql
CREATE TABLE kuneo.student_cognitive_profile (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  
  -- 5 Dimensiones cognitivas globales
  comprension DECIMAL(5,2) DEFAULT 50 CHECK (comprension BETWEEN 0 AND 100),
  representacion DECIMAL(5,2) DEFAULT 50 CHECK (representacion BETWEEN 0 AND 100),
  razonamiento DECIMAL(5,2) DEFAULT 50 CHECK (razonamiento BETWEEN 0 AND 100),
  transferencia DECIMAL(5,2) DEFAULT 50 CHECK (transferencia BETWEEN 0 AND 100),
  metacognicion DECIMAL(5,2) DEFAULT 50 CHECK (metacognicion BETWEEN 0 AND 100),
  
  -- Etapa del usuario (progresión macro)
  stage INT DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
  -- 1: Explorador, 2: Constructor, 3: Analista, 4: Aplicador, 5: Autónomo
  
  -- Métricas globales
  total_modules_completed INT DEFAULT 0,
  total_steps_completed INT DEFAULT 0,
  total_correct_responses INT DEFAULT 0,
  total_attempts INT DEFAULT 0,
  
  -- Patterns detectados
  common_misconceptions JSONB DEFAULT '[]'::jsonb,
  strong_topics JSONB DEFAULT '[]'::jsonb, -- microtopics donde tiene mastery alto
  weak_topics JSONB DEFAULT '[]'::jsonb,   -- microtopics donde necesita refuerzo
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_user ON kuneo.student_cognitive_profile(user_id);
CREATE INDEX idx_profile_stage ON kuneo.student_cognitive_profile(stage);
```

### 2.4 `student_taxonomy_mastery`
Mastery del usuario por microtopic (conectado con taxonomías).

```sql
CREATE TABLE kuneo.student_taxonomy_mastery (
  mastery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  microtopic_code TEXT NOT NULL, -- ej: 'MAT-NUM-001'
  
  -- Mastery score
  mastery_level DECIMAL(5,2) DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
  evidences_count INT DEFAULT 0, -- cuántas veces trabajó este microtopic
  
  -- Dimensiones por microtopic
  comprension_level DECIMAL(5,2) DEFAULT 0,
  representacion_level DECIMAL(5,2) DEFAULT 0,
  razonamiento_level DECIMAL(5,2) DEFAULT 0,
  transferencia_level DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'introduced', 'practicing', 'mastered')),
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  mastered_at TIMESTAMPTZ,
  
  UNIQUE(user_id, microtopic_code)
);

CREATE INDEX idx_mastery_user ON kuneo.student_taxonomy_mastery(user_id);
CREATE INDEX idx_mastery_microtopic ON kuneo.student_taxonomy_mastery(microtopic_code);
CREATE INDEX idx_mastery_level ON kuneo.student_taxonomy_mastery(mastery_level);
CREATE INDEX idx_mastery_status ON kuneo.student_taxonomy_mastery(status);
```

### 2.5 `student_recommendations`
Recomendaciones generadas por el Adaptive Engine.

```sql
CREATE TABLE kuneo.student_recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Qué se recomienda
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('next_module', 'remedial_module', 'microtopic_review', 'skill_practice')),
  target_module_id UUID REFERENCES kuneo.modules(module_id),
  target_microtopic TEXT, -- código del microtopic
  
  -- Por qué se recomienda
  reason TEXT NOT NULL, -- 'low_transferencia', 'weak_microtopic', 'natural_progression'
  priority INT DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1: alta, 5: baja
  
  -- Metadata
  based_on_evidence JSONB, -- qué attempts/modules llevaron a esta recomendación
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'completed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- recomendaciones caducan si no se usan
);

CREATE INDEX idx_recommendations_user ON kuneo.student_recommendations(user_id);
CREATE INDEX idx_recommendations_status ON kuneo.student_recommendations(status);
CREATE INDEX idx_recommendations_priority ON kuneo.student_recommendations(priority);
```

---

## 3. REGLAS ADAPTATIVAS BASE (MVP)

### 3.1 Evaluación de respuesta

```txt
CORRECT
└─ fast (< avg_time * 0.7)
   → silencio + avanzar
   → mastery_delta = +0.12
└─ normal
   → feedback breve + avanzar
   → mastery_delta = +0.08
└─ slow (> avg_time * 1.5)
   → feedback + "¿Cómo llegaste a esa respuesta?"
   → mastery_delta = +0.05

INCORRECT
└─ first attempt
   → hint corto (sin tarjeta) + retry
   → mastery_delta = 0
└─ second attempt
   → hint_card o basic_card + retry
   → mastery_delta = -0.03
└─ third attempt
   → corrective_card + visual overlay + remedial option
   → mastery_delta = -0.08

PARTIAL
└─ idea correcta, expresión incompleta
   → "Vas bien, pero... [hint específico]"
   → mastery_delta = +0.03
```

### 3.2 Detección de misconception

```txt
SI misconception_key detectada
→ card_variant = 'corrective'
→ visual_overlay = 'corrective' o misconception-specific
→ usar concept_card asociado al misconception
→ registrar en common_misconceptions
→ mastery_delta = -0.10 en dimensión afectada
```

### 3.3 Tuko Silence Rules

```txt
MOSTRAR TUKO:
- incorrect second attempt
- misconception detectada
- stuck (> 2 min sin responder)
- metacognition step (siempre)

NO MOSTRAR TUKO:
- correct fast
- correct normal (a menos que sea transferencia exitosa)
- incorrect first attempt (solo hint textual)
```

### 3.4 Card Variant Selection

```txt
basic
→ primera explicación del concepto
→ introducción de representación

hint
→ incorrect first attempt con hint_policy = 'cards'
→ usuario pide ayuda explícitamente

corrective
→ misconception detectada
→ incorrect second attempt

reflective
→ metacognition step
→ análisis de error
→ nunca calificar, solo invitar a reflexionar

deepening
→ correct en transferencia + mastery alto
→ ofrecer extensión conceptual
```

### 3.5 Next Step Logic

```txt
IF correct + mastery_high
→ next_step

IF correct + mastery_medium
→ next_step + opcional: "¿Quieres profundizar?"

IF incorrect < 3 attempts
→ retry_current_step

IF incorrect = 3 attempts
→ insert_remedial_step (worked_example o guided_representation)

IF stuck > 3 min
→ show_concept_card + pause_step

IF transferencia_failed + previous_steps_weak
→ insert_remedial: aplicacion_guiada extra
```

### 3.6 Progress Update Logic

```txt
Cada attempt actualiza:
1. student_step_attempts (nuevo registro)
2. student_module_progress (scores acumulados)
3. student_cognitive_profile (dimensiones globales)
4. student_taxonomy_mastery (mastery del microtopic)

Fórmula de actualización (weighted average):
new_score = (current_score * 0.85) + (attempt_delta * 0.15)

Esto hace que el progreso sea:
- gradual (no saltos bruscos)
- sensible a tendencias recientes
- estable ante errores aislados
```

---

## 4. SERVICIOS INTERNOS (server/adaptive.js)

### 4.1 `answerEvaluator(attempt)`

**Entrada:**
```javascript
{
  step_id: UUID,
  answer: string,
  expected_answer: object, // de enriched_content
  attempt_number: int
}
```

**Salida:**
```javascript
{
  result: 'correct' | 'incorrect' | 'partial',
  misconception_key: string | null,
  cognitive_dimension: string,
  confidence: float, // 0-1
  reasoning: string
}
```

**Lógica MVP:**
- Matching exacto para opciones múltiples
- Keyword matching para respuestas abiertas
- Regex para respuestas numéricas
- (Post-MVP: LLM evaluator)

### 4.2 `interventionDecider(evaluation, context)`

**Entrada:**
```javascript
{
  evaluation: {...},
  context: {
    attempt_number: int,
    hint_requests: int,
    time_on_task: int,
    previous_attempts: [...],
    step_config: {...}
  }
}
```

**Salida:**
```javascript
{
  show_tuko: boolean,
  tuko_state: 'neutral' | 'hint' | 'encourage' | 'correct',
  message: string | null,
  card_variant: 'basic' | 'hint' | 'corrective' | 'reflective' | null,
  concept_card_key: string | null,
  visual_overlay: 'hint' | 'corrective' | null,
  animation_mode: 'static' | 'step_reveal' | null
}
```

**Lógica:**
- Aplicar reglas adaptativas (sección 3)
- Considerar pedagogical_foundations (silence, reflection)
- Respetar hint_policy del step

### 4.3 `progressUpdater(attempt, evaluation)`

**Entrada:**
```javascript
{
  attempt: {...},
  evaluation: {...}
}
```

**Acción:**
- Actualizar `student_step_attempts`
- Actualizar `student_module_progress`
- Actualizar `student_cognitive_profile`
- Actualizar `student_taxonomy_mastery`

**Lógica:**
- Calcular mastery_delta según reglas (sección 3.1)
- Aplicar weighted average
- Detectar patterns (misconceptions comunes)

### 4.4 `nextStepResolver(module_progress, current_step)`

**Entrada:**
```javascript
{
  module_progress: {...},
  current_step: {...},
  last_attempts: [...]
}
```

**Salida:**
```javascript
{
  action: 'next_step' | 'retry_current' | 'insert_remedial' | 'complete_module',
  next_step_id: UUID | null,
  remedial_type: 'worked_example' | 'guided_representation' | null
}
```

**Lógica:**
- Aplicar next_step logic (sección 3.5)
- Verificar condiciones de avance
- Decidir si insertar remedial

### 4.5 `recommendationEngine(user_profile)`

**Entrada:**
```javascript
{
  user_id: UUID,
  cognitive_profile: {...},
  completed_modules: [...],
  taxonomy_mastery: {...}
}
```

**Salida:**
```javascript
{
  recommendations: [
    {
      type: 'next_module',
      module_id: UUID,
      reason: 'natural_progression',
      priority: 1
    },
    {
      type: 'remedial_module',
      microtopic: 'MAT-NUM-001',
      reason: 'low_representacion',
      priority: 2
    }
  ]
}
```

**Lógica MVP:**
- Identificar weak_topics
- Buscar módulos que trabajen esos microtopics
- Considerar progresión natural por taxonomía
- (Post-MVP: algoritmo más sofisticado)

---

## 5. ENDPOINTS API

### 5.1 `POST /api/adaptive/submit-answer`

**Request:**
```json
{
  "user_id": "...",
  "module_id": "...",
  "step_id": "...",
  "answer": "...",
  "time_on_task": 45,
  "hint_requests": 1,
  "confidence": "medium"
}
```

**Response:**
```json
{
  "evaluation": {
    "result": "incorrect",
    "cognitive_dimension": "representacion",
    "misconception_key": "confunde_numerador_denominador"
  },
  "intervention": {
    "show_tuko": true,
    "tuko_state": "hint",
    "message": "Mira primero cuántas partes hay en total.",
    "card_variant": "corrective",
    "concept_card_key": "fraction_basics",
    "visual_template_key": "fraction_part_whole",
    "visual_overlay": "corrective"
  },
  "next_action": {
    "type": "retry_current_step",
    "attempt_number": 2
  },
  "progress_update": {
    "representacion_delta": -0.05,
    "module_progress": 25
  }
}
```

### 5.2 `POST /api/adaptive/request-hint`

**Request:**
```json
{
  "user_id": "...",
  "step_id": "..."
}
```

**Response:**
```json
{
  "hint": {
    "type": "text" | "card" | "visual",
    "content": "...",
    "card_variant": "hint",
    "concept_card_key": "...",
    "visual_overlay": "hint"
  },
  "hint_count": 2
}
```

### 5.3 `GET /api/adaptive/progress/:userId`

**Response:**
```json
{
  "cognitive_profile": {
    "comprension": 68,
    "representacion": 52,
    "razonamiento": 47,
    "transferencia": 35,
    "metacognicion": 28,
    "stage": 2
  },
  "current_modules": [
    {
      "module_id": "...",
      "status": "in_progress",
      "progress_percent": 37,
      "scores": {...}
    }
  ],
  "strong_topics": ["MAT-NUM-001", "MAT-GEO-003"],
  "weak_topics": ["MAT-NUM-005", "MAT-ALG-002"]
}
```

### 5.4 `GET /api/adaptive/recommendations/:userId`

**Response:**
```json
{
  "recommendations": [
    {
      "type": "next_module",
      "module": {...},
      "reason": "Fortalece tu comprensión de fracciones",
      "priority": 1
    },
    {
      "type": "remedial_module",
      "microtopic": "MAT-NUM-005",
      "reason": "Refuerza representación de números",
      "priority": 2
    }
  ]
}
```

---

## 6. INTEGRACIÓN CON FRONTEND

### Module.jsx

```javascript
// Al enviar respuesta
const handleSubmitAnswer = async () => {
  const response = await fetch('/api/adaptive/submit-answer', {
    method: 'POST',
    body: JSON.stringify({
      user_id: currentUser.id,
      module_id: moduleId,
      step_id: currentStep.step_id,
      answer: userAnswer,
      time_on_task: timeOnTask,
      confidence: confidenceLevel
    })
  });

  const result = await response.json();

  // Mostrar intervención
  if (result.intervention.show_tuko) {
    setTukoState(result.intervention.tuko_state);
    setTukoMessage(result.intervention.message);
  }

  if (result.intervention.card_variant) {
    setShowConceptCard(true);
    setCardVariant(result.intervention.card_variant);
    setConceptCardKey(result.intervention.concept_card_key);
  }

  // Actualizar UI
  if (result.next_action.type === 'next_step') {
    loadNextStep();
  } else if (result.next_action.type === 'retry_current_step') {
    setAttemptNumber(result.next_action.attempt_number);
  }
};
```

---

## 7. FASES DE IMPLEMENTACIÓN

### FASE 1: Base de datos ✅
- Crear tablas SQL ✅
- Crear políticas RLS ✅
- Poblar datos de prueba ✅

### FASE 2: Answer Evaluator ✅
- Implementar matching básico ✅
- Conectar con enriched_content ✅
- Detectar misconceptions conocidos ✅

### FASE 3: Intervention Decider ✅
- Implementar reglas adaptativas ✅
- Conectar con concept_cards ✅
- Conectar con visual_templates ✅

### FASE 4: Progress Updater ✅
- Actualizar dimensiones cognitivas ✅
- Calcular mastery_delta ✅
- Actualizar perfil global ✅

### FASE 5: Next Step Resolver ✅
- Implementar lógica de avance ✅
- Detectar patrones de stuck ✅
- Decidir remedial steps ✅

### FASE 6: Recommendation Engine ✅
- Identificar weak topics ✅
- Recomendar módulos ✅
- Priorizar recomendaciones ✅

### FASE 7: API Endpoints ✅
- Crear rutas Express ✅
- Integrar servicios ✅
- Testing ✅

### FASE 8: Frontend Integration ✅
- Actualizar Module.jsx ✅
- Conectar con ConceptCard ✅
- Conectar con VisualEngine ✅
- UX de intervenciones ✅

---

**🎉 TODAS LAS FASES COMPLETADAS - MVP 100% FUNCIONAL**

---

## 8. MÉTRICAS DE ÉXITO MVP

El Adaptive Engine MVP está funcionando si:

✅ Evalúa correctamente correct/incorrect/partial  
✅ Detecta al menos 3 misconceptions típicos  
✅ Muestra Tuko solo cuando corresponde (silence rules)  
✅ Selecciona card_variant apropiado  
✅ Actualiza perfil cognitivo gradualmente  
✅ Recomienda siguiente módulo basado en weak_topics  
✅ Respeta pedagogical_foundations (silence, reflection)  

---

## 9. QUÉ DEJAR PARA POST-MVP

❌ LLM evaluator (usar solo rule-based en MVP)  
❌ Misconception Engine profundo  
❌ Rutas personalizadas complejas por taxonomía  
❌ Desbloqueo avanzado por disciplinas  
❌ Analytics y dashboards complejos  
❌ Modelo ML de predicción de mastery  
❌ ICFES adaptive loop  
❌ Visual Engine animaciones complejas  

---

## 10. PRINCIPIO FINAL

> **El Adaptive Engine no premia ni castiga.**  
> **Detecta, apoya, adapta.**

```txt
Detecta:
- qué está entendiendo
- qué representación usa
- dónde se bloquea
- qué error conceptual aparece

Apoya:
- hint en momento correcto
- tarjeta apropiada
- visual con overlay
- silencio estratégico

Adapta:
- dificultad
- intervención
- ruta
- feedback
```

---

**Estado:** ARQUITECTURA DEFINIDA ✅  
**Siguiente paso:** Crear tablas SQL e implementar Answer Evaluator

