// Read the private-safe JSONL emitted by KUNEO_METRICS_FILE; no network calls.
const fs = require('node:fs');
const { learningReport } = require('../../server/learningReport');
const input = process.argv[2];
if (!input) { console.error('Uso: node scripts/quality/hito4-metrics.cjs <archivo-jsonl>'); process.exitCode = 1; }
else {
  try {
    const rows = [], invalidLines = [];
    fs.readFileSync(input, 'utf8').split(/\r?\n/).forEach((line, index) => { if (line.trim()) try { const row = JSON.parse(line); if (typeof row.operation !== 'string') throw Error('record'); rows.push(row); } catch { invalidLines.push(index + 1); } });
    console.log(JSON.stringify({ ...learningReport(rows), invalidLines }, null, 2));
  } catch { console.error('No se pudo leer el archivo de métricas.'); process.exitCode = 1; }
}
