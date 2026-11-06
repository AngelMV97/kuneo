require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

// Step 5: Guided Application - matching (CORREGIDO)
const step5ContentFixed = {
  type: 'matching',
  question: 'Relaciona cada práctica histórica con el tipo de argumento usado para justificarla:',
  context: 'Las sociedades del pasado usaban diferentes tipos de argumentos para legitimar prácticas que hoy rechazamos. Comprender estos argumentos nos ayuda a pensar críticamente sobre el presente.',
  left_items: [
    'Esclavitud de africanos en América',
    'Inquisición española',
    'Conquista de pueblos indígenas',
    'Segregación racial (siglo XX)'
  ],
  right_items: [
    'Los africanos son "naturalmente esclavos" e inferiores',
    'Dios nos ordena evangelizar y salvar almas paganas',
    'Debemos mantener la pureza de la fe cristiana',
    'Las razas deben separarse por inferioridad genética'
  ],
  phase: 'guided_application',
  hint: 'Piensa en qué tipo de razones específicas daban las autoridades de cada época.',
  expected_answer: {
    type: 'matching',
    correct_pairs: [[0, 0], [1, 2], [2, 1], [3, 3]],
    evaluation_strategy: 'matching',
    explanation: '¡Excelente! Has relacionado correctamente las prácticas históricas con los argumentos específicos usados para justificarlas.',
    misconceptions: []
  },
  cognitive_dimension: 'aplicacion'
};

async function fixStep5() {
  console.log('🔧 Corrigiendo Step 5 (matching) del módulo 4b94fd6c...\n');
  
  console.log('📌 Nuevo matching correcto (1:1):');
  console.log('   0. Esclavitud de africanos → "naturalmente esclavos" e inferiores');
  console.log('   1. Inquisición española → mantener la pureza de la fe cristiana');
  console.log('   2. Conquista de pueblos indígenas → evangelizar y salvar almas paganas');
  console.log('   3. Segregación racial (siglo XX) → razas deben separarse por inferioridad\n');

  const { error } = await supabase
    .from('module_steps')
    .update({ 
      enriched_content: step5ContentFixed,
      phase: step5ContentFixed.phase
    })
    .eq('id', '316df857-26a5-4c63-ac42-ea2352e5cc79');

  if (error) {
    console.error('❌ Error actualizando step 5:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Step 5 corregido exitosamente');
    console.log('\n📝 Ahora cada práctica tiene su argumento específico (relación 1:1)\n');
  }

  process.exit(0);
}

fixStep5().catch(console.error);
