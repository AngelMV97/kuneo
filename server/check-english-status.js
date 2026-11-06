// Script para verificar estado de enrichment de English
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkEnglishStatus() {
  console.log('\n🔍 Verificando estado de English enrichment...\n');
  
  // Obtener módulos English primero
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('subject', 'english');
  
  if (modulesError) {
    console.error('❌ Error obteniendo módulos:', modulesError);
    return;
  }
  
  console.log(`📦 Total módulos English: ${modules.length}`);
  
  // Contar por módulo
  const moduleStats = {};
  modules.forEach(m => {
    moduleStats[m.id] = {
      title: m.title,
      total: 0,
      enriched: 0
    };
  });
  
  // Contar steps por query directa
  for (const module of modules) {
    const { data: steps } = await supabase
      .from('module_steps')
      .select('id, enriched_content')
      .eq('module_id', module.id);
    
    if (steps) {
      moduleStats[module.id].total = steps.length;
      moduleStats[module.id].enriched = steps.filter(s => s.enriched_content !== null).length;
    }
  }
  
  // Calcular totales
  let totalSteps = 0;
  let enrichedSteps = 0;
  let completeModules = 0;
  let partialModules = 0;
  
  Object.values(moduleStats).forEach(stat => {
    totalSteps += stat.total;
    enrichedSteps += stat.enriched;
    if (stat.enriched === stat.total && stat.total > 0) {
      completeModules++;
    } else if (stat.enriched > 0) {
      partialModules++;
    }
  });
  
  console.log(`📊 Steps totales: ${totalSteps}`);
  console.log(`✅ Steps enriquecidos: ${enrichedSteps} (${(enrichedSteps/totalSteps*100).toFixed(1)}%)`);
  console.log(`🎯 Módulos completamente enriquecidos: ${completeModules}`);
  console.log(`⚠️  Módulos parcialmente enriquecidos: ${partialModules}`);
  console.log(`❌ Módulos sin enriquecer: ${modules.length - completeModules - partialModules}\n`);
  
  // Mostrar top módulos con más steps enriquecidos
  const sortedModules = Object.entries(moduleStats)
    .filter(([_, stat]) => stat.enriched > 0)
    .sort((a, b) => b[1].enriched - a[1].enriched)
    .slice(0, 10);
  
  console.log('🔝 Top 10 módulos con más steps enriquecidos:\n');
  sortedModules.forEach(([id, stat], i) => {
    const percent = stat.total > 0 ? (stat.enriched/stat.total*100).toFixed(0) : 0;
    const status = stat.enriched === stat.total ? '✅' : '⚠️';
    console.log(`${i+1}. ${status} ${stat.title}`);
    console.log(`   ID: ${id}`);
    console.log(`   Progress: ${stat.enriched}/${stat.total} (${percent}%)\n`);
  });
  
  // Buscar módulos completos con suficientes steps para testing
  const testableModules = Object.entries(moduleStats)
    .filter(([_, stat]) => stat.enriched === stat.total && stat.total >= 5)
    .slice(0, 5);
  
  if (testableModules.length > 0) {
    console.log('\n✅ Módulos listos para testing (≥5 steps):\n');
    testableModules.forEach(([id, stat]) => {
      console.log(`- ${stat.title} (${stat.total} steps)`);
      console.log(`  ID: ${id}\n`);
    });
  } else {
    console.log('\n⚠️  NO hay módulos completamente enriquecidos con ≥5 steps');
    console.log('💡 Necesitamos continuar enrichment o usar módulos parciales\n');
  }
}

checkEnglishStatus()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
