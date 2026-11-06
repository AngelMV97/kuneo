/**
 * BOTTLENECK ANALYSIS TEST
 * 
 * Este script instrumenta el flujo completo de submitAnswer()
 * con timestamps detallados para identificar cuellos de botella.
 * 
 * Ejecutar: node test-bottleneck-analysis.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Test data
const TEST_USER_ID = 'b5d08d8c-2c8a-47aa-85e5-3cd58751f35d';
const TEST_MODULE_ID = 'e687871a-ecee-49f5-a4a2-54a0df47d1f4';

// Utilidades de timing
class Timer {
  constructor() {
    this.marks = {};
    this.durations = {};
  }

  mark(label) {
    this.marks[label] = Date.now();
  }

  measure(label, startLabel) {
    const start = this.marks[startLabel];
    const end = Date.now();
    const duration = end - start;
    this.durations[label] = duration;
    return duration;
  }

  getSummary() {
    return this.durations;
  }

  print() {
    console.log('\n📊 BREAKDOWN DE TIEMPO:\n');
    const entries = Object.entries(this.durations).sort((a, b) => b[1] - a[1]);
    let total = 0;
    
    entries.forEach(([label, duration]) => {
      total += duration;
      const percentage = 0; // Calcularemos después del total
      console.log(`   ${label.padEnd(40)} ${duration}ms`);
    });

    console.log(`   ${'─'.repeat(40)} ───────`);
    console.log(`   ${'TOTAL'.padEnd(40)} ${total}ms`);
    
    console.log('\n📈 PORCENTAJE POR CATEGORÍA:\n');
    entries.forEach(([label, duration]) => {
      const percentage = ((duration / total) * 100).toFixed(1);
      console.log(`   ${label.padEnd(40)} ${percentage}%`);
    });
  }
}

// ============================================
// FUNCIÓN INSTRUMENTADA: submitAnswer
// ============================================

async function submitAnswerInstrumented(submission) {
  const timer = new Timer();
  timer.mark('start');

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
    // 1. Obtener step con enriched_content
    timer.mark('step_1_start');
    const { data: stepData } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('*, enriched_content')
      .eq('id', step_id)
      .single();
    timer.measure('1. SELECT module_steps (enriched_content)', 'step_1_start');

    if (!stepData) {
      throw new Error('Step not found');
    }

    // 2. Evaluar respuesta
    timer.mark('step_2_start');
    const expectedAnswer = stepData.enriched_content?.expected_answer;
    
    // Lógica de evaluación (local, no DB)
    let result = 'correct';
    let misconception_key = null;
    let confidence_eval = 1.0;
    
    const answerType = expectedAnswer?.type || 'option';
    if (answerType === 'option') {
      const correctOptions = expectedAnswer?.correct_options || [0];
      const userAnswerIndex = parseInt(answer, 10);
      result = correctOptions.includes(userAnswerIndex) ? 'correct' : 'incorrect';
      confidence_eval = result === 'correct' ? 1.0 : 0.8;
    }
    
    timer.measure('2a. Evaluación local (compute)', 'step_2_start');

    // 2b. SELECT cognitive_dimension
    timer.mark('step_2b_start');
    const { data: stepCognitive } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('cognitive_dimension')
      .eq('id', step_id)
      .single();
    timer.measure('2b. SELECT cognitive_dimension', 'step_2b_start');

    const cognitive_dimension = stepCognitive?.cognitive_dimension || 'comprension';

    const evaluation = {
      result,
      misconception_key,
      cognitive_dimension,
      confidence: confidence_eval,
      reasoning: 'Instrumented test'
    };

    // 3. Decidir intervención (lógica local)
    timer.mark('step_3_start');
    const intervention = {
      show_tuko: result === 'incorrect',
      tuko_state: result === 'incorrect' ? 'confused' : 'happy',
      message: result === 'correct' ? '¡Correcto!' : 'Intenta de nuevo',
      card_variant: 'default',
      concept_card_key: null,
      visual_template_key: null,
      visual_overlay: null,
      animation_mode: 'normal'
    };
    timer.measure('3. decideIntervention (compute)', 'step_3_start');

    // 4. Actualizar progreso - SELECT MAX(attempt_number)
    timer.mark('step_4_start');
    const { data: lastAttempt } = await supabase
      .schema('kuneo')
      .from('student_step_attempts')
      .select('attempt_number')
      .eq('user_id', user_id)
      .eq('step_id', step_id)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    timer.measure('4a. SELECT MAX(attempt_number)', 'step_4_start');

    const actualAttemptNumber = (lastAttempt?.attempt_number || 0) + 1;

    // 4b. INSERT student_step_attempts
    timer.mark('step_4b_start');
    await supabase
      .schema('kuneo')
      .from('student_step_attempts')
      .insert({
        user_id,
        module_id,
        step_id,
        answer,
        answer_type: 'option',
        attempt_number: actualAttemptNumber,
        result,
        misconception_key,
        cognitive_dimension,
        time_on_task,
        hint_requests,
        confidence
      });
    timer.measure('4b. INSERT student_step_attempts', 'step_4b_start');

    // 4c. Parallel SELECT (progress + profile)
    timer.mark('step_4c_start');
    const [progressResult, profileResult] = await Promise.all([
      supabase
        .schema('kuneo')
        .from('student_module_progress')
        .select('*')
        .eq('user_id', user_id)
        .eq('module_id', module_id)
        .single(),
      supabase
        .schema('kuneo')
        .from('student_cognitive_profile')
        .select('*')
        .eq('user_id', user_id)
        .single()
    ]);
    timer.measure('4c. Parallel SELECT (progress + profile)', 'step_4c_start');

    const progressData = progressResult.data;
    const profileData = profileResult.data;

    // 4d. Preparar updates (compute local)
    timer.mark('step_4d_start');
    const mastery_delta = result === 'correct' ? 0.15 : -0.1;
    
    let progressUpdates = null;
    let profileUpdates = null;

    if (progressData) {
      const currentScore = progressData[`${cognitive_dimension}_score`] || 50;
      const newScore = Math.max(0, Math.min(100, currentScore * 0.85 + mastery_delta * 100 * 0.15));

      progressUpdates = {
        [`${cognitive_dimension}_score`]: newScore,
        total_attempts: progressData.total_attempts + 1,
        correct_attempts: result === 'correct' ? progressData.correct_attempts + 1 : progressData.correct_attempts,
        last_activity_at: new Date().toISOString()
      };
    }

    if (profileData) {
      const currentGlobalScore = profileData[cognitive_dimension] || 50;
      const newGlobalScore = Math.max(0, Math.min(100, currentGlobalScore * 0.85 + mastery_delta * 100 * 0.15));

      profileUpdates = {
        [cognitive_dimension]: newGlobalScore,
        total_attempts: profileData.total_attempts + 1,
        total_steps_completed: result === 'correct' ? profileData.total_steps_completed + 1 : profileData.total_steps_completed,
        total_correct_responses: result === 'correct' ? profileData.total_correct_responses + 1 : profileData.total_correct_responses
      };
    }
    timer.measure('4d. Preparar updates (compute)', 'step_4d_start');

    // 4e. Parallel UPDATE (progress + profile)
    timer.mark('step_4e_start');
    const updatePromises = [];
    
    if (progressUpdates) {
      updatePromises.push(
        supabase
          .schema('kuneo')
          .from('student_module_progress')
          .update(progressUpdates)
          .eq('user_id', user_id)
          .eq('module_id', module_id)
      );
    }

    if (profileUpdates) {
      updatePromises.push(
        supabase
          .schema('kuneo')
          .from('student_cognitive_profile')
          .update(profileUpdates)
          .eq('user_id', user_id)
      );
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
    timer.measure('4e. Parallel UPDATE (progress + profile)', 'step_4e_start');

    // 5. Resolver next step - SELECT module_progress
    timer.mark('step_5_start');
    const { data: moduleProgress } = await supabase
      .schema('kuneo')
      .from('student_module_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('module_id', module_id)
      .single();
    timer.measure('5a. SELECT module_progress (next step)', 'step_5_start');

    // 5b. SELECT last attempts
    timer.mark('step_5b_start');
    const { data: lastAttempts } = await supabase
      .schema('kuneo')
      .from('student_step_attempts')
      .select('*')
      .eq('user_id', user_id)
      .eq('step_id', step_id)
      .order('created_at', { ascending: false })
      .limit(5);
    timer.measure('5b. SELECT last attempts', 'step_5b_start');

    // 5c. Lógica de resolveNextStep (local)
    timer.mark('step_5c_start');
    const attemptCount = lastAttempts?.length || 0;
    let nextAction = {
      action: 'continue_to_next_step',
      next_step_id: null,
      attempt_number: 1,
      insert_remedial_step: false
    };

    if (result === 'correct') {
      // SELECT next step
      timer.mark('step_5c_select_start');
      const { data: nextStep } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('id, step_order')
        .eq('module_id', module_id)
        .gt('step_order', stepData.step_order)
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      timer.measure('5c. SELECT next_step (conditional)', 'step_5c_select_start');

      nextAction.next_step_id = nextStep?.id || null;
    }
    timer.measure('5d. resolveNextStep logic (compute)', 'step_5c_start');

    // Medir total
    const totalTime = timer.measure('TOTAL END-TO-END', 'start');

    return {
      success: true,
      totalTime,
      breakdown: timer.getSummary(),
      timer
    };

  } catch (error) {
    console.error('[submitAnswerInstrumented] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// TEST RUNNER
// ============================================

async function runBottleneckAnalysis() {
  console.log('\n========================================');
  console.log('🔬 ANÁLISIS PROFUNDO DE BOTTLENECKS');
  console.log('========================================\n');

  console.log('📌 Test User:', TEST_USER_ID);
  console.log('📌 Test Module:', TEST_MODULE_ID);
  console.log('🌐 Supabase URL:', SUPABASE_URL);

  // Obtener un step del módulo
  console.log('\n🔍 Obteniendo step de prueba...');
  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order, step_type')
    .eq('module_id', TEST_MODULE_ID)
    .order('step_order', { ascending: true })
    .limit(1);

  if (!steps || steps.length === 0) {
    console.error('❌ No se encontraron steps en el módulo');
    return;
  }

  const testStep = steps[0];
  console.log(`✅ Step encontrado: ${testStep.id} (order: ${testStep.step_order})`);

  // Ejecutar 5 requests para promediar
  console.log('\n🧪 Ejecutando 5 requests instrumentados...\n');

  const results = [];

  for (let i = 0; i < 5; i++) {
    process.stdout.write(`   Request ${i + 1}/5... `);
    
    const submission = {
      user_id: TEST_USER_ID,
      module_id: TEST_MODULE_ID,
      step_id: testStep.id,
      answer: '0', // Respuesta de opción múltiple
      time_on_task: 30,
      hint_requests: 0,
      confidence: 0.8,
      attempt_number: 1
    };

    const result = await submitAnswerInstrumented(submission);
    
    if (result.success) {
      results.push(result);
      console.log(`✓ ${result.totalTime}ms`);
    } else {
      console.log(`✗ Error: ${result.error}`);
    }

    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Analizar resultados
  console.log('\n========================================');
  console.log('📊 ANÁLISIS DE RESULTADOS');
  console.log('========================================');

  if (results.length === 0) {
    console.error('\n❌ No se pudo completar ningún request');
    return;
  }

  // Calcular promedios
  const avgBreakdown = {};
  const operationKeys = Object.keys(results[0].breakdown);

  operationKeys.forEach(key => {
    const values = results.map(r => r.breakdown[key]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    avgBreakdown[key] = Math.round(avg);
  });

  // Mostrar breakdown promedio
  console.log('\n📈 PROMEDIO DE 5 REQUESTS:\n');

  const entries = Object.entries(avgBreakdown).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, duration]) => sum + duration, 0);

  entries.forEach(([label, duration]) => {
    const percentage = ((duration / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(duration / 50));
    console.log(`   ${label.padEnd(42)} ${String(duration).padStart(5)}ms ${String(percentage).padStart(5)}% ${bar}`);
  });

  console.log(`\n   ${'─'.repeat(42)} ${'─'.repeat(5)}── ${'─'.repeat(5)}──`);
  console.log(`   ${'TOTAL'.padEnd(42)} ${String(total).padStart(5)}ms ${String('100.0').padStart(5)}%`);

  // Categorizar por tipo
  console.log('\n\n📊 RESUMEN POR CATEGORÍA:\n');

  const dbReads = entries.filter(([label]) => label.includes('SELECT'));
  const dbWrites = entries.filter(([label]) => label.includes('INSERT') || label.includes('UPDATE'));
  const compute = entries.filter(([label]) => label.includes('compute'));

  const dbReadsTotal = dbReads.reduce((sum, [, duration]) => sum + duration, 0);
  const dbWritesTotal = dbWrites.reduce((sum, [, duration]) => sum + duration, 0);
  const computeTotal = compute.reduce((sum, [, duration]) => sum + duration, 0);

  console.log(`   📖 DB Reads (SELECT):   ${String(dbReadsTotal).padStart(5)}ms (${((dbReadsTotal / total) * 100).toFixed(1)}%)`);
  console.log(`   ✏️  DB Writes:           ${String(dbWritesTotal).padStart(5)}ms (${((dbWritesTotal / total) * 100).toFixed(1)}%)`);
  console.log(`   🧮 Compute (local):     ${String(computeTotal).padStart(5)}ms (${((computeTotal / total) * 100).toFixed(1)}%)`);
  console.log(`   ❓ Overhead/Network:    ${String(total - dbReadsTotal - dbWritesTotal - computeTotal).padStart(5)}ms (${(((total - dbReadsTotal - dbWritesTotal - computeTotal) / total) * 100).toFixed(1)}%)`);

  // Top 5 bottlenecks
  console.log('\n\n🔥 TOP 5 BOTTLENECKS:\n');
  entries.slice(0, 5).forEach(([label, duration], index) => {
    const percentage = ((duration / total) * 100).toFixed(1);
    console.log(`   ${index + 1}. ${label}`);
    console.log(`      ⏱️  ${duration}ms (${percentage}% del total)\n`);
  });

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES DE OPTIMIZACIÓN:\n');

  if (dbReadsTotal > total * 0.4) {
    console.log('   ⚠️  DB Reads consumen >' + ((dbReadsTotal / total) * 100).toFixed(0) + '% del tiempo');
    console.log('   ✅ Recomendación: Implementar cache (Redis/in-memory) para module_steps\n');
  }

  if (dbWritesTotal > total * 0.3) {
    console.log('   ⚠️  DB Writes consumen >' + ((dbWritesTotal / total) * 100).toFixed(0) + '% del tiempo');
    console.log('   ✅ Recomendación: Write-behind pattern para profile updates\n');
  }

  const parallelSelects = avgBreakdown['4c. Parallel SELECT (progress + profile)'] || 0;
  if (parallelSelects > 300) {
    console.log('   ⚠️  Parallel SELECT aún toma ' + parallelSelects + 'ms');
    console.log('   ✅ Recomendación: Cache de progress/profile en Redis\n');
  }

  console.log('\n========================================');
  console.log('✅ ANÁLISIS COMPLETO');
  console.log('========================================\n');
}

// ============================================
// EJECUTAR
// ============================================

runBottleneckAnalysis().catch(console.error);
