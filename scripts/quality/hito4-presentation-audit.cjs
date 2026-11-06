// Bounded, offline presentation audit. Does not certify curricular/factual quality.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {cleanActivityPresentation:clean}=require('../../server/learningPresentation');
const {hash}=require('../../server/reserveInventory');
const root=path.resolve(__dirname,'../..');
const file='reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json';
const snapshot=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const modules=new Map(snapshot.data.modules.map(m=>[m.id,m]));
let inspected=0,closed=0;const changes=[],rejected=[];
for(const step of snapshot.data.module_steps){
 const e=step.enriched_content||{},base=step.content||{};
 const questions=Array.isArray(e.questions)?e.questions:[e];
 for(const [index,q] of questions.entries()){
  const question=q.text||q.question||base.question||base.prompt;if(typeof question!=='string')continue;inspected++;
  const declared=q.type||q.expected_answer?.type||e.expected_answer?.type||base.answer_type||'text';
  const type=({multiple_choice:'option',open_text:'text',keywords:'text'}[declared]||declared);
  if(!['option','multiple_select','matching','ordering'].includes(type))continue;closed++;
  const a={type,question,options:q.options||base.options,left_items:q.left_items||base.left_items,right_items:q.right_items||base.right_items,items:q.items||base.items};
  const before=JSON.stringify(a);
  try{const fixed=clean(a);assert.equal(JSON.stringify(a),before);assert.deepEqual(clean(fixed),fixed);
   if(fixed.question!==question)changes.push({questionId:`${step.id}:q:${index}`,subject:modules.get(step.module_id)?.subject,type,sourceSha256:hash(step),originalQuestion:question,correctedQuestion:fixed.question});
  }catch(error){rejected.push({questionId:`${step.id}:q:${index}`,reason:error.message});}
 }
}
const report={scope:'Presentation only; exact duplicate controls. No pedagogical approval or database writes.',snapshot:file,snapshotSha256:hash(snapshot.data),inspectedQuestions:inspected,closedQuestions:closed,changed:changes.length,rejected:rejected.length,changes,rejections:rejected};
const output=path.join(root,'reports/hito4-2-presentation');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,changes:undefined,rejections:undefined}));
