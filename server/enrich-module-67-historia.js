require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '4b94fd6c-ea04-4889-b025-546fc6e5ab1f';

// Step 4: Classification - multiple_select
const step4Content = {
  type: 'multiple_select',
  question: '¿Cuáles de las siguientes prácticas históricas fueron justificadas con argumentos religiosos o de "superioridad"? (Selecciona todas las correctas)',
  context: 'A lo largo de la historia, muchas sociedades han justificado prácticas que hoy consideramos inhumanas usando argumentos religiosos, raciales o de supuesta superioridad cultural. Es importante identificar y analizar críticamente estas justificaciones.',
  options: [
    'La esclavitud de africanos en América',
    'La Inquisición y persecución de herejes',
    'La conquista y colonización de pueblos indígenas',
    'La abolición de la esclavitud'
  ],
  expected_answer: {
    type: 'multiple_select',
    correct_options: [0, 1, 2],
    evaluation_strategy: 'multiple_select',
    explanation: '¡Correcto! Has identificado las prácticas históricas que fueron justificadas con argumentos religiosos o de supuesta superioridad. La abolición de la esclavitud fue, por el contrario, un acto de justicia.',
    misconceptions: [
      {
        pattern: 'includes_3',
        misconception_key: 'confunde_abolicion_con_justificacion',
        hint: 'La abolición de la esclavitud fue un acto de justicia, no una práctica que necesitara justificación religiosa o racial.'
      }
    ]
  },
  phase: 'classification',
  hint: 'Piensa en qué acciones fueron presentadas como "correctas" o "necesarias" según las ideas de esa época.',
  cognitive_dimension: 'comprension'
};

// Step 5: Guided Application - matching
const step5Content = {
  type: 'matching',
  question: 'Relaciona cada práctica histórica con el tipo de argumento usado para justificarla:',
  context: 'Las sociedades del pasado usaban diferentes tipos de argumentos para legitimar prácticas que hoy rechazamos. Comprender estos argumentos nos ayuda a pensar críticamente sobre el presente.',
  left_items: [
    'Esclavitud en América',
    'Inquisición española',
    'Conquista de América',
    'Segregación racial'
  ],
  right_items: [
    'Argumento religioso: "salvar almas"',
    'Argumento económico: "civilizar y cristianizar"',
    'Argumento racial: "inferioridad de ciertas razas"',
    'Argumento religioso: "pureza de la fe"'
  ],
  phase: 'guided_application',
  hint: 'Piensa en qué tipo de razones daban las autoridades de la época para cada práctica.',
  expected_answer: {
    type: 'matching',
    correct_pairs: [[0, 3], [1, 3], [2, 1], [3, 2]],
    evaluation_strategy: 'matching',
    explanation: '¡Excelente! Has relacionado correctamente las prácticas históricas con los argumentos usados para justificarlas.',
    misconceptions: []
  },
  cognitive_dimension: 'aplicacion'
};

// Step 6: Transfer - ordering
const step6Content = {
  type: 'ordering',
  question: 'Ordena cronológicamente estos eventos relacionados con el reconocimiento de derechos humanos:',
  context: 'El rechazo a las prácticas injustas del pasado llevó gradualmente al reconocimiento de derechos humanos universales. Este fue un proceso histórico que tomó siglos.',
  items: [
    'Declaración Universal de Derechos Humanos (1948)',
    'Abolición de la esclavitud en Colombia (1851)',
    'Controversia de Valladolid sobre derechos indígenas (1550)',
    'Abolición de la Inquisición en España (1834)'
  ],
  phase: 'transfer',
  hint: 'Recuerda que la Controversia de Valladolid fue en el siglo XVI, durante la época colonial.',
  expected_answer: {
    type: 'ordering',
    correct_order: [2, 3, 1, 0],
    evaluation_strategy: 'ordering',
    explanation: '¡Perfecto! Has ordenado correctamente la secuencia histórica del reconocimiento de derechos humanos.',
    misconceptions: []
  },
  cognitive_dimension: 'aplicacion'
};

// Step 7: Error Analysis - option
const step7Content = {
  type: 'option',
  question: 'María dice: "La esclavitud existió porque las personas de esa época eran malvadas". ¿Qué error comete María en su análisis histórico?',
  context: 'Es fácil juzgar el pasado con nuestros valores actuales, pero un buen análisis histórico requiere entender las ideas y estructuras de cada época sin justificarlas.',
  options: [
    'No considera que las personas actuaban según las ideas y valores de su época',
    'Tiene razón, todas las personas de esa época eran malvadas',
    'La esclavitud no existió realmente',
    'No hay error en su análisis'
  ],
  phase: 'error_analysis',
  hint: 'Piensa en cómo influyen las ideas de cada época en lo que las personas consideran "normal" o "correcto".',
  expected_answer: {
    type: 'option',
    correct_options: [0],
    evaluation_strategy: 'option',
    explanation: '¡Correcto! Para analizar la historia críticamente debemos entender el contexto de cada época, aunque no justifiquemos las prácticas injustas.',
    misconceptions: [
      {
        pattern: '^1$',
        misconception_key: 'simplifica_juicio_moral',
        hint: 'Las personas actuaban según las ideas dominantes de su época. El análisis histórico requiere entender el contexto.'
      },
      {
        pattern: '^2$',
        misconception_key: 'niega_evidencia_historica',
        hint: 'La esclavitud es un hecho histórico documentado ampliamente.'
      }
    ]
  },
  cognitive_dimension: 'analisis'
};

// Step 8: Metacognition - keywords
const step8Content = {
  type: 'keywords',
  question: '¿Qué aprendiste sobre cómo analizar críticamente las justificaciones históricas de prácticas injustas?',
  context: 'Reflexiona sobre lo que aprendiste en este módulo sobre las concepciones que legitimaron prácticas como la esclavitud o la Inquisición, y cómo podemos analizarlas críticamente.',
  phase: 'metacognition',
  hint: 'Piensa en cómo las sociedades justificaban estas prácticas y por qué es importante cuestionarlas.',
  expected_answer: {
    type: 'keywords',
    keywords: [
      'justificaciones', 'justificar', 'legitimar', 'argumentos',
      'religioso', 'religiosa', 'religion',
      'superioridad', 'inferioridad', 'raza', 'racial',
      'esclavitud', 'inquisicion',
      'critico', 'critica', 'criticar', 'cuestionar',
      'contexto', 'epoca', 'historia', 'historico',
      'derechos', 'injusto', 'injusta', 'inhumano'
    ],
    evaluation_strategy: 'keywords',
    min_keywords: 3,
    explanation: '¡Excelente reflexión! Has comprendido la importancia de analizar críticamente las justificaciones históricas.',
    misconceptions: []
  },
  cognitive_dimension: 'metacognicion'
};

async function enrichSteps() {
  console.log('🎨 Enriqueciendo módulo 6-7 de Historia...\n');
  console.log('📚 Módulo: Concepciones históricas (esclavitud, Inquisición)');
  console.log('🎯 ID: ' + MODULE_ID + '\n');

  const stepsToEnrich = [
    { id: '65590a17-fd40-416d-b048-63495e5aeca5', content: step4Content, name: 'classification', order: 4 },
    { id: '316df857-26a5-4c63-ac42-ea2352e5cc79', content: step5Content, name: 'guided_application', order: 5 },
    { id: 'cd032bdb-1d1b-4638-9ff3-ee9776205b6e', content: step6Content, name: 'transfer', order: 6 },
    { id: '7329a818-b6a6-48da-8103-54f4cfaf5a64', content: step7Content, name: 'error_analysis', order: 7 },
    { id: 'd8e95b1a-e132-474f-adbc-a9b6b4e0d796', content: step8Content, name: 'metacognition', order: 8 }
  ];

  for (const step of stepsToEnrich) {
    console.log(`📝 Enriqueciendo step ${step.order} (${step.name})...`);
    
    const { error } = await supabase
      .from('module_steps')
      .update({ 
        enriched_content: step.content,
        phase: step.content.phase
      })
      .eq('id', step.id);

    if (error) {
      console.error(`❌ Error enriqueciendo step ${step.order}:`, error.message);
    } else {
      console.log(`✅ Step ${step.order} (${step.content.type}) enriquecido correctamente`);
    }
  }

  console.log('\n🎉 Módulo 6-7 completo!\n');
  console.log('📌 RESUMEN:');
  console.log('   Materia: Ciencias Sociales');
  console.log('   Grado: 6-7');
  console.log('   Steps completados: 4-8 (5 steps)');
  console.log('   Tipos: multiple_select, matching, ordering, option, keywords ✅\n');

  process.exit(0);
}

enrichSteps().catch(console.error);
