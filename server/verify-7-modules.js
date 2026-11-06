/**
 * Verificar los 7 módulos específicos de ciencias sociales
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const SPECIFIC_MODULES = [
  { id: 'e43bb575-a5d6-4bee-bc97-c7895421ae13', name: 'Grado 1-3' },
  { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', name: 'Grado 4-5 (original)' },
  { id: 'ac62bde3-ea14-4fcd-82a1-15da56067ab9', name: 'Grado 4-5 (alternativo)' },
  { id: 'd8365a0a-9d61-43dd-ae0d-7d9841e4a52b', name: 'Grado 6' },
  { id: '2657df4d-0c9a-4c8b-82a7-e1fd1edbf8c1', name: 'Grado 7' },
  { id: 'ff576221-b3b0-42c4-8b8b-81e47baa5555', name: 'Grado 8-9' },
  { id: '4b319ed1-ed26-4c04-bbae-05d955da24eb', name: 'Grado 10-11' }
];

async function verifySpecificModules() {
  console.log('\n🔍 Verificando los 7 módulos específicos de ciencias sociales...\n');

  for (const module of SPECIFIC_MODULES) {
    // Get module info
    const { data: moduleData } = await supabase
      .from('modules')
      .select('title, subject, grade_range')
      .eq('id', module.id)
      .single();

    // Get steps
    const { data: steps } = await supabase
      .from('module_steps')
      .select('step_order, enriched_content')
      .eq('module_id', module.id)
      .order('step_order');

    const enrichedCount = steps?.filter(s => s.enriched_content !== null).length || 0;
    const totalSteps = steps?.length || 0;

    // Sample step 2 content
    const step2 = steps?.find(s => s.step_order === 2);
    const questionText = step2?.enriched_content?.question || 
                         step2?.enriched_content?.questions?.[0]?.text;
    
    const isReal = questionText && 
                   questionText.length > 50 && 
                   !questionText.includes('[') && 
                   !questionText.includes('placeholder');

    const status = isReal ? '✅ REAL' : (questionText ? '⚠️  PLACEHOLDER' : '❌ VACÍO');

    console.log(`${status} ${module.name}`);
    console.log(`   ID: ${module.id}`);
    if (moduleData) {
      console.log(`   Título: ${moduleData.title}`);
      console.log(`   Grado DB: ${moduleData.grade_range}`);
    }
    console.log(`   Steps: ${enrichedCount}/${totalSteps} enriquecidos`);
    if (questionText) {
      console.log(`   Sample: ${questionText.substring(0, 70)}...`);
    }
    console.log();
  }
}

verifySpecificModules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
