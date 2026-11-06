const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function inspectProblematicSteps() {
  console.log('🔍 Inspeccionando steps problemáticos...\n');

  // Módulo 604231bc step 3 (rechazó respuesta válida)
  const { data: step604_3 } = await supabase
    .from('module_steps')
    .select('id, enriched_content')
    .eq('module_id', '604231bc-8ce4-45e7-932d-745d821dfeaa')
    .eq('cognitive_dimension', 'concept_formation')
    .single();
    
  // Módulo 4b94fd6c step 8 (rechazó respuesta excelente)
  const { data: step4b9_8 } = await supabase
    .from('module_steps')
    .select('id, enriched_content')
    .eq('module_id', '4b94fd6c-ea04-4889-b025-546fc6e5ab1f')
    .eq('cognitive_dimension', 'metacognition')
    .single();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📝 604231bc Step 3 (Grade 4-5) - Rechazó respuesta válida');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Pregunta: ${step604_3.enriched_content.question}\n`);
  console.log(`Total keywords: ${step604_3.enriched_content.keywords.length}`);
  console.log(`min_keywords: ${step604_3.enriched_content.min_keywords}`);
  console.log(`Porcentaje: ${(step604_3.enriched_content.min_keywords / step604_3.enriched_content.keywords.length * 100).toFixed(1)}%`);
  console.log(`\nKeywords completos:`);
  console.log(step604_3.enriched_content.keywords.join(', '));
  
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📝 4b94fd6c Step 8 (Grade 6-7) - Rechazó respuesta excelente');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Pregunta: ${step4b9_8.enriched_content.question}\n`);
  console.log(`Total keywords: ${step4b9_8.enriched_content.keywords.length}`);
  console.log(`min_keywords: ${step4b9_8.enriched_content.min_keywords}`);
  console.log(`Porcentaje: ${(step4b9_8.enriched_content.min_keywords / step4b9_8.enriched_content.keywords.length * 100).toFixed(1)}%`);
  console.log(`\nKeywords completos:`);
  console.log(step4b9_8.enriched_content.keywords.join(', '));
  
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 ANÁLISIS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n604231bc Step 3:');
  console.log('  Respuesta rechazada: "Los grupos nómadas tenían que moverse constantemente');
  console.log('  porque buscaban alimentos y agua para sobrevivir. Seguían a los animales');
  console.log('  que cazaban y se trasladaban a lugares donde encontraban frutas, plantas');
  console.log('  y mejores condiciones para vivir."');
  console.log(`  → Requiere ${step604_3.enriched_content.min_keywords} de ${step604_3.enriched_content.keywords.length} keywords (${(step604_3.enriched_content.min_keywords / step604_3.enriched_content.keywords.length * 100).toFixed(1)}%)`);
  
  console.log('\n4b94fd6c Step 8:');
  console.log('  Respuesta rechazada: "Aprendí que es importante cuestionar las razones');
  console.log('  que se usaban en el pasado para justificar prácticas injustas, como la');
  console.log('  esclavitud o la discriminación..."');
  console.log(`  → Requiere ${step4b9_8.enriched_content.min_keywords} de ${step4b9_8.enriched_content.keywords.length} keywords (${(step4b9_8.enriched_content.min_keywords / step4b9_8.enriched_content.keywords.length * 100).toFixed(1)}%)`);
}

inspectProblematicSteps()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
