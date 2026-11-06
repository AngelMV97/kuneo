const { Router } = require('express');
const { readAll, summary, dimensionScores, moduleState, metadata, DIMENSIONS, SUBJECTS, normalizeSubject, activityView } = require('./learningMetrics');
const { createContentService, statusError, seal, presentActivity } = require('./learningContent');
const metrics = require('./runtimeMetrics');
const { beginStream } = require('./learningStream');
const { practiceSummary } = require('./learningSession');
const { nextPlan, matchesPlan } = require('./learningLookahead');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function moduleData(db, id) {
  if (!UUID.test(id)) throw statusError('Módulo inválido.');
  const { data, error } = await db.schema('kuneo').from('modules').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data || data.is_active === false) throw statusError('Módulo no disponible.', 404);
  const steps = [];
  for (let start = 0; ; start += 1000) {
    const result = await db.schema('kuneo').from('module_steps').select('*').eq('module_id', id).order('step_order').range(start, start + 999);
    if (result.error) throw result.error;
    steps.push(...result.data);
    if (result.data.length < 1000) break;
  }
  return { module: data, steps };
}
async function overview(db, userId) {
  const attempts = await readAll(db, 'student_step_attempts', userId);
  const ids = [...new Set(attempts.map(a => a.module_id))], modules = [], steps = [];
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    const result = await db.schema('kuneo').from('modules').select('id,title,subject').in('id', batch);
    if (result.error) throw result.error;
    modules.push(...result.data);
    for (let start = 0; ; start += 1000) {
      const resultSteps = await db.schema('kuneo').from('module_steps').select('id,module_id,step_order').in('module_id', batch).order('id').range(start, start + 999);
      if (resultSteps.error) throw resultSteps.error;
      steps.push(...resultSteps.data);
      if (resultSteps.data.length < 1000) break;
    }
  }
  return { attempts, modules, steps, summary: summary(attempts, modules, steps) };
}
async function syncProgress(db, userId, module, steps, allAttempts) {
  const attempts = allAttempts.filter(a => a.module_id === module.id);
  const state = moduleState(steps, attempts), moduleScores = dimensionScores(attempts), globalScores = dimensionScores(allAttempts);
  const now = new Date().toISOString();
  const completedModules = new Set(allAttempts.filter(a => metadata(a)?.module_complete).map(a => a.module_id));
  if (state.complete) completedModules.add(module.id);
  const progress = { user_id: userId, module_id: module.id, status: state.complete ? 'completed' : 'in_progress',
    total_steps: Math.max(1, steps.length), steps_completed: state.completed, current_step_id: state.nextStep?.id || null,
    current_step_order: state.nextStep?.step_order || null, total_attempts: attempts.length, correct_attempts: attempts.filter(a => a.result === 'correct').length,
    hints_used: attempts.reduce((s, a) => s + (a.hint_requests || 0), 0), started_at: attempts[0]?.created_at || now,
    completed_at: state.complete ? attempts.at(-1)?.created_at || now : null, last_activity_at: attempts.at(-1)?.created_at || now,
    ...Object.fromEntries(DIMENSIONS.map(d => [`${d}_score`, moduleScores[d].score])) };
  const profile = { user_id: userId, total_attempts: allAttempts.length, total_correct_responses: allAttempts.filter(a => a.result === 'correct').length,
    total_modules_started: new Set(allAttempts.map(a => a.module_id)).size, total_modules_completed: completedModules.size,
    total_steps_completed: new Set(allAttempts.filter(a => a.result === 'correct').map(a => a.step_id)).size,
    ...Object.fromEntries(DIMENSIONS.map(d => [d, globalScores[d].score])) };
  const results = await Promise.all([
    db.schema('kuneo').from('student_module_progress').upsert(progress, { onConflict: 'user_id,module_id' }),
    db.schema('kuneo').from('student_cognitive_profile').upsert(profile, { onConflict: 'user_id' })
  ]);
  for (const result of results) if (result.error) throw result.error;
  return state;
}
module.exports = function learningRouter(db, options = {}) {
  const router = Router();
  const secret = options.secret || process.env.LEARNING_ACTIVITY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const content = options.content || createContentService({ secret });
  const locks = new Map(), pending = new Map(), recentGeneration = new Map(), supportCache = new Map(), summaryCache = new Map();
  const lookahead = new Map();
  const prefetchEnabled = () => options.prefetch !== false && process.env.LEARNING_PREFETCH !== 'false';
  function startLookahead(context, value) {
    if (!prefetchEnabled() || options.lookahead === false || process.env.LEARNING_LOOKAHEAD === 'false' || value.complete || !value.token) return;
    const key = `${context.userId}:${context.module.id}`, existing = lookahead.get(key);
    if (existing?.currentId === value.activity.id || (existing && !existing.settled)) return;
    if ([...lookahead.values()].some(entry => entry.userId === context.userId && !entry.settled)) return;
    const current = content.decode(value.token, context.userId);
    const plan = nextPlan({ ...context, current, onSkip:reason=>metrics.tag('lookahead_unavailable',reason) });
    if (!plan) return;
    metrics.tag('lookahead_plan',plan.conditional?'conditional_skill':'stable_target');
    if (lookahead.size >= 1000) { const oldest = [...lookahead].find(([, entry]) => entry.settled); if (oldest) lookahead.delete(oldest[0]); else return; }
    const entry = { ...plan, userId: context.userId, expires: Date.now() + 60 * 60 * 1000, settled: false };
    lookahead.set(key, entry);
    // No user lock during the provider call: answering and requesting hints
    // must remain usable while this single unpublished candidate is prepared.
    entry.promise = metrics.capture('activity_lookahead', async () => {
      metrics.tag('activity_delivery', 'lookahead');
      return metrics.measure('activity_build', () => content.generate({ ...context, anticipation: { ...plan, avoidQuestion: current.question } }));
    }).then(result => result.value).catch(error => {
      console.warn('[Learning] Lookahead unavailable:', error.status || error.name); return null;
    }).finally(() => { entry.settled = true; });
  }
  // Serialize writes for the same student; a repeated network request must not award evidence twice.
  async function exclusive(userId, task) {
    const previous = locks.get(userId) || Promise.resolve();
    const next = metrics.measure('user_queue_wait',()=>previous.catch(() => {})).then(task);
    locks.set(userId, next);
    try { return await next; } finally { if (locks.get(userId) === next) locks.delete(userId); }
  }
  const route = handler => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { await handler(req, res); }
    catch (error) {
      metrics.tag('terminal_status', error.status || 500);
      if (res.headersSent) metrics.tag('stream_outcome', 'error');
      console.error('[Learning]', error.code || error.status || error.name || 'error');
      const body = { error: error.status ? error.message : 'No se pudo guardar o consultar tu aprendizaje. Intenta de nuevo.', status: error.status || 500 };
      if (res.headersSent) { if (!res.destroyed && !res.writableEnded) res.end(JSON.stringify({ type: 'error', data: body }) + '\n'); }
      else res.status(error.status || 500).json(body);
    }
  };
  router.get('/learning/me', route(async (req, res) => {
    const result = await overview(db, req.user.id);
    res.json(result.summary);
  }));
  router.post('/learning/session-summary', route(async (req, res) => {
    const { moduleId, attemptIds } = req.body;
    if (!UUID.test(moduleId || '') || !Array.isArray(attemptIds) || attemptIds.length > 100 || attemptIds.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(attemptIds).size !== attemptIds.length) throw statusError('Práctica inválida.');
    const [{ module, steps }, attempts] = await Promise.all([moduleData(db, moduleId), readAll(db, 'student_step_attempts', req.user.id)]);
    const selected = attempts.filter(a => a.module_id === moduleId && attemptIds.includes(a.attempt_id));
    if (selected.length !== attemptIds.length) throw statusError('No se encontraron todas las respuestas de esta práctica para tu usuario.', 404);
    const key = `${req.user.id}:${moduleId}:${[...attemptIds].sort().join(',')}`;
    if (summaryCache.get(key)?.expires < Date.now()) summaryCache.delete(key);
    if (!summaryCache.has(key)) {
      if (summaryCache.size >= 100) summaryCache.delete(summaryCache.keys().next().value);
      summaryCache.set(key, { expires: Date.now() + 10 * 60 * 1000, value: Promise.resolve().then(() => content.summarize ? content.summarize(selected, module) : practiceSummary(selected, module)) });
      // Prepare at most one next activity while the student reads the summary.
      // Reuse any pending activity; never regenerate on summary-cache hits.
      if (selected.length && options.prefetch !== false && process.env.LEARNING_PREFETCH !== 'false' && !moduleState(steps, attempts.filter(a => a.module_id === moduleId)).complete) {
        void metrics.capture('practice_restart_prefetch', () => prepareActivity(req.user.id, moduleId, true)).catch(error => console.warn('[Learning] Restart prefetch unavailable:', error.status || error.name));
      }
    }
    try { res.json(await summaryCache.get(key).value); }
    catch (error) { summaryCache.delete(key); throw error; }
  }));
  router.get('/learning/history', route(async (req, res) => {
    const { subject, dimension, before } = req.query;
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    const limit = req.query.limit === undefined ? 15 : Number(req.query.limit);
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 50 ||
      (subject && !Object.hasOwn(SUBJECTS, subject)) || (dimension && !DIMENSIONS.includes(dimension)) ||
      (before && (typeof before !== 'string' || !Number.isFinite(Date.parse(before))))) throw statusError('Filtros de actividad inválidos.');
    const cutoff = before || new Date().toISOString();
    const data = await overview(db, req.user.id);
    const byId = new Map(data.modules.map(m => [m.id, m]));
    const matches = data.attempts.filter(a => Date.parse(a.created_at) <= Date.parse(cutoff) &&
      (!subject || normalizeSubject(byId.get(a.module_id)?.subject) === subject) && (!dimension || a.cognitive_dimension === dimension)).reverse();
    const page = matches.slice(offset, offset + limit);
    res.json({ items: page.map(a => activityView(a, byId.get(a.module_id))), total: matches.length, before: cutoff,
      nextOffset: offset + page.length < matches.length ? offset + page.length : null });
  }));
  router.get('/learning/attempts/:attemptId', route(async (req, res) => {
    if (!UUID.test(req.params.attemptId)) throw statusError('Actividad inválida.');
    const { data: attempt, error } = await db.schema('kuneo').from('student_step_attempts').select('*').eq('attempt_id', req.params.attemptId).eq('user_id', req.user.id).maybeSingle();
    if (error) throw error;
    if (!attempt) throw statusError('No se encontró esta actividad en tu historial.', 404);
    const module = await db.schema('kuneo').from('modules').select('id,title,subject').eq('id', attempt.module_id).maybeSingle();
    if (module.error) throw module.error;
    res.json(activityView(attempt, module.data, true));
  }));
  router.get('/learning/modules/:moduleId/summary', route(async (req, res) => {
    const [{ module, steps }, allAttempts] = await Promise.all([moduleData(db, req.params.moduleId), readAll(db, 'student_step_attempts', req.user.id)]);
    res.json({ title: module.title, ...summary(allAttempts.filter(a => a.module_id === module.id), [module], steps) });
  }));
  async function prepareActivity(userId, moduleId, background = false, onProgress) {
    const key = `${userId}:${moduleId}`;
    return exclusive(userId, async () => {
      const cached = pending.get(key);
      if (cached && cached.expires > Date.now()) {
        metrics.tag('activity_cache', 'hit'); metrics.tag('activity_delivery', cached.prepared ? 'prepared' : 'published_cache');
        if (!background) { cached.prepared = false; if (cached.context) startLookahead(cached.context, cached.value); }
        metrics.tag('activity_source', cached.value.activity?.source || 'complete');
        return cached.value;
      }
      metrics.tag('activity_cache', 'miss');
      metrics.tag('activity_delivery', background ? 'background' : 'cold');
      // Bound repeated generation even if clients discard their activity token.
      const last = recentGeneration.get(userId);
      if (!background && last && Date.now() - last < 3000) throw statusError('Espera unos segundos antes de pedir otra actividad.', 429);
      recentGeneration.set(userId, Date.now());
      if (recentGeneration.size > 1000) recentGeneration.delete(recentGeneration.keys().next().value);
      const [{ module, steps }, profileResult, allAttempts] = await metrics.measure('db_context', () => Promise.all([
        moduleData(db, moduleId), db.schema('kuneo').from('profiles').select('grade_level').eq('user_id', userId).maybeSingle(), readAll(db, 'student_step_attempts', userId)
      ]));
      if (profileResult.error) throw profileResult.error;
      if (!profileResult.data) throw statusError('Completa tu perfil antes de comenzar.');
      const context = { userId, profile: profileResult.data, module, steps, attempts: allAttempts.filter(a => a.module_id === module.id), globalAttempts: allAttempts };
      let value;
      const anticipated = lookahead.get(key);
      const previous = context.attempts.at(-1), previousId = previous && metadata(previous)?.activity_id;
      if (anticipated && anticipated.expires > Date.now() && matchesPlan(anticipated, context, previousId, previous?.attempt_id)) {
        const alreadyReady=anticipated.settled;
        value = await metrics.measure('lookahead_wait',()=>anticipated.promise);
        if (value) {
          metrics.tag('activity_lookahead', 'used');
          metrics.tag('activity_delivery',alreadyReady?'prepared':'lookahead_wait');
          value = { ...value, progress: { completed: moduleState(steps, context.attempts).completed, total: steps.length } };
        }
      }
      if (anticipated) {
        if (!value) metrics.tag('activity_lookahead', 'discarded');
        if (anticipated.settled) lookahead.delete(key);
      }
      value ||= await metrics.measure('activity_build', () => content.generate({ ...context, onProgress }));
      metrics.tag('activity_source', value.activity?.source || 'complete');
      if (pending.size >= 1000) pending.delete(pending.keys().next().value);
      pending.set(key, { value, context, prepared: background, expires: Date.now() + 60 * 60 * 1000 });
      // Start only once an activity is delivered to the student. Background
      // preparation must not recursively generate an unbounded queue.
      if (!background) startLookahead(context, value);
      return value;
    });
  }
  router.get('/learning/modules/:moduleId/activity', route(async (req, res) => {
    const stream = req.query.stream === '1' ? beginStream(res, { previews: false }) : null;
    // Ignore any draft payload, including from an older/injected content service.
    const result = await prepareActivity(req.user.id, req.params.moduleId, false, stream ? () => stream.status() : undefined);
    if (stream) { metrics.tag('stream_outcome', 'ready'); stream.done(result); } else res.json(result);
  }));
  router.post('/learning/resume', route(async (req, res) => {
    if (typeof req.body.token !== 'string' || req.body.token.length > 50000) throw statusError('Actividad inválida.');
    const payload = content.decode(req.body.token, req.user.id);
    if (payload.module_id !== req.body.moduleId) throw statusError('La actividad pertenece a otro módulo.', 403);
    const result = await exclusive(req.user.id, async () => {
      const [{ module, steps }, attempts] = await Promise.all([moduleData(db, payload.module_id), readAll(db, 'student_step_attempts', req.user.id)]);
      if (!steps.some(s => s.id === payload.step_id)) throw statusError('Este objetivo ya no está disponible. Conserva tu respuesta antes de elegir otra actividad.', 409);
      const previous = attempts.find(a => metadata(a)?.activity_id === payload.activity_id);
      const state = moduleState(steps, attempts.filter(a => a.module_id === module.id));
      const value = { ...presentActivity(payload), token: req.body.token, progress: { completed: state.completed, total: state.total } };
      if (previous) {
        const saved = metadata(previous);
        value.feedback = { success: true, attemptId: previous.attempt_id, result: previous.result, feedback: saved.feedback, feedbackDetails: saved.feedback_details || [], submittedAnswer: saved.submitted_answer, complete: state.complete, duplicate: true };
        value.complete = state.complete;
        const key = `${req.user.id}:${module.id}`;
        if (pending.get(key)?.value.activity?.id === payload.activity_id) { pending.delete(key); recentGeneration.delete(req.user.id); }
      } else {
        const key = `${req.user.id}:${module.id}`;
        if (!pending.has(key) || pending.get(key).expires < Date.now()) {
          if (pending.size >= 1000) pending.delete(pending.keys().next().value);
          pending.set(key, { value, expires: payload.expires_at });
        }
      }
      metrics.tag('activity_resume', previous ? 'answered' : 'pending');
      return value;
    });
    res.json(result);
  }));
  router.post('/learning/hint', route(async (req, res) => {
    if (typeof req.body.token !== 'string' || req.body.token.length > 50000) throw statusError('Actividad inválida.');
    const payload = content.decode(req.body.token, req.user.id), level = req.body.level ?? 1;
    if (!Number.isInteger(level) || level < 1 || level > 3) throw statusError('Nivel de ayuda inválido.');
    const stream = req.body.stream === true ? beginStream(res) : null;
    const result = await exclusive(req.user.id, async () => {
      const attempts = await readAll(db, 'student_step_attempts', req.user.id);
      if (attempts.some(a => metadata(a)?.activity_id === payload.activity_id)) throw statusError('Esta actividad ya fue respondida.', 409);
      if (level >= 2) {
        // Existing tokens may predate subject/context fields. Resolve the
        // authoritative curriculum instead of guessing from the question.
        const { module } = await moduleData(db, payload.module_id);
        payload.subject = normalizeSubject(module.subject);
        payload.support_context = { topic: module.title, concept: module.core_concept, learning_goal: module.learning_objective };
      }
      const key = `${req.user.id}:${payload.activity_id}`;
      let entry = supportCache.get(key);
      if (!entry || entry.expires < Date.now()) entry = { levels: new Map(), max: 0, expires: payload.expires_at };
      if (level > entry.max + 1) throw statusError('Consulta primero la ayuda anterior.');
      let help = entry.levels.get(level);
      if (!help) {
        help = level === 1 ? { level, hint: payload.hint, card: null } : await metrics.measure('support_build', () => content.support(payload, level, 0, '', stream?.preview));
        entry.levels.set(level, help); entry.max = Math.max(entry.max, level);
        if (supportCache.size >= 1000) supportCache.delete(supportCache.keys().next().value);
        supportCache.set(key, entry);
      }
      const current = pending.get(`${req.user.id}:${payload.module_id}`);
      const previousHints = current?.value.activity?.id === payload.activity_id ? content.decode(current.value.token, req.user.id).hint_requests || 0 : 0;
      payload.hint_requests = Math.max(payload.hint_requests || 0, previousHints, entry.max);
      const token = seal(payload, secret);
      if (current?.value.activity?.id === payload.activity_id) current.value.token = token;
      return { ...help, token, hints_used: payload.hint_requests };
    });
    if (stream) stream.done(result); else res.json(result);
  }));
  router.post('/learning/answers', route(async (req, res) => {
    const { token, answer } = req.body;
    if (typeof token !== 'string' || token.length > 50000 || typeof answer !== 'string' || !answer.trim() || answer.length > 6000) throw statusError('Revisa la respuesta y vuelve a intentarlo.');
    const payload = content.decode(token, req.user.id);
    const response = await exclusive(req.user.id, async () => {
      const allAttempts = await readAll(db, 'student_step_attempts', req.user.id);
      const previous = allAttempts.find(a => metadata(a)?.activity_id === payload.activity_id);
      const { module, steps } = await moduleData(db, payload.module_id);
      payload.subject = normalizeSubject(module.subject);
      if (!steps.some(s => s.id === payload.step_id)) throw statusError('La actividad ya no pertenece a este módulo.', 409);
      if (previous) {
        const saved = metadata(previous);
        let syncPending = false;
        try { await syncProgress(db, req.user.id, module, steps, allAttempts); }
        catch { syncPending = true; }
        // A retry of an old submission must not evict a newly prepared activity.
        if (pending.get(`${req.user.id}:${module.id}`)?.value.activity?.id === payload.activity_id) { pending.delete(`${req.user.id}:${module.id}`); recentGeneration.delete(req.user.id); }
        return { success: true, attemptId: previous.attempt_id, result: previous.result, feedback: saved.feedback, feedbackDetails: saved.feedback_details || [], submittedAnswer: saved.submitted_answer, complete: moduleState(steps, allAttempts.filter(a => a.module_id === module.id)).complete, duplicate: true, syncPending };
      }
      const current = pending.get(`${req.user.id}:${module.id}`)?.value;
      if (current?.activity?.id === payload.activity_id) {
        payload.hint_requests = Math.max(payload.hint_requests || 0, content.decode(current.token, req.user.id).hint_requests || 0);
      }
      payload.hint_requests = Math.max(payload.hint_requests || 0, supportCache.get(`${req.user.id}:${payload.activity_id}`)?.max || 0);
      const evaluation = await metrics.measure('evaluation', () => content.evaluate(payload, answer.trim()));
      const feedback = evaluation.feedback || (evaluation.result === 'correct' ? '¡Bien! Probemos una actividad diferente para afianzar lo aprendido.' : `${payload.hint} Intentemos otro ejemplo del mismo objetivo.`);
      const earlier = allAttempts.filter(a => a.step_id === payload.step_id);
      const attempt = { user_id: req.user.id, module_id: payload.module_id, step_id: payload.step_id, result: evaluation.result,
        answer_type: ['option', 'numeric'].includes(payload.type) ? payload.type : 'text', cognitive_dimension: payload.dimension,
        attempt_number: Math.max(0, ...earlier.map(a => a.attempt_number)) + 1, time_on_task: Math.min(3600, Math.max(0, Math.round(Number(req.body.time_on_task) || 0))),
        hint_requests: payload.hint_requests || 0, confidence_level: ['low', 'medium', 'high'].includes(req.body.confidence) ? req.body.confidence : 'medium',
        mastery_delta: evaluation.result === 'correct' ? 0.08 : evaluation.result === 'partial' ? 0.03 : 0,
        created_at: new Date().toISOString() };
      const state = moduleState(steps, [...allAttempts.filter(a => a.module_id === module.id), attempt]);
      attempt.answer = JSON.stringify({ kuneo_activity_version: 1, activity_id: payload.activity_id, question: payload.question, question_type: payload.type, options: payload.options, left_items: payload.left_items, right_items: payload.right_items, items:payload.items, submitted_answer: answer.trim(), source: payload.source, grade_group: payload.grade_group, learning_focus: payload.learning_focus, feedback_details: evaluation.feedbackDetails || [], feedback, module_complete: state.complete });
      const result = await metrics.measure('persist_attempt', () => db.schema('kuneo').from('student_step_attempts').insert(attempt).select('*').single());
      if (result.error) throw result.error;
      pending.delete(`${req.user.id}:${module.id}`);
      recentGeneration.delete(req.user.id);
      supportCache.delete(`${req.user.id}:${payload.activity_id}`);
      let syncPending = false;
      try { await metrics.measure('sync_aggregates', () => syncProgress(db, req.user.id, module, steps, [...allAttempts, result.data])); }
      catch (error) { syncPending = true; console.error('[Learning] Aggregate sync failed:', error.code || error.name); }
      return { success: true, attemptId: result.data.attempt_id, result: evaluation.result, feedback, feedbackDetails: evaluation.feedbackDetails || [], submittedAnswer: answer.trim(), complete: state.complete, progress: { completed: state.completed, total: state.total }, syncPending };
    });
    res.json(response);
    // Start only after successful persistence. One next activity per real answer,
    // using freshly read evidence. Foreground requests share the same user lock.
    if (options.prefetch !== false && process.env.LEARNING_PREFETCH !== 'false' && req.body.finish_session !== true && !response.duplicate && !response.complete) {
      void metrics.capture('next_activity_prefetch', () => prepareActivity(req.user.id, payload.module_id, true)).catch(error => console.warn('[Learning] Prefetch unavailable:', error.status || error.name));
    }
  }));
  return router;
};
module.exports.overview = overview;
module.exports.syncProgress = syncProgress;
