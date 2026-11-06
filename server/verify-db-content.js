/**
 * Verificar qué se guardó realmente en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_45 = '604231bc-8ce4-45e7-932d-745d821dfeaa'; // Grado 4-5
const MODULE_13 = 'e43bb575-a5d6-4bee-bc97-c7895421ae13'; // Grado 1-3

async function verifyModules() {
  console.log('🔍 VERIFICANDO MÓDULOS EN BASE DE DATOS\n');
  console.log('='.repeat(80));

  // Módulo 4-5
  console.log('\n📦 MÓDULO GRADO 4-5 (604231bc)');
  console.log('-'.repeat(80));
  
  const { data: module45, error: err45 } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('title, grade_range')
    .eq('id', MODULE_45)
    .single();

  if (err45) {
    console.log('❌ Error:', err45.message);
  } else {
    console.log(`Título: ${module45.title}`);
    console.log(`Grado: ${module45.grade_range}`);
  }

  const { data: steps45 } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', MODULE_45)
    .order('step_order');

  console.log('\nSteps:');
  steps45.forEach(step => {
    const ec = step.enriched_content;
    if (ec) {
      console.log(`  Step ${step.step_order}: ${ec.type || 'sin tipo'}`);
      console.log(`    Pregunta: ${ec.question?.substring(0, 80) || 'N/A'}`);
      if (!ec.type) {
        console.log(`    ⚠️  PROBLEMA: No tiene campo 'type'`);
        console.log(`    Campos: ${Object.keys(ec).join(', ')}`);
      }
    } else {
      console.log(`  Step ${step.step_order}: ❌ null`);
    }
  });

  // Módulo 1-3
  console.log('\n\n📦 MÓDULO GRADO 1-3 (e43bb575)');
  console.log('-'.repeat(80));
  
  const { data: module13, error: err13 } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('title, grade_range')
    .eq('id', MODULE_13)
    .single();

  if (err13) {
    console.log('❌ Error:', err13.message);
  } else {
    console.log(`Título: ${module13.title}`);
    console.log(`Grado: ${module13.grade_range}`);
  }

  const { data: steps13 } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', MODULE_13)
    .order('step_order');

  console.log('\nSteps:');
  steps13.forEach(step => {
    const ec = step.enriched_content;
    if (ec) {
      console.log(`  Step ${step.step_order}: ${ec.type || 'sin tipo'}`);
      console.log(`    Pregunta: ${ec.question?.substring(0, 80) || 'N/A'}`);
      if (!ec.type) {
        console.log(`    ⚠️  PROBLEMA: No tiene campo 'type'`);
        console.log(`    Campos: ${Object.keys(ec).join(', ')}`);
      }
    } else {
      console.log(`  Step ${step.step_order}: ❌ null`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verificación completada\n');
}

verifyModules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
