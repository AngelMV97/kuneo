// Script para verificar qué subjects existen en la base de datos
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkSubjects() {
  console.log('\n🔍 Verificando subjects en la base de datos...\n');
  
  // Query para obtener todos los subjects con sus conteos
  const { data: modules, error } = await supabase
    .from('modules')
    .select('subject')
    .order('subject');
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  // Agrupar por subject
  const subjectCounts = {};
  modules.forEach(m => {
    subjectCounts[m.subject] = (subjectCounts[m.subject] || 0) + 1;
  });
  
  console.log('📊 Subjects encontrados:\n');
  Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count} módulos`);
    });
  
  console.log('\n✅ Verificación completada\n');
}

checkSubjects();
