// Fixed categories only: provider messages may contain prompts or credentials.
function failureReason(error) {
  const chain = []; let current = error;
  while (current && chain.length < 6 && !chain.includes(current)) { chain.push(current); current = current.cause; }
  const reasons = new Set(['timeout', 'refusal', 'incomplete', 'review_rejected']);
  for (const item of chain.reverse()) {
    if (reasons.has(item.learningReason)) return item.learningReason;
    if (/timeout|abort/i.test(item.name || '') || /ETIMEDOUT|UND_ERR_.*TIMEOUT/.test(item.code || '')) return 'timeout';
    if (/^Request (?:was aborted|timed out)\.?$/i.test(item.message || '')) return 'timeout';
    if (item.status === 429) return 'rate_limit';
    if ([401, 403].includes(item.status)) return 'provider_auth';
    if (item.status >= 500) return 'provider_unavailable';
    if (/connection|fetch/i.test(item.name || '') || /ECONN|ENOTFOUND|EAI_AGAIN|UND_ERR_SOCKET/.test(item.code || '')) return 'network';
    if (item instanceof SyntaxError || /^(Invalid |Missing )/.test(item.message || '')) return 'contract';
    if (item.message === 'Repeated generated question') return 'repeated_question';
  }
  return 'unknown';
}
module.exports = { failureReason };
