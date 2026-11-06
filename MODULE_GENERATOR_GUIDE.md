# 🏗️ Module Generator - Sistema de Generación de Módulos

## 📚 Resumen Ejecutivo

El **Module Generator** transforma competency_units (DBAs + Estándares normalizados) en **módulos base estructurales** listos para ser enriquecidos con contenido pedagógico.

**Resultado:**
- ✅ **1,426 módulos base** generados desde competency_units
- ✅ **Estructura completa** con fases, ejercicios, error maps, hints
- ✅ **Organizado por materia y grado** en JSON
- ⏳ **Pendiente:** Enriquecimiento con OpenAI (opcional)

---

## 🎯 Flujo Completo de Generación

```
data/clean (DBAs + Estándares limpios)
    ↓
parsers específicos (parse_dbas.py, parse_standards.py)
    ↓
data/processed/parsed
    ↓
normalizador universal (universal_normalizer.py)
    ↓
data/processed/normalized/competency_units
    ↓
module-generator.js
    ↓
data/processed/modules
    ↓
(Opcional) OpenAI enrichment
    ↓
Supabase: kuneo.modules
```

---

## 📁 Archivos del Sistema

### 1. Core Generator
**scripts/module-generator/module-generator.js**
- Función principal: `buildModuleFromCompetencyUnit(unit)`
- Entrada: competency_unit
- Salida: módulo base estructural

**Qué hace:**
- Interpreta el concepto central
- Genera título y narrativa contextual
- Crea pregunta diagnóstica
- Define 5 fases cognitivas
- Genera ejercicios guiados desde evidencias
- Mapea errores comunes (misconceptions)
- Sugiere visuales apropiados
- Define evaluación por dimensiones

### 2. Runner Script
**scripts/module-generator/generate-modules.js**
- Lee: `data/processed/normalized/competency_units/all_competency_units.json`
- Procesa cada competency_unit
- Guarda módulos en:
  - `data/processed/modules/all_modules.json` (todos)
  - `data/processed/modules/{subject}/{grade}.json` (organizados)

### 3. Tablas de Base de Datos
**scripts/database/create_module_system_tables.sql**

Crea 4 tablas adicionales:
1. **module_steps** - Pasos específicos de cada módulo
2. **concept_cards** - Tarjetas conceptuales reutilizables
3. **visual_templates** - Plantillas de visualizaciones
4. **module_taxonomy_link** - Vincula modules con curriculum_taxonomy

---

## 📊 Estadísticas de Generación

### Módulos Generados: 1,426

**Por Materia:**
| Materia | Módulos |
|---------|---------|
| Ciencias Naturales | 395 |
| Ciencias Sociales | 332 |
| Matemáticas | 291 |
| Inglés | 285 |
| Lenguaje | 123 |

**Por Rango de Grado:**
| Grado | Módulos |
|-------|---------|
| 1-3 | 186 |
| 4-5 | 196 |
| 6-7 | 212 |
| 8-9 | 208 |
| 10-11 | 214 |

---

## 🧩 Estructura de un Módulo Base

```javascript
{
  "module_id": "uuid",
  "source_unit_id": "uuid", // Referencia a competency_unit original
  "source": "dba" | "standard",
  
  "subject": "matematicas",
  "grade_range": "4-5",
  "difficulty": 2, // 1-5
  
  "title": "¿Cómo entender fracciones?",
  "learning_objective": "Explica las relaciones entre perímetro y área...",
  "context": "Vamos a explorar fracciones a partir de...",
  
  "core_concept": "fracciones",
  "concepts": ["fraccion_parte_todo", "equivalencia"],
  "cognitive_type": "representational_thinking",
  "skills": ["identificar", "explicar", "representar"],
  
  "diagnostic": {
    "type": "open_question",
    "question": "¿Qué entiendes por fracciones?",
    "expected_signals": ["fraccion_parte_todo"],
    "detects": ["prior_knowledge", "misconception", "explanation_depth"]
  },
  
  "phases": [
    {
      "phase": "exploration",
      "goal": "activar conocimiento previo",
      "tutor_state": "thinking"
    },
    {
      "phase": "concept_formation",
      "goal": "construir el concepto central",
      "tutor_state": "hint"
    },
    {
      "phase": "guided_application",
      "goal": "aplicar con apoyo",
      "tutor_state": "encouragement"
    },
    {
      "phase": "transfer",
      "goal": "usar la idea en un nuevo contexto",
      "tutor_state": "reflection"
    },
    {
      "phase": "metacognition",
      "goal": "reflexionar sobre cómo cambió el pensamiento",
      "tutor_state": "reflection"
    }
  ],
  
  "guided_exercises": [
    {
      "id": "uuid",
      "evidence_source": "Reconoce que figuras con áreas diferentes...",
      "type": "representation",
      "prompt": "Representa la idea de fracciones usando...",
      "expected_answer": "",
      "hints": ["Piensa primero en...", "¿Qué información es importante?"],
      "evaluates": ["comprension", "representacion"],
      "difficulty": 2,
      "order": 1
    }
  ],
  
  "error_map": {
    "misconception_1": {
      "description": "creer que figuras con igual área siempre tienen igual perímetro",
      "pattern": "creer que figuras con igual área...",
      "feedback": "Revisemos esta idea: creer que figuras...",
      "visual": "area_perimeter_comparison",
      "intervention_level": 2
    }
  },
  
  "hints": [
    "¿Qué sabes ya sobre fracciones?",
    "¿Qué parte del problema te da una pista?",
    "¿Cómo podrías explicarlo sin usar una fórmula todavía?"
  ],
  
  "reflection_prompts": [
    "¿Qué cambió en tu forma de entender fracciones?",
    "¿Qué estrategia te ayudó más?",
    "¿Dónde podrías aplicar esta idea en otro contexto?"
  ],
  
  "evaluation": {
    "dimensions": ["comprension", "representacion", "razonamiento", "transferencia", "metacognicion"],
    "rubric": {
      "comprension": "Identifica la idea central y la explica con sus palabras.",
      "representacion": "Puede expresar la idea con una tabla, dibujo, esquema o ejemplo.",
      // ...
    },
    "pass_condition": {
      "minimum_dimensions": 3,
      "minimum_level": "basic"
    }
  },
  
  "visual_triggers": [
    {
      "error_key": "misconception_1",
      "visual_template": "area_perimeter_comparison",
      "trigger": "creer que figuras con igual área...",
      "intervention_level": 2
    }
  ],
  
  "metadata": {
    "generated_from": "competency_unit",
    "original_metadata": {
      "axis": "pensamiento_espacial",
      "subaxis": "geometria"
    }
  }
}
```

---

## 🎨 5 Fases Cognitivas (Siempre Presentes)

Cada módulo tiene **exactamente 5 fases** en este orden:

### 1. **Exploration** (Exploración)
- **Goal:** Activar conocimiento previo
- **Tutor State:** thinking (Tuko pensativo)
- **Actividad:** Pregunta diagnóstica abierta

### 2. **Concept Formation** (Formación de Concepto)
- **Goal:** Construir el concepto central
- **Tutor State:** hint (Tuko dando pistas)
- **Actividad:** Tarjetas conceptuales, ejemplos, modelos

### 3. **Guided Application** (Aplicación Guiada)
- **Goal:** Aplicar con apoyo
- **Tutor State:** encouragement (Tuko animando)
- **Actividad:** Ejercicios con hints progresivos

### 4. **Transfer** (Transferencia)
- **Goal:** Usar la idea en nuevo contexto
- **Tutor State:** reflection (Tuko reflexivo)
- **Actividad:** Problemas del mundo real, situaciones novedosas

### 5. **Metacognition** (Metacognición)
- **Goal:** Reflexionar sobre cómo cambió el pensamiento
- **Tutor State:** reflection (Tuko reflexivo)
- **Actividad:** Prompts de auto-evaluación, análisis de estrategias

---

## 🧠 Tipos de Ejercicios Generados

El generador infiere el tipo de ejercicio desde las evidencias:

| Palabra Clave | Tipo de Ejercicio |
|---------------|-------------------|
| "identifica" | classification |
| "explica" | explanation |
| "relaciona" | matching |
| "representa" | representation |
| "resuelve" | problem_solving |
| "argumenta" / "justifica" | argumentation |
| "construye" | simulation_or_construction |
| (default) | open_response |

---

## 🎯 Mapeo de Visuales

Cada misconception o concepto sugiere un visual apropiado:

| Concepto | Visual Sugerido |
|----------|-----------------|
| fracción | fraction_part_whole |
| proporcionalidad | proportion_table_graph |
| área / perímetro | area_perimeter_comparison |
| probabilidad | sample_space_diagram |
| electricidad / circuito | circuit_conductor_insulator |
| texto / lectura | idea_evidence_map |
| (default) | concept_map |

---

## 🚀 Próximos Pasos

### Paso 1: Crear Tablas en Supabase ✅ **PENDIENTE**

Ejecuta en el SQL Editor de Supabase:
```
scripts/database/create_module_system_tables.sql
```

Esto crea:
- `kuneo.module_steps`
- `kuneo.concept_cards`
- `kuneo.visual_templates`
- `kuneo.module_taxonomy_link`

### Paso 2: Revisar Módulos Generados ✅ **LISTO**

Los módulos están en:
```
data/processed/modules/
├── all_modules.json (todos los 1,426 módulos)
├── mathematics/
│   ├── 1.json
│   ├── 2.json
│   ├── 4_5.json
│   └── ...
├── natural_sciences/
├── social_studies/
├── language/
└── english/
```

### Paso 3: (Opcional) Enriquecimiento con OpenAI

**Módulo base** → **OpenAI** → **Módulo enriquecido**

OpenAI puede generar:
- Diagnóstico contextualizado
- Problemas específicos con escenarios reales
- Hints progresivos adaptados
- Feedback personalizado
- Tarjetas conceptuales detalladas
- Ejemplos multimedia

### Paso 4: Cargar a Supabase

Dos opciones:

**A. Cargar módulos base directamente**
```javascript
// Script para cargar all_modules.json a kuneo.modules
// Usar Supabase JS client
```

**B. Cargar módulos enriquecidos**
```javascript
// Después del paso de OpenAI enrichment
// Cargar módulos + concept_cards + visual_templates
```

### Paso 5: Vincular con Taxonomías

Usar tabla `module_taxonomy_link` para conectar:
- `curriculum_taxonomy` (estructura curricular)
- `competency_units` (competencias MEN)
- `modules` (módulos ejecutables)

---

## 🔗 Vinculación de Sistemas

### Relaciones entre Tablas

```
curriculum_taxonomy (estructura pedagógica)
    ↓ vincula con
module_taxonomy_link
    ↓ referencia
modules (módulos base)
    ↓ usa
competency_units (DBAs + Estándares)
    ↓ genera
module_steps (pasos de ejecución)
    ↓ referencia
concept_cards + visual_templates
```

### Ejemplo de Vinculación

**Taxonomía:**
```
subject: matematicas
discipline: aritmetica
thematic: numeros_fraccionarios
subthematic: fraccion_parte_todo
```

**Módulo:**
```
module_id: xxx
core_concept: fracciones
source_unit_id: competency_unit_yyy
```

**Link:**
```
module_taxonomy_link
- module_id: xxx
- taxonomy_id: zzz
- link_type: primary
```

---

## 📝 Notas Técnicas

### ¿Por qué JavaScript y no Python?

- Node.js es más rápido para procesamiento de JSONs grandes
- Integración directa con el backend (server/)
- Mismo lenguaje para generación + enriquecimiento con OpenAI
- Facilita migración a Lambda/Cloud Functions si es necesario

### ¿Qué NO genera el módulo base?

El generador local **NO crea**:
- ❌ Contenido pedagógico específico (problemas contextualizados)
- ❌ Diálogos del tutor
- ❌ Imágenes o assets visuales
- ❌ Feedback adaptativo detallado

Esto lo hace **OpenAI** en la fase de enriquecimiento.

### ¿Cuándo usar OpenAI Enrichment?

**Usa OpenAI si necesitas:**
- Problemas contextualizados y narrativos
- Feedback natural y personalizado
- Tarjetas conceptuales con explicaciones ricas
- Variedad de hints adaptativos

**Puedes omitir OpenAI si:**
- Quieres prototipar rápido
- Tienes contenido manual preparado
- Prefieres control total sobre el contenido

---

## 🔍 Consultas SQL Útiles

### Ver módulos por materia y grado
```sql
SELECT subject, grade_range, COUNT(*) as total
FROM kuneo.modules
GROUP BY subject, grade_range
ORDER BY subject, grade_range;
```

### Buscar módulos por concepto
```sql
SELECT title, core_concept, learning_objective
FROM kuneo.modules
WHERE core_concept LIKE '%fraccion%';
```

### Ver pasos de un módulo
```sql
SELECT step_order, step_type, phase, content
FROM kuneo.module_steps
WHERE module_id = 'xxx'
ORDER BY step_order;
```

### Módulos vinculados a una taxonomía
```sql
SELECT m.title, m.subject, ct.subthematic
FROM kuneo.modules m
JOIN kuneo.module_taxonomy_link mtl ON mtl.module_id = m.id
JOIN kuneo.curriculum_taxonomy ct ON ct.id = mtl.taxonomy_id
WHERE ct.discipline = 'aritmetica';
```

---

## ✅ Checklist de Implementación

- [x] Crear module-generator.js
- [x] Crear generate-modules.js
- [x] Generar 1,426 módulos base desde competency_units
- [x] Organizar módulos por materia y grado en JSON
- [x] Crear SQL para tablas adicionales (module_steps, concept_cards, etc.)
- [ ] Ejecutar SQL en Supabase para crear tablas
- [ ] (Opcional) Implementar OpenAI enrichment
- [ ] Crear script de carga a Supabase
- [ ] Vincular módulos con curriculum_taxonomy
- [ ] Poblar concept_cards y visual_templates
- [ ] Integrar con frontend

---

**🎓 "De competencias a módulos estructurales: el núcleo de Kuneo"**
