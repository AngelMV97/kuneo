const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { summary, moduleState, dimensionScores, DIMENSIONS } = require('./learningMetrics');
const { createContentService, seal, unseal, gradeGroup, normalizeStored, validateGenerated } = require('./learningContent');
const learningRouter = require('./learningRouter');
const apiAuth = require('./apiAuth');

const USER = '10000000-0000-4000-8000-000000000001';
const OTHER = '10000000-0000-4000-8000-000000000002';
const MODULE = '20000000-0000-4000-8000-000000000001';
const STEP = '30000000-0000-4000-8000-000000000001';
const SECRET = 'a-private-test-secret';
const moduleFixture = { id: MODULE, title: 'Fracciones', subject: 'mathematics', grade_range: '4-5', is_active: true, learning_objective: 'Representar fracciones' };
const stepFixture = { id: STEP, module_id: MODULE, step_order: 1, content: { question: '¿Qué fracción representa una de cuatro partes iguales?', options: ['1/4', '1/2'] }, enriched_content: { expected_answer: { type: 'option', correct_options: [0] } } };
const activityFixture = { question: 'Una huerta tiene 12 plantas y 3 son tomates. ¿Qué fracción son tomates?', type: 'option', options: ['1/4', '1/3', '1/2'], correct_index: 0, expected_text: '1/4', rubric: 'Identifica tres de doce como una cuarta parte.', hint: 'Compara las partes con el total.', explanation: 'Tres de doce equivalen a un cuarto.' };
const attempt = (result, dimension = 'comprension', overrides = {}) => ({ attempt_id: crypto.randomUUID(), user_id: USER, module_id: MODULE, step_id: STEP, result, cognitive_dimension: dimension, hint_requests: 0, time_on_task: 60, answer: 'respuesta histórica', created_at: new Date().toISOString(), ...overrides });

function fakeDb(seed = {}, failInsert = false) {
  const tables = { modules: [moduleFixture], module_steps: [stepFixture], profiles: [{ user_id: USER, grade_level: 5 }, { user_id: OTHER, grade_level: 4 }], student_step_attempts: [], student_module_progress: [], student_cognitive_profile: [], ...structuredClone(seed) };
  const db = { tables, auth: { getUser: async token => ({ data: { user: token === 'a' ? { id: USER } : token === 'b' ? { id: OTHER } : null }, error: null }) }, schema: () => db, from: table => {
    let filters = [], mode = 'select', body, single = false, bounds, conflict, orders = [];
    const query = {
      select: () => query, eq: (k, v) => { filters.push(x => x[k] === v); return query; },
      in: (k, values) => { filters.push(x => values.includes(x[k])); return query; },
      order: (key, options = {}) => { orders.push([key, options.ascending !== false]); return query; },
      range: (a, b) => { bounds = [a, b]; return query; },
      maybeSingle: () => { single = true; return query; }, single: () => { single = true; return query; },
      insert: value => { mode = 'insert'; body = value; return query; },
      upsert: (value, options) => { mode = 'upsert'; body = value; conflict = options.onConflict.split(','); return query; },
      then: (resolve, reject) => Promise.resolve().then(() => {
        if (!(table in tables)) throw new Error(`Unexpected table ${table}`);
        if (mode === 'insert') {
          if (failInsert === true || failInsert?.before) return { error: { code: 'injected_failure' }, data: null };
          const row = { ...body, attempt_id: crypto.randomUUID() }; tables[table].push(row);
          return failInsert?.after ? { error: { code: 'injected_lost_response' }, data: null } : { data: single ? row : [row], error: null };
        }
        if (mode === 'upsert') {
          const row = tables[table].find(x => conflict.every(k => x[k] === body[k]));
          if (row) Object.assign(row, body); else tables[table].push(body);
          return { data: body, error: null };
        }
        let rows = tables[table].filter(x => filters.every(f => f(x)));
        rows.sort((a, b) => { for (const [key, ascending] of orders) { const cmp = String(a[key]).localeCompare(String(b[key])); if (cmp) return ascending ? cmp : -cmp; } return 0; });
        if (bounds) rows = rows.slice(bounds[0], bounds[1] + 1);
        return { data: single ? rows[0] || null : rows, error: null };
      }).then(resolve, reject)
    }; return query;
  } };
  return db;
}
const aiStub = (item = activityFixture) => ({ chat: { completions: { create: async input => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(input?.response_format?.json_schema?.name === 'kuneo_activity_review' ? { approved: true, issue: '' } : item) } }] }) } } });
async function withServer(db, callback, content, options = {}) {
  const app = express(); app.use(express.json()); app.use('/api', require('./runtimeMetrics').middleware, apiAuth(db));
  app.use('/api', learningRouter(db, { secret: SECRET, prefetch: false, ...options, content: content || createContentService({ secret: SECRET, client: aiStub() }) }));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const call = async (path, token = 'a', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method: body ? 'POST' : 'GET', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  call.raw = (path, token = 'a', body, options = {}) => fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method: body ? 'POST' : 'GET', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), ...options });
  try { await callback(call); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('new student has zero evidence, no fabricated scores or lesson', () => {
  const data = summary([], [], []);
  assert.equal(data.hasActivity, false); assert.equal(data.lastActivity, null); assert.equal(data.overallScore, 0); assert.equal(data.recentActivity.length, 0);
  for (const score of Object.values(data.dimensions)) assert.deepEqual(score, { score: 0, count: 0 });
});
test('legacy attempts contribute real evidence and time without metadata', () => {
  const data = summary([attempt('correct'), attempt('incorrect')], [moduleFixture], [stepFixture]);
  assert.equal(data.dimensions.comprension.score, 50); assert.equal(data.studyTime.minutes, 2); assert.equal(data.attempts, 2); assert.equal(data.lastActivity.moduleId, MODULE);
});
test('a resumable lesson can have attempts with zero consolidated objectives', () => {
  const data = summary([attempt('incorrect'), attempt('correct')], [moduleFixture], [stepFixture]);
  assert.equal(data.lastActivity.progress, 0);
  assert.equal(data.lastActivity.attempts, 2);
  assert.equal(data.lastActivity.goalsCompleted, 0);
  assert.equal(data.lastActivity.goalsTotal, 1);
  assert.equal(data.lastActivity.dimensionsCompleted, 0);
  assert.equal(data.completed, 0);
});
test('objective consolidation can reach 100% while module still awaits other skills', () => {
  const data = summary([attempt('correct'), attempt('correct')], [moduleFixture], [stepFixture]);
  assert.equal(data.lastActivity.progress, 100);
  assert.equal(data.lastActivity.goalsCompleted, 1);
  assert.equal(data.lastActivity.dimensionsCompleted, 1);
  assert.equal(data.lastActivity.dimensionsTotal, 5);
  assert.equal(data.generalProgress, 0);
});
test('the cognitive average counts only evaluated skills and exposes its coverage', () => {
  const data = summary([attempt('correct')], [moduleFixture], [stepFixture]);
  assert.equal(data.overallScore, 100);
  assert.equal(data.assessedDimensions, 1);
  assert.equal(data.dimensions.razonamiento.count, 0);
  assert.equal(summary([], [], []).assessedDimensions, 0);
});
test('subject history and recent cognitive evidence deliberately use different windows', () => {
  const attempts = Array.from({ length: 30 }, (_, index) => attempt(index < 10 ? 'incorrect' : 'correct'));
  const data = summary(attempts, [moduleFixture], [stepFixture]);
  assert.equal(data.subjects.find(s => s.id === 'mathematics').score, 67);
  assert.equal(data.dimensions.comprension.score, 100);
  assert.equal(data.dimensions.comprension.count, 20);
});
test('correct responses increase evidence; hints reduce the weight', () => {
  assert.equal(dimensionScores([attempt('incorrect'), attempt('correct')]).comprension.score, 50);
  assert.equal(dimensionScores([attempt('correct', 'comprension', { hint_requests: 1 })]).comprension.score, 85);
});
test('mastery requires all objectives and all five dimensions, two unassisted successes each', () => {
  assert.equal(moduleState([stepFixture], [attempt('correct'), attempt('correct')]).complete, false);
  const evidence = DIMENSIONS.flatMap(d => [attempt('correct', d), attempt('correct', d)]);
  assert.equal(moduleState([stepFixture], evidence).complete, true);
  assert.equal(moduleState([stepFixture], [...evidence, attempt('incorrect', 'comprension')]).complete, false);
});
test('all five grade bands are mapped and invalid grades rejected', () => {
  assert.deepEqual([1, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(gradeGroup), ['1-3', '1-3', '4-5', '4-5', '6-7', '6-7', '8-9', '8-9', '10-11', '10-11']);
  assert.throws(() => gradeGroup(0)); assert.throws(() => gradeGroup(12));
});
test('activity token encrypts answers and is bound to its user and expiry', () => {
  const payload = { user_id: USER, expires_at: Date.now() + 1000, answer: 'private reference' };
  const token = seal(payload, SECRET);
  assert(!token.includes('private')); assert.deepEqual(unseal(token, SECRET, USER), payload);
  assert.throws(() => unseal(token, SECRET, OTHER)); assert.throws(() => unseal(token, 'wrong', USER));
  assert.throws(() => unseal(seal({ ...payload, expires_at: 1 }, SECRET), SECRET, USER), e => e.status === 410);
});
test('generated options must have one valid answer and distinct choices', () => {
  assert.equal(validateGenerated(activityFixture).correct_index, 0);
  assert.throws(() => validateGenerated({ ...activityFixture, correct_index: 9 }));
  assert.throws(() => validateGenerated({ ...activityFixture, options: ['same', 'same'] }));
});
test('stored activity uses the displayed question and matching answer', () => {
  const normalized = normalizeStored(stepFixture);
  assert.equal(normalized.type, 'option'); assert.deepEqual(normalized.expected.correct_options, [0]);
  assert.equal(normalizeStored({ ...stepFixture, enriched_content: { expected_answer: { type: 'option', correct_options: [4] } } }), null);
});
test('OpenAI failure chooses evaluable reserve content without changing templates', async () => {
  const service = createContentService({ secret: SECRET, client: { chat: { completions: { create: async () => { throw new Error('unavailable'); } } } } });
  const value = await service.generate({ userId: USER, profile: { grade_level: 5 }, module: moduleFixture, steps: [stepFixture], attempts: [] });
  assert.equal(value.activity.source, 'stored'); assert.equal(value.activity.question, stepFixture.content.question);
  assert.equal((await service.evaluate(service.decode(value.token, USER), '0')).result, 'correct');
  assert(!JSON.stringify(value.activity).includes('correct_options'));
});
test('repeated generated question falls back instead of showing the same generated content', async () => {
  const service = createContentService({ secret: SECRET, client: aiStub() });
  const prior = attempt('incorrect', 'razonamiento', { answer: JSON.stringify({ kuneo_activity_version: 1, question: activityFixture.question }) });
  const value = await service.generate({ userId: USER, profile: { grade_level: 5 }, module: moduleFixture, steps: [stepFixture], attempts: [prior] });
  assert.equal(value.activity.source, 'stored');
});
test('all 25 subject/grade combinations pass the correct curriculum context to generation', async () => {
  for (const subject of ['mathematics', 'language', 'natural_sciences', 'social_studies', 'english']) {
    for (const grade of [2, 4, 6, 8, 10]) {
      let context;
      const client = { chat: { completions: { create: async input => { if (input.response_format.json_schema.name === 'kuneo_activity') context = JSON.parse(input.messages.at(-1).content); return aiStub().chat.completions.create(input); } } } };
      const service = createContentService({ secret: SECRET, client });
      const value = await service.generate({ userId: USER, profile: { grade_level: grade }, module: { ...moduleFixture, subject }, steps: [stepFixture], attempts: [] });
      assert.equal(value.activity.source, 'generated'); assert.equal(context.grade, grade); assert.equal(context.grade_group, gradeGroup(grade));
    }
  }
});
test('text rubric evaluation accepts equivalent answers through structured grading', async () => {
  const service = createContentService({ secret: SECRET, client: aiStub({ result: 'correct', feedback: 'Tu razonamiento es válido.' }) });
  assert.equal((await service.evaluate({ type: 'text', expected: { type: 'rubric', answer: 'one quarter' }, question: 'Explica', dimension: 'razonamiento' }, '25 de cada 100')).result, 'correct');
});
test('failed rubric evaluation never records an invented result', async () => {
  const service = createContentService({ secret: SECRET, client: aiStub({ result: 'made-up', feedback: '' }) });
  await assert.rejects(() => service.evaluate({ type: 'text', expected: { type: 'rubric' } }, 'respuesta'), e => e.status === 503);
});
test('API rejects missing/invalid auth and spoofed user identifiers', async () => {
  await withServer(fakeDb(), async call => {
    assert.equal((await call('/learning/me', null)).status, 401);
    assert.equal((await call('/learning/me', 'invalid')).status, 401);
    assert.equal((await call(`/learning/me?userId=${OTHER}`)).status, 403);
    assert.equal((await call(`/progress/${OTHER}`)).status, 403);
  });
});
test('API reads only the authenticated student history', async () => {
  const db = fakeDb({ student_step_attempts: [attempt('correct')] });
  await withServer(db, async call => {
    assert.equal((await call('/learning/me')).body.attempts, 1);
    assert.equal((await call('/learning/me', 'b')).body.attempts, 0);
  });
});
test('history loads beyond 30 entries, has stable pages, and excludes another user', async () => {
  const evidence = Array.from({ length: 42 }, (_, index) => attempt('correct', 'comprension', { created_at: new Date(Date.UTC(2026, 4, 1, 0, index)).toISOString() }));
  const db = fakeDb({ student_step_attempts: [...evidence, attempt('correct', 'comprension', { user_id: OTHER })] });
  await withServer(db, async call => {
    const first = await call('/learning/history?limit=15');
    assert.equal(first.status, 200); assert.equal(first.body.total, 42); assert.equal(first.body.items.length, 15); assert.equal(first.body.nextOffset, 15);
    const second = await call(`/learning/history?limit=15&offset=15&before=${encodeURIComponent(first.body.before)}`);
    const third = await call(`/learning/history?limit=15&offset=30&before=${encodeURIComponent(first.body.before)}`);
    assert.equal(third.body.items.length, 12); assert.equal(third.body.nextOffset, null);
    assert.equal(new Set([...first.body.items, ...second.body.items, ...third.body.items].map(a => a.id)).size, 42);
    const empty = await call('/learning/history?offset=100');
    assert.equal(empty.body.items.length, 0); assert.equal(empty.body.nextOffset, null);
  });
});
test('history filters subject and dimension, validates input and respects its snapshot date', async () => {
  const db = fakeDb({ student_step_attempts: [attempt('correct', 'razonamiento', { created_at: '2026-05-01T00:00:00Z' }), attempt('incorrect', 'comprension', { created_at: '2026-06-01T00:00:00Z' })] });
  await withServer(db, async call => {
    assert.equal((await call('/learning/history?subject=mathematics&dimension=razonamiento')).body.total, 1);
    assert.equal((await call('/learning/history?subject=english')).body.total, 0);
    assert.equal((await call('/learning/history?before=2026-05-15T00%3A00%3A00Z')).body.total, 1);
    for (const query of ['limit=0', 'limit=100', 'offset=-1', 'dimension=unknown', 'subject=unknown', 'before=invalid']) assert.equal((await call(`/learning/history?${query}`)).status, 400);
  });
});
test('attempt detail returns its saved question and response only to its owner', async () => {
  const evidence = attempt('partial', 'razonamiento', { answer: JSON.stringify({ kuneo_activity_version: 1, question: 'Explica por qué un cuarto equivale a dos octavos.', submitted_answer: 'Multipliqué ambas partes por dos.', feedback: 'Explica qué se mantiene igual.', source: 'generated', options: [] }) });
  await withServer(fakeDb({ student_step_attempts: [evidence] }), async call => {
    const detail = await call(`/learning/attempts/${evidence.attempt_id}`);
    assert.equal(detail.status, 200); assert.equal(detail.body.answer, 'Multipliqué ambas partes por dos.'); assert.equal(detail.body.source, 'generated'); assert(detail.body.question);
    assert.equal((await call(`/learning/attempts/${evidence.attempt_id}`, 'b')).status, 404);
    assert.equal((await call(`/learning/attempts/${evidence.attempt_id}`, null)).status, 401);
    assert.equal((await call('/learning/attempts/invalid')).status, 400);
  });
});
test('legacy attempt detail does not invent a missing question or feedback', async () => {
  const evidence = attempt('correct');
  await withServer(fakeDb({ student_step_attempts: [evidence] }), async call => {
    const response = await call(`/learning/attempts/${evidence.attempt_id}`);
    assert.equal(response.body.question, null); assert.equal(response.body.feedback, null); assert.equal(response.body.source, 'historical');
    assert.equal(response.body.answer, 'respuesta histórica');
  });
});
test('answer persists, initializes absent aggregates, and a repeated submission is idempotent', async () => {
  const db = fakeDb();
  await withServer(db, async call => {
    const { body: activity } = await call(`/learning/modules/${MODULE}/activity`);
    assert.equal(activity.activity.source, 'generated');
    assert.equal((await call('/learning/answers', 'b', { token: activity.token, answer: '0' })).status, 403);
    const body = { token: activity.token, answer: '0', time_on_task: 30 };
    const responses = await Promise.all([call('/learning/answers', 'a', body), call('/learning/answers', 'a', body)]);
    assert(responses.every(r => r.status === 200));
    assert.equal(db.tables.student_step_attempts.length, 1);
    assert.equal(db.tables.student_module_progress[0].total_attempts, 1);
    assert.equal(db.tables.student_cognitive_profile[0].comprension, 100);
    assert.equal((await call('/learning/me')).body.attempts, 1);
  });
});
test('hint is recorded in the token and prevents an assisted response from mastering an objective', async () => {
  const db = fakeDb();
  await withServer(db, async call => {
    const { body: activity } = await call(`/learning/modules/${MODULE}/activity`);
    const { body: hint } = await call('/learning/hint', 'a', { token: activity.token });
    assert(hint.hint);
    // Even a client replaying the pre-hint token must retain the assistance.
    const response = await call('/learning/answers', 'a', { token: activity.token, answer: '0' });
    assert.equal(response.status, 200); assert.equal(db.tables.student_step_attempts[0].hint_requests, 1);
    assert.equal(db.tables.student_cognitive_profile[0].comprension, 85);
  });
});
test('failed persistence returns an error and never claims success', async () => {
  await withServer(fakeDb({}, true), async call => {
    const { body: activity } = await call(`/learning/modules/${MODULE}/activity`);
    const response = await call('/learning/answers', 'a', { token: activity.token, answer: '0' });
    assert.equal(response.status, 500); assert(!response.body.success);
  });
});
const supportFixture = { title: 'Parte y total', body: 'Distingue la parte que se selecciona y el conjunto completo.', insight: 'El total incluye todas las partes iguales.', visual: { kind: 'table', caption: 'Organiza la información sin resolverla.', headers: ['Dato', 'Qué representa'], rows: [['Parte', 'Elementos seleccionados'], ['Total', 'Todos los elementos']], steps: [] } };
test('help validates data-only visuals and rejects incompatible table dimensions',()=>{
 const {validateSupport}=require('./learningSupport');
 assert.equal(validateSupport(supportFixture).visual.kind,'table');
 assert.throws(()=>validateSupport({...supportFixture,visual:{...supportFixture.visual,kind:'svg'}}));
 assert.equal(validateSupport({...supportFixture,visual:{...supportFixture.visual,rows:[['missing cell']]}}).visual.kind,'none');
});
test('support generation receives grade/curriculum but never question, expected solution or rubric',async()=>{
 let context, calls=0;
 const client={chat:{completions:{create:async input=>{calls++;context=JSON.parse(input.messages.at(-1).content);return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(supportFixture)}}]};}}}};
 const service=createContentService({secret:SECRET,client});
 const payload={question:'Una pregunta concreta',grade_group:'4-5',subject:'mathematics',dimension:'comprension',hint:'Compara',expected:{answer:'SECRET_ANSWER'},rubric:'PRIVATE_RUBRIC'};
 assert.equal((await service.support(payload,1)).level,1);assert.equal(calls,0);
 assert.equal((await service.support(payload,2)).card.title,supportFixture.title);
 assert.equal(context.grade_group,'4-5');assert.equal(context.question,undefined);
 assert.equal(JSON.stringify(context).includes('SECRET_ANSWER'),false);assert.equal(JSON.stringify(context).includes('PRIVATE_RUBRIC'),false);
});
test('progressive help is cached, owner bound, counted once per level and cannot follow an answer',async()=>{
 const db=fakeDb();let calls=0;
 const service=createContentService({secret:SECRET,client:aiStub()});
 service.support=async(payload,level)=>{calls++;return {level,hint:payload.hint,card:supportFixture};};
 await withServer(db,async call=>{
 const {body:activity}=await call(`/learning/modules/${MODULE}/activity`);
 assert.equal((await call('/learning/hint','a',{token:activity.token,level:3})).status,400);
 assert.equal((await call('/learning/hint','b',{token:activity.token})).status,403);
 await call('/learning/hint','a',{token:activity.token,level:1});
 const second=await call('/learning/hint','a',{token:activity.token,level:2});assert.equal(second.body.hints_used,2);
 const again=await call('/learning/hint','a',{token:activity.token,level:2});assert.equal(again.body.hints_used,2);assert.equal(calls,1);
 await call('/learning/hint','a',{token:activity.token,level:3});assert.equal(calls,2);
 const response=await call('/learning/answers','a',{token:activity.token,answer:'0'});assert.equal(response.status,200);
 assert.equal(db.tables.student_step_attempts[0].hint_requests,3);
 assert.equal((await call('/learning/hint','a',{token:second.body.token,level:1})).status,409);
 },service);
});
test('failed additional help keeps activity available and does not count nonexistent assistance',async()=>{
 const db=fakeDb(),service=createContentService({secret:SECRET,client:aiStub()});
 service.support=async()=>{throw Object.assign(new Error('unavailable'),{status:503});};
 await withServer(db,async call=>{
 const {body:activity}=await call(`/learning/modules/${MODULE}/activity`);
 await call('/learning/hint','a',{token:activity.token});
 assert.equal((await call('/learning/hint','a',{token:activity.token,level:2})).status,503);
 await call('/learning/answers','a',{token:activity.token,answer:'0'});
 assert.equal(db.tables.student_step_attempts[0].hint_requests,1);
 },service);
});
test('prefetch starts after persistence, uses new evidence and survives retries of the previous answer',async()=>{
 const db=fakeDb();let generations=0,seenAttempts;
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:async input=>aiStub({...activityFixture,question:`${activityFixture.question} Variación ${generations}.`}).chat.completions.create(input)}}}});const original=service.generate;
 service.generate=async input=>{generations++;if(generations>1)seenAttempts=input.attempts.length;return original(input);};
 await withServer(db,async call=>{
 const {body:activity}=await call(`/learning/modules/${MODULE}/activity`);
 const body={token:activity.token,answer:'0'};assert.equal((await call('/learning/answers','a',body)).status,200);
 const next=await call(`/learning/modules/${MODULE}/activity`);assert.equal(next.status,200);assert.notEqual(next.body.activity.id,activity.activity.id);
 assert.equal(require('./runtimeMetrics').snapshot().filter(row=>row.operation==='GET:/learning/modules/:moduleId/activity').at(-1).tags.activity_delivery,'prepared');
 assert.equal(seenAttempts,1);assert.equal(generations,2);
 await call('/learning/answers','a',body);
 assert.equal((await call(`/learning/modules/${MODULE}/activity`)).body.activity.id,next.body.activity.id);
 assert.equal(require('./runtimeMetrics').snapshot().filter(row=>row.operation==='GET:/learning/modules/:moduleId/activity').at(-1).tags.activity_delivery,'published_cache');
 assert.equal(generations,2);assert.equal(db.tables.student_step_attempts.length,1);
 },service,{prefetch:true,lookahead:false});
});
test('example quality rejection is retried once, then fails without returning an unchecked example',async()=>{
 let generated=0,reviews=0;
 const example={...supportFixture,example_problem:'Cuatro frutas y cinco frutas se juntan. ¿Cuántas hay?',example_steps:['Junta las frutas.','Cuenta el grupo completo.'],example_result:'Hay nueve frutas.'};
 const client={chat:{completions:{create:async input=>{
 const review=input.response_format.json_schema.name==='kuneo_support_review';if(review)reviews++;else generated++;
 return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(review?{approved:false,issue:'El ejemplo tiene un dato no justificado.'}:example)}}]};
 }}}};
 const service=createContentService({secret:SECRET,client});
 await assert.rejects(service.support({question:'Pregunta original de práctica.',subject:'mathematics',grade_group:'1-3',dimension:'comprension'},3),e=>e.status===503);
 assert.equal(generated,2);assert.equal(reviews,2);
});
test('Spanish subjects reject English passages while English practice remains allowed',()=>{
 const {enforceSupportLanguage}=require('./learningSupport');
 const card={...supportFixture,example_problem:'Lily arrived at the park with a big smile. She saw her friends and they quickly joined her.',example_steps:['Look at her expression when she arrived at the park.'],example_result:'She was happy because her friends were there.'};
 for(const subject of ['language','mathematics','natural_sciences','social_studies'])assert.throws(()=>enforceSupportLanguage(card,subject),/Invalid support language/);
 assert.doesNotThrow(()=>enforceSupportLanguage(card,'english'));
 assert.doesNotThrow(()=>enforceSupportLanguage({...supportFixture,example_problem:'Ana sonríe al ver a sus amigos. ¿Qué puedes inferir de su estado de ánimo?'},'language'));
});
test('shared curriculum words, coefficients and step numbers do not reject a distinct example',async()=>{
 const example={...supportFixture,example_problem:'En dos bolsas distintas hay 2 canicas y 5 canicas. ¿Cuántas hay al juntar las bolsas?',example_steps:['1. Junta las dos bolsas.','2. Suma las cantidades: 2+5=7.'],example_result:'Hay 7 canicas.'};
 const client={chat:{completions:{create:async input=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(input.response_format.json_schema.name==='kuneo_support_review'?{approved:true,issue:''}:example)}}]})}}};
 const service=createContentService({secret:SECRET,client});
 const response=await service.support({question:'Una expresión representa 2 lápices y 3 lápices. Escribe la expresión y el total.',subject:'mathematics',grade_group:'1-3',dimension:'representacion'},3);
 assert.equal(response.card.example_result,'Hay 7 canicas.');
});
test('help resolves subject and curriculum for tokens issued before subject metadata existed',async()=>{
 const db=fakeDb({modules:[{...moduleFixture,subject:'language',title:'Interpretar textos en español'}]});
 const service=createContentService({secret:SECRET,client:aiStub()});let received;
 service.support=async(payload,level)=>{received=payload;return {level,hint:payload.hint,card:supportFixture};};
 const legacy=seal({user_id:USER,module_id:MODULE,step_id:STEP,activity_id:crypto.randomUUID(),question:'Lee un relato.',hint:'Busca pistas en el texto.',expires_at:Date.now()+60000},SECRET);
 await withServer(db,async call=>{
 await call('/learning/hint','a',{token:legacy,level:1});
 assert.equal((await call('/learning/hint','a',{token:legacy,level:2})).status,200);
 assert.equal(received.subject,'language');assert.equal(received.support_context.topic,'Interpretar textos en español');
 },service);
});
test('example conclusions reject duplicated tables and graphics without rejecting inline mathematics',()=>{
 const {isProseResult,validateSupport}=require('./learningSupport');
 for(const value of ['La tabla quedó así: | Tiempo | Temperatura | |-----------|----------| | Inicio | 20 |', '| Dato | Valor |\n| --- | --- |\n| x | 2 |','<svg><path /></svg>','![Gráfico](https://example.com/chart.png)','```mermaid\ngraph TD;A-->B\n```']){
 assert.equal(isProseResult(value),false);
 assert.throws(()=>validateSupport({...supportFixture,example_problem:'Un problema autocontenido de ejemplo',example_steps:['Primer paso.','Segundo paso.'],example_result:value}),/Invalid support result/);
 }
 assert.equal(isProseResult('La temperatura aumentó de 20 °C a 33 °C; por eso se calentó con el tiempo.'),true);
 assert.equal(isProseResult('La forma equivalente es 2a + 24. Además, |x| indica valor absoluto.'),true);
});
test('deterministic linear grading accepts equivalent expressions despite a wrong reference',()=>{
 const {parseLinear,gradeLinear}=require('./learningLinear');
 for(const [question,answer] of [['Simplifica la expresión algebraica: 6(a + 2) - 4(a - 3). ¿Cuál es una forma equivalente?','2a+24'],['Simplifica la expresión algebraica: 7(2p - 3) - 5(p + 4). ¿Cuál es una forma simplificada?','9p-41']]){
 assert.equal(gradeLinear({subject:'mathematics',question},answer).result,'correct');
 }
 assert.equal(gradeLinear({subject:'mathematics',question:'Simplifica la expresión: 6(a+2)-4(a-3). ¿Cuál es equivalente?'},'2a+26').result,'incorrect');
 assert.equal(parseLinear('x*x'),null);assert.equal(parseLinear('process.exit()'),null);assert.equal(parseLinear('x+y'),null);
 assert.equal(gradeLinear({subject:'mathematics',question:'Simplifica la expresión: 6(a+2)-4(a-3). Explica tus pasos.'},'2a+24'),null);
});
test('four generated formats validate their answers; duplicate selections cannot gain credit',async()=>{
 const {desiredFormat}=require('./learningFormats');
 assert.deepEqual([0,1,2,3].map(n=>desiredFormat(Array(n).fill({}))),['option','text','multiple_select','matching']);
 const multi={...activityFixture,type:'multiple_select',options:['Evaporación','Fusión','Combustión'],correct_indices:[0,1]};
 validateGenerated(multi);
 assert.throws(()=>validateGenerated({...multi,correct_indices:[0,0]}));
 const matching={...activityFixture,type:'matching',left_items:['Sólido','Líquido'],right_items:['Fluye','Forma propia'],correct_pairs:[[0,1],[1,0]]};
 validateGenerated(matching);assert.throws(()=>validateGenerated({...matching,correct_pairs:[[0,0],[1,0]]}));
 const service=createContentService({secret:SECRET,client:aiStub()});
 assert.equal((await service.evaluate({type:'multiple_select',options:multi.options,expected:{correct_options:[0,1]}},'[1,0]')).result,'correct');
 await assert.rejects(service.evaluate({type:'multiple_select',options:multi.options,expected:{correct_options:[0,1]}},'[0,0]'),e=>e.status===400);
 assert.equal((await service.evaluate({type:'matching',left_items:matching.left_items,right_items:matching.right_items,expected:{correct_pairs:matching.correct_pairs}},'[[1,0],[0,1]]')).result,'correct');
 await assert.rejects(service.evaluate({type:'matching',left_items:matching.left_items,right_items:matching.right_items,expected:{correct_pairs:matching.correct_pairs}},'[[0,1]]'),e=>e.status===400);
});
test('partial JSON previews expose only allowed public fields through every escape boundary',()=>{
 const {publicDraft}=require('./learningStream');
 const question='Lee "el texto".\n¿Por qué cambia la temperatura?';
 const raw=JSON.stringify({expected_text:'SECRET',correct_indices:[1,2],question,rubric:'SECRET_RUBRIC'});
 for(let i=0;i<=raw.length;i++){
 const draft=publicDraft(raw.slice(0,i),['question']);
 assert.deepEqual(Object.keys(draft).filter(k=>k!=='question'),[]);
 if(draft.question)assert(question.startsWith(draft.question));
 assert(!JSON.stringify(draft).includes('SECRET'));
 }
 assert.equal(publicDraft(raw,['question']).question,question);
});
test('streamed activity withholds all content until the reviewed final activity',async()=>{
 const privateItem={...activityFixture,expected_text:'SECRET_EXPECTED',rubric:'SECRET_RUBRIC'};
 const client={chat:{completions:{create:async input=>input.response_format.json_schema.name==='kuneo_activity_review'?{choices:[{finish_reason:'stop',message:{content:JSON.stringify({approved:true,issue:''})}}]}:({async *[Symbol.asyncIterator](){const raw=JSON.stringify(privateItem);for(let i=0;i<raw.length;i+=9)yield {choices:[{delta:{content:raw.slice(i,i+9)}}]};yield {choices:[{delta:{},finish_reason:'stop'}]};}})}}};
 await withServer(fakeDb(),async call=>{
 const response=await call.raw(`/learning/modules/${MODULE}/activity?stream=1`);
 assert.equal(response.status,200);assert(response.headers.get('content-type').includes('ndjson'));
 const events=(await response.text()).trim().split('\n').map(JSON.parse);
 assert(events.some(e=>e.type==='status'));
 assert(events.slice(0,-1).every(e=>e.type==='status'));
 assert(!JSON.stringify(events.slice(0,-1)).includes(privateItem.question));
 assert.equal(events.at(-1).type,'done');
 assert.equal(events.at(-1).data.activity.question,privateItem.question);
 assert(!JSON.stringify(events).includes('SECRET_EXPECTED'));assert(!JSON.stringify(events).includes('SECRET_RUBRIC'));
 },createContentService({secret:SECRET,client}));
});
test('stream failure has a recoverable terminal error and does not persist a fake attempt',async()=>{
 const db=fakeDb();const service=createContentService({secret:SECRET,client:aiStub()});
 service.generate=async({onProgress})=>{onProgress({question:'Borrador inicial de la pregunta'});throw Object.assign(new Error('Generación interrumpida'),{status:503});};
 await withServer(db,async call=>{
 const response=await call.raw(`/learning/modules/${MODULE}/activity?stream=1`);
 const events=(await response.text()).trim().split('\n').map(JSON.parse);
 assert.equal(events.at(-1).type,'error');assert.equal(events.at(-1).data.status,503);
 const metric=require('./runtimeMetrics').snapshot().filter(row=>row.operation==='GET:/learning/modules/:moduleId/activity').at(-1);
 assert.equal(metric.status,200);assert.equal(metric.tags.terminal_status,'503');assert.equal(metric.tags.stream_outcome,'error');
 assert(!JSON.stringify(events).includes('Borrador inicial'));assert(events.every(e=>e.type!=='preview'));
 assert.equal(db.tables.student_step_attempts.length,0);
 },service);
});
test('practice summary uses owned attempts and prepares just one restart after persistence',async()=>{
 const db=fakeDb({student_step_attempts:[attempt('incorrect','comprension',{user_id:OTHER})]});let calls=0;
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:input=>aiStub({...activityFixture,question:`${activityFixture.question} Caso ${calls}.`}).chat.completions.create(input)}}}});const generate=service.generate;service.generate=input=>{calls++;return generate(input);};
 await withServer(db,async call=>{
 const {body:activity}=await call(`/learning/modules/${MODULE}/activity`);
 const response=await call('/learning/answers','a',{token:activity.token,answer:'0',finish_session:true});
 assert(response.body.attemptId);
 assert.equal(calls,1);
 const summary=await call('/learning/session-summary','a',{moduleId:MODULE,attemptIds:[response.body.attemptId]});
 assert.equal(summary.body.total,1);assert.equal(summary.body.correct,1);
 const prepared=await call(`/learning/modules/${MODULE}/activity`);
 assert.equal(calls,2);assert.notEqual(prepared.body.activity.id,activity.activity.id);
 assert.equal(require('./runtimeMetrics').snapshot().filter(row=>row.operation==='GET:/learning/modules/:moduleId/activity').at(-1).tags.activity_delivery,'prepared');
 await call('/learning/session-summary','a',{moduleId:MODULE,attemptIds:[response.body.attemptId]});
 assert.equal((await call(`/learning/modules/${MODULE}/activity`)).body.activity.id,prepared.body.activity.id);assert.equal(calls,2);
 assert.equal((await call('/learning/session-summary','b',{moduleId:MODULE,attemptIds:[response.body.attemptId]})).status,404);
 assert.equal((await call('/learning/session-summary','a',{moduleId:MODULE,attemptIds:[]})).body.total,0);
 assert.equal((await call('/learning/session-summary','a',{moduleId:MODULE,attemptIds:[response.body.attemptId,response.body.attemptId]})).status,400);
 },service,{prefetch:true,lookahead:false});
});
test('activity key review prevents publishing a semantically rejected question',async()=>{
 const db=fakeDb();let calls=0;
 const client={chat:{completions:{create:async input=>{const review=input.response_format.json_schema.name==='kuneo_activity_review';if(review)calls++;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(review?{approved:false,issue:'Hay dos opciones verdaderas en selección única.'}:activityFixture)}}]};}}}};
 await withServer(db,async call=>{
 const {body:activity}=await call(`/learning/modules/${MODULE}/activity`);
 assert.equal(calls,2);assert.equal(activity.activity.source,'stored');
 assert.notEqual(activity.activity.question,activityFixture.question);
 },createContentService({secret:SECRET,client}));
});
test('science support rejects a known false generalization about evaporation',()=>{
 const {enforceScienceClaims}=require('./learningSupport');
 assert.throws(()=>enforceScienceClaims({body:'El jugo se evapora y su temperatura se mantiene constante durante la evaporación.'},'natural_sciences'),/Invalid support science/);
 assert.doesNotThrow(()=>enforceScienceClaims({body:'La evaporación puede enfriar un líquido; no implica temperatura constante.'},'natural_sciences'));
});
test('client streaming decoder handles UTF-8 byte boundaries and interrupted streams',async()=>{
 const {readLearningStream}=await import('../client/src/utils/readLearningStream.js');
 const bytes=new TextEncoder().encode(JSON.stringify({type:'preview',data:{question:'¿Qué ocurrió con el hielo?'}})+'\n'+JSON.stringify({type:'done',data:{token:'encrypted',activity:{question:'¿Qué ocurrió con el hielo?'}}})+'\n');
 const response=new Response(new ReadableStream({start(controller){for(const byte of bytes)controller.enqueue(new Uint8Array([byte]));controller.close();}}));
 const previews=[];const final=await readLearningStream(response,x=>previews.push(x));
 assert.equal(previews[0].question,'¿Qué ocurrió con el hielo?');assert.equal(final.token,'encrypted');
 await assert.rejects(readLearningStream(new Response(JSON.stringify({type:'preview',data:{question:'Borrador'}})+'\n')),e=>e.status===503);
 await assert.rejects(readLearningStream(new Response(JSON.stringify({type:'error',data:{error:'Reintenta la ayuda',status:503}})+'\n')),e=>e.status===503&&e.message==='Reintenta la ayuda');
});
test('arithmetic matching columns are computed exactly by the server',()=>{
 const {arithmeticMatchingPlan}=require('./learningFormats');
 for(let sample=0;sample<12;sample++){
 const plan=arithmeticMatchingPlan({subject:'mathematics',learning_objective:'Sumar cantidades de objetos'},2);
 assert.equal(new Set(plan.right_items).size,3);
 for(const [left,right] of plan.correct_pairs){const numbers=plan.left_items[left].split('+').map(Number);assert.equal(Number(plan.right_items[right]),numbers[0]+numbers[1]);}
 }
 assert.equal(arithmeticMatchingPlan({subject:'language',learning_objective:'Sumar'},2),null);
 assert.equal(arithmeticMatchingPlan({subject:'mathematics',learning_objective:'Sumar fracciones'},7),null);
});
test('expired support time budget does not call the provider or consume an assistance level',async()=>{
 let calls=0;const service=createContentService({secret:SECRET,client:{chat:{completions:{create:async()=>{calls++;}}}}});
 await assert.rejects(service.support({question:'Pregunta de ejemplo',subject:'language'},2,0,'',undefined,Date.now()-1),e=>e.status===503);
 assert.equal(calls,0);
});
test('closed feedback explains chosen, omitted and incorrect alternatives and matching pairs', async () => {
 const service = createContentService({secret:SECRET,client:aiStub()});
 const payload={type:'option',options:['8','6'],expected:{correct_options:[0]},explanation:'3 + 5 = 8.',option_explanations:['Se suman las ocho unidades.','Faltan dos unidades.']};
 const wrong=await service.evaluate(payload,'1');
 assert.equal(wrong.result,'incorrect');assert.equal(wrong.feedbackDetails[1].selected,'La elegiste');
 assert.equal(wrong.feedbackDetails[1].explanation,'Faltan dos unidades.');
 assert.equal((await service.evaluate(payload,'0')).result,'correct');
 const multi=await service.evaluate({...payload,type:'multiple_select',options:['A','B','C'],expected:{correct_options:[0,1]},option_explanations:['Razón A','Razón B','Error C']},'[0,2]');
 assert.equal(multi.feedbackDetails[1].correct,false);assert.equal(multi.feedbackDetails[1].selected,'No la elegiste');
 const pairs=await service.evaluate({type:'matching',left_items:['3 + 5','2 + 4'],right_items:['6','8'],expected:{correct_pairs:[[0,1],[1,0]]},pair_explanations:['3 + 5 = 8.','2 + 4 = 6.']},'[[0,0],[1,1]]');
 assert.equal(pairs.result,'incorrect');assert.equal(pairs.feedbackDetails[0].selected,'6');assert.equal(pairs.feedbackDetails[0].expected,'8');assert.equal(pairs.feedbackDetails[0].explanation,'3 + 5 = 8.');
});

test('rationales are private before submission and persist through duplicates and history', async () => {
 const item={...activityFixture,learning_focus:'Fracción de un conjunto',option_explanations:activityFixture.options.map((_,i)=>`EXPLICACION_PRIVADA_${i}`),pair_explanations:[]};
 await withServer(fakeDb(),async call=>{
  const activity=(await call(`/learning/modules/${MODULE}/activity`)).body;
  assert.equal(JSON.stringify(activity).includes('EXPLICACION_PRIVADA'),false);
  const body={token:activity.token,answer:'0',finish_session:true};
  const first=await call('/learning/answers','a',body);
  assert.match(first.body.feedbackDetails[0].explanation,/EXPLICACION_PRIVADA/);
  const duplicate=await call('/learning/answers','a',body);
  assert.deepEqual(duplicate.body.feedbackDetails,first.body.feedbackDetails);
  const detail=await call(`/learning/attempts/${first.body.attemptId}`);
  assert.deepEqual(detail.body.feedbackDetails,first.body.feedbackDetails);
 },createContentService({secret:SECRET,client:aiStub(item)}));
});

test('coaching uses actual saved feedback and rejects invented or contradictory evidence', async () => {
 const {practiceSummary,validateCoaching}=require('./learningSession');
 const attempts=[{attempt_id:'a',result:'correct',answer:JSON.stringify({kuneo_activity_version:1,question:'¿Por qué se derrite el hielo?',learning_focus:'Transferencia de calor',submitted_answer:'El plato transfiere calor.',feedback:'Relacionaste la energía con la fusión.'})},{attempt_id:'b',result:'partial',answer:JSON.stringify({kuneo_activity_version:1,question:'Explica la comprobación.',feedback:'Falta comprobar con los datos.'})}];
 const module={id:MODULE,title:'Calor',subject:'natural_sciences'};
 const fallback=practiceSummary(attempts,module);
 assert.match(fallback.strengths[0],/fusión/);assert.match(fallback.improvements[0],/comprobar/);
 const valid={overview:'Relacionaste el calor con el cambio de estado.',strengths:[{text:'Explicaste el intercambio de energía.',attemptIds:['a']}],improvements:[{text:'Comprueba con los datos.',attemptIds:['b']}],nextSteps:[{text:'Explica qué pasa si cambias la temperatura del plato.',attemptIds:['a']}]};
 validateCoaching(valid,attempts);
 assert.throws(()=>validateCoaching({...valid,strengths:[{text:'Algo inventado',attemptIds:['x']}]},attempts));
 assert.throws(()=>validateCoaching({...valid,strengths:[{text:'Todo dominado',attemptIds:['b']}]},attempts));
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(valid)}}]})}}}});
 const summary=await service.summarize(attempts,module);
 assert.equal(summary.strengths[0],valid.strengths[0].text);assert.equal(summary.correct,1);
});

test('legacy math normalizes nested fractions and roots while preserving delimited math and code', async () => {
 const {normalizeEducationalText:normalize}=await import('../client/src/utils/educationalText.js');
 assert.equal(normalize(String.raw`\(\sqrt{50} + \sqrt{18}\)`),String.raw`$\sqrt{50} + \sqrt{18}$`);
 assert.equal(normalize(String.raw`Usa \frac{\sqrt{a}}{b} y \times.`),String.raw`Usa $\frac{\sqrt{a}}{b}$ y $\times$.`);
 const code=String.raw`$\sqrt{2}$ y `+'`'+String.raw`\times`+'`';
 assert.equal(normalize(code),code);assert.equal(normalize('Cuesta 20 pesos.'),'Cuesta 20 pesos.');
});

test('matching presentation shuffles and remaps keys without changing meanings or explanations', async () => {
 const {shuffleMatching}=require('./learningFormats');
 const service=createContentService({secret:SECRET,client:aiStub()});
 for(const n of [2,3,4,5]) {
  for(const offset of [0,1]) {
   const item={type:'matching',left_items:Array.from({length:n},(_,i)=>`Caso ${i}`),right_items:Array.from({length:n},(_,i)=>`Resultado ${i}`),expected:{correct_pairs:Array.from({length:n},(_,i)=>[i,(i+offset)%n])},pair_explanations:Array.from({length:n},(_,i)=>`Justificación ${i}`)};
   const original=structuredClone(item);
   // A fixed RNG also exercises the bounded fallback for unlucky permutations.
   const shuffled=shuffleMatching(item,()=>0);
   assert.deepEqual(item,original);
   for(const [left,right] of shuffled.expected.correct_pairs) {
    assert.notEqual(left,right);
    assert.equal(shuffled.right_items[right],original.right_items[original.expected.correct_pairs[left][1]]);
   }
   const result=await service.evaluate(shuffled,JSON.stringify(shuffled.expected.correct_pairs));
   assert.equal(result.result,'correct');assert.equal(result.feedbackDetails[0].explanation,'Justificación 0');
   assert.equal((await service.evaluate(shuffled,JSON.stringify(Array.from({length:n},(_,i)=>[i,i])))).result,'incorrect');
  }
 }
});

test('missing graphs and tables are rejected but self-contained tables and plotting proposals remain valid', () => {
 const {validatePresentation}=require('./learningPresentation');
 assert.throws(()=>validatePresentation({question:'Observa la ecuación 7x-21=0 y su gráfica en el plano cartesiano. Explica la relación.'}),/Invalid activity presentation/);
 assert.throws(()=>validatePresentation({question:'Observa la siguiente tabla con ecuaciones y sus gráficas simplificadas. Marca las afirmaciones.'}),/Invalid activity presentation/);
 assert.throws(()=>validatePresentation({question:'La siguiente tabla muestra las horas de práctica y sus puntajes. ¿Cuál afirmación es correcta?'}),/Invalid activity presentation/);
 assert.doesNotThrow(()=>validatePresentation({question:'En una huerta registraron el crecimiento. Observa la tabla y explica cómo representarías estos datos.\n\n| Día | Altura |\n| --- | --- |\n| 1 | 5 cm |\n| 2 | 7 cm |'}));
 assert.doesNotThrow(()=>validatePresentation({question:'En el colegio venden jugos. Explica cómo representarías gráficamente el dinero reunido según la cantidad vendida.'}));
});

test('generated and reserve matching both expose a stable shuffled presentation with a private valid key', async () => {
 const item={...activityFixture,type:'matching',left_items:['A','B','C'],right_items:['Uno','Dos','Tres'],correct_pairs:[[0,0],[1,1],[2,2]]};
 for(const mode of ['generated','stored']) {
  const service=createContentService({secret:SECRET,mode,client:aiStub(item)});
  const module={id:MODULE,title:'Aplicación',subject:'language'};
  const steps=[{id:STEP,module_id:MODULE,content:{},enriched_content:{question:item.question,type:'matching',left_items:item.left_items,right_items:item.right_items,expected_answer:{type:'matching',correct_pairs:item.correct_pairs}}}];
  const data=await service.generate({userId:'a',profile:{grade_level:8},module,steps,attempts:[]});
  const payload=service.decode(data.token,'a');
  assert.deepEqual(data.activity.right_items,payload.right_items);
  assert(payload.expected.correct_pairs.every(([a,b])=>a!==b));
  assert.equal((await service.evaluate(payload,JSON.stringify(payload.expected.correct_pairs))).result,'correct');
  assert.equal(data.activity.expected,undefined);
 }
});

test('generation failures never publish drafts and record private-safe diagnostic categories', async () => {
 const {capture}=require('./runtimeMetrics');
 const raw=value=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
 const failures=[
  ['network',async()=>{throw Object.assign(new Error('PRIVATE_PROVIDER_DETAILS'),{code:'ECONNRESET'});}],
  ['rate_limit',async()=>{throw Object.assign(new Error('PRIVATE_PROVIDER_DETAILS'),{status:429});}],
  ['provider_unavailable',async()=>{throw Object.assign(new Error('PRIVATE_PROVIDER_DETAILS'),{status:503});}],
  ['incomplete',async()=>({choices:[{finish_reason:'length',message:{content:'{"question":"PRIVATE_DRAFT'}}]})],
  ['refusal',async()=>({choices:[{finish_reason:'stop',message:{refusal:'PRIVATE_PROVIDER_DETAILS'}}]})],
  ['contract',async()=>({choices:[{finish_reason:'stop',message:{content:'{"question":'}}]})],
  ['network',async()=>({async *[Symbol.asyncIterator](){yield {choices:[{delta:{content:'{"question":"PRIVATE_INTERRUPTED_DRAFT'}}]};throw Object.assign(new Error('PRIVATE_PROVIDER_DETAILS'),{code:'ECONNRESET'});}})],
  ['timeout',async input=>input.response_format.json_schema.name==='kuneo_activity_review'?Promise.reject(Object.assign(new Error('PRIVATE_PROVIDER_DETAILS'),{name:'TimeoutError'})):raw(activityFixture)],
  ['review_rejected',async input=>raw(input.response_format.json_schema.name==='kuneo_activity_review'?{approved:false,issue:'PRIVATE_REJECTED_REVIEW'}:activityFixture)]
 ];
 for(const [expected,create] of failures) {
  const service=createContentService({secret:SECRET,client:{chat:{completions:{create}}}}), previews=[];
  const {value,metrics}=await capture('synthetic_failure',()=>service.generate({userId:USER,profile:{grade_level:5},module:moduleFixture,steps:[stepFixture],attempts:[],onProgress:event=>previews.push(event)}));
  assert.equal(value.activity.source,'stored');assert.equal(metrics.tags.generation_outcome,'reserve');
  assert.equal(metrics.tags.generation_failure_final||metrics.tags.generation_failure_initial,expected);
  assert(previews.every(event=>Object.keys(event).every(key=>key==='phase')));
  assert(!JSON.stringify({previews,metrics,value}).includes('PRIVATE_'));
 }
});

test('repair success publishes only the final reviewed question and returns stable cached identity',async()=>{
 let generations=0,reviews=0;
 const client={chat:{completions:{create:async input=>{
  const review=input.response_format.json_schema.name==='kuneo_activity_review';
  const value=review?{approved:++reviews>1,issue:'PRIVATE_REJECTED_REVIEW'}:{...activityFixture,question:++generations===1?'PRIVATE_REJECTED_QUESTION':activityFixture.question};
  return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]};
 }}}};
 await withServer(fakeDb(),async call=>{
  const response=await call.raw(`/learning/modules/${MODULE}/activity?stream=1`);
  const events=(await response.text()).trim().split('\n').map(JSON.parse);
  assert.equal(generations,2);assert.equal(reviews,2);assert(events.slice(0,-1).every(e=>e.type==='status'));
  assert(!JSON.stringify(events).includes('PRIVATE_'));
  const final=events.at(-1).data;assert.equal(final.activity.question,activityFixture.question);
  assert.deepEqual((await call(`/learning/modules/${MODULE}/activity`)).body,final);
 },createContentService({secret:SECRET,client}));
});

test('reserve does not silently change the target objective or cognitive skill',async()=>{
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:async()=>{throw Error('provider failure');}}}}});
 const other={...stepFixture,id:crypto.randomUUID(),enriched_content:{...stepFixture.enriched_content,cognitive_dimension:'razonamiento'}};
 const value=service.generate({userId:USER,profile:{grade_level:5},module:moduleFixture,steps:[stepFixture,other],attempts:[attempt('incorrect','comprension')]});
 await assert.rejects(value,e=>e.status===503);
});

test('a previously published activity resumes after server restart without generating a replacement',async()=>{
 const db=fakeDb();let calls=0;
 const service=createContentService({secret:SECRET,client:aiStub()});const generate=service.generate;
 service.generate=input=>{calls++;return generate(input);};
 let published;
 await withServer(db,async call=>{published=(await call(`/learning/modules/${MODULE}/activity`)).body;},service);
 await withServer(db,async call=>{
  const recovered=await call('/learning/resume','a',{moduleId:MODULE,token:published.token});
  assert.equal(recovered.status,200);assert.deepEqual(recovered.body.activity,published.activity);assert.equal(recovered.body.token,published.token);
  assert.equal((await call(`/learning/modules/${MODULE}/activity`)).body.activity.id,published.activity.id);
  assert.equal((await call('/learning/resume','b',{moduleId:MODULE,token:published.token})).status,403);
  assert.equal((await call('/learning/resume','a',{moduleId:crypto.randomUUID(),token:published.token})).status,403);
  assert.equal(calls,1);assert.equal(db.tables.student_step_attempts.length,0);
 },service);
});

test('evaluation and persistence failures preserve the same activity and can be retried once',async()=>{
 const failure={before:true};const db=fakeDb({},failure);let evaluations=0;
 const service=createContentService({secret:SECRET,client:aiStub()});const evaluate=service.evaluate;
 service.evaluate=async(...args)=>{if(++evaluations===1)throw Object.assign(Error('temporary evaluation failure'),{status:503});return evaluate(...args);};
 await withServer(db,async call=>{
  const current=(await call(`/learning/modules/${MODULE}/activity`)).body;
  const body={token:current.token,answer:'0',finish_session:true};
  assert.equal((await call('/learning/answers','a',body)).status,503);
  assert.equal((await call('/learning/answers','a',body)).status,500);
  assert.deepEqual((await call(`/learning/modules/${MODULE}/activity`)).body,current);assert.equal(db.tables.student_step_attempts.length,0);
  failure.before=false;
  const saved=await call('/learning/answers','a',body);assert.equal(saved.status,200);
  const duplicate=await call('/learning/answers','a',{...body,answer:'1'});
  assert.equal(duplicate.body.attemptId,saved.body.attemptId);assert.equal(duplicate.body.submittedAnswer,'0');assert.equal(db.tables.student_step_attempts.length,1);
 },service);
});

test('lost insertion response is recovered by resume and does not repeat evaluation or retain answered pending content',async()=>{
 const db=fakeDb({},{after:true});let evaluations=0,generations=0;
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:async input=>aiStub({...activityFixture,question:`${activityFixture.question} Caso ${generations}.`}).chat.completions.create(input)}}}});
 const evaluate=service.evaluate, generate=service.generate;service.evaluate=(...args)=>{evaluations++;return evaluate(...args);};service.generate=input=>{generations++;return generate(input);};
 await withServer(db,async call=>{
  const current=(await call(`/learning/modules/${MODULE}/activity`)).body;
  assert.equal((await call('/learning/answers','a',{token:current.token,answer:'0'})).status,500);
  assert.equal(db.tables.student_step_attempts.length,1);
  const recovered=await call('/learning/resume','a',{moduleId:MODULE,token:current.token});
  assert.equal(recovered.body.feedback.attemptId,db.tables.student_step_attempts[0].attempt_id);
  assert.equal(recovered.body.feedback.submittedAnswer,'0');assert.equal(evaluations,1);
  const next=await call(`/learning/modules/${MODULE}/activity`);assert.equal(next.status,200);assert.notEqual(next.body.activity.id,current.activity.id);
  await call('/learning/resume','a',{moduleId:MODULE,token:current.token});
  assert.equal((await call(`/learning/modules/${MODULE}/activity`)).body.activity.id,next.body.activity.id);
  assert.equal(generations,2);
 },service);
});

test('expired resume cannot create another activity or an invented attempt',async()=>{
 const db=fakeDb();let generations=0;
 const service=createContentService({secret:SECRET,client:aiStub()});service.generate=async()=>{generations++;throw Error('must not generate');};
 const token=seal({user_id:USER,module_id:MODULE,step_id:STEP,expires_at:1},SECRET);
 await withServer(db,async call=>{
  assert.equal((await call('/learning/resume','a',{moduleId:MODULE,token})).status,410);
  assert.equal(generations,0);assert.equal(db.tables.student_step_attempts.length,0);
 },service);
});

test('browser drafts preserve all answer formats and remain scoped to user and module',async()=>{
 const {readActivityDraft,writeActivityDraft,responseDraft}=await import('../client/src/utils/activityDraft.js');
 const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 for(const type of ['text','option','multiple_select','matching','ordering']) {
  const activity={id:'published',type,question:'Actividad ya publicada',options:['A','B','C'],left_items:['X','Y'],right_items:['Y','X'],items:['A','B','C']};
  const value={token:'encrypted',activity},answer=type==='text'?'Mi respuesta sin terminar':type==='option'?'1':'';
  const selection=type==='matching'?[[0,1]]:type==='ordering'?[2,0,1]:type==='multiple_select'?[0,2]:[];
  writeActivityDraft(storage,`${USER}:${MODULE}`,value,answer,selection,1234);
  const restored=readActivityDraft(storage,`${USER}:${MODULE}`);
  assert.equal(restored.answer,answer);assert.deepEqual(restored.selection,selection);assert.equal(restored.startedAt,1234);assert.equal(restored.value.activity.id,'published');
  assert.equal(readActivityDraft(storage,`${OTHER}:${MODULE}`),null);
 }
 assert.deepEqual(responseDraft({type:'matching',left_items:['A'],right_items:['B']},'[[0,0],[0,0]]').selection,[]);
 assert.doesNotThrow(()=>writeActivityDraft({setItem(){throw Error('storage disabled');}},'key',{token:'t',activity:{type:'text'}},'texto',[],1));
});

test('disconnect during generation and a concurrent retry still publish only one activity',async()=>{
 let release, started, builds=0;
 const gate=new Promise(resolve=>{release=resolve;}), entered=new Promise(resolve=>{started=resolve;});
 const service=createContentService({secret:SECRET,client:aiStub()});const generate=service.generate;
 service.generate=async input=>{builds++;input.onProgress?.({question:'PRIVATE_DISCARDED_DRAFT'});started();await gate;return generate(input);};
 const db=fakeDb();
 await withServer(db,async call=>{
  const controller=new AbortController();
  const response=await call.raw(`/learning/modules/${MODULE}/activity?stream=1`,'a',null,{signal:controller.signal});
  await entered;controller.abort();
  await assert.rejects(response.text());
  const retry=call(`/learning/modules/${MODULE}/activity`);release();
  const published=await retry;assert.equal(published.status,200);assert.equal(builds,1);
  const repeat=await call(`/learning/modules/${MODULE}/activity`);
  assert.equal(repeat.body.activity.id,published.body.activity.id);assert.equal(db.tables.student_step_attempts.length,0);
 },service);
});

test('failure reasons are bounded categories and respect causes without exposing provider messages',()=>{
 const {failureReason}=require('./learningFailures');
 assert.equal(failureReason(new TypeError('fetch failed',{cause:{code:'ENOTFOUND'}})),'network');
 assert.equal(failureReason(Object.assign(Error('wrapper'),{status:503,cause:{name:'AbortError'}})),'timeout');
 assert.equal(failureReason({status:401}),'provider_auth');
 assert.equal(failureReason({learningReason:'PRIVATE_PROVIDER_SECRET'}),'unknown');
});

test('generation model experiments keep grading isolated and retain the private publication gate',async()=>{
 const requests=[];
 const client={chat:{completions:{create:async input=>{
  requests.push(input);
  if(input.response_format.json_schema.name==='kuneo_evaluation')return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({observations:['Una cuarta parte'],missing_requirements:[],result:'correct',feedback:'Relacionaste tres de doce con una cuarta parte.'})}}]};
  return aiStub().chat.completions.create(input);
 }}}};
 const service=createContentService({secret:SECRET,client,activityModel:'gpt-6-luna',reviewModel:'gpt-6.1-terra',evaluationModel:'gpt-4.1-mini',compact:true,activityServiceTier:'fast'});
 const current=await service.generate({userId:USER,profile:{grade_level:5},module:moduleFixture,steps:[stepFixture],attempts:[]});
 assert(!JSON.stringify(current.activity).includes('correct_index'));
 assert.deepEqual(requests.map(r=>r.model),['gpt-6-luna','gpt-6.1-terra']);
 assert(requests.every(r=>r.reasoning_effort==='none'&&r.service_tier==='fast'));
 await service.evaluate({question:'Explica una cuarta parte.',expected:{type:'rubric',answer:'3 de 12',rubric:'Representa una cuarta parte.'},dimension:'comprension',grade_group:'4-5'},'Tres de doce es una cuarta parte.');
 const grader=requests.at(-1);
 assert.equal(grader.model,'gpt-4.1-mini');assert.equal(grader.temperature,0);
 assert.equal(grader.reasoning_effort,undefined);assert.equal(grader.service_tier,undefined);
});

test('unused explanation metadata is harmless but missing required rationale still fails',()=>{
 const item={...activityFixture,option_explanations:['A','B','C'],pair_explanations:['Unused metadata']};
 const valid=validateGenerated(item);assert.deepEqual(valid.pair_explanations,[]);assert.deepEqual(valid.option_explanations,['A','B','C']);
 assert.equal(item.pair_explanations.length,1); // do not mutate the provider object
 assert.throws(()=>validateGenerated({...item,option_explanations:['A']}),/option_explanations requires 3/);
 const open=validateGenerated({...item,type:'text',expected_text:'Una cuarta parte.'});
 assert.deepEqual(open.option_explanations,[]);assert.equal(open.expected_text,'Una cuarta parte.');
 assert.throws(()=>validateGenerated({...open,expected_text:''}),/Missing expected answer/);
});

test('a reviewed reserve survives generation failure without changing objective, owner or activity identity',async()=>{
 let fail=false;const client={chat:{completions:{create:input=>{
  if(fail) return Promise.resolve({choices:[{finish_reason:'stop',message:{content:JSON.stringify({...activityFixture,options:['same','same'],correct_index:0})}}]});
  return aiStub().chat.completions.create(input);
 }}}};
 const service=createContentService({secret:SECRET,client}),input={userId:USER,profile:{grade_level:5},module:moduleFixture,steps:[{...stepFixture,enriched_content:null}],attempts:[]};
 const first=await service.generate(input);fail=true;
 const reserve=await service.generate(input);
 assert.equal(reserve.activity.source,'stored');assert.equal(reserve.activity.question,first.activity.question);
 assert.notEqual(reserve.activity.id,first.activity.id);assert.equal(reserve.activity.step_id,STEP);
 assert.deepEqual(service.decode(reserve.token,USER).expected,service.decode(first.token,USER).expected);
 await assert.rejects(service.generate({...input,userId:OTHER}),e=>e.status===503);
 await assert.rejects(service.generate({...input,profile:{grade_level:6}}),e=>e.status===503);
 await assert.rejects(service.generate({...input,module:{...moduleFixture,learning_objective:'Un objetivo distinto'}}),e=>e.status===503);
});

test('lookahead starts while reading and does not lock hints or answers; delivery reuses the reviewed candidate',async()=>{
 let builds=0,release,entered;
 const gate=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:input=>aiStub({...activityFixture,question:`${activityFixture.question} Caso ${builds}.`}).chat.completions.create(input)}}}});
 const generate=service.generate,inputs=[];
 service.generate=async input=>{builds++;inputs.push(input);if(builds===2){entered();await gate;}return generate(input);};
 const db=fakeDb();
 await withServer(db,async call=>{
  try {
   const first=await call(`/learning/modules/${MODULE}/activity`);await started;
   assert.equal(db.tables.student_step_attempts.length,0);assert.equal(inputs[1].attempts.length,0);
   assert.equal(inputs[1].anticipation.dimension,'razonamiento');
   // These requests MUST complete while the provider gate remains closed.
   const hint=await call('/learning/hint','a',{token:first.body.token,level:1});assert.equal(hint.status,200);
   const answer=await call('/learning/answers','a',{token:hint.body.token,answer:'0'});assert.equal(answer.status,200);
   release();
   const next=await call(`/learning/modules/${MODULE}/activity`);
   assert.equal(next.status,200);assert.equal(next.body.activity.cognitive_dimension,'razonamiento');
   assert.notEqual(next.body.activity.id,first.body.activity.id);
   assert.equal(require('./runtimeMetrics').snapshot().filter(r=>r.tags?.activity_lookahead==='used').length>0,true);
   assert.equal(inputs.filter(input=>input.anticipation?.currentId===first.body.activity.id).length,1);
   await call('/learning/answers','a',{token:first.body.token,answer:'0'});
   assert.equal((await call(`/learning/modules/${MODULE}/activity`)).body.activity.id,next.body.activity.id);
   assert.equal(db.tables.student_step_attempts.length,1);
  } finally { release(); }
 },service,{prefetch:true});
});

test('lookahead planner waits for uncertain outcomes and refuses stale curriculum or evidence',()=>{
 const {nextPlan,matchesPlan}=require('./learningLookahead');
 const current={activity_id:'current',step_id:STEP,dimension:'comprension'};
 const base={module:moduleFixture,steps:[stepFixture],profile:{grade_level:5},attempts:[],globalAttempts:[],current};
 const plan=nextPlan(base);assert.equal(plan.dimension,'razonamiento');assert.equal(plan.format,'text');
 const answer=attempt('correct','comprension',{attempt_id:'new'});
 const context={...base,attempts:[answer],globalAttempts:[answer]};
 assert(matchesPlan(plan,context,'current','new'));
 assert(!matchesPlan(plan,{...context,profile:{grade_level:6}},'current','new'));
 assert(!matchesPlan(plan,{...context,globalAttempts:[attempt('incorrect','razonamiento'),answer]},'current','new'));
 assert(!matchesPlan(plan,context,'another-question','new'));
 const old=attempt('correct');
 const uncertain={...base,steps:[stepFixture,{...stepFixture,id:'next-step',step_order:2}],attempts:[old],globalAttempts:[old]};
 let reason;assert.equal(nextPlan({...uncertain,onSkip:value=>{reason=value;}}),null); // correct consolidates the step, incorrect does not
 assert.equal(reason,'answer_dependent_target');
});

test('conditional skill lookahead is accepted only when the real saved result selects that skill',()=>{
 const {nextPlan,matchesPlan}=require('./learningLookahead');
 const before=DIMENSIONS.slice(0,4).map((d,i)=>attempt('partial',d,{attempt_id:'before-'+i}));
 const current={activity_id:'conditional',step_id:STEP,dimension:'metacognicion'};
 const base={module:moduleFixture,steps:[stepFixture],profile:{grade_level:5},attempts:before,globalAttempts:before,current};
 const plan=nextPlan(base);assert.equal(plan.conditional,true);assert.equal(plan.dimension,'comprension');
 for(const result of ['partial','incorrect']){const saved=attempt(result,'metacognicion',{attempt_id:'actual'}),context={...base,attempts:[...before,saved],globalAttempts:[...before,saved]};assert.equal(matchesPlan(plan,context,'conditional','actual'),result==='partial');}
});

test('an eight-activity practice and restart reuse work finished while reading, without duplicate foreground generation',async()=>{
 let builds=0;const releases=[],finished=[];
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:input=>aiStub({...activityFixture,question:`${activityFixture.question} Situación ${builds}.`}).chat.completions.create(input)}}}}),generate=service.generate;
 service.generate=async input=>{builds++;if(input.anticipation)await new Promise(resolve=>releases.push(resolve));const value=await generate(input);finished.push(value.activity.id);return value;};
 service.evaluate=async()=>({result:'partial',feedback:'Evaluación sintética de encaminamiento.'});service.summarize=undefined;
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 const readUntilReady=async count=>{for(let i=0;i<100;i++){while(releases.length)releases.shift()();if(finished.length>=count){await tick();return;}await tick();}throw Error('Prepared activity did not finish');};
 const db=fakeDb();
 await withServer(db,async call=>{
  let current=await call(`/learning/modules/${MODULE}/activity`);assert.equal(current.status,200);const attemptIds=[];
  for(let index=0;index<8;index++){
   // Complete the deferred provider work while the synthetic student is reading.
   await readUntilReady(index+2);const readyId=finished[index+1],before=builds;
   const answer=await call('/learning/answers','a',{token:current.body.token,answer:'0',finish_session:index===7});assert.equal(answer.status,200);attemptIds.push(answer.body.attemptId);
   if(index<7){current=await call(`/learning/modules/${MODULE}/activity`);assert.equal(current.status,200);assert.equal(current.body.activity.id,readyId);assert.equal(builds,before+1);}
  }
  const readyId=finished[8];const summary=await call('/learning/session-summary','a',{moduleId:MODULE,attemptIds});assert.equal(summary.status,200);
  const restart=await call(`/learning/modules/${MODULE}/activity`);assert.equal(restart.status,200);assert.equal(restart.body.activity.id,readyId);assert.equal(db.tables.student_step_attempts.length,8);
  await readUntilReady(10);
 },service,{prefetch:true});
});

test('closed-format wire contracts constrain keys and lengths but allow an honest open alternative',async()=>{
 const {activityWireSchema}=require('./learningActivitySchema');
 const {ACTIVITY_SCHEMA}=require('./learningContent');
 for(const type of ['option','multiple_select','matching']) {
  const schema=activityWireSchema(ACTIVITY_SCHEMA,type,2),[closed,open]=schema.properties.activity.anyOf;
  assert.equal(closed.properties.type.enum[0],type);assert.equal(open.properties.type.enum[0],'text');
  assert.equal(open.properties.expected_text.pattern,'\\S');assert.equal(open.properties.correct_index,undefined);
  if(type==='option'){assert.equal(closed.properties.options.minItems,3);assert.equal(closed.properties.correct_index.maximum,2);}
  if(type==='multiple_select'){assert.equal(closed.properties.correct_indices.maxItems,3);assert.equal(closed.properties.option_explanations.minItems,4);}
  if(type==='matching'){assert.equal(closed.properties.correct_pairs.items.minItems,2);assert.equal(closed.properties.pair_explanations.minItems,3);}
 }
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:async input=>{
  if(input.response_format.json_schema.name==='kuneo_activity_review')return aiStub().chat.completions.create(input);
  return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({activity:activityFixture})}}]};
 }}}}});
 const result=await service.generate({userId:USER,profile:{grade_level:5},module:moduleFixture,steps:[stepFixture],attempts:[]});
 assert.equal(result.activity.question,activityFixture.question);assert.equal(service.decode(result.token,USER).expected.correct_options[0],0);
});

test('a failed lookahead never replaces the visible question and falls back to normal preparation after saving',async()=>{
 let builds=0;
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:input=>aiStub({...activityFixture,question:`${activityFixture.question} Caso ${builds}.`}).chat.completions.create(input)}}}});
 const generate=service.generate;
 service.generate=input=>{builds++;if(input.anticipation)throw Object.assign(Error('unavailable'),{status:503});return generate(input);};
 const db=fakeDb();
 await withServer(db,async call=>{
  const first=await call(`/learning/modules/${MODULE}/activity`);
  const again=await call(`/learning/modules/${MODULE}/activity`);
  assert.equal(again.body.activity.id,first.body.activity.id);assert.equal(builds,2);
  const result=await call('/learning/answers','a',{token:first.body.token,answer:'0'});assert.equal(result.status,200);
  const next=await call(`/learning/modules/${MODULE}/activity`);assert.equal(next.status,200);
  assert.notEqual(next.body.activity.id,first.body.activity.id);assert.equal(db.tables.student_step_attempts.length,1);
 },service,{prefetch:true});
});

test('a profile change discards a finished lookahead and prepares using the actual current grade',async()=>{
 let builds=0;const inputs=[];
 const service=createContentService({secret:SECRET,client:{chat:{completions:{create:input=>aiStub({...activityFixture,question:`${activityFixture.question} Caso ${builds}.`}).chat.completions.create(input)}}}});
 const generate=service.generate;
 service.generate=input=>{builds++;inputs.push(input);return generate(input);};
 const db=fakeDb();
 await withServer(db,async call=>{
  const first=await call(`/learning/modules/${MODULE}/activity`);
  db.tables.profiles.find(p=>p.user_id===USER).grade_level=6;
  await call('/learning/answers','a',{token:first.body.token,answer:'0'});
  const next=await call(`/learning/modules/${MODULE}/activity`);assert.equal(next.status,200);
  assert.equal(service.decode(next.body.token,USER).grade_group,'6-7');
  assert(inputs.some(input=>!input.anticipation&&input.profile.grade_level===6&&input.attempts.length===1));
  assert.equal(require('./runtimeMetrics').snapshot().some(row=>row.tags?.activity_lookahead==='discarded'),true);
 },service,{prefetch:true});
});

test('failed restart prefetch cannot block a summary or retry generation on summary reload',async()=>{
 const db=fakeDb();let calls=0;
 const service=createContentService({secret:SECRET,client:aiStub()});const generate=service.generate;
 service.generate=input=>{calls++;if(calls>1)throw Object.assign(Error('synthetic unavailable'),{status:503});return generate(input);};
 await withServer(db,async call=>{
  const current=await call(`/learning/modules/${MODULE}/activity`);
  const answer=await call('/learning/answers','a',{token:current.body.token,answer:'0',finish_session:true});
  const body={moduleId:MODULE,attemptIds:[answer.body.attemptId]};
  const result=await call('/learning/session-summary','a',body);assert.equal(result.status,200);
  const again=await call('/learning/session-summary','a',body);assert.equal(again.status,200);
  assert.equal(calls,2);assert.equal(db.tables.student_step_attempts.length,1);
 },service,{prefetch:true,lookahead:false});
});

test('eight-question practice persists all five formats and returns a finite owned summary',async(t)=>{
 const priorOrdering=process.env.LEARNING_ORDERING_ENABLED;process.env.LEARNING_ORDERING_ENABLED='true';t.after(()=>{if(priorOrdering===undefined)delete process.env.LEARNING_ORDERING_ENABLED;else process.env.LEARNING_ORDERING_ENABLED=priorOrdering;});
 const db=fakeDb();let generated=0;
 const client={chat:{completions:{create:async input=>{
 const name=input.response_format.json_schema.name;
 const context=JSON.parse(input.messages.at(-1).content);
 const value=name==='kuneo_practice_summary'?{}:name==='kuneo_activity_review'?{approved:true,issue:''}:name==='kuneo_evaluation'?{observations:['respuesta válida'],missing_requirements:[],result:'correct',feedback:'La explicación responde a lo solicitado.'}:(()=>{
 generated++;const type=context.requested_format;
 return {...activityFixture,question:`${activityFixture.question} Caso ${generated}.`,type,options:type==='multiple_select'?['A','B','C']:type==='option'?activityFixture.options:[],correct_indices:type==='multiple_select'?[0,1]:[],left_items:type==='matching'?['A','B']:[],right_items:type==='matching'?['B','A']:[],correct_pairs:type==='matching'?[[0,1],[1,0]]:[],items:type==='ordering'?['Preparar','Realizar','Revisar']:[],correct_order:type==='ordering'?[0,1,2]:[],order_explanations:type==='ordering'?['Se prepara antes de realizar.','Se realiza después de preparar.','Se revisa el resultado obtenido.']:[]};})();
 return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]};
 }}}};
 await withServer(db,async call=>{
 const ids=[],types=new Set();
 for(let n=0;n<8;n++){
 const current=await call(`/learning/modules/${MODULE}/activity`);assert.equal(current.status,200);
 const activity=current.body.activity;types.add(activity.type);
 const answer=activity.type==='ordering'?JSON.stringify(activity.items.map((_,i)=>i).sort((a,b)=>['Preparar','Realizar','Revisar'].indexOf(activity.items[a])-['Preparar','Realizar','Revisar'].indexOf(activity.items[b]))):activity.type==='option'?'0':activity.type==='text'?'respuesta válida':activity.type==='multiple_select'?'[0,1]':'[[0,1],[1,0]]';
 const result=await call('/learning/answers','a',{token:current.body.token,answer,finish_session:n===7});
 assert.equal(result.status,200);assert.equal(result.body.result,'correct');ids.push(result.body.attemptId);
 }
 const summary=await call('/learning/session-summary','a',{moduleId:MODULE,attemptIds:ids});
 assert.equal(summary.body.total,8);assert.equal(summary.body.correct,8);
 await call(`/learning/modules/${MODULE}/activity`);assert.equal(generated,9);
 assert.equal(types.size,5);assert.equal(db.tables.student_step_attempts.length,8);
 const ordered=db.tables.student_step_attempts.map(a=>JSON.parse(a.answer)).find(a=>a.question_type==='ordering');assert.equal(ordered.items.length,3);assert.equal(ordered.feedback_details.length,3);assert.ok(ordered.feedback_details.every(d=>typeof d.selected==='string'&&typeof d.expected==='string'));
 assert.equal(summary.body.notice.includes('no es un diagnóstico'),true);
 },createContentService({secret:SECRET,client}),{prefetch:true,lookahead:false});
});
