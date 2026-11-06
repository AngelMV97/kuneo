require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

// Expected answers para cada step
const EXPECTED_ANSWERS = {
  1: {
    type: 'option',
    expected_answer: {
      options: [
        'Usar aplicaciones creadas en otros países (WhatsApp, Netflix, TikTok)',
        'Consumir productos fabricados en diferentes continentes (ropa, electrónicos, alimentos)',
        'Acceder a información y noticias de todo el mundo en tiempo real',
        'Todas las anteriores'
      ],
      correct: 3 // "Todas las anteriores" - índice 3
    }
  },
  2: {
    type: 'option',
    expected_answer: {
      options: [
        'Comercio justo',
        'Cadenas globales de valor',
        'Economía local',
        'Mercado interno'
      ],
      correct: 1 // "Cadenas globales de valor" - índice 1
    }
  },
  3: {
    type: 'keywords',
    min_keywords: 16 // 48 keywords * 35% = 16
  },
  4: {
    type: 'multiple_select',
    expected_answer: {
      options: [
        'La popularidad mundial de géneros musicales como K-pop, reggaetón o hip-hop',
        'El acceso a películas, series y contenidos de diferentes países a través de plataformas digitales',
        'La fusión de gastronomías creando nuevos platos (sushi-burrito, pizza con ingredientes asiáticos)',
        'La desaparición total de todas las tradiciones locales en todos los países',
        'El aprendizaje de idiomas extranjeros facilitado por tecnología e intercambios',
        'La adopción de festividades de otras culturas (Halloween, Año Nuevo Chino)'
      ],
      correct: [0, 1, 2, 4, 5] // Todas excepto "desaparición total de tradiciones"
    }
  },
  5: {
    type: 'matching',
    expected_answer: {
      pairs: [
        {
          left: 'Globalización económica',
          right: 'Aumento del comercio internacional y deslocalización de empresas'
        },
        {
          left: 'Globalización cultural',
          right: 'Difusión de música, cine y valores de distintas sociedades'
        },
        {
          left: 'Globalización tecnológica',
          right: 'Acceso instantáneo a información y comunicación global vía internet'
        },
        {
          left: 'Globalización política',
          right: 'Coordinación entre gobiernos para resolver problemas transnacionales'
        }
      ]
    }
  },
  6: {
    type: 'ordering',
    expected_answer: {
      items: [
        'Grandes descubrimientos geográficos y establecimiento de rutas comerciales (siglos XV-XVI)',
        'Revolución Industrial y expansión del capitalismo (siglo XIX)',
        'Creación de organismos internacionales tras la Segunda Guerra Mundial (ONU, FMI, Banco Mundial)',
        'Caída del Muro de Berlín y fin de la Guerra Fría (1989-1991)',
        'Expansión de internet y revolución digital (década de 1990-2000)',
        'Integración económica global y auge del comercio electrónico (siglo XXI)'
      ],
      correct_order: [0, 1, 2, 3, 4, 5]
    }
  },
  7: {
    type: 'option',
    expected_answer: {
      options: [
        'Está generalizando negativamente sin considerar los efectos positivos ni la complejidad del fenómeno',
        'Tiene razón: la globalización solo genera problemas',
        'Está confundiendo globalización con colonialismo',
        'Está equivocado porque la globalización no afecta a los países pobres'
      ],
      correct: 0 // "Está generalizando negativamente..."
    }
  },
  8: {
    type: 'keywords',
    min_keywords: 19 // 65 keywords * 30% = 19
  }
};

async function fixModule89AllSteps() {
  console.log('🔧 Arreglando módulo 8-9: Globalización e Interdependencia Mundial\n');
  console.log('='.repeat(80));

  let fixedCount = 0;
  let errorCount = 0;

  for (let stepOrder = 1; stepOrder <= 8; stepOrder++) {
    console.log(`\nStep ${stepOrder}:`);

    // Obtener step actual
    const { data: step } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', MODULE_ID)
      .eq('step_order', stepOrder)
      .single();

    if (!step) {
      console.log(`  ❌ No se encontró el step ${stepOrder}`);
      errorCount++;
      continue;
    }

    const fixData = EXPECTED_ANSWERS[stepOrder];
    
    if (fixData.type === 'keywords') {
      // Solo actualizar min_keywords
      step.enriched_content.expected_answer.min_keywords = fixData.min_keywords;
      console.log(`  ✏️  Actualizando min_keywords a ${fixData.min_keywords}`);
    } else {
      // Agregar expected_answer completo
      step.enriched_content.expected_answer = fixData.expected_answer;
      console.log(`  ✏️  Agregando expected_answer (tipo: ${fixData.type})`);
    }

    // Actualizar en la base de datos
    const { error } = await supabase
      .from('module_steps')
      .update({ enriched_content: step.enriched_content })
      .eq('module_id', MODULE_ID)
      .eq('step_order', stepOrder);

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    } else {
      console.log(`  ✅ Step ${stepOrder} actualizado correctamente`);
      fixedCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Proceso completado:`);
  console.log(`   - Steps arreglados: ${fixedCount}/8`);
  console.log(`   - Errores: ${errorCount}`);
  
  if (fixedCount === 8) {
    console.log('\n💡 Módulo 8-9 ahora está completamente funcional');
    console.log('   Reinicia el servidor para cargar los cambios en caché');
  }
}

fixModule89AllSteps().catch(console.error);
