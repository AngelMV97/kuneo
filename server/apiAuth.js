// A privileged database client must never trust a user id supplied by a browser.
module.exports = function apiAuth(supabase) {
  return async (req, res, next) => {
    const token = /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    try {
      const { data, error } = await require('./runtimeMetrics').measure('auth', () => supabase.auth.getUser(token));
      if (error || !data?.user) return res.status(401).json({ error: 'La sesión ha caducado. Vuelve a iniciar sesión.' });
      req.user = data.user;
      const pathUser = /^\/(?:profiles|progress|cognitive-profile|adaptive\/(?:progress|recommendations))\/([^/]+)(?:\/continue-learning)?$/.exec(req.path)?.[1];
      const supplied = [req.body?.user_id, req.body?.userId, req.query.user_id, req.query.userId, pathUser].filter(Boolean);
      // Named profile actions aren't user identifiers.
      const actions = ['character-preference', 'initialize'];
      if (supplied.some(id => !actions.includes(id) && id !== req.user.id)) return res.status(403).json({ error: 'No puedes acceder a datos de otro usuario.' });
      const sessionId = req.body?.sessionId || /^\/sessions\/([^/]+)\/feedback/.exec(req.path)?.[1];
      const recommendationId = /^\/adaptive\/recommendations\/([^/]+)\/(?:accept|dismiss)$/.exec(req.path)?.[1];
      if (sessionId || recommendationId) {
        const { data: owned, error: ownershipError } = await supabase.schema('kuneo').from(sessionId ? 'sessions' : 'student_recommendations').select('user_id').eq(sessionId ? 'id' : 'recommendation_id', sessionId || recommendationId).maybeSingle();
        if (ownershipError) throw ownershipError;
        if (!owned || owned.user_id !== req.user.id) return res.status(403).json({ error: 'No tienes acceso a este recurso.' });
      }
      next();
    } catch { res.status(503).json({ error: 'No se pudo verificar la sesión. Intenta de nuevo.' }); }
  };
};
