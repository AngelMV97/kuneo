// Find Natural Sciences modules with enriched steps for testing
// Run with: node server/find-natural-sciences-test-modules.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findNaturalSciencesTestModules() {
  console.log('\n🔍 Finding Natural Sciences modules with enriched steps...\n');

  try {
    // Get all natural_sciences modules
    const { data: modules, error: modulesError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('*')
      .eq('subject', 'natural_sciences');

    if (modulesError) throw modulesError;

    console.log(`📚 Total Natural Sciences modules: ${modules.length}`);

    // Create a map of modules
    const modulesMap = new Map();
    modules.forEach(mod => {
      modulesMap.set(mod.id, {
        ...mod,
        total_steps: 0,
        enriched_steps: 0
      });
    });

    // Get all steps for these modules
    const moduleIds = modules.map(m => m.id);
    const { data: steps, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('*')
      .in('module_id', moduleIds);

    if (stepsError) throw stepsError;

    console.log(`📝 Total steps: ${steps.length}\n`);

    // Count steps per module
    steps.forEach(step => {
      const module = modulesMap.get(step.module_id);
      if (module) {
        module.total_steps++;
        
        // Check if enriched
        if (step.enriched_content &&
            step.enriched_content.expected_answer &&
            step.enriched_content.step_config &&
            step.enriched_content.cognitive_dimension) {
          module.enriched_steps++;
        }
      }
    });

    // Find modules with good enrichment (3+ enriched steps)
    const goodModules = Array.from(modulesMap.values())
      .filter(mod => mod.enriched_steps >= 3)
      .sort((a, b) => b.enriched_steps - a.enriched_steps);

    console.log(`✅ Found ${goodModules.length} modules with 3+ enriched steps\n`);

    if (goodModules.length === 0) {
      console.log('⚠️  No modules with sufficient enrichment yet');
      console.log('   Wait for enrichment to complete...\n');
      return;
    }

    // Show top 10 modules
    console.log('📊 Top Natural Sciences modules for testing:\n');
    goodModules.slice(0, 10).forEach((mod, idx) => {
      console.log(`${idx + 1}. Module: ${mod.id}`);
      console.log(`   Title: ${mod.title}`);
      console.log(`   Core Concept: ${mod.core_concept}`);
      console.log(`   Difficulty: ${mod.difficulty || 'N/A'}`);
      console.log(`   Steps: ${mod.enriched_steps}/${mod.total_steps} enriched (${Math.round(mod.enriched_steps/mod.total_steps*100)}%)`);
      
      // Get first step ID
      const firstStep = steps.find(s => s.module_id === mod.id);
      if (firstStep) {
        console.log(`   First Step ID: ${firstStep.id}`);
        
        // Show answer types and dimensions from enriched steps
        const moduleSteps = steps.filter(s => 
          s.module_id === mod.id && 
          s.enriched_content?.expected_answer
        );
        
        if (moduleSteps.length > 0) {
          const answerTypes = [...new Set(moduleSteps.map(s => s.enriched_content.expected_answer.type))];
          const dimensions = [...new Set(moduleSteps.map(s => s.enriched_content.cognitive_dimension))];
          
          console.log(`   Answer Types: ${answerTypes.join(', ')}`);
          console.log(`   Dimensions: ${dimensions.join(', ')}`);
        }
      }
      console.log('');
    });

    // Find fully enriched modules (100%)
    const fullyEnriched = goodModules.filter(mod => 
      mod.enriched_steps === mod.total_steps && mod.total_steps >= 5
    );

    if (fullyEnriched.length > 0) {
      console.log(`\n🎯 ${fullyEnriched.length} modules are 100% enriched with 5+ steps:`);
      fullyEnriched.forEach(mod => {
        console.log(`   - ${mod.title} (${mod.core_concept}) - ${mod.total_steps} steps`);
      });
    } else {
      console.log('\n⏳ No modules are 100% enriched yet');
      console.log('   Use any module with 3+ enriched steps for initial testing\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findNaturalSciencesTestModules();
