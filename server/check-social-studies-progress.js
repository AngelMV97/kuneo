require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkProgress() {
  console.log('\n========================================');
  console.log('SOCIAL STUDIES - PROGRESO EN TIEMPO REAL');
  console.log('========================================\n');

  try {
    // Get all Social Studies modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id')
      .eq('subject', 'social_studies');

    if (modulesError) throw modulesError;

    const moduleIds = modules.map(m => m.id);

    // Get enriched steps count
    const { data: enrichedSteps, error: enrichedError } = await supabase
      .from('module_steps')
      .select('id, module_id, enriched_content, cognitive_type', { count: 'exact' })
      .in('module_id', moduleIds)
      .not('enriched_content', 'is', null);

    if (enrichedError) throw enrichedError;

    // Get total steps count
    const { count: totalSteps, error: totalError } = await supabase
      .from('module_steps')
      .select('id', { count: 'exact', head: true })
      .in('module_id', moduleIds);

    if (totalError) throw totalError;

    const enrichedCount = enrichedSteps.length;
    const percentage = ((enrichedCount / totalSteps) * 100).toFixed(1);
    const remaining = totalSteps - enrichedCount;

    console.log(`✅ Steps enriquecidos: ${enrichedCount}/${totalSteps} (${percentage}%)`);
    console.log(`⏳ Steps restantes: ${remaining}`);

    // Calculate time remaining (assuming 2 seconds per step)
    const secondsRemaining = remaining * 2;
    const minutesRemaining = Math.ceil(secondsRemaining / 60);
    console.log(`⏱️  Tiempo estimado restante: ~${minutesRemaining} minutos`);

    // Analyze cognitive dimensions
    const dimensionCounts = {};
    enrichedSteps.forEach(step => {
      if (step.enriched_content && step.enriched_content.cognitive_dimension) {
        const dim = step.enriched_content.cognitive_dimension;
        dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
      }
    });

    console.log('\n📊 Dimensiones cognitivas detectadas:');
    Object.entries(dimensionCounts).sort((a, b) => b[1] - a[1]).forEach(([dim, count]) => {
      console.log(`  - ${dim}: ${count} steps (${((count / enrichedCount) * 100).toFixed(1)}%)`);
    });

    // Count complete modules
    const stepsPerModule = {};
    const { data: allSteps, error: allStepsError } = await supabase
      .from('module_steps')
      .select('module_id, enriched_content')
      .in('module_id', moduleIds);

    if (allStepsError) throw allStepsError;

    allSteps.forEach(step => {
      if (!stepsPerModule[step.module_id]) {
        stepsPerModule[step.module_id] = { total: 0, enriched: 0 };
      }
      stepsPerModule[step.module_id].total++;
      if (step.enriched_content) {
        stepsPerModule[step.module_id].enriched++;
      }
    });

    const completeModules = Object.keys(stepsPerModule).filter(moduleId => {
      const data = stepsPerModule[moduleId];
      return data.enriched === data.total && data.total > 0;
    }).length;

    console.log(`\n📦 Módulos completos: ${completeModules}/${modules.length}`);

    // Progress bar
    const barLength = 40;
    const filledLength = Math.floor((enrichedCount / totalSteps) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`\n[${bar}] ${percentage}%`);

    console.log('\n========================================');
    console.log('MONITOREO COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkProgress();
