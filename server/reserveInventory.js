// Pure, deterministic technical inventory. No DB client, AI calls or mutations.
const crypto = require('node:crypto');
const { normalizeStored } = require('./learningContent');
const { DIMENSIONS, SUBJECTS, normalizeSubject } = require('./learningMetrics');
const VERSION='4.1.0';
const groups=['1-3','4-5','6-7','8-9','10-11'];
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function canonical(v){return Array.isArray(v)?v.map(canonical):object(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;}
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const norm=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
function grades(value){if(!/^\d{1,2}(?:-\d{1,2})?$/.test(String(value||'')))return [];const [a,b=a]=String(value).split('-').map(Number);return a>=1&&b<=11&&a<=b?Array.from({length:b-a+1},(_,i)=>i+a):[];}
function overlap(a,b){return grades(a).some(n=>grades(b).includes(n));}
function inventory(snapshot){
 const {modules=[],module_steps:steps=[],concept_cards:cards=[],visual_templates:visuals=[]}=snapshot.data||{};
 const byModule=new Map(modules.map(m=>[m.id,m])),byCard=new Map(cards.map(c=>[c.id,c])),cardKeys=new Map(cards.map(c=>[c.concept_key,c])),visualKeys=new Map(visuals.map(v=>[v.template_key,v]));
 const issues=[],questions=[],stepRows=[],cardRows=[],visualRows=[],duplicates=[];
 const add=(entity,id,code,severity='review',detail,extra={})=>{issues.push({entity,id,code,severity,...(detail?{detail}:{}),...extra});};
 const moduleRows=modules.map(m=>{
  if(!Object.hasOwn(SUBJECTS,normalizeSubject(m.subject)))add('module',m.id,'UNKNOWN_SUBJECT','blocker');
  if(!grades(m.grade_range).length)add('module',m.id,'INVALID_GRADE_RANGE','blocker');
  if(!nonempty(m.learning_objective))add('module',m.id,'MISSING_OBJECTIVE','blocker');
  return {id:m.id,title:m.title,subject:normalizeSubject(m.subject),gradeRange:m.grade_range,objective:m.learning_objective,coreConcept:m.core_concept,sha256:hash(m)};
 });
 for(const step of steps){
  const module=byModule.get(step.module_id),enriched=step.enriched_content,hasEnriched=enriched!==null&&enriched!==undefined;
  const base=object(step.content)?step.content:{};
  if(!module)add('step',step.id,'ORPHAN_MODULE','blocker');
  if(!object(step.content))add('step',step.id,'CONTENT_NOT_OBJECT','blocker');
  if(hasEnriched&&!object(enriched))add('step',step.id,'ENRICHMENT_NOT_OBJECT','blocker');
  if(step.enrichment_status==='completed'&&!hasEnriched)add('step',step.id,'COMPLETED_WITHOUT_CONTENT','blocker');
  if(hasEnriched&&step.enrichment_status!=='completed')add('step',step.id,'CONTENT_STATUS_DISAGREEMENT','review',step.enrichment_status||'missing status');
  const e=object(enriched)?enriched:{},batch=Array.isArray(e.questions)&&e.questions.length?e.questions:null;
  if(Array.isArray(e.questions)&&!e.questions.length)add('step',step.id,'EMPTY_QUESTION_ARRAY','review');
  const rawCandidates=batch||((base.question||base.prompt||e.question||e.text||e.expected_answer)?[e]:[]);
  const refs=[['concept_card_id',step.concept_card_id,byCard],['concept_card_key',step.concept_card_key||e.step_config?.concept_card_key,cardKeys],['visual_template_key',step.visual_template_key||e.step_config?.visual_template_key,visualKeys]];
  for(const [field,key,map] of refs)if(key&&!map.has(key))add('step',step.id,'BROKEN_'+field.toUpperCase(),'review',String(key));
  const linked=byCard.get(step.concept_card_id);
  if(linked&&module){
   if(normalizeSubject(linked.subject)!==normalizeSubject(module.subject))add('step',step.id,'CARD_SUBJECT_MISMATCH','review',linked.id);
   if(linked.grade_range&&!overlap(linked.grade_range,module.grade_range))add('step',step.id,'CARD_GRADE_DISJOINT','review',linked.id);
  }
  const questionIds=[];
  for(let index=0;index<rawCandidates.length;index++){
   const raw=object(rawCandidates[index])?rawCandidates[index]:{},id=`${step.id}:q:${index}`,declared=raw.cognitive_dimension||raw.expected_answer?.cognitive_dimension||e.cognitive_dimension||e.expected_answer?.cognitive_dimension;
   const expected=raw.expected_answer||e.expected_answer;
   const question=raw.text||raw.question||base.question||base.prompt;
   const options=raw.options||base.options||[],type=raw.type||expected?.type||base.answer_type||'text';
   let normalized=null;
   const begin=issues.length;
   const flag=(code,severity='blocker',detail)=>add('question',id,code,severity,detail,{stepId:step.id,moduleId:step.module_id,index});
   try{normalized=normalizeStored(step,index);}catch{flag('NORMALIZER_EXCEPTION');}
   if(!nonempty(question))flag('MISSING_QUESTION');
   if(!expected||!object(expected)&&typeof expected!=='string')flag('MISSING_OR_INVALID_KEY');
   if(!normalized)flag('RUNTIME_UNREADABLE');
   if(!declared)flag('DIMENSION_IMPLICIT_COMPREHENSION','review');
   else if(!DIMENSIONS.includes(declared))flag('UNKNOWN_DIMENSION');
   const activeType=normalized?.type||({multiple_choice:'option',open_text:'text',keywords:'text'}[type]||type);
   if(!['option','text','numeric','multiple_select','matching','ordering'].includes(activeType))flag('UNSUPPORTED_QUESTION_FORMAT');
   if(!normalized&&activeType==='ordering'){
    const order=expected?.correct_order,n=(raw.items||step.content?.items)?.length;
    if(!Array.isArray(order)||order.length!==n||new Set(order).size!==n||order.some(i=>!Number.isInteger(i)||i<0||i>=n))flag('INVALID_ORDER_KEY');
   }
   const displaysOptions=['option','multiple_select'].includes(activeType);
   if(displaysOptions&&object(expected)&&expected.correct_options!==undefined&&(!Array.isArray(expected.correct_options)||expected.correct_options.some(i=>!Number.isInteger(i)||i<0||i>=options.length)))flag('CHOICE_KEY_OUT_OF_RANGE');
   if(displaysOptions&&options.some?.(v=>typeof v==='string'&&/^opci[oó]n\s+[a-z0-9]\s*$/i.test(v.trim())))flag('PLACEHOLDER_OPTIONS');
   if(/\bpregunta\s+\d+\s+sobre\b/i.test(question||''))flag('PLACEHOLDER_QUESTION');
   if(/(?:sobre|relacionado con)\s+(?:estudios_sociales|ciencias_naturales|numeros_y_operaciones|reading)\b/i.test(question||''))flag('GENERIC_SCAFFOLD','review');
   if(displaysOptions&&Array.isArray(options)&&new Set(options.map(norm)).size!==options.length)flag('DUPLICATE_OPTIONS');
   if(/(?:lee|seg[uú]n|aparecen? en|del) (?:el |este |un |ese )?(?:texto|cuento|relato|lectura)/i.test(question||'')&&String(question||'').length<220&&!/[«“"\n]/.test(question||''))flag('READING_DEPENDENCY_REVIEW','review','Possible external or omitted reading; verify self-containment.');
   if(normalized){
    const exp=normalized.expected,strategy=exp.evaluation_strategy||exp.type;
    if(!DIMENSIONS.includes(normalized.dimension))flag('RUNTIME_UNKNOWN_DIMENSION');
    if(declared&&DIMENSIONS.includes(declared)&&declared!==normalized.dimension)flag('DECLARED_RUNTIME_DIMENSION_MISMATCH');
    if(strategy==='rubric'&&(!nonempty(exp.rubric)||!nonempty(exp.answer)))flag('MISSING_RUBRIC_REFERENCE');
    if(strategy==='exact_text'&&!nonempty(exp.answer))flag('MISSING_EXACT_REFERENCE');
    if(strategy==='keywords'){
     const keys=exp.keywords||exp.required_keywords;
     if(!Array.isArray(keys)||!keys.length||keys.some(k=>!nonempty(k)))flag('INVALID_KEYWORDS');
     else if(exp.min_keywords!==undefined&&(!Number.isInteger(exp.min_keywords)||exp.min_keywords<1||exp.min_keywords>keys.length))flag('INVALID_KEYWORD_THRESHOLD');
     flag('KEYWORD_GRADING_REVIEW','review','Literal-keyword grading is not a rubric-based pedagogical verification.');
    }
    if(strategy==='numeric'){
     if(exp.correct_value===null||exp.correct_value===''||!Number.isFinite(Number(exp.correct_value)))flag('INVALID_NUMERIC_KEY');
    }
    if(normalized.type==='ordering'){
     const order=exp.correct_order,n=normalized.items?.length;
     if(!Array.isArray(order)||order.length!==n||new Set(order).size!==n||order.some(i=>!Number.isInteger(i)||i<0||i>=n))flag('INVALID_ORDER_KEY');
    }
    if(!['option','text','numeric','keywords','multiple_select','matching','ordering','rubric','exact_text'].includes(strategy))flag('UNKNOWN_EVALUATOR');
    if(['option','multiple_select'].includes(normalized.type)&&!raw.option_explanations)flag('NO_OPTION_RATIONALES','review');
    if(normalized.type==='matching'&&!raw.pair_explanations)flag('NO_PAIR_RATIONALES','review');
    if(!nonempty(normalized.explanation))flag('NO_GENERAL_FEEDBACK','review');
   }
   const flags=issues.slice(begin),blocked=flags.some(f=>f.severity==='blocker');
   const status=!hasEnriched?'pending_enrichment':flags.some(f=>/^PLACEHOLDER_/.test(f.code))?'exclude_recommended':blocked?'technical_failure':'review_candidate';
   const row={id,sourceQuestionId:raw.id||null,moduleId:step.module_id,stepId:step.id,index,subject:normalizeSubject(module?.subject),gradeRange:module?.grade_range,objective:module?.learning_objective,stepOrder:step.step_order,declaredDimension:declared||null,runtimeDimension:normalized?.dimension||null,rawFormat:type,runtimeFormat:normalized?.type||null,origin:batch?'enriched_questions':hasEnriched?'enriched_single':'base',status,runtimeReadable:!!normalized,technicalCandidate:!!normalized&&!blocked,sourceSha256:hash({stepContent:step.content,enriched}),questionSha256:hash({question,options,type,expected,left:raw.left_items||base.left_items,right:raw.right_items||base.right_items}),stemSha256:hash(norm(question)),preview:String(question||'').slice(0,180),issueCodes:flags.map(f=>f.code)};
   questions.push(row);questionIds.push(id);
  }
  const q=questions.slice(questions.length-questionIds.length);
  stepRows.push({id:step.id,moduleId:step.module_id,order:step.step_order,subject:normalizeSubject(module?.subject),gradeRange:module?.grade_range,cognitiveType:step.cognitive_type,stepType:step.step_type,declaredDimension:e.cognitive_dimension||null,enrichmentStatus:step.enrichment_status,hasEnriched,sha256:hash(step),questionIds,technicalCandidates:q.filter(r=>r.technicalCandidate).length,conceptCardId:step.concept_card_id||null,visualKey:step.visual_template_key||null});
 }
 for(const card of cards){
  const begin=issues.length;
  if(!nonempty(card.body))add('card',card.id,'MISSING_CARD_BODY','blocker');
  const vk=card.visual_template_key||card.visual_template;if(vk&&!visualKeys.has(vk))add('card',card.id,'BROKEN_VISUAL_REFERENCE','review',vk);
  const enriched=card.enriched_content;
  if(card.enrichment_status==='completed'&&!object(enriched))add('card',card.id,'COMPLETED_WITHOUT_CONTENT','blocker');
  if(enriched?.refined?.subject&&normalizeSubject(enriched.refined.subject)!==normalizeSubject(card.subject))add('card',card.id,'REFINED_SUBJECT_MISMATCH','review');
  cardRows.push({id:card.id,key:card.concept_key,subject:normalizeSubject(card.subject),gradeRange:card.grade_range,sha256:hash(card),hasEnriched:object(enriched),variantCount:object(enriched?.variants)?Object.keys(enriched.variants).length:0,visualKey:vk||null,issueCodes:issues.slice(begin).map(f=>f.code),status:issues.slice(begin).some(f=>f.severity==='blocker')?'technical_failure':'review_candidate'});
 }
 for(const visual of visuals){
  const begin=issues.length;
  if(!object(visual.config))add('visual',visual.id,'INVALID_VISUAL_CONFIG','blocker');
  if(!['svg_custom','recharts','timeline'].includes(visual.renderer))add('visual',visual.id,'UNSUPPORTED_LEGACY_RENDERER','blocker',visual.renderer);
  if(visual.enrichment_status==='completed'&&!object(visual.enriched_config))add('visual',visual.id,'COMPLETED_WITHOUT_CONTENT','blocker');
  visualRows.push({id:visual.id,key:visual.template_key,renderer:visual.renderer,hasEnriched:object(visual.enriched_config),sha256:hash(visual),issueCodes:issues.slice(begin).map(f=>f.code),status:issues.slice(begin).some(f=>f.severity==='blocker')?'technical_failure':'review_candidate'});
 }
 for(const [field,kind] of [['questionSha256','exact_content'],['stemSha256','same_stem_candidate']]){
  const map=new Map();for(const q of questions){if(!q.preview)continue;const key=q[field];if(!map.has(key))map.set(key,[]);map.get(key).push(q.id);}
  for(const [sha256,ids] of map)if(ids.length>1)duplicates.push({kind,sha256,count:ids.length,questionIds:ids});
 }
 const coverage=[];
 for(const subject of Object.keys(SUBJECTS))for(const gradeRange of groups)for(const dimension of DIMENSIONS){
  const qs=questions.filter(q=>q.subject===subject&&overlap(q.gradeRange,gradeRange)&&(q.declaredDimension===dimension||!q.declaredDimension&&q.runtimeDimension===dimension));
  coverage.push({subject,gradeRange,dimension,questions:qs.length,runtimeReadable:qs.filter(q=>q.runtimeReadable).length,technicalCandidates:qs.filter(q=>q.technicalCandidate).length,approved:0});
 }
 const count=(rows,key)=>rows.reduce((a,r)=>{const k=String(typeof key==='function'?key(r):r[key]);a[k]=(a[k]||0)+1;return a},{});
 const issueCounts=count(issues,'code');
 const summary={modules:modules.length,steps:steps.length,stepsWithEnrichment:stepRows.filter(s=>s.hasEnriched).length,stepsWithoutEnrichment:stepRows.filter(s=>!s.hasEnriched).length,stepsMarkedCompleted:steps.filter(s=>s.enrichment_status==='completed').length,questions:questions.length,questionsInEnrichedArrays:questions.filter(q=>q.origin==='enriched_questions').length,runtimeReadableQuestions:questions.filter(q=>q.runtimeReadable).length,technicalCandidates:questions.filter(q=>q.technicalCandidate).length,questionsByStatus:count(questions,'status'),stepsWithTechnicalCandidates:stepRows.filter(s=>s.technicalCandidates>0).length,cards:cards.length,enrichedCards:cardRows.filter(c=>c.hasEnriched).length,cardVariants:cardRows.reduce((n,c)=>n+c.variantCount,0),visuals:visuals.length,enrichedVisuals:visualRows.filter(v=>v.hasEnriched).length,visualsWithSupportedLegacyRenderer:visualRows.filter(v=>!v.issueCodes.includes('UNSUPPORTED_LEGACY_RENDERER')).length,exactDuplicateGroups:duplicates.filter(d=>d.kind==='exact_content').length,sameStemGroups:duplicates.filter(d=>d.kind==='same_stem_candidate').length,approved:0,issueCounts};
 const reviewPlan=[];
 const round1Groups=['8-9','4-5','1-3','6-7','10-11'];
 Object.keys(SUBJECTS).forEach((subject,i)=>{
  const desiredGrade=round1Groups[i];
  const candidates=questions.filter(q=>q.subject===subject&&q.origin!=='base'&&q.technicalCandidate).sort((a,b)=>a.issueCodes.length-b.issueCodes.length||a.id.localeCompare(b.id));
  const selected=candidates.find(q=>overlap(q.gradeRange,desiredGrade))||candidates[0];
  reviewPlan.push({round:1,subject,desiredGrade,selected:selected?{questionId:selected.id,stepId:selected.stepId,moduleId:selected.moduleId,gradeRange:selected.gradeRange,dimension:selected.declaredDimension||selected.runtimeDimension,sha256:selected.sourceSha256}:null,gap:!selected||!overlap(selected.gradeRange,desiredGrade),state:'pending_pedagogical_audit'});
 });
 const used=new Set(),usedDimensions=new Set(),usedFormats=new Set();
 const diversity=q=>(usedDimensions.has(q.runtimeDimension)?0:30)+(usedFormats.has(q.runtimeFormat)?0:20);
 for(const subject of Object.keys(SUBJECTS))for(const gradeRange of groups){const selected=questions.filter(q=>q.subject===subject&&overlap(q.gradeRange,gradeRange)&&q.origin!=='base'&&q.technicalCandidate&&!used.has(q.id)).sort((a,b)=>diversity(b)-diversity(a)||a.issueCodes.length-b.issueCodes.length||a.id.localeCompare(b.id))[0];if(selected){used.add(selected.id);usedDimensions.add(selected.runtimeDimension);usedFormats.add(selected.runtimeFormat);}reviewPlan.push({round:2,subject,desiredGrade:gradeRange,selected:selected?{questionId:selected.id,stepId:selected.stepId,moduleId:selected.moduleId,gradeRange:selected.gradeRange,eligibleGrades:grades(selected.gradeRange).filter(n=>grades(gradeRange).includes(n)),dimension:selected.declaredDimension||selected.runtimeDimension,format:selected.runtimeFormat,sha256:selected.sourceSha256}:null,gap:!selected,state:'pending_pedagogical_audit'});}
 return {version:VERSION,snapshotSha256:snapshot.sha256||hash(snapshot.data),sourceWindow:{started:snapshot.started,finished:snapshot.finished,verification:snapshot.verification},sourceCounts:snapshot.sourceCounts,summary,coverage,reviewPlan,modules:moduleRows,steps:stepRows,questions,cards:cardRows,visuals:visualRows,issues,duplicates,limitations:['Technical checks only; no content is pedagogically approved.','exclude_recommended is an inventory recommendation, not a database/runtime change.','Grade coverage uses intersection: ranges may contribute to multiple grade groups; do not sum cells as unique counts.','runtimeReadable mirrors normalizeStored; technicalCandidate adds inventory guards and still requires pedagogical review.','The active LearningModule uses generated support cards/visuals; legacy association/render support does not prove current display or pedagogical usefulness.','Reading-dependency and same-stem flags are candidates for manual examination, not proven factual errors.']};
}
module.exports={inventory,hash,grades,overlap,VERSION};
