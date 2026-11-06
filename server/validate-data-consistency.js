// Data Quality Validation - Data Consistency Check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateDataConsistency() {
    console.log('\n=== Data Structure Consistency ===\n');
    
    const { data, error } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('enriched_content')
        .not('enriched_content', 'is', null)
        .limit(500);
    
    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    
    let validStructures = 0;
    let invalidStructures = [];
    
    data.forEach((step, idx) => {
        const content = step.enriched_content;
        
        const hasExpectedAnswer = content && content.expected_answer;
        const hasType = hasExpectedAnswer && content.expected_answer.type;
        const hasStepConfig = content && content.step_config;
        const hasCognitiveDimension = content && content.cognitive_dimension;
        
        if (hasExpectedAnswer && hasType && hasStepConfig && hasCognitiveDimension) {
            validStructures++;
        } else {
            if (invalidStructures.length < 5) { // Only store first 5
                invalidStructures.push({
                    index: idx,
                    missing: [
                        !hasExpectedAnswer && 'expected_answer',
                        !hasType && 'type',
                        !hasStepConfig && 'step_config',
                        !hasCognitiveDimension && 'cognitive_dimension'
                    ].filter(Boolean)
                });
            }
        }
    });
    
    const validityRate = (100 * validStructures / data.length).toFixed(1);
    
    console.log(`Valid structures: ${validStructures}/${data.length} (${validityRate}%)`);
    
    if (invalidStructures.length > 0) {
        console.log(`\nInvalid structures found: ${data.length - validStructures}`);
        console.log('Sample (first 5):', JSON.stringify(invalidStructures, null, 2));
    }
    
    if (validityRate >= 95) {
        console.log('✅ VALIDATION PASS: High data consistency (≥95%)');
        process.exit(0);
    } else if (validityRate >= 90) {
        console.log('⚠️  VALIDATION WARN: Acceptable consistency (90-95%)');
        process.exit(0);
    } else {
        console.log('❌ VALIDATION FAIL: Low data consistency (<90%)');
        process.exit(1);
    }
}

validateDataConsistency();
