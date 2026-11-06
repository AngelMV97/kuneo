const {test}=require('node:test'),assert=require('node:assert/strict');
const {build}=require('../scripts/quality/hito4-round5.cjs'),{check}=require('../scripts/quality/hito4-round5-check.cjs');
const {hash}=require('./reserveInventory');
const {normalizeStored,createContentService}=require('./learningContent');
const snapshot=require('../reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json');
test('round five preserves five original sources, keeps valid original keys and isolates the historical grade correction',()=>{
 const candidates=build(),packets=require('../reports/hito4-2-round5/audit.json').packets;assert.equal(candidates.length,5);
 for(const [i,c]of candidates.entries()){const p=packets.find(p=>p.questionId===c.original.questionId);assert.equal(hash({stepContent:p.step.content,enriched:p.step.enriched_content}),c.original.sha256);assert.equal(hash(p.module),p.associationHashes.module);assert.equal(hash(p.card),p.associationHashes.card);assert.equal(hash(p.visual),p.associationHashes.visual);assert.equal(c.module.learning_objective,p.module.learning_objective);assert.equal(c.module.is_active,false);assert.equal(c.status,'candidate_not_published');assert.equal(c.step.concept_card_id,null);assert.equal(c.step.visual_template_key,null);
  if(i===2){assert.equal(p.module.grade_range,'6-7');assert.equal(c.module.grade_range,'8-9');}else assert.equal(c.module.grade_range,p.module.grade_range);
 }
 assert.equal(normalizeStored(packets[1].step).options[0],'Derecho a la educación');assert.equal(normalizeStored(packets[1].step).expected.correct_options[0],0);
});
test('round five validates all 39 complete selections and explains every alternative',async()=>{
 const result=await check();assert.equal(result.checked.reduce((n,c)=>n+c.answersChecked,0),39);assert.ok(result.checked.every(c=>c.pass));
 const historical=build()[2].activity;assert.ok(historical.question.includes('Artículo 15, numeral 16'));assert.ok(historical.question.includes('Artículo 16:'));assert.ok(!historical.question.includes('Constitución de 1886'));assert.deepEqual(historical.correct_indices,[0,1]);
});
test('five originals with confirmed quality issues cannot be delivered as new reserves',async()=>{
 const service=createContentService({secret:'round5',mode:'stored',client:{}});
 for(const c of build()){const step=snapshot.data.module_steps.find(s=>s.id===c.original.questionId.split(':q:')[0]),module=snapshot.data.modules.find(m=>m.id===step.module_id),a=normalizeStored(step);assert.ok(a);
 await assert.rejects(service.generate({userId:'synthetic',profile:{grade_level:Number(module.grade_range.split('-').at(-1))},module,steps:[step],attempts:[],anticipation:{stepId:step.id,dimension:a.dimension,format:a.type}}),e=>e.status===503);}
});
