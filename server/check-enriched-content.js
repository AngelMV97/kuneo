const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '50723c30-801e-4fcf-a0d9-bc8aabf7d392';

(async () => {
  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('\n🔍 Verificando enriched_content en la BD:\n');
  steps.forEach(step => {
    const hasEnriched = step.enriched_content && Object.keys(step.enriched_content).length > 0;
    const contextLength = step.enriched_content?.context?.length || 0;
    const type = step.enriched_content?.type || 'N/A';
    
    console.log(`Step ${step.step_order}:`);
    console.log(`  - Enriched: ${hasEnriched ? '✓' : '✗'}`);
    console.log(`  - Type: ${type}`);
    console.log(`  - Context: ${contextLength} chars`);
    console.log();
  });
})();
