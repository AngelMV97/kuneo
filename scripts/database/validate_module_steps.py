"""Validación rápida de module_steps"""
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
import os
from collections import Counter

load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Total
response = supabase.schema('kuneo').table('module_steps').select('id', count='exact').execute()
print(f"✅ Total de steps: {response.count}")

# Por tipo cognitivo (con paginación)
all_data = []
start = 0
page_size = 1000

while True:
    response = supabase.schema('kuneo').table('module_steps')\
        .select('cognitive_type')\
        .range(start, start + page_size - 1)\
        .execute()
    
    if not response.data:
        break
    
    all_data.extend(response.data)
    
    if len(response.data) < page_size:
        break
    
    start += page_size

counts = Counter(s['cognitive_type'] for s in all_data)
print(f"\n📊 Por tipo cognitivo ({len(all_data)} registros):")
for k, v in sorted(counts.items()):
    print(f"  {k}: {v}")

# Con vinculaciones
response = supabase.schema('kuneo').table('module_steps')\
    .select('concept_card_id', count='exact')\
    .not_.is_('concept_card_id', 'null')\
    .execute()
steps_with_card = response.count

response = supabase.schema('kuneo').table('module_steps')\
    .select('visual_template_key', count='exact')\
    .not_.is_('visual_template_key', 'null')\
    .execute()
steps_with_visual = response.count

print(f"\n🔗 Vinculación:")
print(f"  Steps con concept_card: {steps_with_card} ({100*steps_with_card/response.count:.1f}%)")
print(f"  Steps con visual_template: {steps_with_visual}")
