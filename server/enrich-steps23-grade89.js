require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODULE_ID = '1cfd46d3-14f3-45f7-b117-6cddadee7821';

async function enrichSteps23() {
  console.log('🔧 Enriqueciendo Steps 2 y 3 del módulo Grade 8-9...\n');

  const { data: module } = await supabase
    .from('modules')
    .select('title, core_concept, learning_objective, grade_range')
    .eq('id', MODULE_ID)
    .single();

  const { data: steps } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', MODULE_ID)
    .in('step_order', [2, 3])
    .order('step_order');

  console.log(`📚 Módulo: ${module.title}`);
  console.log(`🎓 Grado: ${module.grade_range}\n`);

  // Step 2: representation (option)
  const step2 = steps.find(s => s.step_order === 2);
  console.log('📝 Enriqueciendo Step 2 (representation): option\n');

  const enrichedStep2 = await generateOption(module, step2, 'representation');
  
  await supabase
    .from('module_steps')
    .update({ enriched_content: enrichedStep2 })
    .eq('id', step2.id);

  console.log('✅ Step 2 guardado\n');
  await new Promise(r => setTimeout(r, 2000));

  // Step 3: concept_formation (keywords)
  const step3 = steps.find(s => s.step_order === 3);
  console.log('📝 Enriqueciendo Step 3 (concept_formation): keywords\n');

  const enrichedStep3 = await generateKeywords(module, step3, 'concept_formation');
  
  await supabase
    .from('module_steps')
    .update({ enriched_content: enrichedStep3 })
    .eq('id', step3.id);

  console.log('✅ Step 3 guardado\n');

  console.log('='.repeat(80));
  console.log('🎉 Steps 2 y 3 enriquecidos exitosamente');
  console.log('='.repeat(80));
}

async function generateOption(module, step, phase) {
  const prompt = `Eres un experto en diseño pedagógico de Ciencias Sociales para estudiantes de grado 8-9 (14-16 años).

CONTEXTO DEL MÓDULO:
- Título: ${module.title}
- Concepto: ${module.core_concept}
- Objetivo: ${module.learning_objective}

FASE: ${phase} (representación - identificar múltiples formas de representar el concepto "sociedad")

TAREA: Crea una pregunta de opción múltiple (4 opciones, 1 correcta) que evalúe la comprensión sobre cómo representar o visualizar el concepto "sociedad" en el contexto del siglo XIX latinoamericano.

La pregunta debe:
- Evaluar comprensión de cómo se puede representar o analizar una sociedad
- Ser apropiada para adolescentes de 14-16 años
- Promover pensamiento crítico

FORMATO JSON:
{
  "type": "option",
  "question": "Pregunta clara sobre representación de sociedad (máx 200 caracteres)",
  "options": [
    "Opción correcta sobre representación",
    "Distractor plausible",
    "Distractor plausible",
    "Distractor plausible"
  ],
  "correct_options": [0],
  "explanation": "Explicación detallada de 150-250 palabras"
}

Responde SOLO con JSON válido.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Respondes únicamente con JSON válido.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });

  const content = response.choices[0].message.content.trim()
    .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  const result = JSON.parse(content);
  console.log(`   ✓ Pregunta: ${result.question.substring(0, 80)}...`);
  return result;
}

async function generateKeywords(module, step, phase) {
  const prompt = `Eres un experto en diseño pedagógico de Ciencias Sociales para estudiantes de grado 8-9 (14-16 años).

CONTEXTO DEL MÓDULO:
- Título: ${module.title}
- Concepto: ${module.core_concept}
- Objetivo: ${module.learning_objective}

FASE: ${phase} (formación de concepto - explicar con propias palabras qué es "sociedad")

TAREA: Crea una pregunta abierta que pida al estudiante explicar el concepto "sociedad" con sus propias palabras, en el contexto del pensamiento del siglo XIX en América Latina.

La pregunta debe:
- Invitar a reflexión personal y expresión de ideas
- Permitir respuestas variadas y personalizadas
- Evaluar comprensión conceptual profunda

FORMATO JSON:
{
  "type": "keywords",
  "question": "Pregunta reflexiva sobre el concepto (máx 200 caracteres)",
  "keywords": ["palabra1", "palabra2", "palabra3", ...],
  "sample_answer": "Respuesta modelo de 150-200 palabras"
}

IMPORTANTE sobre keywords:
- Incluye 18-25 keywords relevantes (sustantivos, verbos, conceptos)
- Incluye sinónimos y variaciones (ej: "sociedad", "social", "colectivo")
- Palabras que aparecerían naturalmente en una buena respuesta
- NO uses min_keywords (se calcula automáticamente: 35% para Grade 8-9)

Responde SOLO con JSON válido.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Respondes únicamente con JSON válido.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });

  const content = response.choices[0].message.content.trim()
    .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  const result = JSON.parse(content);
  
  // Calcular min_keywords (35% para Grade 8-9)
  result.min_keywords = Math.max(1, Math.floor(result.keywords.length * 0.35));
  
  console.log(`   ✓ Pregunta: ${result.question.substring(0, 80)}...`);
  console.log(`   Keywords: ${result.keywords.length}, min=${result.min_keywords} (35%)`);
  
  return result;
}

enrichSteps23()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
