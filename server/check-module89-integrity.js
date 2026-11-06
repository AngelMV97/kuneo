require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkModule89() {
  const { data: steps } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .order('step_order');

  console.log('📚 MÓDULO 8-9: Verificando integridad de todos los steps\n');
  console.log('='.repeat(80));

  for (const step of steps) {
    const ec = step.enriched_content;
    console.log(`\nStep ${step.step_order}:`);
    console.log(`  Tipo: ${ec.type}`);
    console.log(`  Pregunta: ${ec.question?.substring(0, 60)}...`);
    console.log(`  Expected Answer: ${ec.expected_answer ? '✅ Presente' : '❌ FALTA'}`);
    
    if (ec.expected_answer) {
      if (ec.type === 'option') {
        console.log(`    - options: ${ec.expected_answer.options ? '✅' : '❌ FALTA'}`);
        console.log(`    - correct: ${ec.expected_answer.correct}`);
      } else if (ec.type === 'keywords') {
        console.log(`    - keywords: ${ec.expected_answer.keywords ? '✅ (' + ec.expected_answer.keywords.length + ')' : '❌'}`);
        console.log(`    - min_keywords: ${ec.expected_answer.min_keywords || '❌ FALTA'}`);
      } else if (ec.type === 'multiple_select') {
        console.log(`    - options: ${ec.expected_answer.options ? '✅' : '❌'}`);
        console.log(`    - correct: ${ec.expected_answer.correct ? '✅ (' + ec.expected_answer.correct.length + ')' : '❌'}`);
      } else if (ec.type === 'matching') {
        console.log(`    - pairs: ${ec.expected_answer.pairs ? '✅ (' + ec.expected_answer.pairs.length + ')' : '❌'}`);
      } else if (ec.type === 'ordering') {
        console.log(`    - correct_order: ${ec.expected_answer.correct_order ? '✅ (' + ec.expected_answer.correct_order.length + ')' : '❌'}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
}

checkModule89().catch(console.error);
