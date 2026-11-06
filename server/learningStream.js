// Parse only explicitly public top-level fields from an unfinished JSON object.
// Private grading fields are never forwarded, including during partial escapes.
function readString(text, start) {
  let value = '', i = start + 1;
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === '"') return { value, end: i + 1, complete: true };
    if (c !== '\\') { value += c; continue; }
    if (++i >= text.length) break;
    const e = text[i];
    if (e === 'u') { const hex = text.slice(i + 1, i + 5); if (!/^[0-9a-f]{4}$/i.test(hex)) break; value += String.fromCharCode(parseInt(hex, 16)); i += 4; }
    else value += ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '"': '"', '\\': '\\', '/': '/' })[e] ?? '';
  }
  return { value, end: i, complete: false };
}
function publicDraft(text, fields) {
  const allowed = new Set(fields), result = {};
  let i = text.indexOf('{') + 1;
  if (!i) return result;
  while (i < text.length) {
    while (/[\s,]/.test(text[i] || '') && i < text.length) i++;
    if (text[i] !== '"') break;
    const key = readString(text, i); if (!key.complete) break;
    i = key.end; while (/\s/.test(text[i] || '') && i < text.length) i++;
    if (text[i++] !== ':') break;
    while (/\s/.test(text[i] || '') && i < text.length) i++;
    if (text[i] === '"') {
      const item = readString(text, i); if (allowed.has(key.value)) result[key.value] = item.value.slice(0, 4000);
      if (!item.complete) break; i = item.end;
    } else {
      const start = i; let depth = 0, complete = false;
      for (; i < text.length; i++) {
        if (text[i] === '"') { const s = readString(text, i); if (!s.complete) return result; i = s.end - 1; continue; }
        if ('[{'.includes(text[i])) depth++;
        else if (']}'.includes(text[i])) { if (!depth) { complete = true; break; } depth--; }
        if (!depth && (text[i] === ',' || text[i] === ']' || text[i] === '}')) { if (text[i] !== ',') i++; complete = true; break; }
      }
      if (!complete) break;
      if (allowed.has(key.value)) { try { result[key.value] = JSON.parse(text.slice(start, i)); } catch { /* Only complete values. */ } }
    }
  }
  return result;
}
function beginStream(res, { previews = true } = {}) {
  res.set({ 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const send = (type, data) => { if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify({ type, data }) + '\n'); };
  const status = () => send('status', { message: 'Preparando contenido…' });
  status();
  const heartbeat = setInterval(status, 10000);
  heartbeat.unref(); res.on('close', () => clearInterval(heartbeat));
  return { status, preview: data => { if (previews) send('preview', data); }, done: data => { clearInterval(heartbeat); send('done', data); res.end(); } };
}
module.exports = { publicDraft, beginStream };
