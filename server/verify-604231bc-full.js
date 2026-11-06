/**
 * Verificar contenido del módulo 604231bc COMPLETO
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

async function checkFull604231bc() {
  console.log(`\n🔍 Verificando módulo 604231bc COMPLETO...\n`);

  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Se encontraron ${steps.length} steps\n`);
  
  steps.forEach(step => {
    const hasEnrichment = step.enriched_content !== null;
    const questionText = step.enriched_content?.question || 
                         step.enriched_content?.questions?.[0]?.text;
    
    const isReal = questionText && 
                   questionText.length > 50 && 
                   !questionText.includes('[') &&
                   !questionText.includes('placeholder');
    
    const status = isReal ? '✅ REAL' : (questionText ? '⚠️  PLACEHOLDER' : '❌ VACÍO');
    const preview = questionText ? questionText.substring(0, 70) : 'Sin contenido';
    
    console.log(`${status} Step ${step.step_order}`);
    console.log(`   Pregunta: ${preview}...`);
    console.log(`   Tipo: ${step.enriched_content?.type || 'no especificado'}`);
    
    if (step.enriched_content?.options) {
      console.log(`   Opciones: ${step.enriched_content.options.length}`);
      console.log(`   Primera opción: ${step.enriched_content.options[0]}`);
    }
    console.log();
  });
}

checkFull604231bc()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
