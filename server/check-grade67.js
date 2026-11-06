const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkModule() {
  const MODULE_ID = '4b94fd6c-ea04-4889-b025-546fc6e5ab1f';
  
  // Get module info
  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', MODULE_ID)
    .single();
  
  console.log('=== GRADE 6-7 MODULE ===');
  console.log('Title:', module.title);
  console.log('Concept:', module.core_concept);
  console.log('Grade:', module.grade_range);
  console.log('');
  
  // Get steps
  const { data: steps } = await supabase
    .from('module_steps')
    .select('id, step_order, cognitive_dimension, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');
  
  if (!steps) {
    console.log('No steps found for this module');
    return;
  }
  
  console.log(`Total steps: ${steps.length}\n`);
  
  steps.forEach(s => {
    const hasEnriched = s.enriched_content && Object.keys(s.enriched_content).length > 0;
    
    if (!hasEnriched) {
      console.log(`Step ${s.step_order} (${s.cognitive_dimension}) - NO ENRICHED CONTENT`);
      console.log('');
      return;
    }
    
    const context = s.enriched_content?.context || 'NO CONTEXT';
    const question = s.enriched_content?.question || 'NO QUESTION';
    const type = s.enriched_content?.type || 'NO TYPE';
    
    console.log(`Step ${s.step_order} (${s.cognitive_dimension}) - Type: ${type}`);
    console.log(`  Q: ${question.substring(0, 70)}...`);
    console.log(`  Context (${context.length} chars): ${context.substring(0, 120)}...`);
    console.log('');
  });
}

checkModule().catch(console.error);
