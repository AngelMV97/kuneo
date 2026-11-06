const {test}=require('node:test'),assert=require('node:assert/strict');
const {build}=require('../scripts/quality/hito4-round6.cjs'),{check}=require('../scripts/quality/hito4-round6-check.cjs');
const {normalizeStored,createContentService}=require('./learningContent');
test('round six preserves eight sources and verifies 32 real criterion evaluations',()=>{const r=check();assert.equal(r.live.results.length,32);for(const c of r.candidates){assert.equal(c.status,'candidate_not_published');assert.equal(c.step.concept_card_id,null);assert.equal(c.step.visual_template_key,null);}});
test('eight defective exact-text reserves cannot be delivered',async()=>{
 const service=createContentService({secret:'round6',mode:'stored',client:{}});
 for(const p of require('../reports/hito4-2-round6/audit.json').packets){const a=normalizeStored(p.step);await assert.rejects(service.generate({userId:'synthetic',profile:{grade_level:Number(p.module.grade_range.split('-').at(-1))},module:p.module,steps:[p.step],attempts:[],anticipation:{stepId:p.step.id,dimension:a.dimension,format:a.type}}),{status:503});}
});
test('fragment references preserve exact student text and repair evidence only once',async()=>{
 const payload=normalizeStored(build()[2].step),answer='Los papeles igual de grandes; comparo cuánta agua queda.';let requests=[];
 const make=alwaysBad=>createContentService({secret:'round6',client:{chat:{completions:{async create(input,options){requests.push({input,options});const bad=alwaysBad||requests.length===1;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({checks:payload.expected.criteria.map((c,i)=>({id:c.id,met:true,evidence:[bad?'S999':`S${i+1}`]})),feedback:'Mantienes el tamaño y comparas el agua restante.'})}}]};}}}}});
 assert.equal((await make(false).evaluate(payload,answer)).result,'correct');assert.equal(requests.length,2);
 const data=JSON.parse(requests[0].input.messages.at(-1).content);assert.deepEqual(data.response_fragments,[{id:'S1',text:'Los papeles igual de grandes;'},{id:'S2',text:'comparo cuánta agua queda.'}]);assert.equal(data.student_response,answer);
 for(const r of requests){assert.equal(r.options.maxRetries,0);assert.ok(r.options.timeout>0&&r.options.timeout<=12000);}
 requests=[];await assert.rejects(make(true).evaluate(payload,answer),{status:503});assert.equal(requests.length,2);
});
