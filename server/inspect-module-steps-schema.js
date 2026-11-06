/**
 * Inspeccionar estructura real de module_steps
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log('🔍 INSPECCIONANDO SCHEMA DE MODULE_STEPS\n');

  // Intentar obtener un module_step existente para ver su estructura
  const { data: steps, error } = await supabase
    .schema('kuneo')
    .from('module_steps')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    
    // Si no hay steps, intentar obtener la estructura desde la tabla modules
    console.log('\nNo hay module_steps existentes. Intentando crear uno de prueba...');
    
    const { data: module } = await supabase
      .schema('kuneo')
      .from('modules')
      .select('id')
      .limit(1)
      .single();

    if (module) {
      const testStep = {
        id: 'test-' + Date.now(),
        module_id: module.id,
        step_number: 999,
        type: 'practice',
        phase: 'test',
        title: 'Test Step'
      };

      const { error: insertError } = await supabase
        .schema('kuneo')
        .from('module_steps')
        .insert(testStep);

      if (insertError) {
        console.log('\n❌ Error al crear step de prueba:');
        console.log(insertError.message);
        console.log('\nDetalles:', insertError);
      }
    }
    return;
  }

  if (!steps || steps.length === 0) {
    console.log('❌ No se encontraron module_steps');
    return;
  }

  const step = steps[0];
  
  console.log('📋 CAMPOS DISPONIBLES EN MODULE_STEPS:\n');
  Object.keys(step).forEach(field => {
    const value = step[field];
    const type = typeof value;
    const preview = value === null ? 'null' :
                    type === 'object' ? JSON.stringify(value).substring(0, 60) + '...' :
                    type === 'string' && value.length > 60 ? value.substring(0, 60) + '...' :
                    value;
    
    console.log(`  ${field.padEnd(25)} | ${type.padEnd(10)} | ${preview}`);
  });
}

inspectSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
