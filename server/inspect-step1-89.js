require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'kuneo' } }
);

async function inspectStep1Module89() {
  const { data: step1 } = await supabase
    .from('module_steps')
    .select('enriched_content')
    .eq('module_id', '1cfd46d3-14f3-45f7-b117-6cddadee7821')
    .eq('step_order', 1)
    .single();

  console.log('📚 MÓDULO 8-9: Step 1 - Contenido completo\n');
  console.log(JSON.stringify(step1.enriched_content, null, 2));
}

inspectStep1Module89().catch(console.error);
