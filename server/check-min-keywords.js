require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyMinKeywords() {
  console.log('🔍 Verificando política de min_keywords\n');
  console.log('='.repeat(80));

  // Módulo 6-7, Step 3
  const { data: s3_67, error: e3_67 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .eq('step_order', 3)
    .single();

  if (e3_67) {
    console.log('❌ Error obteniendo módulo 6-7 step 3:', e3_67.message);
  } else {
    const kw = s3_67.enriched_content.expected_answer.keywords.length;
    const expected = Math.floor(kw * 0.30);
    const actual = s3_67.enriched_content.expected_answer.min_keywords;
    console.log(`📚 MÓDULO 6-7, Step 3 (Política: 30%)`);
    console.log(`   Keywords: ${kw}`);
    console.log(`   Min esperado: ${expected}`);
    console.log(`   Min actual: ${actual} ${actual === expected ? '✅' : '❌'}\n`);
  }

  // Módulo 8-9, Step 3
  const { data: s3_89 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .eq('step_order', 3)
    .single();

  const kw3 = s3_89.enriched_content.expected_answer.keywords.length;
  const exp3 = Math.floor(kw3 * 0.35);
  const act3 = s3_89.enriched_content.expected_answer.min_keywords;

  console.log(`📚 MÓDULO 8-9, Step 3 (Política: 35%)`);
  console.log(`   Keywords: ${kw3}`);
  console.log(`   Min esperado: ${exp3}`);
  console.log(`   Min actual: ${act3} ${act3 === exp3 ? '✅' : '❌'}\n`);

  // Módulo 8-9, Step 8
  const { data: s8_89 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .eq('step_order', 8)
    .single();

  const kw8 = s8_89.enriched_content.expected_answer.keywords.length;
  const exp8 = Math.floor(kw8 * 0.30);
  const act8 = s8_89.enriched_content.expected_answer.min_keywords;

  console.log(`📚 MÓDULO 8-9, Step 8 (Política: 30%)`);
  console.log(`   Keywords: ${kw8}`);
  console.log(`   Min esperado: ${exp8}`);
  console.log(`   Min actual: ${act8} ${act8 === exp8 ? '✅' : '❌'}\n`);

  console.log('='.repeat(80));
}

verifyMinKeywords().catch(console.error);
