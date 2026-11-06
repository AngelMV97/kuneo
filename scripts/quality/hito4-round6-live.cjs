// Bounded semantic grading only: eight candidates, four synthetic answers each.
const fs=require('node:fs'),path=require('node:path');
const {build}=require('./hito4-round6.cjs'),{hash}=require('../../server/reserveInventory');
const {normalizeStored,createContentService}=require('../../server/learningContent');
async function main(){
 if(!process.argv.includes('--run'))throw Error('Use --run to allow bounded API calls');
 require('../../server/node_modules/dotenv').config({path:path.resolve(__dirname,'../../server/.env'),quiet:true});
 const OpenAI=require('../../server/node_modules/openai'),raw=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:25000});
 const report={model:'gpt-4.1-mini',limit:{calls:64,answers:32,totalTokens:100000,completionTokensPerCall:700},calls:0,inputTokens:0,outputTokens:0,results:[],traces:[],databaseCalls:0,evaluatorSha256:hash(fs.readFileSync(path.resolve(__dirname,'../../server/learningContent.js'),'utf8'))};
 const client={chat:{completions:{create:async(request,options)=>{
  if(request.response_format.json_schema.name!=='kuneo_evaluation'||report.calls>=report.limit.calls||report.inputTokens+report.outputTokens>=report.limit.totalTokens)throw Error('Bounded evaluation limit');
  report.calls++;const result=await raw.chat.completions.create({...request,model:report.model,max_completion_tokens:700},options);report.inputTokens+=result.usage?.prompt_tokens||0;report.outputTokens+=result.usage?.completion_tokens||0;report.traces.push({schema:request.response_format.json_schema.name,finishReason:result.choices?.[0]?.finish_reason,response:result.choices?.[0]?.message?.content});return result;
 }}}};
 const service=createContentService({secret:'synthetic-round6',client,evaluationModel:report.model}),jobs=build().flatMap(c=>c.checks.map(([answer,expected])=>({c,answer,expected}))),out=path.resolve(__dirname,'../../reports/hito4-2-round6/live-evaluation.json');
 for(let i=0;i<jobs.length;i+=2){
  const results=await Promise.all(jobs.slice(i,i+2).map(async({c,answer,expected})=>{
   try{const run=await require('../../server/runtimeMetrics').capture('round6-evaluation',()=>service.evaluate({...normalizeStored(c.step),subject:c.module.subject,grade_group:c.module.grade_range},answer));const actual=run.value;return {candidateSha256:c.sha256,questionId:c.original.questionId,subject:c.module.subject,round:1,answer,expected,actual,metrics:run.metrics,pass:actual.result===expected};}
   catch(error){return {candidateSha256:c.sha256,questionId:c.original.questionId,subject:c.module.subject,round:1,answer,expected,error:error.status||error.name,metrics:error.metrics,pass:false};}
  }));report.results.push(...results);report.passed=report.results.every(r=>r.pass);fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');for(const r of results)console.log(JSON.stringify({id:r.questionId.slice(0,8),expected:r.expected,result:r.actual?.result,error:r.error}));
 }
 console.log(JSON.stringify({calls:report.calls,inputTokens:report.inputTokens,outputTokens:report.outputTokens,passed:report.results.every(r=>r.pass),total:report.results.length}));if(!report.passed)process.exitCode=1;
}
main().catch(error=>{console.error(error.name);process.exitCode=1;});
