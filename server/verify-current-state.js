require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function verifyModules() {
  console.log('\n🔍 VERIFICANDO ESTADO ACTUAL DE MÓDULOS\n');
  
  const modules = [
    { id: 'e43bb575-a5d6-4bee-bc97-c7895421ae13', name: 'Organizaciones Sociales (1-3)' },
    { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', name: 'Nomadismo y Sedentarismo (4-5)' }
  ];
  
  for (const module of modules) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 ${module.name}`);
    console.log(`   ID: ${module.id}`);
    console.log(`${'='.repeat(80)}\n`);
    
    const { data: steps, error } = await supabase
      .from('module_steps')
      .select('*')
      .eq('module_id', module.id)
      .order('step_order');
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      continue;
    }
    
    for (const step of steps) {
      const content = step.enriched_content;
      const isPlaceholder = !content || 
                           !content.type || 
                           content.question?.includes('[') || 
                           content.question?.includes('Pregunta 1 sobre');
      
      console.log(`Step ${step.step_order} (${step.phase || step.cognitive_dimension || 'N/A'}):`);
      console.log(`   Tipo: ${content?.type || 'NO DEFINIDO'}`);
      console.log(`   Pregunta: ${content?.question?.substring(0, 70)}...`);
      
      if (content?.type === 'matching' && content?.pairs) {
        console.log(`   Pares: ${content.pairs.length} pares definidos`);
        content.pairs.forEach((pair, idx) => {
          console.log(`      ${idx + 1}. ${pair.left} → ${pair.right}`);
        });
      }
      
      if (content?.type === 'option' && content?.options) {
        console.log(`   Opciones: ${content.options.length} opciones`);
      }
      
      if (content?.type === 'multiple_select') {
        console.log(`   Opciones múltiples: ${content.options?.length || 0} opciones`);
        if (content.expected_answer?.correct_options) {
          console.log(`   Correctas: ${content.expected_answer.correct_options.join(', ')}`);
        }
      }
      
      console.log(isPlaceholder ? '   ⚠️  PLACEHOLDER' : '   ✅ REAL');
      console.log('');
    }
  }
}

verifyModules().catch(console.error);
