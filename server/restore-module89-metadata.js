require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

async function restoreModule89Metadata() {
  console.log('🔄 Restaurando metadata del módulo 8-9...\n');

  const originalMetadata = {
    title: '¿Cómo analizar una situación social?',
    core_concept: 'sociedad',
    learning_objective: 'Identifico algunas corrientes de pensamiento económico, político, cultural y filosófico del siglo XIX y explico su influencia en el pensamiento colombiano y el de América Latina.'
  };

  const { error } = await supabase
    .from('modules')
    .update(originalMetadata)
    .eq('id', MODULE_ID);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('✅ Metadata del módulo 8-9 restaurada:');
  console.log(`   Título: ${originalMetadata.title}`);
  console.log(`   Core Concept: ${originalMetadata.core_concept}`);
  console.log(`   Learning Objective: ${originalMetadata.learning_objective.substring(0, 80)}...`);
  console.log('\n⚠️  NOTA: Los steps aún tienen contenido de "Globalización".');
  console.log('   El enriched_content original se perdió porque no había backup.');
}

restoreModule89Metadata().catch(console.error);
