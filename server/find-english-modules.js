// Script para encontrar módulos de English completamente enriquecidos
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findEnglishTestModules() {
  console.log('\n🔍 Buscando módulos de English para testing...\n');
  
  // Obtener todos los módulos de english con sus steps
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('subject', 'english');
  
  if (modulesError) {
    console.error('❌ Error obteniendo módulos:', modulesError);
    return;
  }
  
  console.log(`📦 Total módulos English: ${modules.length}\n`);
  
  // Para cada módulo, contar steps y enriched steps
  const enrichedModules = [];
  
  for (const module of modules) {
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, step_order, step_type, enriched_content')
      .eq('module_id', module.id)
      .order('step_order');
    
    if (stepsError) continue;
    
    const totalSteps = steps.length;
    const enrichedSteps = steps.filter(s => s.enriched_content !== null).length;
    
    if (enrichedSteps === totalSteps && totalSteps >= 5) {
      // Extraer answer types y dimensions
      const answerTypes = new Set();
      const dimensions = new Set();
      
      steps.forEach(step => {
        if (step.enriched_content) {
          answerTypes.add(step.enriched_content.expected_answer?.type);
          dimensions.add(step.enriched_content.cognitive_dimension);
        }
      });
      
      enrichedModules.push({
        ...module,
        total_steps: totalSteps,
        enriched_steps: enrichedSteps,
        answer_types: Array.from(answerTypes),
        dimensions: Array.from(dimensions),
        first_step_id: steps[0]?.id
      });
    }
  }
  
  // Ordenar por difficulty y mostrar top 10
  enrichedModules.sort((a, b) => a.difficulty - b.difficulty);
  const top10 = enrichedModules.slice(0, 10);
  
  console.log(`📊 Encontrados ${enrichedModules.length} módulos completamente enriquecidos\n`);
  console.log('🎯 Top 10 módulos para testing:\n');
  
  top10.forEach((m, i) => {
    console.log(`${i + 1}. ${m.title}`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Concepto: ${m.core_concept}`);
    console.log(`   Dificultad: ${m.difficulty} | Grado: ${m.grade}`);
    console.log(`   Steps: ${m.total_steps} | Answer types: ${m.answer_types.join(', ')}`);
    console.log(`   Dimensions: ${m.dimensions.join(', ')}`);
    console.log(`   First step: ${m.first_step_id}\n`);
  });
  
  // Return module IDs for copy-paste
  if (top10.length > 0) {
    console.log('📋 Module IDs (para usar en test):\n');
    top10.slice(0, 3).forEach((m, i) => {
      console.log(`Module ${i + 1}: '${m.id}'`);
    });
  }
  
  return top10;
}

findEnglishTestModules()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
