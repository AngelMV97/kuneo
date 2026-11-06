require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkStep4() {
  const { data, error } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', 'e43bb575-a5d6-4bee-bc97-c7895421ae13')
    .eq('step_order', 4)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📋 Step 4 - Multiple Select Configuration:\n');
  const content = data.enriched_content;
  
  console.log('Type:', content.type);
  console.log('\nQuestion:', content.question);
  console.log('\nOptions:');
  content.options.forEach((opt, idx) => {
    console.log(`  [${idx}] ${opt}`);
  });
  console.log('\nCorrect Options (indices):', content.correct_options);
  console.log('\nCorrect answers are:');
  content.correct_options.forEach(idx => {
    console.log(`  ✓ [${idx}] ${content.options[idx]}`);
  });
}

checkStep4();
