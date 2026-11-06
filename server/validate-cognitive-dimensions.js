// Data Quality Validation - Cognitive Dimension Coverage
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateCognitiveDimensions() {
    console.log('\n=== Cognitive Dimension Distribution ===\n');
    
    const { data, error } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('enriched_content')
        .not('enriched_content', 'is', null);
    
    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    
    const dimensions = {};
    data.forEach(step => {
        if (step.enriched_content && step.enriched_content.cognitive_dimension) {
            const dim = step.enriched_content.cognitive_dimension;
            dimensions[dim] = (dimensions[dim] || 0) + 1;
        }
    });
    
    console.log('Cognitive Dimension Distribution:');
    Object.entries(dimensions).sort((a, b) => b[1] - a[1]).forEach(([dim, count]) => {
        const percentage = (100 * count / data.length).toFixed(1);
        console.log(`  ${dim}: ${count} (${percentage}%)`);
    });
    
    const expectedDimensions = ['comprension', 'representacion', 'razonamiento', 'transferencia', 'metacognicion'];
    const presentDimensions = Object.keys(dimensions);
    const allPresent = expectedDimensions.every(dim => presentDimensions.includes(dim));
    
    console.log(`\nTotal dimensions present: ${presentDimensions.length}/5`);
    
    if (allPresent) {
        console.log('✅ VALIDATION PASS: All 5 cognitive dimensions present');
        process.exit(0);
    } else {
        const missing = expectedDimensions.filter(dim => !presentDimensions.includes(dim));
        console.log(`⚠️  VALIDATION WARN: Missing dimensions: ${missing.join(', ')}`);
        process.exit(0); // Pass with warning
    }
}

validateCognitiveDimensions();
