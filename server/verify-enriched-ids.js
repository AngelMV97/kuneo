require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyEnrichedModules() {
  console.log('🔍 Verificando módulos REALMENTE enriquecidos en la base de datos...\n');

  // Obtener TODOS los módulos activos de social_studies
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, title, grade_range, core_concept')
    .eq('subject', 'social_studies')
    .eq('is_active', true)
    .order('grade_range');

  if (error) {
    console.error('❌ Error obteniendo módulos:', error.message);
    process.exit(1);
  }

  console.log(`📊 Total módulos de social_studies: ${modules.length}\n`);

  const fullyEnriched = [];

  for (const module of modules) {
    // Contar steps enriquecidos
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', module.id)
      .order('step_order');

    if (stepsError) continue;

    const enrichedCount = steps.filter(s => 
      s.enriched_content && 
      typeof s.enriched_content === 'object' &&
      s.enriched_content.type &&
      s.enriched_content.question
    ).length;

    if (enrichedCount === 8) {
      fullyEnriched.push({
        id: module.id,
        title: module.title,
        grade: module.grade_range,
        concept: module.core_concept,
        steps: steps
      });
    }
  }

  console.log(`✅ Módulos completamente enriquecidos: ${fullyEnriched.length}\n`);
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const mod of fullyEnriched) {
    console.log(`📚 ID: ${mod.id}`);
    console.log(`   Título: ${mod.title}`);
    console.log(`   Grado: ${mod.grade}`);
    console.log(`   Concepto: ${mod.concepto || 'N/A'}`);
    
    // Verificar tipos de cada step
    console.log('   Steps:');
    for (const step of mod.steps) {
      const type = step.enriched_content?.type || 'N/A';
      console.log(`     Step ${step.step_order}: ${type}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📋 LISTA DE IDs (solo copiar y pegar):\n');
  fullyEnriched.forEach(mod => {
    console.log(`${mod.id}  // ${mod.grade} - ${mod.title.substring(0, 50)}...`);
  });

  process.exit(0);
}

verifyEnrichedModules().catch(console.error);
