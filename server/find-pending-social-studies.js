require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findPending() {
  console.log('🔍 Buscando módulos de Ciencias Sociales pendientes...\n');
  
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, title, grade_range, core_concept')
    .eq('subject', 'social_studies')
    .eq('is_active', true)
    .order('grade_range');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total módulos activos: ${modules.length}\n`);

  const byGrade = {};
  const fullyEnriched = [];
  const partiallyEnriched = [];
  const notEnriched = [];

  for (const module of modules) {
    const { data: steps } = await supabase
      .from('module_steps')
      .select('id, enriched_content')
      .eq('module_id', module.id);

    const totalSteps = steps?.length || 0;
    const enrichedCount = steps?.filter(s => s.enriched_content !== null).length || 0;

    const moduleInfo = {
      ...module,
      totalSteps,
      enrichedCount,
      status: enrichedCount === 0 ? 'not_enriched' : 
              enrichedCount === totalSteps ? 'fully_enriched' : 'partially_enriched'
    };

    if (!byGrade[module.grade_range]) {
      byGrade[module.grade_range] = [];
    }
    byGrade[module.grade_range].push(moduleInfo);

    if (enrichedCount === totalSteps && totalSteps > 0) {
      fullyEnriched.push(moduleInfo);
    } else if (enrichedCount > 0) {
      partiallyEnriched.push(moduleInfo);
    } else {
      notEnriched.push(moduleInfo);
    }
  }

  console.log('📈 RESUMEN:\n');
  console.log(`✅ Completamente enriquecidos: ${fullyEnriched.length}`);
  console.log(`⚠️  Parcialmente enriquecidos: ${partiallyEnriched.length}`);
  console.log(`❌ Sin enriquecer: ${notEnriched.length}\n`);

  console.log('=' .repeat(80));
  console.log('📚 MÓDULOS POR GRADO (solo completamente enriquecidos):\n');
  
  Object.keys(byGrade).sort().forEach(grade => {
    const gradeModules = byGrade[grade];
    const fullyEnrichedInGrade = gradeModules.filter(m => m.status === 'fully_enriched');
    
    console.log(`\n🎓 GRADO ${grade}:`);
    console.log(`   Total: ${gradeModules.length} | Completos: ${fullyEnrichedInGrade.length}`);
    
    if (fullyEnrichedInGrade.length > 0) {
      fullyEnrichedInGrade.forEach(m => {
        console.log(`   ✅ ${m.title.substring(0, 50)}... (${m.enrichedCount}/${m.totalSteps})`);
      });
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('🎯 PRIORIDAD: Módulos que necesitan enriquecimiento completo\n');
  
  // Mostrar 1 módulo por grado que necesite enriquecimiento
  const gradesPriority = ['1-3', '4-5', '6-7', '8-9', '10-11'];
  
  gradesPriority.forEach(grade => {
    const gradeModules = byGrade[grade] || [];
    const needsWork = gradeModules.filter(m => m.status !== 'fully_enriched');
    
    if (needsWork.length > 0) {
      const first = needsWork[0];
      console.log(`\n📌 GRADO ${grade}:`);
      console.log(`   ID: ${first.id}`);
      console.log(`   Título: ${first.title}`);
      console.log(`   Concepto: ${first.core_concept}`);
      console.log(`   Estado: ${first.enrichedCount}/${first.totalSteps} steps`);
      console.log(`   Faltan: ${first.totalSteps - first.enrichedCount} steps`);
    } else {
      console.log(`\n✅ GRADO ${grade}: Todo completo`);
    }
  });

  process.exit(0);
}

findPending().catch(console.error);
