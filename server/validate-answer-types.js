// Data Quality Validation - Answer Type Distribution
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateAnswerTypes() {
    console.log('\n=== Answer Type Distribution ===\n');
    
    const { data, error } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('enriched_content')
        .not('enriched_content', 'is', null);
    
    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    
    const answerTypes = {};
    data.forEach(step => {
        if (step.enriched_content && step.enriched_content.expected_answer) {
            const type = step.enriched_content.expected_answer.type || 'unknown';
            answerTypes[type] = (answerTypes[type] || 0) + 1;
        }
    });
    
    console.log('Answer Type Distribution:');
    Object.entries(answerTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        const percentage = (100 * count / data.length).toFixed(1);
        console.log(`  ${type}: ${count} (${percentage}%)`);
    });
    
    const typeCount = Object.keys(answerTypes).length;
    console.log(`\nTotal answer types: ${typeCount}`);
    
    if (typeCount >= 2) {
        console.log('✅ VALIDATION PASS: Multiple answer types present');
        process.exit(0);
    } else {
        console.log('❌ VALIDATION FAIL: Need more answer type diversity');
        process.exit(1);
    }
}

validateAnswerTypes();
