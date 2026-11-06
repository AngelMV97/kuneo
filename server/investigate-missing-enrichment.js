// Investigación urgente - ¿Dónde están los steps enriquecidos?
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function investigate() {
  console.log('\n🔍 INVESTIGACIÓN URGENTE\n');
  
  // 1. Buscar CUALQUIER step con enriched_content no-null
  console.log('1️⃣ Buscando steps con enriched_content no-null...');
  const { data: anyEnriched, error: e1 } = await supabase
    .from('module_steps')
    .select('id, module_id, enriched_content, enrichment_status')
    .not('enriched_content', 'is', null)
    .limit(10);
  
  if (e1) console.error('Error:', e1);
  console.log(`   Encontrados: ${anyEnriched?.length || 0}`);
  if (anyEnriched && anyEnriched.length > 0) {
    console.log('   Muestra:');
    anyEnriched.slice(0, 3).forEach(s => {
      console.log(`   - ${s.id.substring(0,8)}... status: ${s.enrichment_status}, content: ${s.enriched_content ? 'EXISTS' : 'null'}`);
    });
  }
  
  // 2. Ver valores únicos de enrichment_status
  console.log('\n2️⃣ Valores de enrichment_status...');
  const { data: allSteps, error: e2 } = await supabase
    .from('module_steps')
    .select('enrichment_status')
    .limit(1000);
  
  if (e2) console.error('Error:', e2);
  if (allSteps) {
    const statusCounts = {};
    allSteps.forEach(s => {
      statusCounts[s.enrichment_status] = (statusCounts[s.enrichment_status] || 0) + 1;
    });
    console.log('   Distribución (muestra de 1000):');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - "${status}": ${count}`);
    });
  }
  
  // 3. Contar total con diferentes filtros
  console.log('\n3️⃣ Conteos con diferentes filtros...');
  
  const { count: countEnriched } = await supabase
    .from('module_steps')
    .select('*', { count: 'exact', head: true })
    .eq('enrichment_status', 'enriched');
  console.log(`   enrichment_status='enriched': ${countEnriched}`);
  
  const { count: countNotNull } = await supabase
    .from('module_steps')
    .select('*', { count: 'exact', head: true })
    .not('enriched_content', 'is', null);
  console.log(`   enriched_content NOT NULL: ${countNotNull}`);
  
  const { count: countPending } = await supabase
    .from('module_steps')
    .select('*', { count: 'exact', head: true })
    .eq('enrichment_status', 'pending');
  console.log(`   enrichment_status='pending': ${countPending}`);
  
  const { count: totalSteps } = await supabase
    .from('module_steps')
    .select('*', { count: 'exact', head: true });
  console.log(`   TOTAL steps: ${totalSteps}`);
  
  // 4. Verificar si existe data de enrichment en alguna otra tabla
  console.log('\n4️⃣ Verificando tablas relacionadas...');
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables_in_schema', { schema_name: 'kuneo' });
  if (!tablesError && tables) {
    console.log(`   Tablas en schema kuneo:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
  }
  
  // 5. Sample de steps para ver estructura
  console.log('\n5️⃣ Estructura de steps (sample)...');
  const { data: sample, error: e5 } = await supabase
    .from('module_steps')
    .select('id, step_type, enrichment_status, enriched_content')
    .limit(3);
  
  if (e5) console.error('Error:', e5);
  if (sample) {
    sample.forEach((s, i) => {
      console.log(`\n   Step ${i+1}:`);
      console.log(`   - ID: ${s.id}`);
      console.log(`   - Type: ${s.step_type}`);
      console.log(`   - Status: ${s.enrichment_status}`);
      console.log(`   - Enriched Content: ${s.enriched_content ? 'EXISTS' : 'null'}`);
    });
  }
}

investigate()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
