const test = require('node:test');
const assert = require('node:assert/strict');
const metrics=require('./runtimeMetrics');
test('concurrent traces isolate timing and token usage without recording payloads', async()=>{
 const [a,b]=await Promise.all([
 metrics.capture('generation',async()=>{await metrics.measure('openai',async()=>{});metrics.usage('test-model',{prompt_tokens:9,completion_tokens:2}); return 'private answer';}),
 metrics.capture('database',async()=>{await metrics.measure('database',async()=>{});})]);
 assert.equal(a.metrics.usage[0].input_tokens,9);assert.equal(b.metrics.usage.length,0);assert.equal(a.metrics.stages.database,undefined);
 assert.equal(JSON.stringify(metrics.snapshot()).includes('private answer'),false);
 assert.deepEqual(metrics.distribution([]),{samples:0,p50_ms:null,p95_ms:null,min_ms:null,max_ms:null});
});

test('activity report separates cold, prepared and repeated deliveries and recognizes streamed errors',()=>{
 const {learningReport}=require('./learningReport');
 const operation='GET:/learning/modules/:moduleId/activity';
 const rows=[
  {operation,status:200,total_ms:100,stages:{activity_build:80},tags:{activity_delivery:'cold',activity_source:'generated',generation_outcome:'generated'}},
  {operation,status:200,total_ms:5,stages:{},tags:{activity_delivery:'prepared',activity_source:'stored'}},
  {operation,status:200,total_ms:1,stages:{},tags:{activity_delivery:'published_cache',activity_source:'stored'}},
  {operation,status:200,total_ms:30,stages:{activity_build:20},tags:{activity_delivery:'cold',terminal_status:'503',stream_outcome:'error',generation_outcome:'unavailable',generation_failure_initial:'rate_limit'}},
  {operation:'next_activity_prefetch',status:200,total_ms:50,stages:{activity_build:50},tags:{generation_outcome:'reserve',generation_repair:'attempted',generation_failure_initial:'contract',generation_failure_final:'review_rejected'}},
  {operation:'practice_restart_prefetch',status:200,total_ms:40,stages:{activity_build:40},tags:{generation_outcome:'generated'}},
  {operation:'activity_lookahead',status:200,total_ms:40,stages:{activity_build:40},tags:{generation_outcome:'generated'}},
  {operation,status:200,total_ms:7,stages:{lookahead_wait:6,user_queue_wait:1},tags:{activity_delivery:'lookahead_wait',activity_source:'generated',lookahead_plan:'conditional_skill'}}
 ];
 const report=learningReport(rows);
 assert.equal(report.delivered.errors,1);assert.equal(report.serverLatency.cold.p50_ms,100);assert.equal(report.serverLatency.prepared.p50_ms,5);assert.equal(report.serverLatency.published_cache.p50_ms,1);
 assert.equal(report.builds.total,5);assert.equal(report.builds.repairs,1);assert.equal(report.builds.outcomes.reserve,1);assert.equal(report.builds.initialFailures.rate_limit,1);
 assert.equal(learningReport([]).serverLatency.cold.p95_ms,null);
 assert.equal(report.serverLatency.lookahead_wait.p50_ms,7);assert.equal(report.lookahead.wait.p50_ms,6);assert.equal(report.lookahead.userQueueWait.p50_ms,1);assert.equal(report.lookahead.plans.conditional_skill,1);
});
