require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnrichedSteps() {
  console.log('Checking module ccec3bf2-66e2-427d-90b4-b8d8f09171cf...\n');
  
  // Check steps count
  const { data: steps, error, count } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order, enriched_content', { count: 'exact' })
    .eq('module_id', 'ccec3bf2-66e2-427d-90b4-b8d8f09171cf')
    .order('step_order');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total steps: ${count}`);
  console.log(`\nSteps found:`);
  
  steps.forEach(step => {
    const hasEnriched = step.enriched_content !== null && step.enriched_content !== undefined;
    console.log(`  Step ${step.step_order}: ${hasEnriched ? '✅ HAS enriched_content' : '❌ NO enriched_content'}`);
  });
  
  // Check if any enriched_content exists
  const { data: enrichedSteps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order')
    .eq('module_id', 'ccec3bf2-66e2-427d-90b4-b8d8f09171cf')
    .not('enriched_content', 'is', null);
  
  console.log(`\n✅ Steps with enriched_content: ${enrichedSteps?.length || 0}`);
  
  // Check all modules with enriched steps
  const { data: allEnriched, count: totalEnriched } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('module_id', { count: 'exact' })
    .not('enriched_content', 'is', null)
    .limit(10);
  
  console.log(`\n📊 Total steps with enriched_content in DB: ${totalEnriched}`);
  
  if (allEnriched && allEnriched.length > 0) {
    console.log('\nModules with enriched steps:');
    const uniqueModules = [...new Set(allEnriched.map(s => s.module_id))];
    uniqueModules.forEach(moduleId => {
      console.log(`  - ${moduleId}`);
    });
  }
}

checkEnrichedSteps().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
