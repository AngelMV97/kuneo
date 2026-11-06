require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function analyzeErrors() {
  console.log('\n========================================');
  console.log('SOCIAL STUDIES - ANÁLISIS DE CALIDAD');
  console.log('========================================\n');

  try {
    // Get all Social Studies modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, difficulty')
      .eq('subject', 'social_studies');

    if (modulesError) throw modulesError;

    const moduleIds = modules.map(m => m.id);

    // Get all steps
    const { data: allSteps, error: allStepsError } = await supabase
      .from('module_steps')
      .select('id, module_id, step_order, enriched_content')
      .in('module_id', moduleIds);

    if (allStepsError) throw allStepsError;

    // Count enriched vs not enriched
    const enriched = allSteps.filter(s => s.enriched_content !== null);
    const notEnriched = allSteps.filter(s => s.enriched_content === null);

    console.log('📊 RESUMEN GENERAL:');
    console.log(`   Total steps: ${allSteps.length}`);
    console.log(`   ✅ Enriquecidos: ${enriched.length} (${((enriched.length / allSteps.length) * 100).toFixed(1)}%)`);
    console.log(`   ⏳ Sin enriquecer: ${notEnriched.length} (${((notEnriched.length / allSteps.length) * 100).toFixed(1)}%)`);

    // Validate enriched content structure
    let validCount = 0;
    let invalidCount = 0;
    const invalidReasons = {};

    enriched.forEach(step => {
      const content = step.enriched_content;
      
      // Check required fields
      if (!content.cognitive_dimension) {
        invalidCount++;
        invalidReasons['missing_cognitive_dimension'] = (invalidReasons['missing_cognitive_dimension'] || 0) + 1;
        return;
      }
      
      if (!content.expected_answer) {
        invalidCount++;
        invalidReasons['missing_expected_answer'] = (invalidReasons['missing_expected_answer'] || 0) + 1;
        return;
      }

      // Check expected_answer structure
      const ans = content.expected_answer;
      if (typeof ans !== 'object') {
        invalidCount++;
        invalidReasons['invalid_expected_answer_type'] = (invalidReasons['invalid_expected_answer_type'] || 0) + 1;
        return;
      }

      validCount++;
    });

    console.log('\n✅ VALIDACIÓN DE ESTRUCTURA:');
    console.log(`   Válidos: ${validCount}/${enriched.length} (${((validCount / enriched.length) * 100).toFixed(1)}%)`);
    console.log(`   Inválidos: ${invalidCount}/${enriched.length} (${((invalidCount / enriched.length) * 100).toFixed(1)}%)`);

    if (invalidCount > 0) {
      console.log('\n⚠️  RAZONES DE INVALIDEZ:');
      Object.entries(invalidReasons).forEach(([reason, count]) => {
        console.log(`   - ${reason}: ${count}`);
      });
    }

    // Count complete modules
    const stepsPerModule = {};
    allSteps.forEach(step => {
      if (!stepsPerModule[step.module_id]) {
        stepsPerModule[step.module_id] = { total: 0, enriched: 0 };
      }
      stepsPerModule[step.module_id].total++;
      if (step.enriched_content) {
        stepsPerModule[step.module_id].enriched++;
      }
    });

    const completeModules = Object.entries(stepsPerModule).filter(([moduleId, data]) => {
      return data.enriched === data.total && data.total > 0;
    });

    const partialModules = Object.entries(stepsPerModule).filter(([moduleId, data]) => {
      return data.enriched > 0 && data.enriched < data.total;
    });

    const emptyModules = Object.entries(stepsPerModule).filter(([moduleId, data]) => {
      return data.enriched === 0 && data.total > 0;
    });

    console.log('\n📦 MÓDULOS:');
    console.log(`   ✅ Completos (100%): ${completeModules.length}`);
    console.log(`   🔄 Parciales (1-99%): ${partialModules.length}`);
    console.log(`   ⏳ Vacíos (0%): ${emptyModules.length}`);

    // Show first 5 complete modules for testing
    if (completeModules.length > 0) {
      console.log('\n🎯 PRIMEROS 5 MÓDULOS COMPLETOS (para testing):');
      const first5Complete = completeModules.slice(0, 5).map(([moduleId]) => moduleId);
      
      for (const moduleId of first5Complete) {
        const module = modules.find(m => m.id === moduleId);
        const data = stepsPerModule[moduleId];
        console.log(`   - ${moduleId}`);
        console.log(`     Título: "${module.title}"`);
        console.log(`     Dificultad: ${module.difficulty}`);
        console.log(`     Steps: ${data.enriched}/${data.total}`);
      }
    } else {
      console.log('\n⚠️  No hay módulos completos disponibles para testing');
    }

    // Analyze cognitive dimensions distribution
    const dimensions = {};
    enriched.forEach(step => {
      if (step.enriched_content && step.enriched_content.cognitive_dimension) {
        const dim = step.enriched_content.cognitive_dimension;
        dimensions[dim] = (dimensions[dim] || 0) + 1;
      }
    });

    console.log('\n📊 DIMENSIONES COGNITIVAS:');
    Object.entries(dimensions)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dim, count]) => {
        console.log(`   - ${dim}: ${count} (${((count / enriched.length) * 100).toFixed(1)}%)`);
      });

    console.log('\n========================================');
    console.log('ANÁLISIS COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

analyzeErrors();
