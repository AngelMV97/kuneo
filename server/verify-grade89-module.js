require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

async function verifyModule() {
  console.log('🔍 Verificando módulo Grade 8-9...\n');

  const { data: module } = await supabase
    .from('modules')
    .select('title, core_concept, grade_range')
    .eq('id', MODULE_ID)
    .single();

  console.log(`📌 Módulo: ${module.title}`);
  console.log(`🎯 Concepto: ${module.core_concept}`);
  console.log(`🎓 Grado: ${module.grade_range}\n`);

  const { data: steps, error: stepsError } = await supabase
    .from('module_steps')
    .select('step_order, phase, enriched_content')
    .eq('module_id', MODULE_ID)
    .order('step_order', { ascending: true });

  if (stepsError || !steps) {
    console.error('❌ Error obteniendo steps:', stepsError?.message);
    return;
  }

  const EXPECTED_TYPES = {
    1: 'option',
    2: 'option',
    3: 'keywords',
    4: 'multiple_select',
    5: 'matching',
    6: 'ordering',
    7: 'option',
    8: 'keywords'
  };

  let allCorrect = true;

  for (const step of steps) {
    const expectedType = EXPECTED_TYPES[step.step_order];
    const hasEnriched = step.enriched_content && Object.keys(step.enriched_content).length > 0;
    const actualType = hasEnriched ? step.enriched_content.type : null;
    const isCorrect = hasEnriched && actualType === expectedType;

    console.log(`Step ${step.step_order} (${step.phase || 'N/A'}): ${isCorrect ? '✅' : '❌'} ${actualType || 'sin enriched_content'} (esperado: ${expectedType})`);

    if (isCorrect) {
      // Mostrar detalles según tipo
      if (actualType === 'keywords') {
        const kw = step.enriched_content.keywords?.length || 0;
        const minKw = step.enriched_content.min_keywords || 0;
        const pct = kw > 0 ? Math.round((minKw / kw) * 100) : 0;
        console.log(`   Keywords: ${kw}, min=${minKw} (${pct}%)`);
      } else if (actualType === 'option') {
        console.log(`   Correcta: opción ${step.enriched_content.correct_option}`);
      } else if (actualType === 'multiple_select') {
        console.log(`   Correctas: ${step.enriched_content.correct_options?.join(', ')}`);
      } else if (actualType === 'matching') {
        console.log(`   Pares: ${JSON.stringify(step.enriched_content.correct_pairs)}`);
      }
    }

    if (!isCorrect) allCorrect = false;
  }

  console.log('\n' + '='.repeat(80));
  if (allCorrect && steps.length === 8) {
    console.log('✅ MÓDULO COMPLETAMENTE ENRIQUECIDO');
    console.log(`\n📋 ID del módulo: ${MODULE_ID}`);
  } else {
    console.log('⚠️  El módulo requiere correcciones');
  }
  console.log('='.repeat(80));
}

verifyModule()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
