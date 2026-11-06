/**
 * ADAPTIVE ENGINE ROUTER
 * 
 * Endpoints para el Adaptive Engine MVP
 * - POST /api/adaptive/submit-answer - Enviar respuesta y obtener evaluación adaptativa
 * - POST /api/adaptive/request-hint - Solicitar pista explícitamente
 * - GET /api/adaptive/progress/:userId - Obtener perfil cognitivo y progreso
 * - GET /api/adaptive/recommendations/:userId - Obtener recomendaciones personalizadas
 */

const express = require('express');
const adaptiveEngine = require('./adaptive');

module.exports = function(supabase) {
  const router = express.Router();
  
  // Inicializar adaptive engine con el cliente de Supabase (service role)
  adaptiveEngine.initializeSupabase(supabase);

  // ============================================
  // POST /api/adaptive/submit-answer
  // ============================================
  /**
   * Envía una respuesta del usuario y recibe evaluación adaptativa
   * 
   * Body:
   * {
   *   user_id: UUID,
   *   module_id: UUID,
   *   step_id: UUID,
   *   answer: string,
   *   time_on_task: number (segundos),
   *   hint_requests: number,
   *   confidence: 'low' | 'medium' | 'high',
   *   attempt_number?: number
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   evaluation: {...},
   *   intervention: {...},
   *   next_action: {...},
   *   progress_update: {...}
   * }
   */
  router.post('/adaptive/submit-answer', async (req, res) => {
    try {
      const {
        user_id,
        module_id,
        step_id,
        answer,
        time_on_task,
        hint_requests,
        confidence,
        attempt_number
      } = req.body;

      // Validación básica
      if (!user_id || !module_id || !step_id || answer === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id, module_id, step_id, answer'
        });
      }

      // Procesar respuesta con Adaptive Engine
      const result = await adaptiveEngine.submitAnswer({
        user_id,
        module_id,
        step_id,
        answer,
        time_on_task: time_on_task || 0,
        hint_requests: hint_requests || 0,
        confidence: confidence || 'medium',
        attempt_number: attempt_number || 1
      });

      res.json(result);

    } catch (error) {
      console.error('[POST /adaptive/submit-answer] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // GET /api/adaptive/prefetch-step (UX Optimization)
  // ============================================
  /**
   * Pre-fetch next step data for UX optimization
   * Returns minimal step data without full evaluation
   * 
   * Query params:
   * - module_id: UUID
   * - step_order: number
   * - user_id: UUID
   */
  router.get('/prefetch-step', async (req, res) => {
    try {
      const { module_id, step_order, user_id } = req.query;

      if (!module_id || step_order === undefined || !user_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameters: module_id, step_order, user_id'
        });
      }

      const result = await adaptiveEngine.preFetchNextStep({
        module_id,
        step_order: parseInt(step_order),
        user_id
      });

      res.json(result);

    } catch (error) {
      console.error('[GET /adaptive/prefetch-step] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // POST /api/adaptive/request-hint
  // ============================================
  /**
   * Usuario solicita explícitamente una pista
   * 
   * Body:
   * {
   *   user_id: UUID,
   *   module_id: UUID,
   *   step_id: UUID,
   *   hint_level: number (1, 2, 3) - progresión de pistas
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   hint: {
   *     type: 'text' | 'card' | 'visual',
   *     content: string,
   *     card_variant: string,
   *     concept_card_key: string,
   *     visual_template_key: string,
   *     visual_overlay: string
   *   },
   *   hint_count: number
   * }
   */
  router.post('/adaptive/request-hint', async (req, res) => {
    try {
      const { user_id, module_id, step_id, hint_level } = req.body;

      if (!user_id || !step_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id, step_id'
        });
      }

      // Obtener step con enriched_content
      const { data: stepData, error: stepError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('*, enriched_content')
        .eq('id', step_id)
        .single();

      if (stepError || !stepData) {
        return res.status(404).json({
          success: false,
          error: 'Step not found'
        });
      }

      // Contar hints ya solicitados
      const { data: attempts } = await supabase
        .schema('kuneo')
        .from('student_step_attempts')
        .select('hint_requests')
        .eq('user_id', user_id)
        .eq('step_id', step_id);

      const totalHints = attempts?.reduce((sum, a) => sum + (a.hint_requests || 0), 0) || 0;
      const nextHintLevel = Math.min(hint_level || totalHints + 1, 3);

      // Obtener hint del enriched_content
      const hints = stepData.enriched_content?.step_config?.hints || [];
      const hintText = hints[nextHintLevel - 1] || hints[0] || 'Revisa tu respuesta con cuidado.';

      // Decidir tipo de hint según nivel
      let hintResponse = {
        type: 'text',
        content: hintText,
        card_variant: null,
        concept_card_key: null,
        visual_template_key: null,
        visual_overlay: null
      };

      if (nextHintLevel === 2) {
        // Hint level 2: card hint
        hintResponse.type = 'card';
        hintResponse.card_variant = 'hint';
        hintResponse.concept_card_key = stepData.enriched_content?.step_config?.hint_card_key;
        hintResponse.visual_overlay = 'hint';
      } else if (nextHintLevel === 3) {
        // Hint level 3: visual hint
        hintResponse.type = 'visual';
        hintResponse.card_variant = 'hint';
        hintResponse.concept_card_key = stepData.enriched_content?.step_config?.concept_card_key;
        hintResponse.visual_template_key = stepData.enriched_content?.step_config?.visual_template_key;
        hintResponse.visual_overlay = 'hint';
      }

      res.json({
        success: true,
        hint: hintResponse,
        hint_count: totalHints + 1,
        hint_level: nextHintLevel
      });

    } catch (error) {
      console.error('[POST /adaptive/request-hint] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // GET /api/adaptive/progress/:userId
  // ============================================
  /**
   * Obtiene el perfil cognitivo y progreso del usuario
   * 
   * Params:
   * - userId: UUID
   * 
   * Query:
   * - moduleId?: UUID (opcional, para ver progreso de módulo específico)
   * 
   * Response:
   * {
   *   success: boolean,
   *   cognitive_profile: {...},
   *   current_modules: [...],
   *   strong_topics: [...],
   *   weak_topics: [...],
   *   mastery_by_microtopic: {...}
   * }
   */
  router.get('/adaptive/progress/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { moduleId } = req.query;

      // 1. Obtener perfil cognitivo global
      const { data: profile, error: profileError } = await supabase
        .schema('kuneo')
        .from('student_cognitive_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // ignore not found
        throw profileError;
      }

      // 2. Obtener progreso de módulos
      let moduleProgressQuery = supabase
        .schema('kuneo')
        .from('student_module_progress')
        .select(`
          *,
          modules (
            module_id,
            title,
            subject,
            difficulty_level,
            thumbnail_url
          )
        `)
        .eq('user_id', userId);

      if (moduleId) {
        moduleProgressQuery = moduleProgressQuery.eq('module_id', moduleId);
      } else {
        moduleProgressQuery = moduleProgressQuery.in('status', ['in_progress', 'completed']);
      }

      const { data: moduleProgress } = await moduleProgressQuery;

      // 3. Obtener mastery por microtopic
      const { data: taxonomyMastery } = await supabase
        .schema('kuneo')
        .from('student_taxonomy_mastery')
        .select('*')
        .eq('user_id', userId)
        .order('mastery_level', { ascending: false });

      res.json({
        success: true,
        cognitive_profile: profile || {
          user_id: userId,
          comprension: 50,
          representacion: 50,
          razonamiento: 50,
          transferencia: 50,
          metacognicion: 50,
          stage: 1,
          stage_progress: 0
        },
        current_modules: moduleProgress || [],
        strong_topics: profile?.strong_topics || [],
        weak_topics: profile?.weak_topics || [],
        mastery_by_microtopic: taxonomyMastery || []
      });

    } catch (error) {
      console.error('[GET /adaptive/progress/:userId] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // GET /api/adaptive/recommendations/:userId
  // ============================================
  /**
   * Obtiene recomendaciones personalizadas para el usuario
   * 
   * Params:
   * - userId: UUID
   * 
   * Query:
   * - limit?: number (default: 5)
   * - type?: string (filtrar por tipo de recomendación)
   * 
   * Response:
   * {
   *   success: boolean,
   *   recommendations: [...]
   * }
   */
  router.get('/adaptive/recommendations/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 5, type } = req.query;

      // Obtener recomendaciones activas
      let query = supabase
        .schema('kuneo')
        .from('student_recommendations')
        .select(`
          *,
          modules (
            id,
            title,
            learning_objective,
            subject,
            difficulty,
            grade_range
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (type) {
        query = query.eq('recommendation_type', type);
      }

      const { data: recommendations, error } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        recommendations: recommendations || []
      });

    } catch (error) {
      console.error('[GET /adaptive/recommendations/:userId] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // POST /api/adaptive/recommendations/:recommendationId/accept
  // ============================================
  /**
   * Marca una recomendación como aceptada
   */
  router.post('/adaptive/recommendations/:recommendationId/accept', async (req, res) => {
    try {
      const { recommendationId } = req.params;
      const { user_id } = req.body;

      const { data, error } = await supabase
        .schema('kuneo')
        .from('student_recommendations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('recommendation_id', recommendationId)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        recommendation: data
      });

    } catch (error) {
      console.error('[POST /adaptive/recommendations/:recommendationId/accept] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // POST /api/adaptive/recommendations/:recommendationId/dismiss
  // ============================================
  /**
   * Marca una recomendación como descartada
   */
  router.post('/adaptive/recommendations/:recommendationId/dismiss', async (req, res) => {
    try {
      const { recommendationId } = req.params;
      const { user_id } = req.body;

      const { data, error } = await supabase
        .schema('kuneo')
        .from('student_recommendations')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString()
        })
        .eq('recommendation_id', recommendationId)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        recommendation: data
      });

    } catch (error) {
      console.error('[POST /adaptive/recommendations/:recommendationId/dismiss] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};
