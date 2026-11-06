/**
 * SCRIPT MAESTRO DE ENRIQUECIMIENTO
 * 
 * Enriquece módulos de Ciencias Sociales respetando la jerarquía:
 * MATERIA → DISCIPLINA (axis) → UNIDAD TEMÁTICA (subaxis) → COMPETENCY_UNIT → MÓDULO → SESIONES (8 steps)
 * 
 * Mapeo 1:1 de cognitive dimensions a steps:
 * 1. exploration → comprensión/intuición
 * 2. representation → representación visual
 * 3. explanation → razonamiento
 * 4. classification → diferenciación conceptual
 * 5. guided_application → aplicación guiada
 * 6. transfer → transferencia
 * 7. error_analysis → detección de misconceptions
 * 8. metacognition → reflexión
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuración de phases y cognitive dimensions
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

// Tipos de preguntas por fase y nivel de grado
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
 * Genera preguntas apropiadas para una fase y grado específicos
 */
function generateQuestions(phase, gradeRange, context, competency) {
  const questionTypes = QUESTION_TYPES[gradeRange]?.[phase] || ['multiple_choice', 'short_answer'];
  const questions = [];
  
  const phaseConfig = COGNITIVE_PHASES.find(p => p.phase === phase);
  const cognitiveAspect = phaseConfig?.cognitiveAspect || phase;

  // Generar 4-6 preguntas progresivas
  const numQuestions = gradeRange === '1-3' ? 4 : gradeRange === '10-11' ? 6 : 5;

  for (let i = 0; i < numQuestions; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    
    questions.push({
      id: uuidv4(),
      type: questionType,
      text: `[${cognitiveAspect}] Pregunta ${i + 1} sobre ${competency.substring(0, 50)}...`,
      difficulty: calculateDifficulty(i, numQuestions),
      cognitive_level: cognitiveAspect,
      points: calculatePoints(questionType, gradeRange),
      metadata: {
        phase: phase,
        progression_level: i + 1,
        total_in_phase: numQuestions
      }
    });
  }

  return questions;
}

function calculateDifficulty(index, total) {
  const progression = (index + 1) / total;
  if (progression <= 0.33) return 'easy';
  if (progression <= 0.66) return 'medium';
  return 'hard';
}

function calculatePoints(questionType, gradeRange) {
  const basePoints = {
    'multiple_choice': 1,
    'true_false': 1,
    'short_answer': 2,
    'essay': 3,
    'problem_solving': 3,
    'research': 4,
    'project': 5
  };

  const gradeMultiplier = {
    '1-3': 1,
    '4-5': 1.2,
    '6': 1.4,
    '7': 1.6,
    '8-9': 1.8,
    '10-11': 2.0
  };

  return Math.round((basePoints[questionType] || 2) * (gradeMultiplier[gradeRange] || 1));
}

/**
 * Enriquece un módulo completo
 */
async function enrichModule(moduleId) {
  console.log(`\n🔄 ENRIQUECIENDO MÓDULO: ${moduleId.substring(0, 8)}...`);
  console.log('='.repeat(80));

  // 1. Obtener información del módulo
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

  console.log(`📦 Módulo: ${module.title}`);
  console.log(`   Materia: ${module.subject}`);
  console.log(`   Grado: ${module.grade_range}`);

  // 2. Obtener competency_unit para jerarquía
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
  console.log(`   MATERIA: ${module.subject}`);
  console.log(`   └─ DISCIPLINA: ${metadata.axis || '(sin axis)'}`);
  console.log(`      └─ UNIDAD TEMÁTICA: ${metadata.subaxis || '(sin subaxis)'}`);
  console.log(`         └─ COMPETENCY: ${competency.substring(0, 60)}`);

  // 3. Verificar si ya existen module_steps
  const { data: existingSteps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('id, step_order')
    .eq('module_id', moduleId)
    .order('step_order');

  if (existingSteps && existingSteps.length > 0) {
    console.log(`\n⚠️  Ya existen ${existingSteps.length} module_steps. Actualizando...`);
    
    // Actualizar steps existentes
    for (const step of existingSteps) {
      await enrichStep(step.id, step.step_order, module, unit, metadata, competency);
    }
  } else {
    console.log(`\n✨ Creando 8 module_steps nuevos...`);
    
    // Crear 8 steps nuevos
    for (let stepNum = 1; stepNum <= 8; stepNum++) {
      const stepId = await createStep(moduleId, stepNum, module, unit, metadata, competency);
      if (stepId) {
        await enrichStep(stepId, stepNum, module, unit, metadata, competency);
      }
    }
  }

  console.log(`\n✅ Módulo ${moduleId.substring(0, 8)}... enriquecido completamente`);
  return { success: true };
}

/**
 * Crea un module_step base
 */
async function createStep(moduleId, stepNumber, module, unit, metadata, competency) {
  const phaseConfig = COGNITIVE_PHASES[stepNumber - 1];
  
  const stepData = {
    id: uuidv4(),
    module_id: moduleId,
    step_order: stepNumber,
    step_type: 'practice',
    phase: phaseConfig.phase,
    cognitive_type: phaseConfig.cognitiveAspect,
    title: `Paso ${stepNumber}: ${phaseConfig.cognitiveAspect}`,
    instruction: phaseConfig.description,
    content: {
      prompt: phaseConfig.description
    },
    expected_response_type: 'multiple_choice',
    estimated_time_seconds: 600,
    difficulty: module.difficulty || 2,
    enrichment_status: 'pending',
    enrichment_version: '1.0',
    success_criteria: {
      min_confidence: 'medium',
      correct_required: true,
      requires_explanation: false
    },
    hint_policy: {
      allow_hint: true,
      hint_level_sequence: ['visual', 'concept_detail', 'full_explanation']
    },
    feedback_policy: {
      adaptive: true,
      immediate: true,
      show_visual: true,
      show_explanation: true
    },
    next_step_logic: {
      if_correct: 'next',
      if_mastered: 'next',
      if_struggling: 'repeat'
    }
  };

  const { data, error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .insert(stepData)
    .select()
    .single();

  if (error) {
    console.error(`  ❌ Error creando step ${stepNumber}: ${error.message}`);
    return null;
  }

  console.log(`  ✅ Step ${stepNumber} creado: ${phaseConfig.phase}`);
  return data.id;
}

/**
 * Enriquece un module_step con preguntas
 */
async function enrichStep(stepId, stepNumber, module, unit, metadata, competency) {
  const phaseConfig = COGNITIVE_PHASES[stepNumber - 1];
  
  // Generar preguntas
  const questions = generateQuestions(
    phaseConfig.phase,
    module.grade_range,
    module.context,
    competency
  );

  // Actualizar step con contenido enriquecido
  const enrichedContent = {
    phase: phaseConfig.phase,
    cognitive_dimension: phaseConfig.cognitiveAspect,
    questions: questions,
    hierarchy: {
      subject: module.subject,
      discipline: metadata.axis || null,
      thematic_unit: metadata.subaxis || null,
      competency: competency,
      module_title: module.title
    },
    metadata: {
      enriched_at: new Date().toISOString(),
      question_count: questions.length,
      total_points: questions.reduce((sum, q) => sum + (q.points || 0), 0)
    }
  };

  const { error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .update({ 
      enriched_content: enrichedContent,
      enrichment_status: 'completed',
      enriched_at: new Date().toISOString()
    })
    .eq('id', stepId);

  if (error) {
    console.error(`  ❌ Error enriqueciendo step ${stepNumber}: ${error.message}`);
    return false;
  }

  console.log(`  ✅ Step ${stepNumber} enriquecido: ${questions.length} preguntas (${phaseConfig.cognitiveAspect})`);
  return true;
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 SCRIPT MAESTRO DE ENRIQUECIMIENTO');
  console.log('='.repeat(80));
  console.log('Arquitectura: MATERIA → DISCIPLINA → UNIDAD TEMÁTICA → COMPETENCY → MÓDULO → SESIONES\n');

  // Módulos a enriquecer (incluyendo 604231bc)
  const moduleIds = [
    '604231bc-8ce4-45e7-932d-745d821dfeaa', // Grado 4-5 (original)
    'e43bb575-a5d6-4bee-bc97-c7895421ae13', // Grado 1-3
    'ac62bde3-ea14-4fcd-82a1-15da56067ab9', // Grado 4-5 (alternativo)
    'd8365a0a-9d61-43dd-ae0d-7d9841e4a52b', // Grado 6
    '2657df4d-0c9a-4c8b-82a7-e1fd1edbf8c1', // Grado 7
    'ff576221-b3b0-42c4-8b8b-81e47baa5555', // Grado 8-9
    '4b319ed1-ed26-4c04-bbae-05d955da24eb'  // Grado 10-11
  ];

  const results = {
    total: moduleIds.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const moduleId of moduleIds) {
    const result = await enrichModule(moduleId);
    
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
      results.errors.push({ moduleId, error: result.error });
    }
  }

  // Resumen final
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESUMEN FINAL\n');
  console.log(`  Total módulos procesados: ${results.total}`);
  console.log(`  ✅ Exitosos: ${results.successful}`);
  console.log(`  ❌ Fallidos: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errores:');
    results.errors.forEach(({ moduleId, error }) => {
      console.log(`  - ${moduleId.substring(0, 8)}: ${error?.message || 'Error desconocido'}`);
    });
  }

  console.log('\n✨ Enriquecimiento completado\n');
}

// Ejecutar
main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ ERROR FATAL:', err);
    process.exit(1);
  });
