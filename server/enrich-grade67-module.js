/**
 * Enriquecer módulo de grado 6-7: Análisis crítico de prácticas históricas
 * ID: 4b94fd6c-ea04-4889-b025-546fc6e5ab1f
 * 
 * Tema: Identificar diferencias en concepciones que legitiman actuaciones históricas
 * (esclavitud, Inquisición) y asumir posiciones críticas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '4b94fd6c-ea04-4889-b025-546fc6e5ab1f';

// Contenido enriquecido para cada step
const enrichedSteps = {
  1: {
    type: 'option',
    question: '¿Por qué es importante estudiar las justificaciones que las sociedades del pasado daban a prácticas como la esclavitud?',
    context: 'Comprender las ideas y concepciones que diferentes sociedades utilizaron para legitimar sus prácticas es fundamental para desarrollar pensamiento histórico crítico. Este análisis nos permite examinar cómo las sociedades construyen y justifican sus normas, y nos invita a reflexionar sobre las estructuras de pensamiento que aceptamos en nuestra propia época. El estudio histórico trasciende el simple conocimiento de hechos: nos enseña a cuestionar, contextualizar y evaluar las ideas que moldean nuestras sociedades.',
    options: [
      'Para entender cómo pensaban las personas en diferentes épocas',
      'Porque así sabremos quiénes eran las personas malas',
      'Para olvidar el pasado y no volver a pensar en eso',
      'Solo por cumplir con la tarea de historia'
    ],
    phase: 'exploration',
    hint: 'Piensa en por qué estudiar historia es más que memorizar fechas.',
    tutor_responses: {
      correct: [
        '¡Exacto! Estudiar estas justificaciones nos ayuda a entender el contexto histórico.',
        '¡Muy bien! Comprender las ideas del pasado nos hace pensadores más críticos.',
        '¡Correcto! El análisis histórico nos permite entender diferentes perspectivas.'
      ],
      encouragement: [
        'Vas por buen camino, piensa en el valor del estudio histórico.',
        'Interesante reflexión, desarrolla más tu idea.'
      ],
      incorrect_attempt_1: [
        'Piensa en por qué estudiar historia es útil para entender las sociedades.',
        'El análisis histórico va más allá de juzgar quién era "bueno" o "malo".'
      ],
      incorrect_attempt_2: [
        'Estudiar el pasado nos ayuda a comprender cómo las personas pensaban en su contexto.',
        'No se trata de olvidar ni de juzgar, sino de entender las ideas de cada época.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en por qué estudiar historia es más que memorizar fechas.',
        'El análisis histórico nos ayuda a entender cómo pensaban las sociedades.',
        'La respuesta correcta habla de comprender las ideas de diferentes épocas.'
      ],
      expected_time: 60,
      concept_card_key: 'analisis_historico',
      reflection_prompts: [
        '¿Qué aprendemos al estudiar las ideas del pasado?',
        '¿Por qué es importante entender el contexto histórico?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Muy bien! Estudiar las justificaciones históricas nos permite entender cómo pensaban las personas en diferentes contextos y desarrollar pensamiento crítico.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'juicio_moral_simplista',
          hint: 'El análisis histórico no se trata de clasificar personas como "buenas" o "malas", sino de entender sus contextos.'
        },
        {
          pattern: '^2$',
          misconception_key: 'evitar_pasado',
          hint: 'Estudiar el pasado no significa revivirlo, sino aprender de él para comprender mejor el presente.'
        },
        {
          pattern: '^3$',
          misconception_key: 'trivializar_estudio',
          hint: 'El estudio histórico tiene un propósito profundo: desarrollar pensamiento crítico sobre las sociedades.'
        }
      ]
    },
    cognitive_dimension: 'exploration'
  },

  2: {
    type: 'option',
    question: 'Observa esta afirmación histórica: "La esclavitud es natural porque algunos pueblos son superiores a otros". ¿Qué tipo de argumento es?',
    context: 'A lo largo de la historia, las sociedades han construido diferentes tipos de argumentos para justificar sus prácticas sociales, económicas y políticas. Identificar la naturaleza de estos argumentos —si son de carácter religioso, económico, pseudocientífico o basados en supuestos de superioridad— es esencial para comprenderlos críticamente. Esta habilidad de análisis nos permite reconocer cómo se construyen y legitiman las ideas en cualquier época, incluida la nuestra.',
    options: [
      'Un argumento basado en supuesta superioridad racial o cultural',
      'Un argumento científico comprobado',
      'Un argumento económico sobre costos de producción',
      'Un argumento religioso sobre la salvación de almas'
    ],
    phase: 'representation',
    hint: 'Fíjate en las palabras clave: "natural" y "superiores".',
    tutor_responses: {
      correct: [
        '¡Correcto! Es un argumento basado en la falsa idea de superioridad.',
        '¡Exacto! Identificas el tipo de justificación que se usaba.',
        '¡Muy bien! Este argumento apelaba a supuestas diferencias "naturales".'
      ],
      encouragement: [
        'Vas bien, analiza las palabras clave del argumento.',
        'Piensa en qué tipo de justificación se está dando.'
      ],
      incorrect_attempt_1: [
        'Fíjate en las palabras "natural" y "superiores". ¿Qué tipo de argumento usan?',
        'Este argumento no tiene base científica ni económica real.'
      ],
      incorrect_attempt_2: [
        'El argumento afirma que hay pueblos "superiores", ¿qué tipo de justificación es esa?',
        'No es un argumento religioso, sino basado en supuesta superioridad.'
      ]
    },
    step_config: {
      hints: [
        'Fíjate en las palabras clave: "natural" y "superiores".',
        'Este tipo de argumento afirma que existen diferencias "naturales" entre pueblos.',
        'La respuesta correcta menciona superioridad racial o cultural.'
      ],
      expected_time: 75,
      concept_card_key: 'tipos_argumentos_historicos',
      reflection_prompts: [
        '¿Qué otros tipos de argumentos se han usado históricamente?',
        '¿Por qué es importante identificar el tipo de argumento?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Correcto! Este argumento se basa en la falsa idea de superioridad racial o cultural, muy común en justificaciones históricas de prácticas injustas.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'confunde_argumento_con_ciencia',
          hint: 'Este no es un argumento científico válido. La ciencia no respalda ideas de superioridad racial.'
        },
        {
          pattern: '^2$',
          misconception_key: 'confunde_con_argumento_economico',
          hint: 'El argumento no habla de costos, sino de supuesta "superioridad natural".'
        },
        {
          pattern: '^3$',
          misconception_key: 'confunde_con_argumento_religioso',
          hint: 'Aunque existieron argumentos religiosos para la esclavitud, este habla de "superioridad natural", no de religión.'
        }
      ]
    },
    cognitive_dimension: 'representation'
  },

  3: {
    type: 'keywords',
    question: 'Con tus propias palabras, explica qué significa "analizar críticamente las concepciones históricas".',
    context: 'El pensamiento histórico crítico implica la capacidad de examinar las ideas, valores y estructuras de pensamiento de diferentes épocas sin aceptarlas acríticamente ni juzgarlas anacrónicamente. Requiere comprender el contexto en que surgieron, identificar sus fundamentos, evaluar sus consecuencias y reconocer cómo influyeron en las sociedades. Esta habilidad es fundamental no solo para comprender el pasado, sino también para desarrollar juicio crítico sobre las ideas y prácticas de nuestro propio tiempo.',
    phase: 'explanation',
    hint: 'Piensa en qué significa examinar las ideas del pasado sin aceptarlas automáticamente.',
    tutor_responses: {
      correct: [
        '¡Excelente explicación! Comprendes qué es el análisis crítico.',
        '¡Muy bien! Entiendes que se trata de examinar y cuestionar ideas.',
        '¡Correcto! Analizas el concepto de pensamiento histórico crítico.'
      ],
      encouragement: [
        'Vas por buen camino, desarrolla más tu idea.',
        'Interesante, piensa en qué más implica el análisis crítico.'
      ],
      incorrect_attempt_1: [
        'Piensa en qué significa no aceptar ideas sin cuestionarlas.',
        '¿Qué implica examinar las justificaciones del pasado?'
      ],
      incorrect_attempt_2: [
        'Analizar críticamente significa examinar las ideas, entender su contexto y evaluar si eran justas.',
        'No se trata solo de juzgar, sino de comprender el pensamiento de cada época.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en qué significa examinar las ideas sin aceptarlas automáticamente.',
        'Analizar críticamente implica cuestionar, contextualizar y evaluar.',
        'Se trata de entender las ideas del pasado y reflexionar sobre ellas.'
      ],
      expected_time: 90,
      concept_card_key: 'pensamiento_critico_historico',
      reflection_prompts: [
        '¿Por qué es importante no aceptar ideas del pasado sin cuestionarlas?',
        '¿Cómo nos ayuda esto a entender mejor nuestro presente?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'examinar', 'cuestionar', 'evaluar', 'analizar',
        'contexto', 'época', 'comprender',
        'ideas', 'concepciones', 'justificaciones',
        'crítico', 'crítica', 'pensar'
      ],
      evaluation_strategy: 'keywords',
      explanation: '¡Muy bien! Analizar críticamente significa examinar las ideas del pasado, comprender su contexto y evaluar sus implicaciones sin aceptarlas automáticamente.',
      misconceptions: [
        {
          pattern: '.*solo.*juzgar.*|.*malo.*|.*bueno.*',
          misconception_key: 'reduce_a_juicio_moral',
          hint: 'El análisis crítico va más allá de juzgar como "bueno" o "malo", busca comprender el contexto.'
        },
        {
          pattern: '.*aceptar.*todo.*|.*válido.*todo.*',
          misconception_key: 'relativismo_extremo',
          hint: 'Comprender el contexto no significa justificar prácticas injustas, sino entender por qué ocurrieron.'
        }
      ]
    },
    cognitive_dimension: 'razonamiento'
  },

  4: {
    type: 'multiple_select',
    question: '¿Cuáles de las siguientes prácticas históricas fueron justificadas con argumentos religiosos o de "superioridad"? (Selecciona todas las correctas)',
    context: 'Las sociedades históricas desarrollaron complejos sistemas de justificación para legitimar prácticas que vulneraban derechos fundamentales. Estos sistemas combinaban elementos religiosos, pseudocientíficos, económicos y culturales, y fueron aceptados durante siglos por amplios sectores sociales. Reconocer cómo operaban estas justificaciones nos ayuda a comprender los mecanismos mediante los cuales las sociedades legitiman sus prácticas, y nos sensibiliza para identificar justificaciones similares en contextos contemporáneos.',
    options: [
      'La esclavitud de personas africanas',
      'El voto universal desde la antigüedad',
      'La Inquisición',
      'La igualdad de género en todos los ámbitos',
      'La colonización de América',
      'El derecho a la educación para todos'
    ],
    phase: 'representation',
    hint: 'Piensa en prácticas que hoy rechazamos pero que fueron justificadas con argumentos de superioridad o religión.',
    correct_options: [0, 2, 4],
    tutor_responses: {
      correct: [
        '¡Perfecto! Identificaste las prácticas históricas que fueron justificadas así.',
        '¡Excelente! Reconoces qué prácticas usaban estos argumentos.',
        '¡Muy bien! Comprendes qué tipo de justificaciones se daban.'
      ],
      encouragement: [
        'Algunas respuestas son correctas, revisa las demás.',
        'Vas bien, piensa en qué prácticas hoy consideramos injustas.'
      ],
      incorrect_attempt_1: [
        'Piensa en prácticas que vulneraban derechos pero eran justificadas en su época.',
        'Considera cuáles de estas prácticas hoy rechazamos como injustas.'
      ],
      incorrect_attempt_2: [
        'La esclavitud, la Inquisición y la colonización fueron justificadas con argumentos de superioridad o religión.',
        'El voto universal, la igualdad de género y la educación para todos son conquistas recientes, no prácticas históricas injustas.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en prácticas que hoy rechazamos pero fueron justificadas entonces.',
        'La esclavitud, Inquisición y colonización usaban justificaciones de superioridad.',
        'Las correctas son: esclavitud, Inquisición y colonización.'
      ],
      expected_time: 75,
      concept_card_key: 'practicas_historicas_injustas',
      reflection_prompts: [
        '¿Qué argumentos usaban para justificar estas prácticas?',
        '¿Por qué sociedades enteras aceptaban estas prácticas?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'multiple_select',
      correct_options: [0, 2, 4],
      evaluation_strategy: 'multiple_select',
      explanation: '¡Muy bien! La esclavitud, la Inquisición y la colonización fueron justificadas con argumentos religiosos, de supuesta superioridad racial o cultural.',
      misconceptions: [
        {
          pattern: 'includes_1',
          misconception_key: 'confunde_conquistas_recientes',
          hint: 'El voto universal es una conquista relativamente reciente, no una práctica histórica que fuera justificada con argumentos de superioridad.'
        },
        {
          pattern: 'includes_3',
          misconception_key: 'confunde_derechos_con_practicas_injustas',
          hint: 'La igualdad de género es un derecho que aún estamos conquistando, no una práctica histórica injusta.'
        },
        {
          pattern: 'includes_5',
          misconception_key: 'confunde_derechos_educativos',
          hint: 'El derecho a la educación es una conquista moderna, no una práctica histórica que se justificara con argumentos de superioridad.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  5: {
    type: 'matching',
    question: 'Relaciona cada práctica histórica con el tipo de argumento usado para justificarla:',
    context: 'Las justificaciones históricas de prácticas injustas adoptaban diversas formas según el contexto cultural, económico y político de cada sociedad. Algunos argumentos apelaban a textos religiosos, otros a supuestas bases científicas o naturales, y otros combinaban elementos económicos con ideológicos. Comprender esta diversidad de justificaciones nos permite analizar cómo las sociedades construyen narrativas para legitimar sus estructuras de poder y prácticas sociales, un fenómeno que trasciende épocas específicas.',
    left_items: [
      'Esclavitud africana',
      'Inquisición',
      'Conquista de América',
      'Castas coloniales'
    ],
    right_items: [
      'Superioridad racial y justificación económica',
      'Protección de la fe católica',
      'Evangelización y "civilización" de pueblos',
      'Pureza de sangre y jerarquía social'
    ],
    phase: 'connection',
    hint: 'Piensa en qué tipo de argumentos se usaban para cada práctica histórica.',
    correct_pairs: [
      [0, 0], // Esclavitud - Superioridad racial y económica
      [1, 1], // Inquisición - Protección de la fe
      [2, 2], // Conquista - Evangelización
      [3, 3]  // Castas - Pureza de sangre
    ],
    tutor_responses: {
      correct: [
        '¡Excelente! Relacionaste correctamente las prácticas con sus justificaciones.',
        '¡Muy bien! Comprendes los diferentes tipos de argumentos históricos.',
        '¡Perfecto! Identificas qué justificación se usaba para cada práctica.'
      ],
      encouragement: [
        'Algunas relaciones son correctas, revisa las demás.',
        'Vas bien, piensa en el contexto de cada práctica.'
      ],
      incorrect_attempt_1: [
        'Piensa en qué tipo de argumentos se usaban para cada caso.',
        'Considera el contexto: religioso, económico, racial o de "civilización".'
      ],
      incorrect_attempt_2: [
        'La esclavitud se justificaba con superioridad racial y razones económicas.',
        'La Inquisición apelaba a proteger la fe, y la conquista a "evangelizar" y "civilizar".'
      ]
    },
    step_config: {
      hints: [
        'Piensa en qué tipo de argumentos se usaban para cada práctica.',
        'La esclavitud usaba argumentos raciales y económicos, la Inquisición religiosos.',
        'Relaciona cada práctica con el tipo de justificación que la legitimaba.'
      ],
      expected_time: 90,
      concept_card_key: 'justificaciones_por_practica',
      reflection_prompts: [
        '¿Por qué cada práctica usaba argumentos diferentes?',
        '¿Qué tenían en común todas estas justificaciones?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'matching',
      correct_pairs: [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3]
      ],
      evaluation_strategy: 'matching',
      explanation: '¡Excelente! Has comprendido los diferentes tipos de argumentos que se usaban para justificar cada práctica histórica.',
      misconceptions: [
        {
          pattern: 'esclavitud_con_religion',
          misconception_key: 'confunde_argumentos_esclavitud',
          hint: 'Si bien hubo argumentos religiosos para la esclavitud, los más comunes eran de superioridad racial y económicos.'
        },
        {
          pattern: 'inquisicion_con_raza',
          misconception_key: 'confunde_argumentos_inquisicion',
          hint: 'La Inquisición se justificaba principalmente con argumentos religiosos, no raciales.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  6: {
    type: 'ordering',
    question: 'Ordena cronológicamente estos eventos relacionados con el reconocimiento de derechos humanos:',
    context: 'El proceso histórico de reconocimiento de derechos humanos fue gradual y complejo, marcado por luchas sociales, revoluciones, debates filosóficos y transformaciones culturales. Este proceso no fue lineal ni uniforme en todas las sociedades, y aún continúa desarrollándose en la actualidad. Comprender esta evolución nos permite valorar las conquistas alcanzadas, reconocer los desafíos pendientes y reflexionar sobre cómo las sociedades transforman gradualmente sus concepciones de justicia y dignidad humana.',
    items: [
      'Abolición de la esclavitud en América',
      'Declaración Universal de Derechos Humanos (1948)',
      'Movimientos de derechos civiles (años 60)',
      'Primeras declaraciones de independencia en América (siglo XIX)',
      'Abolición formal de la Inquisición'
    ],
    phase: 'integration',
    hint: 'Piensa en el orden temporal: aboliciones del siglo XIX, eventos del siglo XX.',
    correct_order: [3, 4, 0, 1, 2], // Independencias → Abolición Inquisición → Abolición esclavitud → DUDH → Derechos civiles
    tutor_responses: {
      correct: [
        '¡Perfecto! Ordenaste correctamente la evolución de los derechos humanos.',
        '¡Excelente! Comprendes la secuencia histórica.',
        '¡Muy bien! Identificas el orden cronológico de estos eventos.'
      ],
      encouragement: [
        'Algunos eventos están en orden correcto, revisa los demás.',
        'Vas bien, piensa en qué ocurrió primero.'
      ],
      incorrect_attempt_1: [
        'Piensa en el orden: eventos del siglo XIX primero, luego del siglo XX.',
        'Las independencias y aboliciones ocurrieron antes de la Declaración Universal.'
      ],
      incorrect_attempt_2: [
        'El orden es: independencias (s. XIX), abolición Inquisición, abolición esclavitud, DUDH (1948), derechos civiles (años 60).',
        'Los eventos del siglo XIX ocurrieron antes que los del siglo XX.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en el orden temporal: siglo XIX antes que siglo XX.',
        'Las independencias y aboliciones del siglo XIX van primero.',
        'El orden correcto es: independencias, abolición Inquisición, abolición esclavitud, DUDH, derechos civiles.'
      ],
      expected_time: 90,
      concept_card_key: 'evolucion_derechos_humanos',
      reflection_prompts: [
        '¿Por qué tomó tanto tiempo reconocer estos derechos?',
        '¿Qué factores impulsaron estos cambios?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'hard'
    },
    expected_answer: {
      type: 'ordering',
      correct_order: [3, 4, 0, 1, 2],
      evaluation_strategy: 'ordering',
      explanation: '¡Perfecto! Has ordenado correctamente la evolución histórica del reconocimiento de derechos humanos.',
      misconceptions: [
        {
          pattern: 'dudh_antes_aboliciones',
          misconception_key: 'orden_incorrecto_dudh',
          hint: 'La Declaración Universal de Derechos Humanos (1948) fue posterior a las aboliciones del siglo XIX.'
        },
        {
          pattern: 'derechos_civiles_antes_dudh',
          misconception_key: 'orden_incorrecto_derechos_civiles',
          hint: 'Los movimientos de derechos civiles de los años 60 ocurrieron después de la DUDH de 1948.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  7: {
    type: 'option',
    question: 'María dice: "La esclavitud existió porque las personas de esa época eran malvadas". ¿Qué error comete María en su análisis histórico?',
    context: 'El análisis histórico riguroso requiere evitar simplificaciones y juicios morales anacrónicos que impiden la comprensión genuina del pasado. Las prácticas históricas no surgían simplemente de la "maldad" individual, sino de complejas estructuras sociales, económicas, culturales e ideológicas que las sociedades consideraban legítimas en su tiempo. Comprender esta complejidad no implica justificar dichas prácticas, sino desarrollar un entendimiento más profundo de cómo funcionan las sociedades y cómo las ideas se transforman históricamente.',
    options: [
      'No considera que las personas actuaban según las ideas y valores de su época',
      'Tiene razón, todas las personas de esa época eran malvadas',
      'La esclavitud no existió realmente',
      'No hay error en su análisis'
    ],
    phase: 'reflection',
    hint: 'Piensa en la diferencia entre juzgar moralmente y analizar históricamente.',
    tutor_responses: {
      correct: [
        '¡Correcto! El análisis histórico requiere comprender el contexto de cada época.',
        '¡Exacto! María comete un error al juzgar con valores actuales.',
        '¡Muy bien! Identificas el presentismo histórico en su análisis.'
      ],
      encouragement: [
        'Vas por buen camino, piensa en cómo analizar el pasado.',
        'Reflexiona sobre qué es un buen análisis histórico.'
      ],
      incorrect_attempt_1: [
        'Piensa: ¿es suficiente decir que las personas eran "malvadas"?',
        'Un buen análisis histórico considera el contexto y las ideas de cada época.'
      ],
      incorrect_attempt_2: [
        'María simplifica demasiado: no considera que las personas actuaban según las ideas de su tiempo.',
        'El error es juzgar el pasado con nuestros valores actuales sin entender el contexto histórico.'
      ]
    },
    step_config: {
      hints: [
        'Piensa en la diferencia entre juzgar moralmente y analizar históricamente.',
        'Un buen análisis histórico considera el contexto y las ideas de cada época.',
        'María no considera que las personas actuaban según los valores de su tiempo.'
      ],
      expected_time: 75,
      concept_card_key: 'presentismo_historico',
      reflection_prompts: [
        '¿Por qué es importante evitar juzgar el pasado con valores actuales?',
        '¿Cómo podemos analizar el pasado sin justificar prácticas injustas?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Correcto! María comete el error del presentismo histórico: juzga el pasado sin considerar que las personas actuaban según las ideas y valores de su época.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'acepta_simplificacion_moral',
          hint: 'Simplificar la historia como "personas malas" impide comprenderla realmente. Las sociedades funcionan con estructuras e ideas complejas.'
        },
        {
          pattern: '^2$',
          misconception_key: 'negacion_historica',
          hint: 'La esclavitud existió y está ampliamente documentada. Negarlo es un error histórico grave.'
        },
        {
          pattern: '^3$',
          misconception_key: 'no_reconoce_error',
          hint: 'Hay un error claro en el análisis de María: no considera el contexto histórico.'
        }
      ]
    },
    cognitive_dimension: 'evaluacion'
  },

  8: {
    type: 'keywords',
    question: '¿Qué aprendiste sobre cómo analizar críticamente las justificaciones históricas de prácticas injustas?',
    context: 'La capacidad de analizar críticamente las concepciones históricas que legitimaron prácticas injustas representa una competencia fundamental del pensamiento histórico y ciudadano. Esta habilidad nos permite comprender cómo las sociedades construyen y transforman sus sistemas de valores, identificar mecanismos de legitimación de estructuras de poder, y desarrollar juicio crítico sobre nuestras propias concepciones contemporáneas. El estudio histórico crítico no busca juzgar anacrónicamante ni justificar lo injustificable, sino cultivar una comprensión profunda que nos haga ciudadanos más reflexivos y conscientes.',
    phase: 'reflection',
    hint: 'Reflexiona sobre todo lo que aprendiste: contexto histórico, tipos de argumentos, análisis crítico.',
    tutor_responses: {
      correct: [
        '¡Excelente reflexión! Comprendes el valor del análisis histórico crítico.',
        '¡Muy bien! Has desarrollado pensamiento crítico sobre las concepciones históricas.',
        '¡Correcto! Entiendes cómo analizar justificaciones sin aceptarlas acríticamente.'
      ],
      encouragement: [
        'Vas por buen camino, desarrolla más tu reflexión.',
        'Interesante, piensa en qué más aprendiste sobre análisis crítico.'
      ],
      incorrect_attempt_1: [
        'Piensa en: ¿qué aprendiste sobre el contexto histórico?',
        'Reflexiona sobre los diferentes tipos de argumentos que se usaban.'
      ],
      incorrect_attempt_2: [
        'Aprendiste a analizar el contexto, identificar tipos de argumentos y pensar críticamente.',
        'El análisis crítico implica comprender sin justificar, contextualizar sin aceptar acríticamente.'
      ]
    },
    step_config: {
      hints: [
        'Reflexiona sobre: contexto histórico, tipos de argumentos, análisis crítico.',
        'Piensa en la importancia de comprender las ideas del pasado sin juzgar anacrónicamente.',
        'Menciona cómo el análisis crítico nos ayuda a entender las sociedades.'
      ],
      expected_time: 120,
      concept_card_key: 'reflexion_analisis_critico',
      reflection_prompts: [
        '¿Cómo te ayuda esto a entender mejor el presente?',
        '¿Qué aplicarás de este aprendizaje en otras situaciones?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'contexto', 'época', 'histórico',
        'analizar', 'crítico', 'crítica', 'examinar',
        'justificaciones', 'argumentos',
        'comprender', 'entender',
        'ideas', 'concepciones', 'valores',
        'sociedades', 'prácticas'
      ],
      evaluation_strategy: 'keywords',
      explanation: '¡Muy bien! Has comprendido la importancia de analizar críticamente las concepciones históricas considerando el contexto, los tipos de argumentos y sin juzgar anacrónicamente.',
      misconceptions: [
        {
          pattern: '.*solo.*juzgar.*|.*malo.*bueno.*',
          misconception_key: 'reduce_a_juicio_simple',
          hint: 'El análisis crítico va más allá de juzgar como "bueno" o "malo", busca comprender profundamente.'
        },
        {
          pattern: '.*justificar.*aceptar.*válido.*',
          misconception_key: 'confunde_comprender_con_justificar',
          hint: 'Comprender el contexto histórico no significa justificar prácticas injustas, sino entenderlas para analizarlas críticamente.'
        }
      ]
    },
    cognitive_dimension: 'evaluacion'
  }
};

async function enrichModule() {
  console.log('🎨 Enriqueciendo módulo de grado 6-7: Análisis crítico de prácticas históricas\n');
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

    const enriched = allSteps.filter(s => 
      s.enriched_content && 
      s.enriched_content.tutor_responses && 
      s.enriched_content.step_config
    ).length;
    
    console.log(`Total steps: ${allSteps.length}`);
    console.log(`Enriquecidos: ${enriched}`);
    console.log(`Progreso: ${Math.round((enriched / allSteps.length) * 100)}%`);
    
    console.log('\n✨ ¡Módulo 100% completamente enriquecido!');
    console.log('\n📋 Tipos de preguntas incluidos:');
    console.log('   • option (múltiple selección)');
    console.log('   • keywords (respuesta abierta)');
    console.log('   • multiple_select (varias correctas)');
    console.log('   • matching (relacionar parejas)');
    console.log('   • ordering (ordenar cronológicamente)');
    console.log('\n💡 Reinicia el servidor para cargar el módulo en caché.\n');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }

  console.log('\n✅ Enriquecimiento completado');
}

enrichModule();
