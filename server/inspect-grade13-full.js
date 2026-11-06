/**
 * Ver contenido COMPLETO del enriched_content del módulo Grado 1-3
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

async function inspectFullContent() {
  console.log(`\n🔍 Contenido COMPLETO del módulo Grado 1-3...\n`);

  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  steps.forEach(step => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`STEP ${step.step_order}`);
    console.log('='.repeat(80));
    console.log(JSON.stringify(step.enriched_content, null, 2));
  });
}

inspectFullContent()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
