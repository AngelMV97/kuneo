/**
 * Debug: verificar qué devuelve la query ANTES del filtro manual por grado
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugQuery() {
  console.log('🔍 SIMULANDO QUERY DEL BACKEND (ANTES DE FILTRAR POR GRADO)\n');

  // Exactamente la misma query que hace el backend
  const limit = 100;
  const offset = 0;
  const subject = 'social_studies';

  let query = supabase
    .schema("kuneo")
    .from("modules")
    .select("id, source_unit_id, subject, grade_range, difficulty, title, learning_objective, core_concept, is_active, order_index")
    .eq("is_active", true)
    .order("order_index", { ascending: true })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (subject) {
    query = query.eq("subject", subject);
  }

  const { data: allModules, error } = await query;

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Query ejecutada`);
  console.log(`📊 Total de módulos devueltos: ${allModules.length}\n`);

  // Contar por grade_range
  const byGrade = {};
  allModules.forEach(m => {
    byGrade[m.grade_range] = (byGrade[m.grade_range] || 0) + 1;
  });

  console.log('📋 DISTRIBUCIÓN POR GRADE_RANGE:');
  Object.entries(byGrade).sort().forEach(([gr, count]) => {
    console.log(`  ${gr}: ${count} módulos`);
  });

  // Ahora filtrar manualmente por grado 5 (como hace el backend)
  console.log('\n🔍 APLICANDO FILTRO MANUAL POR GRADO 5:\n');

  const gradeNum = 5;
  const filtered = allModules.filter(module => {
    const gradeRange = module.grade_range;
    
    if (!gradeRange.includes('-')) {
      return parseInt(gradeRange) === gradeNum;
    }
    
    const [start, end] = gradeRange.split('-').map(Number);
    return gradeNum >= start && gradeNum <= end;
  });

  console.log(`📊 Módulos después del filtro: ${filtered.length}\n`);

  // Verificar si 604231bc está en el resultado
  const target = filtered.find(m => m.id.startsWith('604231bc'));
  if (target) {
    console.log('✅ Módulo 604231bc SÍ está en el resultado filtrado');
  } else {
    console.log('❌ Módulo 604231bc NO está en el resultado filtrado');
    
    // Verificar si estaba en allModules
    const targetInAll = allModules.find(m => m.id.startsWith('604231bc'));
    if (targetInAll) {
      console.log('   Pero SÍ estaba en la query inicial antes del filtro por grado');
      console.log('   Grade range:', targetInAll.grade_range);
    } else {
      console.log('   Y tampoco estaba en la query inicial (antes del filtro)');
      console.log('   Esto significa que no está en los primeros 100 por order_index');
    }
  }

  console.log('\n📋 PRIMEROS 5 MÓDULOS FILTRADOS:');
  filtered.slice(0, 5).forEach((m, i) => {
    console.log(`${i + 1}. ${m.id.substring(0, 8)} | order_index: ${m.order_index} | ${m.grade_range}`);
  });
}

debugQuery()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
