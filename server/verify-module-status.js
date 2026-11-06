require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyModule() {
  const moduleId = '1cfd46d3-14f3-45f7-b117-6cddadee7821';
  
  // Consulta directa SIN filtros
  const { data: direct, error: e1 } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();
  
  console.log('📋 Consulta directa del módulo:');
  if (e1) {
    console.log('❌ Error:', e1.message);
  } else if (direct) {
    console.log(`  ID: ${direct.id}`);
    console.log(`  Title: ${direct.title}`);
    console.log(`  Grade: ${direct.grade_range}`);
    console.log(`  Subject: ${direct.subject}`);
    console.log(`  is_active: ${direct.is_active}`);
    console.log(`  order_index: ${direct.order_index}`);
  } else {
    console.log('❌ Módulo no encontrado');
  }
  
  // Consulta CON filtro is_active = true (la que usa el servidor)
  const { data: filtered, error: e2 } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title')
    .eq('id', moduleId)
    .eq('is_active', true);
  
  console.log('\n📋 Consulta con filtro is_active=true:');
  if (e2) {
    console.log('❌ Error:', e2.message);
  } else if (filtered && filtered.length > 0) {
    console.log('✅ Módulo APARECE en la consulta filtrada');
  } else {
    console.log('❌ Módulo NO aparece en la consulta filtrada');
  }
  
  // Verificar steps
  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('step_order')
    .eq('module_id', moduleId)
    .not('enriched_content', 'is', null);
  
  console.log(`\n📚 Steps con enriched_content: ${steps ? steps.length : 0}`);
}

verifyModule().catch(console.error);
