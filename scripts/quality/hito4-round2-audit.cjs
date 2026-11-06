const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {hash}=require('../../server/reserveInventory');
const {normalizeStored,createContentService}=require('../../server/learningContent');
const snapshot=require('../../reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json');
const queue=require('../../reports/hito4-1/audit-queue.json');
const pilot=require('../../reports/hito4-2/pilot.json');
const repairs=require('./hito4-round2-repairs.cjs').build();
const notes={
 '00000000-0000-0000-0001-000000000001':['La definición carece de rúbrica semántica; se premian dos palabras sin explicación.','La asociación solo existe en claves anidadas, no en IDs resueltos por el flujo actual.'],
 '00000000-0000-0000-0001-000000000002':['La pregunta y la clave 1/4 son correctas por cálculo independiente.','Falta feedback explicativo normalizado y por distractor; se conserva el problema en el candidato con ese detalle corregido.','La tercera pista revela la clave, pero no se afirma que el flujo actual la publique.'],
 '2763c723-9a3b-482d-b775-393deb4195cd':['Reflexión sin lectura ni experiencia delimitada; falta insumo para verificar una inferencia.','La referencia es una instrucción docente calificada como texto exacto; se ignoran scaffolding_hints.','Objetivo de oralidad y actividad escrita no equivalentes; se delimita el objetivo del candidato.'],
 '0dfed78f-259c-4126-b9db-18cfe0890226':['Pregunta genérica de funcionamiento sin noticia o texto para clasificar información.','Evaluación por palabras clave, referencias ficticias, tarjeta de 1–3 para grado 7.'],
 '00769650-eb2c-458a-8307-bcd5cdbccf14':['Pide razonamiento inferencial sin discurso, autor o contexto.','Evalúa vocabulario literal; referencias ficticias y tarjeta de grado 1 para grado 8.'],
 '05134c5d-81ef-4ba3-bfb1-c4cc89b90fc0':['Objetivo de comparar textos, pero no hay textos y se pregunta cómo funciona la argumentación.','Palabras clave no demuestran comparación; tarjeta de grado 10 no prueba adecuación a 11.'],
 '6eeffe1c-30c4-47ba-b1ab-6f474302aab0':['No proporciona la situación nueva que exige aplicar.','Referencia docente calificada como texto exacto; formato anunciado de elección, adaptado a texto; opciones A–D sin significado.'],
 '34bb219f-4504-45e5-a6bd-ad8e21e8878e':['La clave 0,2,3 es razonable para la pregunta enriquecida sobre grupos organizados.','El prompt base pide elementos de un texto inexistente; el flujo actual prioriza la pregunta enriquecida, así que no se atribuye ese fallo a lo mostrado actualmente.','Contexto, hint y explicación anidados no pasan al contrato mostrado; sin justificaciones específicas.'],
 'cce00551-48dc-43c8-adb6-d24e4756829c':['Cronología universal sin lugares ni fechas: afirma agricultura antes de domesticación de animales. Hay evidencia de perros preagrícolas; no es una regla universal válida.','Las pistas presentan agricultura antes de toda aldea como necesidad; no hay contexto regional que permita verificar esa secuencia.','Objetivo espacial de 4–5 no corresponde a cronología; la tercera pista da la clave completa.'],
 '316df857-26a5-4c63-ac42-ea2352e5cc79':['Empareja cada práctica histórica con una justificación exclusiva sin fuentes/territorio/época. Las categorías pueden solaparse; se elimina la atribución histórica absoluta.','El contexto matizado está en un campo no mostrado; pregunta y clave solos no establecen unicidad.','Objetivo sobre corrientes del XIX mal asignado a 6–7; tarjeta grado 1; parejas ordenadas por posición.'],
 '007c1070-ff4d-4699-a528-d9a682cf52fd':['Pregunta sobre funcionamiento de sociedad sin caso ni hechos históricos.','Una enumeración de términos no establece relaciones sociales; tarjeta de grado 1 para 8–9.'],
 '171d2e82-5d8d-47a9-968e-32753ac094ad':['Se pide detectar un error sin incluir el razonamiento.','El objetivo remite a estos modelos sin nombrarlos y la referencia se convierte a coincidencia exacta.','Tarjeta grado 1 para 10–11, opciones base sin contenido y visual sin caso correspondiente.'],
 '06bda105-633d-4b1d-bddb-0f9021b293f4':['Pregunta genérica en español sobre english_communication sin material lingüístico en inglés.','Palabras clave españolas permiten acierto sin uso del idioma. La tarjeta presenta saludos españoles como ejemplo de inglés.']
};
async function main(){
 assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(snapshot.data)).digest('hex'),snapshot.sha256);
 const result={snapshotSha256:snapshot.sha256,scope:'Second-round 25 planned cells; no catalogue-wide certification',cells:[],packets:[],tests:[],modelCalls:0,databaseCalls:0};
 require('../../server/adaptive').initializeSupabase({schema(name){assert.equal(name,'kuneo');return {from(name){assert.equal(name,'module_steps');return {select(name){assert.equal(name,'cognitive_dimension');return {eq(name,id){assert.equal(name,'id');assert.equal(id,undefined);return {async single(){return {data:null};}};}};}};}};}});
 const service=createContentService({secret:'offline-round2',client:{chat:{completions:{create(){throw Error('Model calls forbidden');}}}}});
 for(const cell of queue.rounds.filter(c=>c.round===2)){
  if(!cell.selected){result.cells.push({...cell,state:'coverage_gap'});continue;}
  const prior=pilot.packets.find(p=>p.questionId===cell.selected.questionId);
  if(prior){result.cells.push({...cell,state:'pilot_reused_not_new',evidence:'reports/hito4-3-pilot'});continue;}
  const step=snapshot.data.module_steps.find(s=>s.id===cell.selected.stepId),module=snapshot.data.modules.find(m=>m.id===step.module_id);
  assert.equal(hash({stepContent:step.content,enriched:step.enriched_content}),cell.selected.sha256);
  const card=snapshot.data.concept_cards.find(c=>c.id===step.concept_card_id)||null;
  const key=step.visual_template_key||step.enriched_content?.step_config?.visual_template_key;
  const visual=snapshot.data.visual_templates.find(v=>v.template_key===key)||null;
  const activity=normalizeStored(step),repair=repairs.find(c=>c.original.questionId===cell.selected.questionId);
  assert.ok(activity);assert.ok(repair);assert.ok(notes[step.id]);
  const packet={questionId:cell.selected.questionId,sourceSha256:cell.selected.sha256,module,step,card,visual,associationHashes:{module:hash(module),card:hash(card),visual:hash(visual)},activity,findings:notes[step.id],repairSha256:repair.sha256,disposition:'replacement_prepared_unpublished'};
  result.packets.push(packet);result.cells.push({...cell,state:'audited_replacement_prepared',repairSha256:repair.sha256});
  const expected=activity.expected;
  const cases=expected.evaluation_strategy==='keywords'?[{answer:(expected.keywords||expected.required_keywords).join(' '),reason:'Keyword enumeration; no explanatory evidence'}]:expected.type==='exact_text'?[{answer:expected.answer,reason:'Reference copy, not proof of solving the missing task'},{answer:'Una explicación alternativa justificada con los datos del caso.',reason:'Different wording rejected; the original lacks a complete case'}]:activity.type==='option'?activity.options.map((_,i)=>({answer:String(i),reason:'Check each alternative against supplied data'})):activity.type==='multiple_select'?[{answer:JSON.stringify(expected.correct_options),reason:'Check stored selection'},{answer:'[1]',reason:'Tree is not an organization of people'}]:[{answer:JSON.stringify(expected.correct_pairs||expected.correct_order),reason:'Key-conformant only; historical uniqueness not certified'}];
  for(const item of cases)result.tests.push({questionId:packet.questionId,...item,actual:await service.evaluate(activity,item.answer)});
 }
 result.summary={plannedCells:result.cells.length,gaps:result.cells.filter(c=>c.state==='coverage_gap').length,reused:result.cells.filter(c=>c.state==='pilot_reused_not_new').length,newQuestions:result.packets.length,replacementCandidates:repairs.length,originalTests:result.tests.length,published:0};
 assert.deepEqual([result.summary.plannedCells,result.summary.gaps,result.summary.reused,result.summary.newQuestions],[25,9,3,13]);
 const folder=path.resolve(__dirname,'../../reports/hito4-2-round2');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'audit.json'),JSON.stringify(result,null,2)+'\n');
 if(process.argv.includes('--quarantine'))fs.writeFileSync(path.resolve(__dirname,'../../server/reserveQuarantineRound2.json'),JSON.stringify({version:1,report:'reports/hito4-2-round2/README.md',steps:result.packets.map(p=>({id:p.step.id,sourceSha256:p.sourceSha256,reason:p.findings[0]}))},null,2)+'\n');
 console.log(JSON.stringify(result.summary));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
