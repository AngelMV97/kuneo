const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cleanActivityPresentation:clean}=require('./learningPresentation');
const {validateGenerated,normalizeStored,createContentService}=require('./learningContent');
const context='En una actividad del colegio se registran estos datos:';
const data='| Grupo | Observación |\n| --- | --- |\n| 1 | Aumenta |\n| 2 | Disminuye |';
const instruction='Selecciona las afirmaciones que corresponden a los datos.';
const options=['El primer grupo aumenta.','El segundo grupo disminuye.','Ambos grupos aumentan.'];
const question=[context,data,instruction].join('\n\n');
function activity(extra={}){return {type:'multiple_select',question,options,correct_indices:[0,1],hint:'Compara las observaciones.',rubric:'Contrasta cada afirmación con los datos.',explanation:'Los grupos tienen comportamientos diferentes.',option_explanations:['El grupo 1 aumenta.','El grupo 2 disminuye.','El grupo 2 no aumenta.'],...extra};}
test('separates exact A/B/C alternatives, wrapped lines, Markdown labels and bullet lists from required data',()=>{
 for(const separator of ['\n','\n\n'])for(const label of [(i)=>`${String.fromCharCode(65+i)}. `,(i)=>`**${String.fromCharCode(65+i)}.** `,(i)=>`${i+1}) `,()=>'- ']){
  const raw=activity({question:question+'\n\n'+options.map((s,i)=>label(i)+s).join(separator)}),before=JSON.stringify(raw);
  const fixed=clean(raw);assert.equal(fixed.question,question);assert.equal(JSON.stringify(raw),before);assert.deepEqual(fixed.correct_indices,[0,1]);assert.equal(clean(fixed),fixed);
 }
 const wrapped=activity({question:question+'\n\nA. El primer grupo\naumenta.\nB. El segundo grupo\ndisminuye.\nC. Ambos grupos aumentan.'});assert.equal(clean(wrapped).question,question);
 assert.equal(clean(activity({question:question+'\n'+options.map((s,i)=>`${i+1}. ${s}`).join('\n')})).question,question);
});
test('removes only response tables, preserves observation and reading tables',()=>{
 const right=['El primer grupo aumenta.','El segundo grupo disminuye.'];
 const a={type:'matching',question:question+'\n\n| Hipótesis sobre los datos |\n| --- |\n| A. '+right[0]+' |\n| B. '+right[1]+' |',left_items:['Grupo 1','Grupo 2'],right_items:right,expected:{correct_pairs:[[0,0],[1,1]]}};
 assert.equal(clean(a).question,question);assert.deepEqual(clean(a).expected,a.expected);
 for(const table of ['| Observaciones |\n| --- |\n| '+right[0]+' |\n| '+right[1]+' |','| Hipótesis | Grupo |\n| --- | --- |\n| '+right[0]+' | 1 |\n| '+right[1]+' | 2 |'])assert.equal(clean({...a,question:question+'\n\n'+table}).question,question+'\n\n'+table);
});
test('leaves embedded mentions, partial lists, quotes and unlabelled passages untouched',()=>{
 for(const suffix of [options.join('\n\n'),'En la lectura se afirma: '+options.join(' '),'> A. '+options[0]+'\n> B. '+options[1],'A. '+options[0]+'\nB. Otra afirmación diferente.']){
  const a=activity({question:question+'\n\n'+suffix});assert.equal(clean(a),a);
 }
 const a=activity({question:question+'\n\nOpciones:\n\n'+options.join('\n\n')});assert.equal(clean(a).question,question);
 const open={...a,type:'text'};assert.equal(clean(open),open);
 assert.throws(()=>clean(activity({question:options.map((s,i)=>`${i+1}. ${s}`).join('\n')})),/falta el enunciado/);
});
test('generated and stored activities use the same corrected question with unchanged answer keys',async()=>{
 const raw=activity({question:question+'\n\n'+options.map((s,i)=>`${String.fromCharCode(65+i)}. ${s}`).join('\n\n')});
 const generated=validateGenerated(raw);assert.equal(generated.question,question);
 const step={content:{},enriched_content:{questions:[{...raw,expected_answer:{type:'multiple_select',correct_options:[0,1]}}]}};
 const stored=normalizeStored(step);assert.equal(stored.question,question);
 const service=createContentService({secret:'offline',client:{}});
 assert.equal((await service.evaluate(stored,'[0,1]')).result,'correct');
 assert.notEqual((await service.evaluate(stored,'[2]')).result,'correct');
});
test('review, sealed token and delivery agree, with no extra generation calls',async()=>{
 const raw=activity({type:'option',correct_index:0,question:question+'\n\n'+options.map((s,i)=>`${i+1}. ${s}`).join('\n')});let calls=0,reviewed;
 const client={chat:{completions:{create:async input=>{calls++;const review=input.response_format.json_schema.name==='kuneo_activity_review';if(review)reviewed=JSON.parse(input.messages.at(-1).content).activity;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(review?{approved:true,issue:'',verification:'Datos contrastados.'}:raw)}}]};}}}};
 const service=createContentService({secret:'offline-duplicates',client});
 const delivered=await service.generate({userId:'presentation-test',profile:{grade_level:5},module:{id:'presentation-module',subject:'mathematics',grade_range:'4-5',title:'Datos',learning_objective:'Comparar observaciones'},steps:[{id:'presentation-step',module_id:'presentation-module',step_order:1,content:{}}],attempts:[]});
 assert.equal(calls,2);assert.equal(reviewed.question,question);assert.equal(delivered.activity.question,question);
 const payload=require('./learningContent').unseal(delivered.token,'offline-duplicates','presentation-test');assert.equal(payload.question,question);assert.deepEqual(payload.expected.correct_options,[0]);
});
