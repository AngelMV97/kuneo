/**
 * Mostrar ejemplo de jerarquía completa de un módulo enriquecido
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showHierarchyExample() {
  const moduleId = '604231bc-8ce4-45e7-932d-745d821dfeaa'; // Módulo 4-5 enriquecido

  console.log('📊 EJEMPLO DE JERARQUÍA COMPLETA\n');
  console.log('='.repeat(80));

  // Obtener módulo
  const { data: module } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  // Obtener competency_unit
  const { data: unit } = await supabase
    .schema('kuneo')
    .from('competency_units')
    .select('*')
    .eq('id', module.source_unit_id)
    .single();

  // Obtener steps
  const { data: steps } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .eq('module_id', moduleId)
    .order('step_order');

  const metadata = unit.content?.metadata || {};
  const competency = unit.content?.competency || '';

  console.log('🎯 ARQUITECTURA PEDAGÓGICA:\n');
  console.log('┌─ NIVEL 1: MATERIA / CURSO');
  console.log(`│  └─ ${module.subject} (Ciencias Sociales)`);
  console.log('│');
  console.log('├─ NIVEL 2: DISCIPLINA / SECCIÓN');
  console.log(`│  └─ ${metadata.axis || '(sin disciplina)'}`);
  console.log('│');
  console.log('├─ NIVEL 3: UNIDAD TEMÁTICA');
  console.log(`│  └─ ${metadata.subaxis || '(sin unidad temática)'}`);
  console.log('│');
  console.log('├─ NIVEL 4: COMPETENCY UNIT');
  console.log(`│  └─ "${competency.substring(0, 70)}${competency.length > 70 ? '...' : ''}"`);
  console.log('│');
  console.log('├─ NIVEL 5: MÓDULO');
  console.log(`│  └─ ${module.title} (Grado ${module.grade_range})`);
  console.log('│');
  console.log('└─ NIVEL 6: SESIONES (8 STEPS con dimensiones cognitivas)');

  console.log('\n\n' + '='.repeat(80));
  console.log('📝 SESIONES ENRIQUECIDAS:\n');

  steps.forEach((step, index) => {
    const enriched = step.enriched_content || {};
    const hierarchy = enriched.hierarchy || {};
    const questions = enriched.questions || [];

    console.log(`\n${index + 1}. SESIÓN ${step.step_order}: ${step.phase.toUpperCase()}`);
    console.log(`   Dimensión Cognitiva: ${enriched.cognitive_dimension || step.cognitive_type}`);
    console.log(`   Título: ${step.title}`);
    console.log(`   Preguntas: ${questions.length}`);
    
    if (questions.length > 0) {
      console.log(`\n   📋 Muestra de preguntas:`);
      questions.slice(0, 2).forEach((q, i) => {
        console.log(`      ${i + 1}. [${q.type}] ${q.text.substring(0, 80)}${q.text.length > 80 ? '...' : ''}`);
        console.log(`         Dificultad: ${q.difficulty} | Puntos: ${q.points} | Nivel: ${q.cognitive_level}`);
      });
      if (questions.length > 2) {
        console.log(`      ... y ${questions.length - 2} preguntas más`);
      }
    }

    console.log(`\n   🏗️  Jerarquía embebida en step:`);
    console.log(`      MATERIA: ${hierarchy.subject || '(faltante)'}`);
    console.log(`      └─ DISCIPLINA: ${hierarchy.discipline || '(faltante)'}`);
    console.log(`         └─ UNIDAD TEMÁTICA: ${hierarchy.thematic_unit || '(faltante)'}`);
    console.log(`            └─ COMPETENCY: ${(hierarchy.competency || '').substring(0, 50)}...`);
    console.log(`               └─ MÓDULO: ${hierarchy.module_title || '(faltante)'}`);
    console.log(`                  └─ SESIÓN: ${step.title}`);
  });

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ VERIFICACIÓN DE ARQUITECTURA:\n');

  const checks = [
    { 
      name: 'MATERIA definida', 
      valid: !!module.subject,
      value: module.subject
    },
    { 
      name: 'DISCIPLINA (axis) definida', 
      valid: !!metadata.axis,
      value: metadata.axis || '(sin axis)'
    },
    { 
      name: 'UNIDAD TEMÁTICA (subaxis) definida', 
      valid: metadata.subaxis !== undefined,
      value: metadata.subaxis || '(null - válido para algunas competencias)'
    },
    { 
      name: 'COMPETENCY_UNIT enlazada', 
      valid: !!module.source_unit_id,
      value: module.source_unit_id
    },
    { 
      name: 'MÓDULO tiene 8 steps', 
      valid: steps.length === 8,
      value: `${steps.length} steps`
    },
    { 
      name: 'Todos los steps enriquecidos', 
      valid: steps.every(s => s.enriched_content?.questions?.length > 0),
      value: `${steps.filter(s => s.enriched_content?.questions?.length > 0).length}/8`
    },
    { 
      name: 'Jerarquía embebida en cada step', 
      valid: steps.every(s => s.enriched_content?.hierarchy),
      value: `${steps.filter(s => s.enriched_content?.hierarchy).length}/8 steps`
    },
    { 
      name: 'Mapeo 1:1 Step → Cognitive Dimension', 
      valid: steps.every(s => s.enriched_content?.cognitive_dimension),
      value: 'Cada step tiene su dimensión cognitiva'
    }
  ];

  checks.forEach(check => {
    const icon = check.valid ? '✅' : '❌';
    console.log(`  ${icon} ${check.name}`);
    console.log(`     └─ ${check.value}`);
  });

  const allValid = checks.every(c => c.valid);
  
  console.log('\n' + '='.repeat(80));
  if (allValid) {
    console.log('🎉 ARQUITECTURA COMPLETA Y VÁLIDA');
    console.log('\n✨ La jerarquía MATERIA → DISCIPLINA → UNIDAD TEMÁTICA → COMPETENCY → MÓDULO → SESIONES');
    console.log('   está correctamente implementada y embebida en cada sesión.\n');
  } else {
    console.log('⚠️  Algunos elementos de la arquitectura podrían mejorarse (revisa arriba)\n');
  }
}

showHierarchyExample()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
