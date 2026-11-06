// Deliberately narrow, deterministic linear-expression checker. No eval or CAS
// heuristics. Unsupported notation, powers/nonlinear products defer to grading.
function parseLinear(source) {
  const s = source.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[×·]/g, '*');
  if (s.length > 180 || !/^[0-9a-z.+*/()\-]+$/i.test(s)) return null;
  const tokens = s.match(/\d+(?:\.\d+)?|[a-z]|[+*/()\-]/gi) || [];
  if (tokens.join('') !== s || tokens.length > 120) return null;
  let i = 0, variable = null;
  const add = (a, b, sign = 1) => [a[0] + sign * b[0], a[1] + sign * b[1]];
  function atom() {
    const t = tokens[i++];
    if (t === '+') return atom();
    if (t === '-') return atom().map(n => -n);
    if (t === '(') { const v = sum(); if (tokens[i++] !== ')') throw Error(); return v; }
    if (/^\d/.test(t || '')) return [0, Number(t)];
    if (/^[a-z]$/i.test(t || '')) { if (variable && variable !== t.toLowerCase()) throw Error(); variable = t.toLowerCase(); return [1, 0]; }
    throw Error();
  }
  function product() {
    let value = atom();
    while (i < tokens.length && !['+', '-', ')'].includes(tokens[i])) {
      const op = ['*', '/'].includes(tokens[i]) ? tokens[i++] : '*', right = atom();
      if (op === '/') { if (right[0] || !right[1]) throw Error(); value = value.map(n => n / right[1]); }
      else { if (value[0] && right[0]) throw Error(); value = [value[0] * right[1] + value[1] * right[0], value[1] * right[1]]; }
    }
    return value;
  }
  function sum() { let v = product(); while (['+', '-'].includes(tokens[i])) { const op = tokens[i++]; v = add(v, product(), op === '+' ? 1 : -1); } return v; }
  try { const value = sum(); return i === tokens.length && value.every(Number.isFinite) ? { variable, value } : null; } catch { return null; }
}
function gradeLinear(payload, answer) {
  if (payload.subject !== 'mathematics' || !/simplific/i.test(payload.question) || /justifica|explica|procedimiento|pasos/i.test(payload.question)) return null;
  const match = payload.question.match(/expresi[oó]n[^:\n]*:\s*([^¿?\n]+)/i);
  if (!match) return null;
  const left = parseLinear(match[1].trim().replace(/[.;]+$/, '')), right = parseLinear(answer);
  if (!left || !right || left.variable !== right.variable) return null;
  const equal = left.value.every((x, i) => Math.abs(x - right.value[i]) <= 1e-10 * Math.max(1, Math.abs(x)));
  return { result: equal ? 'correct' : 'incorrect', feedback: equal ? 'Tu expresión es equivalente a la original. Aplicaste correctamente la distributiva y la combinación de términos semejantes.' : 'Revisa la distributiva y los signos de cada término antes de combinar los términos semejantes.' };
}
module.exports = { parseLinear, gradeLinear };
