require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function fixMinKeywords() {
  console.log('🔧 Ajustando min_keywords de los steps problemáticos...\n');
  
  const fixes = [
    {
      module: 'e43bb575-a5d6-4bee-bc97-c7895421ae13',
      step: 3,
      oldMin: 2,
      newMin: 4,
      reason: 'Demasiado leniente (aceptaba "Una comunidad de personas")'
    },
    {
      module: '604231bc-8ce4-45e7-932d-745d821dfeaa',
      step: 3,
      oldMin: 13,
      newMin: 5,
      reason: 'Demasiado estricto (rechazaba respuestas válidas sobre nómadas)'
    },
    {
      module: '604231bc-8ce4-45e7-932d-745d821dfeaa',
      step: 8,
      oldMin: 15,
      newMin: 6,
      reason: 'Demasiado estricto (requería 79% de keywords)'
    }
  ];
  
  for (const fix of fixes) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📝 Módulo ${fix.module.substring(0, 8)}... Step ${fix.step}`);
    console.log(`   Razón: ${fix.reason}`);
    console.log(`   Cambio: min_keywords ${fix.oldMin} → ${fix.newMin}`);
    
    // Obtener el step actual
    const { data: stepData, error: fetchError } = await supabase
      .from('module_steps')
      .select('enriched_content')
      .eq('module_id', fix.module)
      .eq('step_order', fix.step)
      .single();
    
    if (fetchError) {
      console.error(`   ❌ Error obteniendo step: ${fetchError.message}`);
      continue;
    }
    
    // Actualizar min_keywords en expected_answer
    const content = stepData.enriched_content;
    if (content.expected_answer) {
      content.expected_answer.min_keywords = fix.newMin;
    }
    
    // Guardar el cambio
    const { error: updateError } = await supabase
      .from('module_steps')
      .update({ enriched_content: content })
      .eq('module_id', fix.module)
      .eq('step_order', fix.step);
    
    if (updateError) {
      console.error(`   ❌ Error actualizando: ${updateError.message}`);
    } else {
      console.log(`   ✅ Actualizado correctamente`);
    }
  }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('✅ Ajustes completados');
  console.log('\n📋 Resumen de calibración:');
  console.log('   • Grade 1-3: min_keywords = 4 (razonable para niños pequeños)');
  console.log('   • Grade 4-5: min_keywords = 5-6 (exige más palabras clave)');
  console.log('   • Grade 6-7: min_keywords = 3 (conceptos más complejos)');
  
  process.exit(0);
}

fixMinKeywords().catch(console.error);
