// Offline pilot: curriculum snapshot only. No database, credentials or model calls.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { hash } = require('../../server/reserveInventory');
const { normalizeStored, createContentService } = require('../../server/learningContent');
const root = path.resolve(__dirname, '../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
async function main() {
 const snapshot = read('reports/hito4-1/snapshot-2026-11-05T18-45-00-839Z.json');
 const queue = read('reports/hito4-1/audit-queue.json');
 assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(snapshot.data)).digest('hex'), snapshot.sha256);
 assert.equal(queue.snapshotSha256, snapshot.sha256);
 let calls = 0;
 // Legacy grading ends with a metadata lookup. Stub exactly that read, never connect.
 let stubbedMetadataReads=0;
 require('../../server/adaptive').initializeSupabase({schema(name){assert.equal(name,'kuneo');return {from(table){assert.equal(table,'module_steps');return {select(column){assert.equal(column,'cognitive_dimension');return {eq(column,id){assert.equal(column,'id');assert.equal(id,undefined);return {async single(){stubbedMetadataReads++;return {data:null,error:null};}};}};}};}};}});
 const service = createContentService({secret:'offline-audit',mode:'stored',client:{chat:{completions:{create(){calls++;throw Error('Model calls forbidden in offline audit');}}}}});
 const packets = [];
 for (const entry of queue.rounds.filter(row=>row.round===1)) {
  const step = snapshot.data.module_steps.find(row=>row.id===entry.selected.stepId);
  const module = snapshot.data.modules.find(row=>row.id===step.module_id);
  assert.equal(hash({stepContent:step.content,enriched:step.enriched_content}),entry.selected.sha256);
  const card = snapshot.data.concept_cards.find(row=>row.id===step.concept_card_id)||null;
  const visual = snapshot.data.visual_templates.find(row=>row.template_key===step.visual_template_key)||null;
  const activity = normalizeStored(step,0);
  assert.ok(activity,'Selected question no longer readable');
  packets.push({subject:entry.subject,questionId:entry.selected.questionId,sourceSha256:entry.selected.sha256,module,step,card,visual,associationHashes:{module:hash(module),card:hash(card),visual:hash(visual)},activity});
 }
 const fixtures = read('scripts/quality/hito4-audit-cases.json');
 const results=[];
 for(const fixture of fixtures){
  const packet=packets.find(row=>row.subject===fixture.subject);
  const answer=fixture.answer==='__REFERENCE__'?packet.activity.expected.answer:fixture.answer;
  let actual;
  try { actual=await service.evaluate({...packet.activity,subject:packet.subject,grade_group:packet.module.grade_range},answer); }
  catch(error){if(fixture.id.startsWith('social-')&&fixture.id!=='social-key-order'&&error.status===400){results.push({...fixture,answer,actual:{status:400,message:error.message},resolved:true,questionId:packet.questionId});continue;}throw error;}
  // Expected observations document defects; they are NOT desired grading rules.
  assert.equal(actual.result,fixture.observedResult,fixture.id+': evaluator changed; re-audit required');
  if(['social-extra-item','social-omitted-item','social-repeated-item'].includes(fixture.id))throw Error('Ordering regression: malformed sequence was graded');
  results.push({...fixture,answer,actual,questionId:packet.questionId});
 }
 assert.equal(calls,0);
 const inventory=read('reports/hito4-1/inventory.json');
 const candidates=inventory.questions.filter(row=>row.technicalCandidate);
 const keywordCohort=candidates.filter(row=>{
  const step=snapshot.data.module_steps.find(s=>s.id===row.stepId);
  const activity=normalizeStored(step,row.index||0);
  return activity?.expected?.evaluation_strategy==='keywords'||activity?.expected?.type==='keywords';
 }).map(row=>({questionId:row.id,sourceSha256:row.sourceSha256,subject:row.subject,gradeRange:row.gradeRange}));
 const folder=path.join(root,'reports/hito4-2');fs.mkdirSync(folder,{recursive:true});
 const report={version:1,snapshotSha256:snapshot.sha256,scope:'Round 1 only; observations reproduce legacy defects, not approval or fixes. Legacy metadata reads are stubbed; no network.',sourceFiles:Object.fromEntries(['server/learningContent.js','server/adaptive.js','scripts/quality/hito4-audit.cjs','scripts/quality/hito4-audit-cases.json'].map(file=>[file,hash(fs.readFileSync(path.join(root,file),'utf8'))])),modelCalls:calls,databaseCalls:0,stubbedMetadataReads,packets,results,relatedReviewCohort:{reason:'Literal keyword evaluation requires review; membership is a risk flag, not a confirmed semantic error in every item.',questions:keywordCohort}};
 fs.writeFileSync(path.join(folder,'recheck-current.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({questions:packets.length,cases:results.length,resolved:results.filter(r=>r.resolved).length,modelCalls:calls,databaseCalls:0,keywordReviewCandidates:keywordCohort.length,report:'reports/hito4-2/recheck-current.json'}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
