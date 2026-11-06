require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActiveModules() {
  console.log('🔍 Verificando módulos activos...\n');

  // Total módulos
  const { count: totalCount } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total módulos en DB: ${totalCount}`);

  // Módulos activos
  const { data: activeModules, count: activeCount } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, subject, title, is_active', { count: 'exact' })
    .eq('is_active', true)
    .limit(10);

  console.log(`✅ Módulos con is_active=true: ${activeCount}`);
  
  if (activeModules && activeModules.length > 0) {
    console.log('\n📋 Primeros 10 módulos activos:');
    activeModules.forEach((mod, i) => {
      console.log(`${i + 1}. [${mod.subject}] ${mod.title} (${mod.id})`);
    });
  }

  // Módulos por materia (activos)
  console.log('\n📚 Módulos activos por materia:');
  const subjects = ['matematicas', 'lenguaje', 'ciencias', 'sociales', 'ingles'];
  
  for (const subject of subjects) {
    const { count } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('subject', subject)
      .eq('is_active', true);
    
    console.log(`  - ${subject}: ${count} módulos`);
  }

  // Verificar si hay módulos con is_active = false o null
  const { count: inactiveCount } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .or('is_active.eq.false,is_active.is.null');

  console.log(`\n⚠️  Módulos inactivos (is_active=false o null): ${inactiveCount}`);

  // Verificar módulos con enriched_content pero inactivos
  const { data: enrichedButInactive } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, subject, title, is_active')
    .or('is_active.eq.false,is_active.is.null')
    .not('source_unit_id', 'is', null)
    .limit(5);

  if (enrichedButInactive && enrichedButInactive.length > 0) {
    console.log('\n🔧 Algunos módulos están enriquecidos pero inactivos:');
    enrichedButInactive.forEach((mod, i) => {
      console.log(`${i + 1}. [${mod.subject}] ${mod.title} - is_active: ${mod.is_active}`);
    });
  }

  process.exit(0);
}

checkActiveModules().catch(console.error);
