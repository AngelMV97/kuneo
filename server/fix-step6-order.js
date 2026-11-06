require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const STEP_6_ID = 'af79c41f-ad3c-4c29-bfcb-70f700def08e';

async function fixStep6Order() {
  console.log('🔧 Corrigiendo orden lógico del Step 6...\n');

  // Items originales:
  // [0] Convocar a las personas interesadas
  // [1] Identificar una necesidad o problema común
  // [2] Establecer normas y roles
  // [3] Definir objetivos y actividades
  // [4] Elegir representantes o líderes

  // Orden lógico correcto:
  // 1. Identificar necesidad [1]
  // 2. Convocar personas [0]
  // 3. Definir objetivos [3]
  // 4. Elegir líderes [4]  ← Primero elegir líderes
  // 5. Establecer normas [2] ← Luego establecer normas

  const { data: current } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('id', STEP_6_ID)
    .single();

  const updatedContent = {
    ...current.enriched_content,
    correct_order: [1, 0, 3, 4, 2], // ✅ Orden más lógico
    hint: 'Piensa en el orden lógico: primero identifica el problema, luego reúne personas, define objetivos, elige líderes y finalmente establece normas.',
  };

  // Actualizar también expected_answer para consistencia
  updatedContent.expected_answer.correct_order = [1, 0, 3, 4, 2];
  updatedContent.expected_answer.explanation = 'El orden lógico es: identificar necesidad, convocar personas, definir objetivos, elegir líderes que coordinen, y luego establecer normas de funcionamiento.';

  const { error } = await supabase
    .from('module_steps')
    .update({ enriched_content: updatedContent })
    .eq('id', STEP_6_ID);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Step 6 corregido con orden más lógico!');
  console.log('\n📝 Nuevo orden correcto:');
  console.log('  1. Identificar una necesidad o problema común');
  console.log('  2. Convocar a las personas interesadas');
  console.log('  3. Definir objetivos y actividades');
  console.log('  4. Elegir representantes o líderes');
  console.log('  5. Establecer normas y roles');
  console.log('\n💡 Reinicia el servidor para cargar el cambio.');
}

fixStep6Order();
