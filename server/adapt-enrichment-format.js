/**
 * Adaptar formato de enriched_content para compatibilidad con frontend
 * 
 * Frontend espera:
 * - enriched_content.question (string)
 * - enriched_content.type (string)
 * - enriched_content.expected_answer (string/array)
 * - enriched_content.options (array para multiple_choice)
 * 
 * Nuestro formato actual:
 * - enriched_content.questions[] (array de preguntas)
 * - enriched_content.phase
 * - enriched_content.cognitive_dimension
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Convierte array de preguntas a formato de pregunta única
 */
function adaptQuestionsToFrontend(enrichedContent, step) {
  if (!enrichedContent || !enrichedContent.questions || enrichedContent.questions.length === 0) {
    return null;
  }

  // Tomar la primera pregunta del array (o una aleatoria)
  const mainQuestion = enrichedContent.questions[0];

  // Crear estructura compatible con frontend
  const adapted = {
    // Pregunta principal
    question: mainQuestion.text,
    type: mainQuestion.type,
    difficulty: mainQuestion.difficulty,
    
    // Respuesta esperada (depende del tipo)
    expected_answer: getExpectedAnswer(mainQuestion),
    
    // Opciones (para multiple_choice, matching, etc.)
    options: mainQuestion.options || [],
    
    // Mantener información de jerarquía
    hierarchy: enrichedContent.hierarchy,
    
    // Información pedagógica
    phase: enrichedContent.phase,
    cognitive_dimension: enrichedContent.cognitive_dimension,
    cognitive_level: mainQuestion.cognitive_level,
    
    // Feedback y hints (generar basado en la pregunta)
    hints: generateHints(mainQuestion, enrichedContent),
    feedback: generateFeedback(mainQuestion, enrichedContent),
    
    // Metadata
    metadata: {
      ...enrichedContent.metadata,
      total_questions_available: enrichedContent.questions.length,
      adapted_at: new Date().toISOString(),
      step_order: step.step_order
    }
  };

  return adapted;
}

function getExpectedAnswer(question) {
  // Para multiple_choice, la respuesta correcta
  if (question.type === 'multiple_choice' && question.options) {
    const correctOption = question.options.find(o => o.is_correct);
    return correctOption ? correctOption.text : null;
  }
  
  // Para true_false
  if (question.type === 'true_false') {
    return 'true'; // placeholder
  }
  
  // Para short_answer, essay, etc.
  return question.expected_keywords || 'respuesta abierta';
}

function generateHints(question, enrichedContent) {
  const cognitiveAspect = enrichedContent.cognitive_dimension || 'comprensión';
  
  return [
    {
      level: 'light',
      text: `Piensa en ${cognitiveAspect} del concepto.`
    },
    {
      level: 'medium',
      text: `Recuerda que esta pregunta trata sobre ${enrichedContent.phase}.`
    },
    {
      level: 'strong',
      text: `Considera: ${enrichedContent.hierarchy?.competency?.substring(0, 60) || 'el objetivo de aprendizaje'}`
    }
  ];
}

function generateFeedback(question, enrichedContent) {
  return {
    correct: `¡Excelente! Has demostrado ${enrichedContent.cognitive_dimension}.`,
    incorrect: `Revisa el concepto de ${enrichedContent.phase}. Intenta de nuevo.`,
    partial: `Vas por buen camino en ${enrichedContent.cognitive_dimension}. Refina tu respuesta.`
  };
}

/**
 * Adaptar todos los steps de un módulo
 */
async function adaptModule(moduleId) {
  console.log(`\n🔄 Adaptando formato del módulo ${moduleId.substring(0, 8)}...`);
  console.log('='.repeat(80));

  // Obtener steps con enriched_content
  const { data: steps, error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .eq('module_id', moduleId)
    .not('enriched_content', 'is', null)
    .order('step_order');

  if (error) {
    console.error('❌ Error obteniendo steps:', error.message);
    return { success: false, error };
  }

  if (!steps || steps.length === 0) {
    console.log('⚠️  No hay steps enriquecidos para adaptar');
    return { success: false, error: 'No steps found' };
  }

  console.log(`📝 Adaptando ${steps.length} steps...\n`);

  let adapted = 0;
  let skipped = 0;
  let errors = 0;

  for (const step of steps) {
    // Verificar si ya tiene el formato correcto
    if (step.enriched_content.question) {
      console.log(`  ⏭️  Step ${step.step_order}: Ya tiene formato correcto`);
      skipped++;
      continue;
    }

    // Adaptar formato
    const adaptedContent = adaptQuestionsToFrontend(step.enriched_content, step);

    if (!adaptedContent) {
      console.log(`  ❌ Step ${step.step_order}: No se pudo adaptar (sin preguntas)`);
      errors++;
      continue;
    }

    // Actualizar en base de datos
    const { error: updateError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .update({ enriched_content: adaptedContent })
      .eq('id', step.id);

    if (updateError) {
      console.error(`  ❌ Step ${step.step_order}: Error actualizando - ${updateError.message}`);
      errors++;
    } else {
      console.log(`  ✅ Step ${step.step_order}: Adaptado (${adaptedContent.type})`);
      console.log(`     "${adaptedContent.question.substring(0, 70)}..."`);
      adapted++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN:\n');
  console.log(`  Total steps: ${steps.length}`);
  console.log(`  ✅ Adaptados: ${adapted}`);
  console.log(`  ⏭️  Saltados: ${skipped}`);
  console.log(`  ❌ Errores: ${errors}`);

  return { success: true, adapted, skipped, errors };
}

/**
 * Script principal
 */
async function main() {
  console.log('🔄 ADAPTANDO FORMATO DE ENRICHED_CONTENT\n');
  console.log('='.repeat(80));
  console.log('Convirtiendo array de questions a formato de pregunta única\n');

  const moduleIds = [
    '604231bc-8ce4-45e7-932d-745d821dfeaa', // Grado 4-5 (original)
    'e43bb575-a5d6-4bee-bc97-c7895421ae13', // Grado 1-3
    'ac62bde3-ea14-4fcd-82a1-15da56067ab9', // Grado 4-5 (alternativo)
    'd8365a0a-9d61-43dd-ae0d-7d9841e4a52b', // Grado 6
    '2657df4d-0c9a-4c8b-82a7-e1fd1edbf8c1', // Grado 7
    'ff576221-b3b0-42c4-8b8b-81e47baa5555', // Grado 8-9
    '4b319ed1-ed26-4c04-bbae-05d955da24eb'  // Grado 10-11
  ];

  const results = {
    total: moduleIds.length,
    successful: 0,
    failed: 0,
    totalAdapted: 0,
    totalSkipped: 0,
    totalErrors: 0
  };

  for (const moduleId of moduleIds) {
    const result = await adaptModule(moduleId);
    
    if (result.success) {
      results.successful++;
      results.totalAdapted += result.adapted || 0;
      results.totalSkipped += result.skipped || 0;
      results.totalErrors += result.errors || 0;
    } else {
      results.failed++;
    }
  }

  // Resumen final
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESUMEN FINAL\n');
  console.log(`  Módulos procesados: ${results.total}`);
  console.log(`  ✅ Exitosos: ${results.successful}`);
  console.log(`  ❌ Fallidos: ${results.failed}`);
  console.log(`\n  Steps adaptados: ${results.totalAdapted}`);
  console.log(`  Steps saltados: ${results.totalSkipped}`);
  console.log(`  Errores: ${results.totalErrors}`);

  console.log('\n✨ Adaptación completada\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ ERROR FATAL:', err);
    process.exit(1);
  });
