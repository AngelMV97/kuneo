const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inventory,hash,grades,overlap}=require('./reserveInventory');
const moduleRow={id:'m',title:'Huerta escolar',subject:'mathematics',grade_range:'4-5',learning_objective:'Interpretar fracciones',is_active:true};
const item=(id='s',extra={})=>({id,module_id:'m',step_order:1,content:{question:'En la huerta, 3 de 12 plantas son tomates. ¿Qué fracción representan?',options:['1/4','1/3','1/2']},enrichment_status:'completed',enriched_content:{expected_answer:{type:'option',correct_options:[0]},cognitive_dimension:'comprension'},...extra});
const snapshot=steps=>({data:{modules:[moduleRow],module_steps:steps,concept_cards:[],visual_templates:[]}});

test('inventory reconciles steps and nested question units without promoting enrichment to approval',()=>{
 const nested=item('nested',{enriched_content:{cognitive_dimension:'comprension',questions:[{id:'q1',text:'¿Cuál fracción corresponde a tres de doce plantas?',type:'option',options:['1/4','1/2'],expected_answer:{type:'option',correct_options:[0]}},{id:'q2',text:'¿Cuál fracción corresponde a seis de doce plantas?',type:'option',options:['1/4','1/2'],expected_answer:{type:'option',correct_options:[1]}}]}});
 const data=snapshot([item(),nested,item('base',{enrichment_status:'pending',enriched_content:null})]),before=hash(data);
 const report=inventory(data);
 assert.equal(report.summary.steps,3);assert.equal(report.summary.questions,4);assert.equal(report.summary.questionsInEnrichedArrays,2);
 assert.equal(report.summary.technicalCandidates,3);assert.equal(report.summary.approved,0);
 assert.equal(Object.values(report.summary.questionsByStatus).reduce((a,b)=>a+b,0),4);
 assert.equal(hash(data),before);assert.deepEqual(inventory(data),report);
 assert.equal(report.questions.find(q=>q.sourceQuestionId==='q2').stepId,'nested');
});

test('out of range keys, unsupported formats and unknown evaluation strategies are listed by source id',()=>{
 const invalid=item('invalid',{enriched_content:{expected_answer:{type:'option',correct_options:[9]},cognitive_dimension:'comprension'}});
 const drawing=item('drawing',{enriched_content:{expected_answer:{type:'drawing'},cognitive_dimension:'representacion'}});
 const strategy=item('strategy',{enriched_content:{expected_answer:{type:'text',correct_text:'Una cuarta parte',evaluation_strategy:'classification'},cognitive_dimension:'razonamiento'}});
 const report=inventory(snapshot([invalid,drawing,strategy]));
 assert(report.questions.find(q=>q.stepId==='invalid').issueCodes.includes('CHOICE_KEY_OUT_OF_RANGE'));
 assert(report.questions.find(q=>q.stepId==='drawing').issueCodes.includes('UNSUPPORTED_QUESTION_FORMAT'));
 assert(report.questions.find(q=>q.stepId==='strategy').issueCodes.includes('UNKNOWN_EVALUATOR'));
 assert.equal(report.summary.technicalCandidates,0);
});

test('placeholder options block selection, while irrelevant unused options do not block open questions',()=>{
 const base=item('selection',{content:{question:'Selecciona una respuesta para el problema de la huerta.',options:['Opción A','Opción B']}});
 const open=item('open',{content:base.content,enriched_content:{type:'text',question:'Explica cómo comprobarías que tres de doce es una cuarta parte.',expected_answer:{type:'rubric',answer:'Relaciona las cantidades.',rubric:'Comprueba la relación con una operación.'},cognitive_dimension:'metacognicion'}});
 const report=inventory(snapshot([base,open]));
 assert.equal(report.questions.find(q=>q.stepId==='selection').status,'exclude_recommended');
 const q=report.questions.find(q=>q.stepId==='open');assert(!q.issueCodes.includes('PLACEHOLDER_OPTIONS'));assert(q.technicalCandidate);
});

test('completed flags without data, broken material links and unsupported renderers remain findings only',()=>{
 const data=snapshot([item('empty',{enriched_content:null,concept_card_id:'missing',visual_template_key:'unknown'})]);
 data.data.visual_templates=[{id:'v',template_key:'v',renderer:'react_flow',config:{},enrichment_status:'completed',enriched_config:{}}];
 const report=inventory(data);
 assert(report.issues.some(i=>i.id==='empty'&&i.code==='COMPLETED_WITHOUT_CONTENT'));
 assert(report.issues.some(i=>i.code==='BROKEN_CONCEPT_CARD_ID'));
 assert(report.issues.some(i=>i.code==='BROKEN_VISUAL_TEMPLATE_KEY'));
 assert.equal(report.visuals[0].status,'technical_failure');
 assert.equal(data.data.visual_templates[0].renderer,'react_flow');
});

test('implicit dimensions, invalid numeric references and non-permutation ordering are not certified',()=>{
 const numeric=item('number',{enriched_content:{type:'numeric',expected_answer:{type:'numeric',correct_value:null}}});
 const order=item('order',{enriched_content:{type:'ordering',items:['Primero','Después'],expected_answer:{type:'ordering',correct_order:[0,0]},cognitive_dimension:'transferencia'}});
 const report=inventory(snapshot([numeric,order]));
 assert(report.questions.find(q=>q.stepId==='number').issueCodes.includes('INVALID_NUMERIC_KEY'));
 assert(report.questions.find(q=>q.stepId==='number').issueCodes.includes('DIMENSION_IMPLICIT_COMPREHENSION'));
 assert(report.questions.find(q=>q.stepId==='order').issueCodes.includes('INVALID_ORDER_KEY'));
 assert.equal(report.summary.approved,0);
});

test('duplicate groups preserve every id, and grade coverage cannot invent missing audit cells',()=>{
 const report=inventory(snapshot([item('one'),item('two')]));
 assert.equal(report.duplicates.filter(g=>g.kind==='exact_content').length,1);
 assert.equal(report.duplicates.find(g=>g.kind==='exact_content').questionIds.length,2);
 assert.equal(report.reviewPlan.filter(p=>p.round===2&&p.subject==='english').every(p=>p.gap&&p.selected===null),true);
 const selected=report.reviewPlan.filter(p=>p.round===2&&p.selected).map(p=>p.selected.questionId);
 assert.equal(new Set(selected).size,selected.length);
 assert.deepEqual(grades('3-5'),[3,4,5]);assert(overlap('3-5','1-3'));assert(!overlap('3-5','6-7'));assert.deepEqual(grades('12'),[]);
});

test('content hashes ignore object-key ordering but change with an edited answer key',()=>{
 assert.equal(hash({a:1,b:2}),hash({b:2,a:1}));
 const original=inventory(snapshot([item()]));
 const edited=inventory(snapshot([item('s',{enriched_content:{expected_answer:{type:'option',correct_options:[1]},cognitive_dimension:'comprension'}})]));
 assert.notEqual(original.questions[0].sourceSha256,edited.questions[0].sourceSha256);
 assert.notEqual(original.questions[0].questionSha256,edited.questions[0].questionSha256);
});
