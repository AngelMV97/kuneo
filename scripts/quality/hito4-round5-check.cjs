const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {build}=require('./hito4-round5.cjs'),{hash}=require('../../server/reserveInventory');
const {normalizeStored,validateGenerated,createContentService}=require('../../server/learningContent');
const {validateSupport}=require('../../server/learningSupport');
const snapshot=require('../../reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json'),prior=require('../../reports/hito4-2-round4/worklist.json');
async function check(){
 const candidates=build(),service=createContentService({secret:'round5-offline',client:{}}),keys=[[2],[1],[0,1],[0],[0,2]],checked=[];
 for(const [i,c]of candidates.entries()){
  validateGenerated(c.activity);const a=normalizeStored(c.step);assert.ok(a);assert.deepEqual(a.expected.correct_options,keys[i]);for(const [j,support]of c.supports.entries())validateSupport(support,j+2);
  const inputs=a.type==='option'?a.options.map((_,i)=>[i]):Array.from({length:2**a.options.length-1},(_,bits)=>a.options.map((_,i)=>i).filter(i=>(bits+1)&(1<<i)));
  for(const input of inputs){const result=await service.evaluate(a,a.type==='option'?String(input[0]):JSON.stringify(input));assert.equal(result.result==='correct',JSON.stringify(input)===JSON.stringify(keys[i]));assert.equal(result.feedbackDetails.length,a.options.length);assert.ok(result.feedback.trim());}
  assert.ok(!c.supports[1].example_result.includes('|'));checked.push({questionId:c.original.questionId,candidateSha256:c.sha256,answersChecked:inputs.length,pass:true});
 }
 return {candidates,checked};
}
async function main(){
 const {candidates,checked}=await check(),root=path.resolve(__dirname,'../..'),ids=new Set(candidates.map(c=>c.original.questionId)),remaining=prior.remaining.filter(r=>!ids.has(r.questionId));assert.equal(remaining.length,prior.remaining.length-5);
 const quarantine=require('../../server/reserveQuarantineRound5.json');assert.equal(quarantine.steps.length,5);for(const c of candidates)assert.ok(quarantine.steps.some(s=>s.id===c.original.questionId.split(':q:')[0]&&s.sourceSha256===c.original.sha256));
 const count=[...require('../../server/reserveQuarantine.json').steps,...require('../../server/reserveQuarantineRound2.json').steps,...require('../../server/reserveQuarantineRound3.json').steps,...require('../../server/reserveQuarantineRound4.json').steps,...quarantine.steps].length;
 const keywordIds=new Set(require('../../reports/hito4-2/pilot.json').relatedReviewCohort.questions.map(q=>q.questionId)),steps=new Map(snapshot.data.module_steps.map(s=>[s.id,s]));
 const closed=remaining.filter(q=>{const a=normalizeStored(steps.get(q.stepId),Number(q.questionId.split(':q:')[1]));return a&&a.type!=='text';});assert.equal(closed.length,0);
 const result={reviewedUniqueOriginals:prior.reviewedUniqueOriginals+5,remainingTechnicalCandidates:remaining.length,remainingKeywordCandidates:remaining.filter(q=>keywordIds.has(q.questionId)).length,remainingReadableClosedCandidates:closed.length,quarantinedSteps:count,candidatesPublished:0,orderingGenerationEnabledByDefault:false,localCandidates:checked,remaining};
 const folder=path.join(root,'reports/hito4-2-round5');fs.writeFileSync(path.join(folder,'worklist.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(folder,'verification.json'),JSON.stringify({snapshotSha256:snapshot.sha256,checks:checked,answersChecked:checked.reduce((n,c)=>n+c.answersChecked,0),sourceHashes:Object.fromEntries(['server/learningContent.js','scripts/quality/hito4-round5.cjs'].map(f=>[f,hash(fs.readFileSync(path.join(root,f),'utf8'))])),modelCalls:0,databaseCalls:0},null,2)+'\n');
 console.log(JSON.stringify({reviewed:result.reviewedUniqueOriginals,remaining:result.remainingTechnicalCandidates,keyword:result.remainingKeywordCandidates,closedRemaining:closed.length,quarantined:count,answersChecked:checked.reduce((n,c)=>n+c.answersChecked,0),published:0}));
}
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1;});module.exports={check};
