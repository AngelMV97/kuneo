require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyMinKeywords() {
  console.log('🔍 Verificando política de min_keywords para grados 8-9\n');
  console.log('Política: Step 3 = 35% (floor), Step 8 = 30% (floor)\n');
  console.log('='.repeat(80));

  // Verificar módulo 6-7 (step 3)
  const { data: step3_67 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .eq('step_order', 3)
    .single();

  const keywords67 = step3_67.enriched_content.expected_answer.keywords.length;
  const expected67 = Math.floor(keywords67 * 0.30);
  const actual67 = step3_67.enriched_content.expected_answer.min_keywords;
  
  console.log('📚 MÓDULO 6-7 (Política: 30%)');
  console.log(`   Step 3: ${keywords67} keywords → min debería ser ${expected67}, actual: ${actual67} ${actual67 === expected67 ? '✅' : '❌'}`);

  // Verificar módulo 8-9 (steps 3 y 8)
  const { data: step3_89 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .eq('step_order', 3)
    .single();

  const { data: step8_89 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .eq('step_order', 8)
    .single();

  const keywords3_89 = step3_89.enriched_content.expected_answer.keywords.length;
  const expected3_89 = Math.floor(keywords3_89 * 0.35);
  const actual3_89 = step3_89.enriched_content.expected_answer.min_keywords;

  const keywords8_89 = step8_89.enriched_content.expected_answer.keywords.length;
  const expected8_89 = Math.floor(keywords8_89 * 0.30);
  const actual8_89 = step8_89.enriched_content.expected_answer.min_keywords;

  console.log('\n📚 MÓDULO 8-9 (Política: Step 3=35%, Step 8=30%)');
  console.log(`   Step 3: ${keywords3_89} keywords → min debería ser ${expected3_89}, actual: ${actual3_89} ${actual3_89 === expected3_89 ? '✅' : '❌'}`);
  console.log(`   Step 8: ${keywords8_89} keywords → min debería ser ${expected8_89}, actual: ${actual8_89} ${actual8_89 === expected8_89 ? '✅' : '❌'}`);

  console.log('\n' + '='.repeat(80));
}

verifyMinKeywords().catch(console.error);
