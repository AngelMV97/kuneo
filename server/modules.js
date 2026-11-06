/**
 * KUNEO MODULES ROUTER
 * Gestión del catálogo de módulos de aprendizaje
 */

const { Router } = require("express");

module.exports = (supabase) => {
  const router = Router();

  /**
   * GET /api/modules
   * Obtener lista de módulos filtrados por asignatura, grado y dificultad
   */
  router.get("/modules", async (req, res) => {
    try {
      const { subject, grade, difficulty, limit = 100, offset = 0 } = req.query;

      let query = supabase
        .schema("kuneo")
        .from("modules")
        .select("id, source_unit_id, subject, grade_range, difficulty, title, learning_objective, core_concept, is_active, order_index")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      // Solo aplicar range() si NO hay filtro por grado
      // (porque el filtro por grado requiere buscar en TODOS los módulos de la materia)
      if (!grade) {
        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      }

      if (subject) {
        query = query.eq("subject", subject);
      }

      if (difficulty) {
        query = query.eq("difficulty", difficulty);
      }

      // Filtrar por grado (grade_range contiene el grado)
      // Ejemplo: grade=5 debe matchear con grade_range "4-5" o "5"
      if (grade) {
        const gradeNum = parseInt(grade);
        const { data: allModules, error } = await query;
        
        if (error) throw error;

        // Filtrar manualmente por grade_range
        const filtered = allModules.filter(module => {
          const gradeRange = module.grade_range;
          
          // Si es un solo grado (e.g., "5")
          if (!gradeRange.includes('-')) {
            return parseInt(gradeRange) === gradeNum;
          }
          
          // Si es un rango (e.g., "4-5")
          const [start, end] = gradeRange.split('-').map(Number);
          return gradeNum >= start && gradeNum <= end;
        });

        return res.json(filtered);
      }

      const { data: modules, error } = await query;

      if (error) throw error;

      res.json(modules || []);

    } catch (error) {
      console.error("Error obteniendo módulos:", error);
      res.status(500).json({
        error: "Error obteniendo módulos",
        details: error.message
      });
    }
  });

  /**
   * GET /api/modules/search
   * Buscar módulos por core_concept o título
   */
  router.get("/modules/search", async (req, res) => {
    try {
      const { q, subject, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const searchTerm = q.toLowerCase();

      // Fetch ALL modules first (usar un límite alto para obtener todos)
      let query = supabase
        .schema("kuneo")
        .from("modules")
        .select("id, source_unit_id, subject, grade_range, difficulty, title, learning_objective, core_concept")
        .eq("is_active", true)
        .limit(2000); // Límite alto para obtener todos los módulos

      if (subject) {
        query = query.eq("subject", subject);
      }

      const { data: modules, error } = await query;

      if (error) throw error;

      // Filtrar manualmente por core_concept o title (case insensitive)
      const filtered = modules.filter(module => {
        const titleMatch = module.title.toLowerCase().includes(searchTerm);
        const conceptMatch = module.core_concept.toLowerCase().includes(searchTerm);
        return titleMatch || conceptMatch;
      });

      // Aplicar límite después del filtro
      const results = filtered.slice(0, parseInt(limit));

      res.json(results);

    } catch (error) {
      console.error("Error buscando módulos:", error);
      res.status(500).json({
        error: "Error buscando módulos",
        details: error.message
      });
    }
  });

  /**
   * GET /api/modules/:moduleId
   * Obtener detalle completo de un módulo específico
   */
  router.get("/modules/:moduleId", async (req, res) => {
    try {
      const { moduleId } = req.params;

      const { data: module, error } = await supabase
        .schema("kuneo")
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (error || !module) {
        console.error("Error buscando módulo:", error);
        return res.status(404).json({ error: "Módulo no encontrado" });
      }

      res.json(module);

    } catch (error) {
      console.error("Error obteniendo módulo:", error);
      res.status(500).json({
        error: "Error obteniendo módulo",
        details: error.message
      });
    }
  });

  /**
   * GET /api/modules/:moduleId/steps
   * Obtener steps de un módulo con enriched_content
   */
  router.get("/modules/:moduleId/steps", async (req, res) => {
    try {
      const { moduleId } = req.params;

      const { data: steps, error } = await supabase
        .schema("kuneo")
        .from("module_steps")
        .select("id, step_order, enriched_content")
        .eq("module_id", moduleId)
        .not("enriched_content", "is", null)
        .order("step_order", { ascending: true });

      if (error) throw error;

      res.json(steps || []);

    } catch (error) {
      console.error("Error obteniendo steps:", error);
      res.status(500).json({
        error: "Error obteniendo steps",
        details: error.message
      });
    }
  });

  /**
   * GET /api/modules/:moduleId/taxonomies
   * Obtener taxonomías curriculares vinculadas a un módulo
   */
  router.get("/modules/:moduleId/taxonomies", async (req, res) => {
    try {
      const { moduleId } = req.params;
      const { linkType } = req.query; // Opcional: 'primary', 'secondary', 'related'

      // Obtener links con las taxonomías
      let query = supabase
        .schema("kuneo")
        .from("module_taxonomy_link")
        .select(`
          link_type,
          curriculum_taxonomy (
            id,
            subject,
            grade_range,
            discipline,
            thematic,
            subthematic,
            microtopics
          )
        `)
        .eq("module_id", moduleId);

      if (linkType) {
        query = query.eq("link_type", linkType);
      }

      const { data: links, error } = await query;

      if (error) throw error;

      // Transformar para devolver taxonomías con su link_type
      const taxonomies = (links || []).map(link => ({
        ...link.curriculum_taxonomy,
        link_type: link.link_type
      }));

      res.json(taxonomies);

    } catch (error) {
      console.error("Error obteniendo taxonomías del módulo:", error);
      res.status(500).json({
        error: "Error obteniendo taxonomías",
        details: error.message
      });
    }
  });

  /**
   * GET /api/subjects
   * Lista de asignaturas disponibles con conteo de módulos
   */
  router.get("/subjects", async (req, res) => {
    try {
      const subjects = [
        {
          id: "mathematics",
          name: "Matemáticas",
          emoji: "🔢",
          color: "from-blue-500 to-cyan-500"
        },
        {
          id: "language",
          name: "Lenguaje",
          emoji: "📚",
          color: "from-purple-500 to-pink-500"
        },
        {
          id: "natural_sciences",
          name: "Ciencias Naturales",
          emoji: "🔬",
          color: "from-green-500 to-emerald-500"
        },
        {
          id: "social_studies",
          name: "Ciencias Sociales",
          emoji: "🌍",
          color: "from-orange-500 to-red-500"
        },
        {
          id: "english",
          name: "Inglés",
          emoji: "🗣️",
          color: "from-indigo-500 to-blue-500"
        }
      ];

      // Contar módulos por asignatura
      const { data: moduleCounts } = await supabase
        .schema("kuneo")
        .from("modules")
        .select("subject")
        .eq("is_active", true);

      const counts = (moduleCounts || []).reduce((acc, m) => {
        acc[m.subject] = (acc[m.subject] || 0) + 1;
        return acc;
      }, {});

      const enrichedSubjects = subjects.map(subj => ({
        ...subj,
        moduleCount: counts[subj.id] || 0
      }));

      res.json(enrichedSubjects);

    } catch (error) {
      console.error("Error obteniendo asignaturas:", error);
      res.status(500).json({
        error: "Error obteniendo asignaturas",
        details: error.message
      });
    }
  });

  /**
   * GET /api/modules/by-subject/:subject
   * Obtener módulos agrupados por grade_range para una asignatura
   */
  router.get("/modules/by-subject/:subject", async (req, res) => {
    try {
      const { subject } = req.params;

      const { data: modules, error } = await supabase
        .schema("kuneo")
        .from("modules")
        .select("id, source_unit_id, subject, grade_range, difficulty, title, learning_objective, core_concept, order_index")
        .eq("subject", subject)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Agrupar por grade_range
      const grouped = {};
      modules.forEach(module => {
        const gr = module.grade_range;
        if (!grouped[gr]) {
          grouped[gr] = [];
        }
        grouped[gr].push(module);
      });

      res.json({
        subject,
        total: modules.length,
        by_grade: grouped
      });

    } catch (error) {
      console.error("Error obteniendo módulos por asignatura:", error);
      res.status(500).json({
        error: "Error obteniendo módulos",
        details: error.message
      });
    }
  });

  return router;
};
