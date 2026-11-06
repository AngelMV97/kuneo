require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function fixModule67Step3() {
  console.log('🔧 Corrigiendo Step 3 del módulo 6-7...\n');

  // Obtener el step actual
  const { data: step } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .eq('step_order', 3)
    .single();

  // Agregar min_keywords al expected_answer
  step.enriched_content.expected_answer.min_keywords = 3;

  // Actualizar en la base de datos
  const { error } = await supabase
    .from('module_steps')
    .update({ enriched_content: step.enriched_content })
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .eq('step_order', 3);

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Step 3 del módulo 6-7 corregido');
    console.log('   Min Keywords agregado: 3');
    console.log('   Keywords disponibles:', step.enriched_content.expected_answer.keywords.length);
    console.log('\n💡 Ahora la respuesta del usuario debería ser aceptada como correcta');
  }
}

fixModule67Step3().catch(console.error);
