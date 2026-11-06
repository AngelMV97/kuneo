/**
 * Corregir step 4 (matching) del módulo 604231bc con pares únicos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

// Step 4 corregido con pares únicos
const step4Fixed = {
  type: 'matching',
  question: 'Relaciona cada característica con el tipo de vida correspondiente:',
  context: 'Los seres humanos pasaron de ser nómadas a sedentarios. Este cambio trajo muchas diferencias en su forma de vivir. Piensa en las características de cada tipo de vida.',
  left_items: [
    'Moverse de un lugar a otro constantemente',
    'Quedarse en el mismo lugar permanentemente',
    'Cultivar y cosechar plantas',
    'Cazar y recolectar alimentos silvestres'
  ],
  right_items: [
    'Vida sedentaria',
    'Vida nómada',
    'Agricultura',
    'Grupos cazadores-recolectores'
  ],
  phase: 'connection',
  hint: 'Piensa: ¿qué implica ser nómada? ¿Qué implica ser sedentario? ¿Qué actividades hace cada uno?',
  correct_pairs: [
    [0, 1], // Moverse constantemente - Vida nómada
    [1, 0], // Quedarse en mismo lugar - Vida sedentaria
    [2, 2], // Cultivar y cosechar - Agricultura
    [3, 3]  // Cazar y recolectar - Grupos cazadores-recolectores
  ],
  expected_answer: {
    type: 'matching',
    correct_pairs: [
      [0, 1],
      [1, 0],
      [2, 2],
      [3, 3]
    ],
    evaluation_strategy: 'matching',
    explanation: '¡Perfecto! Has comprendido las diferencias entre la vida nómada (moverse constantemente, cazar y recolectar) y la vida sedentaria (quedarse en un lugar, cultivar).',
    misconceptions: [
      {
        pattern: 'moverse_con_sedentaria',
        misconception_key: 'confunde_nomada_sedentario',
        hint: 'Sedentario significa quedarse en un lugar fijo, no moverse.'
      },
      {
        pattern: 'cultivar_con_nomada',
        misconception_key: 'confunde_agricultura_con_nomadismo',
        hint: 'Para cultivar plantas necesitas quedarte en un lugar para cuidarlas. Los nómadas cazaban y recolectaban.'
      }
    ]
  },
  cognitive_dimension: 'comprension'
};

async function fixStep4() {
  console.log('🔧 Corrigiendo step 4 (matching) con pares únicos...\n');

  try {
    // Obtener ID del step 4
    const { data: step, error: stepError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('id')
      .eq('module_id', MODULE_ID)
      .eq('step_order', 4)
      .single();

    if (stepError) {
      console.log('❌ Error obteniendo step 4:', stepError.message);
      process.exit(1);
    }

    // Actualizar
    const { error: updateError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .update({ enriched_content: step4Fixed })
      .eq('id', step.id);

    if (updateError) {
      console.log('❌ Error actualizando:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Step 4 corregido con pares únicos:');
    console.log('\nPares correctos:');
    console.log('  • Moverse constantemente → Vida nómada');
    console.log('  • Quedarse en mismo lugar → Vida sedentaria');
    console.log('  • Cultivar y cosechar → Agricultura');
    console.log('  • Cazar y recolectar → Grupos cazadores-recolectores');
    console.log('\n💡 Reinicia el servidor para recargar el caché.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixStep4()
  .then(() => {
    console.log('\n✅ Corrección completada\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
