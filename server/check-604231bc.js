require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkModule() {
  const { data, error } = await supabase
    .from('modules')
    .select('id, title, subject, grade_range, core_concept')
    .eq('id', '604231bc-8ce4-45e7-932d-745d821dfeaa')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('Módulo 604231bc:', data);
  process.exit(0);
}

checkModule().catch(console.error);
