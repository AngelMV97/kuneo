require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

(async () => {
  const moduleId = '10eacd17-7dbd-4d2d-8292-9a1257f9114c';
  
  const { data, error } = await supabase
    .from('module_steps')
    .select('step_order, phase, enriched_content')
    .eq('module_id', moduleId)
    .order('step_order');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Módulo: e43bb575-a5d6-4bee-bc97-c7895421ae13');
  console.log('="¿Cómo analizar una situación social?"\n');
  
  data.forEach(s => {
    const enriched = s.enriched_content ? '✅ ENRIQUECIDO' : '❌ NULL';
    const phase = s.phase || 'no-phase';
    const hasVisual = s.enriched_content?.visual_template ? `visual: ${s.enriched_content.visual_template}` : 'no visual';
    
    console.log(`Step ${s.step_order}: phase=${phase.padEnd(20)} ${enriched.padEnd(18)} ${hasVisual}`);
    
    if (s.enriched_content) {
      const q = s.enriched_content.question || 'No question';
      console.log(`         "${q.substring(0, 70)}..."`);
    }
  });
  
  const enrichedCount = data.filter(s => s.enriched_content).length;
  console.log(`\n📊 Total steps: ${data.length}`);
  console.log(`✅ Enriquecidos: ${enrichedCount}`);
  console.log(`❌ Sin enriquecer: ${data.length - enrichedCount}`);
})();
