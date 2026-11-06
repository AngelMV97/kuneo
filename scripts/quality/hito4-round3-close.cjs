const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {build}=require('./hito4-round3.cjs');
const {normalizeStored,createContentService,validateGenerated}=require('../../server/learningContent');
const {hash}=require('../../server/reserveInventory');
async function main(){
 const root=path.resolve(__dirname,'../..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
 const prior=read('reports/hito4-2-round2/worklist.json'),candidates=build(),service=createContentService({secret:'offline',client:{}});
 const checked=[];
 function permutations(items){return items.length?items.flatMap((v,i)=>permutations(items.filter((_,j)=>j!==i)).map(t=>[v,...t])):[[]];}
 for(const c of candidates){validateGenerated(c.activity);const a=normalizeStored(c.step);let count=0;
  const key=a.type==='ordering'?a.expected.correct_order:a.expected.correct_options;
  const inputs=a.type==='ordering'?permutations(a.items.map((_,i)=>i)):a.type==='option'?a.options.map((_,i)=>i):Array.from({length:2**a.options.length-1},(_,i)=>a.options.map((_,j)=>j).filter(j=>(i+1)&(1<<j)));
  for(const input of inputs){const answer=Array.isArray(input)?JSON.stringify(input):String(input),result=await service.evaluate(a,answer);const exact=a.type==='option'?key.includes(input):JSON.stringify(input)===JSON.stringify(key);assert.equal(result.result==='correct',exact);count++;}
  checked.push({sourceId:c.original.questionId,candidateSha256:c.sha256,answersChecked:count,pass:true});
 }
 const reviewed=new Set(candidates.map(c=>c.original.questionId)),remaining=prior.remaining.filter(q=>!reviewed.has(q.questionId));
 const keywordIds=new Set(read('reports/hito4-2/pilot.json').relatedReviewCohort.questions.map(q=>q.questionId));
 const liveFiles=['ordering-live-initial.json','ordering-live-mini-with-constraints.json','ordering-live-full-model.json','ordering-live.json'];
 const live=liveFiles.map(file=>({file,...read('reports/hito4-2-round3/'+file)}));
 const summary={reviewedUniqueOriginals:prior.reviewedUniqueOriginals+candidates.length,remainingTechnicalCandidates:remaining.length,remainingKeywordCandidates:remaining.filter(q=>keywordIds.has(q.questionId)).length,quarantinedSteps:[...read('server/reserveQuarantine.json').steps,...read('server/reserveQuarantineRound2.json').steps,...read('server/reserveQuarantineRound3.json').steps].length,candidatesPublished:0,orderingGenerationEnabledByDefault:false,localCandidates:checked,modelTestSummary:live.map(r=>({file:r.file,model:r.model,calls:r.calls,passed:r.results.filter(x=>x.pass).length,total:r.results.length,inputTokens:r.inputTokens,outputTokens:r.outputTokens})),sourceHashes:Object.fromEntries(['server/learningContent.js','server/learningFormats.js','server/learningActivitySchema.js','server/learningRouter.js','server/adaptive.js','server/reserveInventory.js','client/src/components/QuestionTypes/OrderingQuestion.jsx'].map(file=>[file,hash(fs.readFileSync(path.join(root,file),'utf8'))])),remaining};
 fs.writeFileSync(path.join(root,'reports/hito4-2-round3/worklist.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({...summary,localCandidates:undefined,sourceHashes:undefined,remaining:undefined}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
