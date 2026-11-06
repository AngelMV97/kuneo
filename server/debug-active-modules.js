require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActiveModules() {
  console.log('🔍 Verificando módulos activos...\n');
  
  // Consulta EXACT que usa el servidor
  const { data, error } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title, grade_range, subject, is_active')
    .eq('is_active', true);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`Total módulos activos: ${data.length}\n`);
  
  // Buscar el módulo 1cfd46d3
  const target = data.find(m => m.id === '1cfd46d3-14f3-45f7-b117-6cddadee7821');
  
  if (target) {
    console.log('✅ Módulo 1cfd46d3 ESTÁ en la lista de activos:');
    console.log(JSON.stringify(target, null, 2));
  } else {
    console.log('❌ Módulo 1cfd46d3 NO está en la lista de activos');
  }
  
  // Buscar módulos de social_studies grado 8-9
  const socialStudies89 = data.filter(m => m.subject === 'social_studies' && m.grade_range === '8-9');
  console.log(`\n📚 Módulos de Ciencias Sociales 8-9: ${socialStudies89.length}`);
  socialStudies89.forEach(m => {
    console.log(`  - ${m.id}: ${m.title}`);
  });
}

checkActiveModules().catch(console.error);
