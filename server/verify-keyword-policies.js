require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

// Política esperada
const GRADE_KEYWORD_POLICY = {
  '4-5': { step3: 0.30, step8: 0.25 },
  '6-7': { step3: 0.30, step8: 0.25 },
  '8-9': { step3: 0.35, step8: 0.30 },
  '10-11': { step3: 0.40, step8: 0.35 }
};

// Módulos enriquecidos conocidos
const ENRICHED_MODULES = [
  { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', grade: '4-5', name: 'Nomadismo/Agricultura' },
  { id: '4b94fd6c-ea04-4889-b025-546fc6e5ab1f', grade: '6-7', name: 'Análisis histórico' },
  { id: '1cfd46d3-14f3-45f7-b117-6cddadee7821', grade: '8-9', name: 'Módulo 8-9' },
  { id: '10eacd17-7dbd-4d2d-8292-9a1257f9114c', grade: '10-11', name: 'Módulo 10-11' }
];

async function verifyKeywordPolicies() {
  console.log('🔍 Verificando políticas de keywords en módulos enriquecidos\n');
  console.log('📋 Políticas esperadas:');
  Object.entries(GRADE_KEYWORD_POLICY).forEach(([grade, policy]) => {
    console.log(`   Grade ${grade}: Step 3=${Math.round(policy.step3*100)}%, Step 8=${Math.round(policy.step8*100)}%`);
  });
  console.log('\n' + '═'.repeat(80) + '\n');

  let totalViolations = 0;
  let totalChecked = 0;

  for (const module of ENRICHED_MODULES) {
    const policy = GRADE_KEYWORD_POLICY[module.grade];
    
    if (!policy) {
      console.log(`⚠️  ${module.name} (${module.grade}): Sin política definida\n`);
      continue;
    }

    console.log(`📦 ${module.name} (Grade ${module.grade})`);
    console.log(`   ID: ${module.id}`);

    // Obtener steps 3 y 8
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', module.id)
      .in('step_order', [3, 8])
      .order('step_order');

    if (stepsError) {
      console.log(`   ❌ Error: ${stepsError.message}\n`);
      continue;
    }

    if (!steps || steps.length === 0) {
      console.log(`   ⚠️  No se encontraron steps 3 y 8\n`);
      continue;
    }

    for (const step of steps) {
      totalChecked++;
      const content = step.enriched_content;
      
      if (!content) {
        console.log(`   ❌ Step ${step.step_order}: Sin enriched_content`);
        totalViolations++;
        continue;
      }

      if (content.type !== 'keywords') {
        console.log(`   ⚠️  Step ${step.step_order}: Tipo ${content.type} (esperado: keywords)`);
        continue;
      }

      // Obtener keywords
      const keywords = content.expected_answer?.keywords || 
                      content.expected_answer?.required_keywords || 
                      content.keywords || [];

      if (keywords.length === 0) {
        console.log(`   ❌ Step ${step.step_order}: Sin keywords definidas`);
        totalViolations++;
        continue;
      }

      // Obtener min_keywords actual
      const actualMin = content.expected_answer?.min_keywords || 
                       content.min_keywords || null;

      // Calcular min_keywords esperado según política
      const expectedPercentage = step.step_order === 3 ? policy.step3 : policy.step8;
      const expectedMin = Math.max(1, Math.floor(keywords.length * expectedPercentage));

      // Comparar
      const matches = actualMin === expectedMin;
      const icon = matches ? '✅' : '❌';
      
      console.log(`   ${icon} Step ${step.step_order}: ${actualMin} / ${expectedMin} esperado`);
      console.log(`      Keywords: ${keywords.length} | Política: ${Math.round(expectedPercentage*100)}%`);

      if (!matches) {
        totalViolations++;
        console.log(`      ⚠️  DESAJUSTE: Debe corregirse a ${expectedMin}`);
      }
    }

    console.log('');
  }

  console.log('═'.repeat(80));
  console.log(`📊 Resumen:`);
  console.log(`   • Steps verificados: ${totalChecked}`);
  console.log(`   • Violaciones encontradas: ${totalViolations}`);
  
  if (totalViolations === 0) {
    console.log('\n✅ ¡Todos los módulos cumplen con las políticas de keywords!');
  } else {
    console.log(`\n⚠️  Se encontraron ${totalViolations} desajustes que deben corregirse`);
    console.log('   💡 Ejecuta: node apply-keyword-policy.js');
  }

  process.exit(0);
}

verifyKeywordPolicies().catch(console.error);
