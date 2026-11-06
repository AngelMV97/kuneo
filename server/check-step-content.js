const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkSteps() {
  // Get steps 1, 2, 7 from module 4-5
  const { data, error } = await supabase
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', '604231bc-8ce4-45e7-932d-745d821dfeaa')
    .in('step_order', [1, 2, 7])
    .order('step_order');
  
  if (error) throw error;
  
  for (const step of data) {
    console.log(`\n===== STEP ${step.step_order} =====`);
    const content = step.enriched_content;
    console.log('Type:', content.type);
    console.log('Has tutor_responses:', !!content.tutor_responses);
    if (content.tutor_responses) {
      console.log('Correct messages:', content.tutor_responses.correct?.length || 0);
      console.log('Sample correct:', content.tutor_responses.correct?.[0]?.substring(0, 80));
      console.log('Incorrect_attempt_1:', content.tutor_responses.incorrect_attempt_1?.length || 0);
      console.log('Sample incorrect_1:', content.tutor_responses.incorrect_attempt_1?.[0]?.substring(0, 80));
    }
    console.log('Has context:', !!content.context);
    if (content.context) {
      console.log('Context length:', content.context.length);
      console.log('Context preview:', content.context.substring(0, 120) + '...');
    }
  }
  
  // Get sample context from grade 8-9 and 10-11 for comparison
  console.log('\n\n========== COMPARISON WITH GRADE 8-9 ==========');
  const { data: g89 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .eq('step_order', 1)
    .single();
  
  console.log('Grade 8-9 Context length:', g89.enriched_content.context.length);
  console.log('Grade 8-9 Context preview:', g89.enriched_content.context.substring(0, 300) + '...');
  
  console.log('\n\n========== COMPARISON WITH GRADE 10-11 ==========');
  const { data: g1011 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '10eacd17-7dbd-4d2d-8292-9a1257f9114c')
    .eq('step_order', 1)
    .single();
  
  console.log('Grade 10-11 Context length:', g1011.enriched_content.context.length);
  console.log('Grade 10-11 Context preview:', g1011.enriched_content.context.substring(0, 300) + '...');
}

checkSteps().catch(console.error);
