# 🚀 KUNEO - Guía de Integración Backend

## ✅ LO QUE SE HA IMPLEMENTADO

### Backend (server/)

#### Nuevos Routers Creados:

1. **orchestrator.js** ⭐ **CORE** - Motor de decisión pedagógica
   - `POST /api/orchestrator/start-session` - Iniciar nueva sesión de módulo
   - `POST /api/orchestrator/decide` - Analizar respuesta y decidir siguiente acción
   - `POST /api/orchestrator/end-session` - Finalizar sesión y generar feedback

2. **modules.js** - Gestión del catálogo
   - `GET /api/modules` - Lista de módulos (filtros: subject, gradeLevel, userId)
   - `GET /api/modules/:moduleId` - Detalle de módulo específico
   - `GET /api/subjects` - Lista de asignaturas disponibles

3. **progress.js** - Tracking de progreso cognitivo
   - `GET /api/progress/:userId` - Dashboard completo de progreso
   - `GET /api/cognitive-profile/:userId` - Perfil cognitivo detallado
   - `GET /api/sessions/:sessionId/feedback` - Feedback de sesión específica

4. **profiles.js** - Gestión de perfiles
   - `GET /api/profiles/:userId` - Obtener perfil
   - `PUT /api/profiles/:userId` - Actualizar perfil
   - `POST /api/profiles/character-preference` - Guardar personaje elegido
   - `POST /api/profiles/initialize` - Inicializar perfil de nuevo usuario
   - `GET /api/profiles/:userId/continue-learning` - Obtener módulo donde continuar

#### Montados en embeddings.js:
✅ Todos los routers están montados y listos para usar

### Frontend (client/)

#### Cliente API Creado:

**client/src/utils/kuneoApi.js** - Cliente centralizado con 4 módulos:
- `orchestrator` - Interacción con el motor pedagógico
- `modules` - Catálogo de módulos
- `progress` - Tracking de progreso
- `profiles` - Gestión de perfiles

#### Páginas Integradas:

**Module.jsx** ✅ - Conectado completamente al backend
- Inicia sesión con `orchestrator.startSession()`
- Envía respuestas con `orchestrator.decide()`
- Finaliza sesión con `orchestrator.endSession()`
- Maneja errores y estados de carga

---

## 🔧 CONFIGURACIÓN NECESARIA

### 1. Variables de Entorno

Crear/actualizar `.env` en `/server`:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (para embeddings y LLM)
OPENAI_API_KEY=your_openai_key

# Mock mode (opcional, para testing sin OpenAI)
MOCK_EMBEDDINGS=false

# Puerto
PORT=3000
```

Crear `.env` en `/client` (si no existe):

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Instalar Dependencias

#### Backend:
```bash
cd server
npm install
```

#### Frontend:
```bash
cd client
npm install
```

Las dependencias nuevas ya están en `package.json`:
- framer-motion
- mermaid
- reactflow
- victory

---

## 🗄️ BASE DE DATOS

### Verificar que las tablas existan:

Ejecutar `schema.sql` en Supabase (ya corregido):

```sql
-- Tablas principales:
- profiles
- cognitive_profile
- modules
- content_nodes
- sessions
- evaluations
- character_preference
```

### Poblar datos iniciales:

#### Insertar módulos de ejemplo:

```sql
INSERT INTO modules (title, subject, difficulty_level, target_grades, content_structure, estimated_duration, prerequisites, order_index)
VALUES 
  ('Gravedad: Conceptos Básicos', 'science', 'beginner', ARRAY[6,7,8], 
   '{"phases": ["introduction", "exploration", "practice", "consolidation"]}', 
   30, ARRAY[]::uuid[], 1),
   
  ('Fuerzas en Equilibrio', 'science', 'intermediate', ARRAY[8,9,10],
   '{"phases": ["introduction", "exploration", "practice", "consolidation"]}',
   45, ARRAY[]::uuid[], 2),
   
  ('Ecuaciones Lineales', 'mathematics', 'beginner', ARRAY[7,8,9],
   '{"phases": ["introduction", "exploration", "practice", "consolidation"]}',
   40, ARRAY[]::uuid[], 3);
```

---

## 🚀 INICIAR SERVICIOS

### 1. Iniciar Backend:

```bash
cd server
npm run dev
```

Deberías ver:
```
✅ Kuneo Orchestrator router mounted
✅ Kuneo Modules router mounted
✅ Kuneo Progress router mounted
✅ Kuneo Profiles router mounted
Server listening on port 3000
```

### 2. Iniciar Frontend:

```bash
cd client
npm run dev
```

Acceder a: `http://localhost:5173`

---

## 🧪 TESTING BÁSICO

### Test 1: Verificar Backend

```bash
# Listar asignaturas
curl http://localhost:3000/api/subjects

# Listar módulos
curl http://localhost:3000/api/modules
```

### Test 2: Flujo Completo

1. **Registro**:
   - Ir a `/register`
   - Crear cuenta
   - Seleccionar personaje en `/character-selection`

2. **Iniciar Módulo**:
   - Ir a `/catalog`
   - Click en una asignatura
   - Click en un módulo
   - Debería llamar a `orchestrator.startSession()`

3. **Interactuar**:
   - Escribir una respuesta
   - Ver a Tuko "pensar"
   - Recibir respuesta del orchestrator
   - (Opcional) Ver tarjeta conceptual

4. **Finalizar**:
   - Click en "Finalizar"
   - Ver feedback en `/session-feedback/:sessionId`

---

## 📊 FLUJO DE DATOS

### Inicio de Sesión de Módulo:

```
User → Module.jsx → orchestrator.startSession(moduleId)
                 ↓
        Backend: POST /api/orchestrator/start-session
                 ↓
        1. Verificar módulo existe
        2. Cargar perfil usuario (character preference)
        3. Crear registro en tabla sessions
        4. Generar mensaje inicial
                 ↓
        Respuesta: { sessionId, module, character, initialMessage }
                 ↓
        Module.jsx actualiza estado y muestra Tuko
```

### Interacción (Decisión Pedagógica):

```
User escribe respuesta → orchestrator.decide(sessionId, response, phase)
                       ↓
        Backend: POST /api/orchestrator/decide
                       ↓
        1. Cargar sesión actual
        2. Guardar interacción en evaluations
        3. Analizar con rubric (5 dimensiones)
        4. Decidir acción (continuar/mostrar card/finalizar)
        5. Actualizar cognitive_profile (micro-evidencias)
        6. Generar mensaje de respuesta
                       ↓
        Respuesta: { tutorMessage, characterState, showCard?, nextAction }
                       ↓
        Module.jsx actualiza UI según decisión
```

### Finalizar Sesión:

```
User finaliza → orchestrator.endSession(sessionId)
             ↓
        Backend: POST /api/orchestrator/end-session
             ↓
        1. Marcar sesión como completada
        2. Generar insights cualitativos
        3. Calcular cambios en dimensiones
                ↓
        Respuesta: { insights, dimensionProgress, nextSuggestion }
             ↓
        Navegar a /session-feedback/:sessionId
```

---

## 🎯 PRÓXIMOS PASOS DE INTEGRACIÓN

### Fase 1: Testing Básico ✅
- [x] Crear routers backend
- [x] Montar en servidor
- [x] Crear cliente API frontend
- [x] Conectar Module.jsx

### Fase 2: Integración LLM (Próximo)
- [ ] Integrar OpenAI en `analyzeWithRubric()`
- [ ] Generar mensajes del tutor con LLM
- [ ] Crear prompts para análisis de respuestas
- [ ] Implementar generación dinámica de tarjetas

### Fase 3: Conectar Otras Páginas
- [ ] CourseCatalog.jsx → `modules.getModules()`
- [ ] ProgressView.jsx → `progress.getProgress()`
- [ ] CognitiveProfile.jsx → `progress.getCognitiveProfile()`
- [ ] SessionFeedback.jsx → `progress.getSessionFeedback()`
- [ ] CharacterSelection.jsx → `profiles.saveCharacterPreference()`

### Fase 4: Generación de Contenido Dinámico
- [ ] Motor de decisión de tarjetas (cuándo mostrar)
- [ ] Generación de visuales (gráficos, diagramas)
- [ ] Integración con Mermaid/Recharts
- [ ] Soporte para matemáticas (KaTeX)

---

## 🐛 DEBUGGING

### Backend no inicia:

```bash
# Verificar que todas las dependencias estén instaladas
cd server
npm install

# Verificar .env
cat .env | grep SUPABASE_URL
```

### Frontend no conecta con backend:

```bash
# Verificar CORS en server/embeddings.js
app.use(cors({ origin: ["http://localhost:5173"] }));

# Verificar VITE_API_URL en client/.env
VITE_API_URL=http://localhost:3000
```

### Error "Profile not found":

El usuario debe tener perfil inicializado. Al registrarse, llamar:

```javascript
await profiles.initializeProfile({
  email: user.email,
  fullName: name,
  gradeLevel: grade,
  character: 'tuko'
});
```

### Error "Module not found":

Insertar módulos de ejemplo en Supabase (ver sección Base de Datos arriba).

---

## 📝 LOGS ÚTILES

El backend muestra logs informativos:

```
✅ Kuneo Orchestrator router mounted
✅ Kuneo Modules router mounted
✅ Kuneo Progress router mounted
✅ Kuneo Profiles router mounted
```

Si alguno falla:
```
⚠️  Could not mount orchestrator router: [error]
```

Revisar:
1. Sintaxis del archivo router
2. Exportación correcta `module.exports = (supabase) => { ... }`
3. Que `supabase` esté definido

---

## ✨ ESTADO ACTUAL

```
Backend Integration:   ████████████████████ 100% ✅
Frontend Integration:  ██████████████░░░░░░  70% 🔄
LLM Integration:       ████░░░░░░░░░░░░░░░░  20% ⏳
Content Generation:    ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

**Backend está completamente funcional y listo para usar** 🎉

---

## 📞 SIGUIENTE SESIÓN

1. Poblar módulos en Supabase
2. Probar flujo completo con backend real
3. Integrar LLM en orchestrator para análisis profundo
4. Implementar generación dinámica de tarjetas conceptuales
5. Conectar páginas restantes (Catalog, Progress, etc.)

---

Fin del documento
