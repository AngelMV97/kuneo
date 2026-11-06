// Identify steps with invalid correct_options
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function identifyInvalidSteps() {
    console.log('\n=== Identifying Invalid correct_options ===\n');
    
    // Get all enriched steps
    const { data, error } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('id, module_id, enriched_content')
        .not('enriched_content', 'is', null);
    
    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    
    console.log(`Total enriched steps: ${data.length}\n`);
    
    const invalidSteps = [];
    const bySubject = {};
    
    // Get module subjects in chunks to avoid header overflow
    const moduleIds = [...new Set(data.map(s => s.module_id))];
    console.log(`Getting subjects for ${moduleIds.length} modules...\n`);
    
    const moduleSubjectMap = {};
    const chunkSize = 50;
    
    for (let i = 0; i < moduleIds.length; i += chunkSize) {
        const chunk = moduleIds.slice(i, i + chunkSize);
        const { data: modules, error: moduleError } = await supabase
            .schema('kuneo')
            .from('modules')
            .select('id, subject')
            .in('id', chunk);
        
        if (!moduleError && modules) {
            modules.forEach(m => {
                moduleSubjectMap[m.id] = m.subject;
            });
        }
    }
    
    console.log(`Got subjects for ${Object.keys(moduleSubjectMap).length} modules\n`);
    
    // Find invalid option-type steps
    data.forEach(step => {
        const answer = step.enriched_content?.expected_answer;
        if (answer && answer.type === 'option') {
            const isValid = Array.isArray(answer.correct_options) && 
                          answer.correct_options.length > 0 &&
                          answer.correct_options.every(opt => typeof opt === 'number');
            
            if (!isValid) {
                const subject = moduleSubjectMap[step.module_id] || 'unknown';
                
                invalidSteps.push({
                    step_id: step.id,
                    module_id: step.module_id,
                    subject: subject,
                    correct_options: answer.correct_options,
                    issue: !answer.correct_options ? 'missing' :
                           !Array.isArray(answer.correct_options) ? 'not_array' :
                           answer.correct_options.length === 0 ? 'empty_array' :
                           'wrong_type'
                });
                
                bySubject[subject] = (bySubject[subject] || 0) + 1;
            }
        }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`Total invalid steps: ${invalidSteps.length}`);
    console.log(`\nBy Subject:`);
    Object.entries(bySubject).forEach(([subject, count]) => {
        console.log(`  ${subject}: ${count}`);
    });
    
    console.log(`\n📋 Detailed List:\n`);
    invalidSteps.forEach((step, idx) => {
        console.log(`${idx + 1}. Step ${step.step_id.substring(0, 8)}...`);
        console.log(`   Module: ${step.module_id.substring(0, 8)}...`);
        console.log(`   Subject: ${step.subject}`);
        console.log(`   Issue: ${step.issue}`);
        console.log(`   correct_options: ${JSON.stringify(step.correct_options)}`);
        console.log('');
    });
    
    // Save to file for further processing
    const fs = require('fs');
    const outputPath = './invalid-correct-options.json';
    fs.writeFileSync(outputPath, JSON.stringify(invalidSteps, null, 2));
    console.log(`\n✅ Saved detailed list to: ${outputPath}`);
    console.log(`\n💡 Next steps:`);
    console.log(`1. Analyze patterns in the invalid steps`);
    console.log(`2. Decide fix strategy:`);
    console.log(`   - Re-enrich with OpenAI`);
    console.log(`   - Manual SQL fix`);
    console.log(`   - Hybrid approach`);
    console.log(`3. Apply fix`);
    console.log(`4. Re-validate with validate-correct-options.js`);
}

identifyInvalidSteps();
