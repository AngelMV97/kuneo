// Explicit opt-in: at most 16 synthetic rubric evaluations, no DB, no student data.
const fs=require('node:fs'),path=require('node:path');
const {build}=require('./hito4-repairs.cjs');
const {normalizeStored,createContentService}=require('../../server/learningContent');
async function main(){
 if(!process.argv.includes('--run'))throw Error('Use --run for the bounded live evaluation.');
 require('../../server/node_modules/dotenv').config({path:path.resolve(__dirname,'../../server/.env'),quiet:true});
 if(!process.env.OPENAI_API_KEY)throw Error('OpenAI key unavailable');
 const OpenAI=require('../../server/node_modules/openai');
 const raw=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:25000});
 const round2=process.argv.includes('--round2');
 const candidates=round2?require('./hito4-round2-repairs.cjs').build():build();
 const report={model:'gpt-4.1-mini',evaluatorSha256:require('../../server/reserveInventory').hash(fs.readFileSync(path.resolve(__dirname,'../../server/learningContent.js'),'utf8')),started:new Date().toISOString(),limit:{calls:round2?24:16,completionTokensPerCall:700,totalTokens:round2?75000:50000},calls:0,inputTokens:0,outputTokens:0,results:[],databaseCalls:0};
 const client={chat:{completions:{async create(request){
  if(report.calls>=report.limit.calls||report.inputTokens+report.outputTokens>=report.limit.totalTokens)throw Error('Pilot budget reached');
  if(request.response_format.json_schema.name!=='kuneo_evaluation')throw Error('Only rubric evaluation allowed');
  report.calls++;
  const result=await raw.chat.completions.create({...request,model:report.model,max_completion_tokens:700});
  report.inputTokens+=result.usage?.prompt_tokens||0;report.outputTokens+=result.usage?.completion_tokens||0;
  return result;
 }}}};
 const service=createContentService({secret:'synthetic-live-eval',client,evaluationModel:report.model});
 for(let round=1;round<=2;round++)for(const candidate of candidates.filter(c=>c.activity.type==='text'))for(const [answer,expected] of candidate.checks){
  const actual=await service.evaluate({...normalizeStored(candidate.step),subject:candidate.module.subject,grade_group:candidate.module.grade_range},answer);
  report.results.push({candidateSha256:candidate.sha256,subject:candidate.module.subject,round,answer,expected,actual,pass:actual.result===expected});
  console.log(JSON.stringify({subject:candidate.module.subject,round,expected,result:actual.result}));
 }
 report.finished=new Date().toISOString();report.passed=report.results.every(r=>r.pass);
 fs.writeFileSync(path.resolve(__dirname,round2?'../../reports/hito4-2-round2/live-evaluation.json':process.argv.includes('--recheck-pilot')?'../../reports/hito4-2-round2/pilot-regression.json':'../../reports/hito4-3-pilot/live-evaluation.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({calls:report.calls,inputTokens:report.inputTokens,outputTokens:report.outputTokens,passed:report.passed}));
 if(!report.passed)process.exitCode=1;
}
main().catch(error=>{console.error('Pilot failed:',error.code||error.name);process.exitCode=1;});
