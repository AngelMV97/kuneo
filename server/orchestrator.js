/**
 * KUNEO ORCHESTRATOR
 * Motor de decisión pedagógica que coordina la interacción cognitiva
 * 
 * Filosofía: "Evaluación invisible" - No calificaciones explícitas,
 * sino micro-evidencias de aprendizaje que informan el nivel de andamiaje
 */

const { Router } = require("express");

module.exports = (supabase, llmClient) => {
  const router = Router();

  /**
   * POST /api/orchestrator/decide
   * Endpoint principal: recibe respuesta del estudiante y decide siguiente acción
   */
  router.post("/orchestrator/decide", async (req, res) => {
    try {
      const {
        sessionId,
        userResponse,
        currentPhase,
        context = {}
      } = req.body;

      // Validación
      if (!sessionId || !userResponse) {
        return res.status(400).json({
          error: "sessionId y userResponse son requeridos"
        });
      }

      // 1. Cargar sesión actual
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select(`
          *,
          modules (
            id,
            title,
            subject,
            difficulty_level,
            content_structure
          ),
          profiles (
            id,
            character_preference,
            grade_level
          )
        `)
        .eq("id", sessionId)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({ error: "Sesión no encontrada" });
      }

      // 2. Cargar perfil cognitivo del usuario
      const { data: cognitiveProfile } = await supabase
        .from("cognitive_profile")
        .select("*")
        .eq("user_id", session.user_id)
        .single();

      // 3. Guardar interacción en el historial
      await supabase.from("evaluations").insert({
        session_id: sessionId,
        user_id: session.user_id,
        module_id: session.module_id,
        phase: currentPhase || "exploration",
        user_response: userResponse,
        timestamp: new Date().toISOString(),
        context_data: context
      });

      // 4. Analizar respuesta con rubric
      const rubricAnalysis = await analyzeWithRubric(
        userResponse,
        session.modules.content_structure,
        currentPhase,
        cognitiveProfile
      );

      // 5. Decidir siguiente acción basado en análisis
      const decision = await makeDecision(
        rubricAnalysis,
        session,
        cognitiveProfile,
        llmClient
      );

      // 6. Actualizar sesión con nueva interacción
      const updatedInteractions = [
        ...(session.interactions || []),
        {
          timestamp: new Date().toISOString(),
          userResponse,
          tutorMessage: decision.tutorMessage,
          phase: currentPhase,
          rubricLevel: rubricAnalysis.level,
          dimensionsEngaged: rubricAnalysis.dimensions
        }
      ];

      await supabase
        .from("sessions")
        .update({
          interactions: updatedInteractions,
          current_phase: decision.nextPhase || currentPhase,
          updated_at: new Date().toISOString()
        })
        .eq("id", sessionId);

      // 7. Actualizar dimensiones cognitivas si hay evidencias
      if (rubricAnalysis.dimensionUpdates) {
        await updateCognitiveDimensions(
          session.user_id,
          rubricAnalysis.dimensionUpdates,
          supabase
        );
      }

      // 8. Retornar decisión
      res.json({
        tutorMessage: decision.tutorMessage,
        characterState: decision.characterState,
        showCard: decision.showCard,
        nextAction: decision.nextAction,
        nextPhase: decision.nextPhase,
        rubricAnalysis: {
          level: rubricAnalysis.level,
          dimensions: rubricAnalysis.dimensions
        }
      });

    } catch (error) {
      console.error("Error en orchestrator/decide:", error);
      res.status(500).json({
        error: "Error procesando decisión",
        details: error.message
      });
    }
  });

  /**
   * POST /api/orchestrator/start-session
   * Iniciar nueva sesión de aprendizaje en un módulo
   */
  router.post("/orchestrator/start-session", async (req, res) => {
    try {
      const { userId, moduleId } = req.body;

      if (!userId || !moduleId) {
        return res.status(400).json({
          error: "userId y moduleId son requeridos"
        });
      }

      // Verificar que el módulo existe y está disponible
      const { data: module, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleError || !module) {
        return res.status(404).json({ error: "Módulo no encontrado" });
      }

      // Verificar perfil del usuario
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!profile) {
        return res.status(404).json({ error: "Perfil de usuario no encontrado" });
      }

      // Crear nueva sesión
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          user_id: userId,
          module_id: moduleId,
          started_at: new Date().toISOString(),
          current_phase: "introduction",
          interactions: [],
          session_metadata: {
            character: profile.character_preference || "tuko",
            gradeLevel: profile.grade_level
          }
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // Generar mensaje inicial del tutor
      const initialMessage = await generateInitialMessage(
        module,
        profile,
        llmClient
      );

      res.json({
        sessionId: session.id,
        module: {
          id: module.id,
          title: module.title,
          subject: module.subject,
          difficulty: module.difficulty_level
        },
        character: profile.character_preference || "tuko",
        initialMessage: initialMessage.text,
        characterState: "encouraging"
      });

    } catch (error) {
      console.error("Error iniciando sesión:", error);
      res.status(500).json({
        error: "Error iniciando sesión",
        details: error.message
      });
    }
  });

  /**
   * POST /api/orchestrator/end-session
   * Finalizar sesión y generar feedback
   */
  router.post("/orchestrator/end-session", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId es requerido" });
      }

      // Cargar sesión completa
      const { data: session } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!session) {
        return res.status(404).json({ error: "Sesión no encontrada" });
      }

      // Marcar sesión como completada
      await supabase
        .from("sessions")
        .update({
          completed_at: new Date().toISOString(),
          is_completed: true
        })
        .eq("id", sessionId);

      // Generar feedback cualitativo (sin calificaciones explícitas)
      const feedback = await generateSessionFeedback(
        session,
        supabase,
        llmClient
      );

      res.json(feedback);

    } catch (error) {
      console.error("Error finalizando sesión:", error);
      res.status(500).json({
        error: "Error finalizando sesión",
        details: error.message
      });
    }
  });

  return router;
};

/**
 * Analizar respuesta del usuario con rubric multi-dimensional
 */
async function analyzeWithRubric(userResponse, moduleStructure, phase, cognitiveProfile) {
  // Análisis basado en 5 dimensiones cognitivas
  const dimensions = {
    comprehension: 0,
    representation: 0,
    reasoning: 0,
    transfer: 0,
    metacognition: 0
  };

  // Indicadores simples (en producción usar LLM para análisis profundo)
  const text = userResponse.toLowerCase();

  // Comprensión: menciona conceptos clave
  if (text.includes("entiendo") || text.includes("significa") || text.includes("es cuando")) {
    dimensions.comprehension += 0.3;
  }

  // Representación: usa analogías, diagramas, ejemplos visuales
  if (text.includes("como") || text.includes("parecido a") || text.includes("imagino")) {
    dimensions.representation += 0.3;
  }

  // Razonamiento: conexiones lógicas
  if (text.includes("porque") || text.includes("entonces") || text.includes("por lo tanto")) {
    dimensions.reasoning += 0.3;
  }

  // Transferencia: aplica a nuevos contextos
  if (text.includes("podría") || text.includes("también") || text.includes("en otro caso")) {
    dimensions.transfer += 0.3;
  }

  // Metacognición: reflexiona sobre su proceso
  if (text.includes("creo que") || text.includes("no estoy seguro") || text.includes("necesito")) {
    dimensions.metacognition += 0.3;
  }

  // Nivel de rubric (1-5)
  let level = 1;
  const avgDimension = Object.values(dimensions).reduce((a, b) => a + b, 0) / 5;
  
  if (avgDimension > 0.8) level = 5; // Autónomo
  else if (avgDimension > 0.6) level = 4; // Aplicador
  else if (avgDimension > 0.4) level = 3; // Analista
  else if (avgDimension > 0.2) level = 2; // Constructor
  else level = 1; // Explorador

  return {
    level,
    dimensions,
    dimensionUpdates: dimensions, // Micro-evidencias para actualizar perfil
    confidence: avgDimension
  };
}

/**
 * Tomar decisión pedagógica basada en análisis
 */
async function makeDecision(rubricAnalysis, session, cognitiveProfile, llmClient) {
  const { level, dimensions } = rubricAnalysis;

  let characterState = "thinking";
  let showCard = null;
  let nextAction = "continue";
  let nextPhase = session.current_phase;

  // Decidir si mostrar tarjeta conceptual
  if (level <= 2) {
    // Necesita andamiaje → Concept card
    showCard = {
      type: "concept",
      trigger: "low_comprehension"
    };
    characterState = "explaining";
  } else if (dimensions.representation < 0.3) {
    // Necesita visualización → Representation card
    showCard = {
      type: "representation",
      trigger: "needs_visual"
    };
    characterState = "thinking";
  } else if (level >= 4 && session.current_phase === "practice") {
    // Momento de reflexión → Reflection card
    showCard = {
      type: "reflection",
      trigger: "deep_understanding"
    };
    characterState = "listening";
    nextPhase = "consolidation";
  }

  // Generar mensaje del tutor (aquí usaríamos LLM en producción)
  const tutorMessage = generateTutorMessage(level, session.current_phase, dimensions);

  return {
    tutorMessage,
    characterState,
    showCard,
    nextAction,
    nextPhase
  };
}

/**
 * Generar mensaje contextual del tutor
 */
function generateTutorMessage(rubricLevel, phase, dimensions) {
  // Mock simple - en producción usar LLM
  const messages = {
    1: "Hmm, veo que estás explorando esta idea. ¿Qué te hace pensar eso?",
    2: "Interesante punto de partida. ¿Puedes explicarme un poco más tu razonamiento?",
    3: "Veo que estás conectando ideas. ¿Cómo relacionas esto con lo que vimos antes?",
    4: "¡Excelente análisis! ¿Podrías aplicar esto a otro contexto?",
    5: "¡Wow! Tu razonamiento es muy profundo. ¿Qué otras implicaciones ves?"
  };

  return messages[rubricLevel] || "Cuéntame más sobre tu pensamiento...";
}

/**
 * Actualizar dimensiones cognitivas del perfil
 */
async function updateCognitiveDimensions(userId, dimensionUpdates, supabase) {
  const { data: current } = await supabase
    .from("cognitive_profile")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!current) return;

  // Actualización incremental con peso 0.1 (micro-evidencias)
  const weight = 0.1;
  const updated = {
    comprehension_level: current.comprehension_level + dimensionUpdates.comprehension * weight,
    representation_level: current.representation_level + dimensionUpdates.representation * weight,
    reasoning_level: current.reasoning_level + dimensionUpdates.reasoning * weight,
    transfer_level: current.transfer_level + dimensionUpdates.transfer * weight,
    metacognition_level: current.metacognition_level + dimensionUpdates.metacognition * weight
  };

  // Calcular nuevo nivel cognitivo general
  const avg = Object.values(updated).reduce((a, b) => a + b, 0) / 5;
  let cognitiveLevel = "Explorador";
  if (avg > 80) cognitiveLevel = "Autónomo";
  else if (avg > 60) cognitiveLevel = "Aplicador";
  else if (avg > 40) cognitiveLevel = "Analista";
  else if (avg > 20) cognitiveLevel = "Constructor";

  await supabase
    .from("cognitive_profile")
    .update({
      ...updated,
      cognitive_level: cognitiveLevel
    })
    .eq("user_id", userId);
}

/**
 * Generar mensaje inicial del módulo
 */
async function generateInitialMessage(module, profile, llmClient) {
  // Mock - en producción usar LLM
  return {
    text: `¡Hola! Soy ${profile.character_preference || 'Tuko'}. Vamos a explorar juntos "${module.title}". ¿Qué sabes sobre esto?`,
    state: "encouraging"
  };
}

/**
 * Generar feedback cualitativo de sesión (evaluación invisible)
 */
async function generateSessionFeedback(session, supabase, llmClient) {
  const interactions = session.interactions || [];

  // Analizar patrones en las interacciones
  const dimensionProgress = {
    comprehension: { value: 0, change: 0 },
    representation: { value: 0, change: 0 },
    reasoning: { value: 0, change: 0 },
    transfer: { value: 0, change: 0 },
    metacognition: { value: 0, change: 0 }
  };

  // Calcular progreso (simplificado)
  interactions.forEach(int => {
    if (int.dimensionsEngaged) {
      Object.keys(int.dimensionsEngaged).forEach(dim => {
        dimensionProgress[dim].value += int.dimensionsEngaged[dim];
        dimensionProgress[dim].change += 1;
      });
    }
  });

  // Insights cualitativos (sin calificaciones)
  const insights = [
    "Noté que conectaste bien las ideas principales",
    "Tu forma de explicar con ejemplos muestra comprensión profunda",
    "Podrías explorar más las conexiones entre conceptos"
  ];

  return {
    moduleTitle: session.modules?.title || "Módulo",
    insights,
    dimensionProgress: Object.entries(dimensionProgress).map(([dim, data]) => ({
      dimension: dim.charAt(0).toUpperCase() + dim.slice(1),
      value: Math.min(100, Math.round(data.value * 100)),
      change: Math.min(10, data.change)
    })),
    nextSuggestion: "Continúa con el siguiente módulo para profundizar"
  };
}
