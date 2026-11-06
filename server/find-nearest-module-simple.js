require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findNearestModuleSimple(subject) {
  console.log(`\n========================================`);
  console.log(`${subject.toUpperCase()} - BÚSQUEDA RÁPIDA`);
  console.log(`========================================\n`);

  try {
    console.log('Buscando módulos parcialmente enriquecidos...\n');
    
    // Get all modules for subject
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, difficulty, grade_range')
      .eq('subject', subject)
      .eq('is_active', true);
    
    if (modulesError) throw modulesError;
    
    console.log(`Analizando ${modules.length} módulos (sample de 50)...\n`);
    
    // Sample only first 50 to speed up
    const sampleModules = modules.slice(0, 50);
    const candidates = [];
    
    for (const module of sampleModules) {
      const { data: steps, error: stepsError } = await supabase
        .from('module_steps')
        .select('id, enriched_content')
        .eq('module_id', module.id);
      
      if (stepsError) continue;
      
      const total = steps.length;
      if (total === 0) continue;
      
      const enriched = steps.filter(s => s.enriched_content !== null).length;
      const percentage = (enriched / total) * 100;
      
      // Include modules with 50%+ completion
      if (percentage >= 50 && enriched < total) {
        candidates.push({
          id: module.id,
          title: module.title,
          difficulty: module.difficulty,
          grade_range: module.grade_range,
          total_steps: total,
          enriched_steps: enriched,
          pending_steps: total - enriched,
          percentage: percentage.toFixed(1)
        });
      }
    }
    
    // Sort by percentage desc, then by pending steps asc
    candidates.sort((a, b) => {
      const percentDiff = parseFloat(b.percentage) - parseFloat(a.percentage);
      if (percentDiff !== 0) return percentDiff;
      return a.pending_steps - b.pending_steps;
    });
    
    if (candidates.length === 0) {
      console.log('⚠️  No se encontraron módulos con 50%+ en el sample\n');
      console.log('Ampliando búsqueda a cualquier porcentaje...\n');
      
      // Try again with any percentage
      const anyCandidates = [];
      for (const module of sampleModules) {
        const { data: steps } = await supabase
          .from('module_steps')
          .select('id, enriched_content')
          .eq('module_id', module.id);
        
        if (!steps || steps.length === 0) continue;
        
        const total = steps.length;
        const enriched = steps.filter(s => s.enriched_content !== null).length;
        const percentage = (enriched / total) * 100;
        
        if (enriched > 0 && enriched < total) {
          anyCandidates.push({
            id: module.id,
            title: module.title,
            difficulty: module.difficulty,
            grade_range: module.grade_range,
            total_steps: total,
            enriched_steps: enriched,
            pending_steps: total - enriched,
            percentage: percentage.toFixed(1)
          });
        }
      }
      
      anyCandidates.sort((a, b) => {
        const percentDiff = parseFloat(b.percentage) - parseFloat(a.percentage);
        if (percentDiff !== 0) return percentDiff;
        return a.pending_steps - b.pending_steps;
      });
      
      if (anyCandidates.length > 0) {
        candidates.push(...anyCandidates.slice(0, 5));
      } else {
        console.log('❌ No se encontraron módulos con progreso parcial\n');
        return;
      }
    }
    
    console.log(`✅ Módulos encontrados: ${candidates.length}\n`);
    console.log('🎯 TOP 5 MÓDULOS:\n');
    
    candidates.slice(0, 5).forEach((mod, i) => {
      console.log(`   ${i + 1}. [${mod.percentage}%] ${mod.enriched_steps}/${mod.total_steps} steps (faltan ${mod.pending_steps})`);
      console.log(`      ID: ${mod.id}`);
      console.log(`      "${mod.title}"`);
      console.log(`      Dificultad: ${mod.difficulty} | Grado: ${mod.grade_range}\n`);
    });

    const best = candidates[0];
    console.log('💡 RECOMENDACIÓN:\n');
    console.log(`   Completar módulo: ${best.id}`);
    console.log(`   Requiere enriquecer: ${best.pending_steps} steps`);
    console.log(`   Tiempo estimado: ~${best.pending_steps * 2} segundos\n`);

    console.log('========================================');
    console.log('BÚSQUEDA COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    throw error;
  }
}

const subject = process.argv[2] || 'natural_sciences';
findNearestModuleSimple(subject);
