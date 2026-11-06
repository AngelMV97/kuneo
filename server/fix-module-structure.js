require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

// Step 3: Corregir para texto libre (explanation/razonamiento)
const step3Content = {
  question: '¿Por qué es importante que en el barrio las personas se organicen y trabajen juntas?',
  context: 'El barrio es una organización social donde muchas familias viven cerca y comparten espacios como parques, calles y tiendas. Cuando las personas del barrio trabajan juntas, pueden hacer cosas importantes para todos.',
  type: 'open_text',
  expected_answer: {
    type: 'text',
    keywords: ['ayudar', 'mejorar', 'cuidar', 'juntos', 'comunidad', 'organizar', 'problemas', 'solucionar'],
    sample_answers: [
      'Para ayudarse entre todos y hacer el barrio mejor',
      'Para solucionar problemas juntos',
      'Para cuidar los espacios del barrio',
      'Para mejorar la comunidad'
    ],
    misconceptions: [
      {
        pattern: 'no.*import',
        card_key: 'social_org_misconception',
        severity: 'medium',
        misconception_key: 'undervalues_community_organization',
        explanation: 'La organización del barrio es muy importante porque permite que las personas trabajen juntas para el bien común.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa en qué pasaría si nadie cuidara el parque o las calles.',
      'Cuando las personas trabajan juntas, pueden hacer más cosas.',
      'La organización ayuda a resolver problemas de todos.'
    ],
    expected_time: 90,
    difficulty_indicator: 'medium',
    concept_card_key: 'neighborhood_cooperation'
  },
  tutor_responses: {
    correct: [
      '¡Excelente reflexión! Has entendido que organizarse ayuda a la comunidad.',
      '¡Muy bien! Trabajar juntos hace que el barrio sea mejor para todos.',
      '¡Correcto! La organización permite resolver problemas y mejorar la comunidad.'
    ],
    incorrect_attempt_1: [
      'Piensa en qué pueden lograr las personas cuando trabajan juntas.',
      'Imagina tu barrio: ¿qué cosas necesitan que todos cuiden?'
    ],
    encouragement: [
      'Buena reflexión, sigue pensando.',
      'Estás en el camino correcto.'
    ]
  },
  cognitive_dimension: 'razonamiento'
};

// Step 4: Classification - Distinguir casos y no casos (opción múltiple)
const step4Content = {
  question: '¿Cuál de estas NO es una organización social?',
  context: 'Las organizaciones sociales son grupos de personas que se unen con un propósito común. La familia, la escuela y el barrio son ejemplos de organizaciones sociales porque las personas trabajan juntas y se apoyan mutuamente.',
  type: 'multiple_choice',
  options: [
    'Un equipo de fútbol',
    'Un árbol en el parque',
    'Un club de lectura',
    'Una cooperativa de agricultores'
  ],
  correct_answer: 'Un árbol en el parque',
  expected_answer: {
    type: 'option',
    correct_options: [1],
    misconceptions: [
      {
        pattern: 'Opción A',
        card_key: 'social_org_classification',
        severity: 'low',
        misconception_key: 'rejects_informal_organizations',
        explanation: 'Un equipo deportivo SÍ es una organización social porque las personas se organizan para alcanzar metas comunes.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción C',
        card_key: 'social_org_classification',
        severity: 'low',
        misconception_key: 'rejects_voluntary_groups',
        explanation: 'Un club o grupo de personas con intereses comunes SÍ es una organización social.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción D',
        card_key: 'social_org_classification',
        severity: 'low',
        misconception_key: 'rejects_work_organizations',
        explanation: 'Las cooperativas son organizaciones sociales donde las personas trabajan juntas para beneficio mutuo.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa: ¿cuál de las opciones NO es un grupo de personas?',
      'Las organizaciones sociales siempre están formadas por personas que se unen.',
      'Solo una opción no es un grupo de personas trabajando juntas.'
    ],
    expected_time: 60,
    difficulty_indicator: 'easy',
    concept_card_key: 'classifying_social_organizations'
  },
  tutor_responses: {
    correct: [
      '¡Excelente! Has identificado correctamente que un árbol no es una organización social.',
      '¡Muy bien! Las organizaciones sociales siempre están formadas por personas que trabajan juntas.',
      '¡Correcto! Un árbol es parte de la naturaleza, no un grupo de personas.'
    ],
    incorrect_attempt_1: [
      'Recuerda: una organización social es un grupo de PERSONAS que trabajan juntas.',
      'Piensa cuál opción no es un grupo de personas.'
    ],
    encouragement: [
      'Buen intento, sigue pensando.',
      'Estás razonando bien.'
    ]
  },
  cognitive_dimension: 'clasificacion'
};

// Step 5: Guided Application - Practicar con apoyo (opción múltiple)
const step5Content = {
  question: 'Tu familia quiere organizar una fiesta en el barrio. ¿Qué organización social debe ayudar con los permisos y el espacio?',
  context: 'Las organizaciones sociales se relacionan entre sí. Cuando queremos hacer actividades en nuestra comunidad, debemos trabajar con diferentes organizaciones para que todo salga bien.',
  type: 'multiple_choice',
  options: [
    'Solo tu familia',
    'Tu escuela',
    'La junta de acción comunal o gobierno local',
    'Ninguna organización'
  ],
  correct_answer: 'La junta de acción comunal o gobierno local',
  expected_answer: {
    type: 'option',
    correct_options: [2],
    misconceptions: [
      {
        pattern: 'Opción A',
        card_key: 'social_org_interaction',
        severity: 'medium',
        misconception_key: 'ignores_public_space_governance',
        explanation: 'Aunque tu familia puede organizar la fiesta, en espacios públicos se necesitan permisos de la organización del barrio.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción B',
        card_key: 'social_org_interaction',
        severity: 'low',
        misconception_key: 'confuses_organization_roles',
        explanation: 'La escuela es importante pero no administra los espacios del barrio.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción D',
        card_key: 'social_org_interaction',
        severity: 'high',
        misconception_key: 'rejects_need_for_coordination',
        explanation: 'Siempre necesitamos trabajar con organizaciones para actividades comunitarias.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa: ¿qué organización administra los espacios públicos donde vives?',
      'El barrio tiene una organización que se encarga de dar permisos para usar parques y espacios comunes.',
      'La junta de acción comunal o gobierno local es responsable del barrio.'
    ],
    expected_time: 75,
    difficulty_indicator: 'medium',
    concept_card_key: 'organizations_working_together'
  },
  tutor_responses: {
    correct: [
      '¡Muy bien! Has entendido que para actividades en el barrio, debemos trabajar con la organización que lo administra.',
      '¡Excelente! Esto muestra cómo las organizaciones sociales se relacionan entre sí.',
      '¡Correcto! La junta comunal coordina el uso de espacios públicos.'
    ],
    incorrect_attempt_1: [
      'Piensa: ¿qué organización es responsable de cuidar los espacios públicos del barrio?',
      'Recuerda que cada organización tiene diferentes responsabilidades.'
    ],
    encouragement: [
      'Buen razonamiento, intenta otra vez.',
      'Vas bien, piensa en quién administra tu barrio.'
    ]
  },
  cognitive_dimension: 'aplicacion_guiada'
};

// Step 6: Transfer - Aplicar en contexto nuevo (texto libre para más profundidad)
const step6Content = {
  question: 'Si quisieras ayudar a limpiar una playa contaminada en tu ciudad, ¿con qué tipo de organización podrías trabajar y por qué?',
  context: 'El concepto de organizaciones sociales se aplica a muchas situaciones. Las personas se organizan para resolver problemas y mejorar su comunidad. Podemos crear o unirnos a organizaciones para causas que nos importan.',
  type: 'open_text',
  expected_answer: {
    type: 'text',
    keywords: ['ambiental', 'ecológica', 'fundación', 'grupo', 'organización', 'medio ambiente', 'proteger', 'cuidar', 'naturaleza'],
    sample_answers: [
      'Con un grupo ambiental porque se dedican a proteger la naturaleza',
      'Con una fundación ecológica que cuida el medio ambiente',
      'Con una organización ambiental que tiene experiencia limpiando playas',
      'Con personas que se unen para cuidar la naturaleza'
    ],
    misconceptions: [
      {
        pattern: 'sol[oa]|no.*necesit|no.*organiz',
        card_key: 'social_org_transfer',
        severity: 'high',
        misconception_key: 'undervalues_specialized_organizations',
        explanation: 'Para proyectos grandes necesitamos organizaciones que coordinen el trabajo y tengan experiencia.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa: ¿qué tipo de organización se dedica a proteger el medio ambiente?',
      'Hay organizaciones especializadas en cuidar la naturaleza y coordinar proyectos de limpieza.',
      'Las fundaciones o grupos ambientales son organizaciones sociales con este propósito.'
    ],
    expected_time: 120,
    difficulty_indicator: 'medium',
    concept_card_key: 'transfer_to_new_contexts'
  },
  tutor_responses: {
    correct: [
      '¡Fantástico! Has transferido el concepto a un nuevo contexto.',
      '¡Excelente! Las organizaciones ambientales son grupos especializados en proteger la naturaleza.',
      '¡Muy bien! Entiendes que hay organizaciones para diferentes propósitos.'
    ],
    incorrect_attempt_1: [
      'Piensa en organizaciones que se especializan en cuidar el medio ambiente.',
      'Recuerda que hay organizaciones para muchos propósitos diferentes.'
    ],
    encouragement: [
      'Excelente que pienses en ayudar al medio ambiente.',
      'Buena aplicación del concepto.'
    ]
  },
  cognitive_dimension: 'transferencia'
};

// Step 7: Error Analysis - Detectar misconception (opción múltiple)
const step7Content = {
  question: 'Juan dice: "La familia de Pedro no es una organización social porque solo tiene 4 personas". ¿Por qué está equivocado Juan?',
  context: 'A veces tenemos ideas equivocadas sobre las organizaciones sociales. Es importante identificar estos errores para entender mejor el concepto.',
  type: 'multiple_choice',
  options: [
    'Porque el tamaño no importa; lo importante es que las personas trabajan juntas con un propósito común',
    'Porque solo las organizaciones grandes son importantes',
    'Porque Juan tiene razón, las familias pequeñas no son organizaciones',
    'Porque solo 4 personas no pueden organizarse'
  ],
  correct_answer: 'Porque el tamaño no importa; lo importante es que las personas trabajan juntas con un propósito común',
  expected_answer: {
    type: 'option',
    correct_options: [0],
    misconceptions: [
      {
        pattern: 'Opción B',
        card_key: 'social_org_size_misconception',
        severity: 'high',
        misconception_key: 'values_only_large_organizations',
        explanation: 'Todas las organizaciones sociales son valiosas, sin importar su tamaño.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción C',
        card_key: 'social_org_size_misconception',
        severity: 'high',
        misconception_key: 'confuses_size_with_definition',
        explanation: 'Todas las familias son organizaciones sociales, sin importar su tamaño.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción D',
        card_key: 'social_org_size_misconception',
        severity: 'medium',
        misconception_key: 'assumes_minimum_size_requirement',
        explanation: 'No hay un número mínimo de personas para formar una organización social.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa: ¿qué define una organización social? ¿El número de personas o cómo trabajan juntas?',
      'Recuerda las características que vimos: personas trabajando juntas con objetivos comunes.',
      'El tamaño no es lo que define una organización social.'
    ],
    expected_time: 90,
    difficulty_indicator: 'medium',
    concept_card_key: 'analyzing_common_errors'
  },
  tutor_responses: {
    correct: [
      '¡Excelente análisis! Has identificado el error en el razonamiento de Juan.',
      '¡Muy bien! El tamaño no define una organización social; lo importante es cómo trabajan juntas las personas.',
      '¡Correcto! Has detectado la misconception sobre el tamaño.'
    ],
    incorrect_attempt_1: [
      'Piensa: ¿qué hace que algo sea una organización social?',
      'Recuerda las características principales que vimos al inicio.'
    ],
    encouragement: [
      'Buen análisis, sigue pensando.',
      'Estás razonando sobre los errores comunes.'
    ]
  },
  cognitive_dimension: 'analisis_de_error'
};

// Step 8: Metacognition - Reflexión personal (texto libre)
const step8Content = {
  question: '¿Qué fue lo más importante que aprendiste sobre las organizaciones sociales y cómo puedes usar este conocimiento en tu vida?',
  context: 'Ahora que terminamos el módulo, es importante reflexionar sobre lo que aprendimos. Esto nos ayuda a recordar mejor y aplicar el conocimiento en el futuro.',
  type: 'open_text',
  expected_answer: {
    type: 'text',
    keywords: ['aprendí', 'importante', 'familia', 'escuela', 'barrio', 'organización', 'juntos', 'comunidad', 'ayudar', 'participar'],
    sample_answers: [
      'Aprendí que las organizaciones son grupos que trabajan juntos y puedo participar en mi comunidad',
      'Lo importante es que hay muchas organizaciones y todas ayudan de diferentes formas',
      'Aprendí que puedo ser parte de organizaciones para mejorar mi barrio',
      'Entendí que trabajar juntos es importante y puedo ayudar en mi familia y escuela'
    ],
    misconceptions: [] // Metacognition no tiene misconceptions específicos
  },
  step_config: {
    hints: [
      'Piensa en todo lo que vimos: familia, escuela, barrio... ¿Qué fue lo más importante?',
      'Reflexiona sobre cómo este conocimiento puede ayudarte en tu vida diaria.',
      'No hay una sola respuesta correcta. Lo importante es tu reflexión personal.'
    ],
    expected_time: 120,
    difficulty_indicator: 'medium',
    concept_card_key: 'metacognitive_reflection'
  },
  tutor_responses: {
    correct: [
      '¡Felicitaciones! Has completado el módulo con una excelente reflexión.',
      '¡Muy bien! Tu reflexión muestra que has comprendido las organizaciones sociales.',
      '¡Excelente! Ahora puedes identificar y participar en organizaciones en tu vida diaria.'
    ],
    encouragement: [
      'Tu reflexión es valiosa.',
      'Gracias por compartir lo que aprendiste.',
      'Excelente reflexión personal.'
    ]
  },
  cognitive_dimension: 'metacognicion'
};

async function fixModule() {
  console.log('🔧 Corrigiendo estructura del módulo de Ciencias Sociales...\n');

  const stepsToUpdate = [
    { id: '8f454f1a-44c1-49c8-8da9-0c61f31ecf91', content: step3Content, name: 'Step 3 - Explanation (texto libre)', phase: 'concept_formation' },
    { id: '34bb219f-4504-45e5-a6bd-ad8e21e8878e', content: step4Content, name: 'Step 4 - Classification', phase: 'classification' },
    { id: '249b3b6e-267b-4b57-9964-bf830b44b558', content: step5Content, name: 'Step 5 - Guided Application', phase: 'guided_application' },
    { id: 'af79c41f-ad3c-4c29-bfcb-70f700def08e', content: step6Content, name: 'Step 6 - Transfer (texto libre)', phase: 'transfer' },
    { id: '4428fc6e-f983-49da-b9f4-deb28087a4e3', content: step7Content, name: 'Step 7 - Error Analysis', phase: 'error_analysis' },
    { id: '8bfa79ab-719c-4261-9642-4c05a6147456', content: step8Content, name: 'Step 8 - Metacognition (texto libre)', phase: 'metacognition' }
  ];

  for (const step of stepsToUpdate) {
    console.log(`📝 Actualizando ${step.name}...`);
    
    const { error } = await supabase
      .from('module_steps')
      .update({ 
        enriched_content: step.content,
        phase: step.phase
      })
      .eq('id', step.id);

    if (error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ ${step.name} actualizado`);
    }
  }

  console.log('\n🎉 Módulo corregido!\n');
  console.log('📊 Resumen de tipos de pregunta:');
  console.log('   Steps 1-2: Opción múltiple (exploración y representación)');
  console.log('   Step 3: TEXTO LIBRE (explicación/razonamiento)');
  console.log('   Steps 4-5: Opción múltiple (clasificación y aplicación guiada)');
  console.log('   Step 6: TEXTO LIBRE (transferencia a contexto nuevo)');
  console.log('   Step 7: Opción múltiple (análisis de error)');
  console.log('   Step 8: TEXTO LIBRE (metacognición/reflexión)\n');
  console.log('✨ Ahora hay variedad pedagógica: 5 de opción múltiple + 3 de texto libre');
}

fixModule().catch(console.error);
