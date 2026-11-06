/**
 * Inspeccionar estructura de los 8 módulos seleccionados
 * Ver qué contenido tienen actualmente en sus steps
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SELECTED_MODULES = [
  { id: '50723c30-801e-4fcf-a0d9-bc8aabf7d392', grade: '1 (1-3)' },
  { id: '598e7ca2-86c6-4f35-962d-66071676c8a5', grade: '2' },
  { id: '55dcf67b-fbec-493f-bbe9-10bafc12aaaa', grade: '3 (1-3)' },
  { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', grade: '4-5' },
  { id: '1a2ce848-0a2b-4917-9d73-da6cadfd10e2', grade: '6-7' },
  { id: '1ffe605b-82bf-4661-936a-cbbd860ede9c', grade: '6-7 (alt)' },
  { id: '532531dd-64d7-4f66-9299-4f2190fd491f', grade: '8-9' },
  { id: '569e1100-c28e-4747-80a4-b33241774633', grade: '10-11' }
];

async function inspectModules() {
  console.log('🔍 Inspeccionando estructura de los 8 módulos seleccionados...\n');

  try {
    for (const module of SELECTED_MODULES) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📦 MÓDULO DE GRADO ${module.grade}`);
      console.log(`ID: ${module.id}`);
      console.log('='.repeat(80));

      // Obtener info del módulo
      const { data: moduleData, error: modError } = await supabase
        .schema('kuneo')
        .from('modules')
        .select('title, learning_objective, core_concept, grade_range, difficulty')
        .eq('id', module.id)
        .single();

      if (modError) {
        console.log(`❌ Error obteniendo módulo: ${modError.message}`);
        continue;
      }

      console.log(`\n📚 Título: ${moduleData.title}`);
      console.log(`🎯 Objetivo: ${moduleData.learning_objective}`);
      console.log(`💡 Concepto: ${moduleData.core_concept}`);
      console.log(`📊 Grado: ${moduleData.grade_range} | Dificultad: ${moduleData.difficulty}`);

      // Obtener taxonomías
      const { data: taxonomies, error: taxError } = await supabase
        .schema('kuneo')
        .from('module_taxonomy_link')
        .select(`
          link_type,
          curriculum_taxonomy (
            discipline,
            thematic,
            subthematic
          )
        `)
        .eq('module_id', module.id);

      if (!taxError && taxonomies && taxonomies.length > 0) {
        console.log(`\n🏷️  Taxonomías:`);
        taxonomies.forEach(t => {
          const tax = t.curriculum_taxonomy;
          console.log(`   - [${t.link_type}] ${tax.discipline || 'N/A'} > ${tax.thematic || 'N/A'}`);
          if (tax.subthematic) {
            console.log(`     └─ ${tax.subthematic}`);
          }
        });
      }

      // Obtener steps
      const { data: steps, error: stepsError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('id, step_order, enriched_content')
        .eq('module_id', module.id)
        .order('step_order', { ascending: true });

      if (stepsError) {
        console.log(`❌ Error obteniendo steps: ${stepsError.message}`);
        continue;
      }

      console.log(`\n📝 Steps (${steps.length} total):`);
      
      steps.forEach((step, idx) => {
        const hasEnriched = step.enriched_content !== null;
        const status = hasEnriched ? '✅ Enriquecido' : '❌ Sin enriquecer';
        
        console.log(`\n   Step ${step.step_order}: ${status}`);
        
        if (hasEnriched && step.enriched_content) {
          const ec = step.enriched_content;
          console.log(`      Tipo: ${ec.type || 'N/A'}`);
          if (ec.question) {
            console.log(`      Pregunta: ${ec.question.substring(0, 60)}...`);
          }
          if (ec.context) {
            console.log(`      Contexto: ${ec.context.substring(0, 60)}...`);
          }
        }
      });
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE ENRIQUECIMIENTO');
    console.log('='.repeat(80));

    let totalSteps = 0;
    let enrichedSteps = 0;

    for (const module of SELECTED_MODULES) {
      const { data: steps } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .select('enriched_content')
        .eq('module_id', module.id);

      if (steps) {
        totalSteps += steps.length;
        enrichedSteps += steps.filter(s => s.enriched_content !== null).length;
      }
    }

    console.log(`\n📈 Total steps: ${totalSteps}`);
    console.log(`✅ Enriquecidos: ${enrichedSteps}`);
    console.log(`❌ Por enriquecer: ${totalSteps - enrichedSteps}`);
    console.log(`📊 Progreso: ${Math.round((enrichedSteps / totalSteps) * 100)}%`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectModules()
  .then(() => {
    console.log('\n\n✅ Inspección completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
