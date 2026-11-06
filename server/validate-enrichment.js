/**
 * Validar enriquecimiento de módulos
 * Verifica que todos los steps tengan enriched_content con jerarquía completa
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateModule(moduleId, gradeRange) {
  const { data: steps, error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order, phase, cognitive_type, enriched_content, enrichment_status')
    .eq('module_id', moduleId)
    .order('step_order');

  if (error || !steps) {
    return { success: false, error: error?.message || 'No steps found' };
  }

  const issues = [];

  // Verificar que hay 8 steps
  if (steps.length !== 8) {
    issues.push(`❌ Solo tiene ${steps.length} steps (debe tener 8)`);
  }

  // Verificar cada step
  for (const step of steps) {
    const stepIssues = [];

    // Verificar enrichment_status
    if (step.enrichment_status !== 'completed') {
      stepIssues.push(`status: ${step.enrichment_status || 'null'}`);
    }

    // Verificar enriched_content
    if (!step.enriched_content) {
      stepIssues.push('sin enriched_content');
    } else {
      const content = step.enriched_content;

      // Verificar preguntas
      if (!content.questions || content.questions.length === 0) {
        stepIssues.push('sin preguntas');
      }

      // Verificar jerarquía
      if (!content.hierarchy) {
        stepIssues.push('sin jerarquía');
      } else {
        const h = content.hierarchy;
        if (!h.subject) stepIssues.push('sin subject');
        if (!h.competency) stepIssues.push('sin competency');
        if (!h.module_title) stepIssues.push('sin module_title');
      }

      // Verificar cognitive dimension
      if (!content.cognitive_dimension) {
        stepIssues.push('sin cognitive_dimension');
      }
    }

    if (stepIssues.length > 0) {
      issues.push(`  Step ${step.step_order}: ${stepIssues.join(', ')}`);
    }
  }

  return {
    success: issues.length === 0,
    stepCount: steps.length,
    issues: issues,
    details: steps.map(s => ({
      step: s.step_order,
      phase: s.phase,
      cognitive_type: s.cognitive_type,
      status: s.enrichment_status,
      questions: s.enriched_content?.questions?.length || 0,
      hasHierarchy: !!s.enriched_content?.hierarchy
    }))
  };
}

async function main() {
  console.log('🔍 VALIDANDO ENRIQUECIMIENTO DE MÓDULOS\n');
  console.log('='.repeat(80));

  const modules = [
    { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', grade: '4-5', name: 'Original' },
    { id: 'e43bb575-a5d6-4bee-bc97-c7895421ae13', grade: '1-3', name: 'Grado 1-3' },
    { id: 'ac62bde3-ea14-4fcd-82a1-15da56067ab9', grade: '4-5', name: 'Alt 4-5' },
    { id: 'd8365a0a-9d61-43dd-ae0d-7d9841e4a52b', grade: '6', name: 'Grado 6' },
    { id: '2657df4d-0c9a-4c8b-82a7-e1fd1edbf8c1', grade: '7', name: 'Grado 7' },
    { id: 'ff576221-b3b0-42c4-8b8b-81e47baa5555', grade: '8-9', name: 'Grado 8-9' },
    { id: '4b319ed1-ed26-4c04-bbae-05d955da24eb', grade: '10-11', name: 'Grado 10-11' }
  ];

  const results = [];

  for (const module of modules) {
    console.log(`\n📦 ${module.name} (${module.grade}) - ${module.id.substring(0, 8)}...`);
    console.log('-'.repeat(80));

    const validation = await validateModule(module.id, module.grade);

    if (validation.success) {
      console.log('✅ Módulo completamente enriquecido');
      console.log(`   ${validation.stepCount} steps con contenido válido\n`);
      
      // Mostrar resumen de steps
      validation.details.forEach(d => {
        console.log(`   Step ${d.step}: ${d.phase} (${d.cognitive_type}) - ${d.questions} preguntas`);
      });
    } else {
      console.log('❌ Problemas detectados:');
      validation.issues.forEach(issue => console.log(`   ${issue}`));
    }

    results.push({
      module: module.name,
      grade: module.grade,
      success: validation.success,
      stepCount: validation.stepCount,
      issues: validation.issues
    });
  }

  // Resumen final
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE VALIDACIÓN\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total módulos validados: ${results.length}`);
  console.log(`✅ Completamente enriquecidos: ${successful}`);
  console.log(`❌ Con problemas: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Módulos con problemas:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`\n  ${r.module} (${r.grade}):`);
      r.issues.forEach(issue => console.log(`    ${issue}`));
    });
  }

  console.log('\n✨ Validación completada\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
