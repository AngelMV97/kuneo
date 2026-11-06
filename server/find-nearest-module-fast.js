require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findNearestModuleFast(subject) {
  console.log(`\n========================================`);
  console.log(`${subject.toUpperCase()} - MÓDULO MÁS CERCANO (SQL DIRECTO)`);
  console.log(`========================================\n`);

  try {
    console.log('Consultando módulos con enrichment parcial...\n');
    
    // Query directa con from y joins
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        difficulty,
        grade_range,
        module_steps (
          id,
          enriched_content
        )
      `)
      .eq('subject', subject)
      .eq('is_active', true)
      .limit(200);
    
    if (modulesError) throw modulesError;
    
    // Process results
    const data = modules
      .map(m => {
        const total = m.module_steps?.length || 0;
        const enriched = m.module_steps?.filter(s => s.enriched_content !== null).length || 0;
        const percentage = total > 0 ? (enriched / total) * 100 : 0;
        
        return {
          id: m.id,
          title: m.title,
          difficulty: m.difficulty,
          grade_range: m.grade_range,
          total_steps: total,
          enriched_steps: enriched,
          percentage: percentage.toFixed(1),
          pending_steps: total - enriched
        };
      })
      .filter(m => m.total_steps > 0 && m.enriched_steps > 0 && m.enriched_steps < m.total_steps && parseFloat(m.percentage) >= 50)
      .sort((a, b) => {
        const percentDiff = parseFloat(b.percentage) - parseFloat(a.percentage);
        if (percentDiff !== 0) return percentDiff;
        return a.pending_steps - b.pending_steps;
      })
      .slice(0, 5);

    if (!data || data.length === 0) {
      console.log('⚠️  No se encontraron módulos con 50%+ de completitud\n');
      return;
    }

    console.log(`✅ Módulos encontrados: ${data.length}\n`);
    console.log('🎯 TOP MÓDULOS MÁS CERCANOS:\n');
    
    data.forEach((mod, i) => {
      const pending = mod.total_steps - mod.enriched_steps;
      console.log(`   ${i + 1}. [${mod.percentage}%] ${mod.enriched_steps}/${mod.total_steps} steps (faltan ${pending})`);
      console.log(`      ID: ${mod.id}`);
      console.log(`      "${mod.title}"`);
      console.log(`      Dificultad: ${mod.difficulty} | Grado: ${mod.grade_range}\n`);
    });

    const best = data[0];
    const bestPending = best.total_steps - best.enriched_steps;
    console.log('💡 RECOMENDACIÓN:\n');
    console.log(`   Completar módulo: ${best.id}`);
    console.log(`   Requiere enriquecer: ${bestPending} steps`);
    console.log(`   Tiempo estimado: ~${bestPending * 2} segundos\n`);

    console.log('========================================');
    console.log('ANÁLISIS COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

const subject = process.argv[2] || 'natural_sciences';
findNearestModuleFast(subject);
