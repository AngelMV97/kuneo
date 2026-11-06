// Reproducible offline verification of the bounded live batch, not a catalog approval.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createContentService}=require('../../server/learningContent');
const {cleanActivityPresentation,validatePresentation}=require('../../server/learningPresentation');
const {inquiryPlan,validateInquiry}=require('../../server/learningInquiry');
const {hash}=require('../../server/reserveInventory');
async function main(){
 const root=path.resolve(__dirname,'../..'),folder=path.join(root,'reports/hito4-2-inquiry'),read=file=>JSON.parse(fs.readFileSync(path.join(folder,file),'utf8'));
 const batch=read('live.json'),focused=read('live-slot-4.json'),rows=batch.results.map(row=>row.slot===4?focused.results[0]:row);
 assert.equal(rows.length,8);assert.equal(rows.filter(r=>r.activity).length,8);assert.equal(new Set(rows.map(r=>r.activity.question)).size,8);
 const snapshot=require('../../reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json').data,module=snapshot.modules.find(m=>m.id===batch.source.moduleId);
 assert.ok(module);assert.equal(module.learning_objective,batch.source.objective);
 const service=createContentService({secret:'offline',client:{}}),checks=[];
 const independentKeys={1:[0],3:[0,3],5:[0],7:[1,2,3]};
 const permutations=values=>values.length?values.flatMap((v,i)=>permutations(values.filter((_,j)=>j!==i)).map(t=>[v,...t])):[[]];
 for(const row of rows){
  const a=validateInquiry(row.payload,inquiryPlan(module,batch.source.grade,row.slot-1));validatePresentation(a);assert.equal(cleanActivityPresentation(a).question,a.question);
  let tested=0;
  if(a.type==='matching'){
   const pairs=a.left_items.map((label,i)=>{
    let pattern;
    if(row.slot===4)pattern=/Diseño A/.test(label)?/no a[ií]sla/:/Diseño B/.test(label)?/solo el efecto de la distancia/:/solo el efecto del volumen/;
    else pattern=/Contactar/.test(label)?/motivo de la correcci[oó]n/:/Borrar/.test(label)?/No permite rastrear/:/transparencia/;
    const matches=a.right_items.map((s,j)=>pattern.test(s)?j:-1).filter(j=>j>=0);assert.equal(matches.length,1);return [i,matches[0]];
   });
   assert.deepEqual(a.expected.correct_pairs.slice().sort((x,y)=>x[0]-y[0]),pairs);
   for(const order of permutations(a.right_items.map((_,i)=>i))){const input=order.map((j,i)=>[i,j]),result=await service.evaluate(a,JSON.stringify(input));assert.equal(result.result==='correct',JSON.stringify(input)===JSON.stringify(pairs));tested++;}
  }else if(independentKeys[row.slot]){
   assert.deepEqual(a.expected.correct_options,independentKeys[row.slot]);
   const inputs=a.type==='option'?a.options.map((_,i)=>String(i)):Array.from({length:2**a.options.length-1},(_,n)=>JSON.stringify(a.options.map((_,i)=>i).filter(i=>(n+1)&(1<<i))));
   for(const input of inputs){const result=await service.evaluate(a,input),selected=a.type==='option'?[Number(input)]:JSON.parse(input);assert.equal(result.result==='correct',JSON.stringify(selected)===JSON.stringify(independentKeys[row.slot]));tested++;}
  }
  checks.push({slot:row.slot,caseId:inquiryPlan(module,batch.source.grade,row.slot-1).id,questionSha256:hash(a.question),format:a.type,answersChecked:tested,openGradingLiveTested:false});
 }
 const report={scope:'Bounded dynamic inquiry batch; no Supabase publication, no approval of the historical catalog.',moduleId:module.id,objective:module.learning_objective,sourceSha256:hash(module),checks,closedAnswersChecked:checks.reduce((n,c)=>n+c.answersChecked,0),modelCalls:batch.calls+focused.calls,inputTokens:batch.inputTokens+focused.inputTokens,outputTokens:batch.outputTokens+focused.outputTokens,remainingLimitations:['Open rubrics checked by reading; not evaluated with real student answers in this batch.','Simulated synthetic routing evidence; not a learner progress test.','Provider generation time is not frontend latency with lookahead.','Contexts are a bounded authoring scaffold; this is not a persistent bank of approved activities.']};
 fs.writeFileSync(path.join(folder,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({questions:checks.length,closedAnswersChecked:report.closedAnswersChecked,modelCalls:report.modelCalls}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
