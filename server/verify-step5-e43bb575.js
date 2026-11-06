require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyStep5() {
  console.log('\n🔍 VERIFICANDO STEP 5 DE e43bb575\n');
  
  const { data, error } = await supabase
    .from('module_steps')
    .select('*')
    .eq('id', '249b3b6e-267b-4b57-9964-bf830b44b558')
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('Step ID:', data.id);
  console.log('Module ID:', data.module_id);
  console.log('Step Order:', data.step_order);
  console.log('Phase:', data.phase);
  console.log('\nEnriched Content:');
  console.log(JSON.stringify(data.enriched_content, null, 2));
}

verifyStep5().catch(console.error);
