require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

async function getStepIds() {
  const { data, error } = await supabase
    .from('module_steps')
    .select('id, step_order, phase, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Steps del módulo:\n');
  data.forEach(step => {
    const hasContent = step.enriched_content && Object.keys(step.enriched_content).length > 0;
    console.log(`Step ${step.step_order}: phase=${step.phase?.padEnd(20)} ${hasContent ? '✅' : '❌'} id=${step.id}`);
  });
}

getStepIds().catch(console.error);
