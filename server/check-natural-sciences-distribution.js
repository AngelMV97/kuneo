const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDistribution() {
  console.log('\nChecking Natural Sciences enriched steps distribution...\n');
  
  const { data: modules, error: modulesError } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title, core_concept')
    .eq('subject', 'natural_sciences');

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return;
  }

  console.log(`Found ${modules.length} Natural Sciences modules`);

  // Dividir en chunks para evitar headers overflow
  const chunkSize = 50;
  const chunks = [];
  for (let i = 0; i < modules.length; i += chunkSize) {
    chunks.push(modules.slice(i, i + chunkSize).map(m => m.id));
  }

  console.log(`Fetching steps in ${chunks.length} chunks...`);
  
  let allSteps = [];
  for (let i = 0; i < chunks.length; i++) {
    const { data: chunkSteps, error: chunkError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('module_id, enriched_content, id, step_order')
      .in('module_id', chunks[i])
      .not('enriched_content', 'is', null);

    if (chunkError) {
      console.error(`Error fetching chunk ${i}:`, chunkError);
      continue;
    }

    allSteps = allSteps.concat(chunkSteps || []);
  }

  const steps = allSteps;
  console.log(`Found ${steps.length} enriched steps\n`);

  const byModule = {};
  steps.forEach(s => {
    if (!byModule[s.module_id]) byModule[s.module_id] = [];
    byModule[s.module_id].push(s);
  });

  const sorted = Object.entries(byModule)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  console.log('Top 10 Natural Sciences modules with enriched steps:\n');
  sorted.forEach(([modId, moduleSteps], idx) => {
    const mod = modules.find(m => m.id === modId);
    const firstStep = moduleSteps[0];
    console.log(`${idx + 1}. ${mod.title}`);
    console.log(`   Concept: ${mod.core_concept}`);
    console.log(`   Enriched steps: ${moduleSteps.length}`);
    console.log(`   First step ID: ${firstStep.id}`);
    console.log('');
  });
}

checkDistribution();
