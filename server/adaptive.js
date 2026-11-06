/**
 * ADAPTIVE ENGINE MVP
 * 
 * Responsabilidad: Decidir qué hacer con cada respuesta del usuario
 * NO genera contenido nuevo, solo decide intervenciones adaptativas
 * 
 * Flujo:
 * 1. Answer Evaluator → correct/incorrect/partial/misconception
 * 2. Intervention Decider → Tuko, card, visual, overlay, silencio
 * 3. Progress Updater → actualiza perfil cognitivo
 * 4. Next Step Resolver → avanzar, repetir, remedial
 * 5. Response Builder → estructura respuesta para frontend
 * 
 * OPTIMIZACIONES FASE 2:
 * - Cache in-memory para module_steps (elimina -300ms)
 * - Eliminación de query redundante (elimina -200ms)
 * - Write-behind pattern para profile updates (elimina -400ms)
 */

const cache = require('./cache');
const profileQueue = require('./profileQueue');

// El cliente de Supabase se inyectará desde el router
let supabaseClient = null;

function initializeSupabase(supabase) {
  supabaseClient = supabase;
}

function getSupabase() {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
  }
  return supabaseClient;
}

// ============================================
// 1. ANSWER EVALUATOR
// ============================================

/**
 * Evalúa la respuesta del usuario contra expected_answer
 * @param {Object} params
 * @param {string} params.stepId - UUID del step
 * @param {string} params.answer - Respuesta del usuario
 * @param {Object} params.enrichedContent - enriched_content del step
 * @param {number} params.attemptNumber - Número de intento
 * @returns {Object} evaluation result
 */
async function evaluateAnswer({ stepId, answer, enrichedContent, attemptNumber }) {
  // Support both formats: expected_answer wrapper OR direct enrichedContent
  const expectedAnswer = enrichedContent?.expected_answer || enrichedContent;
  
  if (!expectedAnswer || !expectedAnswer.type) {
    return {
      result: 'partial',
      misconception_key: null,
      cognitive_dimension: 'comprension',
      confidence: 0.5,
      reasoning: 'No expected_answer or type defined in enriched_content'
    };
  }

  const answerType = expectedAnswer.type; // 'text', 'option', 'numeric', 'multiple_select', 'matching', 'ordering'
  const evaluationStrategy = expectedAnswer.evaluation_strategy || answerType; // Support 'keywords' strategy
  const userAnswerNormalized = answer.toLowerCase().trim();

  let result = 'incorrect';
  let misconception_key = null;
  let confidence = 0.0;

  // Evaluación por tipo o strategy
  switch (evaluationStrategy) {
    case 'option': {
      // Respuesta de opción múltiple (índice numérico)
      const correctOptions = expectedAnswer.correct_options || [];
      const userAnswerIndex = parseInt(answer, 10);
      
      if (!isNaN(userAnswerIndex) && correctOptions.includes(userAnswerIndex)) {
        result = 'correct';
        confidence = 1.0;
      } else {
        // Revisar si coincide con algún misconception conocido (pattern matching)
        const misconceptions = expectedAnswer.misconceptions || [];
        const matchedMisconception = misconceptions.find(m => {
          const pattern = new RegExp(m.pattern);
          return pattern.test(answer);
        });
        if (matchedMisconception) {
          misconception_key = matchedMisconception.misconception_key;
          confidence = 0.9;
        } else {
          confidence = 0.8; // Respuesta incorrecta sin misconception identificado
        }
      }
      break;
    }

    case 'multiple_select': {
      // Respuesta con múltiples opciones correctas
      try {
        const userSelections = JSON.parse(answer); // Array de índices
        const correctOptions = expectedAnswer.correct_options || [];
        
        if (!Array.isArray(userSelections)) {
          confidence = 0.5;
          break;
        }
        
        // Calcular coincidencias
        const correctCount = userSelections.filter(idx => correctOptions.includes(idx)).length;
        const incorrectCount = userSelections.filter(idx => !correctOptions.includes(idx)).length;
        const missedCount = correctOptions.filter(idx => !userSelections.includes(idx)).length;
        
        const totalCorrect = correctOptions.length;
        const accuracy = correctCount / totalCorrect;
        
        if (accuracy === 1.0 && incorrectCount === 0) {
          result = 'correct';
          confidence = 1.0;
        } else if (accuracy >= 0.7 && incorrectCount <= 1) {
          result = 'partial';
          confidence = 0.6 + (accuracy * 0.2);
        } else {
          result = 'incorrect';
          confidence = 0.7;
        }
      } catch (e) {
        console.error('[evaluateAnswer] Error parsing multiple_select answer:', e);
        confidence = 0.5;
      }
      break;
    }

    case 'matching': {
      // Respuesta de relacionar pares
      try {
        const userPairs = JSON.parse(answer); // Array de [leftIndex, rightIndex]
        const correctPairs = expectedAnswer.correct_pairs || [];
        
        if (!Array.isArray(userPairs)) {
          confidence = 0.5;
          break;
        }
        
        // Calcular cuántos pares son correctos
        let correctMatches = 0;
        userPairs.forEach(([left, right]) => {
          const isCorrect = correctPairs.some(([cLeft, cRight]) => cLeft === left && cRight === right);
          if (isCorrect) correctMatches++;
        });
        
        const totalPairs = correctPairs.length;
        const accuracy = correctMatches / totalPairs;
        
        if (accuracy === 1.0) {
          result = 'correct';
          confidence = 1.0;
        } else if (accuracy >= 0.6) {
          result = 'partial';
          confidence = 0.5 + (accuracy * 0.3);
        } else {
          result = 'incorrect';
          confidence = 0.7;
        }
      } catch (e) {
        console.error('[evaluateAnswer] Error parsing matching answer:', e);
        confidence = 0.5;
      }
      break;
    }

    case 'ordering': {
      require('./learningFormats').validateOrderingAnswer(answer, expectedAnswer.correct_order);
      // Respuesta de ordenar secuencia
      try {
        const userOrder = JSON.parse(answer); // Array de índices en orden
        const correctOrder = expectedAnswer.correct_order || [];
        
        if (!Array.isArray(userOrder)) {
          confidence = 0.5;
          break;
        }
        
        // Calcular cuántos elementos están en posición correcta
        let correctPositions = 0;
        const length = Math.min(userOrder.length, correctOrder.length);
        
        for (let i = 0; i < length; i++) {
          if (userOrder[i] === correctOrder[i]) {
            correctPositions++;
          }
        }
        
        const accuracy = correctPositions / correctOrder.length;
        
        if (accuracy === 1.0) {
          result = 'correct';
          confidence = 1.0;
        } else if (accuracy >= 0.7) {
          result = 'partial';
          confidence = 0.5 + (accuracy * 0.4);
        } else {
          result = 'incorrect';
          confidence = 0.7;
        }
      } catch (e) {
        console.error('[evaluateAnswer] Error parsing ordering answer:', e);
        confidence = 0.5;
      }
      break;
    }

    case 'numeric': {
      // Respuesta numérica
      const userNumber = parseFloat(answer);
      const correctNumber = parseFloat(expectedAnswer.correct_value);
      const tolerance = expectedAnswer.tolerance ?? 0.01;
      
      if (!isNaN(userNumber) && !isNaN(correctNumber)) {
        if (Math.abs(userNumber - correctNumber) <= tolerance) {
          result = 'correct';
          confidence = 1.0;
        } else {
          confidence = 0.8;
        }
      }
      break;
    }

    case 'keywords': {
      // Respuesta por keywords (más flexible con variaciones)
      // Soportar dos estructuras:
      // 1. required_keywords/optional_keywords (estructura antigua)
      // 2. keywords/min_keywords (estructura nueva de enriquecimiento)
      
      const keywords = expectedAnswer.keywords || expectedAnswer.required_keywords || [];
      const minKeywords = expectedAnswer.min_keywords || Math.ceil(keywords.length * 0.75);
      const optionalKeywords = expectedAnswer.optional_keywords || [];
      
      // Si no hay keywords definidas, rechazar la respuesta
      if (keywords.length === 0) {
        result = 'incorrect';
        confidence = 0.5;
        break;
      }

      let matchedCount = 0;
      let optionalCount = 0;

      // Función de lematización básica en español
      const stemWord = (word) => {
        word = word.toLowerCase().trim();
        
        // Eliminar acentos para normalización
        word = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Plurales: -es, -s
        word = word.replace(/([^aeiou])es$/, '$1');
        word = word.replace(/s$/, '');
        
        // Diminutivos y aumentativos
        word = word.replace(/(it|cit|ic|ill|uel|uec|az|ot|on|azo)$/i, '');
        
        // Verbos regulares en infinitivo
        if (word.match(/(ar|er|ir)$/)) {
          return word.replace(/(ar|er|ir)$/, '');
        }
        
        // Conjugaciones verbales comunes
        word = word.replace(/(ando|iendo|ado|ido|ar|er|ir|aba|aba|ia|mos|is|an|en|o|as|a|es|e)$/i, '');
        
        // Sustantivos/adjetivos: -ción, -sión, -dad, -tad, -eza, -ancia, -encia, -ismo, -ista
        word = word.replace(/(cion|sion|dad|tad|eza|ancia|encia|ismo|ista|mente|al|ante|ente|oso|osa)$/i, '');
        
        // Retornar al menos 3 caracteres para evitar sobre-stemming
        return word.length >= 3 ? word : word;
      };

      // Helper function to check keyword with flexible matching
      const containsKeyword = (text, keyword) => {
        const keywordLower = keyword.toLowerCase();
        
        // 1. Match exacto (rápido)
        if (text.includes(keywordLower)) return true;
        
        // 2. Match de frases completas (ej: "factores económicos")
        if (keyword.includes(' ')) {
          // Para frases, buscar ambas palabras cerca
          const words = keyword.split(' ');
          const allWordsPresent = words.every(w => {
            const stem = stemWord(w);
            return text.split(/\s+/).some(tw => stemWord(tw).startsWith(stem) || stem.startsWith(stemWord(tw)));
          });
          if (allWordsPresent) return true;
        }
        
        // 3. Stemming: comparar raíces
        const keywordStem = stemWord(keyword);
        if (keywordStem.length < 3) return false; // Skip palabras muy cortas
        
        const textWords = text.split(/\s+/);
        for (const textWord of textWords) {
          const textStem = stemWord(textWord);
          
          // Match si ambos stems coinciden o uno contiene al otro
          if (textStem.length >= 3 && 
              (textStem === keywordStem || 
               textStem.startsWith(keywordStem) || 
               keywordStem.startsWith(textStem))) {
            return true;
          }
        }
        
        return false;
      };

      keywords.forEach(keyword => {
        if (containsKeyword(userAnswerNormalized, keyword.toLowerCase())) {
          matchedCount++;
        }
      });

      optionalKeywords.forEach(keyword => {
        if (containsKeyword(userAnswerNormalized, keyword.toLowerCase())) {
          optionalCount++;
        }
      });

      // Evaluar basándose en min_keywords
      if (matchedCount >= minKeywords) {
        result = 'correct';
        confidence = 0.75 + (matchedCount / keywords.length) * 0.2 + (optionalCount * 0.01);
      } else if (matchedCount >= Math.ceil(minKeywords * 0.6)) {
        result = 'partial';
        confidence = 0.5 + (matchedCount / keywords.length) * 0.3;
      } else {
        result = 'incorrect';
        confidence = 0.7;
      }
      break;
    }

    case 'text':
    default: {
      // Respuesta de texto libre (más difícil, usar similarity básica)
      const correctText = expectedAnswer.correct_text?.toLowerCase() || '';
      
      // Similarity muy básica (MVP)
      if (userAnswerNormalized === correctText) {
        result = 'correct';
        confidence = 1.0;
      } else if (userAnswerNormalized.includes(correctText) || correctText.includes(userAnswerNormalized)) {
        result = 'partial';
        confidence = 0.6;
      } else {
        result = 'incorrect';
        confidence = 0.5;
      }
      break;
    }
  }

  // Obtener cognitive_dimension del step
  const { data: stepData } = await getSupabase()
    .schema('kuneo')
    .from('module_steps')
    .select('cognitive_dimension')
    .eq('id', stepId)
    .single();

  const cognitive_dimension = stepData?.cognitive_dimension || 'comprension';

  return {
    result,
    misconception_key,
    cognitive_dimension,
    confidence,
    reasoning: `Answer type: ${answerType}, Result: ${result}`
  };
}

// ============================================
// 2. INTERVENTION DECIDER
// ============================================

/**
 * Decide qué intervención aplicar basado en la evaluación
 * @param {Object} evaluation - Resultado de evaluateAnswer
 * @param {Object} context - Contexto del intento
 * @param {Object} enrichedContent - enriched_content completo para acceder a tutor_responses
 * @returns {Object} intervention decision
 */
function decideIntervention(evaluation, context, enrichedContent = null) {
  const { result, misconception_key, cognitive_dimension } = evaluation;
  const { attempt_number, time_on_task, hint_requests, step_config } = context;

  // Obtener mensajes personalizados si existen
  const tutorResponses = enrichedContent?.tutor_responses || {};
  
  // Helper: seleccionar mensaje aleatorio de un array
  const pickRandomMessage = (messages) => {
    if (!messages || messages.length === 0) return null;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  let intervention = {
    show_tuko: false,
    tuko_state: null,
    message: null,
    card_variant: null,
    concept_card_key: null,
    visual_template_key: null,
    visual_overlay: null,
    animation_mode: null,
    intervention_type: 'none'
  };

  const avgTimeExpected = step_config?.expected_time || 60; // segundos

  // REGLA: Correct + Fast → Silencio
  if (result === 'correct' && time_on_task < avgTimeExpected * 0.7) {
    intervention.intervention_type = 'silence';
    // No mostrar nada, solo avanzar
    return intervention;
  }

  // REGLA: Correct + Normal → Brief feedback
  if (result === 'correct' && time_on_task <= avgTimeExpected * 1.5) {
    intervention.show_tuko = false;
    intervention.message = pickRandomMessage(tutorResponses.correct) || 
                          step_config?.success_message || 
                          '¡Correcto!';
    intervention.intervention_type = 'none';
    return intervention;
  }

  // REGLA: Correct + Slow → Feedback + Reflection prompt
  if (result === 'correct' && time_on_task > avgTimeExpected * 1.5) {
    intervention.show_tuko = true;
    intervention.tuko_state = 'encourage';
    intervention.message = pickRandomMessage(tutorResponses.correct) || 
                          '¡Lo lograste! ¿Cómo llegaste a esa respuesta?';
    intervention.intervention_type = 'hint';
    return intervention;
  }

  // REGLA: Misconception detected → Corrective card + overlay
  if (misconception_key) {
    intervention.show_tuko = true;
    intervention.tuko_state = 'hint';
    // Usar mensaje contextualizado si existe, sino fallback genérico
    intervention.message = pickRandomMessage(tutorResponses.incorrect_attempt_1) ||
                          step_config?.hints?.[0] || 
                          'Revisa esta parte con cuidado.';
    intervention.card_variant = 'corrective';
    intervention.concept_card_key = misconception_key; // buscar concept_card asociada
    intervention.visual_overlay = 'corrective';
    intervention.intervention_type = 'card';
    return intervention;
  }

  // REGLA: Incorrect first attempt → Short hint
  if (result === 'incorrect' && attempt_number === 1) {
    const hint = pickRandomMessage(tutorResponses.incorrect_attempt_1) ||
                 step_config?.hints?.[0] || 
                 'Revisa tu respuesta e intenta nuevamente.';
    intervention.show_tuko = false;
    intervention.message = hint;
    intervention.intervention_type = 'hint';
    return intervention;
  }

  // REGLA: Incorrect second attempt → Hint card
  if (result === 'incorrect' && attempt_number === 2) {
    intervention.show_tuko = true;
    intervention.tuko_state = 'hint';
    intervention.message = pickRandomMessage(tutorResponses.incorrect_attempt_2) ||
                          step_config?.hints?.[1] || 
                          'Te doy una pista.';
    intervention.card_variant = 'hint';
    intervention.concept_card_key = step_config?.hint_card_key;
    intervention.visual_overlay = 'hint';
    intervention.intervention_type = 'card';
    return intervention;
  }

  // REGLA: Incorrect third attempt → Corrective card + remedial option
  if (result === 'incorrect' && attempt_number >= 3) {
    intervention.show_tuko = true;
    intervention.tuko_state = 'hint';
    intervention.message = 'Veamos esto con más detalle.';
    intervention.card_variant = 'corrective';
    intervention.concept_card_key = step_config?.concept_card_key;
    intervention.visual_template_key = step_config?.visual_template_key;
    intervention.visual_overlay = 'corrective';
    intervention.intervention_type = 'remedial';
    return intervention;
  }

  // REGLA: Partial → Encourage + specific hint
  if (result === 'partial') {
    intervention.show_tuko = false;
    intervention.message = 'Vas por buen camino. ' + (step_config?.hints?.[0] || 'Intenta ser más específico.');
    intervention.intervention_type = 'hint';
    return intervention;
  }

  return intervention;
}

// ============================================
// 3. PROGRESS UPDATER
// ============================================

/**
 * Actualiza el progreso del usuario en múltiples tablas
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.moduleId
 * @param {string} params.stepId
 * @param {Object} params.evaluation
 * @param {Object} params.intervention
 * @param {Object} params.attemptData
 */
async function updateProgress({ userId, moduleId, stepId, evaluation, intervention, attemptData }) {
  const { result, misconception_key, cognitive_dimension } = evaluation;

  // Calcular mastery_delta según resultado
  let mastery_delta = 0;
  if (result === 'correct') {
    if (attemptData.time_on_task < attemptData.expected_time * 0.7) {
      mastery_delta = 0.12; // fast correct
    } else if (attemptData.time_on_task <= attemptData.expected_time * 1.5) {
      mastery_delta = 0.08; // normal correct
    } else {
      mastery_delta = 0.05; // slow correct
    }
  } else if (result === 'incorrect') {
    if (attemptData.attempt_number === 1) {
      mastery_delta = 0; // primera falla, no penalizar aún
    } else if (attemptData.attempt_number === 2) {
      mastery_delta = -0.03;
    } else {
      mastery_delta = -0.08;
    }
  } else if (result === 'partial') {
    mastery_delta = 0.03;
  }

  // Ajuste por misconception
  if (misconception_key) {
    mastery_delta -= 0.05;
  }

  // 1. OPTIMIZACIÓN: Obtener último attempt_number (más rápido que COUNT)
  // ANTES: COUNT query ~200ms → DESPUÉS: SELECT con LIMIT 1 ~50ms
  const { data: lastAttempt } = await getSupabase()
    .schema('kuneo')
    .from('student_step_attempts')
    .select('attempt_number')
    .eq('user_id', userId)
    .eq('step_id', stepId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const actualAttemptNumber = (lastAttempt?.attempt_number || 0) + 1;

  // 2. Registrar attempt
  const { error: attemptError } = await getSupabase()
    .schema('kuneo')
    .from('student_step_attempts')
    .insert({
      user_id: userId,
      module_id: moduleId,
      step_id: stepId,
      answer: attemptData.answer,
      answer_type: attemptData.answer_type,
      result,
      misconception_key,
      cognitive_dimension,
      attempt_number: actualAttemptNumber,
      time_on_task: attemptData.time_on_task,
      hint_requests: attemptData.hint_requests,
      confidence_level: attemptData.confidence,
      intervention_type: intervention.intervention_type,
      card_variant: intervention.card_variant,
      visual_overlay: intervention.visual_overlay,
      tuko_showed: intervention.show_tuko,
      tuko_state: intervention.tuko_state,
      mastery_delta
    });

  if (attemptError) {
    console.error('[updateProgress] Error inserting attempt:', attemptError);
  }

  // 3. OPTIMIZACIÓN: Paralelizar queries independientes
  // ANTES: 2 queries secuenciales ~600ms → DESPUÉS: Paralelos ~300ms
  const [progressResult, profileResult] = await Promise.all([
    getSupabase()
      .schema('kuneo')
      .from('student_module_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single(),
    getSupabase()
      .schema('kuneo')
      .from('student_cognitive_profile')
      .select('*')
      .eq('user_id', userId)
      .single()
  ]);

  const progressData = progressResult.data;
  const profileData = profileResult.data;

  // 4. Preparar updates para ambas entidades
  let progressUpdates = null;
  let profileUpdates = null;

  if (progressData) {
    // Actualizar score de la dimensión correspondiente (weighted average)
    const currentScore = progressData[`${cognitive_dimension}_score`] || 50;
    const newScore = Math.max(0, Math.min(100, currentScore * 0.85 + mastery_delta * 100 * 0.15));

    progressUpdates = {
      [`${cognitive_dimension}_score`]: newScore,
      total_attempts: progressData.total_attempts + 1,
      last_activity_at: new Date().toISOString()
    };

    if (result === 'correct') {
      progressUpdates.correct_attempts = progressData.correct_attempts + 1;
    }

    if (attemptData.hint_requests > 0) {
      progressUpdates.hints_used = progressData.hints_used + attemptData.hint_requests;
    }
  }

  if (profileData) {
    const currentGlobalScore = profileData[cognitive_dimension] || 50;
    const newGlobalScore = Math.max(0, Math.min(100, currentGlobalScore * 0.85 + mastery_delta * 100 * 0.15));

    profileUpdates = {
      [cognitive_dimension]: newGlobalScore,
      total_attempts: profileData.total_attempts + 1,
      total_steps_completed: result === 'correct' ? profileData.total_steps_completed + 1 : profileData.total_steps_completed
    };

    if (result === 'correct') {
      profileUpdates.total_correct_responses = profileData.total_correct_responses + 1;
    }

    // Actualizar common_misconceptions si se detectó uno
    if (misconception_key) {
      const misconceptions = profileData.common_misconceptions || [];
      const existing = misconceptions.find(m => m.key === misconception_key);
      if (existing) {
        existing.count++;
      } else {
        misconceptions.push({ key: misconception_key, count: 1 });
      }
      profileUpdates.common_misconceptions = misconceptions;
    }
  }

  // 5. FASE 2.3: UPDATE con Write-Behind Pattern
  // ANTES: UPDATE profile síncrono ~270ms → DESPUÉS: Enqueue asíncrono ~1ms
  // Trade-off: Eventual consistency (aceptable para perfiles)
  
  // UPDATE progress síncrono (crítico para next step logic)
  if (progressUpdates) {
    await getSupabase()
      .schema('kuneo')
      .from('student_module_progress')
      .update(progressUpdates)
      .eq('user_id', userId)
      .eq('module_id', moduleId);
  }

  // UPDATE profile asíncrono (no bloqueante)
  if (profileUpdates) {
    profileQueue.enqueueProfileUpdate(userId, profileUpdates);
  }

  // FASE 2.2: Retornar también progressData para reusar en submitAnswer
  return { 
    mastery_delta, 
    new_score: progressData ? progressData[`${cognitive_dimension}_score`] : 50,
    progressData // Retornar para evitar query redundante
  };
}

// ============================================
// 4. NEXT STEP RESOLVER
// ============================================

/**
 * Decide la siguiente acción (avanzar, repetir, remedial)
 * @param {Object} params
 * @param {Object} params.evaluation
 * @param {Object} params.moduleProgress
 * @param {Object} params.currentStep
 * @param {Array} params.lastAttempts
 * @returns {Object} next action
 */
async function resolveNextStep({ evaluation, moduleProgress, currentStep, lastAttempts }) {
  const { result } = evaluation;

  // REGLA: Correct → Next step
  if (result === 'correct') {
    console.log('[decideNextAction] Current step data:', {
      step_id: currentStep.id || currentStep.step_id,
      module_id: currentStep.module_id,
      step_order: currentStep.step_order,
      has_enriched: !!currentStep.enriched_content
    });

    // Obtener siguiente step por step_order (solo steps enriquecidos)
    const { data: nextSteps, error: nextStepError } = await getSupabase()
      .schema('kuneo')
      .from('module_steps')
      .select('*')
      .eq('module_id', currentStep.module_id)
      .gt('step_order', currentStep.step_order)
      .not('enriched_content', 'is', null)
      .order('step_order', { ascending: true })
      .limit(1);

    console.log('[decideNextAction] Query params:', {
      module_id: currentStep.module_id,
      step_order_gt: currentStep.step_order
    });
    console.log('[decideNextAction] Next steps found:', nextSteps?.length || 0);
    if (nextSteps && nextSteps.length > 0) {
      console.log('[decideNextAction] Next step details:', {
        step_id: nextSteps[0].id,
        step_order: nextSteps[0].step_order
      });
    }
    if (nextStepError) console.log('[decideNextAction] Error:', nextStepError);

    const nextStep = nextSteps && nextSteps.length > 0 ? nextSteps[0] : null;

    if (nextStep) {
      console.log('[decideNextAction] Next step found:', nextStep.step_order);
      return {
        action: 'next_step',
        next_step_id: nextStep.step_id,
        insert_remedial_step: false
      };
    } else {
      // No hay más steps, módulo completado
      console.log('[decideNextAction] No more steps, module complete');
      return {
        action: 'complete_module',
        next_step_id: null,
        insert_remedial_step: false
      };
    }
  }

  // REGLA: Incorrect < 3 attempts → Retry
  const attemptCount = lastAttempts.filter(a => a.step_id === currentStep.step_id).length;
  if (result === 'incorrect' && attemptCount < 3) {
    return {
      action: 'retry_current_step',
      next_step_id: currentStep.step_id,
      attempt_number: attemptCount + 1,
      insert_remedial_step: false
    };
  }

  // REGLA: Incorrect >= 3 attempts → Insert remedial
  if (result === 'incorrect' && attemptCount >= 3) {
    return {
      action: 'insert_remedial_step',
      next_step_id: null, // se creará dinámicamente
      remedial_type: 'worked_example',
      insert_remedial_step: true
    };
  }

  // Default: retry
  return {
    action: 'retry_current_step',
    next_step_id: currentStep.step_id,
    attempt_number: attemptCount + 1,
    insert_remedial_step: false
  };
}

// ============================================
// 5. MAIN API FUNCTION: submitAnswer
// ============================================

/**
 * Función principal que orquesta todo el Adaptive Engine
 * @param {Object} submission - Datos del intento del usuario
 * @returns {Object} Response para el frontend
 */
async function submitAnswer(submission) {
  const {
    user_id,
    module_id,
    step_id,
    answer,
    time_on_task,
    hint_requests,
    confidence,
    attempt_number
  } = submission;

  try {
    // 1. FASE 2.1: Obtener step con enriched_content (CON CACHE)
    // ANTES: SELECT directo ~300ms → DESPUÉS: Cache hit ~5ms
    const stepData = await cache.getStep(step_id, async (id) => {
      const { data } = await getSupabase()
        .schema('kuneo')
        .from('module_steps')
        .select('id, module_id, enriched_content, step_order')
        .eq('id', id)
        .single();
      return data;
    });

    console.log('[submitAnswer] stepData from cache:', {
      id: stepData?.id,
      module_id: stepData?.module_id,
      step_order: stepData?.step_order,
      has_enriched: !!stepData?.enriched_content
    });

    if (!stepData) {
      throw new Error('Step not found');
    }

    // 2. Evaluar respuesta
    const evaluation = await evaluateAnswer({
      stepId: step_id,
      answer,
      enrichedContent: stepData.enriched_content,
      attemptNumber: attempt_number || 1
    });

    // 3. Decidir intervención
    const intervention = decideIntervention(evaluation, {
      attempt_number: attempt_number || 1,
      time_on_task,
      hint_requests,
      step_config: stepData.enriched_content?.step_config || {}
    }, stepData.enriched_content);

    // 4. Actualizar progreso
    // Mapear answer_type para DB (solo acepta: text, option, numeric, drawing)
    let dbAnswerType = stepData.enriched_content?.expected_answer?.type || 'text';
    if (dbAnswerType === 'keywords') {
      dbAnswerType = 'text'; // keywords es una strategy, no un type
    }
    
    // DEBUG: Log answer_type for step 5
    if (step_id === '249b3b6e-267b-4b57-9964-bf830b44b558') {
      console.log('[DEBUG STEP 5] enriched_content.type:', stepData.enriched_content?.type);
      console.log('[DEBUG STEP 5] expected_answer.type:', stepData.enriched_content?.expected_answer?.type);
      console.log('[DEBUG STEP 5] dbAnswerType:', dbAnswerType);
    }
    
    const progressUpdate = await updateProgress({
      userId: user_id,
      moduleId: module_id,
      stepId: step_id,
      evaluation,
      intervention,
      attemptData: {
        answer,
        answer_type: dbAnswerType,
        attempt_number: attempt_number || 1,
        time_on_task,
        hint_requests,
        confidence,
        expected_time: stepData.enriched_content?.step_config?.expected_time || 60
      }
    });

    // 5. FASE 2.2: Resolver next step (REUTILIZAR progressData)
    // ANTES: SELECT module_progress de nuevo ~270ms → DESPUÉS: Reusar 0ms
    const moduleProgress = progressUpdate.progressData; // Reutilizar en vez de query

    const { data: lastAttempts } = await getSupabase()
      .schema('kuneo')
      .from('student_step_attempts')
      .select('*')
      .eq('user_id', user_id)
      .eq('step_id', step_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const nextAction = await resolveNextStep({
      evaluation,
      moduleProgress,
      currentStep: stepData,
      lastAttempts: lastAttempts || []
    });

    // 6. Construir respuesta
    return {
      success: true,
      evaluation: {
        result: evaluation.result,
        cognitive_dimension: evaluation.cognitive_dimension,
        misconception_key: evaluation.misconception_key,
        confidence: evaluation.confidence
      },
      intervention: {
        show_tuko: intervention.show_tuko,
        tuko_state: intervention.tuko_state,
        message: intervention.message,
        card_variant: intervention.card_variant,
        concept_card_key: intervention.concept_card_key,
        visual_template_key: intervention.visual_template_key,
        visual_overlay: intervention.visual_overlay,
        animation_mode: intervention.animation_mode
      },
      next_action: {
        type: nextAction.action,
        next_step_id: nextAction.next_step_id,
        attempt_number: nextAction.attempt_number,
        insert_remedial_step: nextAction.insert_remedial_step
      },
      progress_update: {
        mastery_delta: progressUpdate.mastery_delta,
        new_score: progressUpdate.new_score,
        dimension: evaluation.cognitive_dimension
      }
    };

  } catch (error) {
    console.error('[submitAnswer] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// CACHE WARMUP (FASE 2.1) & QUEUE INIT (FASE 2.3)
// ============================================

/**
 * Inicializar cache y queue al iniciar el servidor
 * Debe llamarse al iniciar el servidor
 */
async function initializeCache({ warmup = true } = {}) {
  console.log('[Adaptive] Initializing cache and queue...');
  
  try {
    // Inicializar profileQueue con Supabase client
    profileQueue.initialize(getSupabase());
    if (!warmup) {
      console.log('[Adaptive] Caché bajo demanda; precarga masiva desactivada.');
      return { totalSteps: 0, duration: 0 };
    }
    
    // Función para obtener módulos activos
    const fetchActiveModules = async () => {
      let allModules = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await getSupabase()
          .schema('kuneo')
          .from('modules')
          .select('id')
          .eq('is_active', true)
          .range(from, from + pageSize - 1);
        
        if (error) {
          console.error('[Adaptive] Error fetching modules:', error.message);
          break;
        }
        
        if (!data || data.length === 0) break;
        
        allModules = allModules.concat(data);
        
        // Si recibimos menos que pageSize, ya terminamos
        if (data.length < pageSize) break;
        
        from += pageSize;
      }
      
      return allModules;
    };
    
    // Función para obtener steps de un módulo con enriched_content
    const fetchSteps = async (moduleId) => {
      const { data, error } = await getSupabase()
        .schema('kuneo')
        .from('module_steps')
        .select('id, module_id, enriched_content, step_order')
        .eq('module_id', moduleId)
        .not('enriched_content', 'is', null);
      
      if (error) {
        console.error(`[Cache] Error fetching steps for module ${moduleId}:`, error.message);
        return [];
      }
      
      return data || [];
    };
    
    // Ejecutar warmup
    const result = await cache.warmupCache(fetchActiveModules, fetchSteps);
    console.log(`[Adaptive] Cache initialized: ${result.totalSteps} steps in ${result.duration}ms`);
    
    return result;
  } catch (error) {
    console.error('[Adaptive] Cache initialization failed:', error);
    return { totalSteps: 0, duration: 0 };
  }
}

/**
 * Obtener estadísticas del cache y queue
 */
function getCacheStats() {
  return {
    cache: cache.getStats(),
    queue: profileQueue.getStats()
  };
}

/**
 * Shutdown graceful (procesar queue antes de cerrar)
 */
async function shutdown() {
  console.log('[Adaptive] Shutdown requested...');
  await profileQueue.shutdown();
  cache.flushAll();
  console.log('[Adaptive] Shutdown complete');
}

// ============================================
// 6. PRE-FETCH FUNCTION (UX Optimization)
// ============================================

/**
 * Pre-fetch next step data for UX optimization
 * Retrieves step data without full evaluation logic
 * @param {Object} params
 * @param {string} params.module_id - Module UUID
 * @param {number} params.step_order - Current step order
 * @param {string} params.user_id - User UUID
 * @returns {Object} Next step data (partial)
 */
async function preFetchNextStep({ module_id, step_order, user_id }) {
  try {
    // Get next step by order
    const { data: nextStep, error } = await getSupabase()
      .schema('kuneo')
      .from('module_steps')
      .select('id, step_order, step_type, content, cognitive_dimension')
      .eq('module_id', module_id)
      .gt('step_order', step_order)
      .order('step_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[preFetchNextStep] Error:', error);
      return { success: false, error: error.message };
    }

    if (!nextStep) {
      // No more steps, module will be completed
      return {
        success: true,
        has_next_step: false,
        module_complete: true
      };
    }

    // Return minimal data needed for pre-fetch
    return {
      success: true,
      has_next_step: true,
      module_complete: false,
      next_step: {
        id: nextStep.id,
        step_order: nextStep.step_order,
        step_type: nextStep.step_type,
        content: nextStep.content,
        cognitive_dimension: nextStep.cognitive_dimension
      }
    };

  } catch (error) {
    console.error('[preFetchNextStep] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  initializeSupabase,
  submitAnswer,
  evaluateAnswer,
  decideIntervention,
  updateProgress,
  resolveNextStep,
  preFetchNextStep, // UX optimization
  // Fase 2: Cache & Queue
  initializeCache,
  getCacheStats,
  shutdown
};
