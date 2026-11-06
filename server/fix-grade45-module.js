/**
 * ENRIQUECIMIENTO COMPLETO - Módulo Grado 4-5: Nomadismo y Sedentarismo
 * ID: 604231bc-8ce4-45e7-932d-745d821dfeaa
 * 
 * Reemplaza TODOS los 8 steps con contenido enriquecido correcto
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

// Contenido enriquecido para los 8 steps
const enrichedSteps = {
  1: {
    type: 'option',
    question: '¿Qué significa que un grupo humano sea nómada?',
    context: 'Hace miles de años, los primeros seres humanos no vivían siempre en el mismo lugar. Ellos se movían de un sitio a otro buscando alimentos. Cazaban animales y recolectaban frutas, raíces y semillas de las plantas.',
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

  2: {
    type: 'option',
    question: '¿Qué hacían los grupos nómadas para conseguir su comida?',
    context: 'Los grupos nómadas tenían que conseguir su alimento directamente de la naturaleza. No cultivaban plantas ni criaban animales. Debían cazar animales salvajes, recolectar frutas y raíces, y pescar en ríos y lagos.',
    options: [
      'Cazaban, recolectaban y pescaban',
      'Cultivaban maíz y frijoles',
      'Compraban comida en el mercado',
      'Solo comían carne de animales'
    ],
    phase: 'representation',
    hint: 'Piensa en cómo obtenían alimentos directamente de la naturaleza, sin producirlos.',
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Muy bien! Los nómadas cazaban animales, recolectaban plantas silvestres y pescaban para alimentarse.',
      misconceptions: [
        {
          pattern: '^1$',
          misconception_key: 'confunde_nomadismo_con_agricultura',
          hint: 'Cultivar plantas requiere quedarse en un lugar para cuidarlas. Los nómadas se movían constantemente.'
        },
        {
          pattern: '^2$',
          misconception_key: 'anacronismo_mercados',
          hint: 'Los mercados aparecieron mucho después. Los nómadas vivieron hace miles de años.'
        },
        {
          pattern: '^3$',
          misconception_key: 'dieta_incompleta',
          hint: 'Los nómadas tenían una dieta variada: comían animales, plantas, frutas y pescado.'
        }
      ]
    },
    cognitive_dimension: 'comprension'
  },

  3: {
    type: 'multiple_select',
    question: 'Marca TODAS las actividades que realizaban los grupos nómadas:',
    context: 'La vida nómada era muy activa. Los grupos se movían siguiendo a los animales que cazaban. Recolectaban frutas, raíces y semillas de las plantas silvestres. También pescaban en ríos y lagos cuando encontraban agua. Debían conocer muy bien su entorno para sobrevivir.',
    options: [
      'Cazar animales salvajes',
      'Cultivar maíz en campos',
      'Recolectar frutas y raíces',
      'Criar vacas y gallinas',
      'Pescar en ríos',
      'Construir ciudades grandes'
    ],
    phase: 'application',
    hint: 'Los nómadas obtenían comida de la naturaleza, no la producían. Piensa en qué actividades no requieren quedarse en un solo lugar.',
    correct_options: [0, 2, 4],
    expected_answer: {
      type: 'multiple_select',
      correct_options: [0, 2, 4],
      evaluation_strategy: 'multiple_select',
      explanation: '¡Excelente! Los nómadas cazaban, recolectaban y pescaban. No cultivaban ni criaban animales porque eso requiere quedarse en un lugar fijo.',
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

  4: {
    type: 'matching',
    question: 'Relaciona cada forma de vida con su característica principal:',
    context: 'A lo largo de la historia, los seres humanos cambiaron su forma de vivir. Los nómadas se movían constantemente siguiendo a los animales. Luego, algunos grupos descubrieron la agricultura y se volvieron sedentarios, quedándose en un solo lugar. Este cambio transformó completamente su vida.',
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
    phase: 'connection',
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
      explanation: '¡Perfecto! Has comprendido las diferencias entre la vida nómada y sedentaria, y el papel de la agricultura.',
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

  5: {
    type: 'ordering',
    question: 'Ordena cronológicamente estos eventos en la historia humana:',
    context: 'La historia de la humanidad tuvo grandes cambios. Primero, todos los humanos eran nómadas que cazaban y recolectaban. Luego descubrieron cómo cultivar plantas. Esto les permitió quedarse en un lugar y formar aldeas permanentes. Finalmente, las aldeas crecieron y se desarrollaron sociedades más complejas.',
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
    expected_answer: {
      type: 'ordering',
      correct_order: [0, 1, 4, 2, 3],
      evaluation_strategy: 'ordering',
      explanation: '¡Excelente! Has ordenado correctamente los grandes cambios en la historia humana: del nomadismo a las sociedades agrícolas.',
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

  6: {
    type: 'keywords',
    question: '¿Qué cambió en la vida de las personas cuando descubrieron la agricultura?',
    context: 'El descubrimiento de la agricultura fue uno de los cambios más importantes en la historia humana. Antes, las personas debían moverse constantemente. Con la agricultura, pudieron quedarse en un mismo lugar, cultivar su propia comida y formar comunidades permanentes.',
    phase: 'integration',
    hint: 'Piensa en: ¿qué dejaron de hacer? ¿Qué pudieron hacer nuevo? ¿Dónde vivían ahora?',
    expected_answer: {
      type: 'keywords',
      keywords: [
        'sedentario', 'sedentarios', 'sedentaria', 'quedar', 'quedarse', 'establecer',
        'aldea', 'aldeas', 'comunidad', 'comunidades',
        'cultivar', 'cultivaban', 'cultivo', 'cosechar',
        'permanente', 'permanentes', 'fijo', 'fija', 'lugar'
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
    cognitive_dimension: 'comprension'
  },

  7: {
    type: 'option',
    question: 'Juan dice: "Los nómadas eran tontos porque no sabían cultivar". ¿Qué le responderías?',
    context: 'A veces pensamos que las personas del pasado eran menos inteligentes que nosotros. Pero los grupos nómadas eran muy inteligentes: conocían perfectamente su entorno, sabían rastrear animales, identificar plantas comestibles y sobrevivir en condiciones difíciles. Simplemente vivían de una manera diferente.',
    options: [
      'No tiene razón: eran inteligentes, solo vivían de manera diferente',
      'Tiene razón: deberían haber cultivado desde el inicio',
      'Los nómadas no eran humanos verdaderos',
      'Los nómadas solo comían carne cruda'
    ],
    phase: 'reflection',
    hint: 'La inteligencia no depende de la época ni de la forma de vida. Piensa en que adaptarse al entorno requiere mucha inteligencia.',
    expected_answer: {
      type: 'option',
      correct_options: [0],
      evaluation_strategy: 'option',
      explanation: '¡Perfecto! Los nómadas eran tan inteligentes como nosotros, solo vivían adaptados a su entorno de manera diferente.',
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
    context: 'Reflexiona sobre todo lo que aprendiste en este módulo. Piensa en cómo cambió la vida humana cuando las personas dejaron de ser nómadas y se volvieron sedentarias gracias a la agricultura. ¿Qué nuevas posibilidades trajo este cambio?',
    phase: 'reflection',
    hint: 'Piensa en: ¿qué permitió hacer la agricultura? ¿Cómo cambió la vida de las personas? ¿Qué cosas nuevas pudieron hacer?',
    expected_answer: {
      type: 'keywords',
      keywords: [
        'sedentario', 'sedentarios', 'sedentaria', 'quedar', 'quedarse', 'establecer',
        'aldea', 'aldeas', 'comunidad', 'comunidades',
        'alimento', 'alimentos', 'comida', 'cosechar', 'cultivar',
        'permanecer', 'permanente', 'fijo', 'fija', 'cambio', 'cambió'
      ],
      evaluation_strategy: 'keywords',
      explanation: '¡Excelente reflexión! Has comprendido que la agricultura permitió a las personas establecerse, formar comunidades permanentes y desarrollar nuevas formas de vida.',
      misconceptions: [
        {
          pattern: '.*solo.*comer.*',
          misconception_key: 'reduccion_a_alimentacion',
          hint: 'La agricultura no solo cambió qué comían, sino toda su forma de vida. Piensa en más cambios.'
        },
        {
          pattern: '.*mejor.*superior.*',
          misconception_key: 'juicio_valorativo_progreso',
          hint: 'No se trata de que una forma de vida sea mejor que otra, sino de diferentes adaptaciones al entorno.'
        }
      ]
    },
    cognitive_dimension: 'evaluacion'
  }
};

async function enrichAllSteps() {
  console.log('🎨 ENRIQUECIMIENTO COMPLETO - Módulo Grado 4-5\n');
  console.log('='.repeat(80));
  console.log('Módulo: ¿Cómo analizar una situación social?');
  console.log('Tema: Nomadismo → Sedentarismo → Agricultura');
  console.log('Grado: 4-5 (edad 9-10 años)\n');

  try {
    // Obtener todos los steps
    const { data: steps, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('id, step_order')
      .eq('module_id', MODULE_ID)
      .order('step_order');

    if (stepsError) throw stepsError;

    console.log(`📝 Enriqueciendo ${steps.length} steps...\n`);

    // Actualizar cada step
    for (const step of steps) {
      const enrichedContent = enrichedSteps[step.step_order];
      
      if (!enrichedContent) {
        console.log(`⚠️  Step ${step.step_order}: No hay contenido definido`);
        continue;
      }

      const { error: updateError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .update({ enriched_content: enrichedContent })
        .eq('id', step.id);

      if (updateError) {
        console.log(`❌ Step ${step.step_order}: Error - ${updateError.message}`);
      } else {
        console.log(`✅ Step ${step.step_order}: ${enrichedContent.type} enriquecido`);
        console.log(`   "${enrichedContent.question.substring(0, 70)}..."`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN\n');
    
    const { data: verifySteps } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', MODULE_ID);

    const typeCounts = {};
    verifySteps.forEach(s => {
      const type = s.enriched_content?.type || 'sin_tipo';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    console.log('Distribución de tipos:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count} steps`);
    });

    const allHaveType = verifySteps.every(s => s.enriched_content?.type);
    
    console.log(`\n${allHaveType ? '✨' : '⚠️'} Estado: ${allHaveType ? 'Todos los steps tienen tipo correcto' : 'Hay steps sin tipo'}`);
    console.log('\n💡 Reinicia el servidor para recargar el caché.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enrichAllSteps()
  .then(() => {
    console.log('\n✅ Enriquecimiento completado\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
