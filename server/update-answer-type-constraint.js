require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function updateAnswerTypeConstraint() {
  console.log('🔧 Actualizando constraint de answer_type en student_step_attempts...\n');

  // Primero, eliminar el constraint existente
  const dropConstraint = `
    ALTER TABLE kuneo.student_step_attempts 
    DROP CONSTRAINT IF EXISTS student_step_attempts_answer_type_check;
  `;

  // Luego, crear el nuevo constraint con los tipos adicionales
  const addConstraint = `
    ALTER TABLE kuneo.student_step_attempts 
    ADD CONSTRAINT student_step_attempts_answer_type_check 
    CHECK (answer_type IN (
      'option', 
      'text', 
      'numeric', 
      'keywords',
      'multiple_select',
      'matching',
      'ordering'
    ));
  `;

  try {
    console.log('📝 Eliminando constraint antiguo...');
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: dropConstraint 
    });

    if (dropError) {
      // Si no existe la función, ejecutar directamente con query
      console.log('⚠️ Intentando con query directa...');
      const { error: dropError2 } = await supabase.from('student_step_attempts').select('count').limit(0);
      // No podemos ejecutar DDL directamente, necesitamos hacerlo via SQL
      console.log('❌ No se puede ejecutar DDL desde el cliente.');
      console.log('\n📋 Por favor ejecuta estos comandos SQL manualmente en Supabase:');
      console.log('\n' + dropConstraint);
      console.log('\n' + addConstraint);
      return;
    }

    console.log('✅ Constraint antiguo eliminado');
    console.log('📝 Creando nuevo constraint con tipos adicionales...');
    
    const { error: addError } = await supabase.rpc('exec_sql', { 
      sql: addConstraint 
    });

    if (addError) {
      console.error('❌ Error creando constraint:', addError);
      return;
    }

    console.log('✅ Constraint actualizado exitosamente!');
    console.log('\n✨ Ahora answer_type acepta:');
    console.log('   • option');
    console.log('   • text');
    console.log('   • numeric');
    console.log('   • keywords');
    console.log('   • multiple_select ← NUEVO');
    console.log('   • matching ← NUEVO');
    console.log('   • ordering ← NUEVO');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 Ejecuta estos comandos SQL manualmente en Supabase SQL Editor:');
    console.log('\n' + dropConstraint);
    console.log('\n' + addConstraint);
  }
}

updateAnswerTypeConstraint();
