/**
 * Identificar módulos de Ciencias Sociales para enriquecer
 * - 1 módulo por cada rango de grados (1-3, 4-5, 6, 7, 8-9, 10-11)
 * - Mostrar su jerarquía: axis → subaxis → competency → module
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function identifyModules() {
  console.log('🔍 IDENTIFICANDO MÓDULOS DE CIENCIAS SOCIALES PARA ENRIQUECER\n');
  console.log('='.repeat(80));

  // Definir rangos de grados objetivo
  const gradeRanges = ['1-3', '4-5', '6', '7', '8-9', '10-11'];
  
  // Módulo ya enriquecido
  const enrichedModule = '604231bc-8ce4-45e7-932d-745d821dfeaa';

  const modulesToEnrich = [];

  for (const gradeRange of gradeRanges) {
    console.log(`\n📚 GRADO ${gradeRange}:`);
    console.log('-'.repeat(80));

    // Obtener módulo de este rango
    const { data: module, error } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, title, source_unit_id, grade_range')
      .eq('subject', 'social_studies')
      .eq('grade_range', gradeRange)
      .eq('is_active', true)
      .neq('id', enrichedModule)
      .limit(1)
      .single();

    if (error || !module) {
      console.log(`  ❌ No se encontró módulo para este rango`);
      continue;
    }

    // Obtener su competency_unit
    const { data: unit, error: unitError } = await supabase
      .schema('kuneo')
      .from('competency_units')
      .select('id, content')
      .eq('id', module.source_unit_id)
      .single();

    if (unitError || !unit) {
      console.log(`  ❌ No se encontró competency_unit`);
      continue;
    }

    const metadata = unit.content?.metadata || {};
    const competency = unit.content?.competency || '(sin competencia)';

    console.log(`  ✅ Módulo: ${module.id}`);
    console.log(`     Título: ${module.title}`);
    console.log(`\n  📊 JERARQUÍA:`);
    console.log(`     MATERIA: social_studies`);
    console.log(`     └─ DISCIPLINA (axis): ${metadata.axis || '(sin axis)'}`);
    console.log(`        └─ UNIDAD TEMÁTICA (subaxis): ${metadata.subaxis || '(sin subaxis)'}`);
    console.log(`           └─ COMPETENCY: ${competency.substring(0, 80)}`);
    console.log(`              └─ MÓDULO: ${module.title}`);

    // Verificar módule_steps
    const { data: steps } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('id, step_number, content')
      .eq('module_id', module.id)
      .order('step_number');

    const enrichedSteps = steps?.filter(s => s.content?.questions?.length > 0) || [];
    
    console.log(`\n  📝 Module Steps: ${steps?.length || 0} total`);
    console.log(`     Enriquecidos: ${enrichedSteps.length}`);
    console.log(`     Pendientes: ${(steps?.length || 0) - enrichedSteps.length}`);

    modulesToEnrich.push({
      id: module.id,
      title: module.title,
      gradeRange: module.grade_range,
      unitId: module.source_unit_id,
      axis: metadata.axis,
      subaxis: metadata.subaxis,
      competency: competency,
      totalSteps: steps?.length || 0,
      enrichedSteps: enrichedSteps.length
    });
  }

  // Resumen
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 RESUMEN DE MÓDULOS A ENRIQUECER:\n');

  modulesToEnrich.forEach((m, i) => {
    const status = m.enrichedSteps === 8 ? '✅ COMPLETO' : 
                   m.enrichedSteps > 0 ? '⏳ PARCIAL' : '❌ PENDIENTE';
    
    console.log(`${i + 1}. [${status}] Grado ${m.gradeRange}`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Título: ${m.title}`);
    console.log(`   Jerarquía: ${m.axis} → ${m.subaxis}`);
    console.log(`   Steps: ${m.enrichedSteps}/${m.totalSteps} enriquecidos`);
    console.log();
  });

  console.log(`\nTotal módulos identificados: ${modulesToEnrich.length}`);
  console.log(`Módulos completamente enriquecidos: ${modulesToEnrich.filter(m => m.enrichedSteps === 8).length}`);
  console.log(`Módulos pendientes: ${modulesToEnrich.filter(m => m.enrichedSteps < 8).length}`);

  // Guardar IDs para script de enriquecimiento
  console.log('\n\n📝 IDs para enriquecer:');
  console.log(JSON.stringify(modulesToEnrich.map(m => m.id), null, 2));
}

identifyModules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
