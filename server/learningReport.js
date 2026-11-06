const { distribution } = require('./runtimeMetrics');
const count = (rows, key, allowed) => rows.reduce((result, row) => { const value = allowed.includes(row.tags?.[key]) ? row.tags[key] : 'other'; result[value] = (result[value] || 0) + 1; return result; }, {});
function learningReport(rows) {
  const requests = rows.filter(r => r.operation === 'GET:/learning/modules/:moduleId/activity');
  const successful = requests.filter(r => Number(r.tags?.terminal_status || r.status) < 400 && r.tags?.stream_outcome !== 'error');
  const builds = rows.filter(r => ['GET:/learning/modules/:moduleId/activity', 'next_activity_prefetch', 'practice_restart_prefetch', 'activity_lookahead'].includes(r.operation) && Object.hasOwn(r.stages || {}, 'activity_build'));
  const reasons = ['timeout', 'refusal', 'incomplete', 'review_rejected', 'contract', 'repeated_question', 'network', 'rate_limit', 'provider_auth', 'provider_unavailable', 'unknown'];
  return { generatedAt: new Date().toISOString(), records: rows.length,
    delivered: { requests: requests.length, successful: successful.length, errors: requests.length - successful.length, sources: count(successful, 'activity_source', ['generated', 'computed', 'stored', 'complete']) },
    serverLatency: Object.fromEntries(['cold', 'prepared', 'lookahead_wait', 'published_cache'].map(kind => [kind, distribution(successful.filter(r => r.tags?.activity_delivery === kind).map(r => r.total_ms))])),
    lookahead:{plans:count(rows.filter(r=>r.tags?.lookahead_plan),'lookahead_plan',['stable_target','conditional_skill']),skipped:count(rows.filter(r=>r.tags?.lookahead_unavailable),'lookahead_unavailable',['possible_completion','answer_dependent_target','same_skill_needs_feedback']),wait:distribution(requests.map(r=>r.stages?.lookahead_wait)),userQueueWait:distribution(requests.map(r=>r.stages?.user_queue_wait))},
    builds: { total: builds.length, outcomes: count(builds, 'generation_outcome', ['generated', 'computed', 'reserve', 'unavailable']), repairs: builds.filter(r => r.tags?.generation_repair === 'attempted').length,
      initialFailures: count(builds.filter(r => r.tags?.generation_failure_initial), 'generation_failure_initial', reasons), finalFailures: count(builds.filter(r => r.tags?.generation_failure_final), 'generation_failure_final', reasons) },
    resumes: count(rows.filter(r => r.operation === 'POST:/learning/resume'), 'activity_resume', ['pending', 'answered']),
    limitations: ['Server timings exclude browser rendering and client network latency.', 'Published-cache retries are separate from prepared activities.', 'Build outcomes include background prefetch, not only displayed questions.', 'Small samples do not establish a production latency target.'] };
}
module.exports = { learningReport };
