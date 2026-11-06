// Debug directo de queries English
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function debugQueries() {
  console.log('\n🔍 DEBUG DE QUERIES ENGLISH\n');
  console.log('='.repeat(60));
  
  const testModuleId = '756cd440-432e-4e03-af4c-cf038aca76c1';
  
  // Test 1: Obtener módulo
  console.log('\n📝 Test 1: Obtener módulo por ID\n');
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', testModuleId)
    .single();
  
  if (moduleError) {
    console.error('   ❌ Error:', moduleError);
  } else if (module) {
    console.log(`   ✅ Módulo encontrado: "${module.title}"`);
    console.log(`      ID: ${module.id}`);
    console.log(`      Subject: ${module.subject}`);
  } else {
    console.log('   ⚠️  Módulo no encontrado');
  }
  
  // Test 2: Count steps
  console.log('\n📝 Test 2: Count de steps para este módulo\n');
  const { count, error: countError } = await supabase
    .from('module_steps')
    .select('*', { count: 'exact', head: true })
    .eq('module_id', testModuleId);
  
  if (countError) {
    console.error('   ❌ Error:', countError);
  } else {
    console.log(`   ✅ Count: ${count} steps`);
  }
  
  // Test 3: Select steps (sin limit)
  console.log('\n📝 Test 3: Select steps (sin order)\n');
  const { data: steps1, error: steps1Error } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', testModuleId);
  
  if (steps1Error) {
    console.error('   ❌ Error:', steps1Error);
  } else if (steps1 && steps1.length > 0) {
    console.log(`   ✅ Steps encontrados: ${steps1.length}`);
    steps1.forEach(s => {
      console.log(`      - Step ${s.step_order}: ${s.step_type} | Enriched: ${s.enriched_content ? 'YES' : 'NO'}`);
    });
  } else {
    console.log('   ⚠️  No se encontraron steps');
  }
  
  // Test 4: Select steps (con order)
  console.log('\n📝 Test 4: Select steps (con .order())\n');
  const { data: steps2, error: steps2Error } = await supabase
    .from('module_steps')
    .select('id, step_order, step_type, enriched_content')
    .eq('module_id', testModuleId)
    .order('step_order');
  
  if (steps2Error) {
    console.error('   ❌ Error:', steps2Error);
  } else if (steps2 && steps2.length > 0) {
    console.log(`   ✅ Steps encontrados: ${steps2.length}`);
  } else {
    console.log('   ⚠️  No se encontraron steps');
  }
  
  // Test 5: Select steps de CUALQUIER módulo English
  console.log('\n📝 Test 5: Sample de steps English (primeros 10)\n');
  const { data: allEnglishModules } = await supabase
    .from('modules')
    .select('id')
    .eq('subject', 'english')
    .limit(10);
  
  if (allEnglishModules && allEnglishModules.length > 0) {
    const moduleIds = allEnglishModules.map(m => m.id);
    console.log(`   Módulos: ${moduleIds.length}`);
    
    const { data: sampleSteps, count: sampleCount } = await supabase
      .from('module_steps')
      .select('*', { count: 'exact' })
      .in('module_id', moduleIds);
    
    console.log(`   ✅ Steps encontrados: ${sampleCount}`);
    if (sampleSteps && sampleSteps.length > 0) {
      console.log(`   Sample (primeros 5):`);
      sampleSteps.slice(0, 5).forEach(s => {
        console.log(`      - Module: ${s.module_id.substring(0, 8)}... | Step ${s.step_order}`);
      });
    }
  }
  
  // Test 6: Verificar schema
  console.log('\n📝 Test 6: Verificar conexión y schema\n');
  console.log(`   URL: ${process.env.SUPABASE_URL}`);
  console.log(`   Schema: kuneo`);
  console.log(`   Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ NO configurada'}`);
}

debugQueries()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
