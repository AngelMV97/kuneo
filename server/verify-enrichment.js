require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verify() {
  const { data, error } = await supabase
    .from('module_steps')
    .select('step_order, enriched_content')
    .eq('module_id', 'e43bb575-a5d6-4bee-bc97-c7895421ae13')
    .in('step_order', [4, 5, 6])
    .order('step_order');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Verificación de nuevos tipos de pregunta:\n');
  data.forEach(step => {
    const type = step.enriched_content?.type || 'N/A';
    const question = step.enriched_content?.question?.substring(0, 60) || 'N/A';
    console.log(`📝 Step ${step.step_order}:`);
    console.log(`   Tipo: ${type}`);
    console.log(`   Pregunta: ${question}...`);
    console.log('');
  });
}

verify();
