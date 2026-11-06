require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

async function fixOptionSteps() {
  console.log('🔧 Corrigiendo steps tipo option del módulo Grade 8-9...\n');

  // Obtener steps 2 y 7 (tipo option)
  const { data: steps } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', MODULE_ID)
    .in('step_order', [2, 7]);

  for (const step of steps) {
    const hasWrongFormat = step.enriched_content?.correct_option !== undefined;
    
    console.log(`Step ${step.step_order}: ${hasWrongFormat ? '❌ Necesita corrección' : '✅ OK'}`);
    
    if (hasWrongFormat) {
      const updated = {
        ...step.enriched_content,
        correct_options: [step.enriched_content.correct_option]
      };
      delete updated.correct_option;

      await supabase
        .from('module_steps')
        .update({ enriched_content: updated })
        .eq('module_id', MODULE_ID)
        .eq('step_order', step.step_order);

      console.log(`   ✅ Corregido: correct_options = [${updated.correct_options}]`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Todos los steps tipo option corregidos');
  console.log('='.repeat(60));
}

fixOptionSteps()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
