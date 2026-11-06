// ============================================
// ENRICHMENT ENGINE - Generación de enriched_content
// ============================================
// Script para poblar enriched_content en module_steps usando OpenAI
// ============================================

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

// Configuración
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ============================================
// PLANTILLA DE ENRICHED_CONTENT
// ============================================
const ENRICHED_CONTENT_TEMPLATE = {
  cognitive_dimension: 'comprension', // comprension, representacion, razonamiento, transferencia, metacognicion
  expected_answer: {
    type: 'text', // text, option, numeric, drawing
    evaluation_strategy: null, // keywords (opcional para text)
    correct_value: null, // Para numeric
    correct_options: [], // Para option
    required_keywords: [], // Para keywords strategy
    optional_keywords: [], // Para keywords strategy
    misconceptions: [
      // {
      //   pattern: "",
      //   misconception_key: "",
      //   card_key: "",
      //   severity: "low|medium|high",
      //   common_among_grade: ""
      // }
    ]
  },
  step_config: {
    expected_time: 60, // segundos
    difficulty_indicator: 'medium', // easy, medium, hard
    hints: [
      // Array de hints progresivos (texto)
    ],
    hint_card_key: null, // concept_card para hint level 2
    concept_card_key: null, // concept_card principal
    visual_template_key: null, // visual_template para level 3
    reflection_prompts: []
  },
  taxonomy_links: {
    microtopics: [], // IDs de microtopics relacionados
    competencies: [] // IDs de competencias
  }
};

// ============================================
// SYSTEM PROMPT PARA OPENAI
// ============================================
const ENRICHMENT_SYSTEM_PROMPT = `Eres un experto en pedagogía y diseño instruccional para educación K-12 en Colombia.

Tu tarea es generar el campo "enriched_content" para steps de módulos educativos.

Estructura de enriched_content:
{
  "cognitive_dimension": "comprension|representacion|razonamiento|transferencia|metacognicion",
  "expected_answer": {
    "type": "text|option|numeric|drawing",
    "evaluation_strategy": "keywords" (opcional, solo si type=text),
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

// ============================================
// FUNCIÓN PRINCIPAL: Enriquecer un step
// ============================================
async function enrichStep(step, moduleContext) {
  console.log(`\n🔄 Enriqueciendo step ${step.step_order} del módulo "${moduleContext.title}"`);
  
  // Extraer contenido del JSONB
  const question = step.content?.question || step.content?.instruction || 'N/A';
  const options = step.content?.options ? JSON.stringify(step.content.options) : 'N/A';
  const correctAnswer = step.content?.correct_answer || step.content?.expected_value || 'N/A';
  const explanation = step.content?.explanation || 'N/A';
  
  const userPrompt = `
CONTEXTO DEL MÓDULO:
- Título: ${moduleContext.title}
- Asignatura: ${moduleContext.subject}
- Grado: ${moduleContext.grade_range}
- Objetivo: ${moduleContext.learning_objective}
- Concepto central: ${moduleContext.core_concept}

STEP A ENRIQUECER:
- Orden: ${step.step_order}
- Tipo: ${step.step_type}
- Fase: ${step.phase || 'N/A'}
- Pregunta/Instrucción: ${question}
- Opciones: ${options}
- Respuesta correcta (si existe): ${correctAnswer}
- Explicación: ${explanation}
- Contenido completo: ${JSON.stringify(step.content)}

Genera el enriched_content para este step siguiendo la estructura definida.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ENRICHMENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,  // Menor temperature para mayor consistencia
      max_tokens: 2000,
      response_format: { type: "json_object" }  // Forzar JSON válido
    });

    let content = completion.choices[0].message.content;
    
    // Limpiar cualquier markdown que pueda estar envuelto
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const enrichedContent = JSON.parse(content);
    
    console.log(`✅ Enriched content generado para step ${step.step_order}`);
    console.log(`   Dimensión: ${enrichedContent.cognitive_dimension}`);
    console.log(`   Answer type: ${enrichedContent.expected_answer.type}`);
    console.log(`   Misconceptions: ${enrichedContent.expected_answer.misconceptions.length}`);
    
    return enrichedContent;
    
  } catch (error) {
    console.error(`❌ Error enriqueciendo step ${step.step_order}:`, error.message);
    throw error;
  }
}

// ============================================
// FUNCIÓN: Guardar enriched_content en DB
// ============================================
async function saveEnrichedContent(stepId, enrichedContent) {
  const { error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .update({ 
      enriched_content: enrichedContent,
      enriched_at: new Date().toISOString()
    })
    .eq('id', stepId);

  if (error) {
    console.error(`❌ Error guardando enriched_content:`, error);
    throw error;
  }

  console.log(`💾 Enriched content guardado en DB`);
}

// ============================================
// FUNCIÓN: Enriquecer un módulo completo
// ============================================
async function enrichModule(moduleId) {
  console.log(`\n📚 Iniciando enrichment del módulo ${moduleId}...`);

  // 1. Obtener módulo
  const { data: module, error: moduleError } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (moduleError || !module) {
    console.error('❌ Módulo no encontrado:', moduleError);
    return;
  }

  console.log(`✅ Módulo: ${module.title}`);

  // 2. Obtener steps sin enriched_content
  const { data: steps, error: stepsError } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .eq('module_id', moduleId)
    .is('enriched_content', null)
    .order('step_order');

  if (stepsError) {
    console.error('❌ Error obteniendo steps:', stepsError);
    return;
  }

  console.log(`📝 Steps a enriquecer: ${steps.length}`);

  // 3. Enriquecer cada step
  let successCount = 0;
  let failCount = 0;

  for (const step of steps) {
    try {
      const enrichedContent = await enrichStep(step, module);
      await saveEnrichedContent(step.id, enrichedContent);
      successCount++;
      
      // Delay para evitar rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Fallo en step ${step.id}`);
      failCount++;
    }
  }

  console.log(`\n📊 RESUMEN:`);
  console.log(`   ✅ Éxitos: ${successCount}`);
  console.log(`   ❌ Fallos: ${failCount}`);
  console.log(`   📈 Total: ${steps.length}`);
}

// ============================================
// FUNCIÓN: Enriquecer por lotes (batch)
// ============================================
async function enrichBySubject(subject, limit = 100) {
  console.log(`\n🎯 Iniciando enrichment masivo para ${subject}...`);
  console.log(`   Límite: ${limit} steps\n`);

  // 1. Obtener modules de la asignatura
  const { data: modules, error: modulesError } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title, subject, grade_range, learning_objective, core_concept')
    .eq('subject', subject);

  if (modulesError) {
    console.error('❌ Error obteniendo modules:', modulesError);
    return;
  }

  console.log(`📚 Módulos encontrados: ${modules.length}`);

  const moduleMap = new Map(modules.map(m => [m.id, m]));
  const moduleIds = modules.map(m => m.id);

  // 2. Obtener steps sin enriched_content de esos módulos
  const { data: steps, error: stepsError } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .in('module_id', moduleIds)
    .is('enriched_content', null)
    .order('step_order')
    .limit(limit);

  if (stepsError) {
    console.error('❌ Error obteniendo steps:', stepsError);
    return;
  }

  console.log(`📝 Steps encontrados: ${steps.length}\n`);

  let successCount = 0;
  let failCount = 0;
  let consecutiveFailures = 0;

  for (const step of steps) {
    try {
      const moduleContext = moduleMap.get(step.module_id);
      if (!moduleContext) {
        console.error(`❌ Module no encontrado para step ${step.id}`);
        failCount++;
        consecutiveFailures++;
        continue;
      }
      
      const enrichedContent = await enrichStep(step, moduleContext);
      await saveEnrichedContent(step.id, enrichedContent);
      successCount++;
      consecutiveFailures = 0;  // Reset en éxito
      
      console.log(`📈 Progreso: ${successCount + failCount}/${steps.length} (${(((successCount + failCount)/steps.length)*100).toFixed(1)}%)`);
      
      // Delay para rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Fallo en step ${step.id}`);
      failCount++;
      consecutiveFailures++;
      
      // Si hay muchos fallos consecutivos (no totales), detener
      if (consecutiveFailures > 10) {
        console.error('\n⚠️  Demasiados errores consecutivos, deteniendo...');
        break;
      }
      
      // Continuar con delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n✅ ENRICHMENT COMPLETADO`);
  console.log(`   📊 Éxitos: ${successCount}`);
  console.log(`   ❌ Fallos: ${failCount}`);
  console.log(`   📈 Total procesados: ${successCount + failCount}/${steps.length}`);
}

// ============================================
// CLI INTERFACE
// ============================================
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
📚 KUNEO ENRICHMENT ENGINE
  
Uso:
  node enrichment.js <command> [options]

Comandos:
  module <module_id>           Enriquecer un módulo específico
  subject <subject> [limit]    Enriquecer steps de una asignatura
                               Subjects: mathematics, natural_sciences, language, 
                                        social_studies, english
                               Limit: número de steps (default: 100)

Ejemplos:
  node enrichment.js module 0b0f4668-d41e-42b7-a51c-97c5842566b0
  node enrichment.js subject mathematics 120
  node enrichment.js subject natural_sciences 80
  `);
  process.exit(0);
}

// Ejecutar comando
(async () => {
  try {
    if (command === 'module') {
      const moduleId = args[1];
      if (!moduleId) {
        console.error('❌ Falta module_id');
        process.exit(1);
      }
      await enrichModule(moduleId);
      
    } else if (command === 'subject') {
      const subject = args[1];
      const limit = parseInt(args[2]) || 100;
      
      if (!subject) {
        console.error('❌ Falta subject');
        process.exit(1);
      }
      
      await enrichBySubject(subject, limit);
      
    } else {
      console.error('❌ Comando no reconocido:', command);
      process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
})();

module.exports = {
  enrichStep,
  enrichModule,
  enrichBySubject
};
