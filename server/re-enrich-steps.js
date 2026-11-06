// ============================================
// RE-ENRICH SPECIFIC STEPS
// ============================================
// Script para re-intentar steps específicos que fallaron
// ============================================

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt mejorado para evitar errores de JSON
const ENRICHMENT_SYSTEM_PROMPT = `Eres un experto en pedagogía y diseño instruccional para educación K-12 en Colombia.

Tu tarea es generar el campo "enriched_content" para steps de módulos educativos.

ESTRUCTURA REQUERIDA (JSON válido):
{
  "cognitive_dimension": "comprension",
  "expected_answer": {
    "type": "option",
    "correct_options": [0],
    "misconceptions": [
      {
        "pattern": "^1$",
        "misconception_key": "key_unico",
        "card_key": "card_id",
        "severity": "medium",
        "common_among_grade": "8-9"
      }
    ]
  },
  "step_config": {
    "expected_time": 60,
    "difficulty_indicator": "medium",
    "hints": [
      "Hint 1",
      "Hint 2"
    ]
  },
  "taxonomy_links": {
    "microtopics": [],
    "competencies": []
  }
}

IMPORTANTE:
- Responde SOLO con JSON válido
- NO uses comillas simples, solo dobles
- NO incluyas comentarios en el JSON
- NO uses trailing commas
- Todos los strings deben estar entre comillas dobles
- Las keys deben estar entre comillas dobles

DIMENSIONES COGNITIVAS:
- comprension: Entender conceptos básicos
- representacion: Visualizar, modelar
- razonamiento: Inferir, deducir
- transferencia: Aplicar a contextos nuevos
- metacognicion: Reflexionar sobre el aprendizaje`;

async function enrichStep(stepId) {
  console.log(`\n🔄 Re-enriqueciendo step ${stepId}...`);
  
  // Obtener step
  const { data: step, error: stepError } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .eq('id', stepId)
    .single();

  if (stepError || !step) {
    console.error('❌ Step no encontrado:', stepError);
    return false;
  }

  // Obtener módulo por separado
  const { data: module, error: moduleError } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*')
    .eq('id', step.module_id)
    .single();

  if (moduleError || !module) {
    console.error('❌ Módulo no encontrado:', moduleError);
    return false;
  }

  const moduleContext = module;
  const question = step.content?.question || step.content?.instruction || step.content?.prompt || 'N/A';
  const options = step.content?.options ? JSON.stringify(step.content.options) : 'N/A';

  const userPrompt = `
CONTEXTO DEL MÓDULO:
- Título: ${moduleContext.title}
- Asignatura: ${moduleContext.subject}
- Grado: ${moduleContext.grade_range}
- Concepto: ${moduleContext.core_concept}

STEP A ENRIQUECER:
- Orden: ${step.step_order}
- Tipo: ${step.step_type}
- Fase: ${step.phase}
- Contenido: ${question}
- Opciones: ${options}

Genera SOLO el JSON de enriched_content. Sin texto adicional, sin markdown, sin explicaciones.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ENRICHMENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5, // Reducido para más consistencia
      max_tokens: 2000,
      response_format: { type: "json_object" } // Forzar JSON válido
    });

    let enrichedContent = completion.choices[0].message.content;
    
    // Limpiar posibles markdown o texto extra
    enrichedContent = enrichedContent.trim();
    if (enrichedContent.startsWith('```')) {
      enrichedContent = enrichedContent.replace(/```json\n?|\n?```/g, '');
    }
    
    const parsed = JSON.parse(enrichedContent);
    
    console.log(`✅ JSON válido generado`);
    console.log(`   Dimensión: ${parsed.cognitive_dimension}`);
    console.log(`   Answer type: ${parsed.expected_answer?.type}`);
    
    // Guardar en DB
    const { error: updateError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .update({ 
        enriched_content: parsed,
        enriched_at: new Date().toISOString()
      })
      .eq('id', stepId);

    if (updateError) {
      console.error(`❌ Error guardando:`, updateError);
      return false;
    }

    console.log(`💾 Guardado en DB exitosamente`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

// Ejecutar
const stepIds = process.argv.slice(2);

if (stepIds.length === 0) {
  console.log(`
Uso: node re-enrich-steps.js <step_id_1> [step_id_2] ...

Ejemplo:
  node re-enrich-steps.js 698b6f8b-015f-48c6-85cb-d50d9ca84ac4 60f7f5e0-ccf2-4a87-8fcd-f74df8758677
  `);
  process.exit(1);
}

(async () => {
  console.log(`\n🚀 Re-enriqueciendo ${stepIds.length} step(s)...\n`);
  
  let successCount = 0;
  
  for (const stepId of stepIds) {
    const success = await enrichStep(stepId);
    if (success) successCount++;
    
    // Delay entre steps
    if (stepIds.indexOf(stepId) < stepIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n📊 RESUMEN:`);
  console.log(`   ✅ Éxitos: ${successCount}/${stepIds.length}`);
  console.log(`   ❌ Fallos: ${stepIds.length - successCount}/${stepIds.length}`);
  
  process.exit(successCount === stepIds.length ? 0 : 1);
})();
