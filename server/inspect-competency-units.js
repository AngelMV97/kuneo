/**
 * Inspeccionar tabla competency_units para entender la jerarquía
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectCompetencyUnits() {
  console.log('🔍 INSPECCIONANDO TABLA COMPETENCY_UNITS\n');
  console.log('='.repeat(80));

  // Obtener la competency_unit del módulo 604231bc
  const moduleSourceId = '05957e3e-c9da-42a2-b559-53a3082f236b';

  const { data: unit, error } = await supabase
    .schema('kuneo')
    .from('competency_units')
    .select('*')
    .eq('id', moduleSourceId)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📋 CAMPOS EN COMPETENCY_UNITS:\n');
  Object.keys(unit).forEach(field => {
    const value = unit[field];
    const type = typeof value;
    const preview = type === 'string' && value.length > 80 
      ? value.substring(0, 80) + '...' 
      : value;
    
    console.log(`  ${field.padEnd(25)} | ${type.padEnd(10)} | ${preview}`);
  });

  // Obtener varias competency_units de Ciencias Sociales
  console.log('\n\n🔍 MUESTRAS DE COMPETENCY_UNITS EN CIENCIAS SOCIALES:\n');

  const { data: units, error: unitsError } = await supabase
    .schema('kuneo')
    .from('competency_units')
    .select('id, subject, grade_min, grade_max, title, discipline, theme, topic')
    .eq('subject', 'social_studies')
    .limit(20);

  if (unitsError) {
    console.error('❌ Error:', unitsError.message);
  } else {
    console.log(`Total unidades encontradas: ${units.length}\n`);
    
    units.forEach((u, i) => {
      console.log(`${i + 1}. ${u.id.substring(0, 8)}`);
      console.log(`   Title: ${u.title?.substring(0, 60) || '(sin título)'}`);
      console.log(`   Grados: ${u.grade_min}-${u.grade_max}`);
      console.log(`   Discipline: ${u.discipline || '(null)'}`);
      console.log(`   Theme: ${u.theme || '(null)'}`);
      console.log(`   Topic: ${u.topic || '(null)'}`);
      console.log();
    });
  }

  // Contar módulos por competency_unit
  console.log('\n🔍 MÓDULOS POR COMPETENCY_UNIT:\n');
  
  const { data: moduleCounts } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('source_unit_id')
    .eq('subject', 'social_studies')
    .not('source_unit_id', 'is', null);

  const counts = {};
  moduleCounts?.forEach(m => {
    counts[m.source_unit_id] = (counts[m.source_unit_id] || 0) + 1;
  });

  console.log(`  Competency Units únicas: ${Object.keys(counts).length}`);
  console.log(`  Total de módulos: ${moduleCounts?.length || 0}`);
  console.log(`  Promedio módulos por unit: ${Math.round(moduleCounts.length / Object.keys(counts).length)}`);

  // Mostrar distribución
  const distribution = Object.values(counts).sort((a, b) => b - a).slice(0, 10);
  console.log(`\n  Top 10 units por cantidad de módulos:`);
  distribution.forEach((count, i) => {
    console.log(`    ${i + 1}. ${count} módulos`);
  });
}

inspectCompetencyUnits()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
