/**
 * Verificar perfil del usuario de prueba "Luang"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PROFILE_ID = '7a09a5ff-33aa-4fce-b0ec-2b5ae64cccf0';

async function checkProfile() {
  console.log('🔍 VERIFICANDO PERFIL DE "LUANG"\n');

  // Usar el mismo RPC que usa el frontend
  const { data: profileData, error } = await supabase
    .rpc('kuneo_get_user_profile', { p_user_id: PROFILE_ID });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📋 Respuesta del RPC:');
  console.log('  Data:', JSON.stringify(profileData, null, 2));
  console.log('  Es array:', Array.isArray(profileData));
  
  if (!profileData || (Array.isArray(profileData) && profileData.length === 0)) {
    console.log('\n❌ No se encontró perfil para user_id:', PROFILE_ID);
    return;
  }

  const profile = Array.isArray(profileData) ? profileData[0] : profileData;

  console.log('\n📋 Datos del perfil:');
  console.log('  ID:', profile.id);
  console.log('  User ID:', profile.user_id);
  console.log('  Username:', profile.username);
  console.log('  Grade:', profile.grade, '(tipo:', typeof profile.grade + ')');
  console.log('  Created:', profile.created_at);
  
  console.log('\n✅ Perfil encontrado');
  
  if (!profile.grade) {
    console.log('\n⚠️  El campo grade está NULL o vacío');
  } else {
    console.log('\n✅ El campo grade tiene valor:', profile.grade);
  }
}

checkProfile()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
