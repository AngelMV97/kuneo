// Attempts are the source of truth, including attempts saved before live generation.
const DIMENSIONS = ['comprension', 'razonamiento', 'representacion', 'transferencia', 'metacognicion'];
const SUBJECTS = { mathematics: 'Matemáticas', language: 'Lenguaje', natural_sciences: 'Ciencias', social_studies: 'Ciencias Sociales', english: 'Inglés' };
const normalizeSubject = value => ({ matematicas: 'mathematics', lenguaje: 'language', ciencias: 'natural_sciences', science: 'natural_sciences', sociales: 'social_studies', ingles: 'english' }[value] || value);
function metadata(attempt) {
  try { const value = JSON.parse(attempt.answer); return value?.kuneo_activity_version === 1 ? value : null; } catch { return null; }
}
const valueOf = a => a.result === 'correct' ? Math.max(0.5, 1 - (a.hint_requests || 0) * 0.15) : a.result === 'partial' ? 0.4 : 0;
function activityView(attempt, module, detail = false) {
  const saved = metadata(attempt);
  const value = { id: attempt.attempt_id, moduleId: attempt.module_id, moduleTitle: module?.title || 'Módulo', type: 'exercise',
    subject: SUBJECTS[normalizeSubject(module?.subject)] || 'Materia', title: saved?.question || module?.title || 'Actividad',
    score: Math.round(valueOf(attempt) * 100), date: attempt.created_at, result: attempt.result,
    dimension: attempt.cognitive_dimension, hints: attempt.hint_requests || 0, seconds: attempt.time_on_task || 0 };
  if (detail) Object.assign(value, { question: saved?.question || null, answer: saved?.submitted_answer ?? attempt.answer,
    options: saved?.options || [], leftItems: saved?.left_items || [], rightItems: saved?.right_items || [], items:saved?.items||[], questionType: saved?.question_type || attempt.answer_type, feedback: saved?.feedback || null, feedbackDetails: saved?.feedback_details || [],
    source: saved?.source || 'historical' });
  return value;
}
function dimensionScores(attempts) {
  return Object.fromEntries(DIMENSIONS.map(key => {
    const evidence = attempts.filter(a => a.cognitive_dimension === key && a.result !== 'skipped').slice(-20);
    return [key, { score: evidence.length ? Math.round(evidence.reduce((sum, a) => sum + valueOf(a), 0) / evidence.length * 100) : 0, count: evidence.length }];
  }));
}
function mastered(attempts) {
  const recent = attempts.filter(a => a.result !== 'skipped').slice(-2);
  return recent.length === 2 && recent.every(a => a.result === 'correct' && !a.hint_requests);
}
function moduleState(steps, attempts) {
  const completed = steps.filter(step => mastered(attempts.filter(a => a.step_id === step.id)));
  const dimensionsCompleted = DIMENSIONS.filter(d => mastered(attempts.filter(a => a.cognitive_dimension === d))).length;
  const dimensionsComplete = dimensionsCompleted === DIMENSIONS.length;
  return { completed: completed.length, total: steps.length, complete: steps.length > 0 && completed.length === steps.length && dimensionsComplete,
    nextStep: steps.find(step => !completed.includes(step)) || steps[steps.length - 1], dimensionsComplete, dimensionsCompleted };
}
async function readAll(db, table, userId) {
  const rows = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await db.schema('kuneo').from(table).select('*').eq('user_id', userId).order('created_at', { ascending: true }).order('attempt_id', { ascending: true }).range(start, start + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}
function summary(attempts, modules, steps) {
  const byId = new Map(modules.map(m => [m.id, m]));
  const scores = dimensionScores(attempts);
  const assessed = DIMENSIONS.filter(d => scores[d].count);
  const states = modules.map(module => ({ module, attempts: attempts.filter(a => a.module_id === module.id), state: moduleState(steps.filter(s => s.module_id === module.id), attempts.filter(a => a.module_id === module.id)) }));
  const active = states.filter(x => x.attempts.length);
  const last = [...active].sort((a, b) => b.attempts.at(-1).created_at.localeCompare(a.attempts.at(-1).created_at)).find(x => !x.state.complete);
  const totalSeconds = attempts.reduce((sum, a) => sum + Math.max(0, Number(a.time_on_task) || 0), 0);
  const subjects = Object.entries(SUBJECTS).map(([id, name]) => {
    const evidence = attempts.filter(a => normalizeSubject(byId.get(a.module_id)?.subject) === id);
    return { id, name, score: evidence.length ? Math.round(evidence.reduce((s, a) => s + valueOf(a), 0) / evidence.length * 100) : 0, count: evidence.length };
  });
  return { hasActivity: attempts.length > 0, attempts: attempts.length, correct: attempts.filter(a => a.result === 'correct').length,
    generalProgress: active.length ? Math.round(active.filter(x => x.state.complete).length / active.length * 100) : 0,
    completed: active.filter(x => x.state.complete).length, total: active.length,
    studyTime: { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor(totalSeconds % 3600 / 60) },
    dimensions: scores, assessedDimensions: assessed.length, overallScore: assessed.length ? Math.round(assessed.reduce((s, d) => s + scores[d].score, 0) / assessed.length) : 0,
    subjects, lastActivity: last ? { moduleId: last.module.id, subject: SUBJECTS[normalizeSubject(last.module.subject)] || last.module.subject, module: last.module.title,
      progress: Math.round(last.state.completed / Math.max(1, last.state.total) * 100),
      attempts: last.attempts.length, goalsCompleted: last.state.completed, goalsTotal: last.state.total,
      dimensionsCompleted: last.state.dimensionsCompleted, dimensionsTotal: DIMENSIONS.length } : null,
    recentActivity: attempts.slice(-30).reverse().map(a => activityView(a, byId.get(a.module_id))) };
}
module.exports = { DIMENSIONS, SUBJECTS, normalizeSubject, metadata, dimensionScores, mastered, moduleState, readAll, summary, activityView };
