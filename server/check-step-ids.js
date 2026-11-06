/**
 * Verificar IDs de todos los steps del módulo 604231bc
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

async function checkStepIDs() {
  console.log('🔍 IDs DE STEPS DEL MÓDULO 604231bc\n');

  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  steps.forEach(step => {
    const hasOptions = step.enriched_content?.options?.length > 0;
    const type = step.enriched_content?.type || 'sin tipo';
    console.log(`Step ${step.step_order}: ${step.id}`);
    console.log(`  Tipo: ${type}`);
    console.log(`  Tiene options: ${hasOptions ? 'SÍ (' + step.enriched_content.options.length + ')' : 'NO'}`);
    console.log();
  });
  
  console.log('\n📋 COMPARAR CON LOS IDs QUE APARECIERON EN LA CONSOLA:');
  console.log('  e85a9358-39c9-420a-88a9-ca6c329eb7ca <- step 1 según consola');
  console.log('  066775e5-8e23-4af8-b3be-18c8da378df0 <- step 2 según consola');
  console.log('  c1381070-ce33-4bb4-8810-57d0e2423bc1 <- step 3 según consola');
}

checkStepIDs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
