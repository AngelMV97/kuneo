// Evidence gate, not a publisher. It refuses stale candidate/evaluation pairings.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {hash}=require('../../server/reserveInventory');
const root=path.resolve(__dirname,'../..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const audit=read('reports/hito4-2-round2/audit.json'),inventory=read('reports/hito4-1/inventory.json');
const candidates=require('./hito4-round2-repairs.cjs').build(),pilot=require('./hito4-repairs.cjs').build();
for(const [file,items]of [['reports/hito4-2-round2/live-evaluation.json',candidates],['reports/hito4-2-round2/pilot-regression.json',pilot]]){
 const live=read(file);assert.ok(live.passed);assert.ok(live.results.length);
 for(const item of items.filter(c=>c.activity.type==='text'))for(const [answer,expected]of item.checks)for(const round of [1,2])assert.ok(live.results.some(r=>r.candidateSha256===item.sha256&&r.answer===answer&&r.expected===expected&&r.round===round&&r.pass),'Stale or missing live evidence: '+item.module.title);
}
const reviewed=new Set([...candidates,...pilot].map(c=>c.original.questionId));
const remaining=inventory.questions.filter(q=>q.technicalCandidate&&!reviewed.has(q.id)).map(q=>({questionId:q.id,stepId:q.stepId,moduleId:q.moduleId,subject:q.subject,gradeRange:q.gradeRange,sourceSha256:q.sourceSha256,state:'not_pedagogically_audited'}));
const keywordIds=new Set(read('reports/hito4-2/pilot.json').relatedReviewCohort.questions.map(q=>q.questionId));
const report={scope:'Evidence gate for 4.2 round 2; no DB publication and no catalogue certification',snapshotSha256:audit.snapshotSha256,reviewedUniqueOriginals:reviewed.size,secondRound:audit.summary,remainingTechnicalCandidates:remaining.length,remainingKeywordCandidates:remaining.filter(q=>keywordIds.has(q.questionId)).length,remaining,sourceHashes:Object.fromEntries(['server/learningContent.js','server/reserveQuarantine.json','server/reserveQuarantineRound2.json','scripts/quality/hito4-round2-repairs.cjs'].map(f=>[f,hash(fs.readFileSync(path.join(root,f),'utf8'))]))};
fs.writeFileSync(path.join(root,'reports/hito4-2-round2/worklist.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({reviewedUniqueOriginals:reviewed.size,remainingTechnicalCandidates:remaining.length,remainingKeywordCandidates:report.remainingKeywordCandidates}));
