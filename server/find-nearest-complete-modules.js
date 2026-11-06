require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findNearestCompleteModules() {
  console.log('\n========================================');
  console.log('SOCIAL STUDIES - MÓDULOS MÁS CERCANOS A COMPLETARSE');
  console.log('========================================\n');

  try {
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, difficulty, grade_range')
      .eq('subject', 'social_studies')
      .eq('is_active', true);

    if (modulesError) throw modulesError;

    console.log(`Analizando ${modules.length} módulos...\n`);

    const modulesWithProgress = [];

    for (const module of modules) {
      const { data: steps, error: stepsError } = await supabase
        .from('module_steps')
        .select('id, step_order, enriched_content')
        .eq('module_id', module.id)
        .order('step_order');

      if (stepsError) continue;

      const totalSteps = steps.length;
      if (totalSteps === 0) continue;

      const enrichedSteps = steps.filter(s => s.enriched_content !== null).length;
      const percentage = (enrichedSteps / totalSteps) * 100;

      // Solo incluir módulos con al menos 1 step enriquecido
      if (enrichedSteps > 0) {
        modulesWithProgress.push({
          id: module.id,
          title: module.title,
          difficulty: module.difficulty,
          grade_range: module.grade_range,
          totalSteps,
          enrichedSteps,
          pendingSteps: totalSteps - enrichedSteps,
          percentage: percentage.toFixed(1)
        });
      }
    }

    // Sort by percentage (descending), then by pending steps (ascending)
    modulesWithProgress.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return parseFloat(b.percentage) - parseFloat(a.percentage);
      }
      return a.pendingSteps - b.pendingSteps;
    });

    console.log(`✅ Módulos con progreso: ${modulesWithProgress.length}\n`);

    console.log('📊 DISTRIBUCIÓN POR COMPLETITUD:');
    const complete = modulesWithProgress.filter(m => m.percentage === '100.0').length;
    const high = modulesWithProgress.filter(m => parseFloat(m.percentage) >= 75 && parseFloat(m.percentage) < 100).length;
    const medium = modulesWithProgress.filter(m => parseFloat(m.percentage) >= 50 && parseFloat(m.percentage) < 75).length;
    const low = modulesWithProgress.filter(m => parseFloat(m.percentage) < 50).length;

    console.log(`   100%: ${complete} módulos`);
    console.log(`   75-99%: ${high} módulos`);
    console.log(`   50-74%: ${medium} módulos`);
    console.log(`   1-49%: ${low} módulos\n`);

    console.log('🎯 TOP 15 MÓDULOS MÁS CERCANOS A COMPLETARSE:\n');
    modulesWithProgress.slice(0, 15).forEach((mod, i) => {
      console.log(`   ${i + 1}. [${mod.percentage}%] ${mod.enrichedSteps}/${mod.totalSteps} steps (faltan ${mod.pendingSteps})`);
      console.log(`      ID: ${mod.id}`);
      console.log(`      "${mod.title}"`);
      console.log(`      Dificultad: ${mod.difficulty} | Grado: ${mod.grade_range}\n`);
    });

    // Suggest best candidates for completion
    const bestCandidates = modulesWithProgress
      .filter(m => parseFloat(m.percentage) >= 50 && m.pendingSteps <= 5)
      .slice(0, 10);

    if (bestCandidates.length > 0) {
      console.log('💡 MEJOR ESTRATEGIA DE COMPLETITUD:');
      console.log(`   Completar ${bestCandidates.length} módulos requiere enriquecer ${bestCandidates.reduce((sum, m) => sum + m.pendingSteps, 0)} steps\n`);
      
      console.log('📋 MÓDULOS RECOMENDADOS PARA COMPLETAR:');
      bestCandidates.forEach((mod, i) => {
        console.log(`   ${i + 1}. ${mod.id} - ${mod.pendingSteps} steps faltantes (${mod.percentage}%)`);
      });
    } else {
      console.log('⚠️  No hay módulos con más de 50% de completitud');
      console.log('   Recomendación: Ajustar tests para módulos parciales o enriquecer más steps\n');
    }

    console.log('\n========================================');
    console.log('ANÁLISIS COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

findNearestCompleteModules();
