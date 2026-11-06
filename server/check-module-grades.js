/**
 * Verificar grade_range de módulos específicos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_IDS = [
  '604231bc-8ce4-45e7-932d-745d821dfeaa', // Módulo nuevo enriquecido
  'ac62bde3-ea14-4fcd-82a1-15da56067ab9', // Aparece para grado 5
  '3d8530a2-0591-45b3-ae62-4a6789e714e1', // Aparece para grado 5
  '6625bab4-b3c9-4d9a-8fc5-65eb1a0a0c6c'  // Aparece para grado 5
];

async function checkModules() {
  console.log('🔍 VERIFICANDO GRADE_RANGE DE MÓDULOS\n');

  for (const moduleId of MODULE_IDS) {
    const { data: module, error } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id, subject, grade_range, difficulty, title, is_active')
      .eq('id', moduleId)
      .single();

    if (error) {
      console.log(`❌ ${moduleId.substring(0, 8)}: Error - ${error.message}`);
      continue;
    }

    if (!module) {
      console.log(`❌ ${moduleId.substring(0, 8)}: No encontrado\n`);
      continue;
    }

    console.log(`📦 ${moduleId.substring(0, 8)}`);
    console.log(`  Subject: ${module.subject}`);
    console.log(`  Grade Range: ${module.grade_range}`);
    console.log(`  Difficulty: ${module.difficulty}`);
    console.log(`  Active: ${module.is_active}`);
    console.log(`  Title: ${module.title}`);
    
    // Verificar si debe aparecer para grado 5
    const gradeRange = module.grade_range;
    let shouldShowForGrade5 = false;
    
    if (!gradeRange.includes('-')) {
      shouldShowForGrade5 = parseInt(gradeRange) === 5;
    } else {
      const [start, end] = gradeRange.split('-').map(Number);
      shouldShowForGrade5 = 5 >= start && 5 <= end;
    }
    
    console.log(`  ¿Debe aparecer para grado 5? ${shouldShowForGrade5 ? '✅ SÍ' : '❌ NO'}`);
    console.log();
  }
  
  // Consultar todos los módulos de Ciencias Sociales para usuario de grado 5
  console.log('\n🔍 TODOS LOS MÓDULOS DE CIENCIAS SOCIALES ACTIVOS:\n');
  
  const { data: allModules, error: allError } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, grade_range, difficulty, title')
    .eq('subject', 'social_studies')
    .eq('is_active', true)
    .order('grade_range');

  if (allError) {
    console.error('❌ Error:', allError.message);
    return;
  }

  // Filtrar para grado 5
  const grade5Modules = allModules.filter(m => {
    const gradeRange = m.grade_range;
    if (!gradeRange.includes('-')) {
      return parseInt(gradeRange) === 5;
    }
    const [start, end] = gradeRange.split('-').map(Number);
    return 5 >= start && 5 <= end;
  });

  console.log(`Total módulos activos: ${allModules.length}`);
  console.log(`Módulos que deben aparecer para grado 5: ${grade5Modules.length}\n`);
  
  grade5Modules.forEach(m => {
    console.log(`  ${m.id.substring(0, 8)} | ${m.grade_range} | ${m.title.substring(0, 60)}`);
  });
}

checkModules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
