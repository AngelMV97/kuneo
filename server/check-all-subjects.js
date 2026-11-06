// Script para verificar estado de enrichment de todos los subjects
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkAllSubjects() {
  console.log('\n📊 ESTADO DE ENRICHMENT POR SUBJECT\n');
  console.log('='.repeat(60));
  
  // Obtener todos los subjects únicos
  const { data: modules, error } = await supabase
    .from('modules')
    .select('subject, id');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  // Agrupar por subject
  const subjectGroups = {};
  modules.forEach(m => {
    if (!subjectGroups[m.subject]) {
      subjectGroups[m.subject] = [];
    }
    subjectGroups[m.subject].push(m.id);
  });
  
  // Para cada subject, contar steps y enrichment
  const results = [];
  
  for (const [subject, moduleIds] of Object.entries(subjectGroups)) {
    let totalSteps = 0;
    let enrichedSteps = 0;
    let completeModules = 0;
    
    for (const moduleId of moduleIds) {
      const { data: steps } = await supabase
        .from('module_steps')
        .select('id, enriched_content')
        .eq('module_id', moduleId);
      
      if (steps) {
        totalSteps += steps.length;
        const enriched = steps.filter(s => s.enriched_content !== null).length;
        enrichedSteps += enriched;
        
        if (enriched === steps.length && steps.length > 0) {
          completeModules++;
        }
      }
    }
    
    results.push({
      subject,
      modules: moduleIds.length,
      totalSteps,
      enrichedSteps,
      completeModules,
      percentage: totalSteps > 0 ? (enrichedSteps / totalSteps * 100).toFixed(1) : 0
    });
  }
  
  // Ordenar por percentage descendente
  results.sort((a, b) => b.percentage - a.percentage);
  
  // Mostrar tabla
  console.log('\n');
  results.forEach(r => {
    const status = r.percentage >= 99 ? '✅' : r.percentage >= 50 ? '⚠️' : '❌';
    const bar = '█'.repeat(Math.floor(r.percentage / 5));
    
    console.log(`${status} ${r.subject.toUpperCase()}`);
    console.log(`   Módulos: ${r.modules} (${r.completeModules} completos)`);
    console.log(`   Steps: ${r.enrichedSteps}/${r.totalSteps} (${r.percentage}%)`);
    console.log(`   ${bar} ${r.percentage}%\n`);
  });
  
  // Totales
  const totals = results.reduce((acc, r) => ({
    modules: acc.modules + r.modules,
    totalSteps: acc.totalSteps + r.totalSteps,
    enrichedSteps: acc.enrichedSteps + r.enrichedSteps,
    completeModules: acc.completeModules + r.completeModules
  }), { modules: 0, totalSteps: 0, enrichedSteps: 0, completeModules: 0 });
  
  console.log('='.repeat(60));
  console.log('\n📈 TOTALES GENERALES:');
  console.log(`   Subjects: ${results.length}`);
  console.log(`   Módulos totales: ${totals.modules} (${totals.completeModules} completos)`);
  console.log(`   Steps totales: ${totals.enrichedSteps}/${totals.totalSteps} (${(totals.enrichedSteps/totals.totalSteps*100).toFixed(1)}%)\n`);
}

checkAllSubjects()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
