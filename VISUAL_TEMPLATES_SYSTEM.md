# 🎨 Sistema de Visual Templates (Plantillas Visuales)

## 📊 Estado Actual

**✅ COMPLETADO - 23 plantillas visuales renderizables pobladas en Supabase**

---

## 🎯 Arquitectura Implementada

```
concept_card.visual_template_key 
  → visual_templates.template_key 
  → renderer (svg_custom, recharts, react_flow, etc.)
  → config JSONB (parámetros para renderizar)
  → frontend renderiza dinámicamente
```

### Filosofía:
> **NO guardar imágenes estáticas** (excepto casos ilustrativos)  
> **SÍ guardar configuración** para que el frontend renderice  
> **Plantillas REUTILIZABLES y PARAMETRIZABLES**

---

## 📊 Resultados de Población

### Estadísticas Generales:
- **Total:** 23 plantillas visuales
- **Tarjetas vinculadas:** 44 concept_cards
- **Tarjetas huérfanas:** 0 (100% vinculación exitosa)

### Por Visual Type:
- **process_diagram:** 8 plantillas (34.8%) - Ciclos, procesos, diagramas
- **math_visual:** 6 plantillas (26.1%) - Fracciones, ecuaciones, geometría
- **concept_map:** 4 plantillas (17.4%) - Mapas conceptuales
- **graph:** 4 plantillas (17.4%) - Funciones, gráficas
- **timeline:** 1 plantilla (4.3%) - Líneas de tiempo

### Por Renderer (Componente Frontend):
- **svg_custom:** 10 plantillas (43.5%) - SVG personalizado
- **react_flow:** 5 plantillas (21.7%) - Diagramas de flujo interactivos
- **recharts:** 4 plantillas (17.4%) - Gráficas matemáticas
- **concept_map:** 2 plantillas (8.7%) - Mapas conceptuales
- **mermaid:** 1 plantilla (4.3%) - Diagramas de sintaxis
- **timeline:** 1 plantilla (4.3%) - Líneas de tiempo

### Por Interaction Level:
- **hoverable:** 10 plantillas (43.5%) - Tooltips al hover
- **static:** 7 plantillas (30.4%) - Solo visualización
- **interactive:** 4 plantillas (17.4%) - Clicks, drag, manipulación
- **animated:** 2 plantillas (8.7%) - Animaciones automáticas

---

## 📋 Estructura de Plantillas

### Campos Implementados:

```sql
visual_templates {
  -- Identificación
  id UUID
  template_key TEXT UNIQUE           -- ej: "fraction_part_whole", "photosynthesis_cycle"
  template_name TEXT                 -- ej: "Fraction Part Whole"
  description TEXT                   -- Descripción del visual
  
  -- Tipo y renderizado
  visual_type TEXT                   -- math_visual | graph | process_diagram | concept_map | timeline
  renderer TEXT                      -- svg_custom | recharts | react_flow | mermaid | timeline | concept_map
  
  -- Configuración (CLAVE DEL SISTEMA)
  config JSONB                       -- Parámetros específicos para renderizar
  default_props JSONB                -- Props por defecto (width, height, theme)
  
  -- Metadata
  subject subject_enum               -- matematicas | ciencias | sociales | lenguaje | ingles
  interaction_level TEXT             -- static | hoverable | interactive | animated
  supported_card_types TEXT[]        -- ['basic', 'hint', 'corrective', 'reflective']
  use_cases TEXT[]                   -- ['explanation', 'example', 'misconception']
  
  -- Opcional
  asset_url TEXT                     -- Solo para ilustraciones no parametrizables
  
  -- Timestamps
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}
```

---

## 🎨 Plantillas Generadas

### Matemáticas (6 plantillas):

**1. fraction_part_whole** (svg_custom, static)
```json
{
  "shape": "circle",
  "parts": 4,
  "highlighted": 1,
  "labels": true,
  "colors": ["#3B82F6", "#E5E7EB"],
  "caption": "Una fracción muestra cuántas partes tomas de un total dividido en partes iguales."
}
```

**2. equation_balance** (svg_custom, interactive)
```json
{
  "showBalance": true,
  "leftSide": "x + 3",
  "rightSide": "7",
  "interactive": true,
  "caption": "Una ecuación es como una balanza: lo que haces a un lado, debes hacerlo al otro."
}
```

**3. angle_measurement** (svg_custom, interactive)
```json
{
  "showProtractor": true,
  "angle": 45,
  "showDegrees": true,
  "interactive": true,
  "caption": "Los ángulos se miden en grados usando un transportador."
}
```

**4. area_comparison** (svg_custom, static)
```json
{
  "shapes": [
    {"type": "rectangle", "width": 4, "height": 3, "color": "#3B82F6"},
    {"type": "square", "side": 4, "color": "#10B981"}
  ],
  "showGrid": true,
  "caption": "El área mide el espacio dentro de una figura."
}
```

**5. proportional_relationship** (recharts, hoverable)
**6. function_graph** (recharts, interactive)

### Ciencias (8 plantillas):

**1. photosynthesis_cycle** (react_flow, hoverable)
```json
{
  "nodes": [
    {"id": "1", "label": "Luz solar", "type": "input"},
    {"id": "2", "label": "CO₂ + H₂O", "type": "input"},
    {"id": "3", "label": "Cloroplasto", "type": "process"},
    {"id": "4", "label": "Glucosa + O₂", "type": "output"}
  ],
  "edges": [
    {"from": "1", "to": "3"},
    {"from": "2", "to": "3"},
    {"from": "3", "to": "4"}
  ],
  "caption": "La fotosíntesis convierte luz en energía química"
}
```

**2. water_cycle** (react_flow, animated)
```json
{
  "nodes": [
    {"id": "1", "label": "Evaporación", "type": "process"},
    {"id": "2", "label": "Condensación", "type": "process"},
    {"id": "3", "label": "Precipitación", "type": "process"},
    {"id": "4", "label": "Escorrentía", "type": "process"}
  ],
  "edges": [
    {"from": "1", "to": "2", "animated": true},
    {"from": "2", "to": "3", "animated": true},
    {"from": "3", "to": "4", "animated": true},
    {"from": "4", "to": "1", "animated": true}
  ],
  "caption": "El agua circula constantemente en la naturaleza"
}
```

**3-8.** cell_diagram, ecosystem_web, food_chain, energy_transformation, force_diagram, body_system_diagram, matter_states

### Sociales (4 plantillas):

**1. map_visualization** (map_visual, interactive)
**2. timeline** (timeline, hoverable)
**3. concept_map** (concept_map, hoverable)
**4. hierarchical_diagram** (react_flow, hoverable)
**5. flow_diagram** (mermaid, static)

### Lenguaje/Inglés (5 plantillas):

**1. reading_strategy** (concept_map, hoverable)
**2. story_structure** (svg_custom, static)
**3. argument_structure** (concept_map, hoverable)
**4. rule_visualization** (grammar_table, static)
**5. grammar_table** (grammar_table, static)

---

## 🔧 Config Generators Implementados

### 1. Math Visual Config
- Formas geométricas parametrizables
- Ecuaciones balanceadas
- Ángulos con transportador
- Comparación de áreas

### 2. Graph Config (Recharts)
- Tipo de gráfica (line, bar, scatter)
- Ejes configurables (labels, min, max)
- Grid y responsividad

### 3. Process Diagram Config (React Flow)
- Nodos tipados (input, process, output)
- Edges con animación opcional
- Layout configurable

### 4. Concept Map Config
- Nodos y relaciones
- Layout jerárquico o radial
- Labels interactivos

### 5. Timeline Config
- Eventos con fechas
- Orientación horizontal/vertical
- Tooltips con detalles

### 6. Grammar Visual Config
- Tablas con columnas configurables
- Highlight de ejemplos
- Comparaciones

### 7. Map Visual Config
- Centro y zoom configurables
- Layers personalizables
- Markers y labels

### 8. Comparison Table Config
- Columnas dinámicas
- Highlight de diferencias
- Captions

---

## 🚀 Funciones SQL Auxiliares

### `kuneo.get_templates_by_renderer(renderer)`
Obtiene todas las plantillas que usan un renderer específico.

```sql
SELECT * FROM kuneo.get_templates_by_renderer('recharts');
```

### `kuneo.validate_card_visual_links()`
Valida que todas las concept_cards tengan visual_templates válidos.

```sql
SELECT * FROM kuneo.validate_card_visual_links();
```

### `kuneo.visual_templates_with_usage`
Vista con conteo de uso por plantilla.

```sql
SELECT * FROM kuneo.visual_templates_with_usage 
ORDER BY usage_count DESC;
```

---

## 🎯 Mapeo Renderer → Librería Frontend

| Renderer | Librería Recomendada | Uso |
|---|---|---|
| `svg_custom` | React SVG nativo | Diagramas personalizados |
| `recharts` | Recharts | Gráficas matemáticas |
| `react_flow` | React Flow | Diagramas de flujo/proceso |
| `mermaid` | Mermaid.js | Diagramas de sintaxis |
| `timeline` | React Vertical Timeline | Líneas de tiempo |
| `concept_map` | React Flow + custom | Mapas conceptuales |
| `grammar_table` | React Table | Tablas de gramática |
| `map_visual` | Leaflet o Mapbox | Mapas geográficos |
| `katex` | KaTeX | Fórmulas matemáticas |

---

## 📝 Próximos Pasos

### ✅ Fase 1 - COMPLETADA
- [x] Actualizar schema con 4 campos nuevos (renderer, default_props, interaction_level, supported_card_types)
- [x] Crear sistema de clasificación inteligente
- [x] Generar 23 plantillas desde 44 concept_cards
- [x] Implementar 8 config generators
- [x] Validar 100% vinculación (0 tarjetas huérfanas)

### 🔄 Fase 2 - Enriquecimiento con LLM
- [ ] Expandir configs con más detalles pedagógicos
- [ ] Generar variantes por tipo de tarjeta (basic, corrective, hint, reflective)
- [ ] Crear overlays para misconceptions
- [ ] Añadir ejemplos interactivos en configs

### 🎨 Fase 3 - Frontend Implementation
- [ ] Crear componentes React para cada renderer
- [ ] Implementar sistema de renderizado dinámico
- [ ] Conectar con concept_cards
- [ ] Testing de interactividad

### 🧪 Fase 4 - Testing e Iteración
- [ ] Validar renderizado en diferentes dispositivos
- [ ] A/B testing de interactividad vs static
- [ ] Optimizar performance de animaciones
- [ ] Ajustar configs según feedback

---

## 📚 Archivos Clave

### Scripts:
- `scripts/database/update_visual_templates_table.sql` - Schema update
- `scripts/database/populate_visual_templates.py` - Población de plantillas

### Documentación:
- `VISUAL_TEMPLATES_SYSTEM.md` - Este documento
- `CONCEPT_CARDS_SYSTEM.md` - Sistema de tarjetas conceptuales
- `UPLOAD_MODULES_GUIDE.md` - Guía general de población

---

## 🔍 Consultas Útiles

### Ver todas las plantillas:
```sql
SELECT * FROM kuneo.visual_templates 
ORDER BY template_name;
```

### Plantillas por renderer:
```sql
SELECT renderer, COUNT(*) 
FROM kuneo.visual_templates 
GROUP BY renderer 
ORDER BY COUNT(*) DESC;
```

### Plantillas interactivas:
```sql
SELECT template_name, visual_type, interaction_level 
FROM kuneo.visual_templates 
WHERE interaction_level IN ('interactive', 'animated');
```

### Plantillas más usadas:
```sql
SELECT * FROM kuneo.visual_templates_with_usage 
ORDER BY usage_count DESC 
LIMIT 10;
```

### Validar vinculación:
```sql
SELECT * FROM kuneo.validate_card_visual_links() 
WHERE NOT has_template;
```

---

## 💡 Reglas de Diseño

### ✅ HACER:
- Guardar config JSONB parametrizable
- Usar renderers estándar (recharts, react_flow)
- Mantener configs mínimos pero funcionales
- Permitir interactividad gradual (static → hoverable → interactive)

### ❌ NO HACER:
- Guardar solo `asset_url` con PNG/JPG
- Crear configs monolíticos no reutilizables
- Hardcodear datos específicos del estudiante
- Mezclar lógica de negocio en config

---

**🎨 "El visual NO es la imagen, es la configuración para generarla"**
