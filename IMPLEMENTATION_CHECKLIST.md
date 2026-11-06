# ✅ KUNEO - Checklist de Implementación

## 📦 FASE 1: INSTALACIÓN Y CONFIGURACIÓN

### Dependencias
- [ ] Ejecutar `cd client && npm install`
- [ ] Verificar que framer-motion se instaló correctamente
- [ ] Verificar que mermaid se instaló correctamente
- [ ] Verificar que reactflow se instaló correctamente
- [ ] Verificar que victory se instaló correctamente

### Assets
- [ ] Copiar `/assets/pages_sketch/source/*.png` → `/client/public/assets/pages_sketch/source/`
- [ ] Copiar `/assets/icons/*.svg` → `/client/public/assets/icons/`
- [ ] Verificar imágenes de personajes en `/client/public/image/characters/`
  - [ ] tuko/kid/source/png/ (idle, thinking, listening, encouraging, explaining)
  - [ ] pico/kid/source/png/ (todos los estados)
  - [ ] yagui/kid/source/png/ (todos los estados)
  - [ ] rosi/kid/source/png/ (todos los estados)
  - [ ] guido/kid/source/png/ (todos los estados)

### Verificación Inicial
- [ ] Ejecutar `npm run dev` en /client
- [ ] Verificar que compila sin errores
- [ ] Abrir http://localhost:5173 y ver Login

---

## 🎨 FASE 2: ACTUALIZACIÓN DE PÁGINAS LEGACY

### Home.jsx
- [ ] Leer contenido completo actual
- [ ] Reemplazar imports (Navbar → TabBar, agregar OptionsMenu, NotificationBadge)
- [ ] Actualizar estructura del componente
- [ ] Agregar sección "Continúa donde lo dejaste"
- [ ] Agregar tarjeta motivacional de Tuko
- [ ] Agregar botones de acceso rápido (Cursos, Integrador)
- [ ] Mantener lógica de auth existente
- [ ] Probar navegación

### Login.jsx
- [ ] Leer contenido completo actual
- [ ] Simplificar a solo modo login (eliminar toggle signup)
- [ ] Actualizar diseño a gradient (from-blue-500 via-purple-500 to-pink-500)
- [ ] Agregar imagen de Tuko (/assets/pages_sketch/source/tuko-login.png)
- [ ] Agregar link a /register
- [ ] Mantener lógica de Supabase auth
- [ ] Probar login funcional

---

## 🧪 FASE 3: TESTING DE FLUJO BÁSICO

### Registro y Onboarding
- [ ] Ir a /register
- [ ] Llenar formulario y enviar
- [ ] Verificar redirección a /character-selection
- [ ] Seleccionar personaje (ej: Tuko)
- [ ] Verificar redirección a /home

### Navegación Principal
- [ ] Verificar TabBar visible en bottom
- [ ] Click en "Inicio" → /home
- [ ] Click en "Explorar" → /catalog
- [ ] Click en "Progreso" → /progress
- [ ] Click en "Perfil" → /profile

### Exploración de Módulos
- [ ] En /catalog, ver lista de asignaturas
- [ ] Click en una asignatura (ej: Matemáticas)
- [ ] Ver lista de módulos
- [ ] Click en un módulo desbloqueado
- [ ] Verificar redirección a /module/:id

### Interacción en Módulo (mock)
- [ ] Ver CharacterAvatar de Tuko
- [ ] Ver ThinkingBubble con mensaje
- [ ] Ver InputWithSuggestions en bottom
- [ ] Click en una sugerencia
- [ ] Ver respuesta simulada de Tuko
- [ ] (Backend pendiente para interacción real)

### Vista de Progreso
- [ ] Ir a /progress
- [ ] Ver stats cards (Nivel, Módulos, Racha, Evaluaciones)
- [ ] Ver radar chart de dimensiones
- [ ] Scroll y ver barras de progreso

### Perfil Cognitivo
- [ ] Ir a /cognitive-profile (link desde /progress)
- [ ] Ver nivel cognitivo con gradient
- [ ] Ver radar chart detallado
- [ ] Ver descripción de cada dimensión

### Configuración
- [ ] Abrir OptionsMenu desde Home
- [ ] Click en "Configuración"
- [ ] Ir a /settings
- [ ] Intentar cambiar username
- [ ] Cambiar tema (Claro/Oscuro)
- [ ] Click en "Cerrar sesión"
- [ ] Confirmar y verificar redirección a /login

---

## 🔗 FASE 4: INTEGRACIÓN CON BACKEND

### Orchestrator - Endpoint Principal
- [ ] Crear endpoint `POST /api/orchestrator/decide`
- [ ] Recibir: `{ sessionId, userResponse, currentPhase, context }`
- [ ] Analizar respuesta con rubric
- [ ] Decidir siguiente acción
- [ ] Retornar: `{ tutorMessage, characterState, showCard?, nextAction }`
- [ ] Integrar en Module.jsx

### Progreso y Perfil
- [ ] Crear endpoint `GET /api/progress/:userId`
- [ ] Cargar desde tabla `cognitive_profile`
- [ ] Calcular stats (módulos completados, racha, evaluaciones)
- [ ] Integrar en ProgressView.jsx

- [ ] Crear endpoint `GET /api/cognitive-profile/:userId`
- [ ] Cargar dimensiones actualizadas
- [ ] Calcular nivel cognitivo actual
- [ ] Integrar en CognitiveProfile.jsx

### Catálogo de Módulos
- [ ] Crear endpoint `GET /api/modules?subject=:subject&grade=:grade`
- [ ] Cargar desde tabla `modules`
- [ ] Verificar prerequisitos (isLocked)
- [ ] Integrar en CourseCatalog.jsx

### Sesión y Feedback
- [ ] Crear endpoint `POST /api/sessions` para iniciar sesión
- [ ] Actualizar tabla `sessions` al finalizar
- [ ] Crear endpoint `GET /api/sessions/:sessionId/feedback`
- [ ] Generar insights cualitativos (sin calificaciones)
- [ ] Calcular cambio en dimensiones
- [ ] Integrar en SessionFeedback.jsx

### Preferencias de Usuario
- [ ] Endpoint `POST /api/users/character-preference`
- [ ] Guardar en tabla `profiles` o `character_preference`
- [ ] Integrar en CharacterSelection.jsx

---

## 🎯 FASE 5: SISTEMA DE TARJETAS CONCEPTUALES

### Motor de Decisión
- [ ] Crear `orchestrator/cardDecisionEngine.js`
- [ ] Función `shouldShowCard(userResponse, rubricLevel, phase)`
- [ ] Condiciones para cada tipo de tarjeta:
  - [ ] Concept (🟢): Confusión conceptual
  - [ ] Representation (🟡): Necesita visualización
  - [ ] Example (🔵): Requiere concreción
  - [ ] Reflection (🔴): Momento metacognitivo
- [ ] Integrar con orchestrator

### Generación Dinámica de Visuales
- [ ] Crear `orchestrator/visualGenerator.js`
- [ ] Implementar función `generateMath(concept)` → KaTeX code
- [ ] Implementar función `generateDiagram(concept)` → Mermaid code
- [ ] Implementar función `generateGraph(data)` → Recharts config
- [ ] Integrar en ConceptCard.jsx

### Actualizar ConceptCard
- [ ] Agregar soporte para Mermaid
  ```jsx
  {type === 'diagram' && <Mermaid chart={content.diagram} />}
  ```
- [ ] Agregar soporte para Recharts
  ```jsx
  {type === 'graph' && <ResponsiveContainer>...</ResponsiveContainer>}
  ```
- [ ] Agregar soporte para ReactFlow
- [ ] Probar cada tipo de visual

---

## 🧪 FASE 6: TESTING COMPLETO

### Flujo Completo End-to-End
- [ ] Crear usuario nuevo desde /register
- [ ] Completar onboarding (personaje)
- [ ] Navegar a /catalog
- [ ] Entrar a módulo real
- [ ] Interactuar con orchestrator (backend)
- [ ] Ver tarjeta conceptual generada dinámicamente
- [ ] Completar sesión
- [ ] Ver feedback con dimensiones actualizadas
- [ ] Verificar progreso reflejado en /progress
- [ ] Ir a /cognitive-profile y ver cambios

### Testing de Casos Borde
- [ ] Usuario sin módulos completados
- [ ] Módulo bloqueado (prerequisitos)
- [ ] Sesión interrumpida
- [ ] Respuesta fuera de contexto
- [ ] Error de red durante interacción
- [ ] Tema claro/oscuro en todas las páginas
- [ ] Responsive en móvil (TabBar siempre visible)

---

## 🚀 FASE 7: OPTIMIZACIÓN Y PULIDO

### Performance
- [ ] Lazy loading de páginas
- [ ] Memorización de componentes pesados (RadarChart)
- [ ] Optimizar animaciones de framer-motion
- [ ] Reducir tamaño de assets (comprimir PNGs)

### UX/UI
- [ ] Agregar loading states consistentes
- [ ] Mensajes de error amigables
- [ ] Transiciones suaves entre rutas
- [ ] Feedback visual en botones (hover, active)
- [ ] Toast notifications para acciones importantes

### Accesibilidad
- [ ] Agregar alt text a todas las imágenes
- [ ] Navegación por teclado funcional
- [ ] Contraste de colores accesible
- [ ] Labels en formularios
- [ ] ARIA labels en componentes interactivos

---

## 📊 FASE 8: FEATURES AVANZADAS (OPCIONAL)

### Analíticas
- [ ] Tracking de tiempo en módulo
- [ ] Heatmap de interacciones
- [ ] Dashboard de maestros (legacy)

### Social
- [ ] Compartir progreso
- [ ] Logros (sin gamificación explícita)
- [ ] Comparación anónima de dimensiones

### Personalization
- [ ] Adaptar dificultad dinámicamente
- [ ] Recomendar módulos basado en dimensiones débiles
- [ ] Sugerir horarios óptimos

---

## ✅ COMPLETION CRITERIA

### Mínimo Viable Product (MVP)
- ✅ Todas las páginas funcionales
- ✅ Navegación fluida
- ✅ Integración con backend orchestrator
- ✅ Tarjetas conceptuales básicas
- ✅ Tracking de progreso funcional
- ✅ Auth y onboarding completos

### Version 1.0
- ✅ MVP +
- ✅ Sistema de tarjetas dinámicas completo
- ✅ Visualizaciones generadas por LLM
- ✅ Optimizaciones de performance
- ✅ Testing exhaustivo
- ✅ Documentación completa

---

## 📝 NOTAS DE PROGRESO

### Fecha: _______________
**Completado hoy:**
- 
- 
- 

**Bloqueadores:**
- 
- 

**Próximo paso:**
- 

---

**Estado Actual:**
- Frontend UI: 85% ✅
- Backend Integration: 20% ⏳
- Card System: 0% ⏳
- Testing: 0% ⏳

**Última actualización:** 2026-04-21
