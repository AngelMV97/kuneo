require('dotenv').config();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

const TARGET_MODULE_ID = '2f7f46f3-c888-472d-8dd8-71bc174819f9';
const DELAY_MS = 2000;

async function completeModule() {
  console.log('\n========================================');
  console.log('COMPLETAR MÓDULO ESPECÍFICO');
  console.log('========================================\n');
  console.log(`🎯 Módulo: ${TARGET_MODULE_ID}`);
  console.log('📊 Estado actual: 4/8 steps (50%)\n');

  try {
    // Get module info
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', TARGET_MODULE_ID)
      .single();

    if (moduleError) throw moduleError;

    console.log(`📚 Título: "${module.title}"`);
    console.log(`🎓 Grado: ${module.grade_range} | Dificultad: ${module.difficulty}\n`);

    // Get all steps
    const { data: steps, error: stepsError } = await supabase
      .from('module_steps')
      .select('*')
      .eq('module_id', TARGET_MODULE_ID)
      .order('step_order');

    if (stepsError) throw stepsError;

    const pendingSteps = steps.filter(s => s.enriched_content === null);

    console.log(`✅ Steps enriquecidos: ${steps.length - pendingSteps.length}/${steps.length}`);
    console.log(`⏳ Steps pendientes: ${pendingSteps.length}\n`);

    if (pendingSteps.length === 0) {
      console.log('🎉 Módulo ya está 100% completo!\n');
      return;
    }

    console.log('🚀 Iniciando enriquecimiento...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pendingSteps.length; i++) {
      const step = pendingSteps[i];
      
      console.log(`📝 [${i + 1}/${pendingSteps.length}] Step ${step.step_order} - ${step.title || step.step_type}`);

      try {
        const systemPrompt = `Eres un experto en pedagogía y diseño de contenido educativo adaptativo para estudiantes de educación básica (1° a 11° grado).

Tu tarea es enriquecer steps educativos con metadatos cognitivos para un motor de aprendizaje adaptativo.

IMPORTANTE: Responde SIEMPRE en formato JSON válido. Usa el formato { "cognitive_dimension": "...", ... }`;

        const userPrompt = `Analiza este step educativo y genera metadatos cognitivos:

CONTEXTO DEL MÓDULO:
- Materia: ${module.subject}
- Título: ${module.title}
- Grado: ${module.grade_range}
- Dificultad: ${module.difficulty}
- Objetivo: ${module.learning_objective || 'No especificado'}

STEP A ENRIQUECER:
- Tipo: ${step.step_type}
- Orden: ${step.step_order}
- Título: ${step.title || 'Sin título'}
- Instrucción: ${step.instruction || 'No especificada'}
- Contenido base: ${JSON.stringify(step.content)}

Genera un JSON con esta estructura EXACTA:
{
  "cognitive_dimension": "<dimensión cognitiva primaria>",
  "expected_answer": "<respuesta esperada o criterio de éxito>",
  "misconceptions": ["<error común 1>", "<error común 2>"],
  "scaffolding_hints": ["<pista progresiva 1>", "<pista progresiva 2>"],
  "adaptive_difficulty": "<easy|medium|hard>",
  "estimated_time_seconds": <tiempo estimado en segundos>,
  "prerequisites": ["<concepto previo 1>", "<concepto previo 2>"],
  "learning_path_connections": ["<conexión a otro concepto>"]
}

DIMENSIONES COGNITIVAS DISPONIBLES:
- comprension: Entender conceptos básicos
- representacion: Usar múltiples representaciones
- razonamiento: Aplicar lógica y análisis
- transferencia: Aplicar a nuevos contextos
- metacognicion: Reflexionar sobre el aprendizaje

CRITERIOS:
1. cognitive_dimension debe ser UNA de las 5 opciones listadas
2. expected_answer debe ser específico y verificable
3. misconceptions debe tener 1-3 errores comunes que cometen estudiantes
4. scaffolding_hints debe tener 2-3 pistas progresivas (de menor a mayor ayuda)
5. adaptive_difficulty basado en el grado y dificultad del módulo
6. estimated_time_seconds realista para el grado del estudiante
7. prerequisites debe incluir conceptos que el estudiante debe dominar antes
8. learning_path_connections debe conectar con otros temas relacionados

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.5
        });

        const enrichedContent = JSON.parse(completion.choices[0].message.content);

        // Validate structure
        if (!enrichedContent.cognitive_dimension || !enrichedContent.expected_answer) {
          throw new Error('Invalid enriched content structure');
        }

        // Update step (skip enrichment_status due to constraint)
        const { error: updateError } = await supabase
          .from('module_steps')
          .update({
            enriched_content: enrichedContent,
            enriched_at: new Date().toISOString(),
            enrichment_version: '1.0'
          })
          .eq('id', step.id);

        if (updateError) throw updateError;

        successCount++;
        console.log(`   ✅ Dimension: ${enrichedContent.cognitive_dimension} | Difficulty: ${enrichedContent.adaptive_difficulty}`);

        // Delay between requests
        if (i < pendingSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }

      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n========================================');
    console.log('ENRIQUECIMIENTO COMPLETADO');
    console.log('========================================\n');
    console.log(`✅ Exitosos: ${successCount}/${pendingSteps.length}`);
    console.log(`❌ Errores: ${errorCount}/${pendingSteps.length}`);
    console.log(`📊 Tasa de éxito: ${((successCount / pendingSteps.length) * 100).toFixed(1)}%\n`);

    if (successCount === pendingSteps.length) {
      console.log('🎉 MÓDULO 100% COMPLETO!\n');
    } else {
      console.log('⚠️  Algunos steps fallaron. Revisar errores arriba.\n');
    }

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

completeModule();
