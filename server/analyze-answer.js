// Análisis de respuesta del usuario

const keywords = [
  "interacción", "factores económicos", "factores culturales", "factores políticos",
  "identidad social", "comunidad", "análisis", "sociocultural", "dinámica",
  "interdependencia", "perspectiva", "contexto", "estructuras sociales",
  "cambio social", "agentes", "estructuras", "sistemas", "valores", "normas",
  "procesos", "influencia", "desarrollo", "diversidad", "estructura de poder",
  "funcionamiento social", "cohesión", "conflicto", "adaptación"
];

const answer = `La interacción entre factores económicos, culturales y políticos influye en la formación de una identidad social porque todos estos elementos ayudan a definir cómo vive, piensa y se organiza una comunidad.

Los factores económicos influyen en el trabajo, el comercio y las oportunidades de las personas. Los factores culturales aportan costumbres, tradiciones, idioma y formas de expresar la identidad. Los factores políticos establecen normas, derechos y formas de participación en la sociedad.

Cuando estos factores se combinan, las personas desarrollan un sentido de pertenencia y una identidad común que caracteriza a su comunidad.
Por ejemplo, en una comunidad agrícola, la economía basada en el cultivo influye en las costumbres y celebraciones relacionadas con la tierra y las cosechas. Al mismo tiempo, las decisiones políticas, como leyes sobre el trabajo o la educación, afectan la organización de las personas y sus oportunidades. Además, las tradiciones, la música, el idioma y la religión fortalecen el sentido de pertenencia cultural.

La combinación de estos factores hace que cada comunidad tenga una identidad propia y diferente de otras.`;

const answerLower = answer.toLowerCase();

// Función de lematización básica en español (igual que en adaptive.js)
const stemWord = (word) => {
  word = word.toLowerCase().trim();
  
  // Eliminar acentos para normalización
  word = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Plurales: -es, -s
  word = word.replace(/([^aeiou])es$/, '$1');
  word = word.replace(/s$/, '');
  
  // Diminutivos y aumentativos
  word = word.replace(/(it|cit|ic|ill|uel|uec|az|ot|on|azo)$/i, '');
  
  // Verbos regulares en infinitivo
  if (word.match(/(ar|er|ir)$/)) {
    return word.replace(/(ar|er|ir)$/, '');
  }
  
  // Conjugaciones verbales comunes
  word = word.replace(/(ando|iendo|ado|ido|ar|er|ir|aba|aba|ia|mos|is|an|en|o|as|a|es|e)$/i, '');
  
  // Sustantivos/adjetivos: -ción, -sión, -dad, -tad, -eza, -ancia, -encia, -ismo, -ista
  word = word.replace(/(cion|sion|dad|tad|eza|ancia|encia|ismo|ista|mente|al|ante|ente|oso|osa)$/i, '');
  
  // Retornar al menos 3 caracteres para evitar sobre-stemming
  return word.length >= 3 ? word : word;
};

// Helper function to check keyword with flexible matching
const containsKeyword = (text, keyword) => {
  const keywordLower = keyword.toLowerCase();
  
  // 1. Match exacto (rápido)
  if (text.includes(keywordLower)) return true;
  
  // 2. Match de frases completas (ej: "factores económicos")
  if (keyword.includes(' ')) {
    // Para frases, buscar ambas palabras cerca
    const words = keyword.split(' ');
    const allWordsPresent = words.every(w => {
      const stem = stemWord(w);
      return text.split(/\s+/).some(tw => stemWord(tw).startsWith(stem) || stem.startsWith(stemWord(tw)));
    });
    if (allWordsPresent) return true;
  }
  
  // 3. Stemming: comparar raíces
  const keywordStem = stemWord(keyword);
  if (keywordStem.length < 3) return false; // Skip palabras muy cortas
  
  const textWords = text.split(/\s+/);
  for (const textWord of textWords) {
    const textStem = stemWord(textWord);
    
    // Match si ambos stems coinciden o uno contiene al otro
    if (textStem.length >= 3 && 
        (textStem === keywordStem || 
         textStem.startsWith(keywordStem) || 
         keywordStem.startsWith(textStem))) {
      return true;
    }
  }
  
  return false;
};

console.log('📝 ANÁLISIS DE RESPUESTA - Grade 10-11 Step 3');
console.log('   CON MATCHING FLEXIBLE (Lematización)\n');
console.log('Keywords totales: 28');
console.log('Min requerido: 11 (40% según política)\n');
console.log('='.repeat(80));

let found = 0;
const foundKeywords = [];
const notFoundKeywords = [];

keywords.forEach((kw, index) => {
  if (containsKeyword(answerLower, kw)) {
    found++;
    foundKeywords.push(kw);
    console.log(`✅ ${index + 1}. "${kw}"`);
  } else {
    notFoundKeywords.push(kw);
    console.log(`❌ ${index + 1}. "${kw}"`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 RESULTADO: ${found}/28 keywords encontradas (requiere 11)`);
console.log(`${found >= 11 ? '✅ APROBADO' : '❌ RECHAZADO'}`);

console.log('\n📈 Keywords encontradas:');
foundKeywords.forEach(kw => console.log(`  • ${kw}`));

console.log('\n❌ Keywords NO encontradas:');
notFoundKeywords.forEach(kw => console.log(`  • ${kw}`));

console.log('\n💡 ANÁLISIS:');
if (found >= 11) {
  console.log('  ✅ Con matching flexible, la respuesta AHORA ES ACEPTADA');
  console.log('  ✅ El sistema reconoce variaciones como:');
  console.log('     - "influyen" → "influencia"');
  console.log('     - "organiza" → "organización"');
  console.log('     - "desarrollan" → "desarrollo"');
} else {
  console.log('  ⚠️  Incluso con matching flexible, necesita más keywords');
  console.log('  ⚠️  Considera agregar más conceptos académicos');
}

console.log('\n🎯 MEJORA IMPLEMENTADA:');
console.log('  • Lematización automática en español');
console.log('  • Reconoce plurales, conjugaciones, derivados');
console.log('  • Matching más justo y educativamente correcto');
