require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_IDS = [
  '1cfd46d3-14f3-45f7-b117-6cddadee7821', // Grade 8-9
  '10eacd17-7dbd-4d2d-8292-9a1257f9114c'  // Grade 10-11
];

async function resetEnrichment() {
  console.log('🔄 Limpiando enriched_content de módulos Grade 8-9 y 10-11...\n');

  for (const moduleId of MODULE_IDS) {
    console.log(`📌 Módulo ID: ${moduleId}`);

    // Obtener info del módulo
    const { data: module } = await supabase
      .from('modules')
      .select('title, grade_range')
      .eq('id', moduleId)
      .single();

    console.log(`   Título: ${module.title}`);
    console.log(`   Grado: ${module.grade_range}`);

    // Limpiar enriched_content de todos los steps
    const { error: updateError } = await supabase
      .from('module_steps')
      .update({ enriched_content: null })
      .eq('module_id', moduleId);

    if (updateError) {
      console.error(`   ❌ Error: ${updateError.message}`);
    } else {
      console.log(`   ✅ Limpiado\n`);
    }
  }

  console.log('✨ Proceso completado. Ahora ejecuta los scripts de enriquecimiento.');
}

resetEnrichment()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
