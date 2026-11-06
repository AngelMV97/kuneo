# 🧠 Pedagogical Foundations (Fundamentos Pedagógicos)

## 📋 Propósito

Esta capa es el **"cerebro pedagógico" de Kuneo** y controla cómo el LLM enriquece contenido **sin romper la filosofía educativa del sistema**.

### ⚠️ PRINCIPIO CRÍTICO:

```txt
El LLM NO decide currículo.
El LLM NO decide arquitectura.
El LLM NO decide progresión.

El LLM: llena, contextualiza, adapta, enriquece.
```

---

## 🎯 ¿Por qué existe esta capa?

El verdadero peligro del LLM enrichment NO es que falle académicamente.

El verdadero peligro es que:
- ❌ Rompa el tono pedagógico
- ❌ Rompa la filosofía de Kuneo
- ❌ Rompa la experiencia cognitiva
- ❌ Introduzca inconsistencias curriculares
- ❌ Genere feedback punitivo o largo
- ❌ Haga intervenir a Tuko cuando debe callar

**Esta capa evita eso.**

---

## 📂 Estructura

```
pedagogical_foundations/
├── README.md                          # Este archivo
├── pedagogical_principles.json        # Principios filosóficos de Kuneo
├── llm_enrichment_policy.json         # Qué puede/no puede hacer el LLM
├── tuko_intervention_policy.json      # Cuándo/cómo interviene Tuko
├── feedback_policy.json               # Cómo generar feedback
├── reflection_policy.json             # Cómo generar reflexiones
├── socioemotional_policy.json         # Tono socioemocional
├── assessment_policy.json             # Evaluación formativa
├── prompt_blocks/
│   ├── system_pedagogy.md             # System prompt base
│   ├── feedback_rules.md              # Reglas de feedback
│   ├── tuko_voice.md                  # Voz de Tuko
│   ├── metacognition_rules.md         # Reglas de reflexión
│   └── safety_and_quality.md          # Seguridad y calidad
└── schemas/
    ├── enriched_step.schema.json      # Schema de step enriquecido
    ├── enriched_concept_card.schema.json  # Schema de card enriquecida
    └── enriched_visual_template.schema.json  # Schema de visual enriquecido
```

---

## 🧩 Componentes

### 1. **Policies (JSON)**
Definen reglas estructuradas que el LLM DEBE seguir.

| Archivo | Propósito |
|---|---|
| `pedagogical_principles.json` | Principios filosóficos core de Kuneo |
| `llm_enrichment_policy.json` | Qué puede/no puede generar el LLM |
| `tuko_intervention_policy.json` | Cuándo/cómo Tuko interviene |
| `feedback_policy.json` | Estilo de feedback por tipo de respuesta |
| `reflection_policy.json` | Cómo generar preguntas metacognitivas |
| `socioemotional_policy.json` | Tono, empatía, autonomía |
| `assessment_policy.json` | Evaluación formativa y señales de dominio |

### 2. **Prompt Blocks (MD)**
Bloques de texto que se inyectan en system prompts.

| Archivo | Propósito |
|---|---|
| `system_pedagogy.md` | System prompt base con filosofía Kuneo |
| `feedback_rules.md` | Reglas específicas de feedback |
| `tuko_voice.md` | Características de la voz de Tuko |
| `metacognition_rules.md` | Reglas de reflexión metacognitiva |
| `safety_and_quality.md` | Validaciones de seguridad y calidad |

### 3. **Schemas (JSON)**
Estructuras esperadas para contenido enriquecido.

| Archivo | Propósito |
|---|---|
| `enriched_step.schema.json` | Estructura de un `module_step` enriquecido |
| `enriched_concept_card.schema.json` | Estructura de una `concept_card` enriquecida |
| `enriched_visual_template.schema.json` | Estructura de un `visual_template` enriquecido |

---

## 🚀 Cómo se usa

### En scripts de enrichment:

```python
import json
from pathlib import Path

# Cargar foundations
foundations_dir = Path('pedagogical_foundations')

# Cargar políticas
with open(foundations_dir / 'pedagogical_principles.json') as f:
    principles = json.load(f)

with open(foundations_dir / 'tuko_intervention_policy.json') as f:
    tuko_policy = json.load(f)

# Cargar prompt blocks
with open(foundations_dir / 'prompt_blocks/system_pedagogy.md') as f:
    system_pedagogy = f.read()

with open(foundations_dir / 'prompt_blocks/tuko_voice.md') as f:
    tuko_voice = f.read()

# Construir system prompt
system_prompt = f"""
{system_pedagogy}

{tuko_voice}

PEDAGOGICAL PRINCIPLES:
{json.dumps(principles, indent=2)}

TUKO INTERVENTION POLICY:
{json.dumps(tuko_policy, indent=2)}
"""

# Usar en OpenAI
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": enrichment_task}
    ]
)
```

---

## 📖 Fuentes

Esta capa está inspirada en:

1. **Filosofía de Kuneo**
   - Progresión cognitiva (8 dimensiones)
   - Silencio pedagógico de Tuko
   - Intervención adaptativa

2. **Lineamientos MEN (Colombia)**
   - Formación integral
   - Evaluación formativa
   - Aprendizaje activo
   - Desarrollo socioemocional
   - Ciudadanía y convivencia

3. **Teorías cognitivas**
   - Constructivismo
   - Metacognición
   - Transferencia
   - Misconception detection

---

## ⚖️ Principios de diseño

### ✅ HACER:
- Mantener archivos pequeños y reutilizables
- Usar JSON para datos estructurados
- Usar MD para texto que va a prompts
- Versionar cambios (field `version` en JSON)
- Validar contra schemas antes de usar
- Inyectar foundations en TODOS los prompts de enrichment

### ❌ NO HACER:
- Permitir que el LLM modifique estas policies
- Hardcodear estas reglas en código (deben ser archivos)
- Crear políticas contradictorias
- Hacer prompt blocks demasiado largos (máx 500 palabras c/u)
- Mezclar lógica de negocio con lógica pedagógica

---

## 🔄 Versionado

**Versión actual:** `0.1` (inicial)

Cambios futuros deben:
1. Incrementar versión en cada JSON
2. Documentar cambio en este README
3. Validar que no rompa enrichments existentes

---

## 🎓 Ejemplo de uso en pipeline

```
ENRICHMENT REQUEST: "Generar opciones para ejercicio de fracciones"
↓
LOAD pedagogical_foundations/
↓
CONSTRUCT system_prompt = 
    system_pedagogy.md +
    tuko_voice.md +
    pedagogical_principles.json +
    feedback_policy.json
↓
CALL OpenAI API
↓
VALIDATE response against enriched_step.schema.json
↓
SAVE enriched content
```

---

## 📊 Métricas de calidad

Un enrichment es **pedagógicamente válido** si:

✅ Respeta los 6 principios de `pedagogical_principles.json`  
✅ No rompe `llm_enrichment_policy.json` (no genera currículo nuevo)  
✅ Feedback sigue `feedback_policy.json` (no punitivo, breve)  
✅ Tuko interviene según `tuko_intervention_policy.json`  
✅ Reflexiones siguen `reflection_policy.json` (hacer visible pensamiento)  
✅ Pasa validación contra schemas correspondientes  

---

## 🚨 Casos de alerta

Si el LLM genera:

- ❌ Feedback punitivo: "Incorrecto. Debes estudiar más."
- ❌ Explicación larga sin pista previa
- ❌ Tuko interviene en primer error
- ❌ Contenido no alineado con grade_range
- ❌ Pregunta de reflexión muy abstracta para primaria
- ❌ Modificación de currículo o progresión

→ **RECHAZAR y regenerar con políticas más explícitas**

---

## 🛠️ Mantenimiento

Esta capa debe ser:
- **Estable** (cambios infrecuentes)
- **Versionada** (historial de cambios)
- **Validada** (testing de consistency)
- **Documentada** (este README actualizado)

Responsables:
- Equipo pedagógico: define principios
- Equipo técnico: implementa uso en scripts
- Equipo de QA: valida adherencia

---

**🎯 "Esta capa no es opcional. Es el cerebro que evita que Kuneo pierda su alma pedagógica."**
