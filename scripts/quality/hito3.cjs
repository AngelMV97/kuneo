// Real OpenAI generation + isolated, in-memory HTTP/persistence harness.
// Never connects to Supabase; no student records are used or written.
const express=require('../../server/node_modules/express');
const fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {createContentService}=require('../../server/learningContent');
const metrics=require('../../server/runtimeMetrics');
module.exports=async function(){
 const user='10000000-0000-4000-8000-000000000099',moduleId='20000000-0000-4000-8000-000000000099',stepId='30000000-0000-4000-8000-000000000099';
 const tables={modules:[{id:moduleId,title:'Combinar cantidades',subject:'mathematics',grade_range:'1-3',is_active:true,learning_objective:'Usar la suma para combinar dos grupos de objetos'}],module_steps:[{id:stepId,module_id:moduleId,step_order:1,content:{learning_goal:'Sumar cantidades de objetos con resultado menor que veinte'}}],profiles:[{user_id:user,grade_level:2}],student_step_attempts:[],student_module_progress:[],student_cognitive_profile:[]};
 const db={schema(){return this;},from(table){let filters=[],single=false,body,mode='read',bounds;const q={select(){return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},order(){return q;},range(a,b){bounds=[a,b];return q;},maybeSingle(){single=true;return q;},single(){single=true;return q;},insert(value){mode='insert';body=value;return q;},upsert(value){mode='upsert';body=value;return q;},then(resolve,reject){return Promise.resolve().then(()=>{if(mode==='insert'){const r={...body,attempt_id:crypto.randomUUID()};tables[table].push(r);return {data:r,error:null};}if(mode==='upsert')return {data:body,error:null};let rows=tables[table].filter(r=>filters.every(f=>f(r)));if(bounds)rows=rows.slice(bounds[0],bounds[1]+1);return {data:single?rows[0]||null:rows,error:null};}).then(resolve,reject);}};return q;}};
 const service=createContentService({secret:'synthetic-benchmark-only'}),original=service.generate;
 let calls=0,prefetchEvidence=0,ready,failed;
 const prefetched=new Promise((resolve,reject)=>{ready=resolve;failed=reject;});prefetched.catch(()=>{});
 service.generate=async input=>{calls++;try{const result=await original(input);if(calls>1){prefetchEvidence=input.attempts.length;ready(result);}return result;}catch(error){failed(error);throw error;}};
 service.evaluate=async()=>({result:'correct',feedback:'Resultado sintético para medir la preparación posterior.'});
 const app=express();app.use(express.json());app.use(metrics.middleware);app.use((req,res,next)=>{req.user={id:user};next();});
 app.use('/api',require('../../server/learningRouter')(db,{secret:'synthetic-benchmark-only',content:service,prefetch:true}));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base=`http://127.0.0.1:${server.address().port}/api/learning`;
 async function request(route,body){const started=performance.now();const response=await fetch(base+route,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await response.json();if(!response.ok)throw new Error(data.error);return {elapsed_ms:Math.round(performance.now()-started),server_timing:response.headers.get('server-timing'),data};}
 let timeout;
 try{
 const first=await request(`/modules/${moduleId}/activity`);if(first.data.activity?.source!=='generated')throw new Error('Real generation required');
 const answer=await request('/answers',{token:first.data.token,answer:'Respuesta sintética'});
 const wait=performance.now();await Promise.race([prefetched,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Prefetch timeout')),45000);})]);clearTimeout(timeout);
 const next=await request(`/modules/${moduleId}/activity`),repeat=await request(`/modules/${moduleId}/activity`);
 const report={date:new Date().toISOString(),scope:'One synthetic session, local HTTP/in-memory DB, real OpenAI generation; evaluation stubbed. Excludes real Supabase, browser and concurrent load.',cold_activity_ms:first.elapsed_ms,answer_stub_ms:answer.elapsed_ms,prefetch_wait_after_feedback_ms:Math.round(performance.now()-wait),ready_next_ms:next.elapsed_ms,repeated_pending_ms:repeat.elapsed_ms,generations:calls,prefetch_evidence:prefetchEvidence,stable_pending:next.data.activity.id===repeat.data.activity.id,first_server_timing:first.server_timing,next_server_timing:next.server_timing};
 fs.writeFileSync(path.join(__dirname,'../../reports/hito3-prefetch-pilot.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{clearTimeout(timeout);await new Promise(resolve=>server.close(resolve));}
};
