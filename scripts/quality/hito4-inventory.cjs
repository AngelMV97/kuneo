// Read-only curriculum inventory. No auth/student tables, mutations or AI calls.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const TABLES = ['modules', 'module_steps', 'concept_cards', 'visual_templates'];
const ALLOWED = {
 modules: ['id','title','subject','grade_range','core_concept','learning_objective','context','content','description','difficulty','source','source_unit_id','is_active','order_index','updated_at'],
 module_steps: ['id','module_id','step_order','step_type','cognitive_type','cognitive_dimension','phase','title','instruction','content','expected_response_type','success_criteria','concept_card_id','concept_card_key','visual_template_key','hint_policy','feedback_policy','next_step_logic','difficulty','enriched_content','enrichment_status','enrichment_version','enriched_at','updated_at'],
 concept_cards: ['id','concept_key','concept_name','card_type','title','body','explanation','one_line_definition','core_insight','example','common_misconception','hint_prompt','visual_template_key','visual_template','subject','grade_range','difficulty','related_concepts','enriched_content','enrichment_status','enrichment_version','enriched_at','updated_at'],
 visual_templates: ['id','template_key','template_name','description','visual_type','renderer','interaction_level','config','default_props','asset_url','subject','use_cases','supported_card_types','enriched_config','enrichment_status','enrichment_version','enriched_at','updated_at']
};
async function main() {
 const input = process.argv.find(a=>a.startsWith('--snapshot='))?.slice(11);
 if(input) return analyze(JSON.parse(fs.readFileSync(path.resolve(input),'utf8')));
 require('../../server/node_modules/dotenv').config({path:path.join(root,'server/.env'),quiet:true});
 const {createClient}=require('../../server/node_modules/@supabase/supabase-js');
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}).schema('kuneo');
 if(process.argv.includes('--probe')) {
  for(const table of TABLES){
   const r=await db.from(table).select('*',{count:'exact'}).limit(1);if(r.error)throw Object.assign(Error('Curriculum read failed'),{code:r.error.code});
   const enriched=await db.from(table).select('*').not('enriched_content','is',null).limit(1);
   const row=enriched.data?.[0]||r.data[0];
   console.log(JSON.stringify({table,count:r.count,columns:Object.keys(r.data[0]||{}),sample:row?Object.fromEntries(Object.entries(row).filter(([key])=>['subject','grade_range','step_type','cognitive_type','expected_response_type','content','enriched_content'].includes(key)).map(([key,value])=>[key,typeof value==='object'&&value!==null?{keys:Object.keys(value),preview:JSON.stringify(value).slice(0,2400)}:value])):null}));
  }
  return;
 }
 const started=new Date().toISOString(), data={}, counts={}, fields={};
 async function read(table) {
  // Discover curriculum column names only, then fetch explicit whitelisted fields.
  const probe=await db.from(table).select('*',{count:'exact'}).limit(1);if(probe.error)throw Object.assign(Error('Curriculum schema read failed'),{code:probe.error.code});
  if(probe.count===0&&!probe.data.length){fields[table]=[];counts[table]=0;return [];}
  const available=new Set(Object.keys(probe.data[0]||{}));
  fields[table]=ALLOWED[table].filter(k=>available.has(k));
  if(!available.has('id'))throw Error('Curriculum table empty or has no id: '+table);
  const rows=[];let count;
  for(let offset=0;;offset+=500){
   const r=await db.from(table).select(fields[table].join(','),{count:'exact'}).order('id').range(offset,offset+499);
   if(r.error)throw Object.assign(Error('Curriculum page read failed'),{code:r.error.code});
   if(count!==undefined&&count!==r.count)throw Error('Curriculum count changed while reading: '+table);
   count=r.count;rows.push(...r.data);if(rows.length>=count)break;
   if(!r.data.length)throw Error('Incomplete curriculum pagination: '+table);
  }
  if(new Set(rows.map(r=>r.id)).size!==rows.length||rows.length!==count)throw Error('Unreconciled curriculum rows: '+table);
  counts[table]=count;return rows;
 }
 // Independent reads. This is an interval capture, not a database transaction.
 const results=await Promise.allSettled(TABLES.map(async table=>{data[table]=await read(table);}));
 for(const result of results)if(result.status==='rejected')throw result.reason;
 const verified=await Promise.allSettled(TABLES.map(async table=>{
  const second=await read(table);
  if(JSON.stringify(second)!==JSON.stringify(data[table]))throw Error('Curriculum changed between verification reads: '+table);
 }));
 for(const result of verified)if(result.status==='rejected')throw result.reason;
 const active=new Set(data.modules.filter(m=>m.is_active!==false).map(m=>m.id));
 const discarded={inactive_modules:data.modules.length-active.size,steps_outside_active_modules:data.module_steps.filter(s=>!active.has(s.module_id)).length};
 data.modules=data.modules.filter(m=>active.has(m.id));data.module_steps=data.module_steps.filter(s=>active.has(s.module_id));
 const snapshot={version:1,started,finished:new Date().toISOString(),verification:'Two complete reads with matching selected content and row counts; interval capture, not a transaction.',scope:'Curriculum only; active modules and their steps; reusable cards and visuals. No student/auth records. No DB mutations or AI.',sourceCounts:counts,discarded,selectedFields:fields,data};
 snapshot.sha256=crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
 const folder=path.join(root,'reports/hito4-1');fs.mkdirSync(folder,{recursive:true});
 const file=path.join(folder,`snapshot-${started.replace(/[:.]/g,'-')}.json`);fs.writeFileSync(file,JSON.stringify(snapshot,null,2));
 console.log(JSON.stringify({snapshot:path.relative(root,file),sourceCounts:counts,activeModules:data.modules.length,activeSteps:data.module_steps.length,sha256:snapshot.sha256}));
 if(!process.argv.includes('--capture-only'))analyze(snapshot);
}
function analyze(snapshot) {
 const {inventory}=require('../../server/reserveInventory');
 if(snapshot.sha256&&crypto.createHash('sha256').update(JSON.stringify(snapshot.data)).digest('hex')!==snapshot.sha256)throw Error('Snapshot integrity check failed.');
 const report=inventory(snapshot);
 report.sourceFiles=Object.fromEntries(['server/reserveInventory.js','server/learningContent.js','server/learningFormats.js','server/learningPresentation.js','server/adaptive.js','client/src/pages/LearningModule.jsx','client/src/visual-engine/utils/rendererMapper.js','scripts/quality/hito4-inventory.cjs'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
 const folder=path.join(root,'reports/hito4-1');fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'inventory.json'),JSON.stringify(report,null,2));
 const csv=(rows,fields)=>[fields,...rows.map(r=>fields.map(f=>typeof r[f]==='object'?JSON.stringify(r[f]):r[f]??''))].map(row=>row.map(v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\n')+'\n';
 fs.writeFileSync(path.join(folder,'questions.csv'),csv(report.questions,['id','moduleId','stepId','index','subject','gradeRange','declaredDimension','runtimeDimension','rawFormat','runtimeFormat','origin','status','runtimeReadable','technicalCandidate','sourceSha256','preview','issueCodes']));
 fs.writeFileSync(path.join(folder,'findings.csv'),csv(report.issues,['entity','id','stepId','moduleId','index','code','severity','detail']));
 fs.writeFileSync(path.join(folder,'coverage.csv'),csv(report.coverage,['subject','gradeRange','dimension','questions','runtimeReadable','technicalCandidates','approved']));
 fs.writeFileSync(path.join(folder,'audit-queue.json'),JSON.stringify({snapshotSha256:report.snapshotSha256,scope:'Pending 4.2 only. No pedagogical approval.',rounds:report.reviewPlan},null,2));
 fs.writeFileSync(path.join(folder,'duplicates.json'),JSON.stringify(report.duplicates,null,2));
 const summary=report.summary;
 const gradeGroups=['1-3','4-5','6-7','8-9','10-11'];
 const {overlap}=require('../../server/reserveInventory');
 const lines=['# Inventario técnico 4.1','','No implica aprobación pedagógica ni modifica la selección del motor. Instantánea: `'+report.snapshotSha256+'`.','','| Unidad | Cantidad |','| --- | ---: |',...['modules','steps','stepsWithEnrichment','stepsMarkedCompleted','questions','questionsInEnrichedArrays','runtimeReadableQuestions','technicalCandidates','cards','cardVariants','visuals','enrichedVisuals','approved'].map(k=>`| ${k} | ${summary[k]} |`),'','## Candidatos técnicos por materia y grupo','','Se cuenta intersección de grados: una fila 3-5 puede contribuir a dos columnas. No sumar como preguntas únicas.','','| Materia | 1-3 | 4-5 | 6-7 | 8-9 | 10-11 |','| --- | ---: | ---: | ---: | ---: | ---: |',...Object.keys(require('../../server/learningMetrics').SUBJECTS).map(subject=>`| ${subject} | ${gradeGroups.map(group=>report.questions.filter(q=>q.subject===subject&&overlap(q.gradeRange,group)&&q.technicalCandidate).length).join(' | ')} |`),'','## Reglas detectadas','','| Regla | Registros |','| --- | ---: |',...Object.entries(summary.issueCounts).sort((a,b)=>b[1]-a[1]).map(([key,count])=>`| ${key} | ${count} |`),'','Los hallazgos incluyen IDs en `findings.csv`. Los originales están en la instantánea; las huellas vinculan cada candidato a su versión. `audit-queue.json` prepara las rondas de 4.2 y registra huecos sin sustituirlos por otros grados.','',...report.limitations.map(item=>'- '+item),''];
 fs.writeFileSync(path.join(folder,'README.md'),lines.join('\n'));
 console.log(JSON.stringify(report.summary));
}
main().catch(error=>{console.error(JSON.stringify({error:error.code||error.name,message:error.code?undefined:error.message}));process.exitCode=1;});
