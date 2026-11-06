// Enriquecer 50 módulos English específicos (usando IDs exactos)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TARGET_MODULES = [
  "756cd440-432e-4e03-af4c-cf038aca76c1",
  "39f5c1a6-af23-4515-a0e4-0f3364b4382f",
  "82846e58-ed45-4f58-a0dd-6feb5f35ce49",
  "86b7d192-90bb-426d-a775-a86136a4a039",
  "a8014058-bc70-4e80-b7e0-42de96de4e76",
  "0ef87c7f-2add-4474-bbba-c9b445ef4f7c",
  "f5b2ee88-5c03-4bd2-8055-57f716e3af4e",
  "3ce465a1-501b-4621-909f-813dce6572cb",
  "607d53a5-7b5f-46d9-a76d-4efa5bc65344",
  "3f0a3ac2-3357-44a1-bb8d-4a2ce6638e3e",
  "db4d37f4-deae-4a50-8b94-d79e693e604c",
  "7433f823-35e2-4b81-9ace-00656c77100b",
  "805a5e29-5336-4716-a34a-d5237b6281b7",
  "de811bb5-a93d-4848-88b6-386266524cba",
  "e073735d-ce53-4bae-94bc-dee5f4cf0802",
  "05fd80c4-4289-46f0-ba07-12294aee6135",
  "58d3a29d-7d53-467a-8da9-07de7d3b372b",
  "496190c6-6426-432a-bf13-fcb24df61314",
  "a0e99222-0357-48db-9f51-6323298023a8",
  "d0a9c619-1757-466f-9d5e-3aa4dbc42208",
  "ff7d6671-18e4-4fe6-9399-d7aaf09bd550",
  "951201eb-b2c0-4959-ae02-997b7a1a4f66",
  "abd74672-a1f2-471f-98bf-2fd132d85a10",
  "3497dbec-3cc5-4a60-9f48-82ff3a3e8a06",
  "db7507f9-2264-4801-a483-a1a6d3fd06fa",
  "e687871a-ecee-49f5-a4a2-54a0df47d1f4",
  "4c44998a-72cc-4ced-a6a6-cc8c080ff73d",
  "4b560d02-0f70-49ef-81c1-622b4b6fc840",
  "91aea954-a9f3-471d-83b2-e4bcc27c8081",
  "62f7be6e-d667-437c-98e7-2c264cee78bc",
  "87b95f61-da5a-4255-8b82-9ca18d763089",
  "4afbf798-d95d-4d46-9a1a-992240ed354f",
  "a0ac7dae-fa7f-45a2-94e0-67e47abb2f60",
  "e90f248b-3add-498e-a844-674132f4d1d9",
  "a0475452-26ae-4ec3-8b54-26eeb1e4789c",
  "9122829e-904d-41a2-b0ac-50768af4cd9d",
  "19682781-4762-4adc-80e1-66a3beb11252",
  "a154b0f6-d09f-4d3b-bde9-162498ffe5aa",
  "f333dc34-32a2-417d-8329-2e6f1526d9a9",
  "af684bc8-5fcb-4f8e-8ab3-b36497a55999",
  "f70828d9-c108-4566-848f-ff87381933e3",
  "95e7d583-0ce8-40f1-b852-76d0c4afb71a",
  "3ab602c3-286a-46a6-b424-5ff58919042b",
  "01d65a53-5a28-475c-8fee-8e6bf9c422e0",
  "376e93c0-2299-41cb-9315-436aa0f6b68e",
  "e0cd2733-7cbc-441c-95b3-f85b738d661b",
  "203d2e00-dc54-4bcc-b5d6-742908c069ba",
  "e8ba3913-12b8-421f-ba71-054320da20c0",
  "2c838785-95ba-4d91-beaf-5a0b4e9ed6d8",
  "1d373254-a497-4a5f-a524-b184c72937f9"
];

const ENRICHMENT_SYSTEM_PROMPT = `Eres un asistente experto en pedagogía y diseño instruccional. Tu tarea es generar contenido enriquecido para steps de módulos educativos.

Para cada step, debes analizar:
1. El tipo de actividad (step_type): question, guided_exercise, classification_task, visual_exploration, etc.
2. El contenido (content)
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

async function enrichTargetModules() {
  console.log('\n🎯 ENRICHMENT DE 50 MÓDULOS ENGLISH (IDs específicos)\n');
  console.log('='.repeat(60));
  console.log(`Target: ${TARGET_MODULES.length} módulos (~400 steps)\n`);
  
  let totalEnriched = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let moduleCount = 0;
  
  for (const moduleId of TARGET_MODULES) {
    moduleCount++;
    
    // Obtener módulo
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, title, core_concept, difficulty, grade_range, subject')
      .eq('id', moduleId)
      .single();
    
    if (moduleError) {
      console.log(`\n❌ Error obteniendo módulo ${moduleId}: ${moduleError.message}\n`);
      continue;
    }
    
    if (!module) {
      console.log(`\n❌ Módulo ${moduleId} no encontrado\n`);
      continue;
    }
    
    // Obtener steps
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('id, step_order, step_type, content, enriched_content')
      .eq('module_id', moduleId)
      .order('step_order');
    
    if (stepsError) {
      console.log(`\n❌ Error obteniendo steps del módulo ${moduleId}: ${stepsError.message}\n`);
      continue;
    }
    
    if (!steps || steps.length === 0) {
      console.log(`\n⚠️  Módulo ${moduleCount}/${TARGET_MODULES.length}: "${module.title}" - Sin steps (array: ${steps ? 'empty' : 'null'})\n`);
      continue;
    }
    
    const unenrichedSteps = steps.filter(s => s.enriched_content === null);
    const enrichedCount = steps.length - unenrichedSteps.length;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 Módulo ${moduleCount}/${TARGET_MODULES.length}: ${module.title}`);
    console.log(`   Progress: ${enrichedCount}/${steps.length} steps`);
    
    if (unenrichedSteps.length === 0) {
      console.log(`   ✅ Completado - skipping`);
      totalSkipped += steps.length;
      continue;
    }
    
    console.log(`   🔄 Enriqueciendo ${unenrichedSteps.length} steps...`);
    
    for (const step of unenrichedSteps) {
      try {
        const userPrompt = `Módulo: "${module.title}"
Core concept: ${module.core_concept}
Difficulty: ${module.difficulty}/10
Grade range: ${module.grade_range}
Subject: ${module.subject}

Step type: ${step.step_type}
Step order: ${step.step_order}
Content: ${JSON.stringify(step.content, null, 2)}

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
          console.log(`      ❌ Step ${step.step_order}: Error`);
          totalFailed++;
        } else {
          console.log(`      ✅ Step ${step.step_order}: ${enrichedContent.cognitive_dimension}, ${enrichedContent.expected_answer?.type}`);
          totalEnriched++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`      ❌ Step ${step.step_order}: ${error.message}`);
        totalFailed++;
      }
    }
    
    console.log(`   ✅ Módulo completado\n`);
    
    if (moduleCount % 10 === 0) {
      console.log(`\n📊 Progress: ${moduleCount}/${TARGET_MODULES.length} | ${totalEnriched} enriquecidos | ${totalFailed} errors\n`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ ENRICHMENT COMPLETADO\n');
  console.log(`📊 Módulos procesados: ${moduleCount}`);
  console.log(`✅ Steps enriquecidos: ${totalEnriched}`);
  console.log(`⏭️  Steps ya enriquecidos: ${totalSkipped}`);
  console.log(`❌ Steps fallidos: ${totalFailed}`);
  console.log(`📈 Tasa de éxito: ${(totalEnriched/(totalEnriched+totalFailed)*100).toFixed(1)}%\n`);
}

enrichTargetModules()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
