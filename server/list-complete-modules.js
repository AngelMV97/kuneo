require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function findCompleteModules() {
  try {
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, difficulty')
      .eq('subject', 'social_studies')
      .eq('is_active', true);

    if (error) throw error;

    const complete = [];

    for (const module of modules) {
      const { data: steps } = await supabase
        .from('module_steps')
        .select('id, enriched_content')
        .eq('module_id', module.id);

      if (steps && steps.length > 0) {
        const enriched = steps.filter(s => s.enriched_content !== null).length;
        if (enriched === steps.length) {
          complete.push({ ...module, stepCount: steps.length });
        }
      }
    }

    console.log(`\n✅ Módulos 100% completos: ${complete.length}\n`);
    complete.slice(0, 10).forEach((m, i) => {
      console.log(`${i + 1}. ${m.id} (${m.stepCount} steps, dif ${m.difficulty})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findCompleteModules();
