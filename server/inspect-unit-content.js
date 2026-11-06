/**
 * Inspeccionar el contenido JSON de competency_units
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectUnitContent() {
  console.log('🔍 INSPECCIONANDO CONTENT DE COMPETENCY_UNITS\n');
  console.log('='.repeat(80));

  // Obtener la competency_unit del módulo 604231bc
  const moduleSourceId = '05957e3e-c9da-42a2-b559-53a3082f236b';

  const { data: unit, error } = await supabase
    .schema('kuneo')
    .from('competency_units')
    .select('id, type, subject, grade_range, content')
    .eq('id', moduleSourceId)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📦 COMPETENCY_UNIT DEL MÓDULO 604231bc:\n');
  console.log(`  ID: ${unit.id}`);
  console.log(`  Type: ${unit.type}`);
  console.log(`  Subject: ${unit.subject}`);
  console.log(`  Grade Range: ${unit.grade_range}`);
  console.log('\n📄 ESTRUCTURA DEL CAMPO CONTENT:\n');
  console.log(JSON.stringify(unit.content, null, 2));

  // Obtener 5 competency_units más de Ciencias Sociales
  console.log('\n\n🔍 MUESTRAS DE OTROS COMPETENCY_UNITS:\n');

  const { data: units, error: unitsError } = await supabase
    .schema('kuneo')
    .from('competency_units')
    .select('id, subject, grade_range, content')
    .eq('subject', 'social_studies')
    .limit(5);

  if (unitsError) {
    console.error('❌ Error:', unitsError.message);
  } else {
    units.forEach((u, i) => {
      console.log(`\n${i + 1}. ID: ${u.id.substring(0, 13)}... | Grades: ${u.grade_range}`);
      console.log('   Content keys:', Object.keys(u.content || {}).join(', '));
      
      // Mostrar valores relevantes para jerarquía
      const content = u.content || {};
      if (content.discipline) console.log(`   → discipline: ${content.discipline}`);
      if (content.theme) console.log(`   → theme: ${content.theme}`);
      if (content.topic) console.log(`   → topic: ${content.topic}`);
      if (content.unit) console.log(`   → unit: ${content.unit}`);
      if (content.section) console.log(`   → section: ${content.section}`);
      if (content.title) console.log(`   → title: ${content.title?.substring(0, 60)}`);
      if (content.description) console.log(`   → description: ${content.description?.substring(0, 80)}`);
    });
  }

  // Analizar qué keys son comunes en content
  console.log('\n\n🔍 ANÁLISIS DE KEYS EN CONTENT:\n');
  
  const { data: allUnits } = await supabase
    .schema('kuneo')
    .from('competency_units')
    .select('content')
    .eq('subject', 'social_studies')
    .limit(100);

  const keyFrequency = {};
  allUnits?.forEach(u => {
    Object.keys(u.content || {}).forEach(key => {
      keyFrequency[key] = (keyFrequency[key] || 0) + 1;
    });
  });

  const sortedKeys = Object.entries(keyFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log('  Keys más frecuentes en content:');
  sortedKeys.forEach(([key, count]) => {
    console.log(`    ${key.padEnd(30)} → ${count} unidades`);
  });
}

inspectUnitContent()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
