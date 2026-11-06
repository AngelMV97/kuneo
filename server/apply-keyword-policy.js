require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

// Política de min_keywords por grupo de grados
const GRADE_KEYWORD_POLICY = {
  '1-3': {
    step3: 0.20,  // 20% - Niños pequeños, vocabulario limitado
    step8: 0.15   // 15% - Metacognición básica
  },
  '4-5': {
    step3: 0.30,  // 30% - Mayor dominio lingüístico
    step8: 0.25   // 25% - Reflexión más estructurada
  },
  '6-7': {
    step3: 0.30,  // 30% - Consolidación de conceptos
    step8: 0.25   // 25% - Análisis crítico inicial
  },
  '8-9': {
    step3: 0.35,  // 35% - Pensamiento abstracto
    step8: 0.30   // 30% - Metacognición profunda
  },
  '10-11': {
    step3: 0.40,  // 40% - Pensamiento crítico avanzado
    step8: 0.35   // 35% - Reflexión sofisticada
  }
};

async function applyKeywordPolicy() {
  console.log('🔧 Aplicando política de min_keywords a todos los módulos...\n');
  console.log('📋 Política definida:');
  Object.entries(GRADE_KEYWORD_POLICY).forEach(([grade, policy]) => {
    console.log(`   Grade ${grade}: Step 3=${policy.step3*100}%, Step 8=${policy.step8*100}%`);
  });
  console.log('\n' + '═'.repeat(80) + '\n');

  // Obtener todos los módulos
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, grade_range, subject')
    .eq('is_active', true);

  if (modulesError) {
    console.error('❌ Error obteniendo módulos:', modulesError.message);
    process.exit(1);
  }

  console.log(`📦 Encontrados ${modules.length} módulos activos\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const module of modules) {
    const policy = GRADE_KEYWORD_POLICY[module.grade_range];
    
    if (!policy) {
      console.log(`⚠️  Módulo ${module.id} (${module.grade_range}): Sin política definida`);
      skippedCount++;
      continue;
    }

    // Obtener steps 3 y 8 con tipo keywords
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', module.id)
      .in('step_order', [3, 8]);

    if (stepsError || !steps || steps.length === 0) {
      continue;
    }

    for (const step of steps) {
      const content = step.enriched_content;
      
      // Solo procesar steps de tipo keywords
      if (!content || content.type !== 'keywords') {
        continue;
      }

      // Obtener keywords del lugar correcto
      const keywords = content.expected_answer?.keywords || 
                      content.expected_answer?.required_keywords || 
                      content.keywords || [];

      if (keywords.length === 0) {
        continue;
      }

      // Calcular nuevo min_keywords según política
      const percentage = step.step_order === 3 ? policy.step3 : policy.step8;
      const oldMin = content.expected_answer?.min_keywords || 
                     content.min_keywords || 
                     Math.ceil(keywords.length * 0.75);
      const newMin = Math.max(1, Math.floor(keywords.length * percentage));

      // Solo actualizar si cambió
      if (oldMin !== newMin) {
        // Actualizar min_keywords en expected_answer
        if (!content.expected_answer) {
          content.expected_answer = {};
        }
        content.expected_answer.min_keywords = newMin;

        // Guardar
        const { error: updateError } = await supabase
          .from('module_steps')
          .update({ enriched_content: content })
          .eq('id', step.id);

        if (updateError) {
          console.log(`   ❌ Error en step ${step.step_order}: ${updateError.message}`);
        } else {
          console.log(`   ✅ Grade ${module.grade_range}, Step ${step.step_order}: ${oldMin} → ${newMin} (${keywords.length} keywords × ${Math.round(percentage*100)}%)`);
          updatedCount++;
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`✅ Política aplicada exitosamente`);
  console.log(`   📊 Módulos procesados: ${modules.length}`);
  console.log(`   ✏️  Steps actualizados: ${updatedCount}`);
  console.log(`   ⏭️  Steps sin cambios: ${skippedCount}`);
  
  process.exit(0);
}

applyKeywordPolicy().catch(console.error);
