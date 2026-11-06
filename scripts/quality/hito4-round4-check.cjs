const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {build}=require('./hito4-round4.cjs'),{hash}=require('../../server/reserveInventory');
const {normalizeStored,createContentService,validateGenerated}=require('../../server/learningContent');
const {validateSupport}=require('../../server/learningSupport');
const prior=require('../../reports/hito4-2-round3/worklist.json');
const permutations=a=>a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>j!==i)).map(t=>[v,...t])):[[]];
async function check(){
 const candidates=build(),service=createContentService({secret:'round4-offline',client:{}}),checked=[];
 // Independent, manually reviewed outcomes for these seven supplied cases.
 const keys=[[1],[[0,2],[1,0],[2,1]],[0,1],[[0,2],[1,1],[2,0]],[2],[0,2],[1]];
 for(const [i,c]of candidates.entries()){
  validateGenerated(c.activity);const a=normalizeStored(c.step);assert.ok(a);for(const [j,s]of c.supports.entries())validateSupport(s,j+2);
  const key=keys[i];assert.deepEqual(a.type==='matching'?a.expected.correct_pairs:a.expected.correct_options,key);
  const inputs=a.type==='option'?a.options.map((_,j)=>[j]):a.type==='matching'?permutations(a.right_items.map((_,j)=>j)).map(order=>order.map((right,left)=>[left,right])):Array.from({length:2**a.options.length-1},(_,bits)=>a.options.map((_,j)=>j).filter(j=>(bits+1)&(1<<j)));
  for(const input of inputs){const answer=a.type==='option'?String(input[0]):JSON.stringify(input),result=await service.evaluate(a,answer);assert.equal(result.result==='correct',JSON.stringify(input)===JSON.stringify(key));assert.ok(result.feedback.trim());assert.equal(result.feedbackDetails.length,a.type==='matching'?a.left_items.length:a.options.length);}
  // Supports are separate cases: no answer block contains a Markdown table.
  assert.ok(!c.supports[1].example_result.includes('|'));assert.ok(c.supports[1].example_steps.length>=2);
  checked.push({questionId:c.original.questionId,candidateSha256:c.sha256,answersChecked:inputs.length,pass:true});
 }
 return {candidates,checked};
}
async function main(){
 const {candidates,checked}=await check(),root=path.resolve(__dirname,'../..'),ids=new Set(candidates.map(c=>c.original.questionId)),remaining=prior.remaining.filter(r=>!ids.has(r.questionId));
 assert.equal(remaining.length,prior.remaining.length-7);
 const quarantine=require('../../server/reserveQuarantineRound4.json');assert.equal(quarantine.steps.length,7);for(const c of candidates)assert.ok(quarantine.steps.some(s=>s.id===c.original.questionId.split(':q:')[0]&&s.sourceSha256===c.original.sha256));
 const count=[...require('../../server/reserveQuarantine.json').steps,...require('../../server/reserveQuarantineRound2.json').steps,...require('../../server/reserveQuarantineRound3.json').steps,...quarantine.steps].length;
 const keywordIds=new Set(require('../../reports/hito4-2/pilot.json').relatedReviewCohort.questions.map(q=>q.questionId));
 const result={reviewedUniqueOriginals:prior.reviewedUniqueOriginals+7,remainingTechnicalCandidates:remaining.length,remainingKeywordCandidates:remaining.filter(q=>keywordIds.has(q.questionId)).length,quarantinedSteps:count,candidatesPublished:0,orderingGenerationEnabledByDefault:false,localCandidates:checked,remaining};
 fs.writeFileSync(path.join(root,'reports/hito4-2-round4/worklist.json'),JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(path.join(root,'reports/hito4-2-round4/verification.json'),JSON.stringify({snapshotSha256:require('../../reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json').sha256,checks:checked,answersChecked:checked.reduce((n,c)=>n+c.answersChecked,0),sourceHashes:Object.fromEntries(['server/learningContent.js','server/learningFormats.js','scripts/quality/hito4-round4.cjs'].map(f=>[f,hash(fs.readFileSync(path.join(root,f),'utf8'))])),modelCalls:0,databaseCalls:0},null,2)+'\n');
 console.log(JSON.stringify({reviewed:result.reviewedUniqueOriginals,remaining:result.remainingTechnicalCandidates,keyword:result.remainingKeywordCandidates,quarantined:count,answersChecked:checked.reduce((n,c)=>n+c.answersChecked,0),published:0}));
}
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1;});module.exports={check};
