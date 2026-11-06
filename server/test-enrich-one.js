/**
 * Prueba de enriquecimiento con OpenAI - UN SOLO MÓDULO
 * Para validar calidad antes de procesar todos
 */

const { enrichModule } = require('./enrich-with-openai');

async function test() {
  console.log('🧪 PRUEBA DE ENRIQUECIMIENTO CON OPENAI\n');
  console.log('Módulo: 604231bc-8ce4-45e7-932d-745d821dfeaa (Grado 4-5)\n');
  
  const moduleId = '604231bc-8ce4-45e7-932d-745d821dfeaa';
  
  const result = await enrichModule(moduleId);
  
  if (result.success) {
    console.log('\n✅ PRUEBA EXITOSA');
    console.log('   Ahora puedes revisar las preguntas en el módulo');
    console.log('   Si se ven bien, ejecuta: node enrich-with-openai.js\n');
  } else {
    console.log('\n❌ PRUEBA FALLÓ');
    console.log('   Revisa los logs arriba para ver el error\n');
  }
}

test().catch(err => {
  console.error('\n❌ ERROR:', err);
  process.exit(1);
});
