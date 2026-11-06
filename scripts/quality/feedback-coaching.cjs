// Synthetic OpenAI checks only: no users, database reads or writes.
require('dotenv').config({path:require('node:path').join(__dirname,'../../server/.env'),quiet:true});
const {randomUUID}=require('node:crypto');
const {createContentService}=require('../../server/learningContent');
const {writeFileSync}=require('node:fs');
const pilotPath=require('node:path').join(__dirname,'../../recovery/feedback-coaching-pilot.json');
const cases=[
 ['mathematics','Relacionar datos y tendencias','Interpreta tablas de horas de práctica y puntajes.',0],
 ['language','Interpretar un relato','Identifica causas y consecuencias usando evidencia de un relato proporcionado.',2],
 ['natural_sciences','Calor y cambios de estado','Relaciona observaciones de cambios de estado con transferencia de energía.',3],
 ['social_studies','Fuentes y perspectivas','Contrasta hechos y opiniones en fuentes breves proporcionadas.',0],
 ['english','Daily routines','Comprende expresiones en inglés sobre rutinas cotidianas.',2]
];
async function runCase([subject,title,objective,count]) {
 const service=createContentService({secret:'synthetic-local-probe'}), userId='synthetic-probe';
 const module={id:randomUUID(),subject,title,learning_objective:objective,core_concept:title};
 const step={id:randomUUID(),module_id:module.id,step_order:1,content:{objective}};
 const attempts=Array.from({length:count},()=>({result:'incorrect',cognitive_dimension:'comprension',step_id:step.id}));
 const started=Date.now();
 try {
  const activity=await service.generate({userId,profile:{grade_level:8},module,steps:[step],attempts});
  const payload=service.decode(activity.token,userId), generatedMs=Date.now()-started;
  if(!['option','multiple_select','matching'].includes(payload.type)) throw Error('Expected closed format');
  const correct=payload.type==='option'?String(payload.expected.correct_options[0]):JSON.stringify(payload.type==='matching'?payload.expected.correct_pairs:payload.expected.correct_options);
  const incorrect=payload.type==='option'?String((payload.expected.correct_options[0]+1)%payload.options.length):JSON.stringify(payload.type==='matching'?payload.expected.correct_pairs.map(([l,r])=>[l,(r+1)%payload.right_items.length]):[payload.options.findIndex((_,i)=>!payload.expected.correct_options.includes(i))]);
  const evidence=[];
  for(const answer of [correct,incorrect]) {
   const evaluation=await service.evaluate(payload,answer);
   if(!evaluation.feedbackDetails.every(d=>d.explanation)) throw Error('Missing specific explanations');
   evidence.push({attempt_id:randomUUID(),result:evaluation.result,cognitive_dimension:payload.dimension,hint_requests:0,time_on_task:40,answer:JSON.stringify({kuneo_activity_version:1,question:payload.question,question_type:payload.type,options:payload.options,left_items:payload.left_items,right_items:payload.right_items,submitted_answer:answer,learning_focus:payload.learning_focus,grade_group:payload.grade_group,feedback:evaluation.feedback,feedback_details:evaluation.feedbackDetails})});
  }
  const summary=await service.summarize(evidence,module);
  return {subject,ok:true,type:payload.type,generatedMs,results:evidence.map(a=>a.result),question:payload.question,feedback:JSON.parse(evidence[1].answer).feedback_details,summary};
 }catch(error){return {subject,ok:false,error:error.message,cause:error.cause?.message};}
}
(async()=>{
 if(process.argv.includes('--summary-only')) {
  const rows=require(pilotPath), service=createContentService({secret:'synthetic-local-probe'});
  for(const row of rows) {
   const attempts=['correct','incorrect'].map(result=>({attempt_id:randomUUID(),result,cognitive_dimension:'comprension',answer:JSON.stringify({kuneo_activity_version:1,grade_group:'8-9',question:row.question,question_type:row.type,learning_focus:row.summary.title,feedback:'Revisa las justificaciones de tus elecciones.',feedback_details:row.feedback.map(d=>result==='incorrect'?d:{...d,correct:true,selected:row.type==='matching'?d.expected:d.expected==='Sí corresponde'?'La elegiste':'No la elegiste'})})}));
   row.summary=await service.summarize(attempts,{id:randomUUID(),subject:row.subject,title:row.summary.title});
   console.log(JSON.stringify({subject:row.subject,summarySource:row.summary.summarySource}));
  }
  writeFileSync(pilotPath,JSON.stringify(rows,null,2));return;
 }
 const results=[], subject=process.argv.find(arg=>arg.startsWith('--subject='))?.split('=')[1];
 const activeCases=cases.filter(row=>!subject||row[0]===subject);
 for(let i=0;i<activeCases.length;i+=2) {
  const batch=await Promise.all(activeCases.slice(i,i+2).map(runCase));results.push(...batch);
  for(const row of batch) console.log(JSON.stringify({subject:row.subject,ok:row.ok,type:row.type,generatedMs:row.generatedMs,error:row.error,cause:row.cause}));
 }
 const retained=subject?require(pilotPath).filter(row=>row.subject!==subject):[];
 writeFileSync(pilotPath,JSON.stringify([...retained,...results],null,2));
 if(results.some(r=>!r.ok))process.exitCode=1;
})();
