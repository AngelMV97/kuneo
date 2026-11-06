import sys
import os
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# Load env
load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
client = create_client(supabase_url, supabase_key)

# Get all unique subjects from modules
print("Loading all module subjects...")
modules_result = client.schema("kuneo").table("modules").select("subject").execute()
module_subjects = set(d['subject'] for d in modules_result.data)

print(f"\nModule subjects ({len(module_subjects)}):")
for s in sorted(module_subjects):
    print(f"  - {s}")

# Get all unique subjects from taxonomies
print("\nLoading all taxonomy subjects...")
taxonomies_result = client.schema("kuneo").table("curriculum_taxonomy").select("subject").execute()
taxonomy_subjects = set(d['subject'] for d in taxonomies_result.data)

print(f"\nTaxonomy subjects ({len(taxonomy_subjects)}):")
for s in sorted(taxonomy_subjects):
    print(f"  - {s}")

print("\n" + "=" * 60)
print("PROBLEMA IDENTIFICADO:")
print("=" * 60)
print("Los módulos usan nombres en INGLÉS (natural_sciences, mathematics)")
print("Las taxonomías usan nombres en ESPAÑOL (ciencias_naturales, matematicas)")
print("\nSolución: Crear un mapper de subject names en el linker.")
