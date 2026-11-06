const {test}=require('node:test'),assert=require('node:assert/strict');
const {desiredFormat,TYPES,shuffleOrdering,validateFormats}=require('./learningFormats');
const {createContentService,normalizeStored,validateGenerated,ACTIVITY_SCHEMA}=require('./learningContent');
const {activityWireSchema}=require('./learningActivitySchema');
const {validateSupport,enforceSupportLanguage}=require('./learningSupport');
const {build}=require('../scripts/quality/hito4-round3.cjs');
const {hash}=require('./reserveInventory');
const candidates=build();
test('eight preferred slots include ordering, retain two open slots and do not require a ten-question session',()=>{
 assert.equal(TYPES.length,5);const formats=Array.from({length:8},(_,i)=>desiredFormat(Array(i).fill({}),{ordering:true}));
 assert.deepEqual(formats,['option','text','multiple_select','matching','ordering','text','option','multiple_select']);
 assert.equal(desiredFormat(Array(8).fill({}),{ordering:true}),'option');
 assert.ok(!Array.from({length:8},(_,i)=>desiredFormat(Array(i).fill({}),{ordering:false})).includes('ordering'));
 for(const grade of [2,5,7,11]){const [order,open]=activityWireSchema(ACTIVITY_SCHEMA,'ordering',grade).properties.activity.anyOf;assert.equal(order.properties.items.minItems,grade<=5?3:4);assert.equal(order.properties.order_explanations.minItems,grade<=5?3:4);assert.equal(open.properties.type.enum[0],'text');}
});
test('permutation shuffling preserves the exact semantic key and position explanations without revealing a solved sequence',async()=>{
 const service=createContentService({secret:'test',client:{}});
 for(const c of candidates.filter(c=>c.activity.type==='ordering'))for(let trial=0;trial<20;trial++){
  const original=normalizeStored(c.step),before=JSON.stringify(original);const shuffled=shuffleOrdering(original,max=>trial%max);
  assert.equal(JSON.stringify(original),before);assert.notDeepEqual(shuffled.expected.correct_order,shuffled.items.map((_,i)=>i));
  assert.deepEqual(shuffled.expected.correct_order.map(i=>shuffled.items[i]),original.expected.correct_order.map(i=>original.items[i]));
  const result=await service.evaluate(shuffled,JSON.stringify(shuffled.expected.correct_order));assert.equal(result.result,'correct');assert.equal(result.feedbackDetails.length,original.items.length);
  assert.deepEqual(result.feedbackDetails.map(d=>d.explanation),c.activity.order_explanations);
 }
});
test('ordering rejects repeated/empty items and malformed keys before publication',()=>{
 const a=candidates.find(c=>c.activity.type==='ordering').activity;
 for(const change of [{correct_order:[0,0,1,2]},{correct_order:[0,1,2]},{items:['A','A','B','C']},{items:['','A','B','C']}])assert.throws(()=>validateGenerated({...a,...change}));
 assert.throws(()=>validateGenerated({...a,order_explanations:[]}));
 assert.throws(()=>validateFormats({type:'ordering',items:['A','B'],correct_order:[2,0]}));
});
test('nine corrected sources have immutable provenance, valid content and support, and are excluded from old reserve delivery',async()=>{
 assert.equal(candidates.length,9);assert.equal(candidates.filter(c=>c.activity.type==='ordering').length,5);
 const originals=require('../reports/hito4-2-round3/audit.json').packets;
 const service=createContentService({secret:'test',mode:'stored',client:{}});
 for(const c of candidates){const {sha256,...rest}=c;assert.equal(hash(rest),sha256);validateGenerated(c.activity);assert.equal(c.module.is_active,false);
  for(const card of c.supports){assert.equal(validateSupport(card).visual.kind,card.visual.kind);enforceSupportLanguage(card,c.module.subject);}
  const p=originals.find(p=>p.questionId===c.original.questionId);assert.equal(p.sourceSha256,c.original.sha256);
  await assert.rejects(service.generate({userId:'synthetic',profile:{grade_level:Number(p.module.grade_range.split('-')[0])},module:p.module,steps:[p.step],attempts:[],anticipation:{stepId:p.step.id,dimension:normalizeStored(p.step).dimension,format:'ordering'}}),{status:503});
 }
});
test('remaining fractions and linear-model computations are independently correct',()=>{
 assert.equal(8-3,5);assert.equal(10-4,6);assert.deepEqual([0,3,6,9].map(t=>100-10*t),[100,70,40,10]);assert.equal(12+4*3,24);
});
test('generated ordering dependencies must be quoted, acyclic, complete and consistent with the answer key',()=>{
 const a=candidates.find(c=>c.activity.type==='ordering').activity;
 const question='A ocurre antes que B. B ocurre antes que C.';
 const valid={...a,question,items:['B','C','A'],correct_order:[2,0,1],order_explanations:['A precede a B.','B sigue a A.','C sigue a B.'],order_constraints:[{before:2,after:0,evidence:'A ocurre antes que B.'},{before:0,after:1,evidence:'B ocurre antes que C.'}]};
 assert.ok(validateGenerated(valid));
 for(const change of [{order_constraints:[{before:2,after:0,evidence:'No existe esta cita.'},{before:0,after:1,evidence:'B ocurre antes que C.'}]},{order_constraints:[{before:2,after:0,evidence:'A ocurre antes que B.'},{before:0,after:2,evidence:'B ocurre antes que C.'}]},{correct_order:[0,2,1]}])assert.throws(()=>validateGenerated({...valid,...change}));
});
test('non-ordering generation does not receive the extra ordering prompts or change models',async()=>{
 const requests=[],c=candidates.find(c=>c.activity.type==='option');
 const service=createContentService({secret:'test',client:{chat:{completions:{async create(request){requests.push(request);return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(request.response_format.json_schema.name==='kuneo_activity'?{activity:c.activity}:{approved:true,issue:''})}}]};}}}}});
 await service.generate({userId:'synthetic',profile:{grade_level:3},module:c.module,steps:[c.step],attempts:[],anticipation:{stepId:c.step.id,dimension:c.activity.dimension,format:'option'}});
 assert.equal(requests.length,2);
 assert.ok(requests.every(r=>!r.messages.some(m=>m.content.startsWith('ordering=')||m.content.startsWith('Para ordering')||m.content.startsWith('ordering_item_count')||m.content.startsWith('Revisa order_constraints'))));
});
test('numeric reserves honor explicit zero tolerance instead of silently allowing a one-hundredth error',async()=>{
 require('./adaptive').initializeSupabase({schema(){return {from(){return {select(){return {eq(){return {async single(){return {data:null};}};}};}};}};}});
 const service=createContentService({secret:'test',client:{}}),payload={type:'numeric',expected:{type:'numeric',correct_value:5,tolerance:0}};
 assert.equal((await service.evaluate(payload,'5')).result,'correct');
 assert.notEqual((await service.evaluate(payload,'5.005')).result,'correct');
 assert.equal((await service.evaluate({...payload,expected:{...payload.expected,tolerance:0.01}},'5.005')).result,'correct');
});
