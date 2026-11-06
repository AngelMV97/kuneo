const {test}=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('../scripts/quality/hito4-repairs.cjs');
const {hash}=require('./reserveInventory');
const {normalizeStored,validateGenerated,createContentService}=require('./learningContent');
const {validateSupport,enforceSupportLanguage,enforceScienceClaims}=require('./learningSupport');
const {validateOrderingAnswer}=require('./learningFormats');
const candidates=build();
test('known defective legacy steps are quarantined, without quarantining their isolated replacements',()=>{
 const quarantine=require('./reserveQuarantine.json');
 assert.equal(quarantine.steps.length,5);
 for(const candidate of candidates){
  const source=candidate.original.questionId.split(':q:')[0];
  const entry=quarantine.steps.find(s=>s.id===source);assert.ok(entry);
  assert.equal(entry.sourceSha256,candidate.original.sha256);
  assert.ok(!quarantine.steps.some(s=>s.id===candidate.step.id));
 }
});
test('quarantine prevents serving the five known defective reserves and leaves other reserve delivery working',async()=>{
 const service=createContentService({secret:'offline',mode:'stored',client:{}});
 const originals=require('../reports/hito4-2/pilot.json').packets;
 for(const original of originals){
  await assert.rejects(service.generate({userId:'synthetic',profile:{grade_level:Number(original.module.grade_range.split('-')[0])},module:original.module,steps:[original.step],attempts:[],anticipation:{stepId:original.step.id,dimension:original.activity.dimension,format:'option'}}),{status:503});
 }
 const candidate=candidates[0];
 const served=await service.generate({userId:'synthetic',profile:{grade_level:8},module:candidate.module,steps:[candidate.step],attempts:[],anticipation:{stepId:candidate.step.id,dimension:candidate.activity.dimension,format:'option'}});
 assert.equal(served.activity.question,candidate.activity.question);
 assert.equal(served.activity.source,'stored');assert.ok(!JSON.stringify(served.activity).includes('correct_options'));
 const payload=service.decode(served.token,'synthetic');
 assert.deepEqual(payload.option_explanations,candidate.activity.option_explanations);
});
test('pilot candidates preserve provenance, stay inactive and satisfy the live format contract',()=>{
 assert.equal(candidates.length,5);assert.equal(new Set(candidates.map(c=>c.module.subject)).size,5);
 for(const candidate of candidates){
  const {sha256,...content}=candidate;assert.equal(hash(content),sha256);
  assert.equal(candidate.module.is_active,false);assert.equal(candidate.status,'candidate_not_published');
  assert.ok(candidate.original.questionId);assert.match(candidate.original.sha256,/^[a-f0-9]{64}$/);
  validateGenerated(structuredClone(candidate.activity));
  const activity=normalizeStored(candidate.step);
  assert.ok(activity);assert.equal(activity.question,candidate.activity.question);
  assert.equal(activity.explanation,candidate.activity.explanation);
  assert.deepEqual(activity.option_explanations,candidate.activity.option_explanations);
  assert.deepEqual(activity.pair_explanations,candidate.activity.pair_explanations);
  assert.equal(activity.hint,candidate.activity.hint);
  assert.equal(candidate.step.concept_card_id,null);assert.equal(candidate.step.visual_template_key,null);
 }
});
test('all authored support cards keep their real visual and prose-only conclusions',()=>{
 for(const candidate of candidates)for(const card of candidate.supports){
  const normalized=validateSupport(card);
  assert.equal(normalized.visual.kind,card.visual.kind,'Invalid visual must not silently disappear');
  enforceSupportLanguage(card,candidate.module.subject);enforceScienceClaims(card,candidate.module.subject);
  assert.ok(!card.example_result.includes('|'));assert.ok(!card.body.includes('\\sqrt'));
 }
});
test('closed candidate keys and distractors grade correctly through the real service with detailed explanations',async()=>{
 const service=createContentService({secret:'offline',client:{chat:{completions:{create(){throw Error('No models in unit tests');}}}}});
 for(const candidate of candidates.filter(c=>c.activity.type!=='text')){
  const payload=normalizeStored(candidate.step);
  for(const [answer,result] of candidate.checks){const actual=await service.evaluate(payload,answer);assert.equal(actual.result,result);assert.ok(actual.feedback);assert.ok(actual.feedbackDetails.every(d=>d.explanation));}
 }
});
test('ordering rejects omissions, additions, repetitions and out-of-range indices before grading',async()=>{
 const payload={type:'ordering',items:['Ley','Apertura','Revisión'],expected:{type:'ordering',correct_order:[2,0,1]},explanation:'La revisión precede a la ley, que precede a la apertura.'};
 const service=createContentService({secret:'offline',client:{}});
 for(const answer of ['[2,0,1,0]','[2,0]','[2,0,0]','[2,0,9]','[2,0,1.5]','null','no json']){
  assert.throws(()=>validateOrderingAnswer(answer,payload.expected.correct_order),{status:400});
  await assert.rejects(service.evaluate(payload,answer),{status:400});
  await assert.rejects(require('./adaptive').evaluateAnswer({answer,enrichedContent:{expected_answer:payload.expected}}),{status:400});
 }
 const actual=await service.evaluate(payload,'[2,0,1]');assert.equal(actual.result,'correct');assert.equal(actual.feedbackDetails.length,3);
});
test('mathematics key is independently checked with integer arithmetic and the specified physical domain',()=>{
 assert.equal(120-15*8,0);assert.equal(120-15*0,120);
 for(let t=0;t<8;t++)assert.equal((120-15*(t+1))-(120-15*t),-15);
 assert.equal(36-6*4,12);assert.ok(36-6*4>=0);
});
