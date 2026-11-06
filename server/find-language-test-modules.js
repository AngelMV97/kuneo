// Script para encontrar módulos de Language completamente enriquecidos
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findLanguageTestModules() {
  console.log('\n🔍 Buscando módulos de Language para testing...\n');
  
  // Obtener todos los módulos de language con sus steps
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .eq('subject', 'language');
  
  if (modulesError) {
    console.error('❌ Error obteniendo módulos:', modulesError);
    return;
  }
  
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
    
    // Cambiar criterio: al menos 3 steps enriquecidos (para testear lo que hay)
    if (enrichedSteps >= 3) {
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
    console.log(`   Dificultad: ${m.difficulty} | Grado: ${m.grade_min}-${m.grade_max}`);
    console.log(`   Steps: ${m.total_steps} | Answer types: ${m.answer_types.join(', ')}`);
    console.log(`   Dimensions: ${m.dimensions.join(', ')}`);
    console.log(`   First step: ${m.first_step_id}\n`);
  });
  
  return top10;
}

findLanguageTestModules();
