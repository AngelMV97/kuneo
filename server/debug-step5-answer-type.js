require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function debugStep5() {
  console.log('\n🔍 DEBUG STEP 5 - ANSWER TYPE\n');
  
  const stepId = '249b3b6e-267b-4b57-9964-bf830b44b558';
  
  // 1. Check database
  const { data: step, error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('enriched_content')
    .eq('id', stepId)
    .single();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📁 DATABASE enriched_content:');
  console.log('  type:', step.enriched_content.type);
  console.log('  expected_answer.type:', step.enriched_content.expected_answer?.type);
  console.log('  expected_answer.evaluation_strategy:', step.enriched_content.expected_answer?.evaluation_strategy);
  
  // 2. Check what value would be used as dbAnswerType
  let dbAnswerType = step.enriched_content?.expected_answer?.type || 'text';
  if (dbAnswerType === 'keywords') {
    dbAnswerType = 'text';
  }
  
  console.log('\n🔧 COMPUTED dbAnswerType:', dbAnswerType);
  
  // 3. Check constraint
  const { data: constraint } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT consrc 
        FROM pg_constraint 
        WHERE conname = 'student_step_attempts_answer_type_check'
      `
    });
  
  console.log('\n📋 CONSTRAINT (if query works):');
  console.log(constraint);
  
  // 4. Try a test insert (dry run)
  console.log('\n🧪 TESTING insert with computed dbAnswerType...');
  const testInsert = {
    user_id: '00000000-0000-0000-0000-000000000000',
    module_id: 'e43bb575-a5d6-4bee-bc97-c7895421ae13',
    step_id: stepId,
    answer: '2',
    answer_type: dbAnswerType,
    result: 'correct',
    attempt_number: 1,
    time_on_task: 10,
    hint_requests: 0
  };
  
  console.log('  Attempting insert with answer_type:', testInsert.answer_type);
  
  const { error: insertError } = await supabase
    .schema('kuneo')
    .from('student_step_attempts')
    .insert(testInsert);
  
  if (insertError) {
    console.error('\n❌ INSERT FAILED:', insertError.message);
    console.error('   Code:', insertError.code);
    console.error('   Details:', insertError.details);
  } else {
    console.log('\n✅ Insert would succeed with answer_type:', dbAnswerType);
    
    // Clean up test record
    await supabase
      .schema('kuneo')
      .from('student_step_attempts')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
  }
}

debugStep5().then(() => process.exit(0));
