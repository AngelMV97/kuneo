/**
 * Ver estructura completa del step 1 del módulo 604231bc
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

async function inspectStep1() {
  console.log('🔍 ESTRUCTURA COMPLETA DEL STEP 1\n');

  const { data: step } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', MODULE_ID)
    .eq('step_order', 1)
    .single();

  console.log(JSON.stringify(step.enriched_content, null, 2));
  
  console.log('\n\n📋 CAMPOS EN ENRICHED_CONTENT:');
  console.log(Object.keys(step.enriched_content).join(', '));
  
  console.log('\n\n¿Tiene campo "options"?', step.enriched_content.options ? 'SÍ' : 'NO');
  if (step.enriched_content.options) {
    console.log('  Número de opciones:', step.enriched_content.options.length);
  }
}

inspectStep1()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
