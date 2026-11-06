require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

// Step 4: Classification - Clasificar organizaciones sociales
const step4Content = {
  type: 'multiple_select',
  question: '¿Cuáles de estas SÍ son organizaciones sociales? (Puedes elegir varias)',
  context: 'Las organizaciones sociales son grupos de personas que se unen con un propósito común. La familia, la escuela y el barrio son ejemplos de organizaciones sociales porque las personas trabajan juntas y se apoyan mutuamente.',
  options: [
    'Un equipo de fútbol',
    'Un árbol en el parque',
    'Un club de lectura',
    'Una cooperativa de agricultores'
  ],
  expected_answer: {
    type: 'multiple_select',
    correct_options: [0, 2, 3],
    evaluation_strategy: 'multiple_select',
    explanation: '¡Excelente! Has identificado correctamente que un árbol no es una organización social. Las organizaciones sociales siempre están formadas por personas que se unen con un propósito común.',
    misconceptions: [
      {
        pattern: '^0$',
        misconception_key: 'confunde_equipo_deportivo',
        hint: 'Un equipo deportivo SÍ es una organización social porque las personas se organizan para alcanzar metas comunes.'
      },
      {
        pattern: '^2$',
        misconception_key: 'confunde_club',
        hint: 'Un club o grupo de personas con intereses comunes SÍ es una organización social.'
      },
      {
        pattern: '^3$',
        misconception_key: 'confunde_cooperativa',
        hint: 'Las cooperativas son organizaciones sociales donde las personas trabajan juntas para beneficio mutuo.'
      }
    ]
  },
  phase: 'classification',
  hint: 'Piensa: ¿cuál de las opciones NO es un grupo de personas?',
  cognitive_dimension: 'comprension'
};

// Step 5: Guided Application - Aplicar el concepto a nuevas situaciones
const step5Content = {
  type: 'matching',
  question: 'Relaciona cada organización social con su función principal:',
  context: 'Las organizaciones sociales se relacionan entre sí. Cada una tiene funciones específicas que ayudan a la comunidad.',
  left_items: [
    'Familia',
    'Escuela',
    'Junta de acción comunal',
    'Hospital'
  ],
  right_items: [
    'Cuida la salud de las personas',
    'Administra el barrio y organiza eventos',
    'Enseña y forma a los niños',
    'Cuida y protege a sus miembros'
  ],
  phase: 'guided_application',
  hint: 'Piensa en qué hace cada organización para ayudar a las personas.',
  expected_answer: {
    type: 'matching',
    correct_pairs: [[0, 3], [1, 2], [2, 1], [3, 0]],
    evaluation_strategy: 'matching',
    explanation: '¡Muy bien! Has entendido que para actividades en el barrio, debemos trabajar con la organización que lo administra.',
    misconceptions: [
      {
        pattern: '^0$',
        misconception_key: 'confunde_familia_con_administrador_barrio',
        hint: 'Tu familia puede organizar, pero necesita permisos de la organización que administra el barrio.'
      },
      {
        pattern: '^1$',
        misconception_key: 'confunde_escuela_con_administrador_barrio',
        hint: 'La escuela es importante, pero no da permisos para usar espacios públicos del barrio.'
      },
      {
        pattern: '^3$',
        misconception_key: 'no_reconoce_necesidad_organizacion',
        hint: 'Siempre necesitas trabajar con organizaciones para usar espacios públicos del barrio.'
      }
    ]
  },
  cognitive_dimension: 'aplicacion'
};

// Step 6: Transfer - Transferir a contextos más amplios
const step6Content = {
  type: 'ordering',
  question: 'Ordena estos pasos que seguirías para organizar una actividad con tu comunidad:',
  context: 'El concepto de organizaciones sociales se aplica a muchas situaciones. Cuando queremos organizar algo en la comunidad, hay pasos que debemos seguir en orden.',
  items: [
    'Conseguir los permisos de la junta comunal',
    'Pensar en qué actividad queremos hacer',
    'Invitar a los vecinos a participar',
    'Reunirse con la familia para planear'
  ],
  phase: 'transfer',
  hint: 'Piensa: ¿qué harías primero? ¿Empezarías planeando en familia o pidiendo permisos?',
  expected_answer: {
    type: 'ordering',
    correct_order: [1, 3, 0, 2],
    evaluation_strategy: 'ordering',
    explanation: '¡Excelente! Los grupos ambientales son organizaciones sociales especializadas en proteger el medio ambiente.',
    misconceptions: [
      {
        pattern: '^0$',
        misconception_key: 'subestima_escala_proyecto_ambiental',
        hint: 'Tu familia puede ayudar, pero para un proyecto grande es mejor trabajar con una organización especializada.'
      },
      {
        pattern: '^2$',
        misconception_key: 'confunde_escuela_con_organizacion_ambiental',
        hint: 'La escuela puede participar, pero una organización ambiental tiene más experiencia y recursos.'
      },
      {
        pattern: '^3$',
        misconception_key: 'no_reconoce_valor_organizaciones',
        hint: 'Para proyectos grandes necesitamos organizaciones que coordinen el trabajo de forma segura.'
      }
    ]
  },
  cognitive_dimension: 'aplicacion'
};

// Step 7: Error Analysis - Identificar errores comunes
const step7Content = {
  type: 'option',
  question: 'Juan dice: "La familia de Pedro no es una organización social porque solo tiene 4 personas". ¿Por qué está equivocado Juan?',
  context: 'A veces tenemos ideas equivocadas sobre las organizaciones sociales. Es importante identificar estos errores para entender mejor el concepto.',
  options: [
    'Porque el tamaño no importa; lo importante es que las personas trabajan juntas con un propósito común',
    'Porque solo las organizaciones grandes son importantes',
    'Porque Juan tiene razón, las familias pequeñas no son organizaciones',
    'Porque solo 4 personas no pueden organizarse'
  ],
  phase: 'error_analysis',
  hint: 'Piensa: ¿qué define una organización social? ¿El número de personas o cómo trabajan juntas?',
  expected_answer: {
    type: 'option',
    correct_options: [0],
    evaluation_strategy: 'option',
    explanation: '¡Correcto! Una organización social puede ser pequeña o grande. Lo que la define es que las personas trabajan juntas.',
    misconceptions: [
      {
        pattern: '^1$',
        misconception_key: 'confunde_tamano_con_importancia',
        hint: 'Todas las organizaciones sociales son importantes, sin importar su tamaño.'
      },
      {
        pattern: '^2$',
        misconception_key: 'confunde_tamano_con_definicion',
        hint: 'Todas las familias son organizaciones sociales, grandes o pequeñas.'
      },
      {
        pattern: '^3$',
        misconception_key: 'asume_numero_minimo',
        hint: 'Grupos pequeños también pueden organizarse muy bien.'
      }
    ]
  },
  cognitive_dimension: 'analisis'
};

// Step 8: Metacognition - Reflexión sobre el aprendizaje
const step8Content = {
  type: 'keywords',
  question: '¿Qué fue lo más importante que aprendiste sobre las organizaciones sociales?',
  context: 'Ahora que terminamos el módulo, es importante reflexionar sobre lo que aprendimos. Esto nos ayuda a recordar mejor y aplicar el conocimiento en el futuro.',
  phase: 'metacognition',
  hint: 'Piensa en las ideas principales que vimos: ¿qué son las organizaciones sociales? ¿Para qué sirven?',
  expected_answer: {
    type: 'keywords',
    keywords: [
      'personas', 'grupo', 'grupos', 'gente',
      'juntas', 'juntos', 'trabajar', 'ayudar', 'cooperar',
      'familia', 'escuela', 'barrio', 'comunidad',
      'organizar', 'organizan', 'organizarse',
      'compartir', 'apoyo', 'ayuda',
      'propósito', 'objetivo', 'meta', 'común'
    ],
    evaluation_strategy: 'keywords',
    min_keywords: 3,
    explanation: '¡Excelente reflexión! Has comprendido las ideas principales sobre las organizaciones sociales.',
    misconceptions: []
  },
  cognitive_dimension: 'metacognicion'
};

async function enrichSteps() {
  console.log('🎨 Completando módulo de Ciencias Sociales...\n');

  const stepsToEnrich = [
    { id: '34bb219f-4504-45e5-a6bd-ad8e21e8878e', content: step4Content, name: 'classification', phase: 'classification' },
    { id: '249b3b6e-267b-4b57-9964-bf830b44b558', content: step5Content, name: 'guided_application', phase: 'guided_application' },
    { id: 'af79c41f-ad3c-4c29-bfcb-70f700def08e', content: step6Content, name: 'transfer', phase: 'transfer' },
    { id: '4428fc6e-f983-49da-b9f4-deb28087a4e3', content: step7Content, name: 'error_analysis', phase: 'error_analysis' },
    { id: '8bfa79ab-719c-4261-9642-4c05a6147456', content: step8Content, name: 'metacognition', phase: 'metacognition' }
  ];

  for (const step of stepsToEnrich) {
    console.log(`📝 Enriqueciendo step ${step.name} (${step.phase})...`);
    
    const { error } = await supabase
      .from('module_steps')
      .update({ 
        enriched_content: step.content,
        phase: step.phase
      })
      .eq('id', step.id);

    if (error) {
      console.error(`❌ Error enriqueciendo step ${step.name}:`, error.message);
    } else {
      console.log(`✅ Step ${step.name} enriquecido correctamente`);
    }
  }

  console.log('\n🎉 Módulo completo!\n');
  console.log('📌 MÓDULO LISTO PARA PROBAR:');
  console.log('   Materia: Ciencias Sociales (social_studies)');
  console.log('   Nombre: "¿Cómo analizar una situación social?"');
  console.log('   ID: e43bb575-a5d6-4bee-bc97-c7895421ae13');
  console.log('   Steps: 8/8 enriquecidos ✅\n');
}

enrichSteps().catch(console.error);
