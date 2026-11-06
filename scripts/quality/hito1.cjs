const fs = require('node:fs');
const path = require('node:path');
const { createSearchService, prepare, rank } = require('../../server/competencySearch');
module.exports = async function (db) {
  const service = createSearchService(db), documents = await service.catalog();
  const local = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/processed/normalized/competency_units/all_competency_units.json')));
  const liveIds = new Set(documents.map(d => d.row.id)), localIds = new Set(local.map(d => d.id));
  const missing = await db.from('competency_units').select('id', { count: 'exact', head: true }).is('embedding', null);
  if (missing.error) throw missing.error;
  const queries = [];
  for (const query of ['estadistica', 'energía', 'energia', 'función', 'funcion', 'funciones', 'fracciones', 'ecosistema', 'comprensión lectora', 'revolución', 'present perfect']) {
    const result = await service.search(query, {}, { limit: 100 });
    const textMatches = rank(documents, query, {}, []);
    queries.push({ query, total: result.total, text_matches: textMatches.length, grade_ranges: result.grade_ranges, semantic_available: result.semantic_available,
      first_results: result.results.slice(0, 5).map(r => ({ id: r.id, subject: r.subject, grade_range: r.grade_range, competency: r.content.competency, retrieval: r.retrieval })) });
    console.log(JSON.stringify({ query, total: result.total, text_matches: textMatches.length, semantic_available: result.semantic_available }));
  }
  const groups = {};
  for (const { row } of documents) { const key = `${row.subject}/${row.grade_range}/${row.source}`; groups[key] = (groups[key] || 0) + 1; }
  let modules = [];
  for (let start = 0; ; start += 1000) {
    const r = await db.from('modules').select('id,source_unit_id,is_active').order('id').range(start, start + 999);
    if (r.error) throw r.error; modules.push(...r.data); if (r.data.length < 1000) break;
  }
  const report = { date: new Date().toISOString(), live_count: documents.length, local_count: local.length, missing_embeddings: missing.count,
    local_only_ids: local.filter(r => !liveIds.has(r.id)).map(r => r.id), live_only_ids: documents.filter(d => !localIds.has(d.row.id)).map(d => d.row.id),
    groups, modules: { total: modules.length, linked: modules.filter(m => liveIds.has(m.source_unit_id)).length, orphan_links: modules.filter(m => m.source_unit_id && !liveIds.has(m.source_unit_id)).length },
    embedding_model: 'El cliente consulta text-embedding-3-small; el modelo de los vectores almacenados no está acreditado por este inventario.', queries };
  fs.mkdirSync(path.join(__dirname, '../../reports'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../../reports/hito1-audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ live_count: report.live_count, local_count: report.local_count, missing_embeddings: report.missing_embeddings, modules: report.modules }));
};
