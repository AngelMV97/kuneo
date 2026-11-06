require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkModule() {
  console.log('🔍 Verificando módulo 4b94fd6c...\n');

  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .order('step_order');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`Total steps: ${steps.length}\n`);

  for (const step of steps) {
    const hasContent = step.enriched_content && typeof step.enriched_content === 'object';
    const type = step.enriched_content?.type || 'N/A';
    const question = step.enriched_content?.question || 'N/A';
    
    console.log(`Step ${step.step_order}:`);
    console.log(`  ID: ${step.id}`);
    console.log(`  Has enriched_content: ${hasContent ? '✅' : '❌'}`);
    console.log(`  Type: ${type}`);
    console.log(`  Question: ${question.substring(0, 80)}...`);
    console.log('');
  }

  const enrichedCount = steps.filter(s => 
    s.enriched_content && 
    typeof s.enriched_content === 'object' &&
    s.enriched_content.type &&
    s.enriched_content.question
  ).length;

  console.log(`\n✅ Steps enriquecidos: ${enrichedCount}/8`);

  process.exit(0);
}

checkModule().catch(console.error);
