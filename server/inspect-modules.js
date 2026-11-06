require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function inspectModules() {
  console.log('🔍 Inspeccionando módulos problemáticos...\n');

  // Módulo 6-7: Step 3 con problema de keywords
  console.log('=' .repeat(80));
  console.log('📚 MÓDULO 6-7: 4b94fd6c-ea04-4889-b025-546fc6e5ab1f\n');
  
  const { data: step3_67 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .eq('step_order', 3)
    .single();

  console.log('STEP 3 (keywords):');
  console.log('Tipo:', step3_67.enriched_content.type);
  console.log('Pregunta:', step3_67.enriched_content.question);
  console.log('\nExpected Answer:');
  console.log('  Min Keywords:', step3_67.enriched_content.expected_answer.min_keywords);
  console.log('  Keywords:', JSON.stringify(step3_67.enriched_content.expected_answer.keywords, null, 2));
  
  // Módulo 8-9: Step 1 con tipo incorrecto
  console.log('\n' + '='.repeat(80));
  console.log('📚 MÓDULO 8-9: 1cfd46d3-14f3-45f7-b117-6cddadee7821\n');
  
  const { data: step1_89 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .eq('step_order', 1)
    .single();

  console.log('STEP 1:');
  console.log('Tipo:', step1_89.enriched_content.type);
  console.log('Pregunta:', step1_89.enriched_content.question);
  if (step1_89.enriched_content.type === 'keywords') {
    console.log('❌ ERROR: Debería ser tipo "option" pero es "keywords"');
    console.log('\nExpected Answer:');
    console.log('  Min Keywords:', step1_89.enriched_content.expected_answer.min_keywords);
  } else if (step1_89.enriched_content.type === 'option') {
    console.log('✅ Tipo correcto: option');
    console.log('\nOpciones:', step1_89.enriched_content.expected_answer.options);
  }

  console.log('\n' + '='.repeat(80));
}

inspectModules().catch(console.error);
