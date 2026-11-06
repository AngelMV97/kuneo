/**
 * Listar todas las tablas del schema kuneo
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
  console.log('🔍 CONSULTANDO KUNEO.PROFILES\n');
  
  // Intentar consultar directamente la tabla profiles sin especificar columnas
  const { data: profileData, error: profileErr } = await supabase
    .schema('kuneo')
    .from('profiles')
    .select('*')
    .limit(3);
  
  if (profileErr) {
    console.log('❌ Error accediendo a profiles:', profileErr.message);
    return;
  }
  
  if (profileData.length === 0) {
    console.log('⚠️  No hay perfiles en la tabla');
    return;
  }
  
  console.log('✅ Estructura de profiles (primeros 3):');
  console.log(JSON.stringify(profileData, null, 2));
  
  console.log('\n📋 Campos disponibles:', Object.keys(profileData[0]).join(', '));
}

listTables()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
