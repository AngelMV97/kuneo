/**
 * KUNEO PROFILES ROUTER
 * Gestión de perfiles de usuario y preferencias
 */

const { Router } = require("express");

module.exports = (supabase) => {
  const router = Router();

  /**
   * POST /api/profiles/character-preference
   * Guardar preferencia de personaje del usuario
   */
  router.post("/profiles/character-preference", async (req, res) => {
    try {
      const { userId, character } = req.body;

      if (!userId || !character) {
        return res.status(400).json({
          error: "userId y character son requeridos"
        });
      }

      // Verificar que el personaje es válido
      const validCharacters = ["tuko", "pico", "yagui", "rosi", "guido"];
      if (!validCharacters.includes(character.toLowerCase())) {
        return res.status(400).json({
          error: "Personaje no válido"
        });
      }

      // Actualizar perfil usando schema kuneo
      const { data, error } = await supabase
        .schema("kuneo")
        .from("profiles")
        .upsert({
          user_id: userId,
          character_preference: character.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Inicializar perfil cognitivo si no existe
      const { error: cognitiveError } = await supabase
        .schema("kuneo")
        .from("cognitive_profile")
        .upsert({
          user_id: userId,
          cognitive_level: "Explorador",
          comprehension_level: 20,
          representation_level: 20,
          reasoning_level: 20,
          transfer_level: 20,
          metacognition_level: 20
        }, { onConflict: "user_id" });

      if (cognitiveError) {
        console.warn("Error inicializando perfil cognitivo:", cognitiveError);
      }

      res.json({
        success: true,
        profile: data
      });

    } catch (error) {
      console.error("Error guardando preferencia de personaje:", error);
      res.status(500).json({
        error: "Error guardando preferencia",
        details: error.message
      });
    }
  });

  /**
   * GET /api/profiles/:userId
   * Obtener perfil completo del usuario
   */
  router.get("/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!profile) {
        return res.status(404).json({
          error: "Perfil no encontrado"
        });
      }

      res.json(profile);

    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      res.status(500).json({
        error: "Error obteniendo perfil",
        details: error.message
      });
    }
  });

  /**
   * PUT /api/profiles/:userId
   * Actualizar perfil de usuario
   */
  router.put("/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Campos permitidos para actualizar
      const allowedFields = [
        "full_name",
        "grade_level",
        "character_preference",
        "theme_preference"
      ];

      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({
          error: "No hay campos válidos para actualizar"
        });
      }

      filteredUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("profiles")
        .update(filteredUpdates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        profile: data
      });

    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({
        error: "Error actualizando perfil",
        details: error.message
      });
    }
  });

  /**
   * POST /api/profiles/initialize
   * Inicializar perfil completo para nuevo usuario
   */
  router.post("/profiles/initialize", async (req, res) => {
    try {
      const {
        userId,
        email,
        fullName,
        gradeLevel,
        character = "tuko"
      } = req.body;

      if (!userId || !email) {
        return res.status(400).json({
          error: "userId y email son requeridos"
        });
      }

      // Crear perfil
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          email,
          full_name: fullName,
          grade_level: gradeLevel ? parseInt(gradeLevel) : null,
          character_preference: character.toLowerCase(),
          theme_preference: "dark",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Inicializar perfil cognitivo
      const { error: cognitiveError } = await supabase
        .from("cognitive_profile")
        .insert({
          user_id: userId,
          cognitive_level: "Explorador",
          comprehension_level: 20,
          representation_level: 20,
          reasoning_level: 20,
          transfer_level: 20,
          metacognition_level: 20
        });

      if (cognitiveError && cognitiveError.code !== "23505") {
        // Ignorar error si ya existe (código 23505)
        console.warn("Error inicializando perfil cognitivo:", cognitiveError);
      }

      res.json({
        success: true,
        profile
      });

    } catch (error) {
      console.error("Error inicializando perfil:", error);
      res.status(500).json({
        error: "Error inicializando perfil",
        details: error.message
      });
    }
  });

  /**
   * GET /api/profiles/:userId/continue-learning
   * Obtener módulo donde el usuario dejó de aprender
   */
  router.get("/profiles/:userId/continue-learning", async (req, res) => {
    try {
      const { userId } = req.params;

      // Buscar última sesión incompleta
      const { data: incompleteSession } = await supabase
        .from("sessions")
        .select(`
          *,
          modules (
            id,
            title,
            subject
          )
        `)
        .eq("user_id", userId)
        .eq("is_completed", false)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (incompleteSession) {
        return res.json({
          hasInProgress: true,
          session: {
            id: incompleteSession.id,
            moduleId: incompleteSession.module_id,
            moduleTitle: incompleteSession.modules.title,
            subject: incompleteSession.modules.subject,
            startedAt: incompleteSession.started_at,
            currentPhase: incompleteSession.current_phase
          }
        });
      }

      // Si no hay sesión incompleta, buscar última completada
      const { data: lastCompleted } = await supabase
        .from("sessions")
        .select(`
          *,
          modules (
            id,
            title,
            subject
          )
        `)
        .eq("user_id", userId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (lastCompleted) {
        return res.json({
          hasInProgress: false,
          lastCompleted: {
            moduleId: lastCompleted.module_id,
            moduleTitle: lastCompleted.modules.title,
            subject: lastCompleted.modules.subject,
            completedAt: lastCompleted.completed_at
          }
        });
      }

      // Usuario nuevo, sin sesiones
      res.json({
        hasInProgress: false,
        lastCompleted: null
      });

    } catch (error) {
      console.error("Error obteniendo continue-learning:", error);
      res.status(500).json({
        error: "Error obteniendo información",
        details: error.message
      });
    }
  });

  return router;
};
