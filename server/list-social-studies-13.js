const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

(async () => {
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, title, grade_range, subject')
    .eq('subject', 'social_studies')
    .eq('grade_range', '1-3')
    .order('title');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Módulos de Social Studies grados 1-3:');
  console.log('=====================================\n');
  modules.forEach((m, i) => {
    console.log(`${i+1}. ${m.title}`);
    console.log(`   ID: ${m.id}`);
    console.log();
  });
  console.log(`Total: ${modules.length} módulos`);
})();
