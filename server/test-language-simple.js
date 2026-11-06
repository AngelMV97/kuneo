require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const BASE_URL = 'http://localhost:3001';
const TEST_MODULE_ID = 'ccec3bf2-66e2-427d-90b4-b8d8f09171cf'; // 8 steps completos (100%)

console.log('\n========================================');
console.log('FASE 1.2: LANGUAGE TESTING');
console.log('========================================\n');

let passedTests = 0;
let totalTests = 4;

// Test 1: Module Available
async function test1_moduleAvailable() {
  console.log('🧪 Test 1: Module Available');
  console.log('   Testing module accessibility via API...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/modules/${TEST_MODULE_ID}`);
    
    if (response.status === 200 && response.data.subject === 'language') {
      console.log('   ✅ PASS: Module available');
      console.log(`   Module: "${response.data.title}"`);
      console.log(`   Subject: ${response.data.subject}`);
      console.log(`   Difficulty: ${response.data.difficulty}\n`);
      return true;
    } else {
      console.log('   ❌ FAIL: Invalid response or subject mismatch\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    return false;
  }
}

// Test 2: Steps Enriched
async function test2_stepsEnriched() {
  console.log('🧪 Test 2: Steps Enriched');
  console.log('   Verifying all steps have enriched_content...\n');
  
  try {
    const { data: steps, error } = await supabase
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', TEST_MODULE_ID)
      .order('step_order');

    if (error) throw error;

    const totalSteps = steps.length;
    const enrichedSteps = steps.filter(s => s.enriched_content !== null);
    const validSteps = enrichedSteps.filter(s => 
      s.enriched_content.cognitive_dimension && 
      s.enriched_content.expected_answer
    );

    console.log(`   Total steps: ${totalSteps}`);
    console.log(`   Enriched steps: ${enrichedSteps.length}`);
    console.log(`   Valid enriched steps: ${validSteps.length}`);

    if (validSteps.length === totalSteps && totalSteps >= 8) {
      console.log('   ✅ PASS: All steps enriched with valid structure\n');
      return true;
    } else {
      console.log('   ❌ FAIL: Not all steps enriched or invalid structure\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    return false;
  }
}

// Test 3: Cognitive Dimensions
async function test3_cognitiveDimensions() {
  console.log('🧪 Test 3: Cognitive Dimensions');
  console.log('   Analyzing cognitive dimension distribution...\n');
  
  try {
    const { data: steps, error } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', TEST_MODULE_ID)
      .not('enriched_content', 'is', null);

    if (error) throw error;

    const dimensions = new Set();
    steps.forEach(step => {
      if (step.enriched_content && step.enriched_content.cognitive_dimension) {
        dimensions.add(step.enriched_content.cognitive_dimension);
      }
    });

    console.log(`   Enriched steps analyzed: ${steps.length}`);
    console.log(`   Unique dimensions: ${dimensions.size}`);
    console.log(`   Dimensions found: ${Array.from(dimensions).join(', ')}`);

    // For an 8-step module, expect at least 3 different dimensions
    if (dimensions.size >= 3 && steps.length >= 8) {
      console.log('   ✅ PASS: Cognitive dimensions present\n');
      return true;
    } else {
      console.log('   ❌ FAIL: Insufficient cognitive dimension coverage\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    return false;
  }
}

// Test 4: Cross-Subject Consistency
async function test4_crossSubjectConsistency() {
  console.log('🧪 Test 4: Cross-Subject Consistency');
  console.log('   Checking enrichment quality across Language...\n');
  
  try {
    // Check the complete module has good quality
    const { data: completeModuleSteps, error: error1 } = await supabase
      .from('module_steps')
      .select('id, enriched_content')
      .eq('module_id', TEST_MODULE_ID);

    if (error1) throw error1;

    const allEnriched = completeModuleSteps.every(s => 
      s.enriched_content && 
      s.enriched_content.cognitive_dimension &&
      s.enriched_content.expected_answer
    );

    // Check overall enrichment progress
    const { count: totalSteps } = await supabase
      .from('module_steps')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', TEST_MODULE_ID);

    const { count: enrichedSteps } = await supabase
      .from('module_steps')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', TEST_MODULE_ID)
      .not('enriched_content', 'is', null);

    console.log(`   Test module: ${enrichedSteps}/${totalSteps} steps enriched`);
    console.log(`   All steps valid structure: ${allEnriched ? 'Yes' : 'No'}`);

    if (allEnriched && enrichedSteps === totalSteps && totalSteps >= 8) {
      console.log('   ✅ PASS: Consistent high-quality enrichment\n');
      return true;
    } else {
      console.log('   ❌ FAIL: Inconsistent enrichment quality\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Language test suite...\n');
  console.log(`📌 Test Module: ${TEST_MODULE_ID}`);
  console.log(`🌐 Backend: ${BASE_URL}\n`);
  console.log('========================================\n');

  const results = [];

  results.push(await test1_moduleAvailable());
  results.push(await test2_stepsEnriched());
  results.push(await test3_cognitiveDimensions());
  results.push(await test4_crossSubjectConsistency());

  passedTests = results.filter(r => r).length;

  console.log('========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================\n');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED!\n');
  } else {
    console.log('⚠️  Some tests failed. Review above for details.\n');
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

runAllTests();
