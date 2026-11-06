require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const NEW_MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

async function checkNewModule() {
  console.log('🔍 Verificando módulo Grade 8-9 enriquecido...\n');

  // Contar módulos con 8 steps enriquecidos
  const { data: allSteps } = await supabase
    .from('module_steps')
    .select('module_id, enriched_content')
    .eq('enriched_content->>type', 'keywords')
    .not('enriched_content', 'is', null);

  const moduleCounts = {};
  allSteps.forEach(s => {
    moduleCounts[s.module_id] = (moduleCounts[s.module_id] || 0) + 1;
  });

  const completeModules = Object.entries(moduleCounts)
    .filter(([_, count]) => count >= 2)
    .map(([id]) => id);

  console.log(`📊 Total módulos con 2+ keywords steps: ${completeModules.length}`);

  // Verificar nuevo módulo
  const isIncluded = completeModules.includes(NEW_MODULE_ID);
  console.log(`\n${isIncluded ? '✅' : '❌'} Módulo ${NEW_MODULE_ID.substring(0, 8)}...`);

  if (isIncluded) {
    // Ver detalles del nuevo módulo
    const { data: newModuleSteps } = await supabase
      .from('module_steps')
      .select('step_order, enriched_content')
      .eq('module_id', NEW_MODULE_ID)
      .order('step_order');

    console.log(`\n📋 Detalles del módulo Grade 8-9:`);
    newModuleSteps.forEach(step => {
      const type = step.enriched_content?.type || 'N/A';
      const hasContent = step.enriched_content && Object.keys(step.enriched_content).length > 0;
      console.log(`   Step ${step.step_order}: ${hasContent ? '✅' : '❌'} ${type}`);
    });
  }

  console.log('\n✅ Verificación completada');
}

checkNewModule()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
