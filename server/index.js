/**
 * KUNEO SERVER
 * Servidor principal para la app de tutoría cognitiva móvil
 * 
 * Arquitectura: Mobile → API Gateway → Orchestrator → Services → Data + AI
 * Este servidor monta los routers de Kuneo:
 * - Orchestrator: Motor de decisión pedagógica
 * - Modules: Catálogo de módulos
 * - Progress: Tracking cognitivo
 * - Profiles: Gestión de usuarios
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { OpenAIEmbeddings } = require("@langchain/openai");

// Validación de variables de entorno
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("❌ Faltan variables de entorno:", missing.join(", "));
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY no configurada");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ 
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174", // Vite dev server (puerto alternativo)
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:19000", // Expo
    "http://localhost:19001", // Expo
  ] 
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// FASE 2.4: Supabase client optimizado con connection pooling
const { createOptimizedClient } = require('./supabaseConfig');
const supabase = createOptimizedClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('✅ Supabase client initialized with optimized pooling');

// OpenAI embeddings (para el orchestrator)
let embeddings = null;
if (process.env.OPENAI_API_KEY) {
  embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-small",
  });
}

// ========================================
// KUNEO ROUTERS
// ========================================

console.log("\n🚀 Montando routers de Kuneo...\n");

// Authenticate before invoking any router that uses the privileged database client.
app.use('/api', require('./runtimeMetrics').middleware);
app.use('/api', require('./apiAuth')(supabase));
app.use('/api', require('./learningRouter')(supabase));

// 1. Orchestrator - Motor de decisión pedagógica (CORE)
try {
  const orchestratorRouter = require("./orchestrator")(supabase, embeddings);
  app.use("/api", orchestratorRouter);
  console.log("✅ Orchestrator router mounted");
} catch (e) {
  console.error("❌ Error al montar orchestrator router:", e.message);
}

// 2. Modules - Catálogo de módulos de aprendizaje
try {
  const modulesRouter = require("./modules")(supabase);
  app.use("/api", modulesRouter);
  console.log("✅ Modules router mounted");
} catch (e) {
  console.error("❌ Error al montar modules router:", e.message);
}

// 3. Progress - Tracking de progreso cognitivo
try {
  const progressRouter = require("./progress")(supabase);
  app.use("/api", progressRouter);
  console.log("✅ Progress router mounted");
} catch (e) {
  console.error("❌ Error al montar progress router:", e.message);
}

// 4. Profiles - Gestión de perfiles de usuario
try {
  const profilesRouter = require("./profiles")(supabase);
  app.use("/api", profilesRouter);
  console.log("✅ Profiles router mounted");
} catch (e) {
  console.error("❌ Error al montar profiles router:", e.message);
}

// 5. Competencies - Búsqueda semántica de competency units
try {
  const competenciesRouter = require("./competencies")(supabase);
  app.use("/api", competenciesRouter);
  console.log("✅ Competencies router mounted");
} catch (e) {
  console.error("❌ Error al montar competencies router:", e.message);
}

// 6. Adaptive Engine - Sistema de evaluación y progresión cognitiva (MVP)
try {
  const adaptiveRouter = require("./adaptiveRouter")(supabase);
  app.use("/api", adaptiveRouter);
  console.log("✅ Adaptive Engine router mounted\n");
} catch (e) {
  console.error("❌ Error al montar adaptive router:", e.message);
  console.log("");
}

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "kuneo-api",
    timestamp: new Date().toISOString() 
  });
});

// Catch-all para rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.originalUrl 
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  res.status(500).json({ 
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ========================================
// FASE 2: INICIALIZACIÓN DE CACHE Y QUEUE
// ========================================

async function initializeOptimizations() {
  console.log('\n🔧 Inicializando optimizaciones Fase 2...\n');
  
  try {
    const adaptive = require('./adaptive');
    adaptive.initializeSupabase(supabase);
    
    // Inicializar cache y queue
    // The live learning engine does not use the legacy enriched-step cache.
    // Avoid thousands of startup reads competing with the first activity.
    // Legacy routes still populate cache entries on demand.
    await adaptive.initializeCache({ warmup: process.env.LEARNING_LEGACY_WARMUP === 'true' });
    
    console.log('✅ Optimizaciones Fase 2 activas\n');
  } catch (error) {
    console.error('❌ Error inicializando optimizaciones:', error);
  }
}

// Iniciar servidor
const httpServer = app.listen(PORT, async () => {
  console.log(`\n🎓 KUNEO API Server`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
  
  // Inicializar cache y queue después de que el servidor esté listo
  await initializeOptimizations();
});
httpServer.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nEl puerto ${PORT} ya está ocupado. Ya hay un backend en ejecución. Cierra esa instancia antes de ejecutar npm run dev de nuevo.\n`);
  } else console.error('No se pudo iniciar el servidor:', error.code || error.message);
  process.exitCode = 1;
});
