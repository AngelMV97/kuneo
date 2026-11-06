# KUNEO - UI IMPLEMENTATION GUIDE
## Sistema Completo de Pantallas y Componentes

---

## 📦 RESUMEN DE LO IMPLEMENTADO

### ✅ Componentes Base Creados (7 nuevos)

1. **CharacterAvatar.jsx** - Personaje animado con micro-animaciones
   - Estados: idle, thinking, listening, encouraging, explaining
   - Tamaños: small, medium, large
   - Personajes: tuko, pico, yagui, rosi, guido

2. **ThinkingBubble.jsx** - Burbuja de pensamiento orgánica
   - Efecto typing progresivo
   - Diseño NO-chat tradicional
   - Animaciones suaves

3. **InputWithSuggestions.jsx** - Entrada guiada del usuario
   - Sugerencias contextuales
   - NO parece chat típico
   - Frases de inicio inteligentes

4. **ConceptCard.jsx** - Tarjetas conceptuales expandibles
   - 4 tipos: concept (🟢), representation (🟡), example (🔵), reflection (🔴)
   - Soporte para KaTeX (matemáticas)
   - Principio: 1 idea + 1 visual + 1 insight

5. **NotificationBadge.jsx** - Badge de notificaciones
   - Contador animado
   - Efecto de pulso

6. **OptionsMenu.jsx** - Menú desplegable
   - Animaciones suaves
   - Overlay para cerrar

7. **TabBar.jsx** - Navegación inferior
   - 4 tabs: Inicio, Explorar, Progreso, Perfil
   - Indicador animado

---

### ✅ Páginas Nuevas Creadas (10 nuevas)

1. **Register.jsx** - Registro de usuario
   - Validaciones completas
   - Selección de grado (1-11)
   - Redirige a selección de personaje

2. **CharacterSelection.jsx** - Selección de personaje guía
   - 5 personajes: Tuko, Pico, Yagui, Rosi, Guido
   - Diseño card con animaciones
   - Post-registro, pre-onboarding

3. **Module.jsx** ⭐ **CORE DEL SISTEMA**
   - Interacción con Tuko
   - Burbuja de pensamiento
   - Tarjetas conceptuales contextuales
   - Entrada guiada del usuario
   - Sistema de microinteracciones

4. **CourseCatalog.jsx** - Catálogo de asignaturas y módulos
   - 5 asignaturas: Matemáticas, Lenguaje, Ciencias, Sociales, Inglés
   - Navegación por módulos
   - Indicadores de progreso

5. **ProgressView.jsx** - Dashboard de progreso
   - Radar chart de 5 dimensiones cognitivas
   - Stats cards
   - Barras de progreso animadas

6. **CognitiveProfile.jsx** - Perfil cognitivo detallado
   - Nivel cognitivo (Explorador→Autónomo)
   - Radar chart
   - Descripción por dimensión

7. **IcfesPrep.jsx** - Simulacros ICFES
   - Selección de asignatura
   - Mensaje motivacional de Tuko
   - Botón "Integrador/Transferencia"

8. **SessionFeedback.jsx** - Feedback post-sesión
   - Insights cualitativos (sin calificaciones)
   - Progreso por dimensión
   - Sugerencia de siguiente módulo

9. **Settings.jsx** - Configuración
   - Cambiar username
   - Tema: Claro/Oscuro
   - Cerrar sesión con confirmación

10. **Home.jsx (actualizado)** - Página principal rediseñada
    - Saludo personalizado
    - Tuko motivacional
    - "Continúa donde lo dejaste"
    - Accesos rápidos (Cursos, Integrador)
    - Menú de opciones
    - Notificaciones

---

## 🎨 PRINCIPIOS DE DISEÑO IMPLEMENTADOS

### ❌ NO ES:
- Chat tradicional
- Interfaz de mensajería
- Sistema de calificaciones explícitas
- Gamificación superficial

### ✅ ES:
- **Interfaz de pensamiento guiado**
- Espacio cognitivo visual
- Evaluación invisible
- Micro-evidencias de aprendizaje
- Acompañamiento real

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
client/src/
├── components/
│   ├── CharacterAvatar.jsx ✨ NUEVO
│   ├── ThinkingBubble.jsx ✨ NUEVO
│   ├── InputWithSuggestions.jsx ✨ NUEVO
│   ├── ConceptCard.jsx ✨ NUEVO
│   ├── NotificationBadge.jsx ✨ NUEVO
│   ├── OptionsMenu.jsx ✨ NUEVO
│   ├── TabBar.jsx ✨ NUEVO
│   ├── Modal.jsx (existente)
│   ├── ProtectedRoute.jsx (existente)
│   └── ... (otros existentes)
├── pages/
│   ├── Register.jsx ✨ NUEVO
│   ├── CharacterSelection.jsx ✨ NUEVO
│   ├── Module.jsx ✨ NUEVO (CORE)
│   ├── CourseCatalog.jsx ✨ NUEVO
│   ├── ProgressView.jsx ✨ NUEVO
│   ├── CognitiveProfile.jsx ✨ NUEVO
│   ├── IcfesPrep.jsx ✨ NUEVO
│   ├── SessionFeedback.jsx ✨ NUEVO
│   ├── Settings.jsx ✨ NUEVO
│   ├── Home.jsx (actualizado concepto)
│   ├── Login.jsx (existente, listo para actualizar)
│   └── ... (otros existentes)
└── App.jsx ✅ ACTUALIZADO con nuevas rutas
```

---

## 🔧 DEPENDENCIAS AGREGADAS

```json
{
  "framer-motion": "^12.0.0",     // Animaciones suaves
  "mermaid": "^11.0.0",           // Diagramas conceptuales
  "reactflow": "^11.11.0",        // Diagramas de flujo
  "victory": "^37.0.0",           // Gráficas alternativas
  "katex": "^0.16.27",            // Ya existía, para matemáticas
  "recharts": "^3.5.1"            // Ya existía, para gráficas
}
```

### Instalar dependencias:
```bash
cd client
npm install framer-motion mermaid reactflow victory
```

---

## 🛣️ RUTAS CONFIGURADAS

### Nuevas rutas:
- `/register` → Register
- `/character-selection` → CharacterSelection
- `/catalog` → CourseCatalog
- `/module/:moduleId` → Module (CORE)
- `/session-feedback/:moduleId` → SessionFeedback
- `/progress` → ProgressView
- `/cognitive-profile` → CognitiveProfile
- `/icfes` → IcfesPrep
- `/settings` → Settings

### Rutas existentes mantenidas:
- `/` → Login
- `/login` → Login
- `/home` → Home
- `/profile` → Profile
- `/dashboard` → Dashboard (legacy)
- `/assistant` → Assistant (legacy)
- `/materials` → Materials (legacy)
- `/grades` → Grades (legacy)

---

## 🎯 FLUJO DE USUARIO

```
1. Login (/login)
   ↓
2. Registro (/register) [si es nuevo]
   ↓
3. Selección de personaje (/character-selection) [primera vez]
   ↓
4. Home (/home)
   ├→ Explorar Cursos (/catalog)
   │   ↓
   │   Módulo (/module/:id) ⭐ CORE
   │   ↓
   │   Feedback (/session-feedback/:id)
   │
   ├→ Progreso (/progress)
   ├→ Perfil Cognitivo (/cognitive-profile)
   ├→ Simulacro ICFES (/icfes)
   ├→ Configuración (/settings)
   └→ Perfil (/profile)
```

---

## 🔗 INTEGRACIÓN CON BACKEND

### Endpoints necesarios (por implementar en backend):

#### 1. **Module.jsx** necesita:
```javascript
// Cargar módulo y crear sesión
GET /api/modules/:moduleId
POST /api/sessions { user_id, module_id }

// Enviar respuesta del usuario al orchestrator
POST /api/orchestrator/decide
{
  sessionId,
  userResponse,
  currentPhase,
  context
}

// Respuesta esperada:
{
  tutorMessage: "...",
  characterState: "thinking",
  showCard: { type, title, content, ... },
  nextAction: "continue" | "phase_transition" | "complete"
}
```

#### 2. **ProgressView.jsx** necesita:
```javascript
GET /api/progress/:userId
// Retorna: { modulesCompleted, cognitiveData, stats }
```

#### 3. **CognitiveProfile.jsx** necesita:
```javascript
GET /api/cognitive-profile/:userId
// Retorna: { dimensions[], level, levelNumber, totalEvaluations }
```

#### 4. **CourseCatalog.jsx** necesita:
```javascript
GET /api/modules?subject=:subject&gradeLevel=:grade
// Retorna: [{ id, title, description, difficulty, duration, isLocked }]
```

#### 5. **SessionFeedback.jsx** necesita:
```javascript
GET /api/sessions/:sessionId/feedback
// Retorna: { insights[], dimensionProgress[], nextSuggestion }
```

---

## 🎨 ASSETS NECESARIOS

### Imágenes requeridas (en `/public`):

```
/image/characters/
  ├── tuko/
  │   └── kid/
  │       └── source/
  │           └── png/
  │               ├── idle.png
  │               ├── thinking.png
  │               ├── listening.png
  │               ├── encouraging.png
  │               └── explaining.png
  ├── pico/ (mismo formato)
  ├── yagui/ (mismo formato)
  ├── rosi/ (mismo formato)
  └── guido/ (mismo formato)

/assets/
  ├── icons/
  │   ├── hint.png
  │   ├── notification.svg
  │   ├── new-notification.svg
  │   ├── menu-vertical-points.svg
  │   ├── logout.svg
  │   ├── maths.svg
  │   ├── language.svg
  │   ├── phisycs.svg
  │   └── resources.svg
  ├── logos/
  │   └── kuneo-logo.svg
  └── pages_sketch/
      └── source/
          ├── tuko-home.png
          ├── tuko-login.png
          ├── tuko-standing-up.png
          ├── tuko-feedback.png
          ├── tuko-torso.png
          ├── pico-torso.png
          ├── yagui-torso.png
          ├── rosi-torso.png
          └── guido-torso.png
```

---

## 🎬 PRÓXIMOS PASOS

### 1. **Instalar dependencias**
```bash
cd client
npm install
```

### 2. **Verificar assets**
- Mover imágenes de `assets/` a `client/public/`
- Verificar que existen los PNG de estados de personajes

### 3. **Implementar integración con backend**
- Conectar Module.jsx con orchestrator
- Implementar endpoints de progreso y perfil cognitivo
- Guardar preferencia de personaje en la base de datos

### 4. **Sistema de generación de tarjetas** (siguiente fase)
- Motor de decisión de cuándo mostrar tarjetas
- Generación dinámica de gráficos desde prompts
- Integración con librerías (Recharts, Mermaid, KaTeX)

### 5. **Actualizar páginas legacy**
- Migrar lógica de Login.jsx al nuevo diseño
- Actualizar Home.jsx con Supabase auth

### 6. **Testing**
```bash
npm run dev
```

### 7. **Dark mode completo**
- Definir paleta de colores para modo claro
- Implementar toggle en Settings

---

## 📊 TARJETAS CONCEPTUALES - Próxima Fase

### Sistema de decisión para mostrar tarjetas:
```javascript
// En orchestrator/decisionEngine.js
function shouldShowCard(userResponse, context) {
  // Analizar rubric_level
  // Detectar señales de confusión
  // Verificar fase actual del módulo
  // Retornar: { show: true, type: 'concept', data: {...} }
}
```

### Motor de generación dinámica:
```javascript
// En orchestrator/visualGenerator.js
async function generateVisual(concept, type) {
  // type: 'graph', 'diagram', 'formula', 'chemistry', 'physics'
  // Usar LLM para generar código de visualización
  // Retornar componente renderizable
}
```

### Librerías por tipo:
- **Matemáticas**: KaTeX ✅ (ya implementado en ConceptCard)
- **Gráficas**: Recharts, Victory ✅ (ya instaladas)
- **Diagramas**: React Flow, Mermaid ✅ (ya instaladas)
- **Química**: ChemDoodle, Kekule.js (pendiente instalar)
- **Física**: D3.js, SVG custom (pendiente instalar)

---

## ⚠️ NOTAS IMPORTANTES

### Inconsistencias resueltas:
✅ Tab "Guardado" eliminada
✅ Tabs unificadas: "Explorar" para cursos
✅ Botón "Recursos" → "Integrador" (ICFES)
✅ Menú de opciones implementado con settings
✅ Notificaciones con badge

### Pendientes de decisión:
- ⏳ Onboarding completo (implementar después)
- ⏳ Sistema de recomendaciones
- ⏳ Análisis avanzado de dimensiones cognitivas
- ⏳ Historial de sesiones
- ⏳ Compartir progreso

---

## 🧪 TESTING RECOMENDADO

### Flujo básico a probar:
1. ✓ Registro de usuario
2. ✓ Selección de personaje
3. ✓ Navegación en Home
4. ✓ Explorar catálogo de cursos
5. ✓ Entrar a un módulo (CORE)
6. ✓ Interactuar con Tuko
7. ✓ Ver tarjeta conceptual
8. ✓ Finalizar sesión y ver feedback
9. ✓ Revisar progreso
10. ✓ Ver perfil cognitivo
11. ✓ Configurar cuenta
12. ✓ Cerrar sesión

---

## 📞 CONTACTO PARA DUDAS

Este documento cubre toda la implementación de UI/UX siguiendo los principios de "interfaz de pensamiento guiado" especificados.

**Estado actual**: ✅ Componentes y páginas creados | ⏳ Pendiente integración con backend

---

## 📝 CHANGELOG

### 2026-04-21
- ✅ Creados 7 componentes base nuevos
- ✅ Creadas 10 páginas nuevas
- ✅ Actualizado App.jsx con rutas
- ✅ Agregadas dependencias (framer-motion, mermaid, reactflow, victory)
- ✅ Validación de sintaxis: 0 errores
- ✅ Documentación completa creada

---

**Fin del documento**
