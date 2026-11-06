// Verificar schema de la tabla modules
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkModulesSchema() {
  console.log('\n🔍 Verificando schema de tabla modules...\n');
  
  // Obtener un módulo de ejemplo para ver las columnas
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Columnas disponibles en modules:\n');
    Object.keys(data[0]).forEach(col => {
      console.log(`   - ${col}: ${typeof data[0][col]}`);
    });
    
    console.log('\n📄 Ejemplo de módulo:\n');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkModulesSchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
