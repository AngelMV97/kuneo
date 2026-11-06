/**
 * Simular petición del frontend al endpoint de módulos
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testModulesEndpoint() {
  console.log('🔍 SIMULANDO PETICIÓN DEL FRONTEND\n');

  try {
    // Petición tal como la hace el frontend
    const response = await axios.get(`${API_BASE}/api/modules`, {
      params: {
        subject: 'social_studies',
        grade: 5
      }
    });

    console.log('✅ Respuesta recibida');
    console.log(`📊 Total de módulos devueltos: ${response.data.length}\n`);

    if (response.data.length === 0) {
      console.log('⚠️  No se devolvieron módulos');
      return;
    }

    // Mostrar primeros 5
    console.log('📋 PRIMEROS 5 MÓDULOS:\n');
    response.data.slice(0, 5).forEach((m, i) => {
      console.log(`${i + 1}. ${m.id.substring(0, 8)} | ${m.grade_range} | ${m.title}`);
    });

    // Buscar el módulo 604231bc
    const targetModule = response.data.find(m => m.id.startsWith('604231bc'));
    
    if (targetModule) {
      console.log('\n✅ MÓDULO 604231bc ENCONTRADO EN LA RESPUESTA:');
      console.log('  ID:', targetModule.id);
      console.log('  Grade Range:', targetModule.grade_range);
      console.log('  Title:', targetModule.title);
      console.log('  Posición en lista:', response.data.indexOf(targetModule) + 1);
    } else {
      console.log('\n❌ MÓDULO 604231bc NO ESTÁ EN LA RESPUESTA');
      console.log('   Esto explica por qué no aparece en el frontend');
    }

    // Mostrar cuántos son grade "4-5" vs "5"
    const range45 = response.data.filter(m => m.grade_range === '4-5');
    const grade5 = response.data.filter(m => m.grade_range === '5');
    
    console.log('\n📊 DISTRIBUCIÓN POR GRADE_RANGE:');
    console.log(`  Grade "4-5": ${range45.length} módulos`);
    console.log(`  Grade "5": ${grade5.length} módulos`);

  } catch (error) {
    if (error.response) {
      console.error('❌ Error del servidor:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ No se pudo conectar al servidor');
      console.error('   ¿Está corriendo el backend en http://localhost:3001?');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testModulesEndpoint()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
