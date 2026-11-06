/**
 * Seleccionar 1 módulo por grado (1-11) de Ciencias Sociales
 * Para test diagnóstico y Misconception Engine
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function selectOnePerGrade() {
  console.log('🎯 Seleccionando 1 módulo por grado (1-11) para Ciencias Sociales...\n');

  try {
    // Definir grados objetivo
    const targetGrades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    
    // Obtener todos los módulos activos
    const { data: modules, error: modulesError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, title, grade_range, difficulty, order_index, learning_objective')
      .eq('subject', 'social_studies')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (modulesError) throw modulesError;

    console.log(`📚 Total módulos activos: ${modules.length}\n`);

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

    // Obtener taxonomías
    const { data: taxonomies, error: taxError } = await supabase
      .schema('kuneo')
      .from('module_taxonomy_link')
      .select(`
        module_id,
        link_type,
        curriculum_taxonomy (
          discipline,
          thematic
        )
      `)
      .in('module_id', modulesWithSteps.map(m => m.id));

    if (taxError) throw taxError;

    // Mapear info por módulo
    const moduleInfo = {};
    modulesWithSteps.forEach(m => {
      moduleInfo[m.id] = {
        ...m,
        stepCount: stepCounts[m.id],
        disciplines: new Set(),
        thematics: []
      };
    });

    taxonomies.forEach(link => {
      const moduleId = link.module_id;
      if (moduleInfo[moduleId]) {
        const tax = link.curriculum_taxonomy;
        if (tax?.discipline) {
          moduleInfo[moduleId].disciplines.add(tax.discipline);
        }
        if (tax?.thematic) {
          moduleInfo[moduleId].thematics.push(tax.thematic);
        }
      }
    });

    // Agrupar módulos por grado
    const modulesByGrade = {};
    Object.values(moduleInfo).forEach(m => {
      const gradeRange = m.grade_range;
      
      // Manejar rangos como "1-3", "4-5", etc.
      if (gradeRange.includes('-')) {
        const [start, end] = gradeRange.split('-').map(Number);
        for (let g = start; g <= end; g++) {
          const gradeKey = g.toString();
          if (!modulesByGrade[gradeKey]) {
            modulesByGrade[gradeKey] = [];
          }
          modulesByGrade[gradeKey].push(m);
        }
      } else {
        // Grado único
        if (!modulesByGrade[gradeRange]) {
          modulesByGrade[gradeRange] = [];
        }
        modulesByGrade[gradeRange].push(m);
      }
    });

    // Seleccionar 1 módulo por grado
    const selectedModules = [];
    const disciplineUsage = {};

    console.log('📊 MÓDULOS DISPONIBLES POR GRADO:\n');
    console.log('=' .repeat(80));

    for (const grade of targetGrades) {
      const available = modulesByGrade[grade] || [];
      console.log(`\n🎓 Grado ${grade}: ${available.length} módulos disponibles`);

      if (available.length === 0) {
        console.log(`   ⚠️  No hay módulos con steps para grado ${grade}`);
        continue;
      }

      // Estrategia de selección:
      // 1. Priorizar disciplinas menos usadas
      // 2. Si empate, elegir el primero (order_index)
      
      let selectedModule = null;
      let minDisciplineUsage = Infinity;

      for (const module of available) {
        const disciplines = Array.from(module.disciplines);
        const totalUsage = disciplines.reduce((sum, d) => sum + (disciplineUsage[d] || 0), 0);
        
        if (totalUsage < minDisciplineUsage) {
          minDisciplineUsage = totalUsage;
          selectedModule = module;
        }
      }

      if (selectedModule) {
        // Actualizar contadores de disciplinas
        Array.from(selectedModule.disciplines).forEach(d => {
          disciplineUsage[d] = (disciplineUsage[d] || 0) + 1;
        });

        selectedModules.push({
          grade: grade,
          ...selectedModule,
          disciplines: Array.from(selectedModule.disciplines)
        });

        console.log(`   ✅ Seleccionado: ${selectedModule.title.substring(0, 50)}`);
        console.log(`      Disciplinas: ${Array.from(selectedModule.disciplines).join(', ')}`);
        console.log(`      Steps: ${selectedModule.stepCount}`);
      }
    }

    // Mostrar selección final
    console.log('\n\n✨ MÓDULOS SELECCIONADOS (1 POR GRADO):\n');
    console.log('=' .repeat(80));

    selectedModules.forEach((m, idx) => {
      console.log(`\n${idx + 1}. Grado ${m.grade} - ${m.title}`);
      console.log(`   ID: ${m.id}`);
      console.log(`   Grado original: ${m.grade_range} | Dificultad: ${m.difficulty}`);
      console.log(`   Steps: ${m.stepCount}`);
      console.log(`   Disciplinas: ${m.disciplines.join(', ') || 'No especificada'}`);
      if (m.learning_objective) {
        console.log(`   Objetivo: ${m.learning_objective.substring(0, 80)}...`);
      }
    });

    // Resumen de cobertura
    console.log('\n\n📊 COBERTURA POR DISCIPLINA:\n');
    console.log('=' .repeat(80));
    Object.keys(disciplineUsage).sort().forEach(discipline => {
      const count = disciplineUsage[discipline];
      console.log(`  ${discipline}: ${count} grados`);
    });

    console.log('\n\n📊 COBERTURA POR GRADO:\n');
    console.log('=' .repeat(80));
    const coveredGrades = selectedModules.map(m => m.grade);
    const missingGrades = targetGrades.filter(g => !coveredGrades.includes(g));
    
    console.log(`✅ Grados cubiertos: ${coveredGrades.join(', ')}`);
    if (missingGrades.length > 0) {
      console.log(`⚠️  Grados faltantes: ${missingGrades.join(', ')}`);
    } else {
      console.log(`🎉 ¡Cobertura completa de grados 1-11!`);
    }

    // Exportar IDs
    console.log('\n\n📋 IDs DE MÓDULOS SELECCIONADOS:\n');
    console.log('=' .repeat(80));
    console.log('[');
    selectedModules.forEach((m, idx) => {
      const comma = idx < selectedModules.length - 1 ? ',' : '';
      console.log(`  '${m.id}'${comma} // Grado ${m.grade}: ${m.title.substring(0, 40)}`);
    });
    console.log(']');

    console.log('\n\n💡 ESTRATEGIA DE ENRIQUECIMIENTO:\n');
    console.log('=' .repeat(80));
    console.log(`\n1. Enriquecer estos ${selectedModules.length} módulos con 8 steps cada uno`);
    console.log(`2. Usar variedad de tipos: option, keywords, multiple_select, matching, ordering`);
    console.log(`3. Asegurar misconceptions apropiadas para cada grado`);
    console.log(`4. Esto permitirá:`);
    console.log(`   - Test diagnóstico funcional para todos los grados`);
    console.log(`   - Misconception Engine con datos de grados 1-11`);
    console.log(`   - Usuario de prueba (grado 5) tendrá contenido apropiado`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

selectOnePerGrade()
  .then(() => {
    console.log('\n\n✅ Selección completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
