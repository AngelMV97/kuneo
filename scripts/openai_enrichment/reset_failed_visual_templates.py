"""
Reset failed visual template enrichments to pending status
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables from server/.env
server_env_path = project_root / "server" / ".env"
load_dotenv(server_env_path)

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Update failed templates to pending
result = supabase.schema('kuneo').table('visual_templates').update({
    'enrichment_status': 'pending',
    'enriched_config': None,
    'enriched_at': None
}).eq('enrichment_status', 'failed').execute()

if result.data:
    print(f"✅ Reset {len(result.data)} failed templates to pending:")
    for template in result.data:
        print(f"   - {template['template_key']}")
else:
    print("No failed templates found")
