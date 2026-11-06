require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '4b94fd6c-ea04-4889-b025-546fc6e5ab1f';

// Step 1: Exploration - option
const step1Content = {
  type: 'option',
  question: '¿Por qué es importante estudiar las justificaciones que las sociedades del pasado daban a prácticas como la esclavitud?',
  context: 'A lo largo de la historia, diferentes sociedades han justificado prácticas que hoy consideramos injustas. Estudiar estas justificaciones nos ayuda a entender el pasado y a pensar críticamente sobre el presente.',
  options: [
    'Para entender cómo pensaban las personas en diferentes épocas',
    'Porque así sabremos quiénes eran las personas malas',
    'Para olvidar el pasado y no volver a pensar en eso',
    'Solo por cumplir con la tarea de historia'
  ],
  phase: 'exploration',
  hint: 'Piensa en por qué es útil conocer las ideas y creencias de otras épocas.',
  expected_answer: {
    type: 'option',
    correct_options: [0],
    evaluation_strategy: 'option',
    explanation: '¡Exacto! Estudiar las justificaciones históricas nos ayuda a comprender el contexto de cada época y a desarrollar pensamiento crítico.',
    misconceptions: [
      {
        pattern: '^1$',
        misconception_key: 'simplifica_juicio_historico',
        hint: 'La historia no se trata de juzgar quién era "malo" o "bueno", sino de entender el contexto de cada época.'
      },
      {
        pattern: '^2$',
        misconception_key: 'olvida_importancia_memoria',
        hint: 'Recordar y estudiar el pasado nos ayuda a no repetir errores y a construir una sociedad más justa.'
      }
    ]
  },
  cognitive_dimension: 'comprension'
};

// Step 2: Representation - option
const step2Content = {
  type: 'option',
  question: 'Observa esta afirmación histórica: "La esclavitud es natural porque algunos pueblos son superiores a otros". ¿Qué tipo de argumento es?',
  context: 'Durante siglos, muchas sociedades justificaron la esclavitud con diferentes tipos de argumentos. Identificar el tipo de argumento nos ayuda a analizarlo críticamente.',
  options: [
    'Un argumento basado en supuesta superioridad racial o cultural',
    'Un argumento científico comprobado',
    'Un argumento económico sobre costos de producción',
    'Un argumento religioso sobre la salvación de almas'
  ],
  phase: 'representation',
  hint: 'Fíjate en la palabra clave: "superiores".',
  expected_answer: {
    type: 'option',
    correct_options: [0],
    evaluation_strategy: 'option',
    explanation: '¡Correcto! Este es un argumento de supuesta superioridad racial o cultural, que hoy sabemos que es falso e injusto.',
    misconceptions: [
      {
        pattern: '^1$',
        misconception_key: 'confunde_argumento_con_ciencia',
        hint: 'La ciencia ha demostrado que todos los seres humanos somos iguales. Este argumento era una justificación falsa.'
      },
      {
        pattern: '^2$',
        misconception_key: 'confunde_tipo_argumento',
        hint: 'Aunque había razones económicas detrás de la esclavitud, este argumento específico habla de "superioridad".'
      }
    ]
  },
  cognitive_dimension: 'comprension'
};

// Step 3: Concept Formation - keywords
const step3Content = {
  type: 'keywords',
  question: 'Con tus propias palabras, explica qué significa "analizar críticamente las concepciones históricas".',
  context: 'Analizar críticamente significa no aceptar las ideas del pasado sin cuestionarlas, sino examinarlas para entender su contexto y evaluar si eran justas o injustas.',
  phase: 'concept_formation',
  hint: 'Piensa en examinar, cuestionar y evaluar las ideas del pasado.',
  expected_answer: {
    type: 'keywords',
    keywords: [
      'examinar', 'analizar', 'estudiar',
      'cuestionar', 'evaluar', 'critico', 'critica',
      'ideas', 'concepciones', 'creencias', 'justificaciones',
      'pasado', 'historia', 'historico', 'epoca',
      'contexto',
      'justo', 'injusto', 'correcto', 'incorrecto'
    ],
    evaluation_strategy: 'keywords',
    min_keywords: 3,
    explanation: '¡Muy bien! Has comprendido que analizar críticamente implica examinar las ideas del pasado en su contexto y evaluarlas.',
    misconceptions: []
  },
  cognitive_dimension: 'comprension'
};

async function fixSteps123() {
  console.log('🔧 Corrigiendo steps 1-3 del módulo 4b94fd6c...\n');
  console.log('📚 Módulo: Concepciones históricas (esclavitud, Inquisición)');
  console.log('🎯 ID: ' + MODULE_ID + '\n');

  const stepsToFix = [
    { id: 'b9bbcbf6-f304-406d-9069-4bbb3754defd', content: step1Content, name: 'exploration', order: 1 },
    { id: '8a793fec-5798-4a51-a6b5-fa4979d91b80', content: step2Content, name: 'representation', order: 2 },
    { id: '16a8c155-e879-4447-8ed4-36accc8bb484', content: step3Content, name: 'concept_formation', order: 3 }
  ];

  for (const step of stepsToFix) {
    console.log(`📝 Actualizando step ${step.order} (${step.name})...`);
    
    const { error } = await supabase
      .from('module_steps')
      .update({ 
        enriched_content: step.content,
        phase: step.content.phase
      })
      .eq('id', step.id);

    if (error) {
      console.error(`❌ Error actualizando step ${step.order}:`, error.message);
    } else {
      console.log(`✅ Step ${step.order} (${step.content.type}) actualizado correctamente`);
    }
  }

  console.log('\n🎉 Steps 1-3 corregidos!\n');
  console.log('📌 Ahora el módulo 4b94fd6c debería tener 8/8 steps correctos\n');

  process.exit(0);
}

fixSteps123().catch(console.error);
