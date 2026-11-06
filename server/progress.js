/**
 * KUNEO PROGRESS ROUTER
 * Tracking de progreso cognitivo y aprendizaje
 */

const { Router } = require("express");

module.exports = (supabase) => {
  const router = Router();

  /**
   * GET /api/progress/:userId
   * Dashboard completo de progreso del usuario
   */
  router.get("/progress/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // 1. Perfil cognitivo
      const { data: cognitive } = await supabase
        .from("cognitive_profile")
        .select("*")
        .eq("user_id", userId)
        .single();

      // 2. Sesiones completadas
      const { data: sessions } = await supabase
        .from("sessions")
        .select(`
          *,
          modules (title, subject)
        `)
        .eq("user_id", userId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false });

      // 3. Módulos únicos completados
      const uniqueModules = new Set((sessions || []).map(s => s.module_id));
      const modulesCompleted = uniqueModules.size;

      // 4. Racha (días consecutivos)
      const streak = calculateStreak(sessions || []);

      // 5. Total de evaluaciones (interacciones significativas)
      const { count: evaluationCount } = await supabase
        .from("evaluations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // 6. Datos de dimensiones para radar chart
      const cognitiveData = cognitive ? [
        { name: "Comprensión", value: Math.round(cognitive.comprehension_level) },
        { name: "Representación", value: Math.round(cognitive.representation_level) },
        { name: "Razonamiento", value: Math.round(cognitive.reasoning_level) },
        { name: "Transferencia", value: Math.round(cognitive.transfer_level) },
        { name: "Metacognición", value: Math.round(cognitive.metacognition_level) }
      ] : [];

      // 7. Actividad reciente
      const recentSessions = (sessions || []).slice(0, 5).map(s => ({
        id: s.id,
        moduleTitle: s.modules?.title || "Módulo",
        subject: s.modules?.subject || "general",
        completedAt: s.completed_at,
        duration: calculateDuration(s.started_at, s.completed_at)
      }));

      res.json({
        cognitiveLevel: cognitive?.cognitive_level || "Explorador",
        modulesCompleted,
        streak,
        totalEvaluations: evaluationCount || 0,
        cognitiveData,
        recentSessions,
        lastActive: sessions?.[0]?.completed_at || null
      });

    } catch (error) {
      console.error("Error obteniendo progreso:", error);
      res.status(500).json({
        error: "Error obteniendo progreso",
        details: error.message
      });
    }
  });

  /**
   * GET /api/cognitive-profile/:userId
   * Perfil cognitivo detallado
   */
  router.get("/cognitive-profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data: profile, error } = await supabase
        .from("cognitive_profile")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !profile) {
        return res.status(404).json({
          error: "Perfil cognitivo no encontrado"
        });
      }

      // Dimensiones con descripciones
      const dimensions = [
        {
          name: "Comprensión",
          value: Math.round(profile.comprehension_level),
          description: getDimensionDescription("comprehension", profile.comprehension_level)
        },
        {
          name: "Representación",
          value: Math.round(profile.representation_level),
          description: getDimensionDescription("representation", profile.representation_level)
        },
        {
          name: "Razonamiento",
          value: Math.round(profile.reasoning_level),
          description: getDimensionDescription("reasoning", profile.reasoning_level)
        },
        {
          name: "Transferencia",
          value: Math.round(profile.transfer_level),
          description: getDimensionDescription("transfer", profile.transfer_level)
        },
        {
          name: "Metacognición",
          value: Math.round(profile.metacognition_level),
          description: getDimensionDescription("metacognition", profile.metacognition_level)
        }
      ];

      // Nivel cognitivo con metadata
      const levelInfo = getLevelInfo(profile.cognitive_level);

      // Total de evaluaciones
      const { count: totalEvaluations } = await supabase
        .from("evaluations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Módulos completados
      const { data: completedModules } = await supabase
        .from("sessions")
        .select("module_id")
        .eq("user_id", userId)
        .eq("is_completed", true);

      res.json({
        dimensions,
        level: profile.cognitive_level,
        levelNumber: levelInfo.number,
        levelDescription: levelInfo.description,
        totalEvaluations: totalEvaluations || 0,
        modulesCompleted: new Set((completedModules || []).map(m => m.module_id)).size,
        lastUpdated: profile.updated_at
      });

    } catch (error) {
      console.error("Error obteniendo perfil cognitivo:", error);
      res.status(500).json({
        error: "Error obteniendo perfil cognitivo",
        details: error.message
      });
    }
  });

  /**
   * GET /api/sessions/:sessionId/feedback
   * Feedback de sesión específica
   */
  router.get("/sessions/:sessionId/feedback", async (req, res) => {
    try {
      const { sessionId } = req.params;

      const { data: session, error } = await supabase
        .from("sessions")
        .select(`
          *,
          modules (title)
        `)
        .eq("id", sessionId)
        .single();

      if (error || !session) {
        return res.status(404).json({ error: "Sesión no encontrada" });
      }

      // Analizar interacciones para generar insights
      const interactions = session.interactions || [];
      const insights = generateInsights(interactions);

      // Calcular cambios en dimensiones (comparar antes/después)
      const dimensionProgress = calculateDimensionProgress(
        session.user_id,
        session.started_at,
        session.completed_at,
        supabase
      );

      res.json({
        moduleTitle: session.modules?.title || "Módulo",
        insights,
        dimensionProgress: await dimensionProgress,
        nextSuggestion: "Explora el siguiente módulo para seguir creciendo"
      });

    } catch (error) {
      console.error("Error obteniendo feedback:", error);
      res.status(500).json({
        error: "Error obteniendo feedback",
        details: error.message
      });
    }
  });

  return router;
};

/**
 * Calcular racha de días consecutivos
 */
function calculateStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const dates = sessions
    .map(s => new Date(s.completed_at).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .sort((a, b) => new Date(b) - new Date(a));

  let streak = 1;
  const today = new Date().toDateString();
  
  if (dates[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dates[0] !== yesterday.toDateString()) {
      return 0; // Racha rota
    }
  }

  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const previous = new Date(dates[i - 1]);
    const diffDays = Math.floor((previous - current) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calcular duración de sesión en minutos
 */
function calculateDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return 0;
  const diff = new Date(completedAt) - new Date(startedAt);
  return Math.round(diff / (1000 * 60));
}

/**
 * Descripción contextual de dimensión según nivel
 */
function getDimensionDescription(dimension, level) {
  const descriptions = {
    comprehension: {
      low: "Estás explorando los conceptos básicos",
      medium: "Captas bien las ideas principales",
      high: "Comprendes profundamente los conceptos"
    },
    representation: {
      low: "Estás aprendiendo a visualizar ideas",
      medium: "Usas bien diagramas y representaciones",
      high: "Creas excelentes representaciones visuales"
    },
    reasoning: {
      low: "Estás construyendo conexiones lógicas",
      medium: "Conectas ideas de forma coherente",
      high: "Razonas con profundidad y rigor"
    },
    transfer: {
      low: "Estás explorando aplicaciones",
      medium: "Aplicas conocimiento en nuevos contextos",
      high: "Transfieres hábilmente entre dominios"
    },
    metacognition: {
      low: "Estás aprendiendo a reflexionar",
      medium: "Reflexionas sobre tu aprendizaje",
      high: "Monitorizas expertamente tu cognición"
    }
  };

  const category = level < 40 ? "low" : level < 70 ? "medium" : "high";
  return descriptions[dimension]?.[category] || "En desarrollo";
}

/**
 * Información de nivel cognitivo
 */
function getLevelInfo(level) {
  const levels = {
    "Explorador": { number: 1, description: "Iniciando tu viaje cognitivo" },
    "Constructor": { number: 2, description: "Construyendo bases sólidas" },
    "Analista": { number: 3, description: "Conectando y analizando" },
    "Aplicador": { number: 4, description: "Transfiriendo conocimiento" },
    "Autónomo": { number: 5, description: "Razonamiento independiente" }
  };

  return levels[level] || levels["Explorador"];
}

/**
 * Generar insights cualitativos de sesión
 */
function generateInsights(interactions) {
  if (!interactions || interactions.length === 0) {
    return ["Completaste tu primera sesión, ¡excelente inicio!"];
  }

  const insights = [];

  // Analizar patrones en las interacciones
  const hasDeepReasoning = interactions.some(i => 
    i.rubricLevel >= 4
  );

  const usesExamples = interactions.some(i =>
    i.userResponse?.toLowerCase().includes("ejemplo") ||
    i.userResponse?.toLowerCase().includes("como")
  );

  const showsReflection = interactions.some(i =>
    i.userResponse?.toLowerCase().includes("creo") ||
    i.userResponse?.toLowerCase().includes("pienso")
  );

  if (hasDeepReasoning) {
    insights.push("Noté razonamiento profundo en tus respuestas");
  }

  if (usesExamples) {
    insights.push("Tu uso de ejemplos muestra buena comprensión");
  }

  if (showsReflection) {
    insights.push("Reflexionas bien sobre tu proceso de aprendizaje");
  }

  if (insights.length === 0) {
    insights.push("Avanzaste bien en este módulo");
  }

  return insights;
}

/**
 * Calcular progreso en dimensiones durante sesión
 */
async function calculateDimensionProgress(userId, startedAt, completedAt, supabase) {
  // Simplificado - en producción comparar perfiles antes/después
  const mockProgress = [
    { dimension: "Comprensión", value: 75, change: 5 },
    { dimension: "Representación", value: 70, change: 3 },
    { dimension: "Razonamiento", value: 80, change: 7 }
  ];

  return mockProgress;
}
