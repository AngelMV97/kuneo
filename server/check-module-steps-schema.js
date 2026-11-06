// Verificar schema de module_steps
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function checkModuleStepsSchema() {
  console.log('\n🔍 Verificando schema de module_steps...\n');
  
  const { data, error } = await supabase
    .from('module_steps')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Columnas disponibles en module_steps:\n');
    Object.keys(data[0]).forEach(col => {
      const value = data[0][col];
      const type = typeof value;
      const isNull = value === null;
      console.log(`   - ${col}: ${isNull ? 'null' : type}`);
    });
    
    console.log('\n📄 Ejemplo de step:\n');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkModuleStepsSchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
