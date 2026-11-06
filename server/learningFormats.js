const TYPES = ['option', 'text', 'multiple_select', 'matching', 'ordering'];
const SESSION_FORMATS = ['option','text','multiple_select','matching','ordering','text','option','multiple_select'];
function shuffleOrdering(activity, randomInt = require('node:crypto').randomInt) {
  if(activity.type!=='ordering')return activity;
  validateFormats(activity);
  const n=activity.items.length,order=Array.from({length:n},(_,i)=>i),key=activity.expected.correct_order;
  for(let i=n-1;i>0;i--){const j=randomInt(i+1);[order[i],order[j]]=[order[j],order[i]];}
  // Do not hand the learner an already solved sequence.
  if(order.every((value,i)=>value===key[i]))[order[0],order[1]]=[order[1],order[0]];
  const position=new Map(order.map((old,i)=>[old,i]));
  return {...activity,items:order.map(i=>activity.items[i]),expected:{...activity.expected,correct_order:key.map(i=>position.get(i))}};
}
function shuffleMatching(activity, randomInt = require('node:crypto').randomInt) {
  if (activity.type !== 'matching') return activity;
  const pairs = activity.expected?.correct_pairs, right = activity.right_items, n = right?.length;
  if (!n || n < 2 || activity.left_items?.length !== n || !Array.isArray(pairs) || pairs.length !== n) return activity;
  // Reject malformed reserve keys rather than inventing relationships.
  validateFormats({ type: 'matching', left_items: activity.left_items, right_items: right, correct_pairs: pairs });
  const correctByLeft = new Map(pairs), indices = Array.from({ length: n }, (_, i) => i);
  let order;
  for (let attempt = 0; attempt < 32; attempt++) {
    order = [...indices];
    for (let i = n - 1; i > 0; i--) { const j = randomInt(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    if (order.every((original, row) => original !== correctByLeft.get(row))) break;
    order = null;
  }
  if (!order) {
    const shift = randomInt(n - 1) + 1;
    order = indices.map(row => correctByLeft.get((row + shift) % n));
  }
  const position = new Map(order.map((original, index) => [original, index]));
  return { ...activity, right_items: order.map(i => right[i]), expected: { ...activity.expected, correct_pairs: pairs.map(([left, original]) => [left, position.get(original)]) } };
}
function arithmeticMatchingPlan(module, grade) {
  if (module.subject !== 'mathematics' || grade > 5) return null;
  const goal = `${module.learning_objective || ''} ${module.core_concept || ''}`.toLowerCase();
  if (!/sumar|\bsuma\b|adici[oó]n/.test(goal) || /fracci|decimal|algeb|ecuaci/.test(goal)) return null;
  const { randomInt } = require('node:crypto');
  const max = grade <= 3 ? 9 : 40, pairs = [], totals = new Set();
  while (pairs.length < 3) {
    const a = randomInt(1, max), b = randomInt(1, max), total = a + b;
    if (totals.has(total)) continue;
    totals.add(total); pairs.push({ text: `${a} + ${b}`, total });
  }
  return { left_items: pairs.map(p => p.text), right_items: pairs.map(p => String(p.total)).reverse(), correct_pairs: pairs.map((_, i) => [i, pairs.length - i - 1]) };
}
function desiredFormat(attempts,{ordering=process.env.LEARNING_ORDERING_ENABLED==='true'}={}) {
  // The first task is quick to enter; reflection still gets open responses.
  return ordering?SESSION_FORMATS[attempts.length % SESSION_FORMATS.length]:TYPES.slice(0,4)[attempts.length%4];
}
function validateFormats(item) {
  if(item.type==='ordering'){
    const items=item.items,key=item.correct_order||item.expected?.correct_order;
    if(!Array.isArray(items)||items.length<2||items.length>6||items.some(s=>typeof s!=='string'||!s.trim())||new Set(items.map(s=>s.trim().toLowerCase())).size!==items.length||!Array.isArray(key)||key.length!==items.length||new Set(key).size!==items.length||key.some(i=>!Number.isInteger(i)||i<0||i>=items.length))throw new Error('Invalid ordering sequence');
  }
  if (item.type === 'multiple_select') {
    if (!Array.isArray(item.options) || item.options.length < 3 || item.options.length > 6 || item.options.some(x => typeof x !== 'string' || !x.trim()) || new Set(item.options).size !== item.options.length || !Array.isArray(item.correct_indices) || item.correct_indices.length < 2 || item.correct_indices.length >= item.options.length || new Set(item.correct_indices).size !== item.correct_indices.length || item.correct_indices.some(i => !Number.isInteger(i) || i < 0 || i >= item.options.length)) throw new Error('Invalid multiple selection');
  }
  if (item.type === 'matching') {
    const { left_items: left, right_items: right, correct_pairs: pairs } = item;
    if (!Array.isArray(left) || !Array.isArray(right) || left.length < 2 || left.length > 5 || left.length !== right.length || [...left, ...right].some(x => typeof x !== 'string' || !x.trim()) || new Set(left).size !== left.length || new Set(right).size !== right.length || !Array.isArray(pairs) || pairs.length !== left.length || pairs.some(p => !Array.isArray(p) || p.length !== 2 || p.some(i => !Number.isInteger(i) || i < 0 || i >= left.length)) || new Set(pairs.map(p => p[0])).size !== left.length || new Set(pairs.map(p => p[1])).size !== right.length) throw new Error('Invalid matching pairs');
  }
}
function evaluateStructured(payload, answer) {
  if (payload.type === 'ordering') {
    const input = validateOrderingAnswer(answer, payload.expected.correct_order);
    const correct = input.filter((value, index) => value === payload.expected.correct_order[index]).length;
    return { result: correct === input.length ? 'correct' : correct / input.length >= 0.7 ? 'partial' : 'incorrect',
      feedback: payload.explanation || 'Compara las fechas y verifica cada posición de la secuencia.',
      feedbackDetails: input.map((value,index)=>({label:`Posición ${index+1}`,selected:payload.items[value],expected:payload.items[payload.expected.correct_order[index]],correct:value===payload.expected.correct_order[index],explanation:payload.order_explanations?.[index] || payload.explanation || ''})) };
  }
  if (!['multiple_select', 'matching'].includes(payload.type)) return null;
  let input;
  try { input = JSON.parse(answer); } catch { throw Object.assign(new Error('Revisa tu selección.'), { status: 400 }); }
  if (!Array.isArray(input) || !input.length) throw Object.assign(new Error('Selecciona una respuesta.'), { status: 400 });
  let correct = 0, errors = 0, total;
  if (payload.type === 'multiple_select') {
    if (new Set(input).size !== input.length || input.some(i => !Number.isInteger(i) || i < 0 || i >= payload.options.length)) throw Object.assign(new Error('Selección inválida.'), { status: 400 });
    const expected = payload.expected.correct_options;
    correct = input.filter(i => expected.includes(i)).length; errors = input.length - correct; total = expected.length;
  } else {
    const n = payload.left_items.length;
    if (input.length !== n || input.some(p => !Array.isArray(p) || p.length !== 2 || p.some(i => !Number.isInteger(i) || i < 0 || i >= n)) || new Set(input.map(p => p[0])).size !== n || new Set(input.map(p => p[1])).size !== n) throw Object.assign(new Error('Relaciona todas las parejas sin repetir elementos.'), { status: 400 });
    total = n; correct = input.filter(([l, r]) => payload.expected.correct_pairs.some(([a, b]) => a === l && b === r)).length; errors = n - correct;
  }
  const result = correct === total && !errors ? 'correct' : correct > errors ? 'partial' : 'incorrect';
  return { result, feedback: result === 'correct' ? 'Tu selección cumple lo solicitado. Compara cómo se relacionan las ideas para usar esta estrategia en otro contexto.' : result === 'partial' ? 'Reconociste parte de las relaciones. Revisa cada elemento y comprueba por qué corresponde o no corresponde.' : 'Revisa las condiciones del enunciado y contrasta cada opción o pareja con ellas antes de decidir.' };
}
function validateOrderingAnswer(answer, expected) {
  let input;
  try { input = JSON.parse(answer); } catch { throw Object.assign(new Error('Revisa el orden de los elementos.'), {status:400}); }
  const n=expected?.length;
  if (!n || !Array.isArray(input) || input.length!==n || new Set(input).size!==n || input.some(i=>!Number.isInteger(i)||i<0||i>=n)) throw Object.assign(new Error('Ordena todos los elementos una sola vez.'), {status:400});
  if(new Set(expected).size!==n || expected.some(i=>!Number.isInteger(i)||i<0||i>=n)) throw new Error('Invalid ordering answer key');
  return input;
}
function closedFeedback(payload, answer) {
  const details = [];
  if (payload.type === 'matching') {
    const selected = new Map(JSON.parse(answer));
    for (const [left, right] of payload.expected.correct_pairs) {
      const chosen = selected.get(left), correct = chosen === right;
      details.push({ label: payload.left_items[left], selected: payload.right_items[chosen], expected: payload.right_items[right], correct,
        explanation: payload.pair_explanations?.[left] || (payload.source === 'computed' ? `${payload.left_items[left]} = ${payload.right_items[right]}.` : payload.explanation || '') });
    }
  } else {
    const selected = payload.type === 'option' ? [Number(answer)] : JSON.parse(answer);
    for (let i = 0; i < payload.options.length; i++) {
      const expected = payload.expected.correct_options.includes(i), chosen = selected.includes(i);
      details.push({ label: payload.options[i], selected: chosen ? 'La elegiste' : 'No la elegiste', expected: expected ? 'Sí corresponde' : 'No corresponde', correct: chosen === expected,
        explanation: payload.option_explanations?.[i] || payload.explanation || '' });
    }
  }
  return { feedback: payload.explanation || (payload.type === 'matching' ? 'Compara tus parejas con estas relaciones y su justificación.' : 'Revisa qué afirmaciones cumplen lo solicitado y por qué.'), feedbackDetails: details };
}
module.exports = { TYPES, SESSION_FORMATS, desiredFormat, validateFormats, evaluateStructured, validateOrderingAnswer, arithmeticMatchingPlan, closedFeedback, shuffleMatching, shuffleOrdering };
