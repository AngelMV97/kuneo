require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

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
  console.log('🔧 Enriqueciendo módulo Grade 8-9...\n');
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

  // 3. Identificar steps pendientes (sin enriched_content completo)
  const pendingSteps = steps.filter(step => {
    const hasEnriched = step.enriched_content && 
                       Object.keys(step.enriched_content).length > 0;
    return !hasEnriched;
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

  let prompt = `Eres un experto en diseño pedagógico de Ciencias Sociales para estudiantes de ${grade} grado (14-16 años).

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
- Promover pensamiento crítico y análisis social profundo
- Abordar temas complejos de forma apropiada para adolescentes
- Incluir contextos reales y situaciones contemporáneas
- Evitar simplificaciones excesivas

FORMATO JSON REQUERIDO:
{
  "type": "option",
  "question": "Pregunta clara y directa (máx 200 caracteres)",
  "context": "Explicación contextual del concepto (2-3 oraciones) para tarjeta conceptual",
  "options": [
    "Opción A (la correcta, significativa y completa)",
    "Opción B (distractor plausible)",
    "Opción C (distractor plausible)",
    "Opción D (distractor plausible)"
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
        "explanation": "Por qué esta opción es incorrecta y qué malentendido revela",
        "common_among_grade": "${grade}"
      }
    ]
  },
  "tutor_responses": {
    "correct": [
      "¡Exacto! Mensaje de felicitación específico al concepto",
      "¡Muy bien! Segundo mensaje de felicitación específico",
      "¡Correcto! Tercer mensaje de felicitación específico"
    ],
    "encouragement": [
      "Estás en buen camino, sigue analizando",
      "Vas bien, piensa un poco más en el concepto"
    ],
    "incorrect_attempt_1": [
      "Hint corto y específico relacionado al concepto",
      "Pista alternativa para el primer intento"
    ],
    "incorrect_attempt_2": [
      "Hint más detallado para segundo intento",
      "Pista más específica que guíe al concepto"
    ]
  },
  "step_config": {
    "hints": [
      "Hint progresivo 1: pista sutil",
      "Hint progresivo 2: pista más directa",
      "Hint progresivo 3: casi revela la respuesta"
    ],
    "expected_time": 60,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "Pregunta reflexiva 1 sobre el concepto",
      "Pregunta reflexiva 2 que conecte con vida del estudiante"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "medium"
  },
  "explanation": "Explicación detallada de por qué la opción correcta es válida y análisis crítico del concepto (150-250 palabras)"
}`;

  } else if (stepType === 'keywords') {
    prompt += `
TAREA: Crea una pregunta abierta que requiera reflexión escrita.

Para estudiantes de grado ${grade}, la pregunta debe:
- Promover expresión de ideas complejas y argumentación
- Permitir respuestas personalizadas con pensamiento crítico
- Abordar el ${dimension === 'metacognition' ? 'aprendizaje y reflexión sobre el proceso' : 'concepto central'}

FORMATO JSON REQUERIDO:
{
  "type": "keywords",
  "question": "Pregunta reflexiva que invite a explicar con propias palabras (máx 200 caracteres)",
  "context": "Explicación contextual del concepto (2-3 oraciones) para tarjeta conceptual",
  "keywords": ["palabra1", "palabra2", "palabra3", ...],
  "min_keywords": calculado_automáticamente,
  "sample_answer": "Respuesta modelo de 150-200 palabras que use naturalmente las keywords",
  "tutor_responses": {
    "correct": [
      "¡Excelente análisis! Mensaje específico al concepto",
      "¡Muy bien argumentado! Segundo mensaje",
      "¡Correcto! Tercer mensaje"
    ],
    "encouragement": [
      "Vas por buen camino, desarrolla más tu idea",
      "Interesante perspectiva, profundiza un poco más"
    ],
    "incorrect_attempt_1": [
      "Considera estos aspectos del concepto: [pista]",
      "Piensa en cómo [elemento] se relaciona con [concepto]"
    ],
    "incorrect_attempt_2": [
      "Recuerda que el concepto implica [pista más específica]",
      "Analiza la relación entre [elemento1] y [elemento2]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona aspectos clave del concepto",
      "Hint 2: ejemplifica o contextualiza",
      "Hint 3: casi da la estructura de respuesta"
    ],
    "expected_time": 120,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Cómo se relaciona esto con situaciones actuales?",
      "¿Qué ejemplos concretos puedes identificar?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "medium"
  }
}

IMPORTANTE sobre keywords:
- Incluye 18-25 keywords relevantes (sustantivos, verbos, conceptos clave)
- Incluye sinónimos y variaciones (ej: "sociedad", "social", "colectivo")
- Usa palabras que naturalmente aparecerían en una buena respuesta
- NO incluyas palabras demasiado específicas o técnicas
- NO uses min_keywords (se calculará automáticamente: ${dimension === 'concept_formation' ? '35%' : '30%'} de keywords)`;

  } else if (stepType === 'multiple_select') {
    prompt += `
TAREA: Crea una pregunta de selección múltiple (6 opciones, 3 correctas).

Para estudiantes de grado ${grade}, las opciones deben:
- Presentar casos o ejemplos complejos que requieran análisis
- Incluir contextos históricos o contemporáneos reales
- Mezclar correctas e incorrectas de forma no obvia

FORMATO JSON REQUERIDO:
{
  "type": "multiple_select",
  "question": "Pregunta que pida identificar múltiples elementos correctos (máx 200 caracteres)",
  "context": "Explicación contextual del concepto (2-3 oraciones) para tarjeta conceptual",
  "options": [
    "Opción 1 (correcta - ejemplo o caso válido)",
    "Opción 2 (incorrecta - distractor plausible)",
    "Opción 3 (correcta - ejemplo o caso válido)",
    "Opción 4 (incorrecta - distractor plausible)",
    "Opción 5 (correcta - ejemplo o caso válido)",
    "Opción 6 (incorrecta - distractor plausible)"
  ],
  "correct_options": [0, 2, 4],
  "tutor_responses": {
    "correct": [
      "¡Perfecto! Identificaste todos los casos correctos",
      "¡Excelente discriminación conceptual!",
      "¡Muy bien! Tu análisis es preciso"
    ],
    "encouragement": [
      "Algunos elementos están correctos, sigue analizando",
      "Vas bien, revisa algunos casos"
    ],
    "incorrect_attempt_1": [
      "Considera qué características definen [concepto]",
      "Piensa en qué casos cumplen con [criterio]"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [concepto] implica [característica clave]",
      "Analiza qué elementos comparten [propiedad]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona criterio clave de selección",
      "Hint 2: da ejemplo de caso correcto",
      "Hint 3: descarta opciones incorrectas"
    ],
    "expected_time": 90,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Qué tienen en común los casos correctos?",
      "¿Por qué los incorrectos no aplican?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "medium"
  },
  "explanation": "Explicación de por qué cada opción correcta es válida y análisis del concepto (150-250 palabras)"
}`;

  } else if (stepType === 'matching') {
    prompt += `
TAREA: Crea una pregunta de emparejar (4 pares, relación 1:1 exacta).

Para estudiantes de grado ${grade}, los elementos deben:
- Ser conceptos o ejemplos de nivel apropiado
- Tener relaciones claras pero no obvias
- Promover comprensión de conexiones complejas

FORMATO JSON REQUERIDO:
{
  "type": "matching",
  "question": "Pregunta que pida relacionar elementos (máx 150 caracteres)",
  "context": "Explicación contextual del concepto (2-3 oraciones) para tarjeta conceptual",
  "left_items": [
    "Elemento izquierdo 1",
    "Elemento izquierdo 2",
    "Elemento izquierdo 3",
    "Elemento izquierdo 4"
  ],
  "right_items": [
    "Elemento derecho 1",
    "Elemento derecho 2",
    "Elemento derecho 3",
    "Elemento derecho 4"
  ],
  "correct_pairs": [[0, 0], [1, 1], [2, 2], [3, 3]],
  "tutor_responses": {
    "correct": [
      "¡Excelente! Relacionaste correctamente todos los elementos",
      "¡Muy bien! Comprendes las conexiones conceptuales",
      "¡Correcto! Tu análisis de relaciones es preciso"
    ],
    "encouragement": [
      "Algunas relaciones están correctas, sigue intentando",
      "Vas bien, revisa algunas conexiones"
    ],
    "incorrect_attempt_1": [
      "Piensa en qué característica conecta cada par",
      "Considera la relación entre [concepto1] y [concepto2]"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [elemento izquierdo] se relaciona con [característica]",
      "Analiza qué elementos comparten [propiedad común]"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona tipo de relación a buscar",
      "Hint 2: da ejemplo de un par correcto",
      "Hint 3: explica lógica de emparejamiento"
    ],
    "expected_time": 90,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Qué criterio usaste para emparejar?",
      "¿Cómo se relacionan estos conceptos?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "medium"
  },
  "explanation": "Explicación de cada par correcto y su relación conceptual (150-250 palabras)"
}

CRÍTICO: Los índices en correct_pairs deben crear una relación 1:1. Cada índice de left_items aparece una sola vez en la primera posición, y cada índice de right_items aparece una sola vez en la segunda posición.`;

  } else if (stepType === 'ordering') {
    prompt += `
TAREA: Crea una pregunta de ordenar secuencia (5 elementos).

Para estudiantes de grado ${grade}, los elementos deben:
- Representar proceso, cronología o jerarquía relevante
- Ser suficientemente complejos para requerir análisis
- Tener un orden lógico claro pero no trivial

FORMATO JSON REQUERIDO:
{
  "type": "ordering",
  "question": "Pregunta que pida ordenar elementos según criterio específico (máx 150 caracteres)",
  "context": "Explicación contextual del concepto (2-3 oraciones) para tarjeta conceptual",
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
      "¡Perfecto! Ordenaste correctamente la secuencia",
      "¡Excelente! Comprendes el proceso",
      "¡Muy bien! Tu análisis secuencial es correcto"
    ],
    "encouragement": [
      "Algunos elementos están en posición correcta, sigue intentando",
      "Vas bien, revisa el orden de algunos elementos"
    ],
    "incorrect_attempt_1": [
      "Piensa en qué criterio ordena la secuencia (tiempo, lógica, causa-efecto)",
      "Considera qué elemento debe ir primero y por qué"
    ],
    "incorrect_attempt_2": [
      "Recuerda que [proceso] sigue este orden: [pista]",
      "Analiza la relación causal entre elementos"
    ]
  },
  "step_config": {
    "hints": [
      "Hint 1: menciona criterio de ordenamiento",
      "Hint 2: identifica primer/último elemento",
      "Hint 3: explica secuencia lógica"
    ],
    "expected_time": 75,
    "concept_card_key": "concepto_principal_del_step",
    "reflection_prompts": [
      "¿Qué criterio usaste para ordenar?",
      "¿Por qué este orden es lógico?"
    ],
    "visual_template_key": null,
    "difficulty_indicator": "medium"
  },
  "explanation": "Explicación del orden correcto y su lógica (100-200 palabras)"
}`;
  }

  prompt += `

IMPORTANTE:
- Usa lenguaje apropiado para adolescentes de 14-16 años
- Promueve pensamiento crítico y análisis social
- Evita contenido sensible sin contexto pedagógico
- Sé preciso y educativamente riguroso
- Responde SOLO con el JSON, sin texto adicional`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en pedagogía de Ciencias Sociales. Respondes únicamente con JSON válido, sin comentarios ni texto adicional.'
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

  // Calcular min_keywords si es tipo keywords
  if (stepType === 'keywords' && enrichedContent.keywords) {
    const percentage = dimension === 'concept_formation' ? 0.35 : 0.30;
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
