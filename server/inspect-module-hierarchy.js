/**
 * Verificar estructura de la tabla modules y campos disponibles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectModuleStructure() {
  console.log('🔍 INSPECCIONANDO ESTRUCTURA DE MODULES\n');
  console.log('='.repeat(80));

  // Obtener un módulo de ejemplo para ver todos los campos
  const { data: module, error } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('*')
    .eq('id', '604231bc-8ce4-45e7-932d-745d821dfeaa')
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📋 CAMPOS DISPONIBLES EN TABLA MODULES:\n');
  Object.keys(module).forEach(field => {
    const value = module[field];
    const type = typeof value;
    const preview = type === 'string' && value.length > 50 
      ? value.substring(0, 50) + '...' 
      : value;
    
    console.log(`  ${field.padEnd(25)} | ${type.padEnd(10)} | ${preview}`);
  });

  console.log('\n\n🔍 CAMPOS RELACIONADOS CON JERARQUÍA:\n');
  
  const hierarchyFields = [
    'subject',           // MATERIA
    'discipline',        // DISCIPLINA?
    'section',          // SECCIÓN?
    'unit',             // UNIDAD?
    'theme',            // TEMA?
    'topic',            // TÓPICO?
    'source_unit_id',   // ID de unidad fuente
    'grade_range',      // Rango de grado
    'core_concept'      // Concepto central
  ];

  hierarchyFields.forEach(field => {
    if (field in module) {
      console.log(`  ✅ ${field}: ${module[field] || '(null)'}`);
    } else {
      console.log(`  ❌ ${field}: NO EXISTE`);
    }
  });

  // Verificar si hay tabla de unidades o disciplinas
  console.log('\n\n🔍 VERIFICANDO TABLAS RELACIONADAS:\n');
  
  const tables = [
    'units',
    'themes',
    'disciplines',
    'sections',
    'topics',
    'competency_units'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .schema('kuneo')
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`  ❌ ${table}: NO EXISTE (${error.message})`);
    } else {
      console.log(`  ✅ ${table}: EXISTE (${data ? data.length : 0} registros en muestra)`);
    }
  }

  // Ver la estructura del source_unit_id
  console.log('\n\n🔍 ANALIZANDO SOURCE_UNIT_ID:\n');
  console.log(`  source_unit_id: ${module.source_unit_id}`);
  
  if (module.source_unit_id) {
    // Intentar obtener más contexto del source_unit_id
    const { data: sourceUnits } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('source_unit_id, subject, title, grade_range')
      .eq('subject', module.subject)
      .not('source_unit_id', 'is', null)
      .limit(10);

    console.log('\n  Ejemplos de source_unit_id en misma materia:');
    sourceUnits?.forEach(m => {
      console.log(`    ${m.source_unit_id} → ${m.title.substring(0, 50)}`);
    });
  }
}

inspectModuleStructure()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
