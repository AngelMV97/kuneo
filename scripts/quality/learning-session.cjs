const fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {createContentService,gradeGroup}=require('../../server/learningContent');
const {desiredFormat}=require('../../server/learningFormats');
const {capture,distribution}=require('../../server/runtimeMetrics');
module.exports=async function({subjects,formats,includeSupport=true}={}){
 const allFixtures=[
 {subject:'mathematics',grade:2,topic:'Sumar y comparar cantidades pequeñas de objetos',question:'Ana tiene tres lápices y recibe dos más. ¿Cuántos tiene ahora?'},
 {subject:'language',grade:3,topic:'Comprender causas y motivos en narraciones cortas en español',question:'Lina toma un paraguas al ver nubes oscuras. ¿Qué puedes inferir sobre su decisión?'},
 {subject:'natural_sciences',grade:4,topic:'Explicar cambios de estado y transferencia de calor con datos cotidianos',question:'Un cubo de hielo se coloca sobre un plato caliente. ¿Por qué puede derretirse?'},
 {subject:'social_studies',grade:7,topic:'Argumentar decisiones comunitarias con evidencia y distintas perspectivas',question:'Un barrio debe elegir una mejora pública. ¿Cómo escucharías a distintos grupos antes de decidir?'},
 {subject:'english',grade:5,topic:'Comprender vocabulario y oraciones breves en inglés usando contexto',question:'Read: The child is thirsty and asks for water. ¿Qué pista ayuda a entender thirsty?'}
 ];
 const fixtures=allFixtures.filter(item=>!subjects||subjects.includes(item.subject));
 const service=createContentService({secret:process.env.SUPABASE_SERVICE_ROLE_KEY});
 const report={date:new Date().toISOString(),scope:'Synthetic generation/support only; no users or Supabase writes. Public drafts excluded from correctness claims until final validation.',activities:[],supports:[]};
 let next=0;
 async function worker(){while(next<fixtures.length){const item=fixtures[next++];const module={id:`synthetic-${item.subject}`,subject:item.subject,title:item.topic,learning_objective:item.topic,core_concept:item.topic};const step={id:`objective-${item.subject}`,step_order:1,content:{learning_goal:item.topic}};
 for(let n=0;n<4;n++){
 if(formats&&!formats.includes(desiredFormat(Array(n).fill({}))))continue;
 const attempts=Array.from({length:n},(_,i)=>({step_id:step.id,result:'incorrect',cognitive_dimension:['comprension','razonamiento','representacion'][i],hint_requests:0,answer:'synthetic prior attempt'}));
 const start=performance.now();let first=null,chunks=0;
 try{const run=await capture('formats_stream_pilot',()=>service.generate({userId:'synthetic-quality-probe',profile:{grade_level:item.grade},module,steps:[step],attempts,onProgress:d=>{if(d.question){first??=Math.round(performance.now()-start);chunks++;}}}));
 const activity=run.value.activity;if(!activity)throw new Error('No generated activity');report.activities.push({subject:item.subject,grade:item.grade,requested:desiredFormat(attempts),actual:activity.type,activity,first_text_ms:first,total_ms:run.metrics.total_ms,preview_events:chunks});console.log(JSON.stringify({subject:item.subject,requested:desiredFormat(attempts),actual:activity.type,first_text_ms:first,total_ms:run.metrics.total_ms}));}
 catch(error){report.activities.push({subject:item.subject,requested:desiredFormat(attempts),error:error.message,cause:error.cause?.message});console.log(JSON.stringify({subject:item.subject,requested:desiredFormat(attempts),error:error.message}));}
 }
 if(!includeSupport)continue;
 const start=performance.now();let first=null;
 try{const run=await capture('support_stream_pilot',()=>service.support({subject:item.subject,grade_group:gradeGroup(item.grade),dimension:'razonamiento',support_context:{topic:item.topic},question:item.question,hint:'Identifica las pistas que da el contexto.'},3,0,'',d=>{if(d.body)first??=Math.round(performance.now()-start);}));report.supports.push({subject:item.subject,card:run.value.card,first_intro_ms:first,total_ms:run.metrics.total_ms});console.log(JSON.stringify({support:item.subject,first_intro_ms:first,total_ms:run.metrics.total_ms}));}
 catch(error){report.supports.push({subject:item.subject,error:error.message,cause:error.cause?.message});console.log(JSON.stringify({support:item.subject,error:error.message,cause:error.cause?.message}));}
 }}
 await Promise.all([worker(),worker()]);
 report.summary={activities_ready:report.activities.filter(x=>x.activity).length,activities_total:report.activities.length,format_matches:report.activities.filter(x=>x.requested===x.actual).length,supports_ready:report.supports.filter(x=>x.card).length,supports_total:report.supports.length,first_text:distribution(report.activities.map(x=>x.first_text_ms)),complete_activity:distribution(report.activities.map(x=>x.total_ms))};
 fs.writeFileSync(path.join(__dirname,subjects?'../../reports/learning-session-targeted-pilot.json':'../../reports/learning-session-stream-pilot.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
};
