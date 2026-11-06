require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function debugModule() {
  console.log('🔍 Inspeccionando steps 3, 4 y 5 del módulo 4b94fd6c...\n');

  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .in('step_order', [3, 4, 5])
    .order('step_order');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  for (const step of steps) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 STEP ${step.step_order}:`);
    console.log(`   ID: ${step.id}`);
    console.log(`   Type: ${step.enriched_content?.type || 'N/A'}`);
    console.log(`   Question: ${step.enriched_content?.question || 'N/A'}`);
    
    if (step.step_order === 5 && step.enriched_content?.left_items) {
      console.log('\n   Left items:');
      step.enriched_content.left_items.forEach((item, i) => {
        console.log(`     ${i}: ${item}`);
      });
      
      console.log('\n   Right items:');
      step.enriched_content.right_items.forEach((item, i) => {
        console.log(`     ${i}: ${item}`);
      });
      
      console.log('\n   Correct pairs:');
      step.enriched_content.expected_answer.correct_pairs.forEach((pair, i) => {
        const leftIdx = pair[0];
        const rightIdx = pair[1];
        console.log(`     ${step.enriched_content.left_items[leftIdx]} → ${step.enriched_content.right_items[rightIdx]}`);
      });
    }
    
    if (step.enriched_content?.expected_answer?.keywords) {
      console.log(`   Keywords: ${step.enriched_content.expected_answer.keywords.slice(0, 10).join(', ')}...`);
    }
  }

  process.exit(0);
}

debugModule().catch(console.error);
