/**
 * Verificar estado detallado del módulo e43bb575-a5d6-4bee-bc97-c7895421ae13
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_ID = 'e43bb575-a5d6-4bee-bc97-c7895421ae13';

async function checkModule() {
  console.log('🔍 Verificando módulo de organizaciones sociales...\n');

  try {
    // Obtener info del módulo
    const { data: module, error: modError } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, title, subject, grade_range, difficulty')
      .eq('id', MODULE_ID)
      .single();

    if (modError) throw modError;

    console.log(`📦 Módulo: ${module.title}`);
    console.log(`   ID: ${module.id}`);
    console.log(`   Materia: ${module.subject}`);
    console.log(`   Grado: ${module.grade_range}`);
    console.log(`   Dificultad: ${module.difficulty}\n`);

    // Obtener todos los steps con su enriched_content
    const { data: steps, error: stepsError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', MODULE_ID)
      .order('step_order', { ascending: true });

    if (stepsError) throw stepsError;

    console.log(`📊 Total de steps: ${steps.length}\n`);
    console.log('=' .repeat(80));

    steps.forEach((step, idx) => {
      const ec = step.enriched_content;
      console.log(`\n✦ Step ${step.step_order} (${idx + 1}/${steps.length})`);
      
      if (!ec) {
        console.log('   ❌ Sin enriched_content');
        return;
      }

      console.log(`   📝 Tipo: ${ec.type || '❌ SIN TIPO'}`);
      
      if (ec.question) {
        console.log(`   ❓ Pregunta: ${ec.question.substring(0, 60)}...`);
      } else {
        console.log('   ❌ Sin pregunta');
      }

      // Verificar estructura según tipo
      let isComplete = false;
      
      if (ec.type === 'option' && ec.options && ec.expected_answer !== undefined) {
        console.log(`   ✅ Estructura completa (${ec.options.length} opciones, respuesta: ${ec.expected_answer})`);
        isComplete = true;
      } else if (ec.type === 'text' && ec.expected_answer) {
        console.log(`   ✅ Estructura completa (respuesta esperada)`);
        isComplete = true;
      } else if (ec.type === 'keywords' && ec.expected_answer) {
        console.log(`   ✅ Estructura completa (${ec.expected_answer.keywords?.length || 0} keywords)`);
        isComplete = true;
      } else if (ec.type === 'multiple_select' && ec.options && ec.correct_options) {
        console.log(`   ✅ Estructura completa (${ec.options.length} opciones, ${ec.correct_options.length} correctas)`);
        isComplete = true;
      } else if (ec.type === 'matching' && ec.left_items && ec.right_items && ec.correct_pairs) {
        console.log(`   ✅ Estructura completa (${ec.left_items.length} items, ${ec.correct_pairs.length} pares)`);
        isComplete = true;
      } else if (ec.type === 'ordering' && ec.items && ec.correct_order) {
        console.log(`   ✅ Estructura completa (${ec.items.length} items ordenables)`);
        isComplete = true;
      } else {
        console.log(`   ⚠️  Estructura incompleta o tipo desconocido`);
        if (ec.expected_answer) {
          console.log(`      - Tiene expected_answer`);
        }
        if (ec.correct_options) {
          console.log(`      - Tiene correct_options: [${ec.correct_options.join(', ')}]`);
        }
        if (ec.correct_pairs) {
          console.log(`      - Tiene correct_pairs: ${JSON.stringify(ec.correct_pairs)}`);
        }
        if (ec.correct_order) {
          console.log(`      - Tiene correct_order: [${ec.correct_order.join(', ')}]`);
        }
      }

      if (!isComplete) {
        console.log(`\n   🔍 Debug - Campos disponibles:`);
        console.log(`      ${Object.keys(ec).join(', ')}`);
      }
    });

    const completeSteps = steps.filter(s => {
      const ec = s.enriched_content;
      if (!ec || !ec.type) return false;
      
      if (ec.type === 'option') return ec.options && ec.expected_answer !== undefined;
      if (ec.type === 'text') return ec.expected_answer;
      if (ec.type === 'keywords') return ec.expected_answer;
      if (ec.type === 'multiple_select') return ec.options && ec.correct_options;
      if (ec.type === 'matching') return ec.left_items && ec.right_items && ec.correct_pairs;
      if (ec.type === 'ordering') return ec.items && ec.correct_order;
      
      return false;
    }).length;

    console.log('\n\n' + '=' .repeat(80));
    console.log(`\n📈 Resumen: ${completeSteps}/${steps.length} steps completamente enriquecidos`);
    
    if (completeSteps === steps.length) {
      console.log('✅ Módulo 100% completo!');
    } else {
      console.log(`⚠️  Faltan ${steps.length - completeSteps} steps por completar`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkModule()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
