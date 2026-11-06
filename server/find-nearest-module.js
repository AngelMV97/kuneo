require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findNearestCompleteModule(subject) {
  console.log(`\n========================================`);
  console.log(`${subject.toUpperCase()} - MÓDULO MÁS CERCANO A COMPLETARSE`);
  console.log(`========================================\n`);

  try {
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, difficulty, grade_range')
      .eq('subject', subject)
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

      // Solo incluir módulos con al menos 50% enriquecido
      if (percentage >= 50 && enrichedSteps < totalSteps) {
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
      const percentDiff = parseFloat(b.percentage) - parseFloat(a.percentage);
      if (percentDiff !== 0) return percentDiff;
      return a.pendingSteps - b.pendingSteps;
    });

    console.log(`✅ Módulos 50%+ completitud: ${modulesWithProgress.length}\n`);

    if (modulesWithProgress.length === 0) {
      console.log('⚠️  No hay módulos con 50%+ de completitud');
      console.log('   Buscando cualquier módulo con progreso...\n');
      
      // Buscar cualquier módulo con progreso
      const anyProgress = [];
      for (const module of modules) {
        const { data: steps } = await supabase
          .from('module_steps')
          .select('id, enriched_content')
          .eq('module_id', module.id);

        if (!steps || steps.length === 0) continue;

        const enrichedSteps = steps.filter(s => s.enriched_content !== null).length;
        if (enrichedSteps > 0 && enrichedSteps < steps.length) {
          anyProgress.push({
            id: module.id,
            title: module.title,
            difficulty: module.difficulty,
            grade_range: module.grade_range,
            totalSteps: steps.length,
            enrichedSteps,
            pendingSteps: steps.length - enrichedSteps,
            percentage: ((enrichedSteps / steps.length) * 100).toFixed(1)
          });
        }
      }

      anyProgress.sort((a, b) => {
        const percentDiff = parseFloat(b.percentage) - parseFloat(a.percentage);
        if (percentDiff !== 0) return percentDiff;
        return a.pendingSteps - b.pendingSteps;
      });

      if (anyProgress.length > 0) {
        console.log(`🎯 MEJOR MÓDULO (${anyProgress[0].percentage}% completo):\n`);
        const best = anyProgress[0];
        console.log(`   ID: ${best.id}`);
        console.log(`   "${best.title}"`);
        console.log(`   Dificultad: ${best.difficulty} | Grado: ${best.grade_range}`);
        console.log(`   Progreso: ${best.enrichedSteps}/${best.totalSteps} steps`);
        console.log(`   Faltan: ${best.pendingSteps} steps\n`);
        return;
      } else {
        console.log('❌ No se encontraron módulos con progreso parcial\n');
        return;
      }
    }

    console.log('🎯 TOP 5 MÓDULOS MÁS CERCANOS:\n');
    modulesWithProgress.slice(0, 5).forEach((mod, i) => {
      console.log(`   ${i + 1}. [${mod.percentage}%] ${mod.enrichedSteps}/${mod.totalSteps} steps (faltan ${mod.pendingSteps})`);
      console.log(`      ID: ${mod.id}`);
      console.log(`      "${mod.title}"`);
      console.log(`      Dificultad: ${mod.difficulty} | Grado: ${mod.grade_range}\n`);
    });

    const best = modulesWithProgress[0];
    console.log('💡 RECOMENDACIÓN:\n');
    console.log(`   Completar módulo: ${best.id}`);
    console.log(`   Requiere enriquecer: ${best.pendingSteps} steps`);
    console.log(`   Tiempo estimado: ~${best.pendingSteps * 2} segundos\n`);

    console.log('========================================');
    console.log('ANÁLISIS COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

const subject = process.argv[2] || 'language';
findNearestCompleteModule(subject);
