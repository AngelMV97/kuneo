// Eight-question, synthetic science practice. No DB, no student accounts.
const fs=require('node:fs'),path=require('node:path');
const {createContentService}=require('../../server/learningContent');
async function main(){
 if(!process.argv.includes('--run'))throw Error('Use --run for a bounded model test');
 require('../../server/node_modules/dotenv').config({path:path.resolve(__dirname,'../../server/.env'),quiet:true});
 const OpenAI=require('../../server/node_modules/openai'),raw=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:25000});
 const model='gpt-4.1-mini',report={model,limit:32,calls:0,inputTokens:0,outputTokens:0,databaseCalls:0,results:[],traces:[]};
 const client={chat:{completions:{create:async(request,options)=>{if(report.calls>=report.limit)throw Error('Call limit');report.calls++;const result=await raw.chat.completions.create({...request,model},options);report.inputTokens+=result.usage?.prompt_tokens||0;report.outputTokens+=result.usage?.completion_tokens||0;report.traces.push({schema:request.response_format.json_schema.name,response:result.choices?.[0]?.message?.content});return result;}}}};
 const service=createContentService({secret:'synthetic-variety',client,activityModel:model,reviewModel:model}),attempts=[];
 let module={id:'variety-science',subject:'natural_sciences',title:'Hipótesis y evidencia',grade_range:'6-7',learning_objective:'Formular y contrastar hipótesis sobre cambios físicos usando observaciones y condiciones de comparación.',core_concept:'hipotesis_y_evidencia'};
 let step={id:'variety-step',module_id:module.id,step_order:1,content:{prompt:'Contrasta hipótesis con observaciones. Referencia: vasos con distintos líquidos al sol; no es una plantilla obligatoria.'},enriched_content:null};
 const inquiry=process.argv.includes('--inquiry');
 if(inquiry){const snapshot=require('../../reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json').data;
 module=snapshot.modules.find(m=>m.subject==='natural_sciences'&&/^Formulo hipótesis con base en el conocimiento cotidiano/.test(m.learning_objective)&&m.core_concept==='ciencias_naturales');if(!module)throw Error('No source module');
 const first=snapshot.module_steps.filter(s=>s.module_id===module.id).sort((a,b)=>a.step_order-b.step_order)[0];step={...first,enriched_content:null};
 report.source={moduleId:module.id,stepId:step.id,objective:module.learning_objective,grade:Number(module.grade_range.split('-').at(-1))};}
 const output=path.resolve(__dirname,inquiry?'../../reports/hito4-2-inquiry':'../../reports/hito4-2-variety');fs.mkdirSync(output,{recursive:true});
 const slotFlag=process.argv.find(s=>/^--slot=/.test(s)),onlySlot=slotFlag?Number(slotFlag.split('=')[1]):null;
 if(onlySlot!==null){if(!inquiry||!Number.isInteger(onlySlot)||onlySlot<1||onlySlot>8)throw Error('Invalid focused slot');report.limit=4;
 const seed=JSON.parse(fs.readFileSync(path.join(output,'live.json'),'utf8'));
 for(const x of seed.results.filter(x=>x.slot<onlySlot)){if(!x.payload)throw Error('Missing seed');attempts.push({attempt_id:'synthetic-'+x.slot,module_id:module.id,step_id:step.id,cognitive_dimension:x.payload.dimension,result:'partial',hint_requests:0,answer:JSON.stringify({kuneo_activity_version:1,question:x.payload.question,question_type:x.payload.type,options:x.payload.options,submitted_answer:'Respuesta sintética; no corresponde a un estudiante.'})});}}
 for(let slot=0;slot<8;slot++){
  if(onlySlot!==null&&slot!==onlySlot-1)continue;
  const start=Date.now();
  try{const result=await service.generate({userId:'synthetic',profile:{grade_level:report.source?.grade||7},module,steps:[step],attempts});const payload=service.decode(result.token,'synthetic');
   report.results.push({slot:slot+1,seconds:(Date.now()-start)/1000,activity:result.activity,payload});
   // Routing evidence is explicitly synthetic. No AI grading or persistence.
   attempts.push({attempt_id:'synthetic-'+slot,module_id:module.id,step_id:step.id,cognitive_dimension:payload.dimension,result:'partial',hint_requests:0,answer:JSON.stringify({kuneo_activity_version:1,question:payload.question,question_type:payload.type,options:payload.options,submitted_answer:'Respuesta sintética; no corresponde a un estudiante.'})});
  }catch(error){report.results.push({slot:slot+1,seconds:(Date.now()-start)/1000,error:error.status||error.name,reason:error.cause?.message||error.message});}
  fs.writeFileSync(path.join(output,onlySlot!==null?`live-slot-${onlySlot}.json`:'live.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({slot:slot+1,seconds:report.results.at(-1).seconds,error:report.results.at(-1).error,type:report.results.at(-1).activity?.type}));
 }
 console.log(JSON.stringify({calls:report.calls,inputTokens:report.inputTokens,outputTokens:report.outputTokens,delivered:report.results.filter(r=>r.activity).length}));
}
main().catch(error=>{console.error(error.name);process.exitCode=1;});
