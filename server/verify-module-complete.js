require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '10eacd17-7dbd-4d2d-8292-9a1257f9114c';

const EXPECTED_TYPES = {
  1: 'option',
  2: 'option',
  3: 'keywords',
  4: 'multiple_select',
  5: 'matching',
  6: 'ordering',
  7: 'option',
  8: 'keywords'
};

async function verifyModule() {
  console.log(`\n🔍 Verificación detallada del módulo ${MODULE_ID}\n`);
  
  const { data: module } = await supabase
    .from('modules')
    .select('title, grade_range')
    .eq('id', MODULE_ID)
    .single();

  console.log(`📚 ${module.title} (Grado ${module.grade_range})\n`);
  console.log('='.repeat(90));

  const { data: steps } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', MODULE_ID)
    .order('step_order');

  let allValid = true;

  for (const step of steps) {
    const enriched = step.enriched_content;
    const expectedType = EXPECTED_TYPES[step.step_order];
    const hasQuestion = enriched && enriched.question;
    const actualType = enriched?.type;
    const typeMatch = actualType === expectedType;
    
    console.log(`\nStep ${step.step_order}: ${step.cognitive_dimension || 'undefined'}`);
    console.log(`  Tipo esperado: ${expectedType}`);
    console.log(`  Tipo actual: ${actualType || 'N/A'}`);
    console.log(`  ${typeMatch ? '✅' : '❌'} Tipo ${typeMatch ? 'correcto' : 'INCORRECTO'}`);
    console.log(`  ${hasQuestion ? '✅' : '❌'} ${hasQuestion ? 'Tiene pregunta' : 'SIN PREGUNTA'}`);
    
    if (hasQuestion) {
      console.log(`  Pregunta: "${enriched.question.substring(0, 80)}..."`);
    }
    
    // Validaciones específicas por tipo
    if (actualType === 'option' || actualType === 'multiple_select') {
      const hasCorrectOptions = Array.isArray(enriched.correct_options);
      console.log(`  ${hasCorrectOptions ? '✅' : '❌'} correct_options es ${hasCorrectOptions ? 'array' : 'NO ES ARRAY'}`);
      if (hasCorrectOptions) {
        console.log(`  correct_options: [${enriched.correct_options.join(', ')}]`);
      }
    } else if (actualType === 'keywords') {
      const hasKeywords = Array.isArray(enriched.keywords);
      const hasMinKeywords = typeof enriched.min_keywords === 'number';
      console.log(`  ${hasKeywords ? '✅' : '❌'} keywords: ${hasKeywords ? enriched.keywords.length : 'N/A'}`);
      console.log(`  ${hasMinKeywords ? '✅' : '❌'} min_keywords: ${hasMinKeywords ? enriched.min_keywords : 'N/A'}`);
      if (hasKeywords && hasMinKeywords) {
        const percentage = Math.round((enriched.min_keywords / enriched.keywords.length) * 100);
        console.log(`  Calibración: ${percentage}%`);
      }
    }

    if (!hasQuestion || !typeMatch) {
      allValid = false;
    }
    
    console.log('-'.repeat(90));
  }

  console.log(`\n${'='.repeat(90)}`);
  if (allValid) {
    console.log('✅ Módulo completamente válido y listo para uso');
  } else {
    console.log('❌ Módulo tiene problemas - revisar steps marcados');
  }
  console.log('='.repeat(90));
}

verifyModule().then(() => process.exit(0));
