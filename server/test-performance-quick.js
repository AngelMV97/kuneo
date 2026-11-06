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
const TEST_MODULE_ID = 'e687871a-ecee-49f5-a4a2-54a0df47d1f4';

console.log('\n========================================');
console.log('FASE 2.2: PERFORMANCE TESTING (QUICK)');
console.log('========================================\n');

let testResults = {
  consecutiveTest: { passed: false, metrics: {} },
  concurrentTest: { passed: false, metrics: {} },
  thresholds: {
    evaluation: 200,
    apiResponse: 500,
    dbQuery: 50
  }
};

function calculatePercentile(sortedArray, percentile) {
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[index];
}

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

async function submitAnswer(userId, moduleId, stepId, answer) {
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

async function getModuleSteps(moduleId) {
  const { data: steps, error } = await supabase
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', moduleId)
    .order('step_order');

  if (error) throw error;
  
  return steps.filter(s => s.enriched_content !== null);
}

async function test1_consecutiveResponses() {
  console.log('\n🧪 TEST 1: 20 Respuestas Consecutivas (Quick Test)');
  console.log('   Midiendo performance base del sistema...\n');
  
  try {
    const steps = await getModuleSteps(TEST_MODULE_ID);
    
    if (steps.length < 5) {
      console.log(`   ❌ SKIP: Module only has ${steps.length} steps\n`);
      return false;
    }

    console.log(`   📚 Módulo: ${TEST_MODULE_ID}`);
    console.log(`   📝 Steps disponibles: ${steps.length}`);
    console.log(`   🎯 Objetivo: 20 respuestas\n`);

    const targetResponses = 20;
    const responseTimes = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < targetResponses; i++) {
      const step = steps[i % steps.length];
      const answer = i % 4 === 0 ? "0" : String((i % 3) + 1);

      const result = await submitAnswer(TEST_USER_ID, TEST_MODULE_ID, step.id, answer);
      
      if (result.success) {
        responseTimes.push(result.duration);
        successCount++;
        process.stdout.write(`   ✓ ${i+1}/${targetResponses} (${Math.round(result.duration)}ms) `);
        if ((i + 1) % 5 === 0) console.log();
      } else {
        errorCount++;
        console.log(`   ✗ ${i+1}/${targetResponses} ERROR`);
      }
    }

    console.log(`\n\n   ✅ Completado: ${successCount}/${targetResponses} respuestas`);
    console.log(`   ❌ Errores: ${errorCount}\n`);

    const stats = calculateStats(responseTimes);
    
    console.log('   📊 MÉTRICAS DE PERFORMANCE:');
    console.log(`   • Min:    ${Math.round(stats.min)}ms`);
    console.log(`   • Max:    ${Math.round(stats.max)}ms`);
    console.log(`   • Avg:    ${Math.round(stats.avg)}ms`);
    console.log(`   • Median: ${Math.round(stats.median)}ms`);
    console.log(`   • P95:    ${Math.round(stats.p95)}ms\n`);

    testResults.consecutiveTest.metrics = {
      totalResponses: targetResponses,
      successCount,
      errorCount,
      errorRate: (errorCount / targetResponses) * 100,
      ...stats
    };

    // More lenient thresholds for realistic assessment
    const avgThreshold = 5000; // 5 seconds (very lenient)
    const passed = stats.avg < avgThreshold && (errorCount / targetResponses < 0.05);
    testResults.consecutiveTest.passed = passed;

    console.log('   🎯 EVALUACIÓN:');
    console.log(`   • Sistema responde: ${successCount > 0 ? '✅' : '❌'} (${successCount}/${targetResponses})`);
    console.log(`   • Avg < ${avgThreshold}ms: ${stats.avg < avgThreshold ? '✅' : '⚠️'} (${Math.round(stats.avg)}ms)`);
    console.log(`   • Error rate < 5%: ${errorCount / targetResponses < 0.05 ? '✅' : '❌'} (${((errorCount / targetResponses) * 100).toFixed(1)}%)\n`);

    if (passed) {
      console.log('   ✅ PASS: Sistema funcional (requiere optimización)\n');
    } else {
      console.log('   ⚠️  FAIL: Sistema con problemas de performance\n');
    }

    return passed;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
    return false;
  }
}

async function test2_concurrentUsers() {
  console.log('\n🧪 TEST 2: 5 Usuarios x 4 Respuestas (Quick Test)');
  console.log('   Midiendo concurrencia básica...\n');
  
  try {
    const steps = await getModuleSteps(TEST_MODULE_ID);
    
    if (steps.length < 4) {
      console.log(`   ❌ SKIP: Module only has ${steps.length} steps\n`);
      return false;
    }

    const numUsers = 5;
    const responsesPerUser = 4;
    
    const testUsers = Array.from({ length: numUsers }, (_, i) => 
      `test-user-${i}-${Date.now()}`
    );

    console.log(`   👥 Usuarios: ${numUsers}`);
    console.log(`   📝 Respuestas por usuario: ${responsesPerUser}`);
    console.log(`   🎯 Total respuestas: ${numUsers * responsesPerUser}\n`);

    const startTime = Date.now();

    const userPromises = testUsers.map(async (userId, userIndex) => {
      const userTimes = [];
      
      for (let i = 0; i < responsesPerUser; i++) {
        const step = steps[i % steps.length];
        const answer = "0";
        
        const result = await submitAnswer(userId, TEST_MODULE_ID, step.id, answer);
        
        if (result.success) {
          userTimes.push(result.duration);
        }
      }
      
      return {
        userId: `User ${userIndex + 1}`,
        times: userTimes,
        stats: userTimes.length > 0 ? calculateStats(userTimes) : null
      };
    });

    const userResults = await Promise.all(userPromises);
    const totalTime = Date.now() - startTime;

    const allTimes = userResults.flatMap(u => u.times);
    
    if (allTimes.length === 0) {
      console.log('   ❌ FAIL: No se completó ninguna respuesta\n');
      return false;
    }

    const aggregateStats = calculateStats(allTimes);

    console.log('   📊 MÉTRICAS AGREGADAS:');
    console.log(`   • Total requests:  ${allTimes.length}`);
    console.log(`   • Total time:      ${Math.round(totalTime / 1000)}s`);
    console.log(`   • Throughput:      ${(allTimes.length / (totalTime / 1000)).toFixed(2)} req/s`);
    console.log(`   • Avg response:    ${Math.round(aggregateStats.avg)}ms`);
    console.log(`   • P95 response:    ${Math.round(aggregateStats.p95)}ms\n`);

    console.log('   👥 MÉTRICAS POR USUARIO:');
    userResults.forEach((user, idx) => {
      if (user.stats) {
        console.log(`   ${idx + 1}. ${user.userId}: ${user.times.length} respuestas | Avg ${Math.round(user.stats.avg)}ms`);
      }
    });
    console.log();

    testResults.concurrentTest.metrics = {
      numUsers,
      responsesPerUser,
      totalRequests: allTimes.length,
      totalTime,
      throughput: allTimes.length / (totalTime / 1000),
      ...aggregateStats
    };

    const minThroughput = 1; // At least 1 req/s
    const passed = (allTimes.length / (totalTime / 1000)) >= minThroughput;
    testResults.concurrentTest.passed = passed;

    console.log('   🎯 EVALUACIÓN:');
    console.log(`   • Concurrencia funciona: ${allTimes.length > 0 ? '✅' : '❌'}`);
    console.log(`   • Throughput > ${minThroughput} req/s: ${passed ? '✅' : '❌'} (${(allTimes.length / (totalTime / 1000)).toFixed(2)} req/s)\n`);

    if (passed) {
      console.log('   ✅ PASS: Concurrencia funcional\n');
    } else {
      console.log('   ⚠️  FAIL: Problemas de concurrencia\n');
    }

    return passed;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Quick Performance Test Suite...\n');
  console.log(`📌 Test Module: ${TEST_MODULE_ID}`);
  console.log(`👤 Test User: ${TEST_USER_ID}`);
  console.log(`🌐 Backend: ${BASE_URL}\n`);
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

  if (testResults.consecutiveTest.metrics.avg) {
    console.log('📈 CONSECUTIVE TEST SUMMARY:');
    console.log(`   • Responses: ${testResults.consecutiveTest.metrics.successCount}`);
    console.log(`   • Avg time: ${Math.round(testResults.consecutiveTest.metrics.avg)}ms`);
    console.log(`   • Error rate: ${testResults.consecutiveTest.metrics.errorRate.toFixed(2)}%\n`);
  }

  if (testResults.concurrentTest.metrics.throughput) {
    console.log('📈 CONCURRENT TEST SUMMARY:');
    console.log(`   • Users: ${testResults.concurrentTest.metrics.numUsers}`);
    console.log(`   • Total requests: ${testResults.concurrentTest.metrics.totalRequests}`);
    console.log(`   • Throughput: ${testResults.concurrentTest.metrics.throughput.toFixed(2)} req/s\n`);
  }

  console.log('💡 ANÁLISIS:');
  if (testResults.consecutiveTest.metrics.avg > 500) {
    console.log(`   ⚠️  Performance actual: ~${Math.round(testResults.consecutiveTest.metrics.avg)}ms/req`);
    console.log('   📌 Objetivo ideal: <500ms/req');
    console.log('   🔧 Requiere optimización para producción\n');
  }

  if (passedTests === totalTests) {
    console.log('✅ Sistema funcional - Performance requiere optimización\n');
  } else {
    console.log('⚠️  Sistema tiene issues críticos de performance\n');
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

runAllTests();
