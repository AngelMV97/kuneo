// Verificar estado final de English después del enrichment
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyEnglishFinal() {
  console.log('\n🔍 VERIFICACIÓN FINAL - ENGLISH\n');
  console.log('='.repeat(60));
  
  // Obtener módulos English
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, grade_range, difficulty')
    .eq('subject', 'english')
    .order('difficulty');
  
  console.log(`📦 Total módulos English: ${modules.length}\n`);
  
  // Obtener steps en lotes
  let allSteps = [];
  const batchSize = 100;
  const moduleIds = modules.map(m => m.id);
  
  for (let i = 0; i < moduleIds.length; i += batchSize) {
    const batch = moduleIds.slice(i, i + batchSize);
    const { data } = await supabase
      .from('module_steps')
      .select('id, module_id, step_order, enriched_content')
      .in('module_id', batch);
    
    if (data) allSteps = allSteps.concat(data);
  }
  
  const enrichedSteps = allSteps.filter(s => s.enriched_content !== null);
  const pendingSteps = allSteps.filter(s => s.enriched_content === null);
  
  console.log('📊 TOTALES:');
  console.log(`   Total steps: ${allSteps.length}`);
  console.log(`   ✅ Enriquecidos: ${enrichedSteps.length} (${(enrichedSteps.length/allSteps.length*100).toFixed(1)}%)`);
  console.log(`   ⏳ Pendientes: ${pendingSteps.length}`);
  
  // Agrupar por módulo
  const moduleStepCounts = {};
  allSteps.forEach(step => {
    if (!moduleStepCounts[step.module_id]) {
      moduleStepCounts[step.module_id] = { total: 0, enriched: 0 };
    }
    moduleStepCounts[step.module_id].total++;
    if (step.enriched_content !== null) {
      moduleStepCounts[step.module_id].enriched++;
    }
  });
  
  const completeModules = Object.entries(moduleStepCounts)
    .filter(([_, counts]) => counts.enriched === counts.total && counts.total > 0)
    .map(([moduleId, counts]) => {
      const module = modules.find(m => m.id === moduleId);
      return { ...module, stepCount: counts.total };
    });
  
  const partialModules = Object.values(moduleStepCounts).filter(m => m.enriched > 0 && m.enriched < m.total).length;
  const emptyModules = Object.values(moduleStepCounts).filter(m => m.enriched === 0).length;
  
  console.log(`\n📦 DISTRIBUCIÓN POR MÓDULOS:`);
  console.log(`   ✅ Completos (100%): ${completeModules.length}`);
  console.log(`   ⚠️  Parciales: ${partialModules}`);
  console.log(`   ❌ Vacíos: ${emptyModules}`);
  
  if (completeModules.length > 0) {
    console.log(`\n✅ MÓDULOS COMPLETOS DISPONIBLES PARA TESTING:\n`);
    
    // Agrupar por difficulty
    const byDifficulty = {};
    completeModules.forEach(m => {
      if (!byDifficulty[m.difficulty]) byDifficulty[m.difficulty] = [];
      byDifficulty[m.difficulty].push(m);
    });
    
    Object.entries(byDifficulty).sort((a, b) => a[0] - b[0]).forEach(([diff, mods]) => {
      console.log(`   📊 Difficulty ${diff}: ${mods.length} módulos`);
      if (mods.length <= 10) {
        mods.forEach(m => {
          console.log(`      - ${m.title} (${m.stepCount} steps)`);
        });
      } else {
        mods.slice(0, 5).forEach(m => {
          console.log(`      - ${m.title} (${m.stepCount} steps)`);
        });
        console.log(`      ... y ${mods.length - 5} más`);
      }
    });
    
    console.log(`\n🎯 RECOMENDACIÓN PARA TESTING:`);
    console.log(`   Usar primeros 3-5 módulos de difficulty 1`);
    const testModules = completeModules.filter(m => m.difficulty === 1).slice(0, 5);
    console.log(`\n   IDs sugeridos:`);
    testModules.forEach((m, i) => {
      console.log(`   ${i+1}. ${m.id} - "${m.title}"`);
    });
  } else {
    console.log(`\n⚠️  No hay módulos completos disponibles para testing`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ VERIFICACIÓN COMPLETADA\n`);
}

verifyEnglishFinal()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
