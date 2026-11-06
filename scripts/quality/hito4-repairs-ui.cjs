// Loopback-only visual verification with the real LearningModule and authored candidates.
const path=require('node:path'),fs=require('node:fs'),http=require('node:http');
const {build}=require('./hito4-repairs.cjs');
const {normalizeStored,createContentService}=require('../../server/learningContent');
(async()=>{
 const round2=process.argv.includes('--round2');
 const round3=process.argv.includes('--round3');
 const round4=process.argv.includes('--round4');
 const round6=process.argv.includes('--round6');
 const round5=process.argv.includes('--round5');
 const live=round6?require('../../reports/hito4-2-round6/live-evaluation.json'):round5||round4||round3?{}:round2?require('../../reports/hito4-2-round2/live-evaluation.json'):require('../../reports/hito4-2-round2/pilot-regression.json');
 const service=createContentService({secret:'offline-ui',client:{}}),packets=[];
 for(const c of (round6?require('./hito4-round6.cjs').build():round5?require('./hito4-round5.cjs').build():round4?require('./hito4-round4.cjs').build():round3?require('./hito4-round3.cjs').build():round2?require('./hito4-round2-repairs.cjs').build():build())){
  const activity=normalizeStored(c.step),answer=c.checks?.[0]?.[0]??(activity.type==='ordering'?JSON.stringify(activity.expected.correct_order):activity.type==='matching'?JSON.stringify(activity.expected.correct_pairs):activity.type==='multiple_select'?JSON.stringify(activity.expected.correct_options):String(activity.expected.correct_options[0]));
  const feedback=activity.type==='text'?live.results.find(r=>r.candidateSha256===c.sha256&&r.answer===answer&&r.round===1)?.actual:await service.evaluate(activity,answer);
  if(!feedback||feedback.result!=='correct')throw Error('Missing verified feedback for '+c.module.subject);
  packets.push({module:c.module,activity,answer,feedback,supports:c.supports});
 }
 const client=path.resolve(__dirname,'../../client'),mocks=path.resolve(__dirname,'hito4-repairs-ui-mocks.js');
 const bundled=await require('../../client/node_modules/esbuild').build({entryPoints:[path.resolve(__dirname,'hito4-repairs-ui.jsx')],bundle:true,format:'esm',platform:'browser',jsx:'automatic',write:false,alias:{react:path.join(client,'node_modules/react'),'react-dom':path.join(client,'node_modules/react-dom'),'react-router-dom':path.join(client,'node_modules/react-router-dom')},loader:{'.css':'empty'},plugins:[{name:'private-fixture-services',setup(build){build.onResolve({filter:/(?:supabaseClient|learningApi|kuneoApi)(?:\.js)?$/},()=>({path:mocks}));}}]});
 const assets=path.join(client,'dist/assets'),css=fs.readdirSync(assets).find(f=>f.endsWith('.css'));
 const html='<!doctype html><html lang="es" class="dark"><meta charset="utf-8"><title>Revisión del lote Kuneo</title><link rel="stylesheet" href="/styles.css"><body style="background:#13172a;color:white;font-family:Arial"><aside style="padding:18px"><h1>Versiones candidatas · sin publicación</h1><p>Interfaz real con servicios de vista simulados y respuestas sintéticas verificadas. No consulta cuentas ni Supabase.</p><nav id="subjects" style="display:flex;flex-wrap:wrap;gap:16px;margin:12px 0"></nav><button id="run">Ejecutar revisión del lote</button><pre id="results"></pre></aside><div id="app"></div><script type="module" src="/fixture.js"></script></body></html>';
 const server=http.createServer((req,res)=>{res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  if(req.url==='/fixture.js'){res.setHeader('Content-Type','text/javascript;charset=utf-8');return res.end(bundled.outputFiles[0].text);}
  if(req.url==='/packets.json'){res.setHeader('Content-Type','application/json;charset=utf-8');return res.end(JSON.stringify(packets));}
  if(req.url==='/styles.css'){res.setHeader('Content-Type','text/css');return res.end(fs.readFileSync(path.join(assets,css)));}
  if(req.url.startsWith('/image/')||req.url.startsWith('/assets/')){const file=path.resolve(client,'public',req.url.slice(1));if(file.startsWith(path.join(client,'public')+path.sep)&&fs.existsSync(file)){res.setHeader('Content-Type','image/png');return res.end(fs.readFileSync(file));}res.writeHead(404);return res.end();}
  res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);
 });
 server.listen(0,'127.0.0.1',()=>console.log('Pilot UI: http://127.0.0.1:'+server.address().port));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
