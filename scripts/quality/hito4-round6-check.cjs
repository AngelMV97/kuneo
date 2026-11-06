const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {build}=require('./hito4-round6.cjs'),{hash}=require('../../server/reserveInventory');
const {normalizeStored,validateGenerated}=require('../../server/learningContent');
const {validateSupport,enforceSupportLanguage}=require('../../server/learningSupport');
function check(){
 const candidates=build(),audit=require('../../reports/hito4-2-round6/audit.json'),live=require('../../reports/hito4-2-round6/live-evaluation.json');
 assert.equal(candidates.length,8);assert.equal(live.passed,true);assert.equal(live.results.length,32);
 const evaluator=fs.readFileSync(path.resolve(__dirname,'../../server/learningContent.js'),'utf8');
 // The live run preceded only the subsequent quarantine import; grading code is identical.
 assert.equal(hash(evaluator.replace(", ...require('./reserveQuarantineRound6.json').steps",'')),live.evaluatorSha256);
 for(const c of candidates){validateGenerated(c.activity);const a=normalizeStored(c.step);assert.equal(a.expected.type,'rubric');assert.equal(a.expected.criteria.length,2);assert.equal(c.module.is_active,false);
  const p=audit.packets.find(p=>p.questionId===c.original.questionId);assert.equal(hash({stepContent:p.step.content,enriched:p.step.enriched_content}),c.original.sha256);
  assert.deepEqual(p.originalProbes.map(p=>p.actual.result),['correct','incorrect','incorrect','incorrect']);
  for(const [answer,expected]of c.checks){const r=live.results.find(r=>r.questionId===c.original.questionId&&r.answer===answer);assert.equal(r.candidateSha256,c.sha256);assert.equal(r.actual.result,expected);assert.ok(r.actual.feedback.trim());assert.equal(r.pass,true);}
  for(const [i,s]of c.supports.entries()){validateSupport(s,i+2);enforceSupportLanguage(s,c.module.subject);assert.ok(!s.example_result.includes('|'));}
 }
 return {candidates,audit,live};
}
function main(){
 const {candidates,audit,live}=check(),prior=require('../../reports/hito4-2-round5/worklist.json'),ids=new Set(candidates.map(c=>c.original.questionId)),remaining=prior.remaining.filter(q=>!ids.has(q.questionId));assert.equal(remaining.length,528);
 const cohort=new Set(require('../../reports/hito4-2/pilot.json').relatedReviewCohort.questions.map(q=>q.questionId));assert.ok(remaining.every(q=>cohort.has(q.questionId)));
 const quarantine=[...require('../../server/reserveQuarantine.json').steps,...[2,3,4,5,6].flatMap(i=>require(`../../server/reserveQuarantineRound${i}.json`).steps)];assert.equal(quarantine.length,47);assert.equal(new Set(quarantine.map(q=>q.id)).size,47);
 for(const c of candidates)assert.ok(quarantine.some(q=>q.id===c.original.questionId.split(':q:')[0]&&q.sourceSha256===c.original.sha256));
 const folder=path.resolve(__dirname,'../../reports/hito4-2-round6');
 fs.writeFileSync(path.join(folder,'worklist.json'),JSON.stringify({reviewedUniqueOriginals:47,remainingTechnicalCandidates:528,remainingKeywordCandidates:528,remainingReadableClosedCandidates:0,remainingOpenExactTextCandidates:0,quarantinedSteps:47,candidatesPublished:0,remaining},null,2)+'\n');
 fs.writeFileSync(path.join(folder,'verification.json'),JSON.stringify({snapshotSha256:audit.snapshotSha256,originalProbes:32,liveAnswers:32,livePassed:32,model:live.model,finalRunCalls:live.calls,databaseCalls:0,candidatesPublished:0,scope:'Written planning and reasoning only; no oral performance or experimental execution certified.',sourceHashes:Object.fromEntries(['server/learningContent.js','scripts/quality/hito4-round6.cjs'].map(f=>[f,hash(fs.readFileSync(path.resolve(__dirname,'../..',f),'utf8'))]))},null,2)+'\n');
 console.log(JSON.stringify({reviewed:47,remaining:528,originalProbes:32,livePassed:32,quarantined:47,published:0}));
}
if(require.main===module)main();module.exports={check};
