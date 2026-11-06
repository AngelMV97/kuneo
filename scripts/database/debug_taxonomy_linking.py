import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from supabase import create_client
from dotenv import load_dotenv

# Load env
load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
client = create_client(supabase_url, supabase_key)

# Load data
print("Loading modules...")
modules_result = client.schema("kuneo").table("modules").select("id, subject, grade_range, core_concept").limit(10).execute()
modules = modules_result.data

print("Loading taxonomies...")
taxonomies_result = client.schema("kuneo").table("curriculum_taxonomy").select("id, subject, grade_range, discipline, thematic, subthematic").limit(10).execute()
taxonomies = taxonomies_result.data

print(f"\n\nTotal modules loaded: {len(modules)}")
print(f"Total taxonomies loaded: {len(taxonomies)}")

if modules:
    m = modules[0]
    print(f"\nSample module:")
    print(f"  subject: {m['subject']}")
    print(f"  grade_range: {m['grade_range']}")
    print(f"  core_concept: {m['core_concept']}")

if taxonomies:
    t = taxonomies[0]
    print(f"\nSample taxonomy:")
    print(f"  subject: {t['subject']}")
    print(f"  grade_range: {t['grade_range']}")
    print(f"  discipline: {t['discipline']}")
    print(f"  thematic: {t['thematic']}")
    print(f"  subthematic: {t['subthematic']}")
