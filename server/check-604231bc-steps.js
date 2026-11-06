/**
 * Verificar si existen steps para el módulo 604231bc
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

async function checkModuleSteps() {
  console.log(`\n🔍 Verificando steps para módulo ${MODULE_ID}...\n`);

  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!steps || steps.length === 0) {
    console.log('❌ No se encontraron steps para este módulo');
    return;
  }

  console.log(`✅ Se encontraron ${steps.length} steps\n`);
  
  steps.forEach(step => {
    const hasEnrichment = step.enriched_content !== null;
    const status = hasEnrichment ? '✅' : '❌';
    const preview = hasEnrichment ? 
      (step.enriched_content.question || step.enriched_content.questions?.[0]?.text || 'Sin pregunta').substring(0, 60) :
      'Sin enriquecimiento';
    
    console.log(`${status} Step ${step.step_order} (${step.step_type}): ${preview}...`);
  });
}

checkModuleSteps()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
