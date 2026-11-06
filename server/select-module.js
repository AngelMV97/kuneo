require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function selectModuleToEnrich() {
  console.log('🔍 Buscando módulo de Ciencias Sociales para enriquecer...\n');

  // Buscar módulos de social_studies
  const { data: modules } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title, subject, core_concept, learning_objective, difficulty, grade_range')
    .eq('subject', 'social_studies')
    .eq('is_active', true)
    .limit(5);

  if (!modules || modules.length === 0) {
    console.log('❌ No se encontraron módulos de social_studies');
    process.exit(1);
  }

  console.log(`📚 Encontrados ${modules.length} módulos de Ciencias Sociales\n`);

  // Tomar el primer módulo
  const module = modules[0];
  
  console.log('🎯 Módulo seleccionado:');
  console.log(`  ID: ${module.id}`);
  console.log(`  Título: ${module.title}`);
  console.log(`  Concepto: ${module.core_concept}`);
  console.log(`  Objetivo: ${module.learning_objective}`);
  console.log(`  Grado: ${module.grade_range}`);
  console.log(`  Dificultad: ${module.difficulty}`);

  // Ver cuántos steps tiene
  const { data: steps, count } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order', { count: 'exact' })
    .eq('module_id', module.id)
    .order('step_order');

  console.log(`\n📊 Steps: ${count}`);
  
  if (steps && steps.length > 0) {
    console.log('\n📋 IDs de steps:');
    steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.id} (order: ${step.step_order})`);
    });
  }

  process.exit(0);
}

selectModuleToEnrich().catch(console.error);
