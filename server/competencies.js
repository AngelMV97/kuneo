const express = require('express');
const { createSearchService, validateFilters } = require('./competencySearch');
module.exports = function (db, options = {}) {
  const router = express.Router(), service = options.service || createSearchService(db);
  const fail = (res, error) => res.status(error.status || 500).json({ error: error.status === 400 ? error.message : 'No se pudo consultar el catálogo. Intenta nuevamente.' });
  router.post('/competencies/search', async (req, res) => {
    try { const { query, filters = {}, offset = 0, match_count = 20, match_threshold = 0.5 } = req.body;
      res.json(await service.search(query, filters, { offset, limit: match_count, threshold: match_threshold }));
    } catch (error) { fail(res, error); }
  });
  router.get('/competencies/filters', async (req, res) => {
    try { const { limit = '50', offset = '0', ...raw } = req.query, filters = validateFilters(raw);
      if (!/^\d+$/.test(limit) || !/^\d+$/.test(offset) || Number(limit) < 1 || Number(limit) > 100) return res.status(400).json({ error: 'Paginación inválida.' });
      const rows = await service.filters(filters), start = Number(offset), page = rows.slice(start, start + Number(limit));
      res.json({ filters, results: page, count: page.length, total: rows.length, next_offset: start + page.length < rows.length ? start + page.length : null });
    } catch (error) { fail(res, error); }
  });
  router.get('/competencies/cache/stats', (req, res) => res.json(service.stats()));
  router.post('/competencies/cache/clear', (req, res) => { service.invalidate(); res.json({ message: 'Caché reiniciada.' }); });
  router.get('/competencies/:id/modules', async (req, res) => {
    try { const { data, error } = await db.schema('kuneo').from('modules').select('id,title,subject,grade_range').eq('source_unit_id', req.params.id).eq('is_active', true).order('id');
      if (error) throw error;
      res.json({ modules: data, message: data.length ? null : 'Esta competencia todavía no tiene módulos activos asociados.' });
    } catch (error) { fail(res, error); }
  });
  router.get('/competencies/:id', async (req, res) => {
    try { const row = (await service.catalog()).find(d => d.row.id === req.params.id)?.row;
      if (!row) return res.status(404).json({ error: 'Competencia no encontrada.' });
      res.json(row);
    } catch (error) { fail(res, error); }
  });
  return router;
};
