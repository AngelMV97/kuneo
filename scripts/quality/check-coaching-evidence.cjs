require('dotenv').config({path:require('node:path').join(__dirname,'../../server/.env'),quiet:true});
const OpenAI=require('../../server/node_modules/openai');
const {createContentService}=require('../../server/learningContent');
const {validateCoaching}=require('../../server/learningSession');
const {randomUUID}=require('node:crypto');
const rows=require('../../recovery/feedback-coaching-pilot.json');
const raw=[];
const ai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
(async()=>{
 for(const row of rows.filter(r=>r.summary.summarySource==='saved_feedback')){
  let draft;
  const client={chat:{completions:{create:async(...args)=>{const result=await ai.chat.completions.create(...args);draft=JSON.parse(result.choices[0].message.content);return result;}}}};
  const attempts=['correct','incorrect'].map(result=>({attempt_id:randomUUID(),result,answer:JSON.stringify({kuneo_activity_version:1,grade_group:'8-9',question:row.question,question_type:row.type,feedback_details:row.feedback.map(d=>({...d,correct:result==='correct'?true:d.correct})),feedback:'Revisa la explicación de cada elección.'})}));
  const summary=await createContentService({secret:'synthetic-probe',client}).summarize(attempts,{id:randomUUID(),subject:row.subject,title:row.summary.title});
  let reason;try{validateCoaching(draft,attempts);}catch(error){reason=error.message;}
  raw.push({subject:row.subject,source:summary.summarySource,reason,draft});console.log(JSON.stringify({subject:row.subject,source:summary.summarySource,reason}));
 }
 require('node:fs').writeFileSync(require('node:path').join(__dirname,'../../recovery/coaching-evidence-check.json'),JSON.stringify(raw,null,2));
})();
