const fs=require('node:fs');const path=require('node:path');
const cases=require('./learning-reference.cjs');
const {createContentService,gradeGroup}=require('../../server/learningContent');
const {capture,distribution}=require('../../server/runtimeMetrics');
module.exports=async function({subjects}={}){
 const service=createContentService({secret:process.env.SUPABASE_SERVICE_ROLE_KEY});
 const chosen=[cases.find(x=>x.subject==='mathematics'),cases.find(x=>x.subject==='language'),cases.find(x=>x.subject==='natural_sciences'),cases.find(x=>x.id==='social-10'),cases.find(x=>x.id==='english-11')];
 const topics={mathematics:'Combinar cantidades con la suma',language:'Reconocer causas de las acciones en una narración',natural_sciences:'Reconocer transformaciones de energía en objetos cotidianos',social_studies:'Usar datos para argumentar decisiones y escuchar otras perspectivas',english:'Inferir el significado de vocabulario desconocido por contexto y comprobar la inferencia'};
 const report={date:new Date().toISOString(),scope:'Synthetic support pilot, no student data or Supabase writes; requires pedagogical and browser review.',results:[]};
 for(const item of chosen.filter(item=>!subjects||subjects.includes(item.subject))){for(const level of [2,3]){
  try{const run=await capture('support_pilot',()=>service.support({question:item.question,support_context:{topic:topics[item.subject]},subject:item.subject,dimension:item.dimension,grade_group:gradeGroup(item.grade),hint:'Identifica los datos y lo que te pide la pregunta.'},level));report.results.push({case_id:item.id,subject:item.subject,grade:item.grade,question:item.question,level,card:run.value.card,metrics:run.metrics});console.log(JSON.stringify({case_id:item.id,level,visual:run.value.card.visual.kind,ms:run.metrics.total_ms}));}
  catch(error){report.results.push({case_id:item.id,level,error:error.message});}
 }}
 report.summary={passed_contract:report.results.filter(x=>x.card).length,total:report.results.length,latency:distribution(report.results.filter(x=>x.card).map(x=>x.metrics.total_ms))};
 fs.writeFileSync(path.join(__dirname,subjects?'../../reports/hito2-language-regression.json':'../../reports/hito2-support-pilot.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
};
