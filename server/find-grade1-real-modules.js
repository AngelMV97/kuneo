/**
 * Buscar módulos de ciencias sociales para grado 1 con enriquecimiento completo
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findGrade1Modules() {
  console.log('\n🔍 Buscando módulos de ciencias sociales para grado 1...\n');

  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, title, grade_range')
    .eq('subject', 'social_studies')
    .or('grade_range.eq.1,grade_range.eq.1-3')
    .order('grade_range');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Encontrados ${modules.length} módulos\n`);

  for (const module of modules) {
    // Contar steps enriquecidos
    const { data: steps } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', module.id);

    const enrichedCount = steps?.filter(s => s.enriched_content !== null).length || 0;
    const totalSteps = steps?.length || 0;

    if (enrichedCount === 8) {
      // Ver sample de step 2
      const step2 = steps.find(s => s.enriched_content !== null);
      const questionText = step2?.enriched_content?.question || 
                           step2?.enriched_content?.questions?.[0]?.text;
      
      const isReal = questionText && 
                     questionText.length > 50 && 
                     !questionText.includes('[') &&
                     !questionText.includes('placeholder');

      const status = isReal ? '✅ REAL' : '⚠️  PLACEHOLDER';

      console.log(`${status} ${module.title}`);
      console.log(`   ID: ${module.id}`);
      console.log(`   Grado: ${module.grade_range}`);
      console.log(`   Steps: ${enrichedCount}/${totalSteps}`);
      if (questionText) {
        console.log(`   Sample: ${questionText.substring(0, 70)}...`);
      }
      console.log();
    }
  }
}

findGrade1Modules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
