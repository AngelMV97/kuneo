require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findRealCompleteModules() {
  console.log('\n========================================');
  console.log('VERIFICAR MÓDULOS COMPLETOS REALES');
  console.log('========================================\n');

  try {
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, difficulty, grade_range')
      .eq('subject', 'social_studies');

    if (modulesError) throw modulesError;

    console.log('Verificando cada módulo individualmente...\n');

    const completeModules = [];

    for (const module of modules) {
      const { data: steps, error: stepsError } = await supabase
        .from('module_steps')
        .select('id, step_order, enriched_content')
        .eq('module_id', module.id)
        .order('step_order');

      if (stepsError) continue;

      const totalSteps = steps.length;
      const enrichedSteps = steps.filter(s => s.enriched_content !== null).length;

      if (totalSteps > 0 && enrichedSteps === totalSteps) {
        completeModules.push({
          id: module.id,
          title: module.title,
          difficulty: module.difficulty,
          grade_range: module.grade_range,
          totalSteps,
          enrichedSteps
        });
      }
    }

    console.log(`✅ Módulos 100% completos: ${completeModules.length}\n`);

    // Sort by step count descending
    completeModules.sort((a, b) => b.totalSteps - a.totalSteps);

    console.log('📋 TOP 10 MÓDULOS COMPLETOS:');
    completeModules.slice(0, 10).forEach((mod, i) => {
      console.log(`\n   ${i + 1}. ID: ${mod.id}`);
      console.log(`      Título: "${mod.title}"`);
      console.log(`      Dificultad: ${mod.difficulty} | Grado: ${mod.grade_range}`);
      console.log(`      Steps: ${mod.totalSteps}/${mod.totalSteps} (100%)`);
    });

    if (completeModules.length > 0) {
      console.log('\n🎯 MEJOR MÓDULO PARA TESTING:');
      const best = completeModules[0];
      console.log(`   ${best.id}`);
      console.log(`   "${best.title}"`);
      console.log(`   ${best.totalSteps} steps completos\n`);
    }

    console.log('========================================');
    console.log('VERIFICACIÓN COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

findRealCompleteModules();
