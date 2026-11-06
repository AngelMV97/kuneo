require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

async function verifyEnrichedContent() {
  console.log(`\n🔍 Verificando contenido enriquecido del módulo ${MODULE_ID}...\n`);

  // Obtener información del módulo
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('title, learning_objective, core_concept')
    .eq('id', MODULE_ID)
    .single();

  if (moduleError) {
    console.error('❌ Error obteniendo módulo:', moduleError.message);
    return;
  }

  console.log('📚 Información del módulo:');
  console.log(`   Título: ${module.title}`);
  console.log(`   Objetivo: ${module.learning_objective.substring(0, 80)}...`);
  console.log(`   Concepto Core: ${module.core_concept}\n`);

  // Obtener los steps con enriched_content
  const { data: steps, error: stepsError } = await supabase
    .from('module_steps')
    .select('id, step_order, phase, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (stepsError) {
    console.error('❌ Error obteniendo steps:', stepsError.message);
    return;
  }

  console.log(`📝 Verificando ${steps.length} steps:\n`);

  for (const step of steps) {
    const content = step.enriched_content;
    
    if (!content) {
      console.log(`   ❌ Step ${step.step_order}: Sin contenido enriquecido`);
      continue;
    }

    const contextLength = content.context?.length || 0;
    const keywordsCount = content.expected_answer?.keywords?.length || 0;
    const hasHints = content.tutor_responses?.hints?.length > 0;
    const hasReflection = content.step_config?.reflection_prompts?.length > 0;
    
    console.log(`   ✅ Step ${step.step_order} (${step.phase})`);
    console.log(`      - Tipo: ${content.type}`);
    console.log(`      - Context: ${contextLength} chars`);
    console.log(`      - Pregunta: "${content.question.substring(0, 60)}..."`);
    
    if (keywordsCount > 0) {
      const minKeywords = content.expected_answer.min_keywords;
      const percentage = Math.round((minKeywords / keywordsCount) * 100);
      console.log(`      - Keywords: ${keywordsCount} total, min ${minKeywords} (${percentage}%)`);
    }
    
    console.log(`      - Hints: ${hasHints ? '✓' : '✗'}`);
    console.log(`      - Reflection prompts: ${hasReflection ? '✓' : '✗'}`);
    console.log('');
  }

  console.log('✅ Verificación completa!\n');
}

verifyEnrichedContent().catch(console.error);
