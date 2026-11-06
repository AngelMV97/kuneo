require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';
const STEP_4_ID = '34bb219f-4504-45e5-a6bd-ad8e21e8878e';

async function fixStep4() {
  console.log('🔧 Corrigiendo estructura del Step 4...\n');

  const enrichedContent = {
    question: 'Marca TODAS las organizaciones sociales que aparecen en el texto:',
    context: `En el barrio La Esperanza hay diferentes grupos de personas organizadas. La junta de acción comunal organiza las fiestas del barrio. El equipo de fútbol juvenil entrena todos los sábados. La cooperativa de ahorro ayuda a las familias a guardar dinero. También hay un grupo de WhatsApp de los vecinos donde comparten información.`,
    type: 'multiple_select',
    options: [
      'Junta de acción comunal',
      'Equipo de fútbol juvenil',
      'Cooperativa de ahorro',
      'Grupo de WhatsApp',
      'Familia',
      'Vecinos del barrio'
    ],
    correct_options: [0, 1, 2], // ✅ Ahora en el nivel correcto
    hint: 'Piensa en cuáles tienen una estructura organizada y un propósito común definido.',
    phase: 'representation',
    expected_answer: {
      type: 'multiple_select',
      evaluation_strategy: 'multiple_select',
      correct_options: [0, 1, 2],
      explanation: 'Las organizaciones sociales formales son: junta de acción comunal, equipo de fútbol y cooperativa. El grupo de WhatsApp es informal, y "familia" y "vecinos" son grupos sociales pero no organizaciones.',
      misconceptions: [
        {
          pattern: 'includes_whatsapp',
          misconception_key: 'confunde_informal_con_formal',
          hint: 'El grupo de WhatsApp es una forma de comunicación, pero no es una organización formal con estructura definida.'
        },
        {
          pattern: 'includes_family',
          misconception_key: 'confunde_grupo_con_organizacion',
          hint: 'La familia es un grupo social básico, pero no es una organización social formal.'
        }
      ]
    }
  };

  const { error } = await supabase
    .from('module_steps')
    .update({ enriched_content: enrichedContent })
    .eq('id', STEP_4_ID);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Step 4 corregido exitosamente!');
  console.log('\nRespuestas correctas:');
  console.log('  ✓ [0] Junta de acción comunal');
  console.log('  ✓ [1] Equipo de fútbol juvenil');
  console.log('  ✓ [2] Cooperativa de ahorro');
  console.log('\n💡 Reinicia el servidor para cargar el cambio en caché.');
}

fixStep4();
