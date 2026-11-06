# 🎓 Aula Nativa

Plataforma educativa inteligente para estudiantes colombianos de secundaria, que combina un asistente pedagógico impulsado por IA con un sistema completo de práctica, evaluación y seguimiento del aprendizaje.

## 🌟 Características Principales

- **Asistente Pedagógico con IA**: Tutor virtual que guía el aprendizaje mediante el método socrático
- **Sistema RAG (Retrieval-Augmented Generation)**: Respuestas contextualizadas basadas en materiales de estudio
- **Práctica Adaptativa**: Ejercicios personalizados según el progreso del estudiante
- **Evaluación Formativa**: Feedback detallado y pedagógico para cada respuesta
- **Simulacros ICFES**: Preparación para pruebas estandarizadas colombianas
- **Gestión de Materiales**: Carga y procesamiento de PDFs con embeddings vectoriales
- **Analytics Avanzado**: Seguimiento detallado del progreso y actividad del estudiante
- **Gestión de Calificaciones**: Sistema completo de notas y retroalimentación

## 🏗️ Arquitectura del Proyecto

```
aula-asistente/
├── server/                     # Backend API con Express.js
│   ├── analytics.js           # Rutas de analíticas
│   ├── embeddings.js          # Procesamiento de embeddings
│   ├── grades.js              # Gestión de calificaciones
│   ├── student.js             # Rutas principales del estudiante
│   │                           # - Asistente IA
│   │                           # - Generación de ejercicios
│   │                           # - Evaluación con feedback
│   │                           # - Simulacros ICFES
│   ├── utils/
│   │   ├── analytics.js       # Utilidades de análisis
│   │   └── ocrUtils.js        # OCR para exámenes escaneados
│   ├── package.json
│   └── eng.traineddata        # Datos de Tesseract OCR
│       spa.traineddata
│
├── client/                     # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx            # Componente raíz
│   │   ├── supabaseClient.js  # Cliente de Supabase
│   │   ├── components/
│   │   │   ├── ChatBox.jsx            # Interfaz del asistente IA
│   │   │   ├── PracticePanel.jsx      # Panel de práctica
│   │   │   ├── MockTestPanel.jsx      # Simulacros ICFES
│   │   │   ├── AnalyticsPanel.jsx     # Visualización de datos
│   │   │   ├── GradesManager.jsx      # Gestión de notas
│   │   │   ├── MaterialsTable.jsx     # Tabla de materiales
│   │   │   ├── FileUploader.jsx       # Carga de archivos
│   │   │   ├── Navbar.jsx             # Navegación
│   │   │   ├── StudentSidebar.jsx     # Menú lateral
│   │   │   ├── ProtectedRoute.jsx     # Rutas protegidas
│   │   │   ├── Modal.jsx              # Modales reutilizables
│   │   │   ├── Toast.jsx              # Notificaciones
│   │   │   └── LoadingSkeleton.jsx    # Estados de carga
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Landing page
│   │   │   ├── Login.jsx              # Autenticación
│   │   │   ├── Dashboard.jsx          # Dashboard principal
│   │   │   ├── Assistant.jsx          # Chatbot IA
│   │   │   ├── Materials.jsx          # Gestión de materiales
│   │   │   ├── Grades.jsx             # Calificaciones
│   │   │   ├── Profile.jsx            # Perfil de usuario
│   │   │   └── PrivacyPolicy.jsx      # Políticas
│   │   ├── hooks/
│   │   │   ├── useAutoHideNav.js      # Hook navegación auto-ocultar
│   │   │   └── useMediaQuery.js       # Hook responsive
│   │   └── utils/
│   │       ├── analyticsClient.js     # Cliente de analytics
│   │       └── embedUtils.js          # Utilidades de embeddings
│   ├── public/
│   │   └── image/
│   │       ├── characters/            # Avatares de personajes
│   │       │   ├── kid/              # Grados 1-5
│   │       │   ├── teen/             # Grados 6-9
│   │       │   └── young_adult/      # Grados 10-11
│   │       ├── icons/
│   │       └── logos/
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json             # Configuración Vercel
│   └── package.json
│
├── docker-compose.yml          # Orquestación de contenedores
├── Dockerfile                  # Imagen Docker del backend
├── render.yaml                 # Configuración Render
└── README.md
```

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express.js** - API REST
- **Supabase** (PostgreSQL) - Base de datos con RLS
- **OpenAI API** (GPT-4o-mini) - Motor del asistente pedagógico
- **LangChain** - Procesamiento de embeddings
- **Tesseract.js** - OCR para exámenes escaneados
- **Multer** - Manejo de archivos

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool y dev server
- **Supabase Auth** - Autenticación de usuarios
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Iconografía
- **React Markdown** - Renderizado de markdown
- **KaTeX** - Renderizado de fórmulas matemáticas

### Base de Datos (Supabase/PostgreSQL)
- **pgvector** - Búsqueda semántica de vectores
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **14 tablas principales** (ver esquema completo en `AulaNativa_schema.png`)

---

## 📊 Estructura de Base de Datos

| Tabla | Propósito | Creado por | Accedido por |
|-------|-----------|------------|--------------|
| **profiles** | Información básica de usuarios | Registro de usuario | Estudiantes + Profesores |
| **students** | Datos específicos de estudiantes (grado, personaje) | Registro de estudiante | El propio estudiante |
| **teachers** | Datos de profesores | Registro de profesor | El propio profesor |
| **materials** | Metadatos de materiales educativos (PDFs) | Profesor sube | Estudiantes buscan |
| **material_embeddings** | Vectores para búsqueda RAG | Generado automáticamente | Asistente IA consulta |
| **chat_sessions** | Sesiones de conversación con IA | Estudiante inicia chat | Estudiante + Analytics |
| **chat_messages** | Historial de mensajes del chat | Asistente IA + Estudiante | Contexto conversacional |
| **practice_exercises** | Ejercicios de práctica generados | IA genera bajo demanda | Estudiante practica |
| **practice_answers** | Respuestas y feedback de práctica | Estudiante responde | Evaluación + Analytics |
| **practice_leaderboard** | Ranking de práctica | Actualización automática | Gamificación |
| **mocktest_questions** | Preguntas de simulacro ICFES | IA genera simulacros | Estudiante realiza test |
| **mocktest_answers** | Respuestas de simulacros | Estudiante envía | Evaluación automática |
| **mocktest_leaderboard** | Ranking de simulacros | Actualización automática | Competencias |
| **student_activity** | Log de actividad del estudiante | Acciones del estudiante | Analytics + Profesores |

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- API Key de OpenAI
- (Opcional) Docker para contenedorización

### 1. Clonar el repositorio
```bash
git clone https://github.com/AngelMV97/aula-nativa.git
cd aula-asistente
```

### 2. Configurar Backend
```bash
cd server
npm install

# Crear archivo .env con las siguientes variables:
# SUPABASE_URL=tu-url-de-supabase
# SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
# OPENAI_API_KEY=tu-openai-key
# OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small
# PORT=3001
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:5173

npm run dev
```

### 3. Configurar Frontend
```bash
cd ../client
npm install

# Crear archivo .env con:
# VITE_SUPABASE_URL=tu-url-de-supabase
# VITE_SUPABASE_ANON_KEY=tu-anon-key
# VITE_API_URL=http://localhost:3001

npm run dev
```

### 4. Configurar Base de Datos
1. Crear proyecto en [Supabase](https://supabase.com)
2. Habilitar la extensión **pgvector** en SQL Editor:
   ```sql
   create extension if not exists vector;
   ```
3. Ejecutar el schema SQL (ver `AulaNativa_schema.png` para estructura completa)
4. Configurar políticas RLS para cada tabla
5. Verificar que no haya errores o warnings en el Dashboard de Supabase

### 5. (Opcional) Despliegue con Docker
```bash
# Construir y levantar servicios
docker-compose up --build

# Detener servicios
docker-compose down
```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 🎯 Flujo de Aprendizaje

```
1. Docente carga materiales (preferiblemente PDF)
         ↓
2. Sistema genera embeddings vectoriales
         ↓
3. Estudiante inicia chat con asistente IA
         ↓
4. Asistente usa RAG para respuestas contextualizadas
         ↓
5. Estudiante accede a práctica personalizada
         ↓
6. IA genera ejercicios basados en materiales
         ↓
7. Estudiante responde y recibe feedback detallado
         ↓
8. Sistema actualiza perfil de progreso
         ↓
9. Analytics y calificaciones disponibles para profesor
```

## 🤖 Sistema de Asistente Pedagógico

### Características del Tutor IA

1. **Método Socrático**: Guía con preguntas, no da respuestas directas
2. **Contextualización**: Usa materiales del estudiante vía RAG
3. **Adaptación por Grado**: Ajusta lenguaje según grado escolar (1-11)
4. **Personalización**: 10 personajes diferentes para identificación del estudiante
5. **Formato Educativo**: Usa analogías, ejemplos detallados y preguntas exploratorias
6. **LaTeX y Markdown**: Renderizado de fórmulas matemáticas y formato rico

### Tipos de Preguntas Soportadas

- **Conceptuales**: ¿Qué es? ¿Por qué? ¿Cómo funciona?
- **Problemas matemáticos**: Guía paso a paso sin resolver directamente
- **Tareas creativas**: Estructura y orientación, no contenido completo
- **Validación**: Confirma cuando el estudiante tiene razón

## 📝 Sistema de Práctica y Evaluación

### Tipos de Ejercicios

1. **Opción Múltiple**: Respuestas distribuidas uniformemente (A, B, C, D)
2. **Verdadero/Falso**: Evaluación de comprensión conceptual
3. **Respuesta Abierta**: Evaluación detallada con feedback formativo

### Feedback Formativo

- **Clasificación**: CORRECTA / PARCIAL / INCORRECTA
- **Citas textuales**: Referencia al trabajo del estudiante
- **Explicación pedagógica**: 4-8 líneas mínimo
- **Orientación concreta**: Qué mejorar y cómo

## Simulacros ICFES

- **Áreas**: Matemáticas, Lectura Crítica, Ciencias Naturales, Sociales, Inglés
- **Competencias**: Razonamiento, Resolución de problemas, Interpretación, etc.
- **Análisis**: Resultados por competencia con recomendaciones
- **Leaderboard**: Ranking competitivo entre estudiantes (aún sin implementación)

## 📊 Analytics y Seguimiento

### Métricas del Estudiante

- Actividad diaria/semanal/mensual
- Tiempo de uso por sesión
- Progreso por materia
- Accuracy en ejercicios (por dificultad)
- Rendimiento en simulacros

### Métricas del Profesor

- Vista consolidada de la clase
- Identificación de estudiantes con dificultades
- Análisis de uso de materiales
- Comparación de rendimiento

## 🔐 Seguridad

- **Autenticación**: Supabase Auth con JWT
- **Row Level Security (RLS)**: Todas las tablas protegidas
- **Validación de entrada**: Sanitización en backend
- **CORS configurado**: Solo orígenes permitidos
- **Variables de entorno**: Secretos no versionados
- **Límites de rate**: Prevención de abuso

## 🎨 Diseño y UX

### Temas
- Paleta adaptativa por materia
- Diseño responsivo (mobile-first)

### Accesibilidad
- Navegación por teclado
- Contraste WCAG AA
- Texto alternativo en imágenes
- Skeletons para estados de carga

### Personajes
- 10 personajes diferentes (Es tucán Pico es la mascota)
- 3 grupos de edad por grado escolar: niño (1°-5°), adolescente (6°-9°), joven (10°-11°)
- Identificación visual para el estudiante

## 🚢 Despliegue

### Opciones de Hosting

1. **Vercel** (Frontend)
   - Configuración en `vercel.json`
   - Deploy automático desde Git

2. **Render** (Backend)
   - Configuración en `render.yaml`
   - Health checks configurados

3. **Docker** (Completo)
   - `docker-compose.yml` para orquestación
   - Contenedores separados para frontend/backend

### Variables de Entorno Requeridas

**Backend**:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
```

**Frontend**:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=https://tu-api.com
```

## 📚 Documentación Adicional

- **Esquema de Base de Datos**: Ver `AulaNativa_schema.png`
- **Identidad de marca**: Ver `brand-identity.pdf`
- **Mejoras UX/UI**: Ver `UX-UI-Improvements.md`
- **Issues Resueltos**: Ver `MEN_ISSUES_FIXED.md`

## 🧪 Testing

```bash
# Frontend
cd client
npm run dev

# Backend
cd server
npm run start
```

## 🤝 Contribuir

Este es un proyecto educativo en desarrollo activo. Las contribuciones son bienvenidas.

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC

## 👤 Autor

**Ángel Motta**
- GitHub: [@AngelMV97](https://github.com/AngelMV97)

---

## 🗺️ Roadmap

### Versión Actual (v1.0)
- ✅ Asistente IA con RAG
- ✅ Sistema de práctica adaptativa
- ✅ Simulacros ICFES
- ✅ Gestión de materiales
- ✅ Analytics básico
- ✅ Sistema de calificaciones

### Próximas Funcionalidades (v2.0)
- 🔄 Modo colaborativo (grupos de estudio)
- 🔄 Gamificación avanzada (logros, badges)
- 🔄 Integración con LMS (Moodle, Canvas - LMS de Gomot Science Academy)
- 🔄 App móvil nativa (Kuneo, app móvil en construcción)
- 🔄 Análisis predictivo del rendimiento
- 🔄 Recomendaciones personalizadas de estudio

---

**Nota**: Esta plataforma es de libre acceso y está diseñada específicamente para el contexto educativo colombiano, adaptándose al currículo nacional y preparando para las pruebas ICFES (Saber 11).

**Desarrollado con ❤️ para mejorar la educación en Colombia**
