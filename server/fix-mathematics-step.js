// Fix Mathematics step with legacy correct_option format
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMathematicsStep() {
    const stepId = '00000000-0000-0000-0001-000000000002';
    
    console.log('\n=== Fix Mathematics Step: correct_option -> correct_options ===\n');
    
    // Step 1: Get current state
    console.log('Step 1: Getting current state...');
    const { data: current, error: fetchError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('id, content, enriched_content')
        .eq('id', stepId)
        .single();
    
    if (fetchError) {
        console.error('Error fetching step:', fetchError.message);
        process.exit(1);
    }
    
    console.log('Current state:');
    console.log('- Options:', JSON.stringify(current.content.options));
    console.log('- correct_option (old):', current.enriched_content.expected_answer.correct_option);
    console.log('- correct_options (new):', current.enriched_content.expected_answer.correct_options);
    
    // Determine correct index
    const correctAnswer = current.enriched_content.expected_answer.correct_option;
    const options = current.content.options;
    const correctIndex = options.indexOf(correctAnswer);
    
    if (correctIndex === -1) {
        console.error('\nError: correct_option not found in options array!');
        console.error('correct_option:', correctAnswer);
        console.error('options:', options);
        process.exit(1);
    }
    
    console.log('\nCalculated correct index:', correctIndex);
    console.log('Answer "' + correctAnswer + '" is at index', correctIndex);
    
    // Step 2: Create updated enriched_content
    console.log('\nStep 2: Updating enriched_content...');
    const updatedEnrichedContent = {
        ...current.enriched_content,
        expected_answer: {
            ...current.enriched_content.expected_answer,
            correct_options: [correctIndex]
        }
    };
    
    // Remove old correct_option field
    delete updatedEnrichedContent.expected_answer.correct_option;
    
    // Step 3: Update database
    const { data: updated, error: updateError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .update({ enriched_content: updatedEnrichedContent })
        .eq('id', stepId)
        .select();
    
    if (updateError) {
        console.error('Error updating step:', updateError.message);
        process.exit(1);
    }
    
    console.log('Update successful!');
    
    // Step 4: Verify
    console.log('\nStep 3: Verifying fix...');
    const { data: verified, error: verifyError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('enriched_content')
        .eq('id', stepId)
        .single();
    
    if (verifyError) {
        console.error('Error verifying:', verifyError.message);
        process.exit(1);
    }
    
    console.log('\nVerified state:');
    console.log('- Answer type:', verified.enriched_content.expected_answer.type);
    console.log('- correct_options:', JSON.stringify(verified.enriched_content.expected_answer.correct_options));
    console.log('- correct_option (should be undefined):', verified.enriched_content.expected_answer.correct_option);
    
    // Validation
    const hasCorrectOptions = Array.isArray(verified.enriched_content.expected_answer.correct_options);
    const noLegacyField = verified.enriched_content.expected_answer.correct_option === undefined;
    
    if (hasCorrectOptions && noLegacyField) {
        console.log('\n✅ SUCCESS: Mathematics step fixed!');
        console.log('- correct_options is array:', hasCorrectOptions);
        console.log('- Legacy correct_option removed:', noLegacyField);
        process.exit(0);
    } else {
        console.log('\n❌ FAIL: Fix incomplete');
        console.log('- correct_options is array:', hasCorrectOptions);
        console.log('- Legacy correct_option removed:', noLegacyField);
        process.exit(1);
    }
}

fixMathematicsStep();
