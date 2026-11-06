/**
 * Inspeccionar el módulo de grado 4-5 en detalle
 * ID: 604231bc-8ce4-45e7-932d-745d821dfeaa
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = '604231bc-8ce4-45e7-932d-745d821dfeaa';

async function inspectGrade45Module() {
  console.log('🔍 Inspeccionando módulo de grado 4-5...\n');

  try {
    // Obtener info del módulo
    const { data: module, error: modError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('*')
      .eq('id', MODULE_ID)
      .single();

    if (modError) throw modError;

    console.log('📦 INFORMACIÓN DEL MÓDULO\n');
    console.log('='.repeat(80));
    console.log(`ID: ${module.id}`);
    console.log(`Título: ${module.title}`);
    console.log(`Grado: ${module.grade_range} | Dificultad: ${module.difficulty}`);
    console.log(`Objetivo: ${module.learning_objective}`);
    console.log(`Concepto: ${module.core_concept}`);

    // Obtener taxonomías
    const { data: taxonomies, error: taxError } = await supabase
      .schema('kuneo')
      .from('module_taxonomy_link')
      .select(`
        link_type,
        curriculum_taxonomy (
          discipline,
          thematic,
          subthematic,
          microtopics
        )
      `)
      .eq('module_id', MODULE_ID);

    if (!taxError && taxonomies) {
      console.log('\n🏷️  TAXONOMÍAS:');
      taxonomies.forEach(t => {
        const tax = t.curriculum_taxonomy;
        console.log(`\n[${t.link_type}] ${tax.discipline || 'N/A'}`);
        console.log(`  └─ Temática: ${tax.thematic || 'N/A'}`);
        if (tax.subthematic) {
          console.log(`  └─ Subtemática: ${tax.subthematic}`);
        }
        if (tax.microtopics && tax.microtopics.length > 0) {
          console.log(`  └─ Microtópicos: ${tax.microtopics.join(', ')}`);
        }
      });
    }

    // Obtener steps
    const { data: steps, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', MODULE_ID)
      .order('step_order', { ascending: true });

    if (stepsError) throw stepsError;

    console.log('\n\n📝 STEPS (8 total)\n');
    console.log('='.repeat(80));

    steps.forEach((step, idx) => {
      const hasEnriched = step.enriched_content !== null;
      
      console.log(`\n✦ Step ${step.step_order} ${hasEnriched ? '✅' : '❌'}`);
      console.log(`   ID: ${step.id}`);
      
      if (hasEnriched) {
        const ec = step.enriched_content;
        console.log(`   Tipo: ${ec.type || 'N/A'}`);
        console.log(`   Pregunta: ${ec.question?.substring(0, 80) || 'N/A'}...`);
        
        if (ec.context) {
          console.log(`   Contexto: ${ec.context.substring(0, 80)}...`);
        }
        
        // Verificar estructura según tipo
        if (ec.type === 'option' && ec.expected_answer) {
          const correct = ec.expected_answer.correct_options || [];
          console.log(`   Opciones: ${ec.options?.length || 0} | Correctas: ${correct.length}`);
        } else if (ec.type === 'keywords' && ec.expected_answer) {
          const keywords = ec.expected_answer.keywords || [];
          console.log(`   Keywords: ${keywords.length} palabras clave`);
        } else if (ec.type === 'multiple_select') {
          const correct = ec.correct_options || [];
          console.log(`   Opciones: ${ec.options?.length || 0} | Correctas: ${correct.length}`);
        } else if (ec.type === 'matching') {
          const pairs = ec.correct_pairs || [];
          console.log(`   Items izq: ${ec.left_items?.length || 0} | Pares: ${pairs.length}`);
        } else if (ec.type === 'ordering') {
          const order = ec.correct_order || [];
          console.log(`   Items: ${ec.items?.length || 0} | Orden: ${order.length}`);
        }
        
        // Verificar si tiene expected_answer bien formado
        if (ec.expected_answer) {
          console.log(`   ✓ expected_answer: ${ec.expected_answer.type || 'Sin tipo'}`);
          console.log(`   ✓ evaluation_strategy: ${ec.expected_answer.evaluation_strategy || 'Sin estrategia'}`);
        } else {
          console.log(`   ⚠️  Falta expected_answer`);
        }
      } else {
        console.log(`   ❌ Sin enriquecer`);
      }
    });

    const enrichedCount = steps.filter(s => s.enriched_content !== null).length;
    
    console.log('\n\n📊 RESUMEN\n');
    console.log('='.repeat(80));
    console.log(`Total steps: ${steps.length}`);
    console.log(`Enriquecidos: ${enrichedCount}`);
    console.log(`Pendientes: ${steps.length - enrichedCount}`);
    console.log(`Progreso: ${Math.round((enrichedCount / steps.length) * 100)}%`);

    if (enrichedCount < steps.length) {
      console.log('\n💡 Pasos a seguir:');
      console.log(`1. Enriquecer los ${steps.length - enrichedCount} steps faltantes`);
      console.log('2. Usar variedad de tipos: option, keywords, multiple_select, matching, ordering');
      console.log('3. Adaptar la complejidad a grado 4-5 (edad 9-10 años)');
      console.log('4. Incluir misconceptions apropiadas para este nivel');
    } else {
      console.log('\n✨ ¡Módulo completamente enriquecido!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectGrade45Module()
  .then(() => {
    console.log('\n\n✅ Inspección completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
