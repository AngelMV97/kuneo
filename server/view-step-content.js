require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function viewStepContent(stepId) {
  console.log(`🔍 Viendo contenido del step ${stepId}...\n`);

  const { data: step } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .eq('id', stepId)
    .single();

  if (!step) {
    console.log('❌ Step no encontrado');
    process.exit(1);
  }

  console.log('📋 Información del step:');
  console.log(`  ID: ${step.id}`);
  console.log(`  Module ID: ${step.module_id}`);
  console.log(`  Step order: ${step.step_order}`);
  console.log(`  Has enriched_content: ${!!step.enriched_content}`);
  
  if (step.enriched_content) {
    console.log('\n📄 Enriched Content (JSON):');
    console.log(JSON.stringify(step.enriched_content, null, 2));
  } else {
    console.log('\n⚠️  No hay enriched_content');
  }

  process.exit(0);
}

// Step ID del primer step del módulo problemático
const stepId = process.argv[2] || '51e72770-61f8-4f2d-b954-df2614e48de4';
viewStepContent(stepId).catch(console.error);
