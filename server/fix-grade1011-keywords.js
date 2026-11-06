require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const MODULE_ID = '10eacd17-7dbd-4d2d-8292-9a1257f9114c';

async function fixKeywordsCalibration() {
  console.log('🔧 Corrigiendo calibración de keywords para Grade 10-11...\n');

  // Step 3: concept_formation → 40%
  // Step 8: metacognition → 35%
  
  for (const stepOrder of [3, 8]) {
    const percentage = stepOrder === 3 ? 0.40 : 0.35;
    
    const { data: step, error: fetchError } = await supabase
      .from('module_steps')
      .select('id, enriched_content')
      .eq('module_id', MODULE_ID)
      .eq('step_order', stepOrder)
      .single();

    if (fetchError || !step) {
      console.error(`❌ Error obteniendo step ${stepOrder}:`, fetchError?.message);
      continue;
    }

    const enriched = step.enriched_content;
    if (!enriched || !Array.isArray(enriched.keywords)) {
      console.log(`⚠️  Step ${stepOrder}: No tiene keywords válidas, skip`);
      continue;
    }

    const oldMin = enriched.min_keywords;
    const newMin = Math.max(1, Math.floor(enriched.keywords.length * percentage));
    
    if (oldMin === newMin) {
      console.log(`✓ Step ${stepOrder}: Ya tiene calibración correcta (${newMin}/${enriched.keywords.length})`);
      continue;
    }

    enriched.min_keywords = newMin;
    
    const { error: updateError } = await supabase
      .from('module_steps')
      .update({ enriched_content: enriched })
      .eq('id', step.id);

    if (updateError) {
      console.error(`❌ Error actualizando step ${stepOrder}:`, updateError.message);
    } else {
      const oldPct = Math.round((oldMin / enriched.keywords.length) * 100);
      const newPct = Math.round((newMin / enriched.keywords.length) * 100);
      console.log(`✅ Step ${stepOrder}: ${oldMin} (${oldPct}%) → ${newMin} (${newPct}%) de ${enriched.keywords.length} keywords`);
    }
  }

  console.log('\n✨ Calibración completada');
}

fixKeywordsCalibration().then(() => process.exit(0));
