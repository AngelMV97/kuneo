/**
 * Script para normalizar los steps 1-3 y 7-8 del módulo de organizaciones sociales
 * Convertir de formato antiguo a formato nuevo
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

async function normalizeSteps() {
  console.log('🔧 Normalizando steps del módulo de organizaciones sociales...\n');

  try {
    // Obtener todos los steps
    const { data: steps, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', MODULE_ID)
      .order('step_order', { ascending: true });

    if (stepsError) throw stepsError;

    const stepsToNormalize = [1, 2, 3, 7, 8]; // Steps que necesitan normalización
    
    for (const step of steps) {
      if (!stepsToNormalize.includes(step.step_order)) {
        console.log(`⏭️  Step ${step.step_order}: Ya está en formato correcto, omitiendo...`);
        continue;
      }

      const ec = step.enriched_content;
      
      console.log(`\n🔧 Normalizando Step ${step.step_order}...`);
      console.log(`   Tipo actual: ${ec.type}`);

      let normalizedContent = { ...ec };

      // Normalizar según tipo
      if (ec.type === 'multiple_choice') {
        // El step ya tiene estructura correcta, solo asegurar que expected_answer tenga evaluation_strategy
        const correctIndex = ec.expected_answer?.correct_options?.[0] ?? 0;
        
        normalizedContent = {
          ...ec,
          type: 'option', // Cambiar tipo de multiple_choice a option
          expected_answer: {
            ...ec.expected_answer,
            type: 'option',
            evaluation_strategy: 'option',
            correct_options: ec.expected_answer?.correct_options || [correctIndex],
            explanation: ec.tutor_responses?.correct?.[0] || 'Correcto!',
            misconceptions: ec.expected_answer?.misconceptions || []
          }
        };

        console.log(`   ✅ Convertido a 'option' con respuesta correcta: índice ${correctIndex}`);

      } else if (ec.type === 'open_text') {
        // Para open_text, convertir a 'keywords'
        let keywords = [];
        
        if (ec.expected_answer?.keywords && Array.isArray(ec.expected_answer.keywords)) {
          keywords = ec.expected_answer.keywords;
        } else {
          // Usar palabras clave genéricas para preguntas abiertas sobre organizaciones
          keywords = ['organización', 'organizarse', 'juntos', 'juntas', 'colaborar', 'ayudar', 'compartir', 'trabajar'];
        }
        
        normalizedContent = {
          ...ec,
          type: 'keywords',
          expected_answer: {
            ...ec.expected_answer,
            type: 'keywords',
            keywords: keywords,
            evaluation_strategy: 'keywords',
            explanation: ec.tutor_responses?.correct?.[0] || 'Muy bien! Has identificado conceptos clave.',
            misconceptions: ec.expected_answer?.misconceptions || []
          }
        };

        console.log(`   ✅ Convertido a 'keywords' con ${keywords.length} palabras clave: ${keywords.slice(0, 3).join(', ')}...`);
      }

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .update({ enriched_content: normalizedContent })
        .eq('id', step.id);

      if (updateError) {
        console.error(`   ❌ Error actualizando step ${step.step_order}:`, updateError);
      } else {
        console.log(`   💾 Step ${step.step_order} actualizado en DB`);
      }
    }

    console.log('\n\n✅ Normalización completada!');
    console.log('\n💡 Reinicia el servidor para cargar los cambios en caché.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

normalizeSteps()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
