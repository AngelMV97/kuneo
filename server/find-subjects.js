require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findSubjects() {
  console.log('🔍 Buscando nombres de materias en la base de datos...\n');

  const { data: subjects, error } = await supabase
    .from('modules')
    .select('subject')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  // Obtener valores únicos
  const unique = [...new Set(subjects.map(s => s.subject))];
  
  console.log('📚 Materias encontradas:');
  unique.forEach(sub => console.log(`   - "${sub}"`));
  
  console.log('\n');
  
  // Contar módulos por materia
  for (const subject of unique) {
    const { count } = await supabase
      .from('modules')
      .select('id', { count: 'exact', head: true })
      .eq('subject', subject)
      .eq('is_active', true);
    
    console.log(`   ${subject}: ${count} módulos activos`);
  }

  process.exit(0);
}

findSubjects().catch(console.error);
