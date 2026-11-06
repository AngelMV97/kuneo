/**
 * Verificar estructura de la tabla module_steps
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkTableStructure() {
  console.log('\n🔍 Verificando estructura de module_steps...\n');

  // Obtener un step de ejemplo
  const { data, error } = await supabase
    .from('module_steps')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('📋 Columnas encontradas:');
    console.log(Object.keys(data[0]));
    console.log('\n📝 Ejemplo de step:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('❌ No se encontraron steps en la tabla');
  }
}

checkTableStructure()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
