const { createHash } = require('node:crypto');
const { targetFor } = require('./learningContent');
const { desiredFormat } = require('./learningFormats');

// Forecast only the routing decision, NEVER insert projected answers or send
// them to the generator as student evidence. The step must agree for all
// outcomes. A conditional skill candidate is used ONLY if matchesPlan confirms
// the actual routing decision after persistence; never guess a learner result.
function nextPlan({ module, steps, attempts, globalAttempts, profile, current, onSkip=()=>{} }) {
  let routing;const votes=new Map();
  for (const result of ['correct', 'partial', 'incorrect']) {
    for (let hint_requests = 0; hint_requests <= 3; hint_requests++) {
      const projected = { step_id: current.step_id, module_id: module.id, cognitive_dimension: current.dimension, result, hint_requests };
      const target = targetFor(steps, [...attempts, projected], [...globalAttempts, projected]);
      if (target.complete || !target.step) { onSkip('possible_completion'); return null; }
      const candidate = { stepId: target.step.id, dimension: target.dimension, format: desiredFormat([...attempts, projected]) };
      if(routing&&(routing.stepId!==candidate.stepId||routing.format!==candidate.format)){onSkip('answer_dependent_target');return null;}
      routing=candidate;
      const key=JSON.stringify(candidate),vote=votes.get(key)||{candidate,count:0};vote.count++;votes.set(key,vote);
    }
  }
  const choice=[...votes.values()].filter(v=>v.candidate.dimension!==current.dimension).sort((a,b)=>b.count-a.count)[0];
  if(!choice){onSkip('same_skill_needs_feedback');return null;}
  return { ...choice.candidate, conditional:votes.size>1, base: fingerprint(module, steps, profile, globalAttempts), currentId: current.activity_id };
}
function fingerprint(module, steps, profile, attempts) {
  return createHash('sha256').update(JSON.stringify({ module, steps, grade: profile.grade_level,
    attempts: attempts.map(a => [a.attempt_id, a.module_id, a.step_id, a.result, a.cognitive_dimension, a.hint_requests, a.answer]) })).digest('hex');
}
function matchesPlan(plan, context, previousId, previousAttemptId) {
  if (plan.currentId !== previousId) return false;
  const previous = context.globalAttempts.find(a => a.attempt_id === previousAttemptId);
  if (!previous) return false;
  const before = context.globalAttempts.filter(a => a.attempt_id !== previousAttemptId);
  if (fingerprint(context.module, context.steps, context.profile, before) !== plan.base) return false;
  const target = targetFor(context.steps, context.attempts, context.globalAttempts);
  return !target.complete && target.step?.id === plan.stepId && target.dimension === plan.dimension && desiredFormat(context.attempts) === plan.format;
}
module.exports = { nextPlan, matchesPlan };
