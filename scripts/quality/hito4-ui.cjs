// Serve a private loopback fixture using the real LearningModule component.
const path = require('node:path'), fs = require('node:fs'), http = require('node:http');
const client = path.resolve(__dirname, '../../client'), mocks = path.resolve(__dirname, 'hito4-ui-mocks.js');
(async () => {
  const { build } = require('../../client/node_modules/esbuild');
  const bundled = await build({ entryPoints: [path.resolve(__dirname, 'hito4-ui.jsx')], bundle: true, format: 'iife', platform: 'browser', jsx: 'automatic', write: false,
    alias: { react: path.join(client, 'node_modules/react'), 'react-dom': path.join(client, 'node_modules/react-dom'), 'react-router-dom': path.join(client, 'node_modules/react-router-dom') }, loader: { '.css': 'empty' },
    plugins: [{ name: 'local-fixture-only', setup(build) { build.onResolve({ filter: /(?:supabaseClient|learningApi|kuneoApi)(?:\.js)?$/ }, () => ({ path: mocks })); } }]
  });
  const cssName = fs.readdirSync(path.join(client, 'dist/assets')).find(name => name.endsWith('.css'));
  const html = '<!doctype html><html lang="es" class="dark"><head><meta charset="utf-8"><title>Kuneo 4.0 · Prueba local</title><link rel="stylesheet" href="/styles.css"></head><body style="background:#13172a;color:white;font-family:Arial"><aside style="padding:20px;border-bottom:1px solid #555"><h1>Hito 4.0 · Interfaz real con servicios simulados</h1><p id="status">Sin cuentas reales, OpenAI ni Supabase</p><button id="run" style="padding:12px;background:#7e22ce;border-radius:8px;margin:10px 0">Ejecutar comprobaciones de interfaz</button><pre id="results" style="white-space:pre-wrap"></pre></aside><div id="app"></div><script src="/fixture.js"></script></body></html>';
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); return res.end(bundled.outputFiles[0].text); }
    if (req.url === '/styles.css') { res.setHeader('Content-Type', 'text/css'); return res.end(fs.readFileSync(path.join(client, 'dist/assets', cssName))); }
    if (req.url === '/image/characters/tuko-home.png') { res.setHeader('Content-Type', 'image/png'); return res.end(fs.readFileSync(path.join(client, 'public/image/characters/tuko-home.png'))); }
    if (req.url.endsWith('.woff') || req.url.endsWith('.woff2') || req.url.endsWith('.ttf')) { const file = path.join(client, 'dist/assets', path.basename(req.url)); if (fs.existsSync(file)) return res.end(fs.readFileSync(file)); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
  });
  server.listen(0, '127.0.0.1', () => console.log(`UI fixture: http://127.0.0.1:${server.address().port}`));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
