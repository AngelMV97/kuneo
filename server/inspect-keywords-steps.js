require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function inspectKeywordsSteps() {
  console.log('🔍 Inspeccionando steps con keywords de los 3 módulos...\n');
  
  const modules = [
    { id: 'e43bb575-a5d6-4bee-bc97-c7895421ae13', name: 'Grade 1-3' },
    { id: '604231bc-8ce4-45e7-932d-745d821dfeaa', name: 'Grade 4-5' },
    { id: '4b94fd6c-ea04-4889-b025-546fc6e5ab1f', name: 'Grade 6-7' }
  ];
  
  for (const module of modules) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 Módulo: ${module.name} (${module.id})`);
    console.log('='.repeat(80));
    
    const { data: steps, error } = await supabase
      .from('module_steps')
      .select('step_order, enriched_content')
      .eq('module_id', module.id)
      .order('step_order');
    
    if (error) {
      console.error('Error:', error.message);
      continue;
    }
    
    for (const step of steps) {
      const content = step.enriched_content;
      if (!content) continue;
      
      // Solo mostrar steps de tipo keywords
      if (content.type !== 'keywords') continue;
      
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 STEP ${step.step_order} (keywords)`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Pregunta: ${content.question}`);
      
      const keywords = content.expected_answer?.keywords || 
                      content.expected_answer?.required_keywords || 
                      content.keywords || [];
      const minKeywords = content.expected_answer?.min_keywords || 
                         content.min_keywords || 
                         Math.ceil(keywords.length * 0.75);
      
      console.log(`\nKeywords totales: ${keywords.length}`);
      console.log(`min_keywords: ${minKeywords}`);
      console.log(`\nKeywords: ${keywords.slice(0, 15).join(', ')}${keywords.length > 15 ? '...' : ''}`);
      
      if (keywords.length > 15) {
        console.log(`\n(Mostrando solo los primeros 15 de ${keywords.length} keywords)`);
      }
    }
  }
  
  process.exit(0);
}

inspectKeywordsSteps().catch(console.error);
