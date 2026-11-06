/**
 * Script para analizar módulos de Ciencias Sociales
 * - Ver cuántos módulos hay por disciplina
 * - Ver estado de enriquecimiento de steps
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeModules() {
  console.log('🔍 Analizando módulos de Ciencias Sociales...\n');

  try {
    // 1. Obtener todos los módulos de social_studies
    const { data: modules, error: modulesError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, title, grade_range, difficulty')
      .eq('subject', 'social_studies')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (modulesError) throw modulesError;

    console.log(`📚 Total de módulos activos: ${modules.length}\n`);

    // 2. Para cada módulo, obtener sus taxonomías y steps
    const enrichedModules = [];

    for (const module of modules) {
      // Obtener taxonomías (disciplinas)
      const { data: taxonomies, error: taxError } = await supabase
        .schema('kuneo')
        .from('module_taxonomy_link')
        .select(`
          link_type,
          curriculum_taxonomy (
            discipline,
            thematic
          )
        `)
        .eq('module_id', module.id);

      if (taxError) throw taxError;

      // Obtener steps con enriched_content
      const { data: steps, error: stepsError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('id, step_order, enriched_content')
        .eq('module_id', module.id)
        .order('step_order', { ascending: true });

      if (stepsError) throw stepsError;

      const totalSteps = steps.length;
      const enrichedSteps = steps.filter(s => s.enriched_content !== null).length;
      const completelyEnriched = steps.filter(s => {
        if (!s.enriched_content) return false;
        const ec = s.enriched_content;
        // Verificar que tenga type y expected_answer
        return ec.type && (ec.expected_answer || ec.correct_options || ec.correct_pairs || ec.correct_order);
      }).length;

      const disciplines = [...new Set(
        taxonomies
          .filter(t => t.curriculum_taxonomy?.discipline)
          .map(t => t.curriculum_taxonomy.discipline)
      )];

      enrichedModules.push({
        ...module,
        disciplines: disciplines.length > 0 ? disciplines : ['Sin disciplina'],
        totalSteps,
        enrichedSteps,
        completelyEnriched,
        enrichmentStatus: completelyEnriched === totalSteps ? '✅ Completo' : 
                         enrichedSteps > 0 ? `⚠️ Parcial (${completelyEnriched}/${totalSteps})` : 
                         '❌ Sin enriquecer'
      });
    }

    // 3. Agrupar por disciplina
    const byDiscipline = {};
    enrichedModules.forEach(m => {
      m.disciplines.forEach(d => {
        if (!byDiscipline[d]) {
          byDiscipline[d] = [];
        }
        byDiscipline[d].push(m);
      });
    });

    // 4. Mostrar resumen por disciplina
    console.log('📊 Módulos por disciplina:\n');
    const sortedDisciplines = Object.keys(byDiscipline).sort();
    
    for (const discipline of sortedDisciplines) {
      const mods = byDiscipline[discipline];
      const complete = mods.filter(m => m.completelyEnriched === m.totalSteps).length;
      const partial = mods.filter(m => m.enrichedSteps > 0 && m.completelyEnriched < m.totalSteps).length;
      const empty = mods.filter(m => m.enrichedSteps === 0).length;

      console.log(`\n🏷️  ${discipline}`);
      console.log(`   Total: ${mods.length} módulos`);
      console.log(`   ✅ Completos: ${complete}`);
      console.log(`   ⚠️  Parciales: ${partial}`);
      console.log(`   ❌ Sin enriquecer: ${empty}`);
    }

    // 5. Mostrar detalle de módulos con enriquecimiento parcial
    console.log('\n\n📋 DETALLE: Módulos con enriquecimiento parcial o incompleto\n');
    console.log('=' .repeat(80));

    const needsWork = enrichedModules.filter(m => 
      m.enrichedSteps > 0 && m.completelyEnriched < m.totalSteps
    );

    if (needsWork.length === 0) {
      console.log('✨ ¡No hay módulos con enriquecimiento parcial!');
    } else {
      needsWork.forEach(m => {
        console.log(`\n📦 ${m.title}`);
        console.log(`   ID: ${m.id}`);
        console.log(`   Grado: ${m.grade_range} | Dificultad: ${m.difficulty}`);
        console.log(`   Disciplina(s): ${m.disciplines.join(', ')}`);
        console.log(`   Steps: ${m.completelyEnriched}/${m.totalSteps} completamente enriquecidos`);
        console.log(`   Estado: ${m.enrichmentStatus}`);
      });
    }

    // 6. Mostrar módulos sin enriquecer
    console.log('\n\n📋 DETALLE: Módulos sin enriquecer\n');
    console.log('=' .repeat(80));

    const unenriched = enrichedModules.filter(m => m.enrichedSteps === 0);

    if (unenriched.length === 0) {
      console.log('✨ ¡Todos los módulos tienen al menos algún enriquecimiento!');
    } else {
      unenriched.forEach(m => {
        console.log(`\n📦 ${m.title}`);
        console.log(`   ID: ${m.id}`);
        console.log(`   Grado: ${m.grade_range} | Dificultad: ${m.difficulty}`);
        console.log(`   Disciplina(s): ${m.disciplines.join(', ')}`);
        console.log(`   Steps totales: ${m.totalSteps}`);
      });
    }

    // 7. Resumen final
    console.log('\n\n📈 RESUMEN GENERAL\n');
    console.log('=' .repeat(80));
    const totalComplete = enrichedModules.filter(m => m.completelyEnriched === m.totalSteps).length;
    const totalPartial = enrichedModules.filter(m => m.enrichedSteps > 0 && m.completelyEnriched < m.totalSteps).length;
    const totalEmpty = enrichedModules.filter(m => m.enrichedSteps === 0).length;

    console.log(`Total módulos: ${modules.length}`);
    console.log(`✅ Completamente enriquecidos: ${totalComplete}`);
    console.log(`⚠️  Parcialmente enriquecidos: ${totalPartial}`);
    console.log(`❌ Sin enriquecer: ${totalEmpty}`);
    console.log(`\nProgreso: ${Math.round((totalComplete / modules.length) * 100)}%`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeModules()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
