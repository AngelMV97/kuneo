require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listSubjects() {
  console.log('🔍 Verificando valores de subject en la base de datos...\n');

  // Obtener todos los valores únicos de subject
  const { data: modules } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('subject')
    .eq('is_active', true);

  if (!modules) {
    console.log('No se encontraron módulos');
    process.exit(1);
  }

  // Contar por subject
  const subjectCounts = {};
  modules.forEach(mod => {
    const subject = mod.subject;
    subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
  });

  console.log('📚 Valores de subject en la base de datos:');
  Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subject, count]) => {
      console.log(`  ${subject}: ${count} módulos`);
    });

  console.log('\n📝 Lo que el frontend busca:');
  console.log('  - matematicas');
  console.log('  - lenguaje');
  console.log('  - ciencias');
  console.log('  - sociales');
  console.log('  - ingles');

  console.log('\n❌ Hay un MISMATCH entre los valores del frontend y la base de datos.');
  console.log('💡 Solución: Actualizar los IDs de subjects en CourseCatalog.jsx.');

  process.exit(0);
}

listSubjects().catch(console.error);
