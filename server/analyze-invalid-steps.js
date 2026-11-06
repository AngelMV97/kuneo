// Analyze sample invalid steps to understand fix strategy
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeSampleSteps() {
    console.log('\n=== Analyzing Sample Invalid Steps ===\n');
    
    // Read invalid steps list
    const invalidSteps = JSON.parse(fs.readFileSync('./invalid-correct-options.json', 'utf8'));
    
    // Sample first 5 language steps
    const languageSteps = invalidSteps.filter(s => s.subject === 'language').slice(0, 5);
    const mathStep = invalidSteps.find(s => s.subject === 'mathematics');
    
    const sampleIds = [...languageSteps.map(s => s.step_id)];
    if (mathStep) sampleIds.push(mathStep.step_id);
    
    console.log(`Analyzing ${sampleIds.length} sample steps...\n`);
    
    // Get full step data
    const { data: steps, error } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('id, module_id, step_type, content, enriched_content')
        .in('id', sampleIds);
    
    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    
    steps.forEach((step, idx) => {
        console.log('\n' + '='.repeat(80));
        console.log('SAMPLE ' + (idx + 1) + ': ' + step.id);
        console.log('='.repeat(80));
        console.log('Step Type: ' + step.step_type);
        console.log('\nOriginal Content (first 200 chars):');
        console.log(JSON.stringify(step.content, null, 2).substring(0, 200) + '...');
        
        console.log('\nEnriched Content - expected_answer:');
        const answer = step.enriched_content?.expected_answer;
        console.log(JSON.stringify(answer, null, 2));
        
        console.log('\nEnriched Content - step_config (options):');
        const options = step.enriched_content?.step_config?.options;
        if (options) {
            console.log(JSON.stringify(options, null, 2).substring(0, 300) + '...');
        } else {
            console.log('No options found in step_config');
        }
        
        // Analysis
        console.log('\nAnalysis:');
        console.log('- Answer type: ' + (answer?.type || 'unknown'));
        console.log('- correct_options: ' + JSON.stringify(answer?.correct_options));
        console.log('- Options count: ' + (options ? options.length : 0));
        
        // Potential fix
        if (answer?.type === 'option' && options && options.length > 0) {
            console.log('\nPotential Fix:');
            if (answer.correct_options && answer.correct_options.length === 0) {
                console.log('- Issue: Empty array');
                console.log('- Strategy: Need to identify which option(s) are correct');
                console.log('- Options available: ' + options.length);
                console.log('- Suggestion: Re-enrich with OpenAI or manual review');
            } else {
                console.log('- Issue: Missing correct_options field');
                console.log('- Strategy: Re-enrich with OpenAI');
            }
        }
    });
    
    console.log('\n\n' + '='.repeat(80));
    console.log('RECOMMENDATION');
    console.log('='.repeat(80));
    console.log('\nPattern Identified:');
    console.log('- 34/35 steps have EMPTY ARRAY (not missing field)');
    console.log('- All 34 are in Language subject');
    console.log('- OpenAI generated structure but failed to populate correct_options');
    
    console.log('\nFix Strategy:');
    console.log('1. Re-enrich with OpenAI (RECOMMENDED):');
    console.log('   - Use enrichment.js to regenerate these 35 specific steps');
    console.log('   - More reliable than manual guessing');
    console.log('   - Ensures consistency with original question intent');
    console.log('   - Cost: ~$0.002 x 35 = ~$0.07');
    console.log('   - Time: ~5 minutes');
    
    console.log('\n2. Manual SQL Fix (NOT RECOMMENDED):');
    console.log('   - Would require reading each question and manually determining correct answer');
    console.log('   - Risk of human error');
    console.log('   - Time consuming');
    
    console.log('\n3. Hybrid Approach:');
    console.log('   - Re-enrich the 34 Language empty_array steps');
    console.log('   - Manually review the 1 Mathematics missing step');
    
    console.log('\nNext Action:');
    console.log('Run: node enrichment.js step <step_id> for each invalid step');
    console.log('Or: Create batch re-enrich script for all 35 steps');
}

analyzeSampleSteps();
