require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function fixModuleTitles() {
  console.log('🔧 Corrigiendo títulos de módulos...\n');

  const corrections = [
    {
      id: '604231bc-8ce4-45e7-932d-745d821dfeaa',
      title: '¿Cómo analizar una situación social?',
      core_concept: 'estudios_sociales',
      learning_objective: 'Me ubico en el entorno físico utilizando referentes espaciales (izquierda, derecha, puntos cardinales).'
    },
    {
      id: '4b94fd6c-ea04-4889-b025-546fc6e5ab1f',
      title: '¿Cómo analizar una situación social?',
      core_concept: 'sociedad',
      learning_objective: 'Identifico algunas corrientes de pensamiento económico, político, cultural y filosófico del siglo XIX y explico su influencia en el pensamiento colombiano y el de América Latina.'
    }
  ];

  for (const correction of corrections) {
    const { error } = await supabase
      .from('modules')
      .update({
        title: correction.title,
        core_concept: correction.core_concept,
        learning_objective: correction.learning_objective
      })
      .eq('id', correction.id);

    if (error) {
      console.log(`❌ Error con ${correction.id}:`, error.message);
    } else {
      console.log(`✅ Corregido: ${correction.id}`);
      console.log(`   Título: ${correction.title}`);
      console.log(`   Core Concept: ${correction.core_concept}\n`);
    }
  }

  console.log('✅ Títulos corregidos');
}

fixModuleTitles().catch(console.error);
