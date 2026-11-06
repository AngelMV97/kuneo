require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyTypes() {
  console.log('🔍 Verificando tipos de preguntas del módulo e43bb575...\n');
  
  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', 'e43bb575-a5d6-4bee-bc97-c7895421ae13')
    .order('step_order');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  steps.forEach(step => {
    const content = step.enriched_content;
    console.log(`Step ${step.step_order}:`);
    console.log(`  - type: ${content?.type || 'N/A'}`);
    console.log(`  - expected_answer.type: ${content?.expected_answer?.type || 'N/A'}`);
    console.log(`  - question: ${content?.question?.substring(0, 60)}...`);
    console.log('');
  });

  process.exit(0);
}

verifyTypes().catch(console.error);
