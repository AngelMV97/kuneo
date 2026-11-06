/**
 * Analizar módulos de Ciencias Sociales por grado
 * Enfocarse en grado 5 (o rango 4-5)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeByGrade() {
  console.log('🔍 Analizando módulos de Ciencias Sociales por grado...\n');

  try {
    // Obtener todos los módulos de social_studies
    const { data: modules, error: modulesError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, title, grade_range, difficulty, order_index')
      .eq('subject', 'social_studies')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (modulesError) throw modulesError;

    console.log(`📚 Total módulos: ${modules.length}\n`);

    // Agrupar por grade_range
    const byGrade = {};
    modules.forEach(m => {
      if (!byGrade[m.grade_range]) {
        byGrade[m.grade_range] = [];
      }
      byGrade[m.grade_range].push(m);
    });

    // Obtener steps para cada módulo (solo primeros 100 para no saturar)
    const { data: allSteps, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('module_id, enriched_content')
      .in('module_id', modules.slice(0, 100).map(m => m.id));

    if (stepsError) throw stepsError;

    // Contar steps enriquecidos por módulo
    const enrichedCount = {};
    const totalStepsCount = {};
    allSteps.forEach(s => {
      if (!totalStepsCount[s.module_id]) {
        totalStepsCount[s.module_id] = 0;
      }
      totalStepsCount[s.module_id]++;
      
      if (s.enriched_content) {
        const ec = s.enriched_content;
        if (ec.type && ec.expected_answer) {
          if (!enrichedCount[s.module_id]) {
            enrichedCount[s.module_id] = 0;
          }
          enrichedCount[s.module_id]++;
        }
      }
    });

    // Obtener taxonomías para módulos de grado 4-5 y 5
    const grade5Modules = [
      ...(byGrade['4-5'] || []),
      ...(byGrade['5'] || [])
    ];

    const grade5ModuleIds = grade5Modules.map(m => m.id);
    
    const { data: taxonomies, error: taxError } = await supabase
      .schema('kuneo')
      .from('module_taxonomy_link')
      .select(`
        module_id,
        curriculum_taxonomy (
          discipline,
          thematic
        )
      `)
      .in('module_id', grade5ModuleIds);

    if (taxError) throw taxError;

    // Mapear disciplinas
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

    // Mostrar resumen por grado
    console.log('📊 MÓDULOS POR GRADO:\n');
    console.log('=' .repeat(80));
    
    const sortedGrades = Object.keys(byGrade).sort();
    sortedGrades.forEach(grade => {
      const mods = byGrade[grade];
      console.log(`\n🎓 Grado ${grade}: ${mods.length} módulos`);
    });

    // Análisis detallado de grado 5
    console.log('\n\n🎯 ANÁLISIS DETALLADO: GRADO 5 (4-5 y 5)\n');
    console.log('=' .repeat(80));

    if (grade5Modules.length === 0) {
      console.log('⚠️  No hay módulos para grado 5');
    } else {
      console.log(`Total módulos para grado 5: ${grade5Modules.length}\n`);

      // Análisis por disciplina
      const disciplineStats = {};
      grade5Modules.forEach(m => {
        const disciplines = disciplinesByModule[m.id] ? Array.from(disciplinesByModule[m.id]) : ['Sin disciplina'];
        disciplines.forEach(d => {
          if (!disciplineStats[d]) {
            disciplineStats[d] = { total: 0, enriched: 0, complete: 0 };
          }
          disciplineStats[d].total++;
          
          const enriched = enrichedCount[m.id] || 0;
          const total = totalStepsCount[m.id] || 0;
          
          if (enriched > 0) disciplineStats[d].enriched++;
          if (enriched === total && total > 0) disciplineStats[d].complete++;
        });
      });

      console.log('📚 Por disciplina:\n');
      Object.keys(disciplineStats).sort().forEach(discipline => {
        const stats = disciplineStats[discipline];
        console.log(`  ${discipline}:`);
        console.log(`    - Total: ${stats.total}`);
        console.log(`    - Con enriquecimiento: ${stats.enriched}`);
        console.log(`    - Completos: ${stats.complete}\n`);
      });

      // Listar primeros 20 módulos de grado 5 con su estado
      console.log('\n📋 PRIMEROS 20 MÓDULOS DE GRADO 5:\n');
      console.log('=' .repeat(80));

      grade5Modules.slice(0, 20).forEach(m => {
        const enriched = enrichedCount[m.id] || 0;
        const total = totalStepsCount[m.id] || 0;
        const disciplines = disciplinesByModule[m.id] ? Array.from(disciplinesByModule[m.id]).join(', ') : 'Sin disciplina';
        
        const status = enriched === total && total > 0 ? '✅ Completo' :
                       enriched > 0 ? `⚠️  Parcial (${enriched}/${total})` :
                       total > 0 ? `❌ Vacío (0/${total})` :
                       '⚠️  Sin steps';

        console.log(`\n📦 ${m.title}`);
        console.log(`   ID: ${m.id}`);
        console.log(`   Grado: ${m.grade_range} | Dificultad: ${m.difficulty}`);
        console.log(`   Disciplina: ${disciplines}`);
        console.log(`   Estado: ${status}`);
      });

      if (grade5Modules.length > 20) {
        console.log(`\n... y ${grade5Modules.length - 20} módulos más de grado 5`);
      }
    }

    // Recomendación
    console.log('\n\n💡 RECOMENDACIÓN:\n');
    console.log('=' .repeat(80));
    
    if (grade5Modules.length > 0) {
      const emptyGrade5 = grade5Modules.filter(m => (enrichedCount[m.id] || 0) === 0 && (totalStepsCount[m.id] || 0) > 0);
      const partialGrade5 = grade5Modules.filter(m => {
        const enriched = enrichedCount[m.id] || 0;
        const total = totalStepsCount[m.id] || 0;
        return enriched > 0 && enriched < total;
      });
      
      console.log(`\n✅ Usuario de prueba está en grado 5`);
      console.log(`✅ Hay ${grade5Modules.length} módulos de Ciencias Sociales para grado 5`);
      
      if (emptyGrade5.length > 0) {
        console.log(`\n🎯 Prioridad 1: Enriquecer ${Math.min(10, emptyGrade5.length)} módulos de grado 5 (actualmente vacíos)`);
      }
      
      if (partialGrade5.length > 0) {
        console.log(`\n🎯 Prioridad 2: Completar ${partialGrade5.length} módulos con enriquecimiento parcial`);
      }
      
      console.log('\n📌 Enfocar enriquecimiento en módulos apropiados para el grado del usuario de prueba.');
    } else {
      console.log('\n⚠️  No hay módulos de grado 5 en Ciencias Sociales');
      console.log('   Considera agregar contenido para este grado.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeByGrade()
  .then(() => {
    console.log('\n\n✅ Análisis completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
