// Re-enrich Language classification_task steps with updated enrichment logic
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Read invalid steps list
const invalidSteps = JSON.parse(fs.readFileSync('./invalid-correct-options.json', 'utf8'));
const languageSteps = invalidSteps.filter(s => s.subject === 'language').map(s => s.step_id);

console.log(`\n=== Re-enriching ${languageSteps.length} Language classification_task Steps ===\n`);
console.log('These steps were incorrectly enriched with answer_type "option"');
console.log('Will re-enrich with type "text" and evaluation_strategy "classification"\n');

// Use the same system prompt from enrichment.js
const ENRICHMENT_SYSTEM_PROMPT = `Eres un experto en pedagogía y diseño instruccional para educación K-12 en Colombia.

Tu tarea es generar el campo "enriched_content" para steps de módulos educativos.

Estructura de enriched_content:
{
  "cognitive_dimension": "comprension|representacion|razonamiento|transferencia|metacognicion",
  "expected_answer": {
    "type": "text|option|numeric|drawing",
    "evaluation_strategy": "keywords|classification" (opcional),
    "correct_value": null (para numeric),
    "correct_options": [] (para option, array de índices),
    "required_keywords": [] (para keywords),
    "optional_keywords": [] (para keywords),
    "misconceptions": [
      {
        "pattern": "regex o valor incorrecto",
        "misconception_key": "identificador_unico",
        "card_key": "concept_card_id",
        "severity": "low|medium|high",
        "common_among_grade": "grado típico"
      }
    ]
  },
  "step_config": {
    "expected_time": 60,
    "difficulty_indicator": "easy|medium|hard",
    "hints": ["hint 1", "hint 2", "hint 3"],
    "hint_card_key": "concept_card_id",
    "concept_card_key": "concept_card_id",
    "visual_template_key": "visual_template_id",
    "reflection_prompts": ["pregunta reflexiva 1"]
  },
  "taxonomy_links": {
    "microtopics": [],
    "competencies": []
  }
}

DIMENSIONES COGNITIVAS:
- comprension: Entender conceptos básicos, definiciones
- representacion: Visualizar, modelar, usar símbolos
- razonamiento: Inferir, deducir, aplicar lógica
- transferencia: Aplicar a contextos nuevos
- metacognicion: Reflexionar sobre el propio aprendizaje

INSTRUCCIONES:
1. Analiza el step_type, content (question/instruction), y phase
2. Determina la dimensión cognitiva más apropiada
3. Identifica el tipo de respuesta esperada
4. Define misconceptions comunes para ese grado
5. Genera hints progresivos
6. Asigna difficulty_indicator y expected_time

IMPORTANTE:
- Si es question con opciones → type: "option", correct_options: [indices correctos]
- Si es classification_task (drag & drop) → type: "text", evaluation_strategy: "classification" (NO uses "option")
- Si requiere keywords → type: "text", evaluation_strategy: "keywords"
- Si es numérico → type: "numeric"
- Misconceptions deben ser específicos y realistas
- Hints deben ser progresivos (no dar la respuesta directamente)

ESPECIAL - classification_task:
- Los classification_task NO tienen options tradicionales
- Usan input_mode: "drag_drop" para clasificar ejemplos
- type debe ser "text", NO "option"
- evaluation_strategy: "classification"
- NO generes correct_options (déjalo vacío o no incluyas el campo)
- expected_answer puede incluir las categorías esperadas

Responde SOLO con el JSON de enriched_content, sin markdown.`;

async function reEnrichStep(stepId, index, total) {
    console.log(`\n[${index + 1}/${total}] Processing step ${stepId.substring(0, 8)}...`);
    
    try {
        // Get step data
        const { data: step, error: stepError } = await supabase
            .schema('kuneo')
            .from('module_steps')
            .select('id, module_id, step_type, step_order, phase, content')
            .eq('id', stepId)
            .single();
        
        if (stepError) throw stepError;
        
        // Get module context
        const { data: module, error: moduleError } = await supabase
            .schema('kuneo')
            .from('modules')
            .select('title, subject, grade_range, learning_objective, core_concept')
            .eq('id', step.module_id)
            .single();
        
        if (moduleError) throw moduleError;
        
        // Build user prompt
        const question = step.content?.prompt || step.content?.instruction || 'N/A';
        const context = step.content?.context || '';
        const conceptKey = step.content?.concept_key || '';
        
        const userPrompt = `
CONTEXTO DEL MÓDULO:
- Título: ${module.title}
- Asignatura: ${module.subject}
- Grado: ${module.grade_range}
- Objetivo: ${module.learning_objective || 'N/A'}
- Concepto central: ${module.core_concept || 'N/A'}

STEP A ENRIQUECER:
- Orden: ${step.step_order}
- Tipo: ${step.step_type}
- Fase: ${step.phase || 'N/A'}
- Prompt: ${question}
- Contexto: ${context}
- Concept key: ${conceptKey}
- Input mode: ${step.content?.input_mode || 'N/A'}

Genera el enriched_content apropiado para este ${step.step_type}.
RECUERDA: classification_task debe usar type: "text" con evaluation_strategy: "classification", NO "option".`;

        // Call OpenAI
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
        
        // Verify answer_type
        const answerType = enrichedContent.expected_answer?.type;
        if (answerType === 'option') {
            console.warn('⚠️  WARNING: OpenAI still generated type "option" for classification_task!');
            console.warn('   Manually fixing to type "text"...');
            enrichedContent.expected_answer.type = 'text';
            enrichedContent.expected_answer.evaluation_strategy = 'classification';
            delete enrichedContent.expected_answer.correct_options;
        }
        
        console.log(`   Answer type: ${enrichedContent.expected_answer?.type}`);
        console.log(`   Evaluation strategy: ${enrichedContent.expected_answer?.evaluation_strategy || 'none'}`);
        
        // Update database
        const { error: updateError } = await supabase
            .schema('kuneo')
            .from('module_steps')
            .update({ enriched_content: enrichedContent })
            .eq('id', stepId);
        
        if (updateError) throw updateError;
        
        console.log(`   ✅ Updated successfully`);
        
        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { success: true, stepId };
        
    } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        return { success: false, stepId, error: error.message };
    }
}

async function reEnrichAll() {
    console.log(`Starting re-enrichment at ${new Date().toLocaleTimeString()}\n`);
    console.log(`Estimated time: ~${Math.ceil(languageSteps.length * 2 / 60)} minutes\n`);
    
    const results = [];
    
    for (let i = 0; i < languageSteps.length; i++) {
        const result = await reEnrichStep(languageSteps[i], i, languageSteps.length);
        results.push(result);
    }
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('RE-ENRICHMENT COMPLETE');
    console.log('='.repeat(80));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\nTotal: ${results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\nFailed steps:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`- ${r.stepId}: ${r.error}`);
        });
    }
    
    console.log('\n💡 Next step: Run validate-correct-options.js to verify fix');
    
    process.exit(failed > 0 ? 1 : 0);
}

reEnrichAll();
