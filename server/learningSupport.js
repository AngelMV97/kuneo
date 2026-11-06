const string = { type: 'string' };
function isProseResult(value) {
  return typeof value === 'string' && !/(?:\|\s*:?-{3,}:?\s*\||<\s*\/?\s*(?:table|svg|img|canvas)\b|!\[[^\]]*\]\(|```)/i.test(value);
}
function enforceScienceClaims(card, subject) {
  if (subject !== 'natural_sciences') return;
  const text = JSON.stringify(card).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/evapora/.test(text) && !/ebullicion|hirviendo|hervir/.test(text) && /temperatura(?: del [a-z ]{1,25})? (?:se mantiene|permanece|es) constante/.test(text)) throw new Error('Invalid support science: la evaporación no implica temperatura constante; usa un ejemplo científicamente correcto y autocontenido.');
}
function enforceSupportLanguage(card, subject) {
  // Catch long English passages in Spanish subjects without rejecting a symbol,
  // a name, or a short quoted technical term. Review also checks semantics.
  if (subject === 'english') return;
  const english = new Set('the and with from this that these those she he they his her their was were is are have has had can could would should when where which what about because though even than then look notice through writes student text short paragraph'.split(' '));
  const spanish = new Set('el la los las una uno unos unas del que como cuando donde quien porque para por con sin sus estas estos este esta esto es son era eran tiene tienen texto ejemplo personaje estudiantes estudiante puede pueden aunque pero pues'.split(' '));
  const fields = [card.title, card.body, card.insight, card.example_problem, card.example_result, card.visual?.caption, ...(card.example_steps || []), ...(card.visual?.headers || []), ...(card.visual?.rows || []).flat(), ...(card.visual?.steps || [])];
  for (const field of fields) {
    const words = String(field || '').toLowerCase().match(/[a-záéíóúñü]+/g) || [];
    const en = words.filter(w => english.has(w)).length, es = words.filter(w => spanish.has(w)).length;
    if (en >= 3 && en > es * 1.5) throw new Error('Invalid support language: usa español en esta materia, incluido el texto, los pasos y el resultado.');
  }
}
const REVIEW_SCHEMA = { type: 'object', additionalProperties: false, properties: { approved: { type: 'boolean' }, issue: string }, required: ['approved', 'issue'] };
const SUPPORT_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  title: string, body: string, insight: string,
  example_problem: string, example_steps: { type: 'array', items: string }, example_result: string,
  visual: { type: 'object', additionalProperties: false, properties: {
    kind: { type: 'string', enum: ['none', 'table', 'sequence'] }, caption: string,
    headers: { type: 'array', items: string }, rows: { type: 'array', items: { type: 'array', items: string } },
    steps: { type: 'array', items: string }
  }, required: ['kind', 'caption', 'headers', 'rows', 'steps'] }
}, required: ['title', 'body', 'insight', 'example_problem', 'example_steps', 'example_result', 'visual'] };
function validateSupport(card) {
  const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  if (!card || !text(card.title, 100) || !text(card.body, 2400) || !text(card.insight, 350)) throw new Error('Invalid support text');
  if (card.example_problem && (!text(card.example_problem, 1200) || !text(card.example_result, 1200) || !Array.isArray(card.example_steps) || card.example_steps.length < 2 || card.example_steps.length > 5 || !card.example_steps.every(s => text(s, 500)))) throw new Error('Invalid support example');
  if (card.example_result && !isProseResult(card.example_result)) throw new Error('Invalid support result: escribe solo la conclusión en prosa; coloca tablas y gráficos únicamente en visual.');
  let v = card.visual;
  if (!v || !['none', 'table', 'sequence'].includes(v.kind) || typeof v.caption !== 'string' || v.caption.length > 300) throw new Error('Invalid support visual');
  if (v.kind === 'table' && (!Array.isArray(v.headers) || v.headers.length < 2 || v.headers.length > 4 || !v.headers.every(x => text(x, 120)) || !Array.isArray(v.rows) || v.rows.length < 1 || v.rows.length > 6 || !v.rows.every(row => Array.isArray(row) && row.length === v.headers.length && row.every(x => text(x, 160))))) v = { kind: 'none' };
  if (v.kind === 'sequence' && (!Array.isArray(v.steps) || v.steps.length < 2 || v.steps.length > 5 || !v.steps.every(x => text(x, 240)))) v = { kind: 'none' };
  // Only validated data reaches the UI, never model-authored SVG/HTML/config.
  return { title: card.title, body: card.body, insight: card.insight,
    ...(card.example_problem ? { example_problem: card.example_problem, example_steps: card.example_steps, example_result: card.example_result } : {}),
    visual: v.kind === 'table' ? { kind: v.kind, caption: v.caption, headers: v.headers, rows: v.rows } : v.kind === 'sequence' ? { kind: v.kind, caption: v.caption, steps: v.steps } : { kind: 'none' } };
}
module.exports = { SUPPORT_SCHEMA, REVIEW_SCHEMA, validateSupport, enforceSupportLanguage, enforceScienceClaims, isProseResult };
