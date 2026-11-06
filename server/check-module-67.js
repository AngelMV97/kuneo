require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '4b94fd6c-ea04-4889-b025-546fc6e5ab1f';

async function checkModule() {
  console.log('🔍 Verificando módulo 6-7 de Historia...\n');
  
  // Get module details
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', MODULE_ID)
    .single();

  if (moduleError) {
    console.error('❌ Error:', moduleError);
    return;
  }

  console.log('📚 MÓDULO:');
  console.log(`   ID: ${module.id}`);
  console.log(`   Título: ${module.title}`);
  console.log(`   Grado: ${module.grade_range}`);
  console.log(`   Concepto: ${module.core_concept}`);
  console.log(`   Objetivo: ${module.learning_objective}`);
  console.log('');

  // Get all steps
  const { data: steps, error: stepsError } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (stepsError) {
    console.error('❌ Error:', stepsError);
    return;
  }

  console.log(`📝 STEPS (${steps.length} total):\n`);
  
  steps.forEach(step => {
    const hasEnriched = step.enriched_content !== null;
    const status = hasEnriched ? '✅' : '❌';
    const type = hasEnriched ? step.enriched_content.type : 'N/A';
    
    console.log(`${status} Step ${step.step_order} (${step.phase}):`);
    console.log(`   ID: ${step.id}`);
    console.log(`   Type: ${type}`);
    
    if (hasEnriched) {
      console.log(`   Question: ${step.enriched_content.question?.substring(0, 60)}...`);
    }
    console.log('');
  });

  process.exit(0);
}

checkModule().catch(console.error);
