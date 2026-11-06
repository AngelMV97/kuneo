require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkStep6() {
  const { data, error } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', 'e43bb575-a5d6-4bee-bc97-c7895421ae13')
    .eq('step_order', 6)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📋 Step 6 - Ordering Configuration:\n');
  const content = data.enriched_content;
  
  console.log('Type:', content.type);
  console.log('\nQuestion:', content.question);
  console.log('\nItems (with original indices):');
  content.items.forEach((item, idx) => {
    console.log(`  [${idx}] ${item}`);
  });
  console.log('\nCorrect Order (array of indices):', content.correct_order);
  console.log('\nInterpretación del orden correcto:');
  if (content.correct_order) {
    content.correct_order.forEach((originalIdx, position) => {
      console.log(`  Posición ${position + 1}: [${originalIdx}] ${content.items[originalIdx]}`);
    });
  } else {
    console.log('  ⚠️ correct_order no está definido!');
  }
}

checkStep6();
