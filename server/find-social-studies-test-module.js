require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findBestTestModule() {
  console.log('\n========================================');
  console.log('SOCIAL STUDIES - BUSCAR MÓDULO PARA TESTING');
  console.log('========================================\n');

  try {
    // Get all Social Studies modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, difficulty, grade_range')
      .eq('subject', 'social_studies');

    if (modulesError) throw modulesError;

    const moduleIds = modules.map(m => m.id);

    // Get all steps
    const { data: allSteps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, module_id, step_order, enriched_content')
      .in('module_id', moduleIds);

    if (stepsError) throw stepsError;

    // Group by module
    const moduleSteps = {};
    allSteps.forEach(step => {
      if (!moduleSteps[step.module_id]) {
        moduleSteps[step.module_id] = { total: 0, enriched: 0, steps: [] };
      }
      moduleSteps[step.module_id].total++;
      moduleSteps[step.module_id].steps.push(step);
      if (step.enriched_content) {
        moduleSteps[step.module_id].enriched++;
      }
    });

    // Find complete modules with 5+ steps
    const completeModules = Object.entries(moduleSteps)
      .filter(([moduleId, data]) => {
        return data.enriched === data.total && data.total >= 5;
      })
      .map(([moduleId, data]) => {
        const module = modules.find(m => m.id === moduleId);
        return {
          id: moduleId,
          title: module.title,
          difficulty: module.difficulty,
          grade_range: module.grade_range,
          stepCount: data.total,
          enrichedCount: data.enriched
        };
      })
      .sort((a, b) => b.stepCount - a.stepCount); // Sort by step count descending

    console.log(`🔍 Módulos completos con 5+ steps: ${completeModules.length}`);

    if (completeModules.length > 0) {
      console.log('\n🎯 MEJOR CANDIDATO PARA TESTING:');
      const best = completeModules[0];
      console.log(`   ID: ${best.id}`);
      console.log(`   Título: "${best.title}"`);
      console.log(`   Dificultad: ${best.difficulty}`);
      console.log(`   Grado: ${best.grade_range}`);
      console.log(`   Steps: ${best.stepCount} (100% enriquecidos)`);

      // Get dimensions for this module
      const moduleStepData = moduleSteps[best.id];
      const dimensions = new Set();
      moduleStepData.steps.forEach(step => {
        if (step.enriched_content && step.enriched_content.cognitive_dimension) {
          dimensions.add(step.enriched_content.cognitive_dimension);
        }
      });

      console.log(`   Dimensiones únicas: ${dimensions.size}`);
      console.log(`   Dimensiones: ${Array.from(dimensions).join(', ')}`);

      console.log('\n📋 TOP 5 MÓDULOS COMPLETOS:');
      completeModules.slice(0, 5).forEach((mod, i) => {
        console.log(`   ${i + 1}. ${mod.id}`);
        console.log(`      "${mod.title}" | Dif: ${mod.difficulty} | Steps: ${mod.stepCount}`);
      });
    } else {
      console.log('\n⚠️  No hay módulos completos con 5+ steps');
      console.log('\n📋 MÓDULOS COMPLETOS (cualquier tamaño):');
      
      const anyCompleteModules = Object.entries(moduleSteps)
        .filter(([moduleId, data]) => data.enriched === data.total && data.total > 0)
        .map(([moduleId, data]) => {
          const module = modules.find(m => m.id === moduleId);
          return {
            id: moduleId,
            title: module.title,
            difficulty: module.difficulty,
            stepCount: data.total
          };
        })
        .sort((a, b) => b.stepCount - a.stepCount);

      anyCompleteModules.slice(0, 10).forEach((mod, i) => {
        console.log(`   ${i + 1}. ${mod.id}`);
        console.log(`      "${mod.title}" | Dif: ${mod.difficulty} | Steps: ${mod.stepCount}`);
      });
    }

    console.log('\n========================================');
    console.log('BÚSQUEDA COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

findBestTestModule();
