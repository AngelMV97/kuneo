const {test}=require('node:test'),assert=require('node:assert/strict');
const {build}=require('../scripts/quality/hito4-round4.cjs');
const {check}=require('../scripts/quality/hito4-round4-check.cjs');
const {normalizeStored,createContentService}=require('./learningContent');
const {hash}=require('./reserveInventory');
const snapshot=require('../reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json');
test('round four preserves seven source packets and shared associations; candidates remain isolated and inactive',()=>{
 const packets=require('../reports/hito4-2-round4/audit.json').packets,candidates=build();assert.equal(candidates.length,7);
 for(const c of candidates){const p=packets.find(p=>p.questionId===c.original.questionId);assert.ok(p);assert.equal(hash({stepContent:p.step.content,enriched:p.step.enriched_content}),c.original.sha256);assert.equal(hash(p.module),p.associationHashes.module);assert.equal(hash(p.card),p.associationHashes.card);assert.equal(hash(p.visual),p.associationHashes.visual);assert.equal(c.module.is_active,false);assert.equal(c.status,'candidate_not_published');assert.equal(c.step.concept_card_id,null);assert.equal(c.step.visual_template_key,null);assert.equal(c.module.learning_objective,p.module.learning_objective);}
});
test('round four closed keys and all 54 permitted complete answers are verified with specific explanations',async()=>{
 const result=await check();assert.equal(result.checked.reduce((n,c)=>n+c.answersChecked,0),54);assert.ok(result.checked.every(c=>c.pass));
 const data=build()[4].activity;assert.equal(1500-500,1000);assert.equal(2100-700,1400);assert.equal(1500/500,2100/700);assert.ok(data.options[data.correct_index].includes('1400'));
});
test('all seven known defective originals are excluded from new runtime reserves',async()=>{
 const service=createContentService({secret:'round4',mode:'stored',client:{}});
 for(const c of build()){
  const step=snapshot.data.module_steps.find(s=>s.id===c.original.questionId.split(':q:')[0]),module=snapshot.data.modules.find(m=>m.id===step.module_id),original=normalizeStored(step);assert.ok(original);
  await assert.rejects(service.generate({userId:'synthetic',profile:{grade_level:Number(module.grade_range.split('-').at(-1))},module,steps:[step],attempts:[],anticipation:{stepId:step.id,dimension:original.dimension,format:original.type}}),e=>e.status===503);
 }
});
