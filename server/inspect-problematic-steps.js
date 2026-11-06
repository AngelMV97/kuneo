/**
 * Ver estructura completa de los steps problemáticos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_45 = '604231bc-8ce4-45e7-932d-745d821dfeaa';

async function inspectProblematicSteps() {
  console.log('🔍 INSPECCIONANDO STEPS 1 Y 3 DEL MÓDULO 604231bc\n');

  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', MODULE_45)
    .in('step_order', [1, 3]);

  steps.forEach(step => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`STEP ${step.step_order}`);
    console.log('='.repeat(80));
    console.log(JSON.stringify(step.enriched_content, null, 2));
  });
}

inspectProblematicSteps()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
