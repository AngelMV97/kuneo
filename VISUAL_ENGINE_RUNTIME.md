# 🎨 Visual Engine Runtime - Sistema de Renderizado Dinámico

## 📊 Estado Actual

**✅ MVP COMPLETADO** - Runtime básico funcional con 3 renderers

---

## 🎯 Objetivo

Renderizar dinámicamente visuales desde `visual_templates` enriquecidos con overlays, animaciones e interacciones adaptativas.

```
concept_card.visual_template_key
↓
visual_template.config + enriched_config
↓
VisualEngine
↓
Renderer adecuado (svg_custom, recharts, timeline)
↓
Overlay según misconception/card_variant
↓
Visual adaptativo en pantalla
```

---

## 🏗️ Arquitectura

```
client/src/visual-engine/
├── VisualEngine.jsx              [Orquestador principal]
├── VisualRenderer.jsx             [Router de renderers]
├── OverlayManager.jsx             [Gestión de overlays]
├── renderers/
│   ├── SvgCustomRenderer.jsx      [SVG personalizados]
│   ├── RechartsRenderer.jsx       [Gráficas matemáticas]
│   └── TimelineRenderer.jsx       [Líneas de tiempo]
├── hooks/
│   └── useVisualTemplate.js       [Carga desde Supabase]
├── utils/
│   ├── visualConfigNormalizer.js  [Normalización de configs]
│   └── rendererMapper.js          [Mapeo de renderers]
└── index.js                       [Exportaciones]
```

---

## 🚀 Uso

### Básico

```jsx
import { VisualEngine } from './visual-engine';

<VisualEngine
  visualTemplateKey="fraction_part_whole"
  cardVariant="basic"
  cognitiveType="representacion"
/>
```

### Con Overlay de Misconception

```jsx
<VisualEngine
  visualTemplateKey="equation_balance"
  cardVariant="corrective"
  cognitiveType="analisis_de_error"
  misconceptionKey="confunde_numerador_denominador"
  showCaption={true}
  showOverlay={true}
/>
```

### En ConceptCard

```jsx
import ConceptCard from './components/ConceptCard';

<ConceptCard
  type="representation"
  title="¿Qué es una fracción?"
  content="Una fracción representa partes de un todo..."
  visualTemplateKey="fraction_part_whole"
  cardVariant="hint"
  misconceptionKey="no_cuenta_todas_las_partes"
  insight="El denominador siempre indica el total de partes"
/>
```

---

## 📦 Componentes

### 1. VisualEngine.jsx

**Responsabilidad:** Orquestador principal del sistema

**Props:**
- `visualTemplateKey` (string, requerido): template_key del visual
- `cardVariant` (string): basic | hint | corrective | reflective | deepening
- `cognitiveType` (string): representacion | analisis_de_error | metacognicion
- `misconceptionKey` (string): Key del misconception específico
- `showCaption` (boolean): Mostrar caption pedagógico
- `showOverlay` (boolean): Mostrar overlay adaptativo

**Flujo:**
1. Usa `useVisualTemplate` para cargar template
2. Normaliza config + enriched_config
3. Llama a `VisualRenderer`
4. Gestiona overlays con `OverlayManager`
5. Renderiza caption y accessibility text

---

### 2. VisualRenderer.jsx

**Responsabilidad:** Router de renderers según `visual.renderer`

**Renderers Soportados (MVP):**
- ✅ `svg_custom` → SvgCustomRenderer
- ✅ `recharts` → RechartsRenderer
- ✅ `timeline` → TimelineRenderer

**Post-MVP:**
- ⏳ `react_flow` → ReactFlowRenderer
- ⏳ `concept_map` → ConceptMapRenderer
- ⏳ `mermaid` → MermaidRenderer

---

### 3. SvgCustomRenderer.jsx

**Responsabilidad:** Renderiza SVG personalizados

**Soporte:**
- Fracciones (círculo/rectángulo dividido)
- Geometría (ángulos, formas)
- Ecuaciones (balance, comparación)
- Genérico (placeholder)

**Config:**
```json
{
  "shape": "circle",
  "parts": 4,
  "highlighted": 1,
  "colors": ["#3B82F6", "#E5E7EB"],
  "labels": true
}
```

---

### 4. RechartsRenderer.jsx

**Responsabilidad:** Renderiza gráficas matemáticas

**Tipos soportados:**
- Line chart (proporciones, funciones)
- Bar chart (comparaciones, estadística)
- Scatter chart (distribuciones)

**Config:**
```json
{
  "chart_type": "line",
  "data": [
    {"x": 0, "y": 0},
    {"x": 1, "y": 2},
    {"x": 2, "y": 4}
  ],
  "x_label": "X",
  "y_label": "Y",
  "show_grid": true
}
```

---

### 5. TimelineRenderer.jsx

**Responsabilidad:** Renderiza líneas de tiempo

**Orientaciones:**
- Vertical (por defecto)
- Horizontal

**Config:**
```json
{
  "orientation": "vertical",
  "events": [
    {
      "label": "Evento 1",
      "description": "Descripción breve",
      "date": "2024-01-15"
    }
  ]
}
```

---

### 6. OverlayManager.jsx

**Responsabilidad:** Decide qué overlay mostrar

**Prioridad:**
1. Misconception overlay (si hay `misconceptionKey`)
2. Overlay por `cardVariant` (corrective, hint, etc.)
3. Explanation overlay (fallback)
4. Ninguno

**Tipos de overlay:**
- 🚨 Misconception (rojo): Error específico detectado
- 🔧 Corrective (naranja): Corrección activa
- 💡 Hint (amarillo): Pista para guiar
- ℹ️ Explanation (azul): Explicación general
- 🤔 Reflective (morado): Reflexión metacognitiva

---

### 7. useVisualTemplate Hook

**Responsabilidad:** Cargar template desde Supabase

**Returns:**
```js
{
  template: object | null,
  loading: boolean,
  error: string | null
}
```

**Uso:**
```jsx
const { template, loading, error } = useVisualTemplate("fraction_part_whole");
```

---

## 🎨 Renderers Detallados

### SvgCustomRenderer - Casos de Uso

#### Fracciones
```jsx
// template_key: "fraction_part_whole"
<SvgCustomRenderer 
  visual={{
    templateKey: "fraction_part_whole",
    config: {
      shape: "circle",
      parts: 4,
      highlighted: 1,
      colors: ["#3B82F6", "#E5E7EB"]
    }
  }}
/>
```

**Resultado:** Círculo dividido en 4 partes, 1 resaltada

---

#### Geometría (Ángulos)
```jsx
// template_key: "angle_measurement"
<SvgCustomRenderer 
  visual={{
    templateKey: "angle_measurement",
    config: {
      angle: 45,
      showProtractor: true,
      showDegrees: true
    }
  }}
/>
```

**Resultado:** Ángulo de 45° con transportador opcional

---

#### Ecuaciones (Balance)
```jsx
// template_key: "equation_balance"
<SvgCustomRenderer 
  visual={{
    templateKey: "equation_balance",
    config: {
      leftSide: "x + 3",
      rightSide: "7",
      showBalance: true
    }
  }}
/>
```

**Resultado:** Balance visual de ecuación

---

### RechartsRenderer - Casos de Uso

#### Relaciones Proporcionales
```jsx
// template_key: "proportional_relationship"
<RechartsRenderer 
  visual={{
    config: {
      chart_type: "line",
      data: [
        {x: 0, y: 0},
        {x: 1, y: 3},
        {x: 2, y: 6},
        {x: 3, y: 9}
      ],
      x_label: "Cantidad",
      y_label: "Precio"
    }
  }}
/>
```

**Resultado:** Gráfica lineal mostrando proporcionalidad

---

#### Comparación de Datos
```jsx
// template_key: "data_visualization"
<RechartsRenderer 
  visual={{
    config: {
      chart_type: "bar",
      data: [
        {x: "A", y: 4},
        {x: "B", y: 7},
        {x: "C", y: 3}
      ]
    }
  }}
/>
```

**Resultado:** Gráfica de barras comparativa

---

### TimelineRenderer - Casos de Uso

#### Proceso Histórico
```jsx
// template_key: "timeline"
<TimelineRenderer 
  visual={{
    config: {
      orientation: "vertical",
      events: [
        {
          label: "Independencia",
          description: "Colombia se independiza de España",
          date: "1810"
        },
        {
          label: "República",
          description: "Formación de la Gran Colombia",
          date: "1819"
        }
      ]
    }
  }}
/>
```

**Resultado:** Timeline vertical con conectores

---

## 🔧 Utils

### visualConfigNormalizer.js

Normaliza `config` + `enriched_config` en un objeto unificado:

```js
{
  templateKey: string,
  renderer: string,
  visualType: string,
  config: object,
  enrichedConfig: object,
  caption: string,
  mainQuestion: string,
  labels: object,
  overlays: object,
  animationSteps: array,
  interactionRules: object,
  usageByCardType: object
}
```

---

### rendererMapper.js

Mapea y valida renderers soportados:

```js
SUPPORTED_RENDERERS = {
  svg_custom: "SvgCustomRenderer",
  recharts: "RechartsRenderer",
  timeline: "TimelineRenderer"
}

isRendererSupported(renderer) // boolean
getRendererName(renderer)     // string
getSupportedRenderersList()   // array
```

---

## 🎯 Estados del VisualEngine

### 1. Loading
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-white/10 rounded" />
  <div className="h-48 bg-white/10 rounded mt-4" />
</div>
```

### 2. Error
```jsx
<div className="bg-red-500/10 border-red-500/20 p-4 rounded-2xl">
  <p>Error al cargar visual</p>
  <p className="text-xs">{error}</p>
</div>
```

### 3. Renderer No Soportado
```jsx
<div className="bg-yellow-500/10 p-4 rounded-lg">
  <p>Renderer no soportado: react_flow</p>
  <p className="text-xs">Template: hierarchical_diagram</p>
</div>
```

### 4. Success
```jsx
<div className="border-white/10 bg-white/5 rounded-2xl p-4">
  {/* Visual renderizado */}
  {/* Overlay (si aplica) */}
  {/* Caption pedagógico */}
</div>
```

---

## 📚 Demo y Testing

### Página de Demo

Ubicación: `client/src/pages/VisualEngineDemo.jsx`

**Características:**
- Selector de templates (6 ejemplos)
- Selector de card variants (5 tipos)
- Selector de misconceptions (3 ejemplos)
- Preview en vivo
- Snippet de código generado

**Acceso:**
```jsx
import { VisualEngineDemo } from './pages/VisualEngineDemo';

<Route path="/visual-engine-demo" element={<VisualEngineDemo />} />
```

---

## 🔄 Integración con Sistema Existente

### 1. En ConceptCard

```jsx
<ConceptCard
  type="representation"
  title="Fracciones"
  content="Una fracción representa..."
  visualTemplateKey="fraction_part_whole"  // Nuevo
  cardVariant="hint"                        // Nuevo
  misconceptionKey="confunde_numerador"     // Nuevo
  insight="El denominador es el total"
/>
```

### 2. En Module Steps (Futuro)

```jsx
{module_step.concept_cards.map(card => (
  <ConceptCard
    type={card.card_type}
    title={card.title}
    content={card.content}
    visualTemplateKey={card.visual_template_key}
    cardVariant={determineVariant(student.error)}
    misconceptionKey={detectMisconception(student.answer)}
  />
))}
```

---

## 🚦 Roadmap

### ✅ Fase 1 - MVP (COMPLETADO)
- [x] Estructura base del Visual Engine
- [x] useVisualTemplate hook
- [x] VisualRenderer router
- [x] SvgCustomRenderer (fracciones, geometría, ecuaciones)
- [x] RechartsRenderer (line, bar, scatter)
- [x] TimelineRenderer (vertical, horizontal)
- [x] OverlayManager básico
- [x] Integración con ConceptCard
- [x] Página de demo

### 🔄 Fase 2 - Renderers Avanzados
- [ ] ReactFlowRenderer (procesos, diagramas de flujo)
- [ ] ConceptMapRenderer (mapas conceptuales)
- [ ] MermaidRenderer (diagramas de sintaxis)
- [ ] GrammarTableRenderer (tablas comparativas)
- [ ] MapVisualRenderer (mapas geográficos)

### 🔄 Fase 3 - Animaciones
- [ ] AnimationController
- [ ] Reproducción de animation_steps
- [ ] Controles (play, pause, restart, step)
- [ ] Reduced motion support
- [ ] Timing y secuencias

### 🔄 Fase 4 - Interactividad
- [ ] InteractionHandler
- [ ] Hover tooltips
- [ ] Click interactions
- [ ] Drag & drop (opcional)
- [ ] Sliders (opcional)

### 🔄 Fase 5 - Optimización
- [ ] Caching de templates
- [ ] Lazy loading de renderers
- [ ] Offline fallback
- [ ] Performance monitoring
- [ ] Visual analytics

---

## 🔍 Debugging

### Debug Mode

El VisualEngine incluye debug info en desarrollo:

```jsx
<VisualEngine visualTemplateKey="..." />

// Aparece al final del componente:
<details>
  <summary>Debug Info</summary>
  <pre>
    {
      templateKey: "fraction_part_whole",
      renderer: "svg_custom",
      cardVariant: "hint",
      misconceptionKey: "confunde_numerador"
    }
  </pre>
</details>
```

---

## 📝 Convenciones

### Nombres de Props
- `visualTemplateKey` (no `templateKey`, no `visual_key`)
- `cardVariant` (no `variant`, no `card_type`)
- `misconceptionKey` (no `misconception`, no `error_key`)

### Estilos
- Tailwind CSS para todos los componentes
- Dark mode soportado con `dark:` prefix
- Glassmorphism: `bg-white/5 border-white/10`
- Opacidades: `/5`, `/10`, `/20` para capas sutiles

### Responsive
- Todos los renderers son responsive
- Usar `ResponsiveContainer` en Recharts
- `viewBox` en SVG para escalado automático

---

## ⚠️ Limitaciones Actuales (MVP)

1. **Sin animaciones automáticas** - Solo renderizado estático
2. **Sin interacciones avanzadas** - Solo hover tooltips (Recharts)
3. **3 renderers soportados** - Post-MVP: 5 adicionales
4. **Sin lazy loading** - Todos los renderers se cargan al inicio
5. **Sin caching** - Cada render recarga el template
6. **Sin offline support** - Requiere conexión a Supabase

---

## 📊 Métricas de Uso

Para analytics (futuro):

```js
{
  template_key: "fraction_part_whole",
  renderer: "svg_custom",
  card_variant: "hint",
  misconception_detected: "confunde_numerador",
  overlay_shown: true,
  time_viewed: 45000, // ms
  interactions: 3
}
```

---

## 💡 Best Practices

### 1. Siempre usar visualTemplateKey
❌ No hacer:
```jsx
<ConceptCard visual={<MyCustomSVG />} />
```

✅ Hacer:
```jsx
<ConceptCard visualTemplateKey="my_custom_template" />
```

### 2. Proporcionar cardVariant y misconceptionKey
```jsx
<VisualEngine
  visualTemplateKey="..."
  cardVariant={determineVariant(studentError)}
  misconceptionKey={detectMisconception(studentAnswer)}
/>
```

### 3. Habilitar caption y overlay
```jsx
<VisualEngine
  visualTemplateKey="..."
  showCaption={true}   // Pedagogical explanation
  showOverlay={true}   // Adaptive feedback
/>
```

### 4. Testing con VisualEngineDemo
Antes de usar en producción, probar en `/visual-engine-demo`

---

## 🔗 Referencias

- **visual_templates** en Supabase: 23 templates enriquecidos
- **enriched_config** schema: `pedagogical_foundations/schemas/visual_enriched_config.schema.json`
- **Recharts docs**: https://recharts.org
- **Framer Motion**: https://www.framer.com/motion/
- **Tailwind CSS**: https://tailwindcss.com

---

**🎨 "El visual NO decide qué mostrar. El Adaptive Engine decide. El Visual Engine solo ejecuta."**
