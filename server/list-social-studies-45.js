require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listModules() {
  // Buscar módulos conocidos de ciencias sociales
  const knownIds = [
    '604231bc-8ce4-45e7-932d-745d821dfeaa', // Grados 4-5
    '4b94fd6c-ea04-4889-b025-546fc6e5ab1f', // Grados 6-7
    '1cfd46d3-14f3-45f7-b117-6cddadee7821', // Grados 8-9
    '10eacd17-7dbd-4d2d-8292-9a1257f9114c', // Grados 10-11
    'e43bb575-a5d6-4bee-bc97-c7895421ae13', // Grados 1-3
    '50723c30-801e-4fcf-a0d9-bc8aabf7d392'  // Nuevo módulo grados 1-3
  ];

  console.log('\nBuscando módulos de Social Studies conocidos...\n');

  for (const id of knownIds) {
    const { data, error } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.log(`❌ ${id}: No encontrado`);
    } else {
      console.log(`✅ ${data.title}`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Subject: ${data.subject || 'N/A'}`);
      console.log(`   Grades: ${data.grades || 'N/A'}\n`);
    }
  }
}

listModules();
