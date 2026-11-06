const { performance } = require('node:perf_hooks');
const path = require('node:path');
const fs = require('node:fs');
const { capture, distribution } = require('../../server/runtimeMetrics');
const { createContentService } = require('../../server/learningContent');
const { DIMENSIONS } = require('../../server/learningMetrics');
const cases = require('./learning-reference.cjs');

module.exports = async function hito0(db, { evaluationOnly = false } = {}) {
  const service = createContentService({ secret: process.env.SUPABASE_SERVICE_ROLE_KEY });
  const report = { created_at: new Date().toISOString(), kind: 'synthetic_read_only_baseline', writes_to_supabase: false,
    limitations: ['Small pilot sample; p95 is descriptive, not a production SLO.', 'No real student answers are sent to OpenAI.', 'Persistence and browser/network latency are not exercised by this synthetic baseline.', 'Generated activities require pedagogical review; passing schema validation is not a teaching-quality certification.'], generation: [], evaluation: [], database: [] };
  for (let i = 0; i < 5; i++) {
    const started = performance.now();
    const { data, error } = await db.schema('kuneo').from('module_steps').select('id,module_id,step_order').order('id').range(0, 29);
    if (error) throw error;
    report.database.push({ operation: 'sample_steps_read', elapsed_ms: Math.round(performance.now() - started), rows: data.length });
  }
  // Limit concurrency and API calls: 10 generations + 30 reference evaluations.
  let next = 0;
  async function worker() {
    while (next < cases.length) {
      const item = cases[next++];
      const module = { id: item.id, title: item.question, subject: item.subject, learning_objective: item.rubric };
      const step = { id: `${item.id}-objective`, module_id: item.id, step_order: 1, content: { reference_context: item.question, learning_goal: item.rubric } };
      const evidence = DIMENSIONS.filter(d => d !== item.dimension).flatMap(d => [0, 1].map(n => ({ step_id: 'prior-objective', result: 'correct', cognitive_dimension: d, answer: '', hint_requests: 0, created_at: `2026-01-01T00:00:0${n}Z` })));
      if (!evaluationOnly) try {
        const run = await capture('benchmark_generation', () => service.generate({ userId: 'synthetic-quality-baseline', profile: { grade_level: item.grade }, module, steps: [step], attempts: evidence }));
        report.generation.push({ case_id: item.id, grade: item.grade, subject: item.subject, target_dimension: item.dimension, activity: run.value.activity, metrics: run.metrics });
      } catch (error) { report.generation.push({ case_id: item.id, error: error.message, metrics: error.metrics }); }
      for (const example of item.answers) {
        try {
          const run = await capture('benchmark_evaluation', () => service.evaluate({ subject: item.subject, type: 'text', expected: { type: 'rubric', answer: item.reference, rubric: item.rubric }, question: item.question, dimension: item.dimension, grade_group: require('../../server/learningContent').gradeGroup(item.grade) }, example.answer));
          report.evaluation.push({ case_id: item.id, expected: example.result, observed: run.value.result, passed: example.result === run.value.result, feedback: run.value.feedback, metrics: run.metrics });
        } catch (error) { report.evaluation.push({ case_id: item.id, expected: example.result, passed: false, error: error.message, metrics: error.metrics }); }
      }
      console.log(JSON.stringify({ hito0_case_complete: item.id, evaluation_passed: report.evaluation.filter(r => r.case_id === item.id && r.passed).length, evaluation_total: item.answers.length }));
    }
  }
  await Promise.all([worker(), worker()]);
  report.summary = {
    generation: distribution(report.generation.filter(x => x.activity?.source === 'generated').map(x => x.metrics.total_ms)),
    evaluation: distribution(report.evaluation.filter(x => !x.error).map(x => x.metrics.total_ms)),
    database: distribution(report.database.map(x => x.elapsed_ms)),
    reference_passed: report.evaluation.filter(x => x.passed).length, reference_total: report.evaluation.length,
    tokens: report.generation.concat(report.evaluation).flatMap(x => x.metrics?.usage || []).reduce((sum, u) => ({ input: sum.input + (u.input_tokens || 0), output: sum.output + (u.output_tokens || 0) }), { input: 0, output: 0 }) };
  const output = path.join(__dirname, evaluationOnly ? '../../reports/hito0-evaluation-after.json' : '../../reports/hito0-baseline.json');
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ report: path.basename(output), ...report.summary }));
  return report;
};
