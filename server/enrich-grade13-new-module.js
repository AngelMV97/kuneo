/**
 * Enriquecer nuevo módulo de grado 1-3: Derechos y Responsabilidades de los Niños
 * 
 * Tema: Comprender los derechos básicos de los niños y sus responsabilidades
 * Objetivo de aprendizaje: Identifico y respeto mis derechos y los de otras personas,
 * y entiendo que tengo responsabilidades en mi familia, escuela y comunidad.
 * 
 * Estructura: 8 steps con tipos variados
 * - Steps 1-2: option (exploración y comprensión)
 * - Step 3: keywords (explicación) - política 30% min_keywords
 * - Step 4: multiple_select (clasificación)
 * - Step 5: matching (conexión derechos-responsabilidades)
 * - Step 6: ordering (secuencia de acciones)
 * - Step 7: option (análisis de errores)
 * - Step 8: keywords (metacognición) - política 25% min_keywords
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

// Módulo existente de grados 1-3 que vamos a actualizar con nuevo contenido
const MODULE_ID = '50723c30-801e-4fcf-a0d9-bc8aabf7d392';

// Contenido enriquecido para cada step
const enrichedSteps = {
  1: {
    type: 'option',
    question: '¿Qué crees que es un "derecho"?',
    context: 'Comprender el concepto de derechos es fundamental para la convivencia en sociedad. Los derechos nos protegen y nos permiten desarrollarnos plenamente como personas. Desde temprana edad, es importante reconocer que todos tenemos derechos que deben ser respetados, y esto nos ayuda a construir relaciones más justas y equitativas con quienes nos rodean.',
    options: [
      'Algo que me corresponde y que nadie me puede quitar',
      'Un premio que me dan si me porto bien',
      'Algo que solo tienen los adultos',
      'Una regla que solo existe en la escuela'
    ],
    phase: 'exploration',
    hint: 'Piensa en algo que te pertenece siempre, sin importar nada más.',
    tutor_responses: {
      correct: [
        '¡Exacto! Un derecho es algo que te corresponde siempre.',
        '¡Muy bien! Los derechos son de todos y nadie puede quitártelos.',
        '¡Correcto! Entiendes que los derechos son para todos.'
      ],
      encouragement: [
        'Vas por buen camino, sigue pensando.',
        'Casi lo tienes, piensa en qué te pertenece siempre.'
      ],
      incorrect_attempt_1: [
        'Piensa en algo que te pertenece siempre, sin importar nada más.',
        'Los derechos no son premios, son cosas que siempre tienes.'
      ],
      incorrect_attempt_2: [
        'Un derecho es algo que te corresponde por ser persona.',
        'Todos tenemos derechos, niños y adultos por igual.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en algo que te pertenece siempre, sin importar nada más.',
        'Los derechos no dependen de cómo te portes, siempre son tuyos.',
        'La respuesta correcta es la primera opción.'
      ],
      expected_time: 45,
      concept_card_key: 'derechos_basicos',
      reflection_prompts: [
        '¿Por qué crees que todos tenemos derechos?',
        '¿Qué pasaría si no tuviéramos derechos?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'easy'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Muy bien! Un derecho es algo que te corresponde por ser persona y nadie te lo puede quitar.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'confunde_derecho_con_premio',
          hint: 'Los derechos no son premios. Los tienes siempre, sin importar tu comportamiento.'
        },
        {
          pattern: '^2$',
          misconception_key: 'cree_solo_adultos_tienen_derechos',
          hint: 'Los niños también tienen derechos. Todos los seres humanos tienen derechos.'
        },
        {
          pattern: '^3$',
          misconception_key: 'limita_derechos_a_escuela',
          hint: 'Los derechos existen en todas partes: en casa, en la escuela, en la calle.'
        }
      ]
    },
    cognitive_dimension: 'exploracion'
  },

  2: {
    type: 'option',
    question: '¿Cuál de estos es un derecho que tienen todos los niños?',
    context: 'Los derechos de los niños están reconocidos internacionalmente y protegen aspectos fundamentales como la educación, la salud, el juego y la protección contra el maltrato. Conocer estos derechos nos permite defenderlos cuando sea necesario y también respetar los derechos de los demás. Esta conciencia sobre los derechos humanos es la base para construir sociedades más justas y democráticas.',
    options: [
      'Derecho a la educación',
      'Derecho a tener todos los juguetes que quiera',
      'Derecho a no hacer tareas',
      'Derecho a comer solo dulces'
    ],
    phase: 'representation',
    hint: 'Piensa en algo importante para crecer y aprender, no en caprichos.',
    tutor_responses: {
      correct: [
        '¡Correcto! Todos los niños tienen derecho a ir a la escuela.',
        '¡Muy bien! La educación es un derecho fundamental.',
        '¡Exacto! Aprender es un derecho de todos los niños.'
      ],
      encouragement: [
        'Vas bien, piensa en algo realmente importante.',
        'Casi lo logras, sigue intentando.'
      ],
      incorrect_attempt_1: [
        'Piensa en algo importante para crecer y aprender, no en caprichos.',
        'Los derechos son cosas importantes, no son deseos o caprichos.'
      ],
      incorrect_attempt_2: [
        'La educación es un derecho porque te ayuda a crecer y desarrollarte.',
        'Tener juguetes es lindo, pero no es un derecho. La educación sí lo es.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en algo importante para crecer y aprender, no en caprichos.',
        'Los derechos protegen cosas necesarias para tu bienestar.',
        'La respuesta correcta es: derecho a la educación.'
      ],
      expected_time: 50,
      concept_card_key: 'derecho_educacion',
      reflection_prompts: [
        '¿Por qué es importante ir a la escuela?',
        '¿Qué otros derechos crees que tienen los niños?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'easy'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Correcto! Todos los niños tienen derecho a recibir educación para poder aprender y crecer.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'confunde_derecho_con_deseo',
          hint: 'Los derechos no son deseos. Son cosas necesarias para tu bienestar, no caprichos.'
        },
        {
          pattern: '^2$',
          misconception_key: 'confunde_derecho_con_ausencia_responsabilidad',
          hint: 'Los derechos no eliminan las responsabilidades. Hacer tareas es parte de aprender.'
        },
        {
          pattern: '^3$',
          misconception_key: 'confunde_derecho_con_deseo_alimenticio',
          hint: 'Tienes derecho a la alimentación, pero debe ser saludable. Comer solo dulces no es bueno para ti.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  3: {
    type: 'keywords',
    question: 'Explica con tus palabras: ¿Por qué es importante que los niños tengan derechos?',
    context: 'El reconocimiento de los derechos de los niños representa un avance histórico en la protección de la infancia. Comprender la importancia de estos derechos nos ayuda a valorar las garantías que tenemos para desarrollarnos plenamente y también nos motiva a defenderlos. Esta reflexión sobre la importancia de los derechos es esencial para formar ciudadanos conscientes y participativos en una sociedad democrática.',
    phase: 'concept_formation',
    hint: 'Piensa en qué te permiten hacer los derechos: aprender, estar sano, jugar, ser protegido...',
    tutor_responses: {
      correct: [
        '¡Excelente explicación! Entiendes la importancia de los derechos.',
        '¡Muy bien! Comprendes que los derechos nos protegen.',
        '¡Correcto! Los derechos nos ayudan a crecer felices y seguros.'
      ],
      encouragement: [
        'Vas por buen camino, desarrolla más tu idea.',
        'Interesante, piensa en qué más te permiten los derechos.'
      ],
      incorrect_attempt_1: [
        'Piensa en qué te permiten hacer: aprender, estar sano, jugar...',
        '¿Qué pasaría si no pudieras ir a la escuela o al doctor?'
      ],
      incorrect_attempt_2: [
        'Los derechos son importantes porque nos protegen y nos permiten crecer.',
        'Necesitamos derechos para estar seguros, aprender y desarrollarnos.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en qué te permiten hacer los derechos: aprender, estar sano, jugar, ser protegido.',
        'Los derechos nos ayudan a vivir bien y desarrollarnos como personas.',
        'Sin derechos, no tendríamos garantías de educación, salud o protección.'
      ],
      expected_time: 90,
      concept_card_key: 'importancia_derechos',
      reflection_prompts: [
        '¿Cómo sería tu vida sin estos derechos?',
        '¿Quién debe proteger los derechos de los niños?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'proteger', 'protegidos', 'protección', 'cuidar', 'seguro', 'seguros',
        'aprender', 'estudiar', 'educación', 'escuela',
        'crecer', 'desarrollar', 'desarrollo',
        'salud', 'sanos', 'saludable', 'doctor',
        'feliz', 'felices', 'felicidad', 'bienestar',
        'jugar', 'juego', 'diversión', 'divertir',
        'familia', 'casa', 'hogar',
        'respeto', 'respetar', 'dignidad',
        'importante', 'necesario', 'necesarios'
      ],
      evaluation_strategy: 'keywords',
      min_keywords: 3, // 30% de 10 keywords principales = 3
      explanation: '¡Muy bien! Los derechos son importantes porque nos protegen, nos permiten aprender, crecer y ser felices.',
      misconceptions: [
        {
          pattern: '.*hacer.*quiera.*|.*capricho.*',
          misconception_key: 'confunde_derechos_con_libertinaje',
          hint: 'Los derechos no son para hacer lo que quieras, sino para protegerte y ayudarte a crecer bien.'
        },
        {
          pattern: '.*solo.*niños.*|.*no.*adultos.*',
          misconception_key: 'cree_solo_ninos_tienen_derechos',
          hint: 'Todos tenemos derechos, pero los niños necesitan protección especial porque están creciendo.'
        }
      ]
    },
    cognitive_dimension: 'razonamiento'
  },

  4: {
    type: 'multiple_select',
    question: 'Marca TODOS los derechos que tienen los niños:',
    context: 'La Convención sobre los Derechos del Niño establece una serie de derechos fundamentales que todos los países deben garantizar. Estos derechos cubren diferentes aspectos de la vida: supervivencia, desarrollo, protección y participación. Conocer la diversidad de estos derechos nos ayuda a tener una visión integral de lo que necesitan los niños para desarrollarse plenamente en un ambiente seguro y estimulante.',
    options: [
      'Derecho a tener un nombre y una familia',
      'Derecho a ver televisión todo el día',
      'Derecho a la salud y atención médica',
      'Derecho a no bañarse nunca',
      'Derecho a jugar y descansar',
      'Derecho a la protección contra el maltrato'
    ],
    phase: 'classification',
    hint: 'Los derechos protegen cosas importantes para tu bienestar, no son caprichos.',
    correct_options: [0, 2, 4, 5],
    tutor_responses: {
      correct: [
        '¡Perfecto! Identificaste todos los derechos reales de los niños.',
        '¡Excelente! Distingues entre derechos y caprichos.',
        '¡Muy bien! Comprendes cuáles son los verdaderos derechos.'
      ],
      encouragement: [
        'Algunas opciones están correctas, sigue pensando.',
        'Vas bien, revisa cuáles son realmente importantes.'
      ],
      incorrect_attempt_1: [
        'Piensa en qué cosas son realmente importantes para tu bienestar.',
        'Los derechos protegen lo necesario para crecer sano y feliz, no son caprichos.'
      ],
      incorrect_attempt_2: [
        'Los derechos incluyen tener familia, salud, juego y protección.',
        'Ver TV todo el día o no bañarse no son derechos, son deseos que pueden ser malos para ti.'
      ]
    },
    step_config: {
      hints: [
        'Los derechos protegen cosas importantes para tu bienestar, no son caprichos.',
        'Piensa en qué necesitas para crecer sano, seguro y feliz.',
        'Las correctas son: nombre y familia, salud, jugar y protección.'
      ],
      expected_time: 75,
      concept_card_key: 'tipos_derechos',
      reflection_prompts: [
        '¿Por qué el juego es un derecho?',
        '¿Qué significa tener derecho a la protección?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'multiple_select',
      correct_options: [0, 2, 4, 5],
      evaluation_strategy: 'multiple_select',
      explanation: '¡Muy bien! Los derechos incluyen tener familia, salud, juego y protección. Ver TV todo el día o no bañarse no son derechos.',
      misconceptions: [
        {
          pattern: 'includes_1',
          misconception_key: 'confunde_derecho_con_entretenimiento_ilimitado',
          hint: 'Ver TV está bien, pero hacerlo todo el día no es bueno para tu salud ni tu aprendizaje.'
        },
        {
          pattern: 'includes_3',
          misconception_key: 'confunde_derecho_con_rechazo_higiene',
          hint: 'La higiene es importante para tu salud. Los derechos buscan tu bienestar, no descuidarlo.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  5: {
    type: 'matching',
    question: 'Relaciona cada derecho con su responsabilidad correspondiente:',
    context: 'Los derechos y las responsabilidades están íntimamente relacionados en una sociedad. Si bien tenemos derechos que deben ser respetados, también tenemos responsabilidades hacia nosotros mismos y hacia los demás. Comprender esta relación nos ayuda a construir una convivencia armoniosa donde todos podemos ejercer nuestros derechos mientras contribuimos al bienestar común.',
    left_items: [
      'Derecho a la educación',
      'Derecho a jugar',
      'Derecho a ser respetado',
      'Derecho a la salud'
    ],
    right_items: [
      'Cuidar mi salud y mi cuerpo',
      'Respetar a los demás',
      'Hacer mis tareas y estudiar',
      'Respetar los turnos de juego'
    ],
    phase: 'guided_application',
    hint: 'Piensa en qué debes hacer tú cuando tienes cada derecho.',
    correct_pairs: [
      [0, 2], // Derecho a la educación - Hacer mis tareas y estudiar
      [1, 3], // Derecho a jugar - Respetar los turnos de juego
      [2, 1], // Derecho a ser respetado - Respetar a los demás
      [3, 0]  // Derecho a la salud - Cuidar mi salud y mi cuerpo
    ],
    tutor_responses: {
      correct: [
        '¡Excelente! Relacionaste correctamente derechos y responsabilidades.',
        '¡Muy bien! Comprendes que los derechos van con responsabilidades.',
        '¡Perfecto! Entiendes el equilibrio entre derechos y deberes.'
      ],
      encouragement: [
        'Algunas relaciones están correctas, sigue intentándolo.',
        'Vas bien, revisa algunas conexiones.'
      ],
      incorrect_attempt_1: [
        'Piensa en qué debes hacer tú cuando tienes cada derecho.',
        'Los derechos vienen con responsabilidades relacionadas.'
      ],
      incorrect_attempt_2: [
        'Si tienes derecho a la educación, tu responsabilidad es estudiar.',
        'Si quieres que te respeten, tú también debes respetar a los demás.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en qué debes hacer tú cuando tienes cada derecho.',
        'Los derechos vienen con responsabilidades relacionadas.',
        'Ejemplo: derecho a educación va con responsabilidad de estudiar.'
      ],
      expected_time: 90,
      concept_card_key: 'derechos_responsabilidades',
      reflection_prompts: [
        '¿Por qué es importante cumplir con nuestras responsabilidades?',
        '¿Qué pasa si solo queremos derechos sin responsabilidades?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'matching',
      correct_pairs: [
        [0, 2],
        [1, 3],
        [2, 1],
        [3, 0]
      ],
      evaluation_strategy: 'matching',
      explanation: '¡Excelente! Has comprendido que cada derecho viene con una responsabilidad relacionada.',
      misconceptions: [
        {
          pattern: 'no_conecta_derecho_educacion_con_estudiar',
          misconception_key: 'no_ve_responsabilidad_en_educacion',
          hint: 'Si tienes derecho a aprender, tu responsabilidad es aprovechar esa oportunidad estudiando.'
        },
        {
          pattern: 'no_conecta_respeto_reciproco',
          misconception_key: 'no_entiende_reciprocidad_respeto',
          hint: 'El respeto funciona en ambas direcciones: si quieres que te respeten, debes respetar a otros.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  6: {
    type: 'ordering',
    question: 'Ordena estos pasos que seguirías si ves que no están respetando los derechos de un compañero:',
    context: 'Saber cómo actuar cuando presenciamos una situación donde no se respetan los derechos de alguien es crucial para construir una cultura de protección y solidaridad. Los niños pueden y deben ser defensores de los derechos, no solo de los propios sino también de los demás. Aprender estrategias apropiadas para intervenir ante injusticias forma parte de la educación ciudadana y el desarrollo moral.',
    items: [
      'Buscar ayuda de un adulto de confianza',
      'Observar qué está pasando',
      'Hablar con mi compañero para apoyarlo',
      'Explicar al adulto lo que vi'
    ],
    phase: 'transfer',
    hint: 'Piensa en qué harías primero: observar o actuar. Después, ¿hablas con tu amigo o buscas ayuda?',
    correct_order: [1, 2, 0, 3], // Observar → Apoyar al compañero → Buscar adulto → Explicar
    tutor_responses: {
      correct: [
        '¡Perfecto! Sabes cómo actuar para defender los derechos.',
        '¡Excelente! Entiendes la secuencia correcta de acciones.',
        '¡Muy bien! Así se defienden los derechos de forma adecuada.'
      ],
      encouragement: [
        'Algunos pasos están en orden, sigue intentándolo.',
        'Vas bien, piensa en qué viene primero.'
      ],
      incorrect_attempt_1: [
        'Piensa: ¿qué harías primero? ¿Observar o actuar sin saber qué pasa?',
        'Primero debes entender la situación antes de actuar.'
      ],
      incorrect_attempt_2: [
        'La secuencia es: observar, apoyar, buscar ayuda y explicar.',
        'Primero entiendes qué pasa, luego apoyas, después buscas un adulto.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en qué harías primero: observar o actuar.',
        'Después de observar, puedes apoyar a tu compañero.',
        'El orden correcto es: observar, apoyar, buscar adulto, explicar.'
      ],
      expected_time: 80,
      concept_card_key: 'defender_derechos',
      reflection_prompts: [
        '¿Por qué es importante buscar ayuda de un adulto?',
        '¿Qué puedes hacer para apoyar a tu compañero?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'ordering',
      correct_order: [1, 2, 0, 3],
      evaluation_strategy: 'ordering',
      explanation: '¡Muy bien! Primero observas, luego apoyas a tu compañero, después buscas un adulto y le explicas.',
      misconceptions: [
        {
          pattern: 'buscar_adulto_primero',
          misconception_key: 'omite_observacion_inicial',
          hint: 'Es importante primero entender qué está pasando antes de buscar ayuda.'
        },
        {
          pattern: 'no_incluye_apoyo_companero',
          misconception_key: 'no_ve_importancia_apoyo_emocional',
          hint: 'Es importante apoyar a tu compañero, decirle que no está solo.'
        }
      ]
    },
    cognitive_dimension: 'aplicacion'
  },

  7: {
    type: 'option',
    question: 'María dice: "Como tengo derecho a jugar, no tengo que hacer mis tareas". ¿Por qué está equivocada María?',
    context: 'Es común que existan malentendidos sobre cómo funcionan los derechos y las responsabilidades. Identificar estos errores conceptuales nos ayuda a tener una comprensión más precisa y equilibrada. Los derechos no eliminan las responsabilidades, sino que conviven con ellas. Comprender esta relación es esencial para una convivencia armoniosa y un desarrollo personal saludable.',
    options: [
      'Porque los derechos no eliminan las responsabilidades; hay tiempo para jugar y tiempo para estudiar',
      'Porque los niños no tienen derecho a jugar',
      'Porque María debe estudiar todo el día sin jugar',
      'Porque solo los adultos tienen responsabilidades'
    ],
    phase: 'error_analysis',
    hint: 'Piensa en si los derechos y las responsabilidades pueden existir juntos.',
    tutor_responses: {
      correct: [
        '¡Correcto! Los derechos y las responsabilidades van juntos.',
        '¡Muy bien! Entiendes que hay tiempo para todo.',
        '¡Exacto! Puedes jugar Y estudiar, ambos son importantes.'
      ],
      encouragement: [
        'Vas por buen camino, sigue pensando.',
        'Casi lo tienes, piensa en el equilibrio.'
      ],
      incorrect_attempt_1: [
        'Piensa en si los derechos y las responsabilidades pueden existir juntos.',
        'Los derechos no eliminan las responsabilidades. Puedes tener ambos.'
      ],
      incorrect_attempt_2: [
        'Tienes derecho a jugar Y responsabilidad de estudiar. Ambos son importantes.',
        'Hay tiempo para jugar y tiempo para hacer tareas. No son opuestos.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en si los derechos y las responsabilidades pueden existir juntos.',
        'Los derechos no eliminan las responsabilidades.',
        'La respuesta correcta es la primera: puedes jugar y estudiar.'
      ],
      expected_time: 60,
      concept_card_key: 'equilibrio_derechos_responsabilidades',
      reflection_prompts: [
        '¿Cómo puedes organizar tu tiempo para jugar y estudiar?',
        '¿Qué pasa si solo juegas y no estudias?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Correcto! Los derechos y las responsabilidades conviven. Puedes jugar y también debes hacer tus tareas.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'niega_derecho_juego',
          hint: 'Los niños SÍ tienen derecho a jugar. Es importante para su desarrollo.'
        },
        {
          pattern: '^2$',
          misconception_key: 'elimina_tiempo_juego',
          hint: 'No debes estudiar TODO el día. También necesitas jugar y descansar.'
        },
        {
          pattern: '^3$',
          misconception_key: 'cree_solo_adultos_responsabilidades',
          hint: 'Los niños también tienen responsabilidades apropiadas para su edad.'
        }
      ]
    },
    cognitive_dimension: 'analisis'
  },

  8: {
    type: 'keywords',
    question: '¿Qué fue lo más importante que aprendiste sobre los derechos y las responsabilidades?',
    context: 'La reflexión sobre el aprendizaje es fundamental para consolidar y profundizar el conocimiento adquirido. Al pensar sobre lo que hemos aprendido acerca de derechos y responsabilidades, integramos estos conceptos en nuestra forma de entender el mundo y las relaciones con los demás. Esta metacognición nos ayuda a ser ciudadanos más conscientes y participativos.',
    phase: 'metacognition',
    hint: 'Piensa en las ideas principales: ¿qué son los derechos? ¿Qué responsabilidades tienes?',
    tutor_responses: {
      correct: [
        '¡Excelente reflexión! Has comprendido lo esencial sobre derechos y responsabilidades.',
        '¡Muy bien! Entiendes la relación entre derechos y responsabilidades.',
        '¡Correcto! Comprendes que todos tenemos derechos y también deberes.'
      ],
      encouragement: [
        'Vas por buen camino, desarrolla más tu reflexión.',
        'Interesante, piensa en qué más aprendiste.'
      ],
      incorrect_attempt_1: [
        'Piensa en las ideas principales: ¿qué son los derechos? ¿Qué responsabilidades tienes?',
        '¿Qué derechos tienen los niños? ¿Cómo se relacionan con las responsabilidades?'
      ],
      incorrect_attempt_2: [
        'Aprendimos que todos tenemos derechos y también responsabilidades.',
        'Los derechos nos protegen y las responsabilidades nos ayudan a convivir.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en las ideas principales: ¿qué son los derechos? ¿Qué responsabilidades tienes?',
        'Los derechos y las responsabilidades van juntos en una sociedad.',
        'Reflexiona sobre la importancia de respetar los derechos de todos.'
      ],
      expected_time: 100,
      concept_card_key: 'reflexion_derechos',
      reflection_prompts: [
        '¿Cómo aplicarás lo aprendido en tu vida diaria?',
        '¿Qué harás para defender tus derechos y los de los demás?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'derechos', 'derecho',
        'responsabilidades', 'responsabilidad', 'deberes', 'deber',
        'respetar', 'respeto',
        'todos', 'todas', 'personas', 'niños',
        'importante', 'importantes', 'necesario',
        'educación', 'aprender', 'estudiar',
        'salud', 'cuidar',
        'familia', 'protección', 'proteger',
        'jugar', 'juego',
        'cumplir', 'hacer',
        'juntos', 'convivir', 'convivencia'
      ],
      evaluation_strategy: 'keywords',
      min_keywords: 3, // 25% de 12 keywords principales = 3
      explanation: '¡Excelente reflexión! Has comprendido que todos tenemos derechos que deben ser respetados y también responsabilidades.',
      misconceptions: [
        {
          pattern: '.*solo.*derechos.*no.*responsabilidades.*',
          misconception_key: 'separa_derechos_responsabilidades',
          hint: 'Los derechos y las responsabilidades van juntos. No podemos tener solo uno sin el otro.'
        },
        {
          pattern: '.*hacer.*quiera.*|.*capricho.*',
          misconception_key: 'confunde_derechos_con_libertad_absoluta',
          hint: 'Los derechos no significan hacer lo que quieras. También hay límites y responsabilidades.'
        }
      ]
    },
    cognitive_dimension: 'metacognicion'
  }
};

async function updateAndEnrichModule() {
  console.log('🎨 Actualizando módulo de Ciencias Sociales (Grados 1-3)...\n');
  console.log('📚 Nuevo tema: Derechos y Responsabilidades de los Niños\n');
  console.log(`📌 Módulo ID: ${MODULE_ID}\n`);

  // PASO 1: Actualizar el módulo con nuevo título y objetivo
  console.log('📝 Paso 1: Actualizando información del módulo...');
  
  const { error: moduleError } = await supabase
    .from('modules')
    .update({
      title: 'Derechos y Responsabilidades',
      learning_objective: 'Identifico y respeto mis derechos y los de otras personas, y entiendo que tengo responsabilidades en mi familia, escuela y comunidad.',
      core_concept: 'derechos_y_responsabilidades'
    })
    .eq('id', MODULE_ID);

  if (moduleError) {
    console.error('❌ Error actualizando módulo:', moduleError.message);
    return;
  }

  console.log(`✅ Módulo actualizado\n`);

  // PASO 2: Obtener los steps existentes del módulo
  console.log('📝 Paso 2: Obteniendo steps del módulo...');
  
  const { data: steps, error: stepsError } = await supabase
    .from('module_steps')
    .select('id, step_order')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  if (stepsError || !steps || steps.length === 0) {
    console.error('❌ Error obteniendo steps:', stepsError?.message || 'No se encontraron steps');
    return;
  }

  console.log(`✅ Se encontraron ${steps.length} steps\n`);

  if (steps.length !== 8) {
    console.warn(`⚠️  Advertencia: Se esperaban 8 steps pero se encontraron ${steps.length}`);
  }

  // PASO 3: Enriquecer cada step con contenido pedagógico
  console.log('📝 Paso 3: Enriqueciendo steps...\n');

  for (const step of steps) {
    const stepNumber = step.step_order;
    const enrichedContent = enrichedSteps[stepNumber];

    if (!enrichedContent) {
      console.warn(`   ⚠️  No hay contenido enriquecido para step ${stepNumber}`);
      continue;
    }

    console.log(`   Enriqueciendo step ${stepNumber} (${enrichedContent.phase})...`);

    const { error: updateError } = await supabase
      .from('module_steps')
      .update({ 
        enriched_content: enrichedContent,
        phase: enrichedContent.phase
      })
      .eq('id', step.id);

    if (updateError) {
      console.error(`   ❌ Error enriqueciendo step ${stepNumber}:`, updateError.message);
    } else {
      console.log(`   ✅ Step ${stepNumber} enriquecido`);
    }
  }

  console.log('\n🎉 ¡Módulo completo y listo!\n');
  console.log('📌 RESUMEN DEL MÓDULO:');
  console.log(`   ID: ${MODULE_ID}`);
  console.log('   Materia: Ciencias Sociales (social_studies)');
  console.log('   Grado: 1-3');
  console.log('   Título: "Derechos y Responsabilidades"');
  console.log(`   Steps: ${steps.length}/8 enriquecidos ✅`);
  console.log('   Tipos de preguntas: option, keywords, multiple_select, matching, ordering');
  console.log('   Keywords policies: Step 3 (30% = 3 keywords), Step 8 (25% = 3 keywords)');
  console.log('\n📝 Para probar el módulo:');
  console.log(`   http://localhost:5174/module/${MODULE_ID}`);
}

// Ejecutar el script
updateAndEnrichModule()
  .then(() => {
    console.log('\n✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
