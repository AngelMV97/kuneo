require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findImperioIncaQuestion() {
  console.log('🔍 Buscando pregunta sobre Imperio Inca en la base de datos...\n');

  // Buscar en module_steps con enriched_content que contenga "Imperio Inca"
  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, module_id, enriched_content')
    .not('enriched_content', 'is', null)
    .limit(1000);

  if (!steps) {
    console.log('No se encontraron steps');
    process.exit(0);
  }

  console.log(`📊 Total steps con enriched_content: ${steps.length}`);
  
  // Buscar en el contenido
  let found = false;
  for (const step of steps) {
    const content = JSON.stringify(step.enriched_content).toLowerCase();
    if (content.includes('imperio inca') || content.includes('capital') && content.includes('inca')) {
      console.log('\n✅ ENCONTRADO:');
      console.log(`  Step ID: ${step.id}`);
      console.log(`  Module ID: ${step.module_id}`);
      console.log('\n📄 Contenido:');
      console.log(JSON.stringify(step.enriched_content, null, 2));
      found = true;
      break;
    }
  }

  if (!found) {
    console.log('\n❌ No se encontró la pregunta sobre Imperio Inca en la base de datos.');
    console.log('💡 Probablemente está siendo generada por el orchestrator cuando no hay pregunta.');
  }

  // Ver algunos ejemplos de enriched_content para entender la estructura
  console.log('\n\n📋 Ejemplos de enriched_content (primeros 3):');
  for (let i = 0; i < Math.min(3, steps.length); i++) {
    console.log(`\n--- Step ${i + 1} ---`);
    console.log(JSON.stringify(steps[i].enriched_content, null, 2).substring(0, 500) + '...');
  }

  process.exit(0);
}

findImperioIncaQuestion().catch(console.error);
