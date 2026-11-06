require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

async function extractContent() {
  console.log('🔍 Extrayendo contenido actual del módulo 8-9...\n');

  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', MODULE_ID)
    .single();

  console.log(`📚 Módulo: ${module.title}`);
  console.log(`🎯 Core Concept: ${module.core_concept}`);
  console.log(`📝 Learning Objective: ${module.learning_objective}\n`);

  const { data: steps } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  console.log(`Total steps: ${steps.length}\n`);

  const enrichedSteps = {};

  for (const step of steps) {
    if (step.enriched_content) {
      console.log(`Step ${step.step_order}: ✅ Tiene enriched_content (${step.enriched_content.type})`);
      enrichedSteps[step.step_order] = step.enriched_content;
    } else {
      console.log(`Step ${step.step_order}: ❌ Sin enriched_content`);
    }
  }

  // Guardar a archivo
  const output = {
    module: {
      id: MODULE_ID,
      title: module.title,
      core_concept: module.core_concept,
      learning_objective: module.learning_objective
    },
    steps: enrichedSteps
  };

  fs.writeFileSync('module-89-current-content.json', JSON.stringify(output, null, 2));
  console.log('\n✅ Contenido guardado en: module-89-current-content.json');
}

extractContent().catch(console.error);
