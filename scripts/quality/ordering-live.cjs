// Opt-in smoke test of generation/review for ordering in all five subjects.
const fs=require('node:fs'),path=require('node:path');
const {createContentService}=require('../../server/learningContent');
const cases=[
 ['mathematics',5,'Ordenar porciones de la misma unidad representadas con fracciones de igual denominador.'],
 ['language',7,'Reconstruir la secuencia de acciones de un relato breve en español incluido completo.'],
 ['natural_sciences',3,'Ordenar tres acciones de una observación imaginada con dependencias explícitas, sin resultados inventados.'],
 ['social_studies',9,'Ordenar cuatro hitos de un proyecto escolar ficticio con fechas explícitas, sin cronologías universales.'],
 ['english',11,'Ordenar cuatro acciones de instrucciones escritas EN INGLÉS con before/after y dependencias explícitas.']
];
async function main(){
 if(!process.argv.includes('--run'))throw Error('Use --run to allow bounded model calls');
 require('../../server/node_modules/dotenv').config({path:path.resolve(__dirname,'../../server/.env'),quiet:true});
 const OpenAI=require('../../server/node_modules/openai'),raw=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:25000});
 const model=process.argv.includes('--full-model')?'gpt-4.1':'gpt-4.1-mini';
 const report={model,limit:20,calls:0,inputTokens:0,outputTokens:0,results:[],traces:[],databaseCalls:0};
 const client={chat:{completions:{async create(request,options){
  if(report.calls>=report.limit)throw Error('Smoke test call budget reached');report.calls++;
  const result=await raw.chat.completions.create({...request,model:report.model,max_completion_tokens:request.response_format.json_schema.name==='kuneo_activity'?1800:650},options);
  report.inputTokens+=result.usage?.prompt_tokens||0;report.outputTokens+=result.usage?.completion_tokens||0;report.traces.push({schema:request.response_format.json_schema.name,response:result.choices?.[0]?.message?.content});return result;
 }}}};
 const service=createContentService({secret:'ordering-synthetic',client,mode:'generated',activityModel:report.model,reviewModel:report.model});
 for(const [subject,grade,goal]of cases){
  const module={id:`ordering-${subject}`,subject,title:goal,learning_objective:goal,core_concept:goal,grade_range:String(grade)};
  const step={id:`step-${subject}`,module_id:module.id,step_order:1,content:{prompt:goal},enriched_content:null};
  const start=Date.now();
  try{
   const generated=await service.generate({userId:'synthetic',profile:{grade_level:grade},module,steps:[step],attempts:[],anticipation:{stepId:step.id,dimension:'comprension',format:'ordering'}});
   const payload=service.decode(generated.token,'synthetic');
   const evaluation=payload.type==='ordering'?await service.evaluate(payload,JSON.stringify(payload.expected.correct_order)):null;
   report.results.push({subject,grade,module,activity:generated.activity,payload,evaluation,seconds:(Date.now()-start)/1000,pass:payload.type==='ordering'&&payload.source==='generated'&&evaluation?.result==='correct'});
  }catch(error){report.results.push({subject,grade,seconds:(Date.now()-start)/1000,error:error.learningReason||error.status||error.name,reason:error.cause?.message||error.message,pass:false});}
  console.log(JSON.stringify({subject,...Object.fromEntries(Object.entries(report.results.at(-1)).filter(([k])=>['seconds','pass','error'].includes(k)))}));
  fs.writeFileSync(path.resolve(__dirname,'../../reports/hito4-2-round3/ordering-live.json'),JSON.stringify(report,null,2)+'\n');
 }
 report.passed=report.results.every(r=>r.pass);fs.writeFileSync(path.resolve(__dirname,'../../reports/hito4-2-round3/ordering-live.json'),JSON.stringify(report,null,2)+'\n');if(!report.passed)process.exitCode=1;
}
main().catch(error=>{console.error('Ordering smoke test:',error.code||error.name);process.exitCode=1;});
