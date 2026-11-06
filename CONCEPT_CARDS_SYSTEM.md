# 🎴 Sistema de Tarjetas Conceptuales (Concept Cards)

## 📊 Estado Actual

**✅ COMPLETADO - 44 tarjetas conceptuales pobladas en Supabase**

---

## 🎯 Objetivo del Sistema

Las **concept_cards** son el corazón del sistema de intervención pedagógica de Tuko. Definen **cuándo, qué y cómo** mostrar contenido al estudiante según su estado cognitivo.

### Principio BASE:
> **Tuko NO enseña mostrando información.**  
> **Tuko interviene solo cuando el pensamiento lo necesita.**

---

## 📋 Estructura de Tarjetas

### Campos Implementados:

```sql
concept_cards {
  -- Identificación
  id UUID
  concept_key TEXT UNIQUE           -- ej: "fracciones", "fotosintesis"
  concept_name TEXT                 -- ej: "Fracciones", "Fotosíntesis"
  
  -- Tipo de tarjeta (determina cuándo mostrarla)
  card_type TEXT                    -- basic | corrective | hint | reflective
  
  -- Contenido pedagógico estructurado
  title TEXT
  body TEXT
  one_line_definition TEXT          -- Definición ultra concisa (1 oración)
  core_insight TEXT                 -- La idea clave que debe quedarse
  example JSONB                     -- {context, problem, solution, visual_ref}
  common_misconception TEXT         -- Error conceptual más frecuente
  hint_prompt TEXT                  -- Hint progresivo (sin revelar respuesta)
  explanation TEXT                  -- Explicación extendida (opcional)
  
  -- Visual asociado
  visual_template_key TEXT          -- Referencia a visual_templates
  
  -- Metadata
  subject subject_enum              -- matematicas | ciencias | sociales | lenguaje | ingles
  grade_range TEXT                  -- "4-5", "6-7", etc.
  difficulty INTEGER                -- 1-5
  
  -- Relaciones
  related_concepts TEXT[]           -- Array de concept_keys relacionados
  source_module_ids UUID[]          -- Módulos de donde se extrajo
  taxonomy_ids UUID[]               -- Taxonomías curriculares relacionadas
  
  -- Timestamps
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}
```

---

## 📊 Resultados de Población

### Estadísticas Generales:
- **Total:** 44 tarjetas conceptuales
- **Módulos analizados:** 1,426
- **Taxonomías vinculadas:** 1,570
- **Links procesados:** 11,154

### Por Asignatura:
- **Matemáticas:** 12 tarjetas (27.3%)
- **Ciencias:** 12 tarjetas (27.3%)
- **Sociales:** 11 tarjetas (25.0%)
- **Inglés:** 5 tarjetas (11.4%)
- **Lenguaje:** 4 tarjetas (9.1%)

### Contenido Pedagógico:
- ✅ **Con ejemplo:** 36 tarjetas (81.8%)
- ✅ **Con misconception:** 44 tarjetas (100%)
- ✅ **Con hint:** 44 tarjetas (100%)
- ✅ **Con visual sugerido:** 44 tarjetas (100%)

### Tipos de Tarjeta:
- **basic:** 44 tarjetas (100%)
- **corrective:** 0 (pendiente Fase 2)
- **hint:** 0 (pendiente Fase 2)
- **reflective:** 0 (pendiente Fase 2)

---

## 🧠 Sistema de Decisión de Tuko

### Cuándo Mostrar Tarjetas:

#### 🔴 BLOQUEO (STUCK)
**Se activa cuando:**
- 2+ intentos incorrectos
- Tiempo alto sin respuesta
- Respuesta vacía

**→ Acción:** Mostrar tarjeta `basic`

#### 🟡 ERROR CONCEPTUAL
**Se activa cuando:**
- Respuesta incorrecta con patrón específico
- Ejemplo: multiplica en vez de dividir

**→ Acción:** Mostrar tarjeta `corrective`

#### 🔵 EXPLORACIÓN ACTIVA
**Se activa cuando:**
- Usuario pide ayuda
- Duda sin fallar

**→ Acción:** Mostrar tarjeta `hint`

#### 🟢 FLUJO CORRECTO
**Se activa cuando:**
- Respuestas correctas
- Tiempo adecuado

**→ Acción:** **NO mostrar tarjeta** (mantener silencio)

#### 🟣 MOMENTO DE REFLEXIÓN
**Se activa cuando:**
- Resuelve correctamente
- Hay oportunidad de profundizar

**→ Acción:** Mostrar tarjeta `reflective` (opcional)

---

## 🎨 Regla de Oro de Tarjetas

### Cada tarjeta DEBE tener:
1. **1 idea** (`core_insight`)
2. **1 ejemplo** (`example` JSONB)
3. **1 visual** (`visual_template_key`)

### Lo que NO debe tener:
❌ Mini libros  
❌ Texto largo  
❌ Explicaciones exhaustivas

---

## 🎯 Conceptos Únicos Identificados

### Matemáticas (12):
- fracciones
- proporcionalidad
- ecuaciones
- geometria
- angulos
- area_perimetro
- probabilidad
- estadistica
- decimales
- funciones
- numeros_y_operaciones
- razonamiento_espacial

### Ciencias Naturales (12):
- celula
- fotosintesis
- ecosistema
- cadena_alimenticia
- ciclo_agua
- energia
- fuerza_movimiento
- sistema_respiratorio
- materia
- seres_vivos
- reproduccion
- tierra_universo

### Ciencias Sociales (11):
- mapas
- democracia
- constitucion
- economia
- geografia
- historia
- derechos
- conflicto
- linea_tiempo
- territorio
- participacion

### Lenguaje (4):
- comprension_lectora
- texto_narrativo
- texto_argumentativo
- ortografia

### Inglés (5):
- present_simple
- past_simple
- vocabulary
- reading
- listening

---

## 🎨 Sistema de Visuales Sugeridos

### Mapeo Concepto → Visual:

**Matemáticas:**
- `fracciones` → `fraction_part_whole`
- `ecuaciones` → `equation_balance`
- `proporcionalidad` → `proportional_relationship`
- `funciones` → `function_graph`
- `angulos` → `angle_measurement`

**Ciencias:**
- `celula` → `cell_diagram`
- `fotosintesis` → `photosynthesis_cycle`
- `ecosistema` → `ecosystem_web`
- `cadena_alimenticia` → `food_chain`
- `ciclo_agua` → `water_cycle`

**Sociales:**
- `mapas` → `map_visualization`
- `linea_tiempo` → `timeline`
- `democracia` → `concept_map`
- `constitucion` → `hierarchical_diagram`
- `economia` → `flow_diagram`

**Lenguaje/Inglés:**
- `comprension_lectora` → `reading_strategy`
- `texto_narrativo` → `story_structure`
- `texto_argumentativo` → `argument_structure`
- `present_simple` → `grammar_table`

---

## 🔄 Extracción Multi-Fuente

### Fuentes de Datos Utilizadas:

1. **modules.core_concept** → `concept_key` principal
2. **modules.title + learning_objective** → `title`, `body`, `one_line_definition`
3. **modules.error_map** → `common_misconception`
4. **modules.hints[]** → `hint_prompt`
5. **modules.guided_exercises** → `example` (JSONB estructurado)
6. **modules.concepts[]** → `related_concepts`
7. **module_taxonomy_link** → `taxonomy_ids` (conexión curricular)
8. **curriculum_taxonomy.microtopics** → contexto curricular

---

## 🚀 Funciones SQL Auxiliares

### `kuneo.get_cards_by_type_and_concept(card_type, concept_key)`
Obtiene la tarjeta específica para un concepto y tipo.  
**Usado por:** Motor de decisión de Tuko.

```sql
SELECT * FROM kuneo.get_cards_by_type_and_concept('basic', 'fracciones');
```

### `kuneo.get_related_cards(concept_key, limit)`
Obtiene tarjetas de conceptos relacionados.  
**Usado por:** Sugerir exploración adicional.

```sql
SELECT * FROM kuneo.get_related_cards('fracciones', 3);
```

### `kuneo.concept_cards_with_stats`
Vista enriquecida con estadísticas de módulos y taxonomías.

```sql
SELECT * FROM kuneo.concept_cards_with_stats;
```

---

## 📝 Próximos Pasos

### ✅ Fase 1 - COMPLETADA
- [x] Actualizar schema con 9 campos nuevos
- [x] Crear script de extracción multi-fuente
- [x] Poblar tarjetas `basic` (44 tarjetas)
- [x] Validar carga en Supabase

### 🔄 Fase 2 - Enriquecimiento con LLM
- [ ] Generar definiciones más precisas con OpenAI
- [ ] Crear múltiples tipos de tarjeta por concepto:
  - [ ] `corrective` - para errores conceptuales específicos
  - [ ] `hint` - para exploración activa
  - [ ] `reflective` - para profundización post-éxito
- [ ] Expandir `core_insight` con razonamiento pedagógico
- [ ] Generar ejemplos adicionales estructurados

### 🎯 Fase 3 - Poblar `visual_templates`
- [ ] Crear plantillas visuales para cada `visual_template_key`
- [ ] Diseñar configuraciones JSON por tipo de visual
- [ ] Vincular tarjetas con plantillas visuales

### 🏗️ Fase 4 - Motor de Decisión de Tuko
- [ ] Implementar detector de estados cognitivos:
  - [ ] STUCK (bloqueado)
  - [ ] MISCONCEPTION (error conceptual)
  - [ ] EXPLORING (exploración activa)
  - [ ] PROGRESSING (flujo correcto)
  - [ ] DEEPENING (momento de reflexión)
- [ ] Crear API endpoint: `POST /api/tuko/decide-intervention`
- [ ] Implementar sistema de niveles de intervención (1-3)

### 🧪 Fase 5 - Testing e Iteración
- [ ] Crear casos de prueba por tipo de tarjeta
- [ ] Validar timing de intervenciones
- [ ] Ajustar umbrales de detección
- [ ] A/B testing con usuarios reales

---

## 📚 Archivos Clave

### Scripts:
- `scripts/database/update_concept_cards_table.sql` - Schema update
- `scripts/database/populate_concept_cards.py` - Población de tarjetas

### Documentación:
- `CONCEPT_CARDS_SYSTEM.md` - Este documento
- `UPLOAD_MODULES_GUIDE.md` - Guía general de población
- `TAXONOMY_BACKEND_INTEGRATION.md` - Integración con taxonomías

### Backend:
- `server/modules.js` - Router de módulos (6 endpoints)

---

## 🎓 Filosofía del Sistema

### Lo que hace diferente a Tuko:

**Otros sistemas:**
❌ Explican todo  
❌ Saturan con información  
❌ Intervienen constantemente

**Tuko:**
✅ **Observa** el pensamiento del estudiante  
✅ **Interviene** solo cuando es necesario  
✅ **Desaparece** cuando el estudiante fluye

### Resultado:
> "El estudiante siente que no lo interrumpen, no le dan respuestas, pero nunca queda bloqueado."

---

## 📊 Consultas Útiles

### Ver todas las tarjetas:
```sql
SELECT * FROM kuneo.concept_cards;
```

### Tarjetas por asignatura:
```sql
SELECT subject, COUNT(*) 
FROM kuneo.concept_cards 
GROUP BY subject;
```

### Tarjetas con ejemplo:
```sql
SELECT concept_name, example 
FROM kuneo.concept_cards 
WHERE example IS NOT NULL;
```

### Tarjetas más vinculadas:
```sql
SELECT 
  concept_name,
  COALESCE(array_length(source_module_ids, 1), 0) AS module_count,
  COALESCE(array_length(taxonomy_ids, 1), 0) AS taxonomy_count
FROM kuneo.concept_cards
ORDER BY module_count DESC
LIMIT 10;
```

---

**🎯 "1 idea + 1 ejemplo + 1 visual = 1 tarjeta perfecta"**
