// Script para enriquecer módulos completos de English
// Target: 50 módulos × ~8 steps = ~400 steps adicionales
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt actualizado con classification_task handling
const ENRICHMENT_SYSTEM_PROMPT = `Eres un asistente experto en pedagogía y diseño instruccional. Tu tarea es generar contenido enriquecido para steps de módulos educativos.

Para cada step, debes analizar:
1. El tipo de actividad (step_type): question, guided_exercise, classification_task, visual_exploration, etc.
2. El contenido base (base_content)
3. El contexto del módulo (core_concept, difficulty, grade)

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
- Si es classification_task (drag & drop) → type: "text", evaluation_strategy: "classification" (NO uses "option")
- Si requiere keywords → type: "text", evaluation_strategy: "keywords"
- Si es numérico → type: "numeric"

ESPECIAL - classification_task:
- Los classification_task NO tienen options tradicionales
- Usan input_mode: "drag_drop" para clasificar ejemplos
- type debe ser "text", NO "option"
- evaluation_strategy: "classification"
- NO generes correct_options (déjalo vacío o no incluyas el campo)

Responde SOLO con el JSON, sin texto adicional.`;

async function enrichCompleteModules() {
  console.log('\n🎯 ENRICHMENT DE MÓDULOS COMPLETOS - ENGLISH\n');
  console.log('='.repeat(60));
  console.log('Target: 50 módulos × ~8 steps = ~400 steps');
  console.log('Estrategia: Completar módulos que ya tienen 2/8 steps\n');
  
  // 1. Obtener módulos English con steps parcialmente enriquecidos
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, core_concept, difficulty, grade_range, subject')
    .eq('subject', 'english')
    .order('difficulty')
    .limit(100); // Obtener más módulos de los necesarios
  
  if (modulesError) {
    console.error('❌ Error obteniendo módulos:', modulesError);
    return;
  }
  
  console.log(`📦 Analizando ${modules.length} módulos English...\n`);
  
  // 2. Filtrar módulos con steps sin enriquecer
  const candidateModules = [];
  
  for (const module of modules) {
    const { data: steps } = await supabase
      .from('module_steps')
      .select('id, step_order, step_type, base_content, enriched_content')
      .eq('module_id', module.id)
      .order('step_order');
    
    if (!steps || steps.length === 0) continue;
    
    const unenrichedSteps = steps.filter(s => s.enriched_content === null);
    const enrichedCount = steps.length - unenrichedSteps.length;
    
    if (unenrichedSteps.length > 0 && enrichedCount > 0) {
      candidateModules.push({
        ...module,
        totalSteps: steps.length,
        enrichedSteps: enrichedCount,
        unenrichedSteps: unenrichedSteps.length,
        steps: steps
      });
    }
    
    if (candidateModules.length >= 50) break;
  }
  
  console.log(`✅ Seleccionados ${candidateModules.length} módulos para completar\n`);
  
  // 3. Enriquecer steps faltantes
  let totalEnriched = 0;
  let totalFailed = 0;
  let moduleCount = 0;
  
  for (const module of candidateModules) {
    moduleCount++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 Módulo ${moduleCount}/${candidateModules.length}: ${module.title}`);
    console.log(`   Progress actual: ${module.enrichedSteps}/${module.totalSteps}`);
    console.log(`   Steps por enriquecer: ${module.unenrichedSteps}\n`);
    
    const unenrichedSteps = module.steps.filter(s => s.enriched_content === null);
    
    for (let i = 0; i < unenrichedSteps.length; i++) {
      const step = unenrichedSteps[i];
      
      console.log(`🔄 Step ${step.step_order} (${step.step_type})...`);
      
      try {
        // Generar enriched_content con OpenAI
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
        
        // Guardar en DB
        const { error: updateError } = await supabase
          .from('module_steps')
          .update({ enriched_content: enrichedContent })
          .eq('id', step.id);
        
        if (updateError) {
          console.log(`   ❌ Error guardando: ${updateError.message}`);
          totalFailed++;
        } else {
          console.log(`   ✅ Enriquecido (${enrichedContent.cognitive_dimension}, ${enrichedContent.expected_answer?.type})`);
          totalEnriched++;
        }
        
        // Delay entre requests (2 segundos)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        totalFailed++;
      }
    }
    
    console.log(`\n   ✅ Módulo "${module.title}" completado: ${module.totalSteps}/${module.totalSteps} steps`);
  }
  
  // 4. Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ ENRICHMENT COMPLETADO\n');
  console.log(`📊 Módulos procesados: ${moduleCount}`);
  console.log(`✅ Steps enriquecidos exitosamente: ${totalEnriched}`);
  console.log(`❌ Steps fallidos: ${totalFailed}`);
  console.log(`📈 Tasa de éxito: ${(totalEnriched/(totalEnriched+totalFailed)*100).toFixed(1)}%\n`);
  
  console.log('💡 Siguiente paso: node check-english-status.js para verificar progreso\n');
}

enrichCompleteModules()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
