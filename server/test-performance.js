require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'b5d08d8c-2c8a-47aa-85e5-3cd58751f35d';

// Use an English module (50 complete modules available)
const TEST_MODULE_ID = 'e687871a-ecee-49f5-a4a2-54a0df47d1f4';

console.log('\n========================================');
console.log('FASE 2.2: PERFORMANCE TESTING');
console.log('========================================\n');

let testResults = {
  consecutiveTest: { passed: false, metrics: {} },
  concurrentTest: { passed: false, metrics: {} },
  thresholds: {
    evaluation: 200,    // ms
    apiResponse: 500,   // ms
    dbQuery: 50         // ms
  }
};

// Helper: Calculate percentiles
function calculatePercentile(sortedArray, percentile) {
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[index];
}

// Helper: Calculate statistics
function calculateStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    total: times.reduce((a, b) => a + b, 0)
  };
}

// Helper: Submit answer and measure time
async function submitAnswer(userId, moduleId, stepId, answer, stepType = 'option') {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/adaptive/submit-answer`, {
      user_id: userId,
      module_id: moduleId,
      step_id: stepId,
      answer: answer,
      time_on_task: 5,
      hint_requests: 0,
      confidence: 'medium',
      attempt_number: 1
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: response.data.success,
      duration,
      isCorrect: response.data.evaluation?.is_correct,
      statusCode: response.status
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      duration: endTime - startTime,
      error: error.message
    };
  }
}

// Get module steps
async function getModuleSteps(moduleId) {
  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', moduleId)
    .order('step_order');

  if (error) throw error;
  
  return steps.filter(s => s.enriched_content !== null);
}

// Test 1: 100 Consecutive Responses
async function test1_consecutiveResponses() {
  console.log('\n🧪 TEST 1: 100 Respuestas Consecutivas');
  console.log('   Midiendo performance de un solo usuario...\n');
  
  try {
    // Get module steps
    const steps = await getModuleSteps(TEST_MODULE_ID);
    
    if (steps.length < 5) {
      console.log(`   ❌ SKIP: Module only has ${steps.length} steps (need at least 5)\n`);
      return false;
    }

    console.log(`   📚 Módulo: ${TEST_MODULE_ID}`);
    console.log(`   📝 Steps disponibles: ${steps.length}`);
    console.log(`   🎯 Objetivo: 100 respuestas\n`);

    const targetResponses = 100;
    const responseTimes = [];
    let successCount = 0;
    let errorCount = 0;

    // Submit answers sequentially
    for (let i = 0; i < targetResponses; i++) {
      const step = steps[i % steps.length]; // Cycle through steps
      const answerType = step.enriched_content?.expected_answer?.type || 'option';
      
      // Generate appropriate answer based on type
      let answer;
      if (answerType === 'option') {
        // Alternate between correct (0) and incorrect (1, 2, 3) answers
        answer = i % 4 === 0 ? "0" : String((i % 3) + 1);
      } else if (answerType === 'numeric') {
        answer = "42";
      } else {
        answer = "Test answer";
      }

      const result = await submitAnswer(TEST_USER_ID, TEST_MODULE_ID, step.id, answer, answerType);
      
      if (result.success) {
        responseTimes.push(result.duration);
        successCount++;
      } else {
        errorCount++;
      }

      // Progress indicator every 20 responses
      if ((i + 1) % 20 === 0) {
        const avgSoFar = responseTimes.length > 0 
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0;
        console.log(`   ⏳ Progreso: ${i + 1}/${targetResponses} | Avg: ${avgSoFar}ms`);
      }
    }

    console.log(`\n   ✅ Completado: ${successCount}/${targetResponses} respuestas`);
    console.log(`   ❌ Errores: ${errorCount}\n`);

    // Calculate statistics
    const stats = calculateStats(responseTimes);
    
    console.log('   📊 MÉTRICAS DE PERFORMANCE:');
    console.log(`   • Min:    ${Math.round(stats.min)}ms`);
    console.log(`   • Max:    ${Math.round(stats.max)}ms`);
    console.log(`   • Avg:    ${Math.round(stats.avg)}ms`);
    console.log(`   • Median: ${Math.round(stats.median)}ms`);
    console.log(`   • P95:    ${Math.round(stats.p95)}ms`);
    console.log(`   • P99:    ${Math.round(stats.p99)}ms`);
    console.log(`   • Total:  ${Math.round(stats.total / 1000)}s\n`);

    // Validate against thresholds
    const apiThreshold = testResults.thresholds.apiResponse;
    const passedAvg = stats.avg < apiThreshold;
    const passedP95 = stats.p95 < apiThreshold * 1.5; // Allow 50% margin for p95

    console.log('   🎯 VALIDACIÓN DE UMBRALES:');
    console.log(`   • Avg < ${apiThreshold}ms:     ${passedAvg ? '✅' : '❌'} (${Math.round(stats.avg)}ms)`);
    console.log(`   • P95 < ${apiThreshold * 1.5}ms:   ${passedP95 ? '✅' : '❌'} (${Math.round(stats.p95)}ms)`);
    console.log(`   • Error rate < 5%: ${errorCount / targetResponses < 0.05 ? '✅' : '❌'} (${((errorCount / targetResponses) * 100).toFixed(1)}%)\n`);

    // Store results
    testResults.consecutiveTest.metrics = {
      totalResponses: targetResponses,
      successCount,
      errorCount,
      errorRate: (errorCount / targetResponses) * 100,
      ...stats
    };

    const passed = passedAvg && passedP95 && (errorCount / targetResponses < 0.05);
    testResults.consecutiveTest.passed = passed;

    if (passed) {
      console.log('   🎉 PASS: Performance dentro de umbrales esperados\n');
      return true;
    } else {
      console.log('   ⚠️  FAIL: Performance fuera de umbrales esperados\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
    return false;
  }
}

// Test 2: 10 Concurrent Users
async function test2_concurrentUsers() {
  console.log('\n🧪 TEST 2: 10 Usuarios Simultáneos');
  console.log('   Midiendo performance bajo carga concurrente...\n');
  
  try {
    // Get module steps
    const steps = await getModuleSteps(TEST_MODULE_ID);
    
    if (steps.length < 5) {
      console.log(`   ❌ SKIP: Module only has ${steps.length} steps\n`);
      return false;
    }

    const numUsers = 10;
    const responsesPerUser = 10;
    
    // Generate test user IDs
    const testUsers = Array.from({ length: numUsers }, (_, i) => 
      `test-user-${i}-${Date.now()}`
    );

    console.log(`   👥 Usuarios: ${numUsers}`);
    console.log(`   📝 Respuestas por usuario: ${responsesPerUser}`);
    console.log(`   🎯 Total respuestas: ${numUsers * responsesPerUser}\n`);

    const startTime = Date.now();

    // Execute concurrent requests
    const userPromises = testUsers.map(async (userId, userIndex) => {
      const userTimes = [];
      
      for (let i = 0; i < responsesPerUser; i++) {
        const step = steps[i % steps.length];
        const answerType = step.enriched_content?.expected_answer?.type || 'option';
        const answer = answerType === 'option' ? "0" : "Test answer";
        
        const result = await submitAnswer(userId, TEST_MODULE_ID, step.id, answer, answerType);
        
        if (result.success) {
          userTimes.push(result.duration);
        }
      }
      
      return {
        userId: `User ${userIndex + 1}`,
        times: userTimes,
        stats: calculateStats(userTimes)
      };
    });

    // Wait for all users to complete
    const userResults = await Promise.all(userPromises);
    const totalTime = Date.now() - startTime;

    // Aggregate all response times
    const allTimes = userResults.flatMap(u => u.times);
    const aggregateStats = calculateStats(allTimes);

    console.log('   📊 MÉTRICAS AGREGADAS:');
    console.log(`   • Total requests:  ${allTimes.length}`);
    console.log(`   • Total time:      ${Math.round(totalTime / 1000)}s`);
    console.log(`   • Throughput:      ${Math.round(allTimes.length / (totalTime / 1000))} req/s`);
    console.log(`   • Avg response:    ${Math.round(aggregateStats.avg)}ms`);
    console.log(`   • P95 response:    ${Math.round(aggregateStats.p95)}ms`);
    console.log(`   • P99 response:    ${Math.round(aggregateStats.p99)}ms\n`);

    console.log('   👥 MÉTRICAS POR USUARIO:');
    userResults.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.userId}: Avg ${Math.round(user.stats.avg)}ms | P95 ${Math.round(user.stats.p95)}ms`);
    });
    console.log();

    // Validate thresholds
    const apiThreshold = testResults.thresholds.apiResponse;
    const passedAvg = aggregateStats.avg < apiThreshold;
    const passedP95 = aggregateStats.p95 < apiThreshold * 2; // More lenient for concurrent
    const passedThroughput = (allTimes.length / (totalTime / 1000)) > 10; // At least 10 req/s

    console.log('   🎯 VALIDACIÓN DE UMBRALES:');
    console.log(`   • Avg < ${apiThreshold}ms:       ${passedAvg ? '✅' : '❌'} (${Math.round(aggregateStats.avg)}ms)`);
    console.log(`   • P95 < ${apiThreshold * 2}ms:      ${passedP95 ? '✅' : '❌'} (${Math.round(aggregateStats.p95)}ms)`);
    console.log(`   • Throughput > 10 req/s: ${passedThroughput ? '✅' : '❌'} (${Math.round(allTimes.length / (totalTime / 1000))} req/s)\n`);

    // Store results
    testResults.concurrentTest.metrics = {
      numUsers,
      responsesPerUser,
      totalRequests: allTimes.length,
      totalTime,
      throughput: allTimes.length / (totalTime / 1000),
      ...aggregateStats
    };

    const passed = passedAvg && passedP95 && passedThroughput;
    testResults.concurrentTest.passed = passed;

    if (passed) {
      console.log('   🎉 PASS: Performance concurrente dentro de umbrales\n');
      return true;
    } else {
      console.log('   ⚠️  FAIL: Performance concurrente fuera de umbrales\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
    return false;
  }
}

// Run all performance tests
async function runAllTests() {
  console.log('🚀 Starting Performance Test Suite...\n');
  console.log(`📌 Test Module: ${TEST_MODULE_ID}`);
  console.log(`👤 Test User: ${TEST_USER_ID}`);
  console.log(`🌐 Backend: ${BASE_URL}\n`);
  console.log('🎯 UMBRALES ESPERADOS:');
  console.log(`   • API Response: < ${testResults.thresholds.apiResponse}ms`);
  console.log(`   • Evaluation Logic: < ${testResults.thresholds.evaluation}ms`);
  console.log(`   • DB Queries: < ${testResults.thresholds.dbQuery}ms`);
  console.log('========================================');

  const results = [];

  results.push(await test1_consecutiveResponses());
  results.push(await test2_concurrentUsers());

  const passedTests = results.filter(r => r).length;
  const totalTests = results.length;

  console.log('========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================\n');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  // Summary of metrics
  if (testResults.consecutiveTest.metrics.avg) {
    console.log('📈 CONSECUTIVE TEST SUMMARY:');
    console.log(`   • Responses: ${testResults.consecutiveTest.metrics.successCount}`);
    console.log(`   • Avg time: ${Math.round(testResults.consecutiveTest.metrics.avg)}ms`);
    console.log(`   • P95 time: ${Math.round(testResults.consecutiveTest.metrics.p95)}ms`);
    console.log(`   • Error rate: ${testResults.consecutiveTest.metrics.errorRate.toFixed(2)}%\n`);
  }

  if (testResults.concurrentTest.metrics.throughput) {
    console.log('📈 CONCURRENT TEST SUMMARY:');
    console.log(`   • Users: ${testResults.concurrentTest.metrics.numUsers}`);
    console.log(`   • Total requests: ${testResults.concurrentTest.metrics.totalRequests}`);
    console.log(`   • Throughput: ${Math.round(testResults.concurrentTest.metrics.throughput)} req/s`);
    console.log(`   • Avg time: ${Math.round(testResults.concurrentTest.metrics.avg)}ms`);
    console.log(`   • P95 time: ${Math.round(testResults.concurrentTest.metrics.p95)}ms\n`);
  }

  if (passedTests === totalTests) {
    console.log('🎉 ALL PERFORMANCE TESTS PASSED!\n');
    console.log('✨ Sistema ready para producción desde perspectiva de performance\n');
  } else {
    console.log('⚠️  Some performance tests failed.');
    console.log('💡 Considerar optimizaciones antes de producción.\n');
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

runAllTests();
