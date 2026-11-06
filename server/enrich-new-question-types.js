/**
 * Script para enriquecer módulo con nuevos tipos de preguntas pedagógicas:
 * - multiple_select (selección múltiple)
 * - matching (relacionar parejas)
 * - ordering (ordenar secuencia)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13'; // Módulo de organizaciones sociales

// Step IDs ya existentes (obtenidos de get-step-ids.js)
const STEP_IDS = {
  step1: '1b6c1319-0e6e-4ba3-9e65-44cc28db3ebd',
  step2: '724ff139-fac6-4f63-a296-56d9198e2889',
  step3: '8f454f1a-44c1-49c8-8da9-0c61f31ecf91',
  step4: '34bb219f-4504-45e5-a6bd-ad8e21e8878e',
  step5: '249b3b6e-267b-4b57-9964-bf830b44b558',
  step6: 'af79c41f-ad3c-4c29-bfcb-70f700def08e',
  step7: '4428fc6e-f983-49da-b9f4-deb28087a4e3',
  step8: '8bfa79ab-719c-4261-9642-4c05a6147456'
};

async function enrichSteps() {
  console.log('🎨 Iniciando enriquecimiento con nuevos tipos de preguntas...\n');

  // ========================================
  // STEP 4: MULTIPLE SELECT
  // Fase: Representación
  // ========================================
  const step4Content = {
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
    expected_answer: {
      type: 'multiple_select',
      evaluation_strategy: 'multiple_select',
      correct_options: [0, 1, 2], // Junta, equipo fútbol, cooperativa
      explanation: 'Las organizaciones sociales formales son: junta de acción comunal, equipo de fútbol y cooperativa. El grupo de WhatsApp es informal, y "familia" y "vecinos" son grupos sociales pero no organizaciones.',
      misconceptions: [
        {
          pattern: 'grupo.*whatsapp',
          misconception_key: 'confunde_informal_con_formal',
          hint: 'El grupo de WhatsApp es una forma de comunicación, pero no es una organización formal con estructura definida.'
        },
        {
          pattern: 'familia|vecinos',
          misconception_key: 'confunde_grupo_con_organizacion',
          hint: 'La familia y los vecinos son grupos sociales, pero no organizaciones con objetivos y estructura específicos.'
        }
      ]
    },
    hints: [
      'Una organización social tiene un objetivo común y roles definidos',
      'Piensa en cuáles tienen una estructura organizada con líder o coordinador',
      'Las organizaciones formales suelen tener reuniones y actividades planificadas'
    ],
    difficulty_level: 2,
    estimated_time_seconds: 90
  };

  // ========================================
  // STEP 5: MATCHING (Relacionar)
  // Fase: Aplicación guiada
  // ========================================
  const step5Content = {
    question: 'Relaciona cada organización social con su función principal:',
    context: 'Cada organización social del barrio tiene una función específica que beneficia a la comunidad. Conecta cada una con lo que hace.',
    type: 'matching',
    left_items: [
      'Junta de acción comunal',
      'Cooperativa de ahorro',
      'Equipo deportivo',
      'Biblioteca comunitaria'
    ],
    right_items: [
      'Organiza actividades recreativas y deportes',
      'Ayuda con el ahorro y préstamos',
      'Representa al barrio ante autoridades',
      'Promueve la lectura y el estudio'
    ],
    expected_answer: {
      type: 'matching',
      evaluation_strategy: 'matching',
      correct_pairs: [
        [0, 2], // Junta → Representa al barrio
        [1, 1], // Cooperativa → Ahorro y préstamos
        [2, 0], // Equipo → Actividades recreativas
        [3, 3]  // Biblioteca → Lectura y estudio
      ],
      explanation: 'Cada organización tiene una función específica: la junta representa al barrio, la cooperativa maneja dinero, el equipo hace deporte, y la biblioteca promueve la educación.',
      partial_credit_threshold: 0.6,
      misconceptions: [
        {
          incorrect_pair: [0, 0],
          misconception_key: 'confunde_junta_con_deporte',
          hint: 'La junta de acción comunal tiene un rol más político y representativo, no solo deportivo.'
        },
        {
          incorrect_pair: [1, 2],
          misconception_key: 'confunde_cooperativa_con_gobierno',
          hint: 'La cooperativa es una organización económica, no política. No representa al barrio.'
        }
      ]
    },
    hints: [
      'La palabra "acción comunal" significa actuar por toda la comunidad',
      'Una cooperativa maneja asuntos de dinero y economía',
      'Piensa en el objetivo principal de cada organización'
    ],
    difficulty_level: 2,
    estimated_time_seconds: 120
  };

  // ========================================
  // STEP 6: ORDERING (Ordenar secuencia)
  // Fase: Aplicación independiente
  // ========================================
  const step6Content = {
    question: 'Ordena los pasos para crear una nueva organización en el barrio:',
    context: 'Si los vecinos del barrio quieren crear una nueva organización social, deben seguir ciertos pasos en orden lógico. Ordena correctamente estos pasos.',
    type: 'ordering',
    items: [
      'Convocar a una reunión con todos los vecinos interesados',
      'Identificar una necesidad o problema común del barrio',
      'Elegir un líder o junta directiva',
      'Definir los objetivos y actividades de la organización',
      'Establecer reglas y horarios de reunión'
    ],
    expected_answer: {
      type: 'ordering',
      evaluation_strategy: 'ordering',
      correct_order: [1, 0, 3, 2, 4], // Índices en orden correcto
      // El orden correcto es:
      // 1. Identificar necesidad (índice 1)
      // 2. Convocar reunión (índice 0)
      // 3. Definir objetivos (índice 3)
      // 4. Elegir líder (índice 2)
      // 5. Establecer reglas (índice 4)
      explanation: 'Primero se identifica el problema, luego se reúnen los interesados, definen objetivos, eligen líderes y finalmente establecen reglas de funcionamiento.',
      partial_credit_threshold: 0.7,
      key_sequence_positions: [0, 2, 4], // Posiciones críticas que deben estar correctas
      misconceptions: [
        {
          common_error: 'elegir_lider_primero',
          misconception_key: 'no_entiende_proceso_democratico',
          hint: 'En una organización democrática, primero se define qué se quiere hacer y luego se elige quién lo liderará.'
        },
        {
          common_error: 'reglas_antes_objetivos',
          misconception_key: 'prioriza_forma_sobre_contenido',
          hint: 'Las reglas se crean después de saber cuáles son los objetivos de la organización.'
        }
      ]
    },
    hints: [
      'Piensa: ¿qué debe pasar primero para que las personas quieran organizarse?',
      'Antes de elegir líderes, los vecinos deben saber para qué se están organizando',
      'Las reglas se establecen al final, cuando ya se sabe cómo funcionará todo'
    ],
    difficulty_level: 3,
    estimated_time_seconds: 150
  };

  // ========================================
  // ACTUALIZAR EN BASE DE DATOS
  // ========================================
  
  try {
    // Step 4: Multiple Select
    console.log('📝 Actualizando Step 4 - Multiple Select...');
    const { error: error4 } = await supabase
      .from('module_steps')
      .update({
        enriched_content: step4Content,
        content: { question: step4Content.question }
      })
      .eq('id', STEP_IDS.step4);

    if (error4) {
      console.error('❌ Error en Step 4:', error4);
    } else {
      console.log('✅ Step 4 - Multiple Select actualizado');
    }

    // Step 5: Matching
    console.log('📝 Actualizando Step 5 - Matching...');
    const { error: error5 } = await supabase
      .from('module_steps')
      .update({
        enriched_content: step5Content,
        content: { question: step5Content.question }
      })
      .eq('id', STEP_IDS.step5);

    if (error5) {
      console.error('❌ Error en Step 5:', error5);
    } else {
      console.log('✅ Step 5 - Matching actualizado');
    }

    // Step 6: Ordering
    console.log('📝 Actualizando Step 6 - Ordering...');
    const { error: error6 } = await supabase
      .from('module_steps')
      .update({
        enriched_content: step6Content,
        content: { question: step6Content.question }
      })
      .eq('id', STEP_IDS.step6);

    if (error6) {
      console.error('❌ Error en Step 6:', error6);
    } else {
      console.log('✅ Step 6 - Ordering actualizado');
    }

    console.log('\n🎉 ¡Enriquecimiento completado!');
    console.log('\n📋 Resumen:');
    console.log('   Step 4: Multiple Select (Representación)');
    console.log('   Step 5: Matching (Aplicación guiada)');
    console.log('   Step 6: Ordering (Aplicación independiente)');
    console.log('\n💡 Reinicia el servidor para cargar los cambios en caché.');

  } catch (err) {
    console.error('❌ Error general:', err);
  }

  process.exit(0);
}

// Ejecutar
enrichSteps();
