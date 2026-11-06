// Investigar módulos English con steps
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function investigateEnglishModules() {
  console.log('\n🔍 INVESTIGACIÓN DE MÓDULOS ENGLISH\n');
  console.log('='.repeat(60));
  
  // 1. Total módulos English
  const { data: allModules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, difficulty, grade_range')
    .eq('subject', 'english');
  
  if (modulesError) {
    console.error('❌ Error:', modulesError);
    return;
  }
  
  console.log(`📦 Total módulos English: ${allModules.length}\n`);
  
  // 2. Para cada módulo, contar steps
  const modulesWithSteps = [];
  const modulesWithoutSteps = [];
  
  for (const module of allModules) {
    const { count, error: countError } = await supabase
      .from('module_steps')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', module.id);
    
    if (countError) {
      console.error(`Error en módulo ${module.id}:`, countError);
      continue;
    }
    
    if (count > 0) {
      modulesWithSteps.push({ ...module, stepCount: count });
    } else {
      modulesWithoutSteps.push(module);
    }
  }
  
  console.log(`✅ Módulos CON steps: ${modulesWithSteps.length}`);
  console.log(`❌ Módulos SIN steps: ${modulesWithoutSteps.length}\n`);
  
  // 3. Distribución de difficulty en módulos con steps
  const difficultyDistribution = {};
  modulesWithSteps.forEach(m => {
    const diff = m.difficulty || 0;
    difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;
  });
  
  console.log('📊 Distribución de difficulty (módulos CON steps):\n');
  Object.keys(difficultyDistribution)
    .sort((a, b) => a - b)
    .forEach(diff => {
      console.log(`   Difficulty ${diff}: ${difficultyDistribution[diff]} módulos`);
    });
  
  // 4. Top 10 módulos con más steps
  modulesWithSteps.sort((a, b) => b.stepCount - a.stepCount);
  console.log('\n🔝 Top 10 módulos con más steps:\n');
  modulesWithSteps.slice(0, 10).forEach((m, i) => {
    console.log(`${i+1}. "${m.title}" (difficulty ${m.difficulty})`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Steps: ${m.stepCount} | Grade: ${m.grade_range}\n`);
  });
  
  // 5. Primeros 50 módulos CON steps por difficulty
  const first50WithSteps = modulesWithSteps
    .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
    .slice(0, 50);
  
  console.log(`\n📋 Primeros 50 módulos CON steps (por difficulty):\n`);
  console.log(`   Total steps en estos 50: ${first50WithSteps.reduce((sum, m) => sum + m.stepCount, 0)}`);
  console.log(`   Difficulty range: ${first50WithSteps[0]?.difficulty || 0} - ${first50WithSteps[49]?.difficulty || 0}\n`);
  
  // 6. Para estos 50, cuántos steps están enriquecidos
  let totalSteps = 0;
  let enrichedSteps = 0;
  
  for (const module of first50WithSteps.slice(0, 10)) { // Solo primeros 10 para no demorar
    const { data: steps } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', module.id);
    
    if (steps) {
      totalSteps += steps.length;
      enrichedSteps += steps.filter(s => s.enriched_content !== null).length;
    }
  }
  
  console.log(`📊 Sample de primeros 10 módulos con steps:`);
  console.log(`   Total steps: ${totalSteps}`);
  console.log(`   Enriquecidos: ${enrichedSteps} (${(enrichedSteps/totalSteps*100).toFixed(1)}%)\n`);
  
  // 7. Exportar IDs de primeros 50 módulos CON steps
  console.log('📋 IDs de primeros 50 módulos CON steps (usar para enrichment):\n');
  const ids = first50WithSteps.map(m => m.id);
  console.log(`const TARGET_MODULES = ${JSON.stringify(ids, null, 2)};\n`);
}

investigateEnglishModules()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
