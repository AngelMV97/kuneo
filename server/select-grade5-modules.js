/**
 * Seleccionar los mejores 10 módulos de grado 5 para enriquecer
 * Criterios: tener steps, diversidad de disciplinas, orden lógico
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function selectModulesToEnrich() {
  console.log('🎯 Seleccionando 10 módulos de grado 5 para enriquecer...\n');

  try {
    // Obtener módulos de grado 4-5 y 5
    const { data: modules, error: modulesError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, title, grade_range, difficulty, order_index, learning_objective')
      .eq('subject', 'social_studies')
      .eq('is_active', true)
      .in('grade_range', ['4-5', '5'])
      .order('order_index', { ascending: true });

    if (modulesError) throw modulesError;

    // Obtener steps para cada módulo
    const { data: allSteps, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('module_id')
      .in('module_id', modules.map(m => m.id));

    if (stepsError) throw stepsError;

    // Contar steps por módulo
    const stepCounts = {};
    allSteps.forEach(s => {
      stepCounts[s.module_id] = (stepCounts[s.module_id] || 0) + 1;
    });

    // Filtrar módulos que tienen steps
    const modulesWithSteps = modules.filter(m => stepCounts[m.id] > 0);

    console.log(`📚 Total módulos grado 5: ${modules.length}`);
    console.log(`✅ Con steps: ${modulesWithSteps.length}\n`);

    // Obtener taxonomías para módulos con steps
    const { data: taxonomies, error: taxError } = await supabase
      .schema('kuneo')
      .from('module_taxonomy_link')
      .select(`
        module_id,
        link_type,
        curriculum_taxonomy (
          discipline,
          thematic,
          subthematic
        )
      `)
      .in('module_id', modulesWithSteps.map(m => m.id));

    if (taxError) throw taxError;

    // Mapear disciplinas y temáticas por módulo
    const moduleInfo = {};
    modulesWithSteps.forEach(m => {
      moduleInfo[m.id] = {
        ...m,
        stepCount: stepCounts[m.id],
        disciplines: new Set(),
        thematics: new Set(),
        taxonomies: []
      };
    });

    taxonomies.forEach(link => {
      const moduleId = link.module_id;
      if (moduleInfo[moduleId]) {
        const tax = link.curriculum_taxonomy;
        if (tax) {
          if (tax.discipline) moduleInfo[moduleId].disciplines.add(tax.discipline);
          if (tax.thematic) moduleInfo[moduleId].thematics.add(tax.thematic);
          moduleInfo[moduleId].taxonomies.push({
            discipline: tax.discipline,
            thematic: tax.thematic,
            subthematic: tax.subthematic,
            link_type: link.link_type
          });
        }
      }
    });

    // Convertir a array y agregar info legible
    const enrichedModules = Object.values(moduleInfo).map(m => ({
      ...m,
      disciplines: Array.from(m.disciplines),
      thematics: Array.from(m.thematics)
    }));

    // Estrategia de selección: diversidad de disciplinas
    const selectedModules = [];
    const disciplineCounts = {
      'historia': 0,
      'geografia': 0,
      'economia_y_territorio': 0,
      'cultura_y_sociedad': 0,
      'ciudadania_y_democracia': 0
    };

    // Ordenar por order_index
    const sortedModules = enrichedModules.sort((a, b) => a.order_index - b.order_index);

    // Seleccionar 10 módulos con diversidad de disciplinas
    for (const module of sortedModules) {
      if (selectedModules.length >= 10) break;

      // Priorizar módulos con múltiples disciplinas y bajo conteo
      const mainDiscipline = module.disciplines[0] || 'historia';
      
      // Si esta disciplina tiene menos de 3 módulos seleccionados, o es multidisciplinario, incluirlo
      if (disciplineCounts[mainDiscipline] < 3 || module.disciplines.length > 1) {
        selectedModules.push(module);
        module.disciplines.forEach(d => {
          if (disciplineCounts[d] !== undefined) {
            disciplineCounts[d]++;
          }
        });
      }
    }

    // Si no llegamos a 10, agregar los primeros disponibles
    if (selectedModules.length < 10) {
      for (const module of sortedModules) {
        if (selectedModules.length >= 10) break;
        if (!selectedModules.find(m => m.id === module.id)) {
          selectedModules.push(module);
        }
      }
    }

    // Mostrar selección
    console.log('✨ MÓDULOS SELECCIONADOS PARA ENRIQUECIMIENTO:\n');
    console.log('=' .repeat(80));

    selectedModules.forEach((m, idx) => {
      console.log(`\n${idx + 1}. ${m.title}`);
      console.log(`   ID: ${m.id}`);
      console.log(`   Grado: ${m.grade_range} | Dificultad: ${m.difficulty}`);
      console.log(`   Steps: ${m.stepCount}`);
      console.log(`   Disciplinas: ${m.disciplines.join(', ') || 'No especificada'}`);
      if (m.thematics.length > 0) {
        console.log(`   Temáticas: ${m.thematics.join(', ')}`);
      }
      if (m.learning_objective) {
        console.log(`   Objetivo: ${m.learning_objective.substring(0, 80)}...`);
      }
    });

    console.log('\n\n📊 RESUMEN DE DIVERSIDAD:\n');
    console.log('=' .repeat(80));
    Object.keys(disciplineCounts).forEach(discipline => {
      const count = disciplineCounts[discipline];
      if (count > 0) {
        console.log(`  ${discipline}: ${count} módulos`);
      }
    });

    // Exportar IDs para uso posterior
    console.log('\n\n📋 IDs DE MÓDULOS (para scripts de enriquecimiento):\n');
    console.log('=' .repeat(80));
    console.log('[');
    selectedModules.forEach((m, idx) => {
      const comma = idx < selectedModules.length - 1 ? ',' : '';
      console.log(`  '${m.id}'${comma} // ${m.title.substring(0, 50)}`);
    });
    console.log(']');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

selectModulesToEnrich()
  .then(() => {
    console.log('\n\n✅ Selección completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
