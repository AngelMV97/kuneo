require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findGoodModule() {
  console.log('🔍 Buscando módulo apropiado para enriquecer...\n');

  // Buscar módulos de social_studies o language con pocos steps (más fácil de enriquecer)
  const { data: modules } = await supabase
    .schema('kuneo')
    .from('modules')
    .select('id, title, subject, core_concept, learning_objective, difficulty, grade_range')
    .in('subject', ['social_studies', 'language'])
    .eq('is_active', true)
    .eq('difficulty', 1)
    .limit(20);

  console.log(`📚 Encontrados ${modules?.length || 0} módulos\n`);

  // Para cada módulo, contar steps
  for (const module of modules.slice(0, 10)) {
    const { count } = await supabase
      .schema('kuneo')
      .from('module_steps')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', module.id);

    if (count > 0 && count <= 5) {
      console.log(`✅ CANDIDATO:`);
      console.log(`  ID: ${module.id}`);
      console.log(`  Materia: ${module.subject}`);
      console.log(`  Título: ${module.title}`);
      console.log(`  Concepto: ${module.core_concept}`);
      console.log(`  Objetivo: ${module.learning_objective}`);
      console.log(`  Grado: ${module.grade_range}`);
      console.log(`  Steps: ${count}`);
      console.log('');
      
      if (count === 3) {
        console.log('🎯 Este es perfecto (3 steps). Usaremos este.\n');
        return module;
      }
    }
  }

  process.exit(0);
}

findGoodModule().catch(console.error);
