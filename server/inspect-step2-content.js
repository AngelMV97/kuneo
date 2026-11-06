/**
 * Ver contenido detallado del step 2 de cada módulo
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULES = [
  { id: 'e43bb575-a5d6-4bee-bc97-c7895421ae13', name: 'Grado 1-3' },
  { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', name: 'Grado 4-5 (original)' },
  { id: 'ac62bde3-ea14-4fcd-82a1-15da56067ab9', name: 'Grado 4-5 (alternativo)' },
  { id: 'd8365a0a-9d61-43dd-ae0d-7d9841e4a52b', name: 'Grado 6' },
  { id: '2657df4d-0c9a-4c8b-82a7-e1fd1edbf8c1', name: 'Grado 7' },
  { id: 'ff576221-b3b0-42c4-8b8b-81e47baa5555', name: 'Grado 8-9' },
  { id: '4b319ed1-ed26-4c04-bbae-05d955da24eb', name: 'Grado 10-11' }
];

async function inspectStep2Content() {
  console.log('\n🔍 Inspeccionando contenido del Step 2 de cada módulo...\n');

  for (const module of MODULES) {
    const { data: step } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', module.id)
      .eq('step_order', 2)
      .single();

    if (!step || !step.enriched_content) {
      console.log(`❌ ${module.name}: Sin step 2 o sin enriquecimiento\n`);
      continue;
    }

    const content = step.enriched_content;
    const question = content.question || content.questions?.[0]?.text;
    const context = content.context || content.questions?.[0]?.context;

    console.log(`📦 ${module.name}`);
    console.log(`   Pregunta: ${question}`);
    console.log(`   Contexto: ${context?.substring(0, 100) || 'Sin contexto'}...`);
    console.log(`   Opciones: ${content.options?.length || content.questions?.[0]?.options?.length || 0}`);
    console.log(`   Tipo: ${content.type || 'no especificado'}`);
    console.log();
  }
}

inspectStep2Content()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
