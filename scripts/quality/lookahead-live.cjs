// Real OpenAI, real router, synthetic in-memory database. Never calls Supabase.
require('dotenv').config({ path: require('node:path').join(__dirname, '../../server/.env'), quiet: true });
const express = require('../../server/node_modules/express');
const OpenAI = require('../../server/node_modules/openai');
const { createContentService } = require('../../server/learningContent');
const learningRouter = require('../../server/learningRouter');
const metrics = require('../../server/runtimeMetrics');
const fs = require('node:fs'), path = require('node:path');
const USER='11111111-0000-4000-8000-000000000001', MODULE='22222222-0000-4000-8000-000000000001', STEP='33333333-0000-4000-8000-000000000001';
const tables={modules:[{id:MODULE,title:'Fracciones en la huerta escolar',subject:'mathematics',is_active:true,learning_objective:'Interpretar fracciones de un conjunto en situaciones escolares',core_concept:'Fracción de un conjunto'}],module_steps:[{id:STEP,module_id:MODULE,step_order:1,content:{learning_goal:'Interpretar una fracción de un conjunto de objetos'}}],profiles:[{user_id:USER,grade_level:5}],student_step_attempts:[],student_module_progress:[],student_cognitive_profile:[]};
const db={schema:()=>db,from:table=>{
 let filters=[],single=false,range,write,body;
 const q={select:()=>q,eq:(k,v)=>{filters.push(r=>r[k]===v);return q;},order:()=>q,range:(a,b)=>{range=[a,b];return q;},maybeSingle:()=>{single=true;return q;},single:()=>{single=true;return q;},insert:value=>{write='insert';body=value;return q;},upsert:value=>{write='upsert';body=value;return q;},then:(resolve,reject)=>Promise.resolve().then(()=>{
  if(write==='insert'){const row={...body,attempt_id:crypto.randomUUID()};tables[table].push(row);return {data:single?row:[row],error:null};}
  if(write==='upsert')return {data:body,error:null};
  let rows=tables[table].filter(r=>filters.every(f=>f(r)));if(range)rows=rows.slice(range[0],range[1]+1);return {data:single?rows[0]||null:rows,error:null};
 }).then(resolve,reject)};return q;
}};
(async()=>{
 let calls=0,resolveReady,candidate;
 const ready=new Promise(resolve=>{resolveReady=resolve;});
 const ai=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:25000});
 const client={chat:{completions:{create:(input,options)=>{if(++calls>12)throw Error('Synthetic experiment request limit');return ai.chat.completions.create(input,options);}}}};
 const content=createContentService({secret:'synthetic-lookahead-only',client});
 const generate=content.generate;
 content.generate=async input=>{try{const result=await generate(input);if(input.anticipation)candidate=result;return result;}finally{if(input.anticipation)resolveReady();}};
 const config={secret:'synthetic-lookahead-only',content,prefetch:true};
 const app=express();app.use(express.json(),(req,res,next)=>{req.user={id:USER};next();},metrics.middleware);app.use('/api',learningRouter(db,config));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 async function request(route,body){const start=performance.now();const response=await fetch(`http://127.0.0.1:${server.address().port}/api${route}`,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});return {status:response.status,ms:Math.round(performance.now()-start),data:await response.json()};}
 let timer;
 try{
  const first=await request(`/learning/modules/${MODULE}/activity`);if(first.status!==200)throw Error('First activity unavailable');
  await Promise.race([ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Lookahead did not complete')),30000);})]);clearTimeout(timer);
  // Do not pay for an unused third candidate in this finite experiment.
  config.lookahead=false;
  const payload=content.decode(first.data.token,USER);
  const answer=payload.type==='option'?String(payload.expected.correct_options[0]):payload.type==='multiple_select'?JSON.stringify(payload.expected.correct_options):payload.type==='matching'?JSON.stringify(payload.expected.correct_pairs):payload.expected.answer;
  const saved=await request('/learning/answers',{token:first.data.token,answer});
  const next=await request(`/learning/modules/${MODULE}/activity`);
  const report={date:new Date().toISOString(),scope:'Synthetic local data, real OpenAI and router. No Supabase or student data.',firstDeliveryMs:first.ms,candidateReadyBeforeAnswer:!!candidate,answerMs:saved.ms,nextDeliveryMs:next.ms,nextStatus:next.status,reusedCandidate:!!candidate&&next.data.activity?.id===candidate.activity?.id,firstSource:first.data.activity.source,nextSource:next.data.activity?.source,attemptsSaved:tables.student_step_attempts.length,providerCalls:calls,metrics:metrics.snapshot()};
  fs.writeFileSync(path.join(__dirname,'../../reports/lookahead-live.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,metrics:undefined},null,2));
  if(!report.reusedCandidate||report.attemptsSaved!==1||next.status!==200)process.exitCode=1;
 }finally{clearTimeout(timer);await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(JSON.stringify({name:error.name,status:error.status,message:error.status?undefined:error.message}));process.exitCode=1;});
