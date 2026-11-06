/**
 * Debug: verificar contenido exacto de los step IDs que aparecen en la consola
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STEP_IDS = [
  'e85a9358-39c9-420a-88a9-ca6c329eb7ca', // Index 0
  '066775e5-8e23-4af8-b3be-18c8da378df0', // Index 1
  'c1381070-ce33-4bb4-8810-57d0e2423bc1', // Index 2
  'c879893e-6d52-4547-9d9a-56a40ce9f12a'  // Index 3
];

async function debugSteps() {
  console.log('🔍 VERIFICANDO STEPS POR ID\n');

  for (let i = 0; i < STEP_IDS.length; i++) {
    const stepId = STEP_IDS[i];
    
    console.log(`${'='.repeat(80)}`);
    console.log(`STEP INDEX ${i} - ID: ${stepId}`);
    console.log('='.repeat(80));

    const { data: step, error } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('module_id, step_order, enriched_content')
      .eq('id', stepId)
      .single();

    if (error) {
      console.log(`❌ Error: ${error.message}\n`);
      continue;
    }

    console.log(`Module ID: ${step.module_id}`);
    console.log(`Step Order: ${step.step_order}`);
    
    if (step.enriched_content) {
      const ec = step.enriched_content;
      console.log(`\nTipo: ${ec.type || 'SIN TIPO'}`);
      console.log(`Pregunta: ${ec.question?.substring(0, 100) || 'N/A'}`);
      
      if (ec.type === 'option' && ec.options) {
        console.log(`Opciones (${ec.options.length}):`);
        ec.options.forEach((opt, idx) => {
          console.log(`  ${idx}. ${opt}`);
        });
      } else if (ec.type === 'keywords') {
        console.log(`Keywords: ${ec.expected_answer?.keywords?.length || 0} palabras`);
      } else if (ec.type === 'multiple_select') {
        console.log(`Opciones múltiples: ${ec.options?.length || 0}`);
      } else if (ec.type === 'matching') {
        console.log(`Items izquierda: ${ec.left_items?.length || 0}`);
        console.log(`Items derecha: ${ec.right_items?.length || 0}`);
        console.log(`Pares correctos:`, ec.correct_pairs);
      }
    } else {
      console.log('❌ SIN ENRICHED_CONTENT');
    }
    
    console.log();
  }

  // Verificar orden correcto del módulo
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICANDO ORDEN CORRECTO DE STEPS EN MÓDULO 604231bc');
  console.log('='.repeat(80));

  const { data: allSteps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', '604231bc-8ce4-45e7-932d-745d821dfeaa')
    .order('step_order');

  allSteps.forEach(step => {
    const ec = step.enriched_content;
    console.log(`\nStep ${step.step_order} (${step.id}):`);
    console.log(`  Tipo: ${ec?.type || 'SIN TIPO'}`);
    console.log(`  Pregunta: ${ec?.question?.substring(0, 60) || 'N/A'}...`);
  });
}

debugSteps()
  .then(() => {
    console.log('\n✅ Debug completado\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
