const {test}=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('../scripts/quality/hito4-round2-repairs.cjs');
const {normalizeStored,validateGenerated,createContentService}=require('./learningContent');
const {validateSupport,enforceSupportLanguage,enforceScienceClaims}=require('./learningSupport');
const {hash}=require('./reserveInventory');
const data=build();
test('second round has thirteen unique versioned corrections and preserves nine genuine coverage gaps',()=>{
 assert.equal(data.length,13);assert.equal(new Set(data.map(c=>c.original.questionId)).size,13);
 const cells=require('../reports/hito4-1/audit-queue.json').rounds.filter(c=>c.round===2);
 assert.equal(cells.length,25);assert.equal(cells.filter(c=>c.gap).length,9);
 for(const c of data){const {sha256,...rest}=c;assert.equal(hash(rest),sha256);assert.equal(c.module.is_active,false);assert.equal(c.status,'candidate_not_published');validateGenerated(structuredClone(c.activity));
  const normalized=normalizeStored(c.step);assert.ok(normalized);assert.equal(normalized.explanation,c.activity.explanation);assert.deepEqual(normalized.option_explanations,c.activity.option_explanations);assert.deepEqual(normalized.pair_explanations,c.activity.pair_explanations);
  assert.equal(c.supports.length,2);for(const card of c.supports){assert.equal(validateSupport(card).visual.kind,card.visual.kind);enforceSupportLanguage(card,c.module.subject);enforceScienceClaims(card,c.module.subject);assert.ok(!card.example_result.includes('|'));}
 }
});
test('second-round closed keys, distractors and feedback pass the real evaluator without model calls',async()=>{
 const service=createContentService({secret:'test',client:{chat:{completions:{create(){throw Error('Unexpected model call');}}}}});
 for(const c of data.filter(c=>c.activity.type!=='text'))for(const [answer,expected]of c.checks){const actual=await service.evaluate(normalizeStored(c.step),answer);assert.equal(actual.result,expected,c.module.title);assert.ok(actual.feedback);assert.ok(actual.feedbackDetails.every(d=>d.explanation));}
});
test('all thirteen original second-round sources are quarantined in the delivery path',async()=>{
 const service=createContentService({secret:'test',mode:'stored',client:{}});
 const audit=require('../reports/hito4-2-round2/audit.json');const quarantine=require('./reserveQuarantineRound2.json');assert.equal(quarantine.steps.length,13);
 for(const p of audit.packets){assert.ok(quarantine.steps.some(s=>s.id===p.step.id&&s.sourceSha256===p.sourceSha256));await assert.rejects(service.generate({userId:'synthetic',profile:{grade_level:Number(p.module.grade_range.split('-')[0])},module:p.module,steps:[p.step],attempts:[],anticipation:{stepId:p.step.id,dimension:p.activity.dimension,format:'option'}}),{status:503});}
});
test('fraction correction keeps the independently correct original key and explains each alternative',()=>{
 const c=data.find(c=>c.module.grade_range==='4-5'&&c.module.subject==='mathematics');assert.equal(c.activity.correct_index,0);assert.equal(c.activity.options[0],'1/4');assert.equal(1*4,4*1);assert.equal(c.activity.option_explanations.length,4);
 const e=data.find(c=>c.module.grade_range==='3'&&c.module.subject==='mathematics').supports[1];assert.ok(e.example_result.includes('2/6'));assert.equal(2*3,6*1);
});
test('rubric evaluation separates student response from reference and never asks the model to infer missing student statements',async()=>{
 let request;
 const service=createContentService({secret:'test',client:{chat:{completions:{async create(input){request=input;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({checks:['total','taken','equality'].map(id=>({id,met:false,evidence:[]})),feedback:'Explica qué representan las cantidades.'})}}]};}}}}});
 const c=data.find(c=>c.activity.type==='text');
 await service.evaluate(normalizeStored(c.step),'parte todo dividir porción');
 const input=JSON.parse(request.messages.at(-1).content);
 assert.equal(input.student_response,'parte todo dividir porción');assert.equal(input.reference_answer,c.activity.expected_text);assert.ok(!Object.hasOwn(input,'answer'));assert.ok(!Object.hasOwn(input,'expected'));assert.ok(request.messages.some(m=>m.content.includes('un mismo fragmento puede cumplir varios criterios')));
});
test('criterion grading aggregates evidence and rejects fabricated, duplicate or missing checks',async()=>{
 const c=data.find(c=>c.activity.type==='text'),payload=normalizeStored(c.step);
 const answer=c.checks[2][0];
 const checks=[{id:'total',met:false,evidence:[]},{id:'taken',met:true,evidence:[answer]},{id:'equality',met:false,evidence:[]}];
 const make=value=>createContentService({secret:'test',client:{chat:{completions:{async create(){return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({checks:value,feedback:'Identificas la parte tomada; explica las demás partes.'})}}]};}}}}});
 assert.equal((await make(checks).evaluate(payload,answer)).result,'partial');
 for(const value of [[...checks.slice(0,2)],checks.map(k=>({...k,id:'taken'})),checks.map(k=>k.met?{...k,evidence:['Texto que solo está en una referencia y no escribió el alumno.']}:k),checks.map(k=>k.met?{...k,evidence:[]}:k)])await assert.rejects(make(value).evaluate(payload,answer),{status:503});
});
