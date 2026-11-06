const test = require('node:test');
const assert = require('node:assert/strict');
const { prepare, rank, gradeMatches, validateFilters, createSearchService } = require('./competencySearch');
const rows = [
 { id: 'a', subject: 'mathematics', grade_range: '4', source: 'dba', content: { competency: 'Represento funciones y energía' } },
 { id: 'b', subject: 'natural_sciences', grade_range: '6-7', source: 'standard', content: { competency: 'Relaciono energía y movimiento' } },
 { id: 'c', subject: 'language', grade_range: '8-9', source: 'standard', content: { competency: 'Interpreto relatos' } }
];
test('accents and plurals retrieve identical records without fabricating other grades', () => {
 const docs = rows.map(prepare);
 assert.deepEqual(rank(docs, 'función', {}, []).map(r=>r.id), rank(docs, 'funciones', {}, []).map(r=>r.id));
 assert.equal(rank(docs, 'energia', {}, []).length, 2);
 assert.equal(rank(docs, 'energia', { grade_range: '10-11' }, []).length, 0);
 assert.equal(rank(docs, 'energia', { subject: 'mathematics', grade_range: '4-5' }, [])[0].id, 'a');
});
test('grade filters include overlapping ranges and individual grades', () => {
 assert.equal(gradeMatches('4', '4-5'), true); assert.equal(gradeMatches('6-7','7'), true); assert.equal(gradeMatches('3','4-5'),false);
 for (const filters of [{grade_range:'5-4'},{subject:'fake'},{source:'unknown'},{unexpected:true}]) assert.throws(()=>validateFilters(filters));
});
test('semantic matches complement text, null scores do not fabricate matches', () => {
 const result=rank(rows.map(prepare),'comprender cuentos',{},[{id:'c',similarity:0.7},{id:'a',similarity:null}]);
 assert.deepEqual(result.map(r=>r.id),['c']); assert.equal(result[0].retrieval,'semantic');
});
function fakeDb() { return {schema(){return this;}, from(){return this;},select(){return this;},order(){return this;},async range(start,end){return {data:rows.slice(start,end+1),error:null};}}; }
test('failure retains lexical results; filters precede pagination; concurrent searches share provider', async()=>{
 let calls=0;
 const service=createSearchService(fakeDb(), {semanticSearch:async()=>{calls++;throw new Error('offline');}});
 const [first,second]=await Promise.all([service.search('energía',{}, {limit:1}),service.search('energia',{}, {limit:1,offset:1})]);
 assert.equal(calls,1);assert.equal(first.total,2);assert.notEqual(first.results[0].id,second.results[0].id);assert.equal(first.semantic_available,false);
 assert.equal((await service.search('energia',{subject:'natural_sciences'},{limit:1})).total,1);
 await assert.rejects(service.search('energia',{}, {offset:-1}));
});
test('HTTP search preserves pagination contract and module links without returning embeddings', async()=>{
 const express=require('express'), app=express(); app.use(express.json());
 const service=createSearchService(fakeDb(),{semanticSearch:async()=>[]});
 const db={schema(){return this;},from(){return this;},select(){return this;},eq(){return this;},async order(){return {data:[{id:'module-1',title:'Energía',grade_range:'4-5'}]};}};
 app.use('/api',require('./competencies')(db,{service}));
 const server=app.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/competencies`;
 try {
 const response=await fetch(`${base}/search`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'energia',match_count:1})});
 assert.equal(response.status,200);const page=await response.json();assert.equal(page.total,2);assert.equal(page.next_offset,1);assert.equal(page.results[0].embedding,undefined);
 assert.equal((await fetch(`${base}/filters?grade_range=4-5`)).status,200);
 const modules=await (await fetch(`${base}/a/modules`)).json();assert.equal(modules.modules[0].id,'module-1');
 const invalid=await fetch(`${base}/search`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'energia',filters:{subject:'invalid'}})}); assert.equal(invalid.status,400);
 } finally {await new Promise(resolve=>server.close(resolve));}
});
