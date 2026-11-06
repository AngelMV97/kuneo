require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function enrichSocialStudiesModule() {
  const moduleId = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';
  
  console.log('🎨 Enriqueciendo módulo de Ciencias Sociales...\n');
  console.log('📚 Módulo: ¿Cómo analizar una situación social?');
  console.log('🎯 Concepto: Organizaciones sociales (familia, escuela, barrio)\n');

  // Step 1: Sobre la familia
  const step1Content = {
    question: '¿Cuál de estas es una organización social a la que perteneces?',
    context: 'Las organizaciones sociales son grupos de personas que se unen por algo en común. La familia es la organización social más importante porque es donde aprendemos, crecemos y nos cuidamos unos a otros.',
    type: 'option',
    options: [
      'Mi familia',
      'Una pizza',
      'Un árbol',
      'Una pelota'
    ],
    correct_answer: 'Mi familia',
    expected_answer: {
      type: 'option',
      correct_options: [0],
      misconceptions: [
        {
          pattern: 'Opción B',
          card_key: 'social_org_misconception',
          severity: 'low',
          misconception_key: 'confuses_objects_with_social_groups',
          explanation: 'Una pizza es un objeto, no un grupo de personas. Las organizaciones sociales son grupos donde las personas se relacionan.',
          common_among_grade: '1-3'
        },
        {
          pattern: 'Opción C',
          card_key: 'social_org_misconception',
          severity: 'low',
          misconception_key: 'confuses_nature_with_social_groups',
          explanation: 'Un árbol es parte de la naturaleza. Las organizaciones sociales son grupos de personas, como tu familia o tu escuela.',
          common_among_grade: '1-3'
        },
        {
          pattern: 'Opción D',
          card_key: 'social_org_misconception',
          severity: 'low',
          misconception_key: 'confuses_toys_with_social_groups',
          explanation: 'Una pelota es un juguete. Las organizaciones sociales son grupos de personas que comparten algo.',
          common_among_grade: '1-3'
        }
      ]
    },
    step_config: {
      hints: [
        'Piensa en los grupos de personas donde te sientes cuidado y protegido.',
        'Es el lugar donde vives con las personas que más te quieren.',
        'Es el grupo donde están tus papás, hermanos o abuelos.'
      ],
      expected_time: 45,
      difficulty_indicator: 'easy',
      concept_card_key: 'family_as_social_organization',
      visual_template_key: null,
      reflection_prompts: [
        '¿Quiénes forman parte de tu familia?',
        '¿Qué cosas hacen juntos en tu familia?'
      ]
    },
    tutor_responses: {
      correct: [
        '¡Exacto! Tu familia es una organización social muy importante.',
        '¡Muy bien! La familia es el primer grupo social al que pertenecemos.',
        '¡Correcto! En tu familia aprendes y creces junto a las personas que te quieren.'
      ],
      incorrect_attempt_1: [
        'Hmm, piensa en un grupo de personas, no en un objeto.',
        'Recuerda que las organizaciones sociales son grupos de personas que se relacionan.',
        'Piensa: ¿cuál de estas opciones es un grupo de personas?'
      ],
      incorrect_attempt_2: [
        'Veamos una pista: es el lugar donde vives con las personas que te cuidan.',
        'Las organizaciones sociales son grupos de personas. ¿Cuál de las opciones es un grupo?',
        'Piensa en el grupo de personas con quienes compartes tu casa.'
      ],
      encouragement: [
        'Estás pensando bien, sigue intentando.',
        'Casi lo tienes, piensa un poco más.',
        'Muy bien que lo intentes, vamos por el camino correcto.'
      ]
    },
    cognitive_dimension: 'comprension'
  };

  // Step 2: Sobre la escuela
  const step2Content = {
    question: '¿Qué hacemos en la escuela como organización social?',
    context: 'La escuela es una organización social donde niños y niñas aprenden juntos. Es un lugar donde hacemos amigos, compartimos, aprendemos y nos ayudamos unos a otros. Los maestros nos guían para aprender cosas nuevas cada día.',
    type: 'option',
    options: [
      'Aprendemos y hacemos amigos',
      'Comemos pizza todo el día',
      'Dormimos siempre',
      'Vemos televisión solamente'
    ],
    correct_answer: 'Aprendemos y hacemos amigos',
    expected_answer: {
      type: 'option',
      correct_options: [0],
      misconceptions: [
        {
          pattern: 'Opción B',
          card_key: 'school_purpose_misconception',
          severity: 'medium',
          misconception_key: 'confuses_school_with_recreation',
          explanation: 'En la escuela sí comemos, pero el propósito principal es aprender y convivir con otros niños. No pasamos todo el día comiendo.',
          common_among_grade: '1-3'
        },
        {
          pattern: 'Opción C',
          card_key: 'school_purpose_misconception',
          severity: 'medium',
          misconception_key: 'confuses_school_with_rest',
          explanation: 'En la escuela a veces descansamos, pero vamos principalmente para aprender, jugar y hacer amigos.',
          common_among_grade: '1-3'
        },
        {
          pattern: 'Opción D',
          card_key: 'school_purpose_misconception',
          severity: 'medium',
          misconception_key: 'confuses_school_with_entertainment',
          explanation: 'En la escuela a veces vemos videos educativos, pero hacemos muchas más cosas: aprender, jugar, compartir y hacer amigos.',
          common_among_grade: '1-3'
        }
      ]
    },
    step_config: {
      hints: [
        'Piensa en lo que haces cada día cuando vas a la escuela.',
        'En la escuela hay maestros que te enseñan cosas nuevas.',
        'También es donde conoces y juegas con otros niños de tu edad.'
      ],
      expected_time: 50,
      difficulty_indicator: 'easy',
      concept_card_key: 'school_as_social_organization',
      visual_template_key: null,
      reflection_prompts: [
        '¿Qué es lo que más te gusta hacer en la escuela?',
        '¿Con quién compartes en la escuela?'
      ]
    },
    tutor_responses: {
      correct: [
        '¡Perfecto! En la escuela aprendemos y hacemos amigos.',
        '¡Muy bien! La escuela es donde crecemos aprendiendo con otros niños.',
        '¡Exacto! En la escuela compartimos, aprendemos y jugamos juntos.'
      ],
      incorrect_attempt_1: [
        'Mmm, piensa en las actividades más importantes que haces en la escuela.',
        'Recuerda para qué vas cada día a la escuela.',
        'Piensa: ¿qué es lo principal que haces con tus compañeros y maestros?'
      ],
      incorrect_attempt_2: [
        'La escuela es un lugar especial para aprender cosas nuevas.',
        'En la escuela conoces a otros niños y niñas con quienes compartes.',
        'Piensa en lo que haces con tus compañeros de clase cada día.'
      ],
      encouragement: [
        'Vas muy bien, sigue pensando.',
        'Estás cerca de la respuesta correcta.',
        'Me gusta cómo estás pensando, intenta otra vez.'
      ]
    },
    cognitive_dimension: 'comprension'
  };

  // Step 3: Sobre el barrio
  const step3Content = {
    question: '¿Qué es el barrio como organización social? Descríbelo con tus propias palabras.',
    context: 'El barrio es el lugar donde vivimos junto con otras familias. Es una organización social porque las personas se conocen, se ayudan y comparten espacios como parques, tiendas y calles. En el barrio convivimos con nuestros vecinos y nos cuidamos entre todos.',
    type: 'keywords',
    expected_answer: {
      type: 'keywords',
      keywords: [
        'lugar', 'sitio', 'zona',
        'vecinos', 'familias', 'personas', 'gente',
        'cerca', 'alrededor', 'comunidad',
        'parque', 'calle', 'tienda',
        'vivir', 'vivo', 'compartir',
        'ayudar', 'conocer'
      ],
      evaluation_strategy: 'keywords',
      min_keywords: 2,
      misconceptions: [
        {
          pattern: 'Opción B',
          card_key: 'neighborhood_misconception',
          severity: 'medium',
          misconception_key: 'confuses_neighborhood_with_store',
          explanation: 'Una tienda puede estar EN tu barrio, pero el barrio es todo el lugar donde vives con tus vecinos.',
          common_among_grade: '1-3'
        },
        {
          pattern: 'Opción C',
          card_key: 'neighborhood_misconception',
          severity: 'low',
          misconception_key: 'confuses_neighborhood_with_media',
          explanation: 'Un programa de TV no es un lugar físico. El barrio es el lugar real donde está tu casa y las casas de tus vecinos.',
          common_among_grade: '1-3'
        },
        {
          pattern: 'Opción D',
          card_key: 'neighborhood_misconception',
          severity: 'low',
          misconception_key: 'confuses_neighborhood_with_time',
          explanation: 'Los días de la semana son tiempo, no lugares. El barrio es el espacio donde vives con otras familias.',
          common_among_grade: '1-3'
        }
      ]
    },
    step_config: {
      hints: [
        'Piensa en el lugar alrededor de tu casa donde viven otras familias.',
        'Es el lugar donde conoces a las personas que viven cerca de ti.',
        'Tiene calles, casas, parques y tiendas que compartes con otras familias.'
      ],
      expected_time: 55,
      difficulty_indicator: 'medium',
      concept_card_key: 'neighborhood_as_social_organization',
      visual_template_key: null,
      reflection_prompts: [
        '¿Conoces a tus vecinos?',
        '¿Qué lugares de tu barrio visitas con tu familia?'
      ]
    },
    tutor_responses: {
      correct: [
        '¡Excelente! El barrio es donde vives con tus vecinos.',
        '¡Muy bien! El barrio es una organización social donde conviven muchas familias.',
        '¡Correcto! En el barrio compartimos espacios con otras personas que viven cerca.'
      ],
      incorrect_attempt_1: [
        'Piensa en el lugar físico donde está tu casa y las casas de otras familias.',
        'Recuerda que el barrio es un lugar, no una cosa u objeto.',
        'El barrio es el espacio donde vives junto con otras personas. ¿Cuál opción describe eso?'
      ],
      incorrect_attempt_2: [
        'El barrio es como una comunidad de familias que viven cerca.',
        'Piensa en quiénes son tus vecinos y dónde viven.',
        'Es el lugar alrededor de tu casa donde conoces a otras personas.'
      ],
      encouragement: [
        'Buen intento, sigue pensando en tu comunidad.',
        'Estás razonando bien, intenta de nuevo.',
        'Casi lo logras, piensa un poco más.'
      ]
    },
    cognitive_dimension: 'comprension'
  };

  // Actualizar los 3 primeros steps
  const stepsToUpdate = [
    { id: '1b6c1319-0e6e-4ba3-9e65-44cc28db3ebd', content: step1Content, name: 'familia' },
    { id: '724ff139-fac6-4f63-a296-56d9198e2889', content: step2Content, name: 'escuela' },
    { id: '8f454f1a-44c1-49c8-8da9-0c61f31ecf91', content: step3Content, name: 'barrio' }
  ];

  for (const step of stepsToUpdate) {
    console.log(`📝 Enriqueciendo step sobre ${step.name}...`);
    
    const { error } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .update({ enriched_content: step.content })
      .eq('id', step.id);

    if (error) {
      console.error(`❌ Error en step ${step.name}:`, error.message);
    } else {
      console.log(`✅ Step ${step.name} enriquecido correctamente`);
    }
  }

  console.log('\n🎉 Enriquecimiento completo!\n');
  console.log('📌 MÓDULO PARA PROBAR:');
  console.log('   Materia: Ciencias Sociales (social_studies)');
  console.log('   Nombre: "¿Cómo analizar una situación social?"');
  console.log(`   ID: ${moduleId}`);
  console.log('\n✨ Este módulo ahora tiene:');
  console.log('   - Preguntas reales sobre familia, escuela y barrio');
  console.log('   - Opciones de respuesta apropiadas');
  console.log('   - Pistas relevantes al tema (NO sobre fracciones)');
  console.log('   - Mensajes de Tuko contextualizados');
  console.log('   - Explicaciones de misconceptions');

  process.exit(0);
}

enrichSocialStudiesModule().catch(console.error);
