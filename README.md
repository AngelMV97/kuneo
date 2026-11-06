# 🐻 Kuneo - Tutor Pedagógico Socrático

**Aplicación móvil educativa con IA para estudiantes colombianos (Grados 6-11)**

Kuneo es un sistema de tutoría adaptativa que utiliza el método socrático para enseñar matemáticas y ciencias naturales, con un enfoque en preparación para las pruebas ICFES.

---

## 📋 Tabla de Contenido

- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Desarrollo](#-desarrollo)
- [Base de Datos](#-base-de-datos)
- [Despliegue](#-despliegue)

---

## 🏗 Arquitectura

### 3 Capas de Aprendizaje
1. **Capa de Tutor** (Tuko): Interfaz conversacional con IA
2. **Capa de Módulos**: Contenido estructurado por competencias
3. **Capa de ICFES**: Simulacros y práctica intensiva

### Microservicios
```
Mobile/Web Admin → Gateway → Backend → Services → Infrastructure
                       ↓
                  Auth (Supabase)
                  Rate Limiting
```

### Backend Orchestrator
- **tutorEngine.js**: Controlador principal de interacciones
- **decisionEngine.js**: Decide siguiente paso pedagógico
- **promptBuilder.js**: Construye prompts contextuales para LLM
- **stateManager.js**: Gestiona estado de sesiones

### Cognitive Profile System
5 dimensiones rastreadas en tiempo real:
- **Comprensión**: Entendimiento de conceptos fundamentales
- **Representación**: Capacidad de modelar problemas
- **Razonamiento**: Pensamiento lógico y deductivo
- **Transferencia**: Aplicación a nuevos contextos
- **Metacognición**: Reflexión sobre el proceso de aprendizaje

---

## 🛠 Stack Tecnológico

### Backend
- **Node.js** + **Express**: Servidor y API Gateway
- **Supabase** (PostgreSQL + pgvector): Base de datos con búsqueda semántica
- **OpenAI GPT-4o-mini**: Generación de respuestas del tutor
- **OpenAI text-embedding-3-small**: Embeddings para RAG (1536 dimensiones)
- **Tesseract.js**: OCR para PDFs

### Mobile
- **React Native** (Expo): App móvil
- **Lottie**: Animaciones del personaje Tuko
- **React Navigation**: Navegación
- **Zustand**: Gestión de estado

### Web Admin
- **React** + **Vite**: Panel de administración
- **React Router**: Navegación

### Infraestructura
- **Docker**: Contenedores
- **Render/Railway**: Backend hosting
- **Supabase Cloud**: Base de datos y autenticación

---

## 📂 Estructura del Proyecto

```
kuneo/
├── schema.sql                    # ⭐ Base de datos Supabase (ejecutar primero)
│
├── shared/                       # Código compartido
│   ├── contracts/
│   │   └── tutorResponse.js     # Contrato universal de respuestas
│   └── ui-schema/
│       ├── characterStates.js   # Estados de animación de Tuko
│       ├── bubbleTypes.js       # Tipos de burbujas de mensaje
│       └── cardTypes.js         # Tipos de tarjetas UI
│
├── backend/                      # Backend Node.js
│   ├── index.js                 # Entry point
│   ├── package.json
│   ├── .env.template
│   │
│   ├── infrastructure/           # Capa de infraestructura
│   │   ├── db/postgres.js       # Cliente Supabase
│   │   ├── vector/vectorClient.js
│   │   ├── ai/llmClient.js
│   │   ├── ai/embeddingClient.js
│   │   └── ocr/tesseract.js
│   │
│   ├── services/                # Servicios de negocio
│   │   ├── content/contentService.js
│   │   ├── evaluation/evaluationService.js
│   │   ├── progress/progressService.js
│   │   ├── recommendation/recommendationService.js
│   │   └── icfes/icfesService.js
│   │
│   └── orchestrator/            # ⭐ Core del tutor
│       ├── tutorEngine.js       # Orquestador principal
│       ├── decisionEngine.js    # Toma de decisiones pedagógicas
│       ├── promptBuilder.js     # Construcción de prompts
│       └── stateManager.js      # Gestión de sesiones
│
├── gateway/                     # API Gateway
│   ├── package.json
│   ├── .env.template
│   └── src/
│       ├── index.js             # Entry point
│       ├── middleware/
│       │   ├── auth.js          # Autenticación Supabase JWT
│       │   └── ratelimit.js     # Rate limiting
│       └── routes/
│           ├── tutor.js
│           ├── content.js
│           ├── progress.js
│           ├── recommendations.js
│           └── icfes.js
│
├── apps/
│   ├── mobile/                  # React Native (Expo)
│   │   ├── App.js
│   │   ├── app.json             # Expo config
│   │   ├── package.json
│   │   └── src/
│   │       ├── screens/         # Pantallas principales
│   │       │   ├── LoginScreen.jsx
│   │       │   ├── HomeScreen.jsx
│   │       │   ├── LearningScreen.jsx  # ⭐ Pantalla de tutoría
│   │       │   ├── ProfileScreen.jsx
│   │       │   └── ICFESScreen.jsx
│   │       ├── components/      # Componentes UI
│   │       │   ├── TukoCharacter.jsx   # Animación Lottie
│   │       │   ├── MessageBubble.jsx
│   │       │   ├── InputField.jsx
│   │       │   ├── ActionButton.jsx
│   │       │   └── Card.jsx
│   │       ├── engine/
│   │       │   └── renderer.js  # ⭐ Renderiza TutorResponse
│   │       └── services/
│   │           ├── apiClient.js # Cliente HTTP
│   │           └── supabaseClient.js
│   │
│   └── web/                     # Admin panel (React + Vite)
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── src/
│           ├── main.jsx
│           ├── App.jsx
│           ├── supabaseClient.js
│           └── pages/
│               ├── LoginPage.jsx
│               ├── DashboardPage.jsx
│               ├── ModulesPage.jsx
│               └── UploadPage.jsx      # Subir PDFs y generar embeddings
│
└── public/
    └── lottie/tuko/             # Animaciones de Tuko (7 estados)
        ├── idle.json
        ├── thinking.json
        ├── encouraging.json
        ├── reflection.json
        ├── hint.json
        ├── correct.json
        └── incorrect.json
```

---

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- API Key de OpenAI

### 1. Clonar repositorio
```bash
git clone <repo-url>
cd kuneo
```

### 2. Instalar dependencias

**Backend:**
```bash
cd backend
npm install
```

**Gateway:**
```bash
cd gateway
npm install
```

**Mobile:**
```bash
cd apps/mobile
npm install
```

**Web Admin:**
```bash
cd apps/web
npm install
```

---

## ⚙️ Configuración

### 1. Crear Base de Datos en Supabase

1. Crea un nuevo proyecto en [supabase.com](https://supabase.com)
2. Ve a SQL Editor
3. Ejecuta el archivo `schema.sql` (en la raíz del proyecto)
4. Verifica que se crearon 12 tablas en el esquema `kuneo`:
   - profiles, modules, sessions, messages
   - module_progress, cognitive_profile
   - evaluations, recommendations
   - icfes_attempts, content_nodes, embeddings
   - student_activity

### 2. Configurar Variables de Entorno

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=4000

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

DB_SCHEMA=kuneo
USE_MOCK_AI=false
```

**Gateway** (`gateway/.env`):
```env
NODE_ENV=development
GATEWAY_PORT=3000

BACKEND_URL=http://localhost:4000

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key

ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
RATE_LIMIT_MAX_REQUESTS=100
```

**Mobile** (`apps/mobile/app.json` - extra section):
```json
{
  "expo": {
    "extra": {
      "gatewayUrl": "http://localhost:3000",
      "supabaseUrl": "https://tu-proyecto.supabase.co",
      "supabaseAnonKey": "tu-anon-key"
    }
  }
}
```

**Web Admin** (`apps/web/.env`):
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_BACKEND_URL=http://localhost:4000
```

---

## 💻 Desarrollo

### Iniciar Backend
```bash
cd backend
npm run dev      # Nodemon en puerto 4000
```

### Iniciar Gateway
```bash
cd gateway
npm run dev      # Nodemon en puerto 3000
```

### Iniciar Mobile App
```bash
cd apps/mobile
npm start        # Expo Dev Tools
# Luego:
# - Presiona 'a' para Android
# - Presiona 'i' para iOS
# - Escanea QR con Expo Go
```

### Iniciar Web Admin
```bash
cd apps/web
npm run dev      # Vite en puerto 5173
```

### URLs de Desarrollo
- Backend: `http://localhost:4000`
- Gateway: `http://localhost:3000`
- Web Admin: `http://localhost:5173`
- Mobile: Expo Dev Tools en `http://localhost:19006`

---

## 🗄 Base de Datos

### Esquema `kuneo` (12 tablas)

**Usuarios y Sesiones:**
- `profiles`: Perfiles de estudiantes con grade_level
- `sessions`: Sesiones activas de aprendizaje
- `messages`: Historial de conversación tutor-estudiante

**Progreso y Evaluación:**
- `module_progress`: Avance por módulo
- `cognitive_profile`: 5 dimensiones cognitivas (0-100)
- `evaluations`: Evaluaciones de respuestas

**Contenido:**
- `modules`: Catálogo de módulos de aprendizaje
- `content_nodes`: Fragmentos de contenido educativo
- `embeddings`: Vectores de 1536 dimensiones para RAG

**Recomendaciones e ICFES:**
- `recommendations`: Recomendaciones personalizadas
- `icfes_attempts`: Intentos de simulacros ICFES

**Analytics:**
- `student_activity`: Log de actividad para análisis

### RLS (Row Level Security)
Todas las tablas tienen políticas RLS activadas para proteger datos por usuario.

### Funciones Útiles
```sql
-- Inicializar perfil cognitivo
SELECT kuneo.initialize_cognitive_profile('user-uuid');

-- Actualizar dimensión cognitiva
SELECT kuneo.update_cognitive_dimension(
  'user-uuid',
  'razonamiento',
  85
);
```

---

## 🎨 Flujo de Interacción del Tutor

1. **Usuario envía mensaje** desde Mobile App
2. **Gateway** valida JWT y aplica rate limiting
3. **Backend/tutorEngine.handleInteraction()**:
   - Obtiene estado de sesión (stateManager)
   - Evalúa respuesta anterior si existe (evaluationService)
   - Decide siguiente paso (decisionEngine)
   - Busca contexto con RAG (vectorClient)
   - Construye prompt (promptBuilder)
   - Genera respuesta con LLM (llmClient)
   - Actualiza progreso cognitivo (progressService)
   - Retorna TutorResponse
4. **Mobile renderer.js** renderiza respuesta:
   - TukoCharacter con animación Lottie
   - MessageBubble con texto
   - Cards con conceptos/ejercicios
   - ActionButtons con opciones

---

## 📦 Despliegue

### Backend (Render/Railway)
```bash
# Build command
npm install

# Start command
npm start

# Environment variables
# Configurar todas las variables de .env.template
```

### Gateway (Render/Railway)
```bash
# Build command
cd gateway && npm install

# Start command
cd gateway && npm start
```

### Mobile (Expo EAS)
```bash
cd apps/mobile
eas build --platform android
eas build --platform ios
```

### Web Admin (Vercel/Netlify)
```bash
cd apps/web
npm run build
# Deploy carpeta dist/
```

---

## 🤝 Contribuciones

Este proyecto está en desarrollo activo. Para refinamientos y mejoras, contactar a Angel Motta.

---

## 📄 Licencia

MIT License - Copyright (c) 2024 Angel Motta

---

## 🐻 Sobre Tuko

**Tuko** es un oso de anteojos (especie endémica colombiana) que representa la sabiduría, paciencia y empatía. Sus 7 estados animados guían al estudiante emocionalmente durante el proceso de aprendizaje:

- **idle**: Estado neutral, esperando interacción
- **thinking**: Procesando respuesta del estudiante
- **encouraging**: Motivando al estudiante
- **reflection**: Invitando a pensar más profundo
- **hint**: Dando una pista útil
- **correct**: Celebrando respuesta correcta
- **incorrect**: Reconfortando tras error, invitando a reintentar

---

**¡Feliz aprendizaje con Kuneo! 🐻📚✨**
