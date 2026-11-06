const { DIMENSIONS, SUBJECTS, normalizeSubject, metadata } = require('./learningMetrics');
const labels = { comprension: 'Comprensión', razonamiento: 'Razonamiento', representacion: 'Representación', transferencia: 'Transferencia', metacognicion: 'Metacognición' };
const advice = {
  mathematics: 'Representa los datos, desarrolla un paso a la vez y comprueba el resultado con la operación inversa o sustituyéndolo en el problema.',
  language: 'Vuelve al texto y señala la frase que apoya tu interpretación antes de redactar una conclusión.',
  natural_sciences: 'Relaciona la observación con una causa y comprueba qué datos apoyan tu explicación o hipótesis.',
  social_studies: 'Distingue hechos de opiniones, usa evidencia y contrasta al menos dos perspectivas antes de concluir.',
  english: 'Busca pistas del contexto, compara ejemplos y comprueba que la palabra o estructura tenga sentido en la oración.'
};
function practiceSummary(attempts, module) {
  const total = attempts.length, correct = attempts.filter(a => a.result === 'correct').length, partial = attempts.filter(a => a.result === 'partial').length;
  const dimensions = DIMENSIONS.map(key => {
    const rows = attempts.filter(a => a.cognitive_dimension === key);
    return { key, label: labels[key], count: rows.length, correct: rows.filter(a => a.result === 'correct').length };
  }).filter(d => d.count);
  const evidence = summaryEvidence(attempts);
  return { moduleId: module.id, title: module.title, subject: SUBJECTS[normalizeSubject(module.subject)] || module.subject,
    total, correct, partial, incorrect: total - correct - partial, hints: attempts.reduce((s, a) => s + (a.hint_requests || 0), 0),
    seconds: attempts.reduce((s, a) => s + (a.time_on_task || 0), 0), dimensions,
    overview: !total ? 'Esta práctica todavía no tiene respuestas guardadas.' : `Practicaste ${String([...new Set(evidence.map(a => a.focus).filter(Boolean))].slice(0, 3).join(', ') || module.learning_objective || module.title).replace(/[.\s]+$/, '')}. Revisa abajo tus respuestas y las orientaciones para continuar.`,
    strengths: evidence.filter(a => a.result === 'correct').slice(0, 2).map(a => `En «${a.focus || a.question}»: ${evidenceExplanation(a, true)}`),
    improvements: evidence.filter(a => a.result !== 'correct').slice(0, 3).map(a => `Vuelve a «${a.focus || a.question}»: ${evidenceExplanation(a, false)}`),
    nextSteps: total ? [advice[normalizeSubject(module.subject)] || 'Revisa la retroalimentación y vuelve a comprobar cada respuesta con los datos.', attempts.some(a => a.hint_requests) ? 'Intenta un caso nuevo sin pistas para comprobar lo que ya puedes hacer por tu cuenta.' : 'Explica cómo comprobaste tu respuesta para afianzar la estrategia.'] : ['Explora una materia y responde tu primera actividad.'],
    notice: 'Resumen de esta práctica según las evaluaciones guardadas; no es un diagnóstico ni equivale a completar el módulo.' };
}
function evidenceExplanation(attempt, success) {
  const details = Array.isArray(attempt.details) ? attempt.details.filter(d => success ? d.correct && d.expected !== 'No corresponde' : !d.correct).slice(0, 2) : [];
  return details.length ? details.map(d => `${d.label}: ${success ? '' : `tu respuesta fue «${d.selected}»; se esperaba «${d.expected}». `}${d.explanation || ''}`).join(' ') : attempt.feedback || 'Compara tu respuesta con los datos de la actividad y comprueba cada relación.';
}
function summaryEvidence(attempts) {
  return attempts.map(a => {
    const saved = metadata(a) || {};
    return { id: a.attempt_id, result: a.result, grade_group: saved.grade_group, focus: saved.learning_focus,
      question: (saved.question || 'Actividad anterior').slice(0, 2500), type: saved.question_type,
      options: saved.options, left_items: saved.left_items, right_items: saved.right_items, items:saved.items,
      answer: String(saved.submitted_answer || '').slice(0, 2500), feedback: String(saved.feedback || '').slice(0, 2500), details: saved.feedback_details, hints: a.hint_requests || 0 };
  });
}
const entry = { type: 'object', additionalProperties: false, properties: { text: { type: 'string' }, attemptIds: { type: 'array', items: { type: 'string' } } }, required: ['text', 'attemptIds'] };
const COACHING_SCHEMA = { type: 'object', additionalProperties: false, properties: { overview: { type: 'string' }, ...Object.fromEntries(['strengths', 'improvements', 'nextSteps'].map(k => [k, { type: 'array', items: entry }])) }, required: ['overview', 'strengths', 'improvements', 'nextSteps'] };
function validateCoaching(value, attempts) {
  if (typeof value?.overview !== 'string' || !value.overview.trim() || value.overview.length > 900) throw new Error('Invalid coaching');
  const byId = new Map(attempts.map(a => [a.attempt_id, a]));
  for (const key of ['strengths', 'improvements', 'nextSteps']) {
    if (!Array.isArray(value[key]) || value[key].length > 3 || (key === 'nextSteps' && !value[key].length)) throw new Error('Invalid coaching');
    for (const item of value[key]) {
      // A proposed new exercise is not an observation about a previous answer.
      if (typeof item.text !== 'string' || !item.text.trim() || item.text.length > 700 || !Array.isArray(item.attemptIds) || (key !== 'nextSteps' && !item.attemptIds.length) || item.attemptIds.some(id => !byId.has(id))) throw new Error('Unsupported coaching evidence');
      if (key === 'strengths' && item.attemptIds.some(id => byId.get(id).result !== 'correct')) throw new Error('Unsupported strength');
      if (key === 'improvements' && item.attemptIds.some(id => byId.get(id).result === 'correct')) throw new Error('Unsupported improvement');
    }
  }
}
module.exports = { practiceSummary, summaryEvidence, validateCoaching, COACHING_SCHEMA };
