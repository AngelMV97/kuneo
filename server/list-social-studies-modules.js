require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function listSocialStudiesModules() {
  console.log('🔍 Buscando módulos de Ciencias Sociales...\n');
  
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, title, subject, grade_range, core_concept')
    .eq('subject', 'social_studies')
    .order('grade_range');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total módulos de Ciencias Sociales: ${modules.length}\n`);

  // Verificar cuáles tienen enriched_content
  for (const module of modules) {
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', module.id)
      .order('step_order');

    if (stepsError) {
      console.error(`❌ Error getting steps for ${module.id}:`, stepsError);
      continue;
    }

    const enrichedCount = steps.filter(s => s.enriched_content && Object.keys(s.enriched_content).length > 0).length;
    const totalSteps = steps.length;
    const isComplete = enrichedCount === totalSteps && totalSteps === 8;

    console.log(`${isComplete ? '✅' : '⚠️ '} Grado ${module.grade_range} - ${module.title}`);
    console.log(`   ID: ${module.id}`);
    console.log(`   Concepto: ${module.core_concept}`);
    console.log(`   Steps: ${enrichedCount}/${totalSteps} enriquecidos`);
    console.log('');
  }

  process.exit(0);
}

listSocialStudiesModules().catch(console.error);
