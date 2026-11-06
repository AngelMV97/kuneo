require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODULE_ID = '10eacd17-7dbd-4d2d-8292-9a1257f9114c';

// Mapeo de dimensiones cognitivas a orden de step
const DIMENSION_TO_ORDER = {
  'exploration': 1,
  'representation': 2,
  'concept_formation': 3,
  'classification': 4,
  'guided_application': 5,
  'transfer': 6,
  'error_analysis': 7,
  'metacognition': 8
};

// Tipos de pregunta por step order
const STEP_TYPE_MAP = {
  1: 'option',
  2: 'option',
  3: 'keywords',
  4: 'multiple_select',
  5: 'matching',
  6: 'ordering',
  7: 'option',
  8: 'keywords'
};

async function enrichModule() {
  console.log('🔧 Enriqueciendo módulo Grade 10-11...\n');
  console.log(`📌 Módulo ID: ${MODULE_ID}`);

  // 1. Obtener información del módulo
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, core_concept, learning_objective, subject, grade_range')
    .eq('id', MODULE_ID)
    .single();

  if (moduleError || !module) {
    console.error('❌ Error obteniendo módulo:', moduleError?.message);
    return;
  }

  console.log(`📚 Título: ${module.title}`);
  console.log(`🎯 Concepto: ${module.core_concept}`);
  console.log(`🎓 Grado: ${module.grade_range}\n`);

  // 2. Obtener todos los steps
  const { data: steps, error: stepsError } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', MODULE_ID)
    .order('step_order', { ascending: true });

  if (stepsError || !steps) {
    console.error('❌ Error obteniendo steps:', stepsError?.message);
    return;
  }

  console.log(`📊 Total steps: ${steps.length}\n`);

  // 3. Identificar steps pendientes (sin enriched_content válido)
  const pendingSteps = steps.filter(step => {
    const hasValidContent = step.enriched_content && 
                           step.enriched_content.question &&
                           step.enriched_content.type;
    return !hasValidContent;
  });

  console.log(`✅ Steps ya enriquecidos: ${steps.length - pendingSteps.length}`);
  console.log(`⏳ Steps pendientes: ${pendingSteps.length}\n`);

  if (pendingSteps.length === 0) {
    console.log('✨ Todos los steps ya están enriquecidos!');
    return;
  }

  // 4. Enriquecer cada step pendiente
  for (const step of pendingSteps) {
    const stepType = STEP_TYPE_MAP[step.step_order];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📝 Enriqueciendo Step ${step.step_order}: ${step.cognitive_dimension}`);
    console.log(`   Tipo esperado: ${stepType}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      const enrichedContent = await generateEnrichedContent(
        module,
        step,
        stepType,
        steps
      );

      // Guardar en base de datos
      const { error: updateError } = await supabase
        .from('module_steps')
        .update({ enriched_content: enrichedContent })
        .eq('id', step.id);

      if (updateError) {
        console.error(`❌ Error guardando step ${step.step_order}:`, updateError.message);
      } else {
        console.log(`✅ Step ${step.step_order} enriquecido y guardado`);
      }

      // Pausa para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error enriqueciendo step ${step.step_order}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Enriquecimiento completado!');
  console.log('='.repeat(80));
}

async function generateEnrichedContent(module, step, stepType, allSteps) {
  const dimension = step.cognitive_dimension;
  const grade = module.grade_range;
  const concept = module.core_concept;

  // Contexto de steps anteriores
  const previousSteps = allSteps
    .filter(s => s.step_order < step.step_order)
    .map(s => `Step ${s.step_order} (${s.cognitive_dimension}): ${s.content || 'N/A'}`)
    .join('\n');

  let prompt = `Eres un experto en diseño pedagógico de Ciencias Sociales para estudiantes de ${grade} grado (15-17 años).

CONTEXTO DEL MÓDULO:
- Título: ${module.title}
- Concepto principal: ${concept}
- Objetivo de aprendizaje: ${module.learning_objective || 'N/A'}

DIMENSIÓN COGNITIVA: ${dimension}
TIPO DE PREGUNTA REQUERIDO: ${stepType}

STEPS ANTERIORES:
${previousSteps || 'Este es el primer step'}

`;

  // Prompts específicos por tipo
  if (stepType === 'option') {
    prompt += `
TAREA: Crea una pregunta de opción múltiple (4 opciones, solo 1 correcta).

Para estudiantes de grado ${grade}, la pregunta debe:
- Promover análisis crítico avanzado y pensamiento abstracto
- Abordar temas complejos con profundidad analítica
- Incluir contextos contemporáneos, debates actuales o dilemas éticos
- Requerir aplicación de conceptos teóricos a situaciones reales
- Fomentar perspectiva histórica y comprensión de procesos sociales complejos

FORMATO JSON REQUERIDO:
{
  "type": "option",
  "question": "Pregunta clara y directa que requiera análisis crítico (máx 200 caracteres)",
  "context": "Explicación contextual profunda del concepto (2-4 oraciones) para tarjeta conceptual, con rigor académico",
  "options": [
    "Opción A (la correcta, profunda y bien fundamentada)",
    "Opción B (distractor sofisticado y plausible)",
    "Opción C (distractor sofisticado y plausible)",
    "Opción D (distractor sofisticado y plausible)"
  ],
  "correct_answer": "Opción A",
  "expected_answer": {
    "type": "option",
    "correct_options": [0],
    "misconceptions": [
      {
        "pattern": "Opción B",
        "misconception_key": "clave_descriptiva_del_error",
        "card_key": "concept_card_asociada",
        "severity": "medium",
        "explanation": "Análisis detallado de por qué esta opción es incorrecta y qué malentendido conceptual revela",
        "common_among_grade": "${grade}"
      }
    ]
  },
  "tutor_responses": {
    "correct": [
      "¡Excelente análisis! Mensaje de felicitación específico al concepto",
      "¡Muy bien fundamentado! Segundo mensaje de felicitación específico",
      "¡Correcto! Demuestras comprensión profunda del concepto"
    ],
    "encouragement": [
      "Tu razonamiento va en buena dirección, profundiza el análisis",
      "Vas bien, considera otros aspectos del concepto"
    ],
    "incorrect_attempt_1": [
      "Considera cómo [elemento clave] influye en [concepto]",
      "Analiza la relación entre [factor1] y [factor2] en este contexto"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [concepto] implica [elemento fundamental]",
      "Piensa en las implicaciones de [factor] para [resultado]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: pista que invite al análisis crítico",
      "Hint 2: conexión conceptual más específica",
      "Hint 3: orientación clara hacia la respuesta correcta"
    ],
    "expected_time": 90,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "Pregunta reflexiva 1 que promueva pensamiento crítico",
      "Pregunta reflexiva 2 que conecte con debates contemporáneos"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "high"
  },
  "explanation": "Explicación detallada con análisis crítico, contexto histórico-social y conexiones conceptuales (200-300 palabras)"
}`;

  } else if (stepType === 'keywords') {
    prompt += `
TAREA: Crea una pregunta abierta que requiera reflexión analítica profunda.

Para estudiantes de grado ${grade}, la pregunta debe:
- Promover argumentación compleja y pensamiento crítico avanzado
- Permitir expresión de ideas abstractas y análisis multidimensional
- Requerir síntesis de conceptos y perspectivas diversas
- Abordar el ${dimension === 'metacognition' ? 'aprendizaje metacognitivo y reflexión sobre procesos de pensamiento' : 'concepto central con profundidad analítica'}

FORMATO JSON REQUERIDO:
{
  "type": "keywords",
  "question": "Pregunta reflexiva y analítica que invite a argumentar y explicar con profundidad (máx 200 caracteres)",
  "context": "Explicación contextual profunda del concepto (2-4 oraciones) para tarjeta conceptual, con rigor académico",
  "keywords": ["palabra1", "palabra2", "palabra3", ...],
  "min_keywords": calculado_automáticamente,
  "sample_answer": "Respuesta modelo de 200-250 palabras que demuestre análisis crítico y use naturalmente las keywords",
  "tutor_responses": {
    "correct": [
      "¡Excelente análisis! Tu argumentación es sólida",
      "¡Muy bien fundamentado! Demuestras pensamiento crítico avanzado",
      "¡Correcto! Tu síntesis conceptual es profunda"
    ],
    "encouragement": [
      "Tu razonamiento es interesante, profundiza algunos aspectos",
      "Vas por buen camino, desarrolla más tu argumentación"
    ],
    "incorrect_attempt_1": [
      "Considera cómo [concepto1] se relaciona con [concepto2]",
      "Analiza las implicaciones de [factor] en [contexto]"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [concepto] implica [elementos fundamentales]",
      "Reflexiona sobre la interacción entre [factor1] y [factor2]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona dimensiones clave del análisis",
      "Hint 2: conecta conceptos y proporciona ejemplo",
      "Hint 3: estructura de argumentación esperada"
    ],
    "expected_time": 180,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Cómo se relaciona esto con procesos históricos o contemporáneos?",
      "¿Qué implicaciones tiene este concepto en la realidad actual?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "high"
  }
}

IMPORTANTE sobre keywords:
- Incluye 20-28 keywords relevantes (conceptos, procesos, términos analíticos)
- Incluye sinónimos, variaciones y términos relacionados
- Incluye vocabulario académico apropiado para nivel avanzado
- Usa palabras que naturalmente aparecerían en un análisis crítico bien fundamentado
- NO incluyas palabras demasiado específicas o jerga excesivamente técnica
- NO uses min_keywords (se calculará automáticamente: ${dimension === 'concept_formation' ? '40%' : '35%'} de keywords)`;

  } else if (stepType === 'multiple_select') {
    prompt += `
TAREA: Crea una pregunta de selección múltiple (6 opciones, 3 correctas).

Para estudiantes de grado ${grade}, las opciones deben:
- Presentar casos complejos que requieran análisis crítico y aplicación de conceptos
- Incluir contextos históricos, contemporáneos o escenarios hipotéticos realistas
- Mezclar correctas e incorrectas de forma sofisticada y no obvia
- Promover discriminación conceptual y pensamiento analítico

FORMATO JSON REQUERIDO:
{
  "type": "multiple_select",
  "question": "Pregunta que pida identificar múltiples elementos correctos con criterio analítico (máx 200 caracteres)",
  "context": "Explicación contextual profunda del concepto (2-4 oraciones) para tarjeta conceptual, con rigor académico",
  "options": [
    "Opción 1 (correcta - caso o ejemplo válido con fundamento)",
    "Opción 2 (incorrecta - distractor sofisticado)",
    "Opción 3 (correcta - caso o ejemplo válido con fundamento)",
    "Opción 4 (incorrecta - distractor sofisticado)",
    "Opción 5 (correcta - caso o ejemplo válido con fundamento)",
    "Opción 6 (incorrecta - distractor sofisticado)"
  ],
  "correct_options": [0, 2, 4],
  "tutor_responses": {
    "correct": [
      "¡Excelente discriminación conceptual! Identificaste todos los casos válidos",
      "¡Muy bien! Tu análisis crítico es preciso",
      "¡Correcto! Demuestras comprensión profunda de los criterios"
    ],
    "encouragement": [
      "Algunos elementos están correctos, profundiza tu análisis",
      "Vas bien, revisa algunos casos con más detalle"
    ],
    "incorrect_attempt_1": [
      "Considera qué características fundamentales definen [concepto]",
      "Analiza qué casos cumplen con [criterio específico]"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [concepto] implica [elementos característicos]",
      "Reflexiona sobre qué elementos comparten [propiedad fundamental]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona criterios clave de identificación",
      "Hint 2: proporciona ejemplo de caso válido",
      "Hint 3: descarta opciones incorrectas con justificación"
    ],
    "expected_time": 120,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Qué criterios analíticos usaste para discriminar?",
      "¿Por qué los casos incorrectos no califican?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "high"
  },
  "explanation": "Explicación analítica de por qué cada opción correcta es válida, con fundamentación teórica y contextual (200-300 palabras)"
}`;

  } else if (stepType === 'matching') {
    prompt += `
TAREA: Crea una pregunta de emparejar (4 pares, relación 1:1 exacta).

Para estudiantes de grado ${grade}, los elementos deben:
- Ser conceptos, teorías o ejemplos de nivel avanzado
- Tener relaciones complejas pero lógicas
- Promover comprensión profunda de conexiones conceptuales
- Requerir discriminación analítica y comprensión de matices

FORMATO JSON REQUERIDO:
{
  "type": "matching",
  "question": "Pregunta que pida relacionar elementos conceptuales (máx 150 caracteres)",
  "context": "Explicación contextual profunda del concepto (2-4 oraciones) para tarjeta conceptual, con rigor académico",
  "left_items": [
    "Elemento izquierdo 1 (concepto/teoría/ejemplo)",
    "Elemento izquierdo 2 (concepto/teoría/ejemplo)",
    "Elemento izquierdo 3 (concepto/teoría/ejemplo)",
    "Elemento izquierdo 4 (concepto/teoría/ejemplo)"
  ],
  "right_items": [
    "Elemento derecho 1 (correspondencia lógica)",
    "Elemento derecho 2 (correspondencia lógica)",
    "Elemento derecho 3 (correspondencia lógica)",
    "Elemento derecho 4 (correspondencia lógica)"
  ],
  "correct_pairs": [[0, 0], [1, 1], [2, 2], [3, 3]],
  "tutor_responses": {
    "correct": [
      "¡Excelente! Identificaste correctamente todas las relaciones conceptuales",
      "¡Muy bien! Tu comprensión de las conexiones es profunda",
      "¡Correcto! Demuestras dominio de las relaciones entre conceptos"
    ],
    "encouragement": [
      "Algunas relaciones están correctas, continúa analizando",
      "Vas bien, revisa algunas conexiones conceptuales"
    ],
    "incorrect_attempt_1": [
      "Analiza qué característica fundamental conecta cada par",
      "Considera la relación teórica entre [concepto1] y [concepto2]"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [elemento izquierdo] se fundamenta en [principio/característica]",
      "Reflexiona sobre qué elementos comparten [propiedad teórica]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona tipo de relación conceptual a identificar",
      "Hint 2: proporciona ejemplo de un par correcto con justificación",
      "Hint 3: explica lógica de emparejamiento conceptual"
    ],
    "expected_time": 120,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Qué criterio teórico usaste para emparejar?",
      "¿Cómo se relacionan estos conceptos en marcos teóricos más amplios?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "high"
  },
  "explanation": "Explicación analítica de cada par correcto, su relación conceptual y relevancia (200-250 palabras)"
}

CRÍTICO: Los índices en correct_pairs deben crear una relación 1:1. Cada índice de left_items aparece una sola vez en la primera posición, y cada índice de right_items aparece una sola vez en la segunda posición.`;

  } else if (stepType === 'ordering') {
    prompt += `
TAREA: Crea una pregunta de ordenar secuencia (5 elementos).

Para estudiantes de grado ${grade}, los elementos deben:
- Representar proceso histórico, evolución conceptual o jerarquía analítica
- Ser suficientemente complejos para requerir comprensión profunda
- Tener un orden lógico claro pero que requiera análisis crítico
- Promover comprensión de causalidad y procesos sociales

FORMATO JSON REQUERIDO:
{
  "type": "ordering",
  "question": "Pregunta que pida ordenar elementos según criterio específico (histórico, lógico, causal) (máx 150 caracteres)",
  "context": "Explicación contextual profunda del concepto (2-4 oraciones) para tarjeta conceptual, con rigor académico",
  "items": [
    "Elemento 1 (en orden correcto)",
    "Elemento 2 (en orden correcto)",
    "Elemento 3 (en orden correcto)",
    "Elemento 4 (en orden correcto)",
    "Elemento 5 (en orden correcto)"
  ],
  "correct_order": [0, 1, 2, 3, 4],
  "tutor_responses": {
    "correct": [
      "¡Perfecto! Ordenaste correctamente la secuencia lógica",
      "¡Excelente! Comprendes el proceso histórico/causal",
      "¡Muy bien! Tu análisis secuencial es riguroso"
    ],
    "encouragement": [
      "Algunos elementos están en posición correcta, continúa analizando",
      "Vas bien, revisa la lógica de algunos elementos"
    ],
    "incorrect_attempt_1": [
      "Considera qué criterio ordena la secuencia (cronológico, lógico, causal)",
      "Analiza qué elemento es causa y cuál es consecuencia"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [proceso] sigue esta lógica: [pista conceptual]",
      "Reflexiona sobre la relación causal entre [elemento1] y [elemento2]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona criterio de ordenamiento (cronológico/lógico/causal)",
      "Hint 2: identifica primer/último elemento con justificación",
      "Hint 3: explica secuencia lógica completa"
    ],
    "expected_time": 90,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Qué criterio analítico usaste para ordenar?",
      "¿Cómo se relaciona este orden con procesos históricos o teóricos?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "high"
  },
  "explanation": "Explicación detallada del orden correcto, su lógica y relevancia conceptual (150-250 palabras)"
}`;
  }

  prompt += `

IMPORTANTE:
- Usa lenguaje académico apropiado para jóvenes de 15-17 años
- Promueve pensamiento crítico avanzado y análisis social profundo
- Aborda temas complejos con rigor académico
- Sé preciso, educativamente riguroso y conceptualmente sólido
- Responde SOLO con el JSON, sin texto adicional`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en pedagogía avanzada de Ciencias Sociales. Respondes únicamente con JSON válido, sin comentarios ni texto adicional.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });

  const content = response.choices[0].message.content.trim();
  let enrichedContent;

  try {
    // Limpiar posibles markdown
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    enrichedContent = JSON.parse(jsonContent);
  } catch (parseError) {
    console.error('Error parseando JSON:', content);
    throw new Error('Respuesta de OpenAI no es JSON válido');
  }

  // Calcular min_keywords si es tipo keywords (40% para concept_formation/step3, 35% para metacognition/step8)
  if (stepType === 'keywords' && enrichedContent.keywords) {
    const percentage = step.step_order === 3 ? 0.40 : 0.35;
    enrichedContent.min_keywords = Math.max(1, Math.floor(enrichedContent.keywords.length * percentage));
    console.log(`   Keywords: ${enrichedContent.keywords.length} total, min=${enrichedContent.min_keywords} (${Math.round(percentage*100)}%)`);
  }

  // Validar estructura
  if (enrichedContent.type !== stepType) {
    throw new Error(`Tipo incorrecto: esperado ${stepType}, recibido ${enrichedContent.type}`);
  }

  console.log(`   ✓ Pregunta: ${enrichedContent.question.substring(0, 80)}...`);
  
  return enrichedContent;
}

enrichModule()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
