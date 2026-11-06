require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

// Política de keywords
const POLICIES = {
  '4-5': { step3: 0.30, step8: 0.25 },
  '6-7': { step3: 0.30, step8: 0.25 },
  '8-9': { step3: 0.35, step8: 0.30 },
  '10-11': { step3: 0.40, step8: 0.35 }
};

// Módulos a corregir
const MODULES = [
  { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', grade: '4-5' },
  { id: '4b94fd6c-ea04-4889-b025-546fc6e5ab1f', grade: '6-7' },
  { id: '1cfd46d3-14f3-45f7-b117-6cddadee7821', grade: '8-9' },
  { id: '10eacd17-7dbd-4d2d-8292-9a1257f9114c', grade: '10-11' }
];

async function fixKeywordPolicies() {
  console.log('🔧 Corrigiendo políticas de keywords en módulos enriquecidos\n');
  
  let totalFixed = 0;

  for (const module of MODULES) {
    const policy = POLICIES[module.grade];
    console.log(`📦 Grade ${module.grade} (${module.id})`);

    // Obtener steps 3 y 8
    const { data: steps, error } = await supabase
      .from('module_steps')
      .select('id, step_order, enriched_content')
      .eq('module_id', module.id)
      .in('step_order', [3, 8])
      .order('step_order');

    if (error || !steps) {
      console.log(`   ❌ Error: ${error?.message}\n`);
      continue;
    }

    for (const step of steps) {
      const content = step.enriched_content;
      
      if (!content || content.type !== 'keywords') {
        console.log(`   ⏭️  Step ${step.step_order}: No es keywords`);
        continue;
      }

      const keywords = content.expected_answer?.keywords || 
                      content.expected_answer?.required_keywords || 
                      content.keywords || [];

      if (keywords.length === 0) {
        console.log(`   ⚠️  Step ${step.step_order}: Sin keywords`);
        continue;
      }

      // Calcular min_keywords según política
      const percentage = step.step_order === 3 ? policy.step3 : policy.step8;
      const newMin = Math.max(1, Math.floor(keywords.length * percentage));

      // Actualizar
      if (!content.expected_answer) {
        content.expected_answer = {};
      }
      content.expected_answer.min_keywords = newMin;

      const { error: updateError } = await supabase
        .from('module_steps')
        .update({ enriched_content: content })
        .eq('id', step.id);

      if (updateError) {
        console.log(`   ❌ Step ${step.step_order}: ${updateError.message}`);
      } else {
        console.log(`   ✅ Step ${step.step_order}: min_keywords = ${newMin} (${keywords.length} keywords × ${Math.round(percentage*100)}%)`);
        totalFixed++;
      }
    }
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log(`✅ Corrección completada: ${totalFixed} steps actualizados`);
  console.log('💡 Reinicia el servidor para cargar los cambios en caché\n');
  
  process.exit(0);
}

fixKeywordPolicies().catch(console.error);
