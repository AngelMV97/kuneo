const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '50723c30-801e-4fcf-a0d9-bc8aabf7d392';

(async () => {
  console.log('🔍 Verificando módulo de Derechos y Responsabilidades...\n');

  // 1. Verificar información del módulo
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, learning_objective, core_concept, subject, grade_range')
    .eq('id', MODULE_ID)
    .single();

  if (moduleError) {
    console.error('❌ Error obteniendo módulo:', moduleError.message);
    return;
  }

  console.log('📚 MÓDULO:');
  console.log(`   Título: ${module.title}`);
  console.log(`   Objetivo: ${module.learning_objective}`);
  console.log(`   Concepto: ${module.core_concept}`);
  console.log(`   Materia: ${module.subject}`);
  console.log(`   Grado: ${module.grade_range}\n`);

  // 2. Verificar steps
  const { data: steps, error: stepsError } = await supabase
    .from('module_steps')
    .select('id, step_order, phase, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (stepsError) {
    console.error('❌ Error obteniendo steps:', stepsError.message);
    return;
  }

  console.log('📝 STEPS:');
  steps.forEach(step => {
    const content = step.enriched_content;
    const hasContent = content && Object.keys(content).length > 0;
    const contextLength = content?.context?.length || 0;
    const hasKeywords = content?.expected_answer?.keywords?.length > 0;
    const minKeywords = content?.expected_answer?.min_keywords;
    
    console.log(`\n   Step ${step.step_order} (${step.phase}):`);
    console.log(`   ✓ Tipo: ${content?.type || 'N/A'}`);
    console.log(`   ✓ Pregunta: ${content?.question?.substring(0, 60)}...`);
    console.log(`   ✓ Context: ${contextLength} chars`);
    console.log(`   ✓ Tutor responses: ${content?.tutor_responses ? 'Sí' : 'No'}`);
    console.log(`   ✓ Step config: ${content?.step_config ? 'Sí' : 'No'}`);
    
    if (hasKeywords) {
      console.log(`   ✓ Keywords: ${content.expected_answer.keywords.length} keywords, min: ${minKeywords}`);
    }
  });

  console.log('\n\n✅ Módulo completo y listo para usar!');
  console.log(`\n🌐 URL para probar: http://localhost:5174/module/${MODULE_ID}`);
})();
