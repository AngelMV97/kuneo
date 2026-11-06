const {test}=require('node:test'),assert=require('node:assert/strict');
const {variationPlan}=require('./learningVariety');
const {createContentService}=require('./learningContent');
const subjects=['mathematics','language','natural_sciences','social_studies','english'];
const old='Tres vasos con agua pura, azúcar y aceite quedan al sol. ¿Por qué baja el nivel a ritmos diferentes?';
const item={type:'text',question:'En un caso simulado del colegio, compara dos observaciones distintas y explica qué evidencia necesitas para comprobar la conclusión.',options:[],expected_text:'Comparar datos bajo condiciones controladas.',rubric:'Usa evidencia y reconoce las condiciones de comparación.',hint:'Identifica qué cambió y qué se mantuvo igual.',explanation:'Una comparación requiere condiciones conocidas.'};
test('eight context suggestions vary across all subjects while task guidance follows the cognitive dimension',()=>{
 for(const subject of subjects){assert.equal(new Set(Array.from({length:8},(_,i)=>variationPlan(subject,'comprension',i).suggested_context)).size,8);assert.notEqual(variationPlan(subject,'comprension',0).task,variationPlan(subject,'metacognicion',0).task);}
});
test('lookahead exclusions reach generation and semantic review without invented learner evidence or additional model calls',async()=>{
 for(const subject of subjects){let calls=0;const contexts=[];
 const client={chat:{completions:{create:async request=>{calls++;const review=request.response_format.json_schema.name==='kuneo_activity_review',context=JSON.parse(request.messages.at(-1).content);contexts.push({review,context});return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(review?{approved:true,issue:'',verification:'Otro caso y otra operación de pensamiento.'}:item)}}]};}}}};
 const service=createContentService({secret:'variety',client});const module={id:subject,subject,title:'Objetivo de prueba',learning_objective:'Objetivo curricular de prueba',grade_range:'6-7'},step={id:'step-'+subject,module_id:subject,step_order:1,content:{prompt:'Objetivo curricular'}};
 const attempt={attempt_id:'saved',module_id:subject,step_id:step.id,result:'partial',cognitive_dimension:'comprension',hint_requests:0,answer:JSON.stringify({kuneo_activity_version:1,question:'Una pregunta anterior completa.',submitted_answer:'Mi respuesta guardada'})};
 const result=await service.generate({userId:'synthetic',profile:{grade_level:7},module,steps:[step],attempts:[attempt],anticipation:{stepId:step.id,dimension:'representacion',format:'text',avoidQuestion:old}});
 assert.equal(calls,2);assert.equal(result.activity.source,'generated');
 const generated=contexts[0].context,reviewed=contexts[1].context;
 assert.ok(generated.avoid_questions.includes(old));assert.ok(reviewed.previous_questions.includes(old));assert.ok(reviewed.previous_questions.includes('Una pregunta anterior completa.'));
 assert.equal(generated.recent.length,1);assert.equal(generated.recent[0].answer,'Mi respuesta guardada');assert.deepEqual(generated.variety,variationPlan(subject,'representacion',2));
 }
});
test('semantic repetition rejection repairs before delivery and preserves the previous question as exclusion',async()=>{
 let generations=0,reviews=0;const client={chat:{completions:{create:async request=>{const review=request.response_format.json_schema.name==='kuneo_activity_review';if(review)reviews++;else generations++;
 return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(review?{approved:reviews>1,issue:reviews===1?'Repite el experimento de vasos; evalúa otra evidencia del mismo objetivo.':'',verification:'Comparación de planteamientos realizada.'}:{...item,question:generations===1?old:item.question})}}]};}}}};
 const service=createContentService({secret:'variety',client});const module={id:'science',subject:'natural_sciences',grade_range:'6-7',learning_objective:'Contrastar hipótesis con observaciones'},step={id:'step-science',module_id:'science',step_order:1,content:{}};
 // A semantically repeated, non-identical version is rejected by the reviewer.
 const result=await service.generate({userId:'synthetic',profile:{grade_level:7},module,steps:[step],attempts:[],anticipation:{stepId:step.id,dimension:'razonamiento',format:'text',avoidQuestion:old+' Usa una tabla.'}});
 assert.equal(generations,2);assert.equal(reviews,2);assert.equal(result.activity.question,item.question);
});
test('a generation failure cannot reissue a previously answered approved reserve',async()=>{
 let fail=false;const client={chat:{completions:{create:async request=>{if(fail)throw Error('offline');return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(request.response_format.json_schema.name==='kuneo_activity_review'?{approved:true,issue:''}:item)}}]};}}}};
 const service=createContentService({secret:'reserve-variety',client}),module={id:'reserve-variety',subject:'language',grade_range:'6-7',learning_objective:'Interpretar evidencia de un texto'},step={id:'reserve-variety-step',module_id:module.id,step_order:1,content:{}};
 const input={userId:'synthetic',profile:{grade_level:7},module,steps:[step],attempts:[],anticipation:{stepId:step.id,dimension:'comprension',format:'text'}};
 const first=await service.generate(input);fail=true;
 // Lookahead has no fabricated answer, but excludes the already visible activity.
 await assert.rejects(service.generate({...input,anticipation:{...input.anticipation,avoidQuestion:first.activity.question}}),error=>error.status===503);
});
test('computed primary sums do not recycle the same reading-day scenario in another activity',async()=>{
 let calls=0;const client={chat:{completions:{create:async request=>{calls++;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(request.response_format.json_schema.name==='kuneo_activity_review'?{approved:true,issue:''}:item)}}]};}}}};
 const service=createContentService({secret:'computed-variety',client}),module={id:'sums',subject:'mathematics',grade_range:'1-3',learning_objective:'Sumar cantidades enteras'},step={id:'sums-step',module_id:'sums',step_order:1,content:{}};
 const input={userId:'synthetic',profile:{grade_level:3},module,steps:[step],attempts:[],anticipation:{stepId:step.id,dimension:'comprension',format:'matching'}};
 const first=await service.generate(input);assert.equal(first.activity.source,'computed');assert.equal(calls,0);
 const second=await service.generate({...input,anticipation:{...input.anticipation,avoidQuestion:first.activity.question}});assert.equal(second.activity.source,'generated');assert.notEqual(second.activity.question,first.activity.question);assert.equal(calls,2);
});
