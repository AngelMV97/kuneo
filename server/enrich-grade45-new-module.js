/**
 * Enriquecer nuevo módulo de grado 4-5: Civilizaciones Antiguas y Organización Social
 * 
 * Tema: Comprender cómo las primeras civilizaciones se organizaron social y políticamente
 * Objetivo de aprendizaje: Comprendo cómo las civilizaciones antiguas organizaron su sociedad,
 * distribuyeron roles y desarrollaron sistemas de gobierno para satisfacer las necesidades de su comunidad.
 * 
 * Estructura: 8 steps con tipos variados
 * - Steps 1-2: option (exploración y representación)
 * - Step 3: keywords (formación de conceptos) - política 35% min_keywords
 * - Step 4: multiple_select (clasificación)
 * - Step 5: matching (aplicación guiada)
 * - Step 6: ordering (transferencia)
 * - Step 7: option (análisis de errores)
 * - Step 8: keywords (metacognición) - política 30% min_keywords
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

// Módulo existente de grados 4-5 que vamos a actualizar con nuevo contenido
const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

// Contenido enriquecido para cada step
const enrichedSteps = {
  1: {
    type: 'option',
    question: '¿Por qué crees que las primeras civilizaciones necesitaron organizarse en grupos con diferentes roles?',
    context: 'La organización social surge de la necesidad humana de trabajar en conjunto para sobrevivir y prosperar. En las primeras civilizaciones, esta organización permitió que diferentes personas se especializaran en tareas específicas, creando sistemas más eficientes. Comprender esta evolución nos ayuda a valorar cómo las sociedades actuales heredaron estas estructuras organizativas fundamentales.',
    options: [
      'Para que cada persona pudiera especializarse y hacer mejor su trabajo',
      'Porque los líderes querían tener más poder que los demás',
      'Para que solo algunas personas trabajaran y otras descansaran',
      'Porque las personas no podían hacer nada por sí mismas'
    ],
    phase: 'exploration',
    hint: 'Piensa en qué ventajas tiene que diferentes personas se concentren en tareas distintas.',
    tutor_responses: {
      correct: [
        '¡Exacto! La especialización permitió que cada persona desarrollara habilidades específicas.',
        '¡Muy bien! Entiendes que dividir las tareas hace el trabajo más eficiente.',
        '¡Correcto! La organización social surgió para mejorar la vida de toda la comunidad.'
      ],
      encouragement: [
        'Vas por buen camino, piensa en las ventajas de especializarse.',
        'Considera qué pasa cuando alguien se dedica solo a una actividad.'
      ],
      hints: [
        'Cuando alguien hace solo una cosa, se vuelve experto en eso.',
        'Piensa en cómo un agricultor y un artesano se complementan.',
        'La especialización permite que todos se beneficien del trabajo de otros.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          option_index: 1,
          misconception_key: 've_organizacion_como_imposicion',
          hint: 'La organización social no nació solo del deseo de poder, sino de necesidades prácticas de supervivencia y eficiencia.'
        },
        {
          option_index: 2,
          misconception_key: 'cree_sistema_injusto_desde_origen',
          hint: 'Aunque surgieron desigualdades, la organización inicial buscaba que todos contribuyeran al bienestar común.'
        },
        {
          option_index: 3,
          misconception_key: 'subestima_capacidad_individual',
          hint: 'Las personas sí podían hacer cosas por sí mismas, pero trabajar organizados permitía lograr más.'
        }
      ],
      time_estimate: 60,
      expected_time: 70,
      concept_card_key: 'especializacion_roles',
      reflection_prompts: [
        '¿Qué ventajas ves en que las personas se especialicen?',
        '¿Cómo se refleja esto en tu comunidad hoy?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'option',
      correct_option_index: 0,
      evaluation_strategy: 'exact_match',
      explanation: '¡Muy bien! La especialización permitió que cada persona desarrollara habilidades específicas, haciendo que la sociedad fuera más productiva.',
      misconceptions: []
    },
    cognitive_dimension: 'exploracion'
  },

  2: {
    type: 'option',
    question: 'En una civilización antigua, ¿cuál era el rol principal de los escribas?',
    context: 'Los diferentes roles en las civilizaciones antiguas no surgieron por casualidad, sino por necesidades específicas de la sociedad. Los escribas, por ejemplo, cumplían una función crucial que iba más allá de simplemente escribir. Eran los encargados de preservar el conocimiento, registrar transacciones, y mantener la memoria colectiva de su civilización. Este rol demuestra cómo el conocimiento se valoraba y protegía.',
    options: [
      'Registrar información importante como leyes, impuestos y acontecimientos históricos',
      'Construir templos y monumentos para los dioses',
      'Cultivar alimentos para alimentar a toda la población',
      'Dirigir el ejército en las batallas'
    ],
    phase: 'representation',
    hint: 'Los escribas trabajaban con palabras y números, no con herramientas físicas.',
    tutor_responses: {
      correct: [
        '¡Exacto! Los escribas eran los guardianes del conocimiento escrito.',
        '¡Muy bien! Entiendes la importancia de registrar información.',
        '¡Correcto! Los escribas preservaban la memoria de su civilización.'
      ],
      encouragement: [
        'Piensa en qué herramientas usarían los escribas.',
        'Considera qué rol necesita educación y conocimiento de la escritura.'
      ],
      hints: [
        'Los escribas eran de las pocas personas que sabían leer y escribir.',
        'Su trabajo era con documentos, no con construcción o agricultura.',
        'Eran esenciales para mantener registros de la sociedad.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          option_index: 1,
          misconception_key: 'confunde_escribas_arquitectos',
          hint: 'Los escribas no construían edificios, trabajaban con textos y documentos.'
        },
        {
          option_index: 2,
          misconception_key: 'confunde_escribas_agricultores',
          hint: 'Los agricultores cultivaban alimentos, los escribas trabajaban con información escrita.'
        },
        {
          option_index: 3,
          misconception_key: 'confunde_escribas_militares',
          hint: 'Los escribas no eran guerreros, su poder venía del conocimiento, no de las armas.'
        }
      ],
      time_estimate: 60,
      expected_time: 75,
      concept_card_key: 'roles_especializados',
      reflection_prompts: [
        '¿Por qué era tan importante saber leer y escribir?',
        '¿Qué rol similar existe hoy en día?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'option',
      correct_option_index: 0,
      evaluation_strategy: 'exact_match',
      explanation: '¡Muy bien! Los escribas registraban información crucial, preservando el conocimiento y la historia de su civilización.',
      misconceptions: []
    },
    cognitive_dimension: 'representacion'
  },

  3: {
    type: 'keywords',
    question: 'Explica con tus propias palabras: ¿Qué es una jerarquía social y por qué existía en las civilizaciones antiguas?',
    context: 'La jerarquía social en las civilizaciones antiguas refleja cómo se distribuía el poder, los recursos y las responsabilidades en una sociedad. Este concepto es fundamental para comprender cómo funcionaban estas civilizaciones y cómo se mantenía el orden. Al explicar este concepto con tus propias palabras, demuestras una comprensión profunda de cómo las sociedades organizaban sus estructuras de autoridad y qué factores determinaban la posición de cada persona.',
    options: [],
    phase: 'concept_formation',
    hint: 'Piensa en cómo se organizaban las personas en niveles o grupos según su importancia o función.',
    tutor_responses: {
      correct: [
        '¡Excelente explicación! Has comprendido cómo se organizaban las sociedades antiguas.',
        '¡Muy bien! Entiendes la estructura de poder en las civilizaciones.',
        '¡Perfecto! Tu explicación muestra comprensión de la organización social.'
      ],
      encouragement: [
        'Vas bien, intenta explicar cómo se dividían los grupos sociales.',
        'Piensa en quiénes tenían más poder y por qué.'
      ],
      hints: [
        'Una jerarquía es como una pirámide con diferentes niveles.',
        'En la cima estaban los gobernantes y sacerdotes, abajo los trabajadores.',
        'Existía para organizar el poder y distribuir las tareas en la sociedad.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          pattern: '.*injust.*|.*mal.*|.*abus.*',
          misconception_key: 'solo_ve_aspecto_negativo',
          hint: 'Además de posibles injusticias, la jerarquía cumplía funciones organizativas importantes para la sociedad.'
        },
        {
          pattern: '.*igual.*tod.*|.*no.*diferencias.*',
          misconception_key: 'niega_existencia_jerarquia',
          hint: 'Las evidencias históricas muestran claramente que existían diferentes niveles sociales en estas civilizaciones.'
        }
      ],
      time_estimate: 90,
      expected_time: 110,
      concept_card_key: 'jerarquia_social',
      reflection_prompts: [
        '¿Qué factores determinaban el nivel de una persona en la jerarquía?',
        '¿Crees que existen jerarquías en las sociedades actuales?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'high'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'jerarquía', 'jerarquias',
        'niveles', 'nivel', 'grupos', 'clases',
        'organización', 'organizar', 'organizada', 'estructura',
        'poder', 'autoridad', 'mando',
        'gobernantes', 'rey', 'reyes', 'faraón', 'emperador',
        'sacerdotes', 'religiosos',
        'nobles', 'aristocracia',
        'trabajadores', 'campesinos', 'esclavos',
        'sociedad', 'social', 'civilización',
        'funciones', 'roles', 'tareas', 'responsabilidades',
        'orden', 'control', 'gobernar',
        'recursos', 'riqueza', 'bienes'
      ],
      evaluation_strategy: 'keywords',
      min_keywords: 4, // 35% de ~11 keywords principales = 4
      explanation: '¡Excelente! Has explicado claramente que la jerarquía social era la organización en niveles donde diferentes grupos tenían distintos roles, poder y acceso a recursos.',
      misconceptions: [
        {
          pattern: '.*solo.*poder.*nada.*',
          misconception_key: 'reduce_jerarquia_a_poder',
          hint: 'La jerarquía no era solo sobre poder, también organizaba funciones, responsabilidades y distribución de recursos.'
        },
        {
          pattern: '.*todos.*iguales.*',
          misconception_key: 'no_reconoce_diferencias',
          hint: 'En las civilizaciones antiguas existían claras diferencias entre los distintos grupos sociales.'
        }
      ]
    },
    cognitive_dimension: 'formacion_conceptos'
  },

  4: {
    type: 'multiple_select',
    question: 'Selecciona todas las funciones que cumplían los gobernantes en las civilizaciones antiguas:',
    context: 'Los gobernantes en las civilizaciones antiguas no solo mandaban por mandar, sino que asumían múltiples responsabilidades cruciales para el funcionamiento de su sociedad. Comprender estas diferentes funciones nos permite apreciar la complejidad de liderar una civilización y las expectativas que la población tenía sobre sus líderes. Este análisis también revela cómo el poder estaba vinculado a responsabilidades específicas.',
    options: [
      'Crear y hacer cumplir las leyes',
      'Proteger al territorio de invasiones',
      'Organizar la construcción de obras públicas',
      'Hacer todo el trabajo agrícola personalmente',
      'Representar a los dioses ante el pueblo',
      'Decidir sobre el comercio y los impuestos'
    ],
    phase: 'classification',
    hint: 'Los gobernantes tenían responsabilidades de dirección y organización, no trabajos manuales.',
    tutor_responses: {
      correct: [
        '¡Perfecto! Has identificado las múltiples responsabilidades de los gobernantes.',
        '¡Muy bien! Entiendes el rol complejo de liderazgo en las civilizaciones antiguas.',
        '¡Excelente! Reconoces todas las funciones administrativas y políticas de los gobernantes.'
      ],
      encouragement: [
        'Vas bien, revisa cuáles son funciones de dirección.',
        'Piensa en qué tareas requieren autoridad y cuáles son trabajos manuales.'
      ],
      hints: [
        'Los gobernantes dirigían, no hacían trabajos físicos directamente.',
        'Tenían autoridad religiosa, militar, legal y económica.',
        'Su rol era organizar y dirigir, no ejecutar tareas manuales.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          pattern: 'incluye_trabajo_agricola',
          misconception_key: 'no_distingue_dirigir_ejecutar',
          hint: 'Los gobernantes organizaban la agricultura, pero no trabajaban la tierra personalmente.'
        },
        {
          pattern: 'omite_funcion_religiosa',
          misconception_key: 'separa_poder_politico_religioso',
          hint: 'En muchas civilizaciones antiguas, el gobernante también cumplía funciones religiosas importantes.'
        }
      ],
      time_estimate: 80,
      expected_time: 95,
      concept_card_key: 'funciones_gobernantes',
      reflection_prompts: [
        '¿Por qué los gobernantes tenían tantas responsabilidades diferentes?',
        '¿Qué pasaría si un gobernante no cumplía con estas funciones?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'multiple_select',
      correct_indices: [0, 1, 2, 4, 5],
      evaluation_strategy: 'multiple_select',
      explanation: '¡Muy bien! Los gobernantes creaban leyes, protegían el territorio, organizaban construcciones, representaban a los dioses y controlaban el comercio. No hacían trabajo agrícola manual.',
      misconceptions: []
    },
    cognitive_dimension: 'clasificacion'
  },

  5: {
    type: 'matching',
    question: 'Relaciona cada grupo social con su función principal en las civilizaciones antiguas:',
    context: 'Cada grupo social en las civilizaciones antiguas cumplía funciones específicas que eran esenciales para el funcionamiento del conjunto. Esta interdependencia creaba un sistema donde todos los grupos, aunque con diferentes niveles de poder y privilegios, contribuían al mantenimiento de la civilización. Comprender estas relaciones nos permite ver cómo se complementaban los diferentes sectores de la sociedad antigua.',
    pairs: [
      { left: 'Sacerdotes', right: 'Realizar ceremonias religiosas y comunicarse con los dioses' },
      { left: 'Artesanos', right: 'Crear herramientas, cerámica y objetos de uso diario' },
      { left: 'Comerciantes', right: 'Intercambiar productos con otras ciudades y regiones' },
      { left: 'Campesinos', right: 'Cultivar alimentos para toda la población' }
    ],
    phase: 'guided_application',
    hint: 'Piensa en qué habilidades o conocimientos necesitaría cada grupo para su función.',
    tutor_responses: {
      correct: [
        '¡Excelente! Has relacionado correctamente cada grupo con su función.',
        '¡Perfecto! Entiendes cómo se complementaban los diferentes grupos sociales.',
        '¡Muy bien! Reconoces las funciones específicas de cada sector de la sociedad.'
      ],
      encouragement: [
        'Vas bien, piensa en qué hacía cada grupo específicamente.',
        'Considera las habilidades necesarias para cada función.'
      ],
      hints: [
        'Los sacerdotes trabajaban con lo espiritual y religioso.',
        'Los artesanos creaban objetos con sus manos.',
        'Los comerciantes viajaban e intercambiaban productos.',
        'Los campesinos trabajaban la tierra.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          pattern: 'confunde_artesanos_comerciantes',
          misconception_key: 'no_diferencia_produccion_intercambio',
          hint: 'Los artesanos fabricaban productos, los comerciantes los intercambiaban con otros lugares.'
        },
        {
          pattern: 'confunde_sacerdotes_gobernantes',
          misconception_key: 'mezcla_poder_religioso_politico',
          hint: 'Aunque relacionados, los sacerdotes se enfocaban en lo religioso, no en el gobierno directo.'
        }
      ],
      time_estimate: 85,
      expected_time: 100,
      concept_card_key: 'grupos_sociales_funciones',
      reflection_prompts: [
        '¿Qué grupo te parece más importante y por qué?',
        '¿Podrían algunas de estas funciones combinarse?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'medium'
    },
    expected_answer: {
      type: 'matching',
      correct_pairs: [
        { left: 'Sacerdotes', right: 'Realizar ceremonias religiosas y comunicarse con los dioses' },
        { left: 'Artesanos', right: 'Crear herramientas, cerámica y objetos de uso diario' },
        { left: 'Comerciantes', right: 'Intercambiar productos con otras ciudades y regiones' },
        { left: 'Campesinos', right: 'Cultivar alimentos para toda la población' }
      ],
      evaluation_strategy: 'matching',
      explanation: '¡Muy bien! Has relacionado correctamente cada grupo social con su función específica en la civilización.',
      misconceptions: []
    },
    cognitive_dimension: 'aplicacion_guiada'
  },

  6: {
    type: 'ordering',
    question: 'Ordena estos eventos en la secuencia correcta de cómo una civilización antigua desarrollaba su organización social:',
    context: 'El desarrollo de la organización social en las civilizaciones antiguas siguió un proceso gradual y lógico. Comprender esta secuencia nos ayuda a ver cómo las necesidades prácticas llevaron a estructuras más complejas. Cada etapa preparaba el terreno para la siguiente, mostrando cómo las sociedades evolucionaron desde grupos simples hasta civilizaciones organizadas con múltiples niveles jerárquicos y roles especializados.',
    items: [
      'Las personas se establecen en un lugar fijo y empiezan a cultivar',
      'Aparecen los primeros líderes que organizan el trabajo',
      'Se desarrollan diferentes oficios y especialidades',
      'Se crea un sistema de leyes y gobierno formal'
    ],
    phase: 'transfer',
    hint: 'Piensa en cómo las sociedades pasaron de ser nómadas a civilizaciones complejas.',
    tutor_responses: {
      correct: [
        '¡Perfecto! Has ordenado correctamente el desarrollo de la organización social.',
        '¡Excelente! Entiendes la secuencia lógica del desarrollo civilizatorio.',
        '¡Muy bien! Reconoces cómo las sociedades evolucionaron gradualmente.'
      ],
      encouragement: [
        'Vas bien, piensa en qué debe pasar primero.',
        'Considera qué necesita existir antes que otra cosa pueda desarrollarse.'
      ],
      hints: [
        'Primero las personas deben establecerse en un lugar.',
        'Luego necesitan organización básica del trabajo.',
        'Después vienen las especializaciones.',
        'Finalmente se crean sistemas formales de gobierno.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          pattern: 'leyes_primero',
          misconception_key: 'cree_gobierno_antes_asentamiento',
          hint: 'Las leyes formales aparecieron después de que las personas se establecieran y organizaran.'
        },
        {
          pattern: 'especialidades_antes_lideres',
          misconception_key: 'no_ve_necesidad_organizacion_basica',
          hint: 'Se necesitaba organización básica antes de que pudieran desarrollarse especializaciones complejas.'
        }
      ],
      time_estimate: 75,
      expected_time: 90,
      concept_card_key: 'evolucion_social',
      reflection_prompts: [
        '¿Por qué era necesario seguir este orden?',
        '¿Qué etapa te parece más crucial para el desarrollo de una civilización?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'high'
    },
    expected_answer: {
      type: 'ordering',
      correct_order: [0, 1, 2, 3],
      evaluation_strategy: 'ordering',
      explanation: '¡Muy bien! Primero el asentamiento, luego líderes organizadores, después especialización de oficios, y finalmente un sistema formal de gobierno.',
      misconceptions: []
    },
    cognitive_dimension: 'transferencia'
  },

  7: {
    type: 'option',
    question: 'Pedro dice: "Los esclavos no contribuían nada importante a la civilización porque no tenían poder". ¿Por qué está equivocado Pedro?',
    context: 'Es importante distinguir entre poder político y contribución económica o laboral en una sociedad. Este es un error conceptual común que confunde la posición jerárquica con el aporte real al funcionamiento de la civilización. Analizar este tipo de errores nos ayuda a desarrollar un pensamiento más crítico y justo sobre cómo valoramos las diferentes contribuciones en una sociedad, independientemente del poder que tengan quienes las realizan.',
    options: [
      'Porque los esclavos realizaban gran parte del trabajo físico que sostenía la economía de la civilización',
      'Porque los esclavos en realidad tenían mucho poder político',
      'Porque sin esclavos nadie podría haber trabajado',
      'Porque los esclavos eran más importantes que los gobernantes'
    ],
    phase: 'error_analysis',
    hint: 'Piensa en la diferencia entre tener poder y hacer trabajo importante.',
    tutor_responses: {
      correct: [
        '¡Correcto! El trabajo físico era fundamental aunque no tuviera poder político.',
        '¡Muy bien! Entiendes que contribución y poder son cosas diferentes.',
        '¡Exacto! El trabajo de los esclavos sostenía la economía aunque no tuvieran autoridad.'
      ],
      encouragement: [
        'Piensa en qué diferencia hay entre poder y contribución.',
        'Considera si alguien puede contribuir sin tener poder.'
      ],
      hints: [
        'Poder político y contribución laboral son conceptos diferentes.',
        'Alguien puede hacer trabajo importante sin tener autoridad.',
        'Los esclavos construyeron monumentos y produjeron alimentos esenciales.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          option_index: 1,
          misconception_key: 'confunde_trabajo_con_poder',
          hint: 'Los esclavos NO tenían poder político, pero sí realizaban trabajo fundamental.'
        },
        {
          option_index: 2,
          misconception_key: 'absolutiza_dependencia',
          hint: 'Otras personas también trabajaban, no solo los esclavos, aunque estos hacían gran parte del trabajo físico.'
        },
        {
          option_index: 3,
          misconception_key: 'invierte_jerarquia_incorrectamente',
          hint: 'Todos contribuían de diferentes formas; no se trata de que unos fueran más importantes que otros.'
        }
      ],
      time_estimate: 80,
      expected_time: 95,
      concept_card_key: 'contribucion_vs_poder',
      reflection_prompts: [
        '¿Cómo definirías "importante" en una sociedad?',
        '¿Puede alguien ser valioso sin tener poder?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'high'
    },
    expected_answer: {
      type: 'option',
      correct_option_index: 0,
      evaluation_strategy: 'exact_match',
      explanation: '¡Muy bien! Aunque no tenían poder, los esclavos realizaban trabajo fundamental que sostenía la economía. Contribución y poder son conceptos diferentes.',
      misconceptions: []
    },
    cognitive_dimension: 'analisis_errores'
  },

  8: {
    type: 'keywords',
    question: '¿Qué has aprendido sobre cómo funcionaban las civilizaciones antiguas? ¿Qué similitudes y diferencias ves con las sociedades actuales?',
    context: 'Reflexionar sobre lo aprendido y conectarlo con el presente es una habilidad metacognitiva fundamental. Al comparar las civilizaciones antiguas con las sociedades actuales, desarrollas pensamiento crítico y capacidad de análisis histórico. Esta reflexión te permite no solo recordar hechos, sino comprender procesos y patrones que se mantienen o han cambiado a lo largo del tiempo, fortaleciendo tu comprensión profunda de la organización social.',
    options: [],
    phase: 'metacognition',
    hint: 'Piensa en los conceptos que estudiaste: jerarquía, roles, organización, y cómo se reflejan hoy.',
    tutor_responses: {
      correct: [
        '¡Excelente reflexión! Has conectado el pasado con el presente de manera significativa.',
        '¡Muy bien! Tu análisis muestra comprensión profunda de la organización social.',
        '¡Perfecto! Has identificado patrones importantes en cómo funcionan las sociedades.'
      ],
      encouragement: [
        'Vas bien, sigue desarrollando tus comparaciones.',
        'Intenta pensar en ejemplos concretos de similitudes o diferencias.'
      ],
      hints: [
        'Piensa si hoy existen roles especializados como en las civilizaciones antiguas.',
        'Reflexiona sobre si todavía hay jerarquías en la sociedad actual.',
        'Considera qué ha cambiado en cómo se organizan las sociedades.'
      ]
    },
    step_config: {
      misconceptions: [
        {
          pattern: '.*todo.*igual.*nada.*cambio.*',
          misconception_key: 'no_reconoce_cambios_historicos',
          hint: 'Aunque hay similitudes, muchas cosas han cambiado en cómo se organizan las sociedades modernas.'
        },
        {
          pattern: '.*todo.*diferente.*nada.*parecido.*',
          misconception_key: 'no_ve_continuidades_historicas',
          hint: 'A pesar de los cambios, algunos patrones de organización social se mantienen desde las civilizaciones antiguas.'
        }
      ],
      time_estimate: 100,
      expected_time: 120,
      concept_card_key: 'reflexion_organizacion_social',
      reflection_prompts: [
        '¿Qué concepto te resultó más interesante?',
        '¿Cómo aplicarás este conocimiento para entender mejor tu sociedad?'
      ],
      visual_template_key: null,
      difficulty_indicator: 'high'
    },
    expected_answer: {
      type: 'keywords',
      keywords: [
        'civilización', 'civilizaciones', 'antiguas',
        'organización', 'organizadas', 'organizaban',
        'jerarquía', 'jerarquias', 'niveles',
        'roles', 'funciones', 'especialización',
        'gobernantes', 'líderes', 'autoridad',
        'trabajadores', 'grupos', 'clases',
        'similitudes', 'parecido', 'similar', 'igual',
        'diferencias', 'diferente', 'cambios', 'cambió',
        'sociedad', 'sociedades', 'actual', 'hoy', 'moderna',
        'poder', 'leyes', 'gobierno',
        'importante', 'aprendí', 'comprendí', 'entendí'
      ],
      evaluation_strategy: 'keywords',
      min_keywords: 4, // 30% de ~13 keywords principales = 4
      explanation: '¡Excelente reflexión! Has integrado conceptos clave sobre organización social, jerarquía y roles, y los has conectado con las sociedades actuales.',
      misconceptions: [
        {
          pattern: '.*no.*aprendí.*nada.*|.*no.*entendí.*',
          misconception_key: 'muestra_desconexion_aprendizaje',
          hint: 'Piensa en los conceptos que discutimos: jerarquía, roles especializados, organización social. ¿Qué te llamó la atención?'
        },
        {
          pattern: '.*aburrido.*|.*no.*interesa.*',
          misconception_key: 'no_ve_relevancia',
          hint: 'Estas estructuras sociales siguen existiendo hoy. ¿Puedes identificar ejemplos en tu comunidad o país?'
        }
      ]
    },
    cognitive_dimension: 'metacognicion'
  }
};

async function updateAndEnrichModule() {
  console.log('🎨 Actualizando módulo de Ciencias Sociales (Grados 4-5)...\n');
  console.log('📚 Nuevo tema: Civilizaciones Antiguas y Organización Social\n');
  console.log(`📌 Módulo ID: ${MODULE_ID}\n`);

  // PASO 1: Actualizar el módulo con nuevo título y objetivo
  console.log('📝 Paso 1: Actualizando información del módulo...');
  
  const { error: moduleError } = await supabase
    .from('modules')
    .update({
      title: 'Civilizaciones Antiguas',
      learning_objective: 'Comprendo cómo las civilizaciones antiguas organizaron su sociedad, distribuyeron roles y desarrollaron sistemas de gobierno para satisfacer las necesidades de su comunidad.',
      core_concept: 'organizacion_social_civilizaciones'
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
      console.error(`   ❌ Error en step ${stepNumber}:`, updateError.message);
    } else {
      const contextLength = enrichedContent.context.length;
      const keywordsCount = enrichedContent.expected_answer?.keywords?.length || 0;
      console.log(`   ✅ Step ${stepNumber} enriquecido (context: ${contextLength} chars, keywords: ${keywordsCount})`);
    }
  }

  console.log('\n✅ Proceso completado!\n');
  console.log('📊 Resumen:');
  console.log(`   - Módulo: "${enrichedSteps[1].context.split('.')[0]}..."`);
  console.log(`   - Steps enriquecidos: ${Object.keys(enrichedSteps).length}`);
  console.log(`   - Step 3 (keywords): ${enrichedSteps[3].expected_answer.keywords.length} keywords, min ${enrichedSteps[3].expected_answer.min_keywords}`);
  console.log(`   - Step 8 (keywords): ${enrichedSteps[8].expected_answer.keywords.length} keywords, min ${enrichedSteps[8].expected_answer.min_keywords}`);
}

updateAndEnrichModule().catch(console.error);
