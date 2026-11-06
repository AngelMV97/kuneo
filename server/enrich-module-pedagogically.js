require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

/**
 * DISEÑO PEDAGÓGICO DEL MÓDULO:
 * 
 * STEP 1 - exploration: Opción múltiple simple (activar intuición rápida)
 * STEP 2 - representation: Selección múltiple* (ver múltiples aspectos del concepto)
 * STEP 3 - explanation: Texto libre (razonar y explicar)
 * STEP 4 - classification: Selección múltiple* (distinguir varios casos/no casos)
 * STEP 5 - guided_application: Matching/Relacionar* (aplicar con estructura)
 * STEP 6 - transfer: Texto libre (aplicar creativamente en contexto nuevo)
 * STEP 7 - error_analysis: Opción múltiple con justificación* (analizar errores)
 * STEP 8 - metacognition: Texto libre (reflexión profunda)
 * 
 * * = Requiere extensión del frontend (marcados para fase 2)
 * 
 * POR AHORA: Usaremos los tipos existentes de forma óptima
 * DESPUÉS: Implementaremos los componentes marcados con *
 */

// STEP 1 - exploration: Opción múltiple simple ✅ (ya está bien)
// No necesita cambios, ya usa el tipo correcto

// STEP 2 - representation: Por ahora opción múltiple, después selección múltiple
const step2Content = {
  question: '¿Cuáles son las funciones más importantes de la escuela como organización social?',
  context: 'La escuela es una organización social donde estudiantes, maestros y familias trabajan juntos. Tiene varios propósitos importantes que ayudan a los niños a desarrollarse.',
  type: 'multiple_choice', // TODO: cambiar a 'multiple_select' cuando frontend lo soporte
  options: [
    'Enseñar y ayudarnos a aprender cosas nuevas',
    'Solo cuidarnos mientras nuestros papás trabajan',
    'Ayudarnos a hacer amigos y trabajar en equipo',
    'Darnos un lugar para jugar solamente'
  ],
  correct_answer: 'Enseñar y ayudarnos a aprender cosas nuevas',
  expected_answer: {
    type: 'option',
    correct_options: [0], // Idealmente sería [0, 2] en selección múltiple
    misconceptions: [
      {
        pattern: 'Opción B',
        card_key: 'school_purpose_misconception',
        severity: 'medium',
        misconception_key: 'reduces_school_to_childcare',
        explanation: 'Aunque la escuela cuida de ti, su función principal es educarte y ayudarte a desarrollar habilidades.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción D',
        card_key: 'school_purpose_misconception',
        severity: 'medium',
        misconception_key: 'reduces_school_to_recreation',
        explanation: 'Jugar es importante, pero la escuela tiene muchas otras funciones educativas y sociales.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa en qué hacen los maestros en la escuela.',
      'La escuela te ayuda a crecer en conocimientos y habilidades.',
      'Es un lugar donde aprendes materias como matemáticas, lenguaje y ciencias.'
    ],
    expected_time: 60,
    difficulty_indicator: 'easy',
    concept_card_key: 'school_as_educational_organization',
    future_type: 'multiple_select', // Nota para futuro: permitir seleccionar opciones A y C
    future_correct_options: [0, 2]
  },
  tutor_responses: {
    correct: [
      '¡Muy bien! La escuela es principalmente un lugar para aprender y desarrollar conocimientos.',
      '¡Correcto! La educación es la función principal de la escuela como organización.',
      '¡Excelente! Has identificado que enseñar es el propósito central de la escuela.'
    ],
    incorrect_attempt_1: [
      'Piensa en por qué existen los maestros y las clases.',
      'La escuela tiene muchas funciones, pero hay una principal relacionada con el aprendizaje.'
    ],
    encouragement: [
      'Buen intento, piensa en lo más importante que haces en la escuela.',
      'Reflexiona sobre qué es lo principal que sucede en las aulas.'
    ]
  },
  cognitive_dimension: 'representacion'
};

// STEP 3 - explanation: Texto libre ✅ (razonamiento profundo)
const step3Content = {
  question: '¿Por qué crees que es importante que las personas del barrio se organicen y trabajen juntas? Explica tu respuesta.',
  context: 'El barrio es una organización social donde muchas familias viven cerca y comparten espacios como parques, calles y tiendas. La organización permite coordinar esfuerzos para el bien común.',
  type: 'open_text',
  expected_answer: {
    type: 'keywords',
    evaluation_strategy: 'keywords',
    required_keywords: ['organiz', 'juntos', 'mejor', 'barrio'], // Keywords esenciales (con stemming básico)
    optional_keywords: ['ayudar', 'mejorar', 'cuidar', 'comunidad', 'problemas', 'solucionar', 'cooperar', 'espacios', 'parques', 'calles', 'vecinos'],
    sample_answers: [
      'Es importante porque juntos pueden solucionar problemas y mejorar el barrio',
      'Para cuidar los espacios públicos y ayudarse entre vecinos',
      'Porque organizados pueden hacer más cosas que solos, como mejorar parques',
      'Para que todos cooperen y el barrio sea mejor para vivir'
    ],
    min_length: 30,
    misconceptions: [
      {
        pattern: 'no.*import|no.*necesit',
        card_key: 'social_org_misconception',
        severity: 'high',
        misconception_key: 'undervalues_community_organization',
        explanation: 'La organización del barrio es muy importante porque permite resolver problemas y mejorar la calidad de vida de todos.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa en qué pasaría si nadie cuidara los parques o las calles del barrio.',
      'Cuando las personas trabajan juntas, ¿qué pueden lograr?',
      'Imagina problemas del barrio que solo se resuelven con cooperación.'
    ],
    expected_time: 120,
    difficulty_indicator: 'medium',
    concept_card_key: 'neighborhood_cooperation'
  },
  tutor_responses: {
    correct: [
      '¡Excelente explicación! Has comprendido el valor de la organización comunitaria.',
      '¡Muy bien razonado! Trabajar juntos hace que el barrio funcione mejor.',
      '¡Correcto! Tu explicación muestra que entiendes la importancia de cooperar.'
    ],
    incorrect_attempt_1: [
      'Piensa más profundamente: ¿qué pueden lograr los vecinos organizados?',
      'Intenta explicar con más detalle por qué la organización ayuda.'
    ],
    encouragement: [
      'Buena reflexión inicial, desarrolla más tu idea.',
      'Vas por buen camino, explica un poco más.'
    ]
  },
  cognitive_dimension: 'razonamiento'
};

// STEP 4 - classification: Por ahora opción múltiple, después selección múltiple
const step4Content = {
  question: 'De las siguientes opciones, ¿cuál NO es una organización social?',
  context: 'Las organizaciones sociales son grupos de personas que se unen con un propósito común. Saber distinguir qué es y qué no es una organización social nos ayuda a entender mejor este concepto.',
  type: 'multiple_choice',
  options: [
    'Un equipo de fútbol del barrio',
    'Un edificio vacío',
    'Una cooperativa de recicladores',
    'Un grupo de teatro escolar'
  ],
  correct_answer: 'Un edificio vacío',
  expected_answer: {
    type: 'option',
    correct_options: [1],
    misconceptions: [
      {
        pattern: 'Opción A',
        card_key: 'social_org_classification',
        severity: 'medium',
        misconception_key: 'rejects_informal_sports_groups',
        explanation: 'Un equipo deportivo SÍ es una organización social porque personas se unen y trabajan juntas para jugar.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción C',
        card_key: 'social_org_classification',
        severity: 'medium',
        misconception_key: 'rejects_work_organizations',
        explanation: 'Una cooperativa SÍ es una organización donde personas trabajan juntas con objetivos comunes.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción D',
        card_key: 'social_org_classification',
        severity: 'low',
        misconception_key: 'rejects_artistic_groups',
        explanation: 'Un grupo de teatro SÍ es una organización social donde personas colaboran creativamente.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Una organización social necesita PERSONAS trabajando juntas.',
      'Piensa: ¿cuál opción es solo un lugar o cosa, no un grupo de personas?',
      'Las organizaciones siempre involucran personas con objetivos compartidos.'
    ],
    expected_time: 60,
    difficulty_indicator: 'easy',
    concept_card_key: 'classifying_social_organizations',
    future_type: 'multiple_select',
    future_instruction: 'Marcar TODAS las que SÍ son organizaciones sociales',
    future_correct_options: [0, 2, 3] // A, C, D son correctas; B es la incorrecta
  },
  tutor_responses: {
    correct: [
      '¡Perfecto! Un edificio vacío no es una organización porque no hay personas trabajando juntas.',
      '¡Excelente clasificación! Has identificado correctamente lo que NO es una organización social.',
      '¡Muy bien! Distingues claramente entre objetos/lugares y grupos organizados de personas.'
    ],
    incorrect_attempt_1: [
      'Recuerda: las organizaciones sociales siempre son grupos de PERSONAS.',
      'Busca la opción que no involucra personas trabajando juntas.'
    ],
    encouragement: [
      'Piensa en la definición: ¿cuál no es un grupo de personas?',
      'Casi aciertas, analiza cada opción con cuidado.'
    ]
  },
  cognitive_dimension: 'clasificacion'
};

// STEP 5 - guided_application: Opción múltiple (simula matching por ahora)
const step5Content = {
  question: 'Tu familia quiere organizar una actividad deportiva para los niños del barrio. ¿Con cuál organización del barrio deberían coordinar?',
  context: 'Las organizaciones sociales trabajan juntas y se apoyan. Para actividades en la comunidad, es importante saber con quién coordinar según el tipo de proyecto.',
  type: 'multiple_choice',
  options: [
    'La junta de acción comunal (quienes administran el barrio)',
    'Una tienda del barrio',
    'Solo con otras familias, sin más organización',
    'El hospital más cercano'
  ],
  correct_answer: 'La junta de acción comunal (quienes administran el barrio)',
  expected_answer: {
    type: 'option',
    correct_options: [0],
    misconceptions: [
      {
        pattern: 'Opción B',
        card_key: 'organization_coordination',
        severity: 'medium',
        misconception_key: 'confuses_business_with_community_org',
        explanation: 'Una tienda es un negocio, no una organización comunitaria. Para actividades del barrio se coordina con la junta comunal.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción C',
        card_key: 'organization_coordination',
        severity: 'high',
        misconception_key: 'ignores_formal_coordination',
        explanation: 'Siempre es necesario coordinar con la organización del barrio para usar espacios públicos correctamente.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción D',
        card_key: 'organization_coordination',
        severity: 'medium',
        misconception_key: 'confuses_organization_functions',
        explanation: 'El hospital se encarga de salud, no de coordinar actividades deportivas del barrio.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      '¿Qué organización administra los espacios públicos y actividades del barrio?',
      'Piensa en quién da permisos para usar parques o canchas del barrio.',
      'La junta comunal o gobierno local coordina las actividades de la comunidad.'
    ],
    expected_time: 75,
    difficulty_indicator: 'medium',
    concept_card_key: 'organizations_working_together',
    future_type: 'matching',
    future_pairs: [
      { situation: 'Actividad deportiva para niños', organization: 'Junta de acción comunal' },
      { situation: 'Aprender matemáticas', organization: 'Escuela' },
      { situation: 'Cuidado cuando estás enfermo', organization: 'Hospital/Centro de salud' },
      { situation: 'Celebración familiar en casa', organization: 'Solo la familia' }
    ]
  },
  tutor_responses: {
    correct: [
      '¡Muy bien! La junta comunal coordina actividades y espacios públicos del barrio.',
      '¡Excelente! Has identificado la organización correcta para coordinar actividades comunitarias.',
      '¡Correcto! Sabes con quién trabajar para proyectos del barrio.'
    ],
    incorrect_attempt_1: [
      'Piensa: ¿qué organización se encarga de administrar el barrio?',
      'Cada organización tiene funciones específicas. ¿Cuál administra espacios públicos?'
    ],
    encouragement: [
      'Buen intento, piensa en quién administra tu barrio.',
      'Reflexiona sobre las responsabilidades de cada organización.'
    ]
  },
  cognitive_dimension: 'aplicacion_guiada'
};

// STEP 6 - transfer: Texto libre ✅ (aplicación creativa)
const step6Content = {
  question: 'Imagina que en tu ciudad hay un problema: muchos animales abandonados en las calles. ¿Qué tipo de organización social podrías crear o buscar para ayudar a resolver este problema? Explica cómo funcionaría.',
  context: 'Las personas pueden crear nuevas organizaciones sociales para resolver problemas que identifican en su comunidad. Esto muestra cómo el concepto de organización social se puede transferir a diferentes situaciones.',
  type: 'open_text',
  expected_answer: {
    type: 'keywords',
    evaluation_strategy: 'keywords',
    required_keywords: ['animal', 'organiz', 'grupo'], // Keywords esenciales
    optional_keywords: ['protección', 'refugio', 'fundación', 'voluntarios', 'adopción', 'cuidar', 'ayudar', 'rescatar', 'vecinos', 'ambiente', 'ecológica'],
    sample_answers: [
      'Crear una fundación de protección animal donde voluntarios rescaten y cuiden animales hasta darlos en adopción',
      'Un grupo de vecinos que se organicen para alimentar y buscar hogares para los animales',
      'Una organización con veterinarios y voluntarios que tengan un refugio temporal',
      'Un club de amigos de los animales que coordine rescates y campañas de adopción'
    ],
    min_length: 30,
    misconceptions: [
      {
        pattern: 'gobierno.*debe|alcalde.*debe|sol[oa].*autorid',
        card_key: 'community_initiative',
        severity: 'medium',
        misconception_key: 'only_authorities_can_solve_problems',
        explanation: 'Aunque el gobierno ayuda, los ciudadanos también pueden crear organizaciones para resolver problemas comunitarios.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      'Piensa en organizaciones que protejan animales. ¿Cómo se organizan?',
      'Las organizaciones pueden tener voluntarios, un lugar para cuidar animales, y campañas de adopción.',
      'Recuerda: una organización es un grupo de personas trabajando con un objetivo común.'
    ],
    expected_time: 150,
    difficulty_indicator: 'hard',
    concept_card_key: 'transfer_to_new_contexts'
  },
  tutor_responses: {
    correct: [
      '¡Excelente transferencia! Has aplicado el concepto de organización social a un contexto completamente nuevo.',
      '¡Fantástica propuesta! Tu idea muestra que entiendes cómo funcionan las organizaciones sociales.',
      '¡Muy creativo! Has diseñado una organización social real para resolver un problema.'
    ],
    incorrect_attempt_1: [
      'Piensa más en cómo un GRUPO DE PERSONAS podría organizarse para ayudar.',
      'Desarrolla tu idea: ¿quiénes participarían y qué harían?'
    ],
    encouragement: [
      'Buena idea inicial, desarrolla más cómo funcionaría la organización.',
      'Vas bien, explica con más detalle tu propuesta.'
    ]
  },
  cognitive_dimension: 'transferencia'
};

// STEP 7 - error_analysis: Opción múltiple con análisis ✅
const step7Content = {
  question: 'María dice: "Mi familia no es una organización social porque somos muy pocos, solo 3 personas". ¿Cuál es el error en el pensamiento de María?',
  context: 'Identificar errores comunes nos ayuda a entender mejor los conceptos. A veces las personas tienen ideas equivocadas sobre qué hace que algo sea una organización social.',
  type: 'multiple_choice',
  options: [
    'El error es pensar que el tamaño importa; lo importante es que trabajen juntos con objetivos comunes',
    'El error es pensar que la familia es una organización; solo las organizaciones grandes lo son',
    'No hay error, María tiene razón',
    'El error es que 3 personas son suficientes, pero 2 personas no serían una organización'
  ],
  correct_answer: 'El error es pensar que el tamaño importa; lo importante es que trabajen juntos con objetivos comunes',
  expected_answer: {
    type: 'option',
    correct_options: [0],
    misconceptions: [
      {
        pattern: 'Opción B',
        card_key: 'size_misconception',
        severity: 'high',
        misconception_key: 'believes_only_large_groups_count',
        explanation: 'Este es otro error. TODAS las familias son organizaciones sociales, sin importar su tamaño.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción C',
        card_key: 'size_misconception',
        severity: 'high',
        misconception_key: 'shares_original_misconception',
        explanation: 'Todas las familias SON organizaciones sociales. El tamaño no define si algo es una organización.',
        common_among_grade: '1-3'
      },
      {
        pattern: 'Opción D',
        card_key: 'size_misconception',
        severity: 'medium',
        misconception_key: 'sets_arbitrary_minimum',
        explanation: 'No hay un número mínimo de personas. Lo que importa es cómo trabajan juntas, no cuántas son.',
        common_among_grade: '1-3'
      }
    ]
  },
  step_config: {
    hints: [
      '¿Qué define una organización social: el número de personas o cómo trabajan juntas?',
      'Recuerda la definición: grupo de personas con objetivos comunes.',
      'El tamaño NO es una característica esencial de las organizaciones sociales.'
    ],
    expected_time: 90,
    difficulty_indicator: 'medium',
    concept_card_key: 'analyzing_size_misconception'
  },
  tutor_responses: {
    correct: [
      '¡Excelente análisis! Has identificado correctamente el error conceptual de María.',
      '¡Muy bien! El tamaño no define una organización; lo importante es cómo las personas interactúan.',
      '¡Correcto! Has detectado la misconception sobre el tamaño de las organizaciones.'
    ],
    incorrect_attempt_1: [
      'Piensa: ¿una familia de 3 personas puede tener objetivos comunes y trabajar juntos?',
      'Revisa la definición de organización social. ¿El tamaño es parte de ella?'
    ],
    encouragement: [
      'Buen análisis, reflexiona más sobre qué hace que algo sea una organización.',
      'Casi aciertas, piensa en las características esenciales.'
    ]
  },
  cognitive_dimension: 'analisis_de_error'
};

// STEP 8 - metacognition: Texto libre ✅ (reflexión profunda)
const step8Content = {
  question: 'Reflexiona sobre todo lo que aprendiste en este módulo: ¿Qué fue lo más importante que aprendiste sobre las organizaciones sociales? ¿Cómo puedes usar este conocimiento en tu vida diaria?',
  context: 'La reflexión final nos ayuda a consolidar el aprendizaje. Pensar sobre lo que aprendimos y cómo aplicarlo hace que el conocimiento sea más duradero y útil.',
  type: 'open_text',
  expected_answer: {
    type: 'keywords',
    evaluation_strategy: 'keywords',
    required_keywords: ['organiz', 'importante'], // Mínimo requerido para metacognición
    optional_keywords: ['aprendí', 'familia', 'escuela', 'barrio', 'juntos', 'comunidad', 'ayudar', 'participar', 'cooperar', 'vida', 'puedo', 'aplicar', 'trabajar'],
    sample_answers: [
      'Aprendí que las organizaciones son grupos que trabajan juntos y puedo participar activamente en mi comunidad',
      'Lo más importante es que hay muchas organizaciones y todas tienen propósitos valiosos. Puedo ser parte de ellas',
      'Aprendí que el tamaño no importa y que puedo crear organizaciones para resolver problemas',
      'Entendí que trabajar juntos es poderoso y puedo aplicarlo en mi familia, escuela y barrio'
    ],
    min_length: 40,
    misconceptions: [] // Metacognición no penaliza, toda reflexión es valiosa
  },
  step_config: {
    hints: [
      'Piensa en los ejemplos que vimos: familia, escuela, barrio, organizaciones ambientales...',
      'Reflexiona sobre qué nueva comprensión tienes ahora sobre cómo funcionan los grupos.',
      'Considera cómo este conocimiento puede ayudarte a participar mejor en tu comunidad.'
    ],
    expected_time: 150,
    difficulty_indicator: 'medium',
    concept_card_key: 'metacognitive_reflection',
    accept_all_thoughtful_responses: true
  },
  tutor_responses: {
    correct: [
      '¡Excelente reflexión! Has demostrado una comprensión profunda de las organizaciones sociales.',
      '¡Fantástico! Tu reflexión muestra que puedes aplicar este conocimiento en tu vida.',
      '¡Muy bien! Has completado el módulo con una reflexión valiosa sobre tu aprendizaje.'
    ],
    encouragement: [
      'Gracias por compartir tu reflexión personal.',
      'Tu proceso de aprendizaje ha sido valioso.',
      'Es excelente que reflexiones sobre lo que aprendiste.'
    ]
  },
  cognitive_dimension: 'metacognicion'
};

async function enrichModule() {
  console.log('🎨 Enriqueciendo módulo con diversidad pedagógica...\n');
  console.log('📚 Usando tipos existentes del frontend de forma óptima');
  console.log('📌 Marcando steps que se beneficiarían de nuevos tipos en el futuro\n');

  const stepsToUpdate = [
    { id: '724ff139-fac6-4f63-a296-56d9198e2889', content: step2Content, name: 'Step 2 - Representation', phase: 'representation' },
    { id: '8f454f1a-44c1-49c8-8da9-0c61f31ecf91', content: step3Content, name: 'Step 3 - Explanation', phase: 'concept_formation' },
    { id: '34bb219f-4504-45e5-a6bd-ad8e21e8878e', content: step4Content, name: 'Step 4 - Classification', phase: 'classification' },
    { id: '249b3b6e-267b-4b57-9964-bf830b44b558', content: step5Content, name: 'Step 5 - Guided Application', phase: 'guided_application' },
    { id: 'af79c41f-ad3c-4c29-bfcb-70f700def08e', content: step6Content, name: 'Step 6 - Transfer', phase: 'transfer' },
    { id: '4428fc6e-f983-49da-b9f4-deb28087a4e3', content: step7Content, name: 'Step 7 - Error Analysis', phase: 'error_analysis' },
    { id: '8bfa79ab-719c-4261-9642-4c05a6147456', content: step8Content, name: 'Step 8 - Metacognition', phase: 'metacognition' }
  ];

  for (const step of stepsToUpdate) {
    console.log(`📝 Enriqueciendo ${step.name}...`);
    
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

  console.log('\n🎉 Módulo enriquecido con variedad pedagógica!\n');
  console.log('📊 Distribución actual (usando tipos existentes):');
  console.log('   • 4 steps de opción múltiple (Steps 1, 2, 4, 5, 7)');
  console.log('   • 3 steps de texto libre (Steps 3, 6, 8)\n');
  console.log('🚀 Tipos recomendados para FUTURO (requieren frontend nuevo):');
  console.log('   • Step 2: Selección múltiple (marcar todas las correctas)');
  console.log('   • Step 4: Selección múltiple (marcar todas las organizaciones)');
  console.log('   • Step 5: Matching/Relacionar (situación ↔ organización)\n');
}

enrichModule().catch(console.error);
