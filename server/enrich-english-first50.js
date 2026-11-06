// Script simplificado para enriquecer 50 primeros módulos English
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ENRICHMENT_SYSTEM_PROMPT = `Eres un asistente experto en pedagogía y diseño instruccional. Tu tarea es generar contenido enriquecido para steps de módulos educativos.

Para cada step, debes analizar:
1. El tipo de actividad (step_type): question, guided_exercise, classification_task, visual_exploration, etc.
2. El contenido base (base_content)
3. El contexto del módulo (core_concept, difficulty, grade_range)

Y generar un JSON con:
- cognitive_dimension: Una de [comprension, representacion, razonamiento, transferencia, metacognicion]
- expected_answer: Objeto con:
  * type: "option", "text", "numeric", o "drawing"
  * evaluation_strategy: "exact", "keywords", "numeric_tolerance", "classification", etc.
  * correct_options: [array de índices] SOLO si type es "option"
  * keywords: [array de strings] SOLO si evaluation_strategy es "keywords"
  * tolerance: number SOLO si type es "numeric"
- misconceptions: Array de objetos con {description, why_incorrect, correct_explanation}

IMPORTANTE:
- Si es question con opciones → type: "option", correct_options: [indices correctos]
- Si es classification_task (drag & drop) → type: "text", evaluation_strategy: "classification"
- Si requiere keywords → type: "text", evaluation_strategy: "keywords"
- Si es numérico → type: "numeric"

Responde SOLO con el JSON, sin texto adicional.`;

async function enrichFirst50Modules() {
  console.log('\n🎯 ENRICHMENT DE PRIMEROS 50 MÓDULOS - ENGLISH\n');
  console.log('='.repeat(60));
  console.log('Estrategia: Enriquecer primeros 50 módulos por difficulty\n');
  
  // 1. Obtener primeros 50 módulos English por difficulty
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, core_concept, difficulty, grade_range, subject')
    .eq('subject', 'english')
    .order('difficulty', { ascending: true })
    .limit(50);
  
  if (modulesError) {
    console.error('❌ Error obteniendo módulos:', modulesError);
    return;
  }
  
  console.log(`📦 Obtenidos ${modules.length} módulos English\n`);
  
  let totalEnriched = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let moduleCount = 0;
  
  for (const module of modules) {
    moduleCount++;
    
    // Obtener todos los steps del módulo
    const { data: steps } = await supabase
      .from('module_steps')
      .select('id, step_order, step_type, base_content, enriched_content')
      .eq('module_id', module.id)
      .order('step_order');
    
    if (!steps || steps.length === 0) {
      console.log(`\n⚠️  Módulo ${moduleCount}/${modules.length}: "${module.title}" - Sin steps\n`);
      continue;
    }
    
    const unenrichedSteps = steps.filter(s => s.enriched_content === null);
    const enrichedCount = steps.length - unenrichedSteps.length;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 Módulo ${moduleCount}/${modules.length}: ${module.title}`);
    console.log(`   Difficulty: ${module.difficulty}/10 | Grade: ${module.grade_range}`);
    console.log(`   Progress: ${enrichedCount}/${steps.length} steps`);
    
    if (unenrichedSteps.length === 0) {
      console.log(`   ✅ Ya completado - skipping\n`);
      totalSkipped += steps.length;
      continue;
    }
    
    console.log(`   🔄 Enriqueciendo ${unenrichedSteps.length} steps...\n`);
    
    for (const step of unenrichedSteps) {
      console.log(`   🔄 Step ${step.step_order} (${step.step_type})...`);
      
      try {
        const userPrompt = `Módulo: "${module.title}"
Core concept: ${module.core_concept}
Difficulty: ${module.difficulty}/10
Grade range: ${module.grade_range}
Subject: ${module.subject}

Step type: ${step.step_type}
Step order: ${step.step_order}
Base content: ${JSON.stringify(step.base_content, null, 2)}

Genera el enriched_content apropiado en JSON.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: ENRICHMENT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5
        });
        
        const enrichedContent = JSON.parse(completion.choices[0].message.content);
        
        const { error: updateError } = await supabase
          .from('module_steps')
          .update({ enriched_content: enrichedContent })
          .eq('id', step.id);
        
        if (updateError) {
          console.log(`      ❌ Error guardando: ${updateError.message}`);
          totalFailed++;
        } else {
          console.log(`      ✅ OK (${enrichedContent.cognitive_dimension}, ${enrichedContent.expected_answer?.type})`);
          totalEnriched++;
        }
        
        // Delay 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        totalFailed++;
      }
    }
    
    console.log(`   ✅ Módulo completado: ${steps.length}/${steps.length} steps\n`);
    
    // Progress update cada 10 módulos
    if (moduleCount % 10 === 0) {
      console.log(`\n📊 Progress: ${moduleCount}/${modules.length} módulos | ${totalEnriched} steps | ${totalFailed} errors\n`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ ENRICHMENT COMPLETADO\n');
  console.log(`📊 Módulos procesados: ${moduleCount}`);
  console.log(`✅ Steps enriquecidos: ${totalEnriched}`);
  console.log(`⏭️  Steps ya enriquecidos (skipped): ${totalSkipped}`);
  console.log(`❌ Steps fallidos: ${totalFailed}`);
  console.log(`📈 Tasa de éxito: ${(totalEnriched/(totalEnriched+totalFailed)*100).toFixed(1)}%\n`);
}

enrichFirst50Modules()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
