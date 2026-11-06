require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyFinal() {
  console.log('\n========================================');
  console.log('SOCIAL STUDIES - VERIFICACIÓN FINAL');
  console.log('========================================\n');

  try {
    // Get all Social Studies modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id')
      .eq('subject', 'social_studies');

    if (modulesError) throw modulesError;

    console.log(`📚 Total módulos Social Studies: ${modules.length}`);

    const moduleIds = modules.map(m => m.id);

    // Get total steps count
    const { count: totalSteps, error: countError } = await supabase
      .from('module_steps')
      .select('id', { count: 'exact', head: true })
      .in('module_id', moduleIds);

    if (countError) throw countError;

    console.log(`📝 Total steps Social Studies: ${totalSteps}`);

    // Get enriched steps count
    const { count: enrichedCount, error: enrichedError } = await supabase
      .from('module_steps')
      .select('id', { count: 'exact', head: true })
      .in('module_id', moduleIds)
      .not('enriched_content', 'is', null);

    if (enrichedError) throw enrichedError;

    console.log(`✅ Steps enriquecidos: ${enrichedCount}`);
    console.log(`📊 Porcentaje: ${((enrichedCount / totalSteps) * 100).toFixed(1)}%`);

    // Get sample of enriched steps to verify
    const { data: sampleSteps, error: sampleError } = await supabase
      .from('module_steps')
      .select('id, module_id, step_order, enriched_content')
      .in('module_id', moduleIds)
      .not('enriched_content', 'is', null)
      .limit(5);

    if (sampleError) throw sampleError;

    console.log('\n🔍 MUESTRA DE STEPS ENRIQUECIDOS (primeros 5):');
    sampleSteps.forEach((step, i) => {
      const content = step.enriched_content;
      console.log(`\n   ${i + 1}. Step ID: ${step.id}`);
      console.log(`      Module ID: ${step.module_id}`);
      console.log(`      Step Order: ${step.step_order}`);
      console.log(`      Cognitive Dimension: ${content.cognitive_dimension || 'N/A'}`);
      console.log(`      Has expected_answer: ${!!content.expected_answer}`);
      console.log(`      Has misconceptions: ${Array.isArray(content.misconceptions) && content.misconceptions.length > 0}`);
    });

    console.log('\n========================================');
    console.log('VERIFICACIÓN COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

verifyFinal();
