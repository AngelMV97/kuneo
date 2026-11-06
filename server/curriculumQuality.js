// Historical tags were inferred with substring matching (media in inmediato).
// Corroborate known derived fields against source text; never change source text.
const rules = require('./curriculumDerivationRules.json');
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const flatten = value => Array.isArray(value) ? value.map(flatten).join(' ') : typeof value === 'string' ? value : '';
function contains(text, phrase) {
  const escaped = normalize(phrase).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:s|es)?(?=$|[^a-z0-9])`, 'u').test(text);
}
function cleanRow(row) {
  const content = row.content || {};
  const source = normalize([content.competency, flatten(content.evidence), flatten(content.example)].join(' '));
  const statistics = supportsStatistics(source);
  const concepts = (content.concepts || []).filter(concept => {
    const keywords = rules.concept_keywords[concept];
    if (concept === 'estadistica') return statistics;
    return !keywords || keywords.some(word => contains(source, word));
  });
  const misconceptions = (content.misconceptions || []).filter(item => {
    const patterns = Object.entries(rules.misconception_patterns).filter(([, value]) => value === item).map(([key]) => key);
    if (patterns.some(word => ['media', 'mediana'].includes(word)) && !statistics) return false;
    return !patterns.length || patterns.some(word => contains(source, word));
  });
  return { ...row, content: { ...content, concepts, misconceptions } };
}
function supportsStatistics(source) {
  return rules.statistics_support.some(pattern => new RegExp(pattern, 'u').test(normalize(source)));
}
module.exports = { cleanRow, contains, supportsStatistics };
