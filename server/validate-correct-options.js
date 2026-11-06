// Data Quality Validation - Correct Options Quality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateCorrectOptions() {
    console.log('\n=== Correct Options Data Quality ===\n');
    
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
    
    let optionTypeSteps = 0;
    let validCorrectOptions = 0;
    let invalidCorrectOptions = [];
    
    data.forEach((step, idx) => {
        const answer = step.enriched_content?.expected_answer;
        if (answer && answer.type === 'option') {
            optionTypeSteps++;
            
            if (Array.isArray(answer.correct_options) && answer.correct_options.length > 0) {
                const allNumbers = answer.correct_options.every(opt => typeof opt === 'number');
                if (allNumbers) {
                    validCorrectOptions++;
                } else {
                    if (invalidCorrectOptions.length < 5) {
                        invalidCorrectOptions.push({ index: idx, options: answer.correct_options });
                    }
                }
            } else {
                if (invalidCorrectOptions.length < 5) {
                    invalidCorrectOptions.push({ index: idx, issue: 'missing_or_invalid_array' });
                }
            }
        }
    });
    
    const validityRate = optionTypeSteps > 0 ? (100 * validCorrectOptions / optionTypeSteps).toFixed(1) : 100;
    
    console.log(`Option type steps: ${optionTypeSteps}`);
    console.log(`Valid correct_options: ${validCorrectOptions}/${optionTypeSteps} (${validityRate}%)`);
    
    if (invalidCorrectOptions.length > 0) {
        console.log(`\nInvalid correct_options found: ${optionTypeSteps - validCorrectOptions}`);
        console.log('Sample (first 5):', JSON.stringify(invalidCorrectOptions, null, 2));
    }
    
    if (validityRate >= 95) {
        console.log('✅ VALIDATION PASS: Correct options properly formatted (≥95%)');
        process.exit(0);
    } else if (validityRate >= 90) {
        console.log('⚠️  VALIDATION WARN: Most correct options valid (90-95%)');
        process.exit(0);
    } else {
        console.log('❌ VALIDATION FAIL: Too many incorrect options formatting issues (<90%)');
        process.exit(1);
    }
}

validateCorrectOptions();
