/**
 * Ver estructura exacta del Step 4 (que funciona)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

async function checkStep4Structure() {
  const { data: step, error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', MODULE_ID)
    .eq('step_order', 4)
    .single();

  if (error) throw error;

  console.log('📋 Estructura completa del Step 4:\n');
  console.log(JSON.stringify(step.enriched_content, null, 2));
}

checkStep4Structure()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
