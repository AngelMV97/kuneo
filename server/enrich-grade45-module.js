/**
 * Enriquecer módulo de grado 4-5: Nomadismo, Sedentarismo y Agricultura
 * ID: 604231bc-8ce4-45e7-932d-745d821dfeaa
 * 
 * Steps a enriquecer: 1, 2, 3, 4, 5, 6, 7, 8
 * Tipos variados: option, keywords, multiple_select, matching, ordering
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

// Contenido enriquecido para cada step
const enrichedSteps = {
  1: {
    type: 'option',
    question: '¿Qué crees que significa "nómada"?',
    context: 'Entender los diferentes estilos de vida en la prehistoria nos permite comprender cómo nuestros ancestros sobrevivieron y se adaptaron a diversos entornos durante miles de años. Estudiar estas formas de organización humana nos ayuda a valorar la diversidad cultural y a reflexionar sobre cómo las sociedades han evolucionado a lo largo del tiempo.',
    options: [
      'Personas que se mueven de un lugar a otro',
      'Personas que viven en casas grandes',
      'Personas que solo comen carne',
      'Personas que no tienen familia'
    ],
    phase: 'exploration',
    hint: 'Piensa en la palabra "moverse". ¿Qué opción habla de movimiento?',
    tutor_responses: {
      correct: [
        '¡Exacto! Nómada significa que se mueven de un lugar a otro.',
        '¡Muy bien! Los nómadas viajaban constantemente buscando alimento.',
        '¡Correcto! Entiendes el significado de ser nómada.'
      ],
      encouragement: [
        'Vas por buen camino, sigue pensando.',
        'Casi lo tienes, piensa en el movimiento.'
      ],
      incorrect_attempt_1: [
        'Piensa en la palabra "moverse". ¿Qué opción habla de movimiento?',
        'Recuerda que nómada tiene que ver con viajar de un lugar a otro.'
      ],
      incorrect_attempt_2: [
        'Los nómadas no se quedaban en un solo lugar, se movían constantemente.',
        'Piensa en personas que viajan todo el tiempo buscando alimento.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en la palabra "moverse". ¿Qué opción habla de movimiento?',
        'Los nómadas no se quedaban en un lugar, viajaban constantemente.',
        'La respuesta correcta es la primera opción: personas que se mueven.'
      ],
      expected_time: 45,
      concept_card_key: 'nomadismo_basico',
      reflection_prompts: [
        '¿Por qué crees que se movían de un lugar a otro?',
        '¿Qué necesitaban encontrar cuando viajaban?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'easy'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Muy bien! Los nómadas eran personas que se movían constantemente de un lugar a otro.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'confunde_nomada_con_sedentario',
          hint: 'Las casas grandes son más típicas de personas que se quedan en un lugar.'
        },
        {
          pattern: '^2$',
          misconception_key: 'confunde_nomadismo_con_dieta',
          hint: 'Los nómadas comían diferentes tipos de alimentos, no solo carne.'
        },
        {
          pattern: '^3$',
          misconception_key: 'confunde_nomadismo_con_organizacion_social',
          hint: 'Los nómadas sí tenían familias y vivían en grupos.'
        }
      ]
    },
    cognitive_dimension: 'exploracion'
  },

  2: {
    type: 'option',
    question: '¿Qué significa que un grupo humano sea nómada?',
    context: 'Durante la prehistoria, existieron diversas estrategias de supervivencia que permitieron a la humanidad prosperar en diferentes ecosistemas. Comprender estas estrategias nos ayuda a analizar cómo factores como el clima, los recursos disponibles y la organización social influyeron en el desarrollo de las primeras sociedades humanas.',
    options: [
      'Se mueven constantemente buscando alimento',
      'Viven siempre en el mismo lugar',
      'Solo comen plantas y frutas',
      'Construyen casas muy grandes'
    ],
    phase: 'representation',
    hint: 'Piensa en el significado de la palabra "moverse" y por qué lo hacían.',
    tutor_responses: {
      correct: [
        '¡Correcto! Los nómadas se movían buscando alimento.',
        '¡Muy bien! Entiendes que los nómadas viajaban constantemente.',
        '¡Exacto! Seguían a los animales para poder cazarlos.'
      ],
      encouragement: [
        'Vas por buen camino, piensa en el movimiento.',
        'Casi lo logras, sigue intentando.'
      ],
      incorrect_attempt_1: [
        'Piensa en el significado de la palabra "moverse" y por qué lo hacían.',
        'Recuerda que nómada significa que no se quedaban en un solo lugar.'
      ],
      incorrect_attempt_2: [
        'Los nómadas viajaban siguiendo a los animales que cazaban.',
        'Necesitaban moverse para encontrar alimento en diferentes lugares.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en el significado de la palabra "moverse" y por qué lo hacían.',
        'Los nómadas seguían a los animales para poder cazarlos.',
        'La respuesta correcta es: se mueven constantemente buscando alimento.'
      ],
      expected_time: 60,
      concept_card_key: 'nomadismo_definicion',
      reflection_prompts: [
        '¿Qué animales crees que cazaban?',
        '¿Qué plantas recolectaban para comer?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'easy'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Correcto! Los nómadas se movían constantemente de un lugar a otro siguiendo a los animales y buscando alimento.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'confunde_nomada_con_sedentario',
          hint: 'Si vivieran siempre en el mismo lugar, no serían nómadas. Piensa en lo opuesto a quedarse quieto.'
        },
        {
          pattern: '^2$',
          misconception_key: 'confunde_nomadismo_con_dieta',
          hint: 'Los nómadas comían tanto plantas como animales que cazaban. El nomadismo se refiere al movimiento, no a la comida.'
        },
        {
          pattern: '^3$',
          misconception_key: 'confunde_nomada_con_sedentario',
          hint: 'Los nómadas no construían casas permanentes porque se movían frecuentemente. Usaban refugios temporales.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  3: {
    type: 'keywords',
    question: 'Explica con tus palabras: ¿Por qué los grupos nómadas tenían que moverse constantemente?',
    context: 'La relación entre las poblaciones humanas y los recursos naturales disponibles ha sido fundamental a lo largo de la historia. Comprender cómo las sociedades prehistóricas gestionaban esta relación nos permite reflexionar sobre el equilibrio entre necesidades humanas y capacidad de los ecosistemas, un tema relevante también en la actualidad con los desafíos ambientales que enfrentamos.',
    phase: 'explanation',
    hint: 'Piensa en qué necesitaban los nómadas para sobrevivir y qué pasaba cuando se acababa en un lugar.',
    tutor_responses: {
      correct: [
        '¡Excelente explicación! Entiendes por qué debían moverse.',
        '¡Muy bien! Has comprendido que buscaban recursos.',
        '¡Correcto! Cuando se acababa la comida, debían irse a otro lugar.'
      ],
      encouragement: [
        'Vas por buen camino, desarrolla más tu idea.',
        'Interesante, piensa en qué más necesitaban.'
      ],
      incorrect_attempt_1: [
        'Piensa en qué necesitaban para sobrevivir: comida, agua...',
        '¿Qué pasaba cuando se terminaban los animales en un lugar?'
      ],
      incorrect_attempt_2: [
        'Los nómadas debían moverse para encontrar alimento y agua.',
        'Cuando los recursos se agotaban, tenían que buscar otro lugar.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en qué necesitaban para sobrevivir y qué pasaba cuando se acababa.',
        'Los nómadas buscaban alimento, agua y recursos naturales.',
        'Cuando se agotaban los recursos en un área, debían mudarse.'
      ],
      expected_time: 90,
      concept_card_key: 'recursos_nomadas',
      reflection_prompts: [
        '¿Qué pasaría si se quedaran en un solo lugar?',
        '¿Por qué era importante encontrar agua?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'alimento', 'comida', 'comer', 'alimentar',
        'animales', 'cazar', 'caza',
        'plantas', 'frutas', 'recolectar',
        'agua', 'tomar', 'beber',
        'acabar', 'agotar', 'terminar', 'buscar'
      ],
      evaluation_strategy: 'keywords',
      explanation: '¡Muy bien! Los nómadas se movían para buscar alimento, agua y recursos cuando se agotaban en un lugar.',
      misconceptions: [
        {
          pattern: '.*solo.*diversión.*|.*pasear.*|.*viajar.*',
          misconception_key: 'confunde_nomadismo_con_recreacion',
          hint: 'No se movían por diversión, sino por necesidad de encontrar alimento y agua.'
        },
        {
          pattern: '.*perezoso.*|.*no.*trabajar.*',
          misconception_key: 'juicio_moral_nomadismo',
          hint: 'Ser nómada no era cuestión de pereza, era la mejor forma de sobrevivir en ese tiempo.'
        }
      ]
    },
    cognitive_dimension: 'razonamiento'
  },

  4: {
    type: 'multiple_select',
    question: 'Marca TODAS las actividades que realizaban los grupos nómadas:',
    context: 'Las sociedades prehistóricas desarrollaron diferentes sistemas económicos para satisfacer sus necesidades básicas de supervivencia. Analizar estas formas de obtención de recursos nos permite comprender cómo el entorno y la tecnología disponible influyen en la organización social y económica de una comunidad, conceptos relevantes para entender también las sociedades actuales.',
    options: [
      'Cazar animales salvajes',
      'Cultivar maíz en campos',
      'Recolectar frutas y raíces',
      'Criar vacas y gallinas',
      'Pescar en ríos',
      'Construir ciudades grandes'
    ],
    phase: 'representation',
    hint: 'Los nómadas obtenían comida de la naturaleza, no la producían. Piensa en qué actividades no requieren quedarse en un solo lugar.',
    correct_options: [0, 2, 4],
    tutor_responses: {
      correct: [
        '¡Perfecto! Identificaste todas las actividades de los nómadas.',
        '¡Excelente! Cazar, recolectar y pescar eran sus actividades.',
        '¡Muy bien! Entiendes cómo obtenían su alimento.'
      ],
      encouragement: [
        'Algunas están correctas, sigue pensando.',
        'Vas bien, revisa algunas opciones.'
      ],
      incorrect_attempt_1: [
        'Piensa en actividades que no requieren quedarse en un lugar fijo.',
        '¿Qué actividades puedes hacer mientras te mueves de un lugar a otro?'
      ],
      incorrect_attempt_2: [
        'Los nómadas cazaban, recolectaban y pescaban. No cultivaban ni criaban animales.',
        'Cultivar y criar animales requiere quedarse en un lugar permanente.'
      ]
    },
    step_config: {
      hints: [
        'Los nómadas obtenían comida de la naturaleza, no la producían.',
        'Piensa en actividades que puedes hacer mientras viajas.',
        'Las correctas son: cazar, recolectar frutas y pescar.'
      ],
      expected_time: 75,
      concept_card_key: 'actividades_nomadas',
      reflection_prompts: [
        '¿Por qué no podían cultivar si se movían constantemente?',
        '¿Qué herramientas usaban para cazar?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'multiple_select',
      correct_options: [0, 2, 4],
      evaluation_strategy: 'multiple_select',
      explanation: '¡Muy bien! Los nómadas cazaban, recolectaban y pescaban. No cultivaban ni criaban animales porque eso requiere quedarse en un lugar fijo.',
      misconceptions: [
        {
          pattern: 'includes_1',
          misconception_key: 'confunde_nomadismo_con_agricultura',
          hint: 'Cultivar requiere quedarse en un lugar para cuidar las plantas. Los nómadas se movían constantemente.'
        },
        {
          pattern: 'includes_3',
          misconception_key: 'confunde_nomadismo_con_ganaderia',
          hint: 'Criar animales domésticos vino después, cuando las personas se volvieron sedentarias.'
        },
        {
          pattern: 'includes_5',
          misconception_key: 'confunde_escala_nomada',
          hint: 'Los grupos nómadas eran pequeños y no construían ciudades. Las ciudades aparecieron con el sedentarismo.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  5: {
    type: 'matching',
    question: 'Relaciona cada forma de vida con su característica principal:',
    context: 'A lo largo de la historia humana han existido diferentes formas de organización social y económica, cada una con características particulares adaptadas a su contexto. Comprender estas diferencias nos permite analizar cómo las innovaciones tecnológicas y los cambios en el entorno pueden transformar radicalmente las sociedades, un proceso que continúa ocurriendo en el mundo actual.',
    left_items: [
      'Vida nómada',
      'Descubrimiento de la agricultura',
      'Vida sedentaria',
      'Grupos cazadores-recolectores'
    ],
    right_items: [
      'Se quedan en un lugar fijo',
      'Cultivan plantas y cosechan',
      'Se mueven siguiendo animales',
      'Buscan alimento en la naturaleza'
    ],
    phase: 'connection',
    hint: 'Piensa en las diferencias entre moverse y quedarse quieto, y en cómo la agricultura cambió todo.',
    correct_pairs: [
      [0, 2], // Vida nómada - Se mueven siguiendo animales
      [1, 1], // Descubrimiento de la agricultura - Cultivan plantas
      [2, 0], // Vida sedentaria - Se quedan en un lugar fijo
      [3, 3]  // Grupos cazadores-recolectores - Buscan alimento en la naturaleza
    ],
    tutor_responses: {
      correct: [
        '¡Excelente! Relacionaste correctamente todas las formas de vida.',
        '¡Muy bien! Comprendes las diferencias entre nómada y sedentario.',
        '¡Perfecto! Entiendes el papel de la agricultura en el cambio.'
      ],
      encouragement: [
        'Algunas relaciones están correctas, sigue intentándolo.',
        'Vas bien, revisa algunas conexiones.'
      ],
      incorrect_attempt_1: [
        'Piensa en las diferencias entre moverse y quedarse quieto.',
        '¿Qué significa ser nómada? ¿Y sedentario?'
      ],
      incorrect_attempt_2: [
        'Nómada significa que se mueven, sedentario que se quedan en un lugar.',
        'La agricultura permitió a las personas quedarse en un solo lugar.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en las diferencias entre moverse y quedarse quieto.',
        'Los nómadas se mueven, los sedentarios se quedan en un lugar.',
        'La agricultura permitió cultivar plantas y quedarse en un lugar fijo.'
      ],
      expected_time: 90,
      concept_card_key: 'nomada_vs_sedentario',
      reflection_prompts: [
        '¿Por qué la agricultura permitió quedarse en un lugar?',
        '¿Qué ventajas tenía ser sedentario?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'matching',
      correct_pairs: [
        [0, 2],
        [1, 1],
        [2, 0],
        [3, 3]
      ],
      evaluation_strategy: 'matching',
      explanation: '¡Excelente! Has comprendido las diferencias entre la vida nómada y sedentaria, y el papel de la agricultura.',
      misconceptions: [
        {
          pattern: 'nomada_con_quedarse',
          misconception_key: 'confunde_nomada_sedentario',
          hint: 'Nómada significa que se mueven, sedentario significa que se quedan en un lugar.'
        },
        {
          pattern: 'agricultura_con_movimiento',
          misconception_key: 'confunde_agricultura_con_nomadismo',
          hint: 'Para cultivar plantas necesitas quedarte en un lugar para cuidarlas y cosecharlas.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  6: {
    type: 'ordering',
    question: 'Ordena cronológicamente estos eventos en la historia humana:',
    context: 'La historia humana ha seguido procesos de transformación donde las innovaciones tecnológicas, los cambios organizacionales y las adaptaciones ambientales se influyeron mutuamente. Comprender la secuencia de estos grandes cambios nos ayuda a analizar cómo las sociedades evolucionan y cómo ciertos desarrollos hacen posible otros avances, un patrón que observamos también en la historia reciente.',
    items: [
      'Grupos nómadas cazan y recolectan',
      'Descubrimiento de la agricultura',
      'Formación de las primeras aldeas',
      'Desarrollo de sociedades complejas',
      'Domesticación de animales'
    ],
    phase: 'integration',
    hint: 'Piensa en el orden: primero los humanos se movían, luego aprendieron a cultivar, después se establecieron.',
    correct_order: [0, 1, 4, 2, 3], // Nomadismo → Agricultura → Domesticación → Aldeas → Sociedades complejas
    tutor_responses: {
      correct: [
        '¡Perfecto! Ordenaste correctamente la historia humana.',
        '¡Excelente! Comprendes el orden de los grandes cambios.',
        '¡Muy bien! Del nomadismo a las sociedades agrícolas.'
      ],
      encouragement: [
        'Algunos elementos están en orden correcto, sigue intentando.',
        'Vas bien, revisa el orden de algunos eventos.'
      ],
      incorrect_attempt_1: [
        'Piensa en el orden: primero cazaban, luego cultivaron, después formaron aldeas.',
        '¿Qué tuvieron que hacer antes de poder quedarse en un lugar?'
      ],
      incorrect_attempt_2: [
        'La agricultura fue lo que permitió formar aldeas permanentes.',
        'Primero descubrieron cómo cultivar plantas, luego domesticaron animales.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en el orden: primero se movían, luego cultivaron, después formaron aldeas.',
        'La agricultura permitió quedarse en un lugar y formar aldeas.',
        'El orden correcto es: nómadas, agricultura, domesticación, aldeas, sociedades complejas.'
      ],
      expected_time: 90,
      concept_card_key: 'evolucion_humana',
      reflection_prompts: [
        '¿Por qué la agricultura tuvo que venir antes que las aldeas?',
        '¿Qué permitió el desarrollo de sociedades complejas?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'ordering',
      correct_order: [0, 1, 4, 2, 3],
      evaluation_strategy: 'ordering',
      explanation: '¡Perfecto! Has ordenado correctamente los grandes cambios en la historia humana: del nomadismo a las sociedades agrícolas.',
      misconceptions: [
        {
          pattern: 'agricultura_despues_aldeas',
          misconception_key: 'orden_incorrecto_agricultura',
          hint: 'La agricultura fue lo que permitió formar aldeas permanentes, no al revés.'
        },
        {
          pattern: 'domesticacion_antes_agricultura',
          misconception_key: 'orden_incorrecto_domesticacion',
          hint: 'Primero aprendieron a cultivar plantas, luego a domesticar animales.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  7: {
    type: 'option',
    question: 'Juan dice: "Los nómadas eran tontos porque no sabían cultivar". ¿Qué le responderías?',
    context: 'Analizar sociedades del pasado requiere evitar juicios basados en nuestros conocimientos y valores actuales. Cada época y cultura ha desarrollado formas de vida adaptadas a su contexto particular, con sus propias complejidades y logros. Reconocer esta diversidad nos ayuda a desarrollar pensamiento crítico, respeto por diferentes culturas y capacidad para cuestionar estereotipos históricos.',
    options: [
      'No tenía razón: eran inteligentes, solo vivían de manera diferente',
      'Tiene razón: deberían haber cultivado desde el inicio',
      'Los nómadas no eran humanos verdaderos',
      'Los nómadas solo comían carne cruda'
    ],
    phase: 'reflection',
    hint: 'La inteligencia no depende de la época ni de la forma de vida. Piensa en que adaptarse al entorno requiere mucha inteligencia.',
    tutor_responses: {
      correct: [
        '¡Correcto! Los nómadas eran tan inteligentes como nosotros.',
        '¡Muy bien! No podemos juzgar a personas del pasado con nuestros conocimientos.',
        '¡Exacto! Vivían de manera diferente, no eran menos inteligentes.'
      ],
      encouragement: [
        'Vas por buen camino, piensa en cómo sobrevivían.',
        'Casi lo tienes, reflexiona sobre la inteligencia.'
      ],
      incorrect_attempt_1: [
        'Piensa: ¿ser diferente significa ser menos inteligente?',
        'Los nómadas tenían que ser muy listos para sobrevivir.'
      ],
      incorrect_attempt_2: [
        'No podemos juzgar a personas del pasado con nuestros conocimientos actuales.',
        'Adaptarse al entorno y sobrevivir requiere mucha inteligencia.'
      ]
    },
    step_config: {
      hints: [
        'La inteligencia no depende de la época ni de la forma de vida.',
        'Los nómadas eran muy inteligentes: conocían su entorno perfectamente.',
        'No podemos juzgar a personas del pasado con nuestros conocimientos actuales.'
      ],
      expected_time: 75,
      concept_card_key: 'respeto_historico',
      reflection_prompts: [
        '¿Por qué no es justo juzgar a personas del pasado?',
        '¿Qué habilidades tenían los nómadas?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Correcto! Los nómadas eran tan inteligentes como nosotros, solo vivían adaptados a su entorno de manera diferente.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'presentismo_historico',
          hint: 'No podemos juzgar a las personas del pasado con nuestros conocimientos actuales. La agricultura se descubrió gradualmente.'
        },
        {
          pattern: '^2$',
          misconception_key: 'deshumanizacion_grupos_antiguos',
          hint: 'Los nómadas eran humanos igual que nosotros, con la misma capacidad de pensar y sentir.'
        },
        {
          pattern: '^3$',
          misconception_key: 'estereotipo_nomadas',
          hint: 'Los nómadas cocinaban sus alimentos y tenían técnicas sofisticadas de preparación.'
        }
      ]
    },
    cognitive_dimension: 'evaluacion'
  },

  8: {
    type: 'keywords',
    question: '¿Por qué el descubrimiento de la agricultura fue tan importante para la humanidad? Explica con tus propias palabras.',
    context: 'Ciertos descubrimientos tecnológicos han generado transformaciones profundas en la historia humana, modificando no solo aspectos económicos sino también la organización social, cultural y política de las sociedades. Reflexionar sobre estos cambios nos ayuda a comprender cómo las innovaciones pueden tener consecuencias múltiples y de largo alcance, tanto positivas como desafiantes, en el desarrollo de la humanidad.',
    phase: 'reflection',
    hint: 'Piensa en: ¿qué permitió hacer la agricultura? ¿Cómo cambió la vida de las personas? ¿Qué cosas nuevas pudieron hacer?',
    tutor_responses: {
      correct: [
        '¡Excelente reflexión! Comprendes la importancia de la agricultura.',
        '¡Muy bien! Entiendes cómo cambió la vida humana.',
        '¡Correcto! La agricultura transformó completamente nuestra historia.'
      ],
      encouragement: [
        'Vas por buen camino, desarrolla más tu explicación.',
        'Interesante idea, piensa en más cambios.'
      ],
      incorrect_attempt_1: [
        'Piensa en: ¿qué permitió hacer la agricultura?',
        '¿Cómo cambió la vida cuando las personas pudieron cultivar su alimento?'
      ],
      incorrect_attempt_2: [
        'La agricultura permitió quedarse en un lugar y formar comunidades.',
        'Piensa en cómo pudieron asegurar su alimento sin tener que moverse.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en: ¿qué permitió hacer la agricultura? ¿Cómo cambió la vida?',
        'La agricultura permitió quedarse en un lugar y formar aldeas.',
        'Pudieron asegurar su alimento, formar comunidades permanentes y desarrollar sociedades.'
      ],
      expected_time: 120,
      concept_card_key: 'importancia_agricultura',
      reflection_prompts: [
        '¿Qué otros cambios trajo la agricultura además de la comida?',
        '¿Cómo crees que es la vida de los pocos grupos nómadas que aún existen?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'sedentario', 'sedentarios', 'sedentaria', 'quedar', 'quedarse', 'establecer',
        'aldea', 'aldeas', 'comunidad', 'comunidades',
        'alimento', 'alimentos', 'comida', 'cosechar', 'cultivar',
        'permanecer', 'permanente', 'fijo', 'fija'
      ],
      evaluation_strategy: 'keywords',
      explanation: '¡Muy bien! Has comprendido que la agricultura permitió a las personas establecerse en un lugar, formar comunidades y asegurar su alimento.',
      misconceptions: [
        {
          pattern: '.*solo.*comer.*',
          misconception_key: 'reduccion_a_alimentacion',
          hint: 'La agricultura no solo cambió qué comían, sino toda su forma de vida. Piensa en más cambios.'
        },
        {
          pattern: '.*facil.*|.*perezoso.*',
          misconception_key: 'juicio_moral_agricultura',
          hint: 'No fue cuestión de ser más trabajadores o perezosos, sino un gran descubrimiento tecnológico.'
        }
      ]
    },
    cognitive_dimension: 'evaluacion'
  }
};

async function enrichModule() {
  console.log('🎨 Enriqueciendo módulo de grado 4-5: Nomadismo y Sedentarismo\n');
  console.log('=' .repeat(80));

  try {
    const stepsToEnrich = [1, 2, 3, 4, 5, 6, 7, 8];
    
    for (const stepNumber of stepsToEnrich) {
      console.log(`\n📝 Enriqueciendo Step ${stepNumber}...`);
      
      const enrichedContent = enrichedSteps[stepNumber];
      
      // Obtener ID del step
      const { data: step, error: stepError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('id')
        .eq('module_id', MODULE_ID)
        .eq('step_order', stepNumber)
        .single();

      if (stepError) {
        console.log(`   ❌ Error obteniendo step ${stepNumber}: ${stepError.message}`);
        continue;
      }

      // Actualizar con contenido enriquecido
      const { error: updateError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .update({ enriched_content: enrichedContent })
        .eq('id', step.id);

      if (updateError) {
        console.log(`   ❌ Error actualizando: ${updateError.message}`);
      } else {
        console.log(`   ✅ Step ${stepNumber} enriquecido (tipo: ${enrichedContent.type})`);
        console.log(`      Pregunta: ${enrichedContent.question.substring(0, 60)}...`);
      }
    }

    console.log('\n\n' + '=' .repeat(80));
    console.log('📊 RESUMEN DE ENRIQUECIMIENTO\n');
    
    const { data: allSteps } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', MODULE_ID);

    const enriched = allSteps.filter(s => s.enriched_content !== null).length;
    
    console.log(`Total steps: ${allSteps.length}`);
    console.log(`Enriquecidos: ${enriched}`);
    console.log(`Progreso: ${Math.round((enriched / allSteps.length) * 100)}%`);
    
    if (enriched === allSteps.length) {
      console.log('\n✨ ¡Módulo 100% completamente enriquecido!');
      console.log('\n📋 Tipos de preguntas incluidos:');
      console.log('   • option (múltiple selección)');
      console.log('   • keywords (respuesta abierta)');
      console.log('   • multiple_select (varias correctas)');
      console.log('   • matching (relacionar parejas)');
      console.log('   • ordering (ordenar cronológicamente)');
      console.log('\n💡 Reinicia el servidor para cargar el módulo en caché.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enrichModule()
  .then(() => {
    console.log('\n\n✅ Enriquecimiento completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
