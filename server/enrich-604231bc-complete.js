/**
 * Enriquecer TODOS los steps del módulo de grado 4-5: Nomadismo y Sedentarismo
 * ID: 604231bc-8ce4-45e7-932d-745d821dfeaa
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

// Contenido enriquecido para TODOS los steps
const enrichedSteps = {
  1: {
    type: 'option',
    question: '¿Qué crees que significa "nómada"?',
    context: 'Vamos a explorar cómo vivían los primeros seres humanos. Piensa en lo que significa moverse de un lugar a otro versus quedarse siempre en el mismo sitio.',
    options: [
      'Personas que se mueven de un lugar a otro',
      'Personas que viven en casas grandes',
      'Personas que solo comen carne',
      'Personas que no tienen familia'
    ],
    phase: 'exploration',
    hint: 'Piensa en la palabra "moverse". ¿Qué opción habla de movimiento?',
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
    context: 'Los primeros seres humanos eran nómadas. Esto significa que no vivían siempre en el mismo lugar, sino que se movían constantemente. Se desplazaban siguiendo a los animales que cazaban y buscando plantas y frutos para recolectar.',
    options: [
      'Se mueven constantemente buscando alimento',
      'Viven siempre en el mismo lugar',
      'Solo comen plantas y frutas',
      'Construyen casas muy grandes'
    ],
    phase: 'representation',
    hint: 'Piensa en el significado de la palabra "moverse" y por qué lo hacían.',
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
    context: 'Los nómadas dependían de los recursos naturales disponibles en cada lugar: animales para cazar, plantas para recolectar, y agua para beber. Cuando estos recursos se agotaban en un área, debían mudarse a otro lugar.',
    phase: 'explanation',
    hint: 'Piensa en qué necesitaban los nómadas para sobrevivir y qué pasaba cuando se acababa en un lugar.',
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
    context: 'Los grupos nómadas tenían que conseguir su alimento de diferentes maneras. Cazaban animales salvajes como venados y conejos. Recolectaban frutas, raíces y semillas de las plantas silvestres. También pescaban en ríos y lagos cuando encontraban agua.',
    options: [
      'Cazar animales salvajes',
      'Cultivar maíz en campos',
      'Recolectar frutas y raíces',
      'Criar vacas y gallinas',
      'Pescar en ríos',
      'Construir ciudades grandes'
    ],
    phase: 'classification',
    hint: 'Los nómadas obtenían comida de la naturaleza, no la producían. Piensa en qué actividades no requieren quedarse en un solo lugar.',
    correct_options: [0, 2, 4],
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
    cognitive_dimension: 'clasificacion'
  },

  5: {
    type: 'matching',
    question: 'Relaciona cada forma de vida con su característica principal:',
    context: 'A lo largo de la historia, los seres humanos cambiaron su forma de vivir. Los nómadas se movían constantemente. Luego, algunos grupos descubrieron la agricultura y se volvieron sedentarios, quedándose en un solo lugar. Este cambio transformó completamente su vida.',
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
      'Construyen aldeas permanentes'
    ],
    phase: 'guided_application',
    hint: 'Piensa en las diferencias entre moverse y quedarse quieto, y en cómo la agricultura cambió todo.',
    correct_pairs: [
      [0, 2], // Vida nómada - Se mueven siguiendo animales
      [1, 1], // Descubrimiento de la agricultura - Cultivan plantas
      [2, 0], // Vida sedentaria - Se quedan en un lugar fijo
      [3, 2]  // Grupos cazadores-recolectores - Se mueven siguiendo animales
    ],
    expected_answer: {
      type: 'matching',
      correct_pairs: [
        [0, 2],
        [1, 1],
        [2, 0],
        [3, 2]
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
    cognitive_dimension: 'aplicacion_guiada'
  },

  6: {
    type: 'ordering',
    question: 'Ordena cronológicamente estos eventos en la historia humana:',
    context: 'La historia humana pasó por diferentes etapas. Primero, todos los grupos eran nómadas cazadores-recolectores. Después, descubrieron la agricultura. Este descubrimiento llevó a que se volvieran sedentarios y construyeran las primeras aldeas.',
    items: [
      'Grupos nómadas cazadores-recolectores',
      'Descubrimiento de la agricultura',
      'Construcción de primeras aldeas',
      'Vida sedentaria establecida'
    ],
    phase: 'transfer',
    hint: 'Piensa en el orden: primero cazaban y se movían, luego descubrieron algo importante, después se quedaron en un lugar.',
    correct_order: [0, 1, 2, 3],
    expected_answer: {
      type: 'ordering',
      correct_order: [0, 1, 2, 3],
      evaluation_strategy: 'ordering',
      explanation: '¡Perfecto! Has ordenado correctamente la evolución de la vida humana: nomadismo → agricultura → sedentarismo → aldeas.',
      misconceptions: [
        {
          pattern: 'agricultura_primero',
          misconception_key: 'orden_cronologico_invertido',
          hint: 'La agricultura fue descubierta después, no antes. Los humanos primero fueron nómadas.'
        },
        {
          pattern: 'aldeas_antes_agricultura',
          misconception_key: 'confunde_orden_desarrollo',
          hint: 'Las aldeas permanentes solo fueron posibles después de la agricultura.'
        }
      ]
    },
    cognitive_dimension: 'transferencia'
  },

  7: {
    type: 'option',
    question: 'Juan dice: "Los nómadas eran tontos porque no sabían cultivar". ¿Qué le responderías a Juan?',
    context: 'Es importante no juzgar a las personas del pasado con nuestros conocimientos actuales. Los nómadas eran tan inteligentes como nosotros, solo vivían en condiciones diferentes y se adaptaban a su entorno de la mejor manera posible. La agricultura fue un descubrimiento gradual que tomó miles de años.',
    options: [
      'No tenía razón: eran inteligentes, solo vivían de manera diferente',
      'Sí tenía razón: si fueran inteligentes habrían descubierto la agricultura antes',
      'Tenía razón: los nómadas eran como animales salvajes',
      'No tenía razón porque los nómadas no comían alimentos cocinados'
    ],
    phase: 'error_analysis',
    hint: 'Piensa si es justo juzgar a personas del pasado con lo que sabemos ahora.',
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
    context: 'Reflexiona sobre todo lo que aprendiste en este módulo. Piensa en cómo cambió la vida humana cuando las personas dejaron de ser nómadas y se volvieron sedentarias gracias a la agricultura.',
    phase: 'reflection',
    hint: 'Piensa en: ¿qué permitió hacer la agricultura? ¿Cómo cambió la vida de las personas? ¿Qué cosas nuevas pudieron hacer?',
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
    cognitive_dimension: 'metacognicion'
  }
};

async function enrichModule() {
  console.log('🎨 Enriqueciendo módulo completo de grado 4-5: Nomadismo y Sedentarismo\n');
  console.log('=' .repeat(80));

  try {
    const stepsToEnrich = [1, 2, 3, 4, 5, 6, 7, 8];
    
    for (const stepNumber of stepsToEnrich) {
      console.log(`\n📝 Enriqueciendo Step ${stepNumber}...`);
      
      const enrichedContent = enrichedSteps[stepNumber];
      
      // Obtener ID del step
      const { data: step, error: stepError } = await supabase
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
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', MODULE_ID);

    const enrichedCount = allSteps.filter(s => s.enriched_content !== null).length;
    const percentage = Math.round((enrichedCount / 8) * 100);

    console.log(`Total steps: 8`);
    console.log(`Enriquecidos: ${enrichedCount}`);
    console.log(`Progreso: ${percentage}%`);

    if (enrichedCount === 8) {
      console.log('\n✨ ¡Módulo 100% completamente enriquecido!');
      console.log('\n📋 Tipos de preguntas incluidos:');
      console.log('   • option (múltiple selección)');
      console.log('   • keywords (respuesta abierta)');
      console.log('   • multiple_select (varias correctas)');
      console.log('   • matching (relacionar parejas)');
      console.log('   • ordering (ordenar cronológicamente)');
      console.log('\n💡 Reinicia el servidor para cargar el módulo en caché.');
    }

    console.log('\n✅ Enriquecimiento completado');

  } catch (error) {
    console.error('\n❌ Error durante el enriquecimiento:', error);
    process.exit(1);
  }
}

enrichModule()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
