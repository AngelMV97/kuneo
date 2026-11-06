/**
 * Verificar formato de enriched_content para el módulo 604231bc
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFormat() {
  const moduleId = '604231bc-8ce4-45e7-932d-745d821dfeaa';

  console.log('🔍 Verificando formato de enriched_content\n');
  console.log('='.repeat(80));

  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order, enriched_content')
    .eq('module_id', moduleId)
    .order('step_order')
    .limit(2);

  if (!steps || steps.length === 0) {
    console.log('❌ No se encontraron steps');
    return;
  }

  steps.forEach((step, i) => {
    console.log(`\n📝 Step ${step.step_order}:\n`);
    
    const ec = step.enriched_content;
    
    if (!ec) {
      console.log('  ❌ Sin enriched_content');
      return;
    }

    console.log('  Estructura encontrada:');
    console.log(`    ✓ questions array: ${ec.questions ? `${ec.questions.length} preguntas` : '❌ no existe'}`);
    console.log(`    ✓ phase: ${ec.phase || '❌'}`);
    console.log(`    ✓ cognitive_dimension: ${ec.cognitive_dimension || '❌'}`);
    console.log(`    ✓ hierarchy: ${ec.hierarchy ? '✓' : '❌'}`);

    if (ec.questions && ec.questions.length > 0) {
      console.log('\n  📋 Primera pregunta del array:');
      const q = ec.questions[0];
      console.log(`    Texto: ${q.text.substring(0, 80)}...`);
      console.log(`    Tipo: ${q.type}`);
      console.log(`    Dificultad: ${q.difficulty}`);
      console.log(`    Puntos: ${q.points}`);
      console.log(`    Nivel cognitivo: ${q.cognitive_level}`);
      
      if (q.options) {
        console.log(`    Opciones: ${JSON.stringify(q.options).substring(0, 100)}...`);
      }
    }

    console.log('\n  🎯 Formato para frontend:');
    console.log('    Frontend espera:');
    console.log('      - enriched_content.questions[0].text → pregunta');
    console.log('      - enriched_content.questions[0].type → tipo');
    console.log('      - enriched_content.questions[0].options → opciones');
    console.log(`    Estado: ${ec.questions?.length > 0 ? '✅ Compatible' : '❌ Incompatible'}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Verificación completa\n');
}

checkFormat()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
