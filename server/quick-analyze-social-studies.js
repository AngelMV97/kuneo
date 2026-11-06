/**
 * Script rápido para analizar módulos de Ciencias Sociales
 * Usa consultas agregadas para mejor performance
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickAnalyze() {
  console.log('🔍 Análisis rápido de Ciencias Sociales...\n');

  try {
    // 1. Obtener todos los módulos activos
    const { data: modules, error: modulesError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, title, grade_range, difficulty')
      .eq('subject', 'social_studies')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (modulesError) throw modulesError;

    console.log(`📚 Total módulos: ${modules.length}\n`);

    // 2. Obtener conteo de steps por módulo
    const { data: stepCounts, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('module_id')
      .in('module_id', modules.map(m => m.id));

    if (stepsError) throw stepsError;

    // Contar steps por módulo
    const stepsPerModule = {};
    stepCounts.forEach(s => {
      stepsPerModule[s.module_id] = (stepsPerModule[s.module_id] || 0) + 1;
    });

    // 3. Obtener conteo de steps enriquecidos por módulo
    const { data: enrichedSteps, error: enrichedError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('module_id, enriched_content')
      .in('module_id', modules.map(m => m.id))
      .not('enriched_content', 'is', null);

    if (enrichedError) throw enrichedError;

    // Contar steps enriquecidos por módulo
    const enrichedPerModule = {};
    enrichedSteps.forEach(s => {
      if (!enrichedPerModule[s.module_id]) {
        enrichedPerModule[s.module_id] = 0;
      }
      // Verificar si está completamente enriquecido
      const ec = s.enriched_content;
      if (ec && ec.type && (ec.expected_answer || ec.correct_options || ec.correct_pairs || ec.correct_order)) {
        enrichedPerModule[s.module_id]++;
      }
    });

    // 4. Obtener disciplinas por módulo (limitar a primeros 50 para no saturar)
    const firstModuleIds = modules.slice(0, 50).map(m => m.id);
    const { data: taxonomies, error: taxError } = await supabase
      .schema('kuneo')
      .from('module_taxonomy_link')
      .select(`
        module_id,
        curriculum_taxonomy (
          discipline
        )
      `)
      .in('module_id', firstModuleIds);

    if (taxError) throw taxError;

    // Mapear disciplinas por módulo
    const disciplinesByModule = {};
    taxonomies.forEach(link => {
      const moduleId = link.module_id;
      const discipline = link.curriculum_taxonomy?.discipline;
      if (discipline) {
        if (!disciplinesByModule[moduleId]) {
          disciplinesByModule[moduleId] = new Set();
        }
        disciplinesByModule[moduleId].add(discipline);
      }
    });

    // 5. Análisis de enriquecimiento
    const completeModules = [];
    const partialModules = [];
    const emptyModules = [];

    modules.forEach(m => {
      const total = stepsPerModule[m.id] || 0;
      const enriched = enrichedPerModule[m.id] || 0;
      
      const moduleInfo = {
        id: m.id,
        title: m.title,
        grade: m.grade_range,
        difficulty: m.difficulty,
        totalSteps: total,
        enrichedSteps: enriched,
        disciplines: disciplinesByModule[m.id] ? Array.from(disciplinesByModule[m.id]) : []
      };

      if (enriched === total && total > 0) {
        completeModules.push(moduleInfo);
      } else if (enriched > 0) {
        partialModules.push(moduleInfo);
      } else {
        emptyModules.push(moduleInfo);
      }
    });

    // 6. Mostrar resultados
    console.log('📊 RESUMEN:\n');
    console.log(`✅ Completamente enriquecidos: ${completeModules.length}`);
    console.log(`⚠️  Parcialmente enriquecidos: ${partialModules.length}`);
    console.log(`❌ Sin enriquecer: ${emptyModules.length}`);
    console.log(`\nProgreso: ${Math.round((completeModules.length / modules.length) * 100)}%\n`);

    // 7. Mostrar muestra de módulos con enriquecimiento parcial
    if (partialModules.length > 0) {
      console.log('\n⚠️  MÓDULOS CON ENRIQUECIMIENTO PARCIAL (primeros 10):\n');
      console.log('=' .repeat(80));
      partialModules.slice(0, 10).forEach(m => {
        console.log(`\n📦 ${m.title}`);
        console.log(`   ID: ${m.id}`);
        console.log(`   Grado: ${m.grade} | Dificultad: ${m.difficulty}`);
        if (m.disciplines.length > 0) {
          console.log(`   Disciplina(s): ${m.disciplines.join(', ')}`);
        }
        console.log(`   Steps: ${m.enrichedSteps}/${m.totalSteps} enriquecidos`);
      });
      
      if (partialModules.length > 10) {
        console.log(`\n... y ${partialModules.length - 10} más con enriquecimiento parcial`);
      }
    }

    // 8. Mostrar muestra de módulos completamente enriquecidos
    if (completeModules.length > 0) {
      console.log('\n\n✅ MÓDULOS COMPLETAMENTE ENRIQUECIDOS (primeros 10):\n');
      console.log('=' .repeat(80));
      completeModules.slice(0, 10).forEach(m => {
        console.log(`\n📦 ${m.title}`);
        console.log(`   ID: ${m.id}`);
        console.log(`   Grado: ${m.grade} | Dificultad: ${m.difficulty}`);
        if (m.disciplines.length > 0) {
          console.log(`   Disciplina(s): ${m.disciplines.join(', ')}`);
        }
        console.log(`   Steps: ${m.totalSteps}/${m.totalSteps} ✅`);
      });
      
      if (completeModules.length > 10) {
        console.log(`\n... y ${completeModules.length - 10} más completamente enriquecidos`);
      }
    }

    // 9. Análisis de disciplinas (de los primeros 50 módulos)
    const disciplineStats = {};
    Object.keys(disciplinesByModule).forEach(moduleId => {
      const disciplines = Array.from(disciplinesByModule[moduleId]);
      disciplines.forEach(d => {
        if (!disciplineStats[d]) {
          disciplineStats[d] = { total: 0, complete: 0, partial: 0, empty: 0 };
        }
        disciplineStats[d].total++;
        
        const enriched = enrichedPerModule[moduleId] || 0;
        const total = stepsPerModule[moduleId] || 0;
        
        if (enriched === total && total > 0) {
          disciplineStats[d].complete++;
        } else if (enriched > 0) {
          disciplineStats[d].partial++;
        } else {
          disciplineStats[d].empty++;
        }
      });
    });

    console.log('\n\n🏷️  ANÁLISIS POR DISCIPLINA (muestra de primeros 50 módulos):\n');
    console.log('=' .repeat(80));
    
    const sortedDisciplines = Object.keys(disciplineStats).sort();
    sortedDisciplines.forEach(discipline => {
      const stats = disciplineStats[discipline];
      console.log(`\n📚 ${discipline}`);
      console.log(`   Total: ${stats.total} módulos`);
      console.log(`   ✅ Completos: ${stats.complete}`);
      console.log(`   ⚠️  Parciales: ${stats.partial}`);
      console.log(`   ❌ Vacíos: ${stats.empty}`);
    });

    // 10. Recomendación
    console.log('\n\n💡 RECOMENDACIÓN:\n');
    console.log('=' .repeat(80));
    
    if (partialModules.length > 0) {
      console.log(`\n1️⃣ Completar ${partialModules.length} módulos con enriquecimiento parcial`);
      console.log('   Estos ya tienen algo de trabajo hecho, más fácil de terminar.');
    }
    
    if (completeModules.length < 10) {
      const needed = 10 - completeModules.length;
      console.log(`\n2️⃣ Enriquecer ${needed} módulos más para llegar a 10 completos`);
      console.log('   Priorizar módulos de diferentes disciplinas para variedad.');
    } else {
      console.log(`\n✨ ¡Ya tienes ${completeModules.length} módulos completos!`);
      console.log('   Puedes seguir enriqueciendo más o diversificar en otras materias.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickAnalyze()
  .then(() => {
    console.log('\n\n✅ Análisis completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
