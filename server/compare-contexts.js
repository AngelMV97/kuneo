const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function compareContexts() {
  console.log('Comparando contexts de diferentes grados...\n');
  
  // Grade 4-5
  const { data: grade45 } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', '604231bc-8ce4-45e7-932d-745d821dfeaa')
    .in('step_order', [1, 2, 7]);
  
  // Grade 8-9
  const { data: grade89 } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .in('step_order', [1, 2, 7]);
  
  // Grade 10-11
  const { data: grade1011 } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', '10eacd17-7dbd-4d2d-8292-9a1257f9114c')
    .in('step_order', [1, 2]);
  
  console.log('=== GRADE 4-5 ===\n');
  grade45?.forEach(s => {
    console.log(`Step ${s.step_order}:`);
    console.log(`  Question: ${s.enriched_content?.question}`);
    console.log(`  Context: ${s.enriched_content?.context}`);
    console.log(`  Answer: ${JSON.stringify(s.enriched_content?.expected_answer?.correct_options || s.enriched_content?.options?.[s.enriched_content?.expected_answer?.correct_options?.[0]])}`);
    console.log('');
  });
  
  console.log('\n=== GRADE 8-9 ===\n');
  grade89?.forEach(s => {
    console.log(`Step ${s.step_order}:`);
    console.log(`  Question: ${s.enriched_content?.question}`);
    console.log(`  Context: ${s.enriched_content?.context}`);
    console.log(`  Answer: ${JSON.stringify(s.enriched_content?.expected_answer?.correct_options || s.enriched_content?.options?.[s.enriched_content?.expected_answer?.correct_options?.[0]])}`);
    console.log('');
  });
  
  console.log('\n=== GRADE 10-11 ===\n');
  grade1011?.forEach(s => {
    console.log(`Step ${s.step_order}:`);
    console.log(`  Question: ${s.enriched_content?.question}`);
    console.log(`  Context: ${s.enriched_content?.context}`);
    console.log(`  Answer: ${JSON.stringify(s.enriched_content?.expected_answer?.correct_options || s.enriched_content?.options?.[s.enriched_content?.expected_answer?.correct_options?.[0]])}`);
    console.log('');
  });
}

compareContexts().catch(console.error);
