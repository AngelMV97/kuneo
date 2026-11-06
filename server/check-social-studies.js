require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkSocialStudies() {
  console.log('\n========================================');
  console.log('SOCIAL STUDIES - ESTADO ACTUAL');
  console.log('========================================\n');

  try {
    // 1. Get all Social Studies modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, grade_range, difficulty, is_active')
      .eq('subject', 'social_studies')
      .order('difficulty', { ascending: true })
      .order('grade_range', { ascending: true });

    if (modulesError) throw modulesError;

    console.log(`📚 Total módulos: ${modules.length}`);
    
    // 2. Get all steps for Social Studies
    const moduleIds = modules.map(m => m.id);
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, module_id, enriched_content, enrichment_status')
      .in('module_id', moduleIds);

    if (stepsError) throw stepsError;

    console.log(`📝 Total steps: ${steps.length}`);
    
    // 3. Count enriched steps
    const enrichedSteps = steps.filter(s => s.enriched_content !== null);
    console.log(`✅ Steps enriquecidos: ${enrichedSteps.length} (${((enrichedSteps.length / steps.length) * 100).toFixed(1)}%)`);
    console.log(`⏳ Steps pendientes: ${steps.length - enrichedSteps.length}`);

    // 4. Analyze by difficulty
    console.log('\n📊 Distribución por dificultad:');
    const byDifficulty = {};
    for (const module of modules) {
      if (!byDifficulty[module.difficulty]) {
        byDifficulty[module.difficulty] = { total: 0, active: 0 };
      }
      byDifficulty[module.difficulty].total++;
      if (module.is_active) byDifficulty[module.difficulty].active++;
    }
    
    for (let diff = 1; diff <= 5; diff++) {
      const data = byDifficulty[diff] || { total: 0, active: 0 };
      console.log(`  Dificultad ${diff}: ${data.active}/${data.total} módulos activos`);
    }

    // 5. Analyze by grade_range
    console.log('\n📊 Distribución por grado:');
    const byGrade = {};
    for (const module of modules) {
      const grade = module.grade_range || 'unknown';
      if (!byGrade[grade]) byGrade[grade] = 0;
      byGrade[grade]++;
    }
    
    Object.keys(byGrade).sort().forEach(grade => {
      console.log(`  Grado ${grade}: ${byGrade[grade]} módulos`);
    });

    // 6. Find modules with steps to calculate average steps per module
    const stepsPerModule = {};
    for (const step of steps) {
      if (!stepsPerModule[step.module_id]) stepsPerModule[step.module_id] = { total: 0, enriched: 0 };
      stepsPerModule[step.module_id].total++;
      if (step.enriched_content) stepsPerModule[step.module_id].enriched++;
    }

    const modulesWithSteps = Object.keys(stepsPerModule).length;
    const avgStepsPerModule = (steps.length / modulesWithSteps).toFixed(1);
    
    console.log(`\n📐 Promedio steps por módulo: ${avgStepsPerModule}`);
    console.log(`📦 Módulos con steps: ${modulesWithSteps}/${modules.length}`);

    // 7. Count complete modules (all steps enriched)
    const completeModules = Object.keys(stepsPerModule).filter(moduleId => {
      const data = stepsPerModule[moduleId];
      return data.enriched === data.total && data.total > 0;
    });
    
    console.log(`✅ Módulos completos (100% enriquecidos): ${completeModules.length}`);

    // 8. Show first 5 modules as examples for enrichment
    console.log('\n🎯 Primeros 5 módulos (ejemplos para testing):');
    const first5 = modules.slice(0, 5);
    for (const module of first5) {
      const stepData = stepsPerModule[module.id] || { total: 0, enriched: 0 };
      console.log(`  - ${module.id}`);
      console.log(`    Título: "${module.title}"`);
      console.log(`    Dificultad: ${module.difficulty}, Grado: ${module.grade_range}`);
      console.log(`    Steps: ${stepData.enriched}/${stepData.total} enriquecidos`);
    }

    // 9. Estimate enrichment effort
    const stepsToEnrich = steps.length - enrichedSteps.length;
    const estimatedTime = Math.ceil((stepsToEnrich * 2) / 60); // 2 seconds per step
    console.log(`\n⏱️  Tiempo estimado para enriquecer todo: ~${estimatedTime} minutos`);
    
    // For 50 modules
    const stepsFor50Modules = Math.ceil(50 * parseFloat(avgStepsPerModule));
    const timeFor50 = Math.ceil((stepsFor50Modules * 2) / 60);
    console.log(`⏱️  Tiempo para 50 módulos (~${stepsFor50Modules} steps): ~${timeFor50} minutos`);

    console.log('\n========================================');
    console.log('ANÁLISIS COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkSocialStudies();
