require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectModule(moduleId) {
  console.log(`🔍 Inspeccionando módulo ${moduleId}...\n`);

  // Obtener módulo
  const { data: module } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (!module) {
    console.log('❌ Módulo no encontrado');
    process.exit(1);
  }

  console.log('📋 Información del módulo:');
  console.log(`  ID: ${module.id}`);
  console.log(`  Título: ${module.title}`);
  console.log(`  Materia: ${module.subject}`);
  console.log(`  Grado: ${module.grade_range}`);
  console.log(`  Concepto: ${module.core_concept}`);
  console.log(`  Objetivo: ${module.learning_objective}`);
  console.log(`  Dificultad: ${module.difficulty}`);

  // Obtener steps
  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .eq('module_id', moduleId)
    .order('step_order');

  console.log(`\n📊 Steps del módulo: ${steps?.length || 0}`);

  if (steps && steps.length > 0) {
    steps.forEach((step, i) => {
      console.log(`\n--- Step ${i + 1} (order: ${step.step_order}) ---`);
      console.log(`  ID: ${step.id}`);
      console.log(`  Has enriched_content: ${!!step.enriched_content}`);
      
      if (step.enriched_content) {
        const content = step.enriched_content;
        console.log(`  Question: ${content.question || 'N/A'}`);
        console.log(`  Concept: ${content.concept || 'N/A'}`);
        console.log(`  Context: ${content.context ? content.context.substring(0, 100) + '...' : 'N/A'}`);
        
        if (content.correct_answer) {
          console.log(`  Correct answer: ${content.correct_answer}`);
        }
        
        if (content.hints && content.hints.length > 0) {
          console.log(`  Hints: ${content.hints.length}`);
          console.log(`    First hint: ${content.hints[0].substring(0, 80)}...`);
        }
      }
    });
  }

  // Ver si hay módulos duplicados con el mismo título
  const { data: duplicates, count } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title, subject', { count: 'exact' })
    .eq('title', module.title)
    .eq('subject', module.subject)
    .neq('id', moduleId);

  if (count > 0) {
    console.log(`\n⚠️  Hay ${count} módulos duplicados con el mismo título y materia:`);
    duplicates.forEach((dup, i) => {
      console.log(`  ${i + 1}. ${dup.id} - ${dup.title}`);
    });
  }

  process.exit(0);
}

const moduleId = process.argv[2] || 'd529f7f2-9b76-4e49-b707-361936a22f5a';
inspectModule(moduleId).catch(console.error);
