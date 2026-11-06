// Test Suite - English (Fase 1.4)
// Patron: Seguir estructura de Mathematics, Language, Natural Sciences

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'b5d08d8c-2c8a-47aa-85e5-3cd58751f35d';

// IDs de módulos English completos (de verify-english-final.js)
const TEST_MODULES = {
  module1: {
    id: 'e687871a-ecee-49f5-a4a2-54a0df47d1f4',
    title: 'How can you understand this better?',
    subject: 'english',
    difficulty: 1
  },
  module2: {
    id: '7433f823-35e2-4b81-9ace-00656c77100b',
    title: 'How can you understand this better?',
    subject: 'english',
    difficulty: 1
  }
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper para colorear output
function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    info: '\x1b[36m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type] || colors.info}${message}${colors.reset}`);
}

// Test 1: Módulo disponible y accesible
async function test1_moduleAvailable() {
  log('\n='.repeat(60));
  log('TEST 1: MÓDULO DISPONIBLE', 'info');
  log('='.repeat(60));
  
  try {
    // Obtener módulo English
    const response = await axios.get(`${BASE_URL}/api/modules/${TEST_MODULES.module1.id}`);
    
    log(`\nResponse Status: ${response.status}`);
    log(`Module ID: ${response.data.id}`);
    log(`Module Title: ${response.data.title}`);
    log(`Subject: ${response.data.subject}`);
    log(`Difficulty: ${response.data.difficulty}`);
    
    if (response.status === 200 && response.data.subject === 'english') {
      log('\n✅ TEST 1 PASSED', 'success');
      testResults.passed++;
      testResults.tests.push({ name: 'Test 1: Module Available', status: 'PASS' });
      return true;
    } else {
      log('\n❌ TEST 1 FAILED - Module not available', 'error');
      testResults.failed++;
      testResults.tests.push({ name: 'Test 1: Module Available', status: 'FAIL' });
      return false;
    }
  } catch (error) {
    log(`\n❌ TEST 1 ERROR: ${error.message}`, 'error');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    }
    testResults.failed++;
    testResults.tests.push({ name: 'Test 1: Module Available', status: 'ERROR', reason: error.message });
    return false;
  }
}

// Test 2: Steps enriquecidos correctamente
async function test2_stepsEnriched() {
  log('\n='.repeat(60));
  log('TEST 2: STEPS ENRIQUECIDOS', 'info');
  log('='.repeat(60));
  
  try {
    // Obtener steps del módulo
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { db: { schema: 'kuneo' } }
    );
    
    const { data: steps, error } = await supabase
      .from('module_steps')
      .select('id, step_order, step_type, enriched_content')
      .eq('module_id', TEST_MODULES.module1.id)
      .order('step_order');
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    log(`\nTotal steps: ${steps.length}`);
    
    const enrichedSteps = steps.filter(s => s.enriched_content !== null);
    log(`Enriched steps: ${enrichedSteps.length}`);
    
    // Verificar que todos los steps están enriquecidos
    if (enrichedSteps.length === steps.length && steps.length > 0) {
      // Verificar estructura de enriched_content
      let validSteps = 0;
      for (const step of enrichedSteps) {
        if (step.enriched_content.cognitive_dimension && step.enriched_content.expected_answer) {
          validSteps++;
        }
      }
      
      log(`Valid enriched steps: ${validSteps}`);
      
      if (validSteps === steps.length) {
        log('\n✅ TEST 2 PASSED', 'success');
        testResults.passed++;
        testResults.tests.push({ name: 'Test 2: Steps Enriched', status: 'PASS' });
        return true;
      } else {
        log('\n❌ TEST 2 FAILED - Some steps have invalid enriched_content', 'error');
        testResults.failed++;
        testResults.tests.push({ name: 'Test 2: Steps Enriched', status: 'FAIL', reason: 'Invalid content' });
        return false;
      }
    } else {
      log('\n❌ TEST 2 FAILED - Not all steps are enriched', 'error');
      testResults.failed++;
      testResults.tests.push({ name: 'Test 2: Steps Enriched', status: 'FAIL', reason: 'Incomplete enrichment' });
      return false;
    }
  } catch (error) {
    log(`\n❌ TEST 2 ERROR: ${error.message}`, 'error');
    testResults.failed++;
    testResults.tests.push({ name: 'Test 2: Steps Enriched', status: 'ERROR', reason: error.message });
    return false;
  }
}

// Test 3: Cognitive Dimensions Present
async function test3_cognitiveDimensions() {
  log('\n='.repeat(60));
  log('TEST 3: COGNITIVE DIMENSIONS', 'info');
  log('='.repeat(60));
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { db: { schema: 'kuneo' } }
    );
    
    const { data: steps, error } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', TEST_MODULES.module1.id)
      .not('enriched_content', 'is', null);
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    log(`\nEnriched steps: ${steps.length}`);
    
    // Verificar que hay diferentes dimensiones cognitivas
    const dimensions = new Set();
    steps.forEach(s => {
      if (s.enriched_content?.cognitive_dimension) {
        dimensions.add(s.enriched_content.cognitive_dimension);
      }
    });
    
    log(`Unique dimensions: ${dimensions.size}`);
    log(`Dimensions found: ${Array.from(dimensions).join(', ')}`);
    
    if (dimensions.size >= 3) {
      log('\n✅ TEST 3 PASSED', 'success');
      testResults.passed++;
      testResults.tests.push({ name: 'Test 3: Cognitive Dimensions', status: 'PASS' });
      return true;
    } else {
      log('\n❌ TEST 3 FAILED - Not enough cognitive dimensions', 'error');
      testResults.failed++;
      testResults.tests.push({ name: 'Test 3: Cognitive Dimensions', status: 'FAIL', reason: 'Insufficient variety' });
      return false;
    }
  } catch (error) {
    log(`\n❌ TEST 3 ERROR: ${error.message}`, 'error');
    testResults.failed++;
    testResults.tests.push({ name: 'Test 3: Cognitive Dimensions', status: 'ERROR', reason: error.message });
    return false;
  }
}

// Test 4: Cross-Subject Consistency
async function test4_crossSubject() {
  log('\n='.repeat(60));
  log('TEST 4: CROSS-SUBJECT CONSISTENCY', 'info');
  log('='.repeat(60));
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { db: { schema: 'kuneo' } }
    );
    
    // Verificar que otros módulos English también están enriquecidos
    const { data: otherModules, error } = await supabase
      .from('modules')
      .select('id')
      .eq('subject', 'english')
      .limit(5);
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    log(`\nChecking ${otherModules.length} English modules...`);
    
    let enrichedModules = 0;
    for (const module of otherModules) {
      const { data: steps } = await supabase
        .from('module_steps')
        .select('enriched_content')
        .eq('module_id', module.id);
      
      const allEnriched = steps && steps.every(s => s.enriched_content !== null);
      if (allEnriched && steps.length > 0) {
        enrichedModules++;
      }
    }
    
    log(`Fully enriched modules: ${enrichedModules}/${otherModules.length}`);
    
    if (enrichedModules >= 1) {
      log('\n✅ TEST 4 PASSED', 'success');
      testResults.passed++;
      testResults.tests.push({ name: 'Test 4: Cross-Subject Consistency', status: 'PASS' });
      return true;
    } else {
      log('\n❌ TEST 4 FAILED - No fully enriched modules found', 'error');
      testResults.failed++;
      testResults.tests.push({ name: 'Test 4: Cross-Subject Consistency', status: 'FAIL', reason: 'No complete modules' });
      return false;
    }
  } catch (error) {
    log(`\n❌ TEST 4 ERROR: ${error.message}`, 'error');
    testResults.failed++;
    testResults.tests.push({ name: 'Test 4: Cross-Subject Consistency', status: 'ERROR', reason: error.message });
    return false;
  }
}

// Main
async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'info');
  log('║   ENGLISH TESTING SUITE - FASE 1.4                       ║', 'info');
  log('╚═══════════════════════════════════════════════════════════╝', 'info');
  
  log(`\nBackend: ${BASE_URL}`);
  log(`Test User: ${TEST_USER_ID}`);
  log(`Module: ${TEST_MODULES.module1.title} (${TEST_MODULES.module1.difficulty})`);
  log(`Subject: ${TEST_MODULES.module1.subject}\n`);
  
  // Verificar que backend esté corriendo
  try {
    await axios.get(`${BASE_URL}/health`);
    log('✓ Backend is running\n', 'success');
  } catch (error) {
    log('✗ Backend is NOT running! Please start: cd server; npm run dev', 'error');
    process.exit(1);
  }
  
  // Ejecutar tests
  await test1_moduleAvailable();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await test2_stepsEnriched();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await test3_cognitiveDimensions();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await test4_crossSubject();
  
  // Resumen
  log('\n' + '='.repeat(60));
  log('RESUMEN DE TESTS', 'info');
  log('='.repeat(60));
  
  testResults.tests.forEach((test, i) => {
    const symbol = test.status === 'PASS' ? '✅' : '❌';
    const color = test.status === 'PASS' ? 'success' : 'error';
    log(`${symbol} ${test.name}: ${test.status}`, color);
    if (test.reason) log(`   Reason: ${test.reason}`, 'warning');
  });
  
  log(`\nTotal: ${testResults.passed + testResults.failed} tests`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);
  
  if (testResults.failed === 0) {
    log('🎉 ALL TESTS PASSED!', 'success');
    process.exit(0);
  } else {
    log('⚠️  SOME TESTS FAILED', 'warning');
    process.exit(1);
  }
}

runTests().catch(error => {
  log(`\n💥 FATAL ERROR: ${error.message}`, 'error');
  process.exit(1);
});
