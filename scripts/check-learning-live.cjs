// Read-only compatibility check. --openai also generates/evaluates one synthetic
// activity; it never creates users, inserts attempts, or changes Supabase data.
require('dotenv').config({ path: require('node:path').join(__dirname, '../server/.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');
const { createContentService, normalizeStored } = require('../server/learningContent');
const { readAll, summary } = require('../server/learningMetrics');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { db: { schema: 'kuneo' }, auth: { persistSession: false } });
async function run() {
  if (process.argv.includes('--learning-matching')) { await require('./quality/learning-session.cjs')({subjects:['mathematics'],formats:['matching'],includeSupport:false}); return; }
  if (process.argv.includes('--learning-session')) { await require('./quality/learning-session.cjs')(); return; }
  if (process.argv.includes('--hito2-language')) { await require('./quality/hito2.cjs')({subjects:['language']}); return; }
  if (process.argv.includes('--hito3')) { await require('./quality/hito3.cjs')(); return; }
  if (process.argv.includes('--hito2')) { await require('./quality/hito2.cjs')(); return; }
  if (process.argv.includes('--hito1')) { await require('./quality/hito1.cjs')(db); return; }
  if (process.argv.includes('--hito0')) { await require('./quality/hito0.cjs')(db); return; }
  if (process.argv.includes('--hito0-evaluate')) { await require('./quality/hito0.cjs')(db, { evaluationOnly: true }); return; }
  const { data: steps, error } = await db.from('module_steps').select('*').not('enriched_content', 'is', null).limit(8);
  if (error) throw error;
  const { data: module, error: moduleError } = await db.from('modules').select('*').eq('id', steps[0].module_id).single();
  if (moduleError) throw moduleError;
  const { data: profiles, error: profileError } = await db.from('profiles').select('user_id,grade_level').limit(3);
  if (profileError) throw profileError;
  console.log(JSON.stringify({ module_subject: module.subject, grade_range: module.grade_range, sample_formats: steps.map(s => ({ keys: Object.keys(s.enriched_content), expected_type: typeof s.enriched_content.expected_answer, question: s.enriched_content.questions?.[0] })) }));
  for (const profile of profiles) {
    const attempts = await readAll(db, 'student_step_attempts', profile.user_id);
    const overview = await require('../server/learningRouter').overview(db, profile.user_id);
    console.log(JSON.stringify({ profile_grade: profile.grade_level, attempts: attempts.length, summary_valid: !!summary(attempts, [module], steps).dimensions, practiced_modules: overview.summary.total, resumable_module: !!overview.summary.lastActivity }));
  }
  console.log(JSON.stringify({ evaluable_reserve_samples: steps.filter(s => normalizeStored(s)).length, sampled_steps: steps.length }));
  if (process.argv.includes('--openai')) {
    const service = createContentService({ secret: process.env.SUPABASE_SERVICE_ROLE_KEY });
    const grade = Number(String(module.grade_range).split('-')[0]);
    const generated = await service.generate({ userId: 'synthetic-read-only-probe', profile: { grade_level: grade }, module, steps: steps.filter(s => s.module_id === module.id), attempts: [] });
    if (generated.activity.source !== 'generated') throw new Error('OpenAI generation unavailable; reserve fallback works.');
    const payload = service.decode(generated.token, 'synthetic-read-only-probe');
    const answer = payload.type === 'option' ? String(payload.expected.correct_options[0]) : payload.expected.answer;
    const evaluation = await service.evaluate(payload, answer);
    console.log(JSON.stringify({ openai_generation: 'ok', type: payload.type, dimension: payload.dimension, grade_group: payload.grade_group, reference_answer_evaluation: evaluation.result, public_response_contains_solution: JSON.stringify(generated.activity).includes('correct_options') }));
    if (evaluation.result !== 'correct') throw new Error('Reference answer was not accepted.');
  }
}
run().catch(error => { console.error(JSON.stringify({ error: error.message || error.code })); process.exitCode = 1; });
