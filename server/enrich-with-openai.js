/**
 * ENRIQUECIMIENTO CON OPENAI - Versión Real
 * 
 * Usa OpenAI para generar preguntas educativas auténticas basadas en:
 * - Principios pedagógicos de Kuneo (pedagogical_principles.json)
 * - Jerarquía completa: MATERIA → DISCIPLINA → UNIDAD → COMPETENCIA → MÓDULO → SESIÓN
 * - Progresión cognitiva de 8 dimensiones
 * - Contexto real del currículo MEN Colombia
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cargar principios pedagógicos
const pedagogicalPrinciples = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../pedagogical_foundations/pedagogical_principles.json'),
    'utf8'
  )
);

// Mapeo de cognitive dimensions
const COGNITIVE_PHASES = [
  { step: 1, phase: 'exploration', cognitiveAspect: 'comprensión/intuición', description: 'Exploración inicial del concepto' },
  { step: 2, phase: 'representation', cognitiveAspect: 'representación visual', description: 'Representación visual y conceptual' },
  { step: 3, phase: 'explanation', cognitiveAspect: 'razonamiento', description: 'Explicación y razonamiento' },
  { step: 4, phase: 'classification', cognitiveAspect: 'diferenciación conceptual', description: 'Clasificación y diferenciación' },
  { step: 5, phase: 'guided_application', cognitiveAspect: 'aplicación guiada', description: 'Aplicación guiada del conocimiento' },
  { step: 6, phase: 'transfer', cognitiveAspect: 'transferencia', description: 'Transferencia a nuevos contextos' },
  { step: 7, phase: 'error_analysis', cognitiveAspect: 'detección de misconceptions', description: 'Análisis de errores comunes' },
  { step: 8, phase: 'metacognition', cognitiveAspect: 'reflexión', description: 'Reflexión metacognitiva' }
];

// Tipos de preguntas por fase y grado
const QUESTION_TYPES = {
  '1-3': {
    exploration: ['multiple_choice', 'true_false', 'matching'],
    representation: ['draw', 'matching', 'multiple_choice'],
    explanation: ['short_answer', 'multiple_choice'],
    classification: ['sorting', 'matching', 'multiple_choice'],
    guided_application: ['short_answer', 'multiple_choice'],
    transfer: ['multiple_choice', 'short_answer'],
    error_analysis: ['multiple_choice', 'true_false'],
    metacognition: ['short_answer', 'reflection']
  },
  '4-5': {
    exploration: ['multiple_choice', 'short_answer', 'matching'],
    representation: ['diagram', 'matching', 'short_answer'],
    explanation: ['short_answer', 'multiple_choice', 'essay'],
    classification: ['sorting', 'multiple_choice', 'short_answer'],
    guided_application: ['short_answer', 'problem_solving'],
    transfer: ['essay', 'short_answer', 'case_study'],
    error_analysis: ['multiple_choice', 'short_answer'],
    metacognition: ['reflection', 'essay']
  },
  '6': {
    exploration: ['multiple_choice', 'short_answer', 'case_study'],
    representation: ['diagram', 'concept_map', 'short_answer'],
    explanation: ['essay', 'short_answer', 'multiple_choice'],
    classification: ['sorting', 'comparison', 'short_answer'],
    guided_application: ['problem_solving', 'case_study'],
    transfer: ['essay', 'project', 'case_study'],
    error_analysis: ['analysis', 'short_answer'],
    metacognition: ['reflection', 'essay', 'self_assessment']
  },
  '7': {
    exploration: ['multiple_choice', 'short_answer', 'research'],
    representation: ['concept_map', 'diagram', 'infographic'],
    explanation: ['essay', 'debate', 'presentation'],
    classification: ['comparison', 'analysis', 'essay'],
    guided_application: ['project', 'case_study', 'research'],
    transfer: ['essay', 'project', 'debate'],
    error_analysis: ['critical_analysis', 'essay'],
    metacognition: ['reflection', 'portfolio', 'self_assessment']
  },
  '8-9': {
    exploration: ['research', 'analysis', 'multiple_choice'],
    representation: ['infographic', 'concept_map', 'data_visualization'],
    explanation: ['essay', 'presentation', 'debate'],
    classification: ['comparative_analysis', 'essay'],
    guided_application: ['research_project', 'case_study'],
    transfer: ['project', 'research', 'simulation'],
    error_analysis: ['critical_analysis', 'peer_review'],
    metacognition: ['reflection', 'portfolio', 'meta_analysis']
  },
  '10-11': {
    exploration: ['research', 'literature_review', 'analysis'],
    representation: ['academic_poster', 'data_visualization', 'infographic'],
    explanation: ['academic_essay', 'presentation', 'symposium'],
    classification: ['theoretical_analysis', 'comparative_study'],
    guided_application: ['research_project', 'fieldwork'],
    transfer: ['thesis', 'research', 'innovation_project'],
    error_analysis: ['epistemological_analysis', 'peer_review'],
    metacognition: ['academic_reflection', 'research_journal', 'meta_analysis']
  }
};

/**
 * Genera preguntas usando OpenAI con contexto completo
 */
async function generateQuestionsWithAI(phase, gradeRange, module, competency, hierarchy, stepNumber) {
  const phaseConfig = COGNITIVE_PHASES[stepNumber - 1];
  const cognitiveAspect = phaseConfig.cognitiveAspect;
  const questionTypes = QUESTION_TYPES[gradeRange]?.[phase] || ['multiple_choice', 'short_answer'];
  const numQuestions = gradeRange === '1-3' ? 4 : gradeRange === '10-11' ? 6 : 5;

  // Construir prompt basado en principios pedagógicos
  const systemPrompt = `Eres un experto en pedagogía y diseño de contenido educativo para Colombia, especializado en Ciencias Sociales.

PRINCIPIOS PEDAGÓGICOS DE KUNEO que debes seguir:
${pedagogicalPrinciples.principles.map(p => `- ${p.key}: ${p.rule}`).join('\n')}

Tu tarea es generar preguntas educativas auténticas que:
1. Promuevan TRANSFORMACIÓN del pensamiento, no solo recall
2. Tengan CONTEXTO REAL significativo para estudiantes colombianos
3. Permitan diagnosticar MISCONCEPTIONS comunes
4. Incluyan SCAFFOLDING progresivo (hints que guían sin revelar respuesta)
5. Respeten la PROGRESIÓN COGNITIVA (8 dimensiones)

Responde SIEMPRE en formato JSON válido.`;

  const userPrompt = `Genera ${numQuestions} preguntas educativas para este contexto:

📚 JERARQUÍA CURRICULAR:
- Materia: Ciencias Sociales
- Disciplina: ${hierarchy.discipline || 'General'}
- Unidad Temática: ${hierarchy.thematic_unit || 'General'}
- Competencia: ${competency}

🎯 MÓDULO:
- Título: ${module.title}
- Grado: ${gradeRange}
- Objetivo: ${module.learning_objective || 'Desarrollar competencia especificada'}

📝 SESIÓN ACTUAL (Step ${stepNumber}/8):
- Fase cognitiva: ${phase}
- Dimensión: ${cognitiveAspect}
- Propósito: ${phaseConfig.description}
- Tipos de pregunta sugeridos: ${questionTypes.join(', ')}

📋 INSTRUCCIONES:
Genera ${numQuestions} preguntas con PROGRESIÓN DE DIFICULTAD (easy → medium → hard):

Para CADA pregunta, incluye:
1. "text": Pregunta contextualizada para estudiantes colombianos de grado ${gradeRange}
2. "type": Uno de [${questionTypes.join(', ')}]
3. "difficulty": "easy", "medium", o "hard" (progresivo)
4. "expected_answer": Respuesta correcta o criterio de éxito
5. "options": Array de opciones (si es multiple_choice/matching/etc). Incluir distractor plausibles basados en misconceptions
6. "correct_option": Índice de respuesta correcta (si aplica)
7. "misconceptions": Array de 2-3 errores conceptuales comunes que revelaría responder incorrectamente
8. "scaffolding_hints": Array de 2-3 pistas progresivas (menos específico → más específico)
9. "cognitive_level": "${cognitiveAspect}"
10. "points": Puntos según dificultad y grado
11. "estimated_time_seconds": Tiempo realista para responder
12. "real_context": Breve descripción del contexto real colombiano usado

FORMATO JSON EXACTO:
{
  "questions": [
    {
      "id": "<uuid>",
      "text": "Pregunta contextualizada...",
      "type": "multiple_choice",
      "difficulty": "easy",
      "expected_answer": "Respuesta correcta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct_option": 0,
      "misconceptions": ["Error común 1", "Error común 2"],
      "scaffolding_hints": ["Pista general", "Pista más específica", "Pista casi reveladora"],
      "cognitive_level": "${cognitiveAspect}",
      "points": 2,
      "estimated_time_seconds": 90,
      "real_context": "Contexto colombiano relevante"
    }
  ]
}

CRITERIOS DE CALIDAD:
✓ Preguntas deben conectar con VIDA REAL del estudiante (familia, barrio, Colombia)
✓ Distractores basados en MISCONCEPTIONS reales documentadas
✓ Hints deben ser PROGRESIVOS: orientar sin revelar
✓ Lenguaje apropiado para grado ${gradeRange}
✓ Alineado con competencia MEN: ${competency}

Responde SOLO con el JSON, sin texto adicional.`;

  try {
    console.log(`   🤖 Generando con OpenAI (gpt-4o-mini)...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Un poco más creativo para preguntas diversas
      max_tokens: 4000
    });

    const response = JSON.parse(completion.choices[0].message.content);
    
    if (!response.questions || !Array.isArray(response.questions)) {
      throw new Error('OpenAI response missing questions array');
    }

    // Asegurar que cada pregunta tenga ID único
    response.questions.forEach(q => {
      if (!q.id) q.id = uuidv4();
    });

    console.log(`   ✅ ${response.questions.length} preguntas generadas`);
    return response.questions;

  } catch (error) {
    console.error(`   ❌ Error con OpenAI: ${error.message}`);
    throw error;
  }
}

/**
 * Enriquece un step específico con preguntas de OpenAI
 */
async function enrichStep(stepId, stepOrder, module, unit, metadata, competency) {
  const phaseConfig = COGNITIVE_PHASES[stepOrder - 1];
  
  console.log(`\n   📝 Step ${stepOrder}: ${phaseConfig.phase} → ${phaseConfig.cognitiveAspect}`);

  const hierarchy = {
    subject: 'social_studies',
    discipline: metadata.axis || 'general',
    thematic_unit: metadata.subaxis || 'general',
    competency: competency,
    module_title: module.title
  };

  try {
    // Generar preguntas con OpenAI
    const questions = await generateQuestionsWithAI(
      phaseConfig.phase,
      module.grade_range,
      module,
      competency,
      hierarchy,
      stepOrder
    );

    // Construir enriched_content
    const enrichedContent = {
      questions: questions,
      phase: phaseConfig.phase,
      cognitive_dimension: phaseConfig.cognitiveAspect,
      hierarchy: hierarchy,
      generated_at: new Date().toISOString(),
      generation_method: 'openai_gpt4o_mini',
      pedagogical_version: '1.0'
    };

    // Actualizar step en la base de datos
    const { error: updateError } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .update({
        enriched_content: enrichedContent,
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString(),
        enrichment_version: '1.0'
      })
      .eq('id', stepId);

    if (updateError) {
      console.error(`   ❌ Error actualizando step: ${updateError.message}`);
      return false;
    }

    console.log(`   ✅ Step enriquecido con ${questions.length} preguntas`);
    
    // Delay para respetar rate limits de OpenAI
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;

  } catch (error) {
    console.error(`   ❌ Error enriqueciendo step: ${error.message}`);
    return false;
  }
}

/**
 * Enriquece un módulo completo
 */
async function enrichModule(moduleId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔄 ENRIQUECIENDO MÓDULO: ${moduleId.substring(0, 8)}...`);
  console.log('='.repeat(80));

  // 1. Obtener módulo
  const { data: module, error: moduleError } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (moduleError || !module) {
    console.error(`❌ Error obteniendo módulo: ${moduleError?.message}`);
    return { success: false, error: moduleError };
  }

  console.log(`\n📦 Módulo: ${module.title}`);
  console.log(`   Grado: ${module.grade_range} | Materia: ${module.subject}`);

  // 2. Obtener competency_unit
  const { data: unit, error: unitError } = await supabase
    .schema('kuneo')
    .from('competency_units')
    .select('*')
    .eq('id', module.source_unit_id)
    .single();

  if (unitError || !unit) {
    console.error(`❌ Error obteniendo competency_unit: ${unitError?.message}`);
    return { success: false, error: unitError };
  }

  const metadata = unit.content?.metadata || {};
  const competency = unit.content?.competency || 'Competencia no especificada';

  console.log(`\n📊 JERARQUÍA:`);
  console.log(`   DISCIPLINA: ${metadata.axis || '(sin axis)'}`);
  console.log(`   UNIDAD TEMÁTICA: ${metadata.subaxis || '(sin subaxis)'}`);
  console.log(`   COMPETENCY: ${competency.substring(0, 80)}...`);

  // 3. Obtener steps existentes
  const { data: existingSteps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order, enrichment_status')
    .eq('module_id', moduleId)
    .order('step_order');

  if (!existingSteps || existingSteps.length === 0) {
    console.log(`\n❌ No hay module_steps creados. Usa enrich-all-modules.js primero.`);
    return { success: false, error: 'No steps found' };
  }

  console.log(`\n📚 Steps encontrados: ${existingSteps.length}`);

  // 4. Identificar steps sin enriquecer o con placeholders
  const stepsToEnrich = existingSteps.filter(s => 
    !s.enrichment_status || s.enrichment_status !== 'completed'
  );

  if (stepsToEnrich.length === 0) {
    console.log(`\n✅ Todos los steps ya están enriquecidos`);
    return { success: true };
  }

  console.log(`   ⏳ Steps pendientes: ${stepsToEnrich.length}`);
  console.log(`\n🚀 Iniciando enriquecimiento con OpenAI...\n`);

  // 5. Enriquecer cada step
  let successCount = 0;
  let errorCount = 0;

  for (const step of stepsToEnrich) {
    const success = await enrichStep(
      step.id,
      step.step_order,
      module,
      unit,
      metadata,
      competency
    );

    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Enriquecimiento completo:`);
  console.log(`   Éxitos: ${successCount}/${stepsToEnrich.length}`);
  console.log(`   Errores: ${errorCount}/${stepsToEnrich.length}`);
  console.log('='.repeat(80)\n);

  return { 
    success: errorCount === 0, 
    successCount, 
    errorCount 
  };
}

/**
 * Script principal
 */
async function main() {
  console.log('\n🎯 ENRIQUECIMIENTO CON OPENAI - KUNEO');
  console.log('Generando preguntas reales basadas en principios pedagógicos\n');

  // Módulos a enriquecer (7 módulos de ciencias sociales)
  const moduleIds = [
    'e43bb575-a5d6-4bee-bc97-c7895421ae13', // Grado 1-3
    '604231bc-8ce4-45e7-932d-745d821dfeaa', // Grado 4-5 (principal)
    'ac62bde3-ea14-4fcd-82a1-15da56067ab9', // Grado 4-5 (alternativo)
    'd8365a0a-9d61-43dd-ae0d-7d9841e4a52b', // Grado 6
    '2657df4d-0c9a-4c8b-82a7-e1fd1edbf8c1', // Grado 7
    'ff576221-b3b0-42c4-8b8b-81e47baa5555', // Grado 8-9
    '4b319ed1-ed26-4c04-bbae-05d955da24eb'  // Grado 10-11
  ];

  console.log(`📋 Módulos a enriquecer: ${moduleIds.length}\n`);

  let totalSuccess = 0;
  let totalError = 0;

  for (let i = 0; i < moduleIds.length; i++) {
    console.log(`\n[${ i + 1}/${moduleIds.length}] Procesando módulo...`);
    
    const result = await enrichModule(moduleIds[i]);
    
    if (result.success) {
      totalSuccess++;
    } else {
      totalError++;
    }

    // Delay entre módulos
    if (i < moduleIds.length - 1) {
      console.log(`\n⏸️  Esperando 2s antes del siguiente módulo...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 PROCESO COMPLETO`);
  console.log(`   Módulos exitosos: ${totalSuccess}/${moduleIds.length}`);
  console.log(`   Módulos con errores: ${totalError}/${moduleIds.length}`);
  console.log('='.repeat(80)\n);

  process.exit(totalError > 0 ? 1 : 0);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(err => {
    console.error('\n❌ ERROR FATAL:', err);
    process.exit(1);
  });
}

module.exports = { enrichModule, generateQuestionsWithAI };
