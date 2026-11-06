const { AsyncLocalStorage } = require('node:async_hooks');
const { performance } = require('node:perf_hooks');
const { randomUUID } = require('node:crypto');
const { mkdirSync, appendFileSync } = require('node:fs');
const path = require('node:path');
const scope = new AsyncLocalStorage();
const records = [];
const clean = value => String(value).replace(/[^a-zA-Z0-9_./:-]/g, '').slice(0, 100);
async function measure(name, action) {
  const started = performance.now();
  try { return await action(); }
  finally {
    const trace = scope.getStore();
    if (trace) trace.stages[clean(name)] = (trace.stages[clean(name)] || 0) + performance.now() - started;
  }
}
function usage(model, data) {
  const trace = scope.getStore();
  if (trace && data) trace.usage.push({ model: clean(model), input_tokens: data.prompt_tokens ?? data.total_tokens ?? null, output_tokens: data.completion_tokens ?? null, cached_input_tokens: data.prompt_tokens_details?.cached_tokens ?? null });
}
function tag(name, value) { const trace = scope.getStore(); if (trace) trace.tags[clean(name)] = clean(value); }
function record(trace, operation, status) {
  const row = { timestamp: new Date().toISOString(), request_id: trace.id, operation: clean(operation), status,
    total_ms: Math.round(performance.now() - trace.started), stages: Object.fromEntries(Object.entries(trace.stages).map(([k, v]) => [k, Math.round(v)])), usage: trace.usage, tags: trace.tags };
  records.push(row); if (records.length > 1000) records.shift();
  if (process.env.KUNEO_METRICS_FILE) {
    try { const file = path.resolve(process.env.KUNEO_METRICS_FILE); mkdirSync(path.dirname(file), { recursive: true }); appendFileSync(file, JSON.stringify(row) + '\n'); }
    catch { console.warn('[Metrics] No se pudo escribir el archivo de métricas.'); }
  }
  return row;
}
function middleware(req, res, next) {
  const trace = { id: randomUUID(), started: performance.now(), stages: {}, usage: [], tags: {} };
  res.set('X-Request-Id', trace.id);
  const json = res.json.bind(res);
  res.json = body => {
    res.set('Server-Timing', [...Object.entries(trace.stages).map(([k, v]) => `${clean(k)};dur=${v.toFixed(1)}`), `total;dur=${(performance.now() - trace.started).toFixed(1)}`].join(', '));
    return json(body);
  };
  // Record route templates, never raw URLs, user ids, prompts or answers.
  res.on('finish', () => record(trace, `${req.method} ${req.route?.path || 'unmatched'}`.replace(' ', ':'), res.statusCode));
  scope.run(trace, next);
}
async function capture(operation, action) {
  const trace = { id: randomUUID(), started: performance.now(), stages: {}, usage: [], tags: {} };
  return scope.run(trace, async () => {
    try { const value = await action(); return { value, metrics: record(trace, operation, 200) }; }
    catch (error) { error.metrics = record(trace, operation, error.status || 500); throw error; }
  });
}
function distribution(values) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  const at = percentile => sorted.length ? sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)] : null;
  return { samples: sorted.length, p50_ms: at(0.5), p95_ms: at(0.95), min_ms: sorted[0] ?? null, max_ms: sorted.at(-1) ?? null };
}
module.exports = { measure, usage, tag, middleware, capture, distribution, snapshot: () => structuredClone(records) };
