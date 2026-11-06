/**
 * Verificar módulo 604231bc enriquecido
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkModule() {
  const moduleId = '604231bc-8ce4-45e7-932d-745d821dfeaa';

  const { data: module } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title, grade_range, subject, source_unit_id')
    .eq('id', moduleId)
    .single();

  console.log('📦 MÓDULO 604231bc:\n');
  console.log(JSON.stringify(module, null, 2));

  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_number, content')
    .eq('module_id', moduleId)
    .order('step_number');

  console.log(`\n\n📝 MODULE STEPS: ${steps?.length || 0} total\n`);
  
  steps?.forEach(s => {
    const hasQuestions = s.content?.questions?.length > 0;
    const status = hasQuestions ? '✅' : '❌';
    console.log(`  ${status} Step ${s.step_number}: ${hasQuestions ? `${s.content.questions.length} preguntas` : 'sin enriquecer'}`);
  });

  // Verificar competency_unit
  if (module?.source_unit_id) {
    const { data: unit } = await supabase
      .schema('kuneo')
      .from('competency_units')
      .select('id, content')
      .eq('id', module.source_unit_id)
      .single();

    const metadata = unit?.content?.metadata || {};
    console.log('\n\n📊 JERARQUÍA:');
    console.log(`  MATERIA: ${module.subject}`);
    console.log(`  └─ DISCIPLINA (axis): ${metadata.axis || '(sin axis)'}`);
    console.log(`     └─ UNIDAD TEMÁTICA (subaxis): ${metadata.subaxis || '(sin subaxis)'}`);
    console.log(`        └─ COMPETENCY: ${unit?.content?.competency?.substring(0, 60) || '(sin competency)'}`);
    console.log(`           └─ MÓDULO: ${module.title}`);
  }
}

checkModule()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
