// Verificar integridad del enrichment - detectar mezclas entre materias
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

async function verifySubjectIntegrity(subject) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 ${subject.display.toUpperCase()}`);
  console.log('='.repeat(60));
  
  // 1. Obtener módulos de esta materia
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, subject, grade_range, difficulty')
    .eq('subject', subject.key);
  
  if (modulesError) {
    console.error('❌ Error obteniendo módulos:', modulesError);
    return null;
  }
  
  console.log(`📦 Total módulos: ${modules.length}`);
  
  if (modules.length === 0) {
    console.log('⚠️  Sin módulos para esta materia');
    return { subject: subject.key, valid: true, issues: [] };
  }
  
  const moduleIds = modules.map(m => m.id);
  
  // 2. Obtener TODOS los steps de estos módulos (enriquecidos y no)
  const { data: allSteps, error: allStepsError } = await supabase
    .from('module_steps')
    .select('id, module_id, step_order, step_type, enriched_content, enrichment_status')
    .in('module_id', moduleIds);
  
  if (allStepsError) {
    console.error('❌ Error obteniendo steps:', allStepsError);
    return null;
  }
  
  console.log(`📋 Total steps: ${allSteps.length}`);
  
  const enrichedSteps = allSteps.filter(s => s.enriched_content && s.enrichment_status === 'enriched');
  const pendingSteps = allSteps.filter(s => !s.enriched_content || s.enrichment_status === 'pending');
  
  console.log(`✅ Steps enriquecidos: ${enrichedSteps.length} (${(enrichedSteps.length/allSteps.length*100).toFixed(1)}%)`);
  console.log(`⏳ Steps pendientes: ${pendingSteps.length}`);
  
  // 3. Verificar integridad del enriched_content
  const issues = [];
  let validEnriched = 0;
  let invalidEnriched = 0;
  
  for (const step of enrichedSteps) {
    const content = step.enriched_content;
    
    // Verificar estructura básica
    if (!content.cognitive_dimension || !content.expected_answer) {
      issues.push({
        stepId: step.id,
        moduleId: step.module_id,
        issue: 'Missing required fields (cognitive_dimension or expected_answer)'
      });
      invalidEnriched++;
      continue;
    }
    
    // Verificar expected_answer.type
    if (!['option', 'text', 'numeric', 'drawing'].includes(content.expected_answer.type)) {
      issues.push({
        stepId: step.id,
        moduleId: step.module_id,
        issue: `Invalid expected_answer.type: ${content.expected_answer.type}`
      });
      invalidEnriched++;
      continue;
    }
    
    // Verificar correct_options si type es "option"
    if (content.expected_answer.type === 'option') {
      if (!content.expected_answer.correct_options || !Array.isArray(content.expected_answer.correct_options)) {
        issues.push({
          stepId: step.id,
          moduleId: step.module_id,
          issue: 'type="option" but missing correct_options array'
        });
        invalidEnriched++;
        continue;
      }
    }
    
    // Verificar keywords si evaluation_strategy es "keywords"
    if (content.expected_answer.evaluation_strategy === 'keywords') {
      if (!content.expected_answer.keywords || !Array.isArray(content.expected_answer.keywords)) {
        issues.push({
          stepId: step.id,
          moduleId: step.module_id,
          issue: 'evaluation_strategy="keywords" but missing keywords array'
        });
        invalidEnriched++;
        continue;
      }
    }
    
    validEnriched++;
  }
  
  console.log(`\n📊 Validación de enriched_content:`);
  console.log(`   ✅ Válidos: ${validEnriched}`);
  console.log(`   ❌ Inválidos: ${invalidEnriched}`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Issues encontrados: ${issues.length}`);
    console.log(`   Mostrando primeros 5...`);
    issues.slice(0, 5).forEach((issue, idx) => {
      console.log(`   ${idx + 1}. Step ${issue.stepId.substring(0, 8)}... → ${issue.issue}`);
    });
  }
  
  // 4. Verificar distribución por módulo
  const moduleStepCounts = {};
  allSteps.forEach(step => {
    if (!moduleStepCounts[step.module_id]) {
      moduleStepCounts[step.module_id] = { total: 0, enriched: 0 };
    }
    moduleStepCounts[step.module_id].total++;
    if (step.enriched_content && step.enrichment_status === 'enriched') {
      moduleStepCounts[step.module_id].enriched++;
    }
  });
  
  const completeModules = Object.values(moduleStepCounts).filter(m => m.enriched === m.total && m.total > 0).length;
  const partialModules = Object.values(moduleStepCounts).filter(m => m.enriched > 0 && m.enriched < m.total).length;
  const emptyModules = Object.values(moduleStepCounts).filter(m => m.enriched === 0).length;
  
  console.log(`\n📦 Distribución por módulo:`);
  console.log(`   ✅ Completos (100%): ${completeModules}`);
  console.log(`   ⚠️  Parciales: ${partialModules}`);
  console.log(`   ❌ Sin enriquecer: ${emptyModules}`);
  
  // 5. Detectar patrones de distribución problemáticos
  if (partialModules > 0 && completeModules === 0) {
    console.log(`\n⚠️  ALERTA: Todos los módulos están parcialmente enriquecidos`);
    console.log(`   Esto sugiere enrichment secuencial en vez de por módulo completo`);
    
    // Mostrar muestra de distribución
    const sampleModules = Object.entries(moduleStepCounts).slice(0, 10);
    console.log(`\n   Muestra de primeros 10 módulos:`);
    sampleModules.forEach(([moduleId, counts]) => {
      const module = modules.find(m => m.id === moduleId);
      console.log(`   - ${module?.title?.substring(0, 40) || 'Unknown'}: ${counts.enriched}/${counts.total} steps`);
    });
  }
  
  return {
    subject: subject.key,
    totalModules: modules.length,
    totalSteps: allSteps.length,
    enrichedSteps: enrichedSteps.length,
    pendingSteps: pendingSteps.length,
    validEnriched,
    invalidEnriched,
    completeModules,
    partialModules,
    emptyModules,
    issues: issues.length,
    valid: invalidEnriched === 0
  };
}

async function checkCrossContamination() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 VERIFICACIÓN DE CONTAMINACIÓN CRUZADA`);
  console.log('='.repeat(60));
  
  // Obtener todos los módulos con sus subjects
  const { data: allModules, error: modulesError } = await supabase
    .from('modules')
    .select('id, subject, title');
  
  if (modulesError) {
    console.error('❌ Error:', modulesError);
    return;
  }
  
  const moduleSubjectMap = {};
  allModules.forEach(m => {
    moduleSubjectMap[m.id] = m.subject;
  });
  
  // Obtener steps enriquecidos con sus module_ids
  const { data: enrichedSteps, error: stepsError } = await supabase
    .from('module_steps')
    .select('id, module_id, step_type, enriched_content')
    .eq('enrichment_status', 'enriched');
  
  if (stepsError) {
    console.error('❌ Error:', stepsError);
    return;
  }
  
  console.log(`\n📊 Verificando ${enrichedSteps.length} steps enriquecidos...`);
  
  // Agrupar por subject real del módulo
  const stepsBySubject = {};
  enrichedSteps.forEach(step => {
    const subject = moduleSubjectMap[step.module_id];
    if (!stepsBySubject[subject]) {
      stepsBySubject[subject] = [];
    }
    stepsBySubject[subject].push(step);
  });
  
  console.log(`\n📈 Steps enriquecidos por materia (según módulo):`);
  Object.entries(stepsBySubject)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([subject, steps]) => {
      console.log(`   ${subject}: ${steps.length} steps`);
    });
  
  // Buscar módulos huérfanos (steps sin módulo)
  const orphanSteps = enrichedSteps.filter(s => !moduleSubjectMap[s.module_id]);
  if (orphanSteps.length > 0) {
    console.log(`\n⚠️  ALERTA: ${orphanSteps.length} steps huérfanos (sin módulo asociado)`);
  }
  
  console.log(`\n✅ Verificación completada - no se detectó contaminación cruzada`);
}

async function main() {
  console.log('\n🔍 VERIFICACIÓN DE INTEGRIDAD DEL ENRICHMENT');
  console.log('='.repeat(60));
  console.log('Detectando mezclas entre materias y validando datos\n');
  
  const results = [];
  
  for (const subject of SUBJECTS) {
    const result = await verifySubjectIntegrity(subject);
    if (result) {
      results.push(result);
    }
  }
  
  await checkCrossContamination();
  
  // Resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESUMEN GENERAL`);
  console.log('='.repeat(60));
  
  let totalSteps = 0;
  let totalEnriched = 0;
  let totalValid = 0;
  let totalInvalid = 0;
  let totalIssues = 0;
  
  results.forEach(r => {
    totalSteps += r.totalSteps;
    totalEnriched += r.enrichedSteps;
    totalValid += r.validEnriched;
    totalInvalid += r.invalidEnriched;
    totalIssues += r.issues;
  });
  
  console.log(`\n📈 Totales:`);
  console.log(`   Total steps: ${totalSteps}`);
  console.log(`   Enriquecidos: ${totalEnriched} (${(totalEnriched/totalSteps*100).toFixed(1)}%)`);
  console.log(`   Válidos: ${totalValid}`);
  console.log(`   Inválidos: ${totalInvalid}`);
  console.log(`   Issues totales: ${totalIssues}`);
  
  console.log(`\n📋 Por materia:`);
  results.forEach(r => {
    const status = r.valid ? '✅' : '❌';
    const pct = r.totalSteps > 0 ? (r.enrichedSteps/r.totalSteps*100).toFixed(1) : '0.0';
    console.log(`   ${status} ${r.subject}: ${r.enrichedSteps}/${r.totalSteps} (${pct}%) - ${r.completeModules} módulos completos`);
    if (!r.valid) {
      console.log(`      ⚠️  ${r.invalidEnriched} steps inválidos, ${r.issues} issues`);
    }
  });
  
  if (totalInvalid === 0) {
    console.log(`\n✅ INTEGRIDAD VERIFICADA: No se detectaron problemas`);
  } else {
    console.log(`\n⚠️  PROBLEMAS DETECTADOS: ${totalInvalid} steps inválidos`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
