// Verificar integridad REAL - usando enriched_content en vez de enrichment_status
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const SUBJECTS = [
  { key: 'language', display: 'Language' },
  { key: 'mathematics', display: 'Mathematics' },
  { key: 'english', display: 'English' },
  { key: 'natural_sciences', display: 'Natural Sciences' },
  { key: 'social_studies', display: 'Social Studies' }
];

async function verifySubject(subject) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 ${subject.display.toUpperCase()}`);
  console.log('='.repeat(60));
  
  // Obtener módulos
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, subject')
    .eq('subject', subject.key);
  
  if (!modules || modules.length === 0) {
    console.log('⚠️  Sin módulos');
    return null;
  }
  
  console.log(`📦 Módulos: ${modules.length}`);
  
  // Obtener steps en lotes para evitar headers overflow
  const moduleIds = modules.map(m => m.id);
  const batchSize = 100;
  let allSteps = [];
  
  for (let i = 0; i < moduleIds.length; i += batchSize) {
    const batch = moduleIds.slice(i, i + batchSize);
    const { data } = await supabase
      .from('module_steps')
      .select('id, module_id, step_order, enriched_content, enrichment_status')
      .in('module_id', batch);
    
    if (data) allSteps = allSteps.concat(data);
  }
  
  console.log(`📋 Total steps: ${allSteps.length}`);
  
  // Contar por enriched_content (no por status)
  const enrichedSteps = allSteps.filter(s => s.enriched_content !== null);
  const pendingSteps = allSteps.filter(s => s.enriched_content === null);
  
  console.log(`✅ Con enriched_content: ${enrichedSteps.length} (${(enrichedSteps.length/allSteps.length*100).toFixed(1)}%)`);
  console.log(`⏳ Sin enriched_content: ${pendingSteps.length}`);
  
  // Validar estructura
  let validEnriched = 0;
  let invalidEnriched = 0;
  const issues = [];
  
  for (const step of enrichedSteps) {
    const content = step.enriched_content;
    
    if (!content.cognitive_dimension || !content.expected_answer) {
      issues.push({ stepId: step.id, issue: 'Missing required fields' });
      invalidEnriched++;
      continue;
    }
    
    if (!['option', 'text', 'numeric', 'drawing'].includes(content.expected_answer.type)) {
      issues.push({ stepId: step.id, issue: `Invalid type: ${content.expected_answer.type}` });
      invalidEnriched++;
      continue;
    }
    
    if (content.expected_answer.type === 'option') {
      if (!content.expected_answer.correct_options || !Array.isArray(content.expected_answer.correct_options)) {
        issues.push({ stepId: step.id, issue: 'Missing correct_options' });
        invalidEnriched++;
        continue;
      }
    }
    
    validEnriched++;
  }
  
  console.log(`\n📊 Validación:`);
  console.log(`   ✅ Válidos: ${validEnriched}`);
  console.log(`   ❌ Inválidos: ${invalidEnriched}`);
  
  if (issues.length > 0) {
    console.log(`   ⚠️  Issues (primeros 3): `);
    issues.slice(0, 3).forEach(i => console.log(`      - ${i.stepId.substring(0,8)}...: ${i.issue}`));
  }
  
  // Distribución por módulo
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
  
  const completeModules = Object.values(moduleStepCounts).filter(m => m.enriched === m.total && m.total > 0).length;
  const partialModules = Object.values(moduleStepCounts).filter(m => m.enriched > 0 && m.enriched < m.total).length;
  const emptyModules = Object.values(moduleStepCounts).filter(m => m.enriched === 0).length;
  
  console.log(`\n📦 Distribución:`);
  console.log(`   ✅ Módulos completos: ${completeModules}`);
  console.log(`   ⚠️  Módulos parciales: ${partialModules}`);
  console.log(`   ❌ Módulos vacíos: ${emptyModules}`);
  
  // Verificar status values
  const statusCounts = {};
  enrichedSteps.forEach(s => {
    statusCounts[s.enrichment_status] = (statusCounts[s.enrichment_status] || 0) + 1;
  });
  
  console.log(`\n📊 enrichment_status de steps enriquecidos:`);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   - "${status}": ${count}`);
  });
  
  return {
    subject: subject.key,
    totalModules: modules.length,
    totalSteps: allSteps.length,
    enrichedSteps: enrichedSteps.length,
    validEnriched,
    invalidEnriched,
    completeModules,
    partialModules,
    emptyModules
  };
}

async function main() {
  console.log('\n🔍 VERIFICACIÓN DE INTEGRIDAD (CORREGIDA)');
  console.log('Usando enriched_content en vez de enrichment_status\n');
  
  const results = [];
  
  for (const subject of SUBJECTS) {
    const result = await verifySubject(subject);
    if (result) results.push(result);
  }
  
  // Resumen
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESUMEN GENERAL`);
  console.log('='.repeat(60));
  
  let totalSteps = 0;
  let totalEnriched = 0;
  let totalValid = 0;
  let totalInvalid = 0;
  
  results.forEach(r => {
    totalSteps += r.totalSteps;
    totalEnriched += r.enrichedSteps;
    totalValid += r.validEnriched;
    totalInvalid += r.invalidEnriched;
  });
  
  console.log(`\n📈 Totales:`);
  console.log(`   Total steps: ${totalSteps}`);
  console.log(`   Con enriched_content: ${totalEnriched} (${(totalEnriched/totalSteps*100).toFixed(1)}%)`);
  console.log(`   Válidos: ${totalValid}`);
  console.log(`   Inválidos: ${totalInvalid}`);
  
  console.log(`\n📋 Por materia:`);
  results.forEach(r => {
    const pct = r.totalSteps > 0 ? (r.enrichedSteps/r.totalSteps*100).toFixed(1) : '0.0';
    const status = r.invalidEnriched === 0 ? '✅' : '⚠️';
    console.log(`   ${status} ${r.subject}: ${r.enrichedSteps}/${r.totalSteps} (${pct}%) - ${r.completeModules} completos`);
    if (r.invalidEnriched > 0) {
      console.log(`      ⚠️  ${r.invalidEnriched} inválidos`);
    }
  });
  
  if (totalInvalid === 0) {
    console.log(`\n✅ NO HAY DATOS INVÁLIDOS`);
  } else {
    console.log(`\n⚠️  ${totalInvalid} steps inválidos detectados`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
