/**
 * Buscar todos los módulos de ciencias sociales por grado
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findModulesByGrade() {
  console.log('\n🔍 Buscando módulos de ciencias sociales por grado...\n');

  // Buscar módulos con grade_range que contenga '1'
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, title, grade_range, subject')
    .eq('subject', 'social_studies')
    .order('grade_range');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Encontrados ${modules.length} módulos de ciencias sociales:\n`);

  for (const module of modules) {
    // Contar steps enriquecidos
    const { data: steps } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', module.id);

    const enrichedCount = steps?.filter(s => s.enriched_content !== null).length || 0;
    const totalSteps = steps?.length || 0;

    console.log(`📦 ${module.title}`);
    console.log(`   ID: ${module.id}`);
    console.log(`   Grado: ${module.grade_range}`);
    console.log(`   Steps: ${enrichedCount}/${totalSteps} enriquecidos`);
    console.log();
  }
}

findModulesByGrade()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
