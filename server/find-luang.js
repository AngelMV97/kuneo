/**
 * Encontrar user_id del usuario "Luang" (luang@test.com)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USERNAME = 'Luang';

async function findLuang() {
  console.log('🔍 BUSCANDO USUARIO "LUANG"\n');

  // Buscar por username en kuneo.profiles (sin schema prefix)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', USERNAME);

  if (profileError) {
    console.log('❌ Error buscando en profiles:', profileError.message);
  } else if (profiles && profiles.length > 0) {
    console.log('✅ Encontrado en profiles:');
    profiles.forEach(p => {
      console.log('  User ID:', p.user_id);
      console.log('  Profile ID:', p.id);
      console.log('  Username:', p.username);
      console.log('  Grade:', p.grade);
      console.log('  Email:', p.email);
      console.log();
    });
  }

  // Intentar buscar en auth.users directamente (necesita service_role)
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Error listando usuarios:', authError.message);
  } else {
    const luangUser = users.find(u => u.email?.includes('luang'));
    if (luangUser) {
      console.log('✅ Encontrado en auth.users:');
      console.log('  User ID:', luangUser.id);
      console.log('  Email:', luangUser.email);
      console.log('  Created:', luangUser.created_at);
    }
  }
}

findLuang()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
