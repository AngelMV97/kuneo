require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const RESTORED_MODULES = [
  { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', grade: '4-5', tema: 'Nomadismo y Sedentarismo' },
  { id: '4b94fd6c-ea04-4889-b025-546fc6e5ab1f', grade: '6-7', tema: 'Análisis Crítico de Prácticas Históricas' },
  { id: '1cfd46d3-14f3-45f7-b117-6cddadee7821', grade: '8-9', tema: 'Metadata Restaurada' }
];

async function verifyRestoredModules() {
  console.log('🔍 Verificando módulos restaurados...\n');
  console.log('='.repeat(80));

  for (const mod of RESTORED_MODULES) {
    console.log(`\n📚 Grados ${mod.grade}: ${mod.tema}`);
    console.log(`   ID: ${mod.id}\n`);

    const { data: module } = await supabase
      .from('modules')
      .select('title, core_concept')
      .eq('id', mod.id)
      .single();

    console.log(`   Título: ${module.title}`);
    console.log(`   Core Concept: ${module.core_concept}`);

    const { data: steps } = await supabase
      .from('module_steps')
      .select('step_order, enriched_content')
      .eq('module_id', mod.id)
      .order('step_order');

    const enrichedCount = steps.filter(s => 
      s.enriched_content && 
      s.enriched_content.tutor_responses && 
      s.enriched_content.step_config
    ).length;

    console.log(`   Steps: ${steps.length} total, ${enrichedCount} enriquecidos`);

    if (steps.length > 0 && steps[0].enriched_content) {
      console.log(`   Primer step: "${steps[0].enriched_content.question?.substring(0, 60)}..."`);
    }

    if (enrichedCount === 8) {
      console.log(`   ✅ RESTAURADO CORRECTAMENTE`);
    } else if (enrichedCount > 0) {
      console.log(`   ⚠️  PARCIALMENTE RESTAURADO`);
    } else {
      console.log(`   ❌ SIN RESTAURAR`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verificación completada');
}

verifyRestoredModules().catch(console.error);
