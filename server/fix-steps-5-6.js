require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';
const STEP_5_ID = '249b3b6e-267b-4b57-9964-bf830b44b558';
const STEP_6_ID = 'af79c41f-ad3c-4c29-bfcb-70f700def08e';

async function fixSteps() {
  console.log('🔧 Corrigiendo Steps 5 y 6...\n');

  // ========================================
  // STEP 5: MATCHING (Relacionar parejas)
  // ========================================
  const step5Content = {
    question: 'Relaciona cada organización social con su función principal:',
    type: 'matching',
    left_items: [
      'Junta de acción comunal',
      'Cooperativa de ahorro',
      'Club deportivo',
      'Grupo de teatro comunitario'
    ],
    right_items: [
      'Presentar obras artísticas',
      'Gestionar ahorros colectivos',
      'Mejorar el barrio y resolver problemas',
      'Promover deporte y salud'
    ],
    correct_pairs: [[0, 2], [1, 1], [2, 3], [3, 0]], // ✅ En el nivel correcto
    hint: 'Lee cuidadosamente lo que hace cada organización y conéctala con su propósito.',
    phase: 'guided_application',
    expected_answer: {
      type: 'matching',
      evaluation_strategy: 'matching',
      correct_pairs: [[0, 2], [1, 1], [2, 3], [3, 0]],
      explanation: 'Cada organización tiene una función específica que beneficia a la comunidad.',
      misconceptions: [
        {
          pattern: 'incorrect_pairing',
          misconception_key: 'confunde_funciones',
          hint: 'Observa bien las palabras clave: "mejorar barrio", "ahorros", "deporte", "obras".'
        }
      ]
    }
  };

  // ========================================
  // STEP 6: ORDERING (Ordenar secuencia)
  // ========================================
  const step6Content = {
    question: 'Ordena los pasos para crear una nueva organización en el barrio:',
    context: 'Si quisieras crear una nueva organización social en tu comunidad, ¿en qué orden harías estos pasos?',
    type: 'ordering',
    items: [
      'Convocar a las personas interesadas',
      'Identificar una necesidad o problema común',
      'Establecer normas y roles',
      'Definir objetivos y actividades',
      'Elegir representantes o líderes'
    ],
    correct_order: [1, 0, 3, 2, 4], // ✅ En el nivel correcto
    // Orden lógico: Identificar necesidad → Convocar → Definir objetivos → Establecer normas → Elegir líderes
    hint: 'Piensa en el orden lógico: primero identificas el problema, luego reúnes personas...',
    phase: 'independent_application',
    expected_answer: {
      type: 'ordering',
      evaluation_strategy: 'ordering',
      correct_order: [1, 0, 3, 2, 4],
      explanation: 'El orden lógico es: identificar necesidad, convocar personas, definir objetivos, establecer reglas, elegir líderes.',
      misconceptions: [
        {
          pattern: 'wrong_start',
          misconception_key: 'empieza_sin_necesidad',
          hint: 'Antes de convocar personas, ¿qué debe estar claro?'
        },
        {
          pattern: 'leaders_before_rules',
          misconception_key: 'orden_incorrecto',
          hint: 'Es mejor definir las normas antes de elegir líderes.'
        }
      ]
    }
  };

  // Actualizar Step 5
  console.log('📝 Actualizando Step 5 - Matching...');
  const { error: error5 } = await supabase
    .from('module_steps')
    .update({ enriched_content: step5Content })
    .eq('id', STEP_5_ID);

  if (error5) {
    console.error('❌ Error en Step 5:', error5);
  } else {
    console.log('✅ Step 5 corregido');
  }

  // Actualizar Step 6
  console.log('📝 Actualizando Step 6 - Ordering...');
  const { error: error6 } = await supabase
    .from('module_steps')
    .update({ enriched_content: step6Content })
    .eq('id', STEP_6_ID);

  if (error6) {
    console.error('❌ Error en Step 6:', error6);
  } else {
    console.log('✅ Step 6 corregido');
  }

  console.log('\n✅ Correcciones completadas!');
  console.log('\n💡 Reinicia el servidor para cargar los cambios en caché.');
}

fixSteps();
