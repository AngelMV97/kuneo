#!/usr/bin/env python3
"""
Script: enrich_concept_cards.py
Purpose: Enrich concept_cards with refined content, variants, error patterns, and adaptive usage rules
Created: 2026-05-15

This script enriches concept_cards WITHOUT changing their curricular identity.
It preserves: concept_key, subject, grade_range, taxonomy_ids, visual_template_key, source_module_ids

It generates:
- Refined content (improved definitions, insights, examples)
- Card variants (basic, hint, corrective, reflective, deepening)
- Error patterns (misconceptions, diagnostic clues, corrective feedback)
- Adaptive usage rules (when to show, cooldown rules, intervention levels)

Usage:
    python scripts/openai_enrichment/enrich_concept_cards.py --limit 5 --dry-run
    python scripts/openai_enrichment/enrich_concept_cards.py --limit 5 --subject mathematics
    python scripts/openai_enrichment/enrich_concept_cards.py --limit 44
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables from server/.env
from dotenv import load_dotenv
server_env_path = project_root / "server" / ".env"
load_dotenv(server_env_path)

from openai import OpenAI
from supabase import create_client
from jsonschema import validate, ValidationError

# =============================================================================
# CONFIGURATION
# =============================================================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("❌ Missing OPENAI_API_KEY in environment")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment")

client = OpenAI(api_key=OPENAI_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
FOUNDATIONS_DIR = project_root / "pedagogical_foundations"
SCHEMA_PATH = FOUNDATIONS_DIR / "schemas" / "enriched_concept_card.schema.json"

# Subject mapping: CLI Spanish → Database English
SUBJECT_MAPPER = {
    "matematicas": "mathematics",
    "ciencias": "natural_sciences",
    "sociales": "social_studies",
    "lenguaje": "language",
    "ingles": "english"
}

# =============================================================================
# LOAD PEDAGOGICAL FOUNDATIONS
# =============================================================================

def load_json(path: Path) -> Dict:
    """Load JSON file"""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_text(path: Path) -> str:
    """Load text file"""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_foundations() -> Dict:
    """Load all pedagogical foundations"""
    print("📚 Loading pedagogical foundations...")
    
    foundations = {
        "principles": load_json(FOUNDATIONS_DIR / "pedagogical_principles.json"),
        "llm_policy": load_json(FOUNDATIONS_DIR / "llm_enrichment_policy.json"),
        "tuko_policy": load_json(FOUNDATIONS_DIR / "tuko_intervention_policy.json"),
        "feedback_policy": load_json(FOUNDATIONS_DIR / "feedback_policy.json"),
        "reflection_policy": load_json(FOUNDATIONS_DIR / "reflection_policy.json"),
        "socioemotional_policy": load_json(FOUNDATIONS_DIR / "socioemotional_policy.json"),
        "assessment_policy": load_json(FOUNDATIONS_DIR / "assessment_policy.json"),
        "system_pedagogy": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "system_pedagogy.md"),
        "feedback_rules": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "feedback_rules.md"),
        "tuko_voice": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "tuko_voice.md"),
        "metacognition_rules": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "metacognition_rules.md"),
        "safety_and_quality": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "safety_and_quality.md")
    }
    
    print(f"   ✅ Loaded {len(foundations)} foundation files")
    return foundations


# =============================================================================
# SYSTEM PROMPT BUILDER
# =============================================================================

def build_system_prompt(foundations: Dict) -> str:
    """Build system prompt for concept card enrichment"""
    return f"""You are the concept card enrichment engine for Kuneo, an adaptive learning platform.

Your role: Enrich existing concept cards to make them more pedagogically effective.

CRITICAL CONSTRAINTS:
- You must NOT change curriculum identity: concept_key, subject, grade_range, taxonomy_ids, visual_template_key
- You must NOT create new concepts, new subjects, or new grade progressions
- You must NOT invent new curriculum architecture

A concept card follows this rule:
ONE idea, ONE example, ONE visual suggestion

The card must be brief, clear, pedagogical, and useful for Tuko's intervention system.

=== PEDAGOGICAL PRINCIPLES ===
{json.dumps(foundations["principles"], ensure_ascii=False, indent=2)}

=== LLM ENRICHMENT POLICY ===
{json.dumps(foundations["llm_policy"], ensure_ascii=False, indent=2)}

=== TUKO INTERVENTION POLICY ===
{json.dumps(foundations["tuko_policy"], ensure_ascii=False, indent=2)}

=== TUKO VOICE ===
{foundations["tuko_voice"]}

=== FEEDBACK RULES ===
{foundations["feedback_rules"]}

=== METACOGNITION RULES ===
{foundations["metacognition_rules"]}

=== SAFETY AND QUALITY ===
{foundations["safety_and_quality"]}

=== OUTPUT FORMAT ===
- Return ONLY valid JSON
- Follow the structure specified in each task
- Be brief and pedagogical
- Use age-appropriate language
- Be culturally inclusive (Latin American contexts)

Remember: ONE idea, ONE example, ONE visual per card.
"""


# =============================================================================
# OPENAI API CALLS
# =============================================================================

def call_llm(system_prompt: str, payload: Dict, temperature: float = 0.35) -> Dict:
    """Call OpenAI API with retry logic"""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON
        try:
            return json.loads(content)
        except json.JSONDecodeError as je:
            print(f"   ⚠️ JSON decode error: {je}")
            print(f"   📄 Content preview: {content[:500]}...")
            # Try to extract first valid JSON object
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            raise
    
    except Exception as e:
        print(f"   ❌ OpenAI API error: {e}")
        raise


# =============================================================================
# FETCH DATA FROM SUPABASE
# =============================================================================

def fetch_pending_cards(limit: int = 10, subject: Optional[str] = None, grade_range: Optional[str] = None) -> List[Dict]:
    """Fetch pending concept cards from Supabase"""
    print(f"🔍 Fetching pending concept cards (limit={limit})...")
    
    # Build query
    query = supabase.schema("kuneo").table("concept_cards").select("*")
    
    # Filter by enrichment status
    query = query.or_("enrichment_status.is.null,enrichment_status.eq.pending,enrichment_status.eq.failed")
    
    # Apply subject filter if provided
    if subject:
        db_subject = SUBJECT_MAPPER.get(subject, subject)
        query = query.eq("subject", db_subject)
        print(f"   📌 Filtering by subject: {subject} → {db_subject}")
    
    # Apply grade_range filter if provided
    if grade_range:
        query = query.eq("grade_range", grade_range)
        print(f"   📌 Filtering by grade_range: {grade_range}")
    
    # Execute query
    result = query.limit(limit).order("id").execute()
    
    cards = result.data or []
    print(f"   ✅ Found {len(cards)} pending concept cards")
    
    return cards


def fetch_related_modules(card: Dict) -> List[Dict]:
    """Fetch related modules for a concept card"""
    module_ids = card.get("source_module_ids") or []
    
    if not module_ids:
        return []
    
    # Limit to first 10 modules to avoid excessive API calls
    module_ids = module_ids[:10]
    
    result = (
        supabase.schema("kuneo")
        .table("modules")
        .select("id,title,subject,grade_range,difficulty,core_concept,learning_objective,content")
        .in_("id", module_ids)
        .execute()
    )
    
    return result.data or []


def fetch_related_taxonomies(card: Dict) -> List[Dict]:
    """Fetch related taxonomies for a concept card"""
    taxonomy_ids = card.get("taxonomy_ids") or []
    
    if not taxonomy_ids:
        return []
    
    # Limit to first 20 taxonomies
    taxonomy_ids = taxonomy_ids[:20]
    
    result = (
        supabase.schema("kuneo")
        .table("curriculum_taxonomy")
        .select("id,subject,grade_range,discipline,thematic,subthematic,microtopics")
        .in_("id", taxonomy_ids)
        .execute()
    )
    
    return result.data or []


def fetch_visual_template(card: Dict) -> Optional[Dict]:
    """Fetch visual template for a concept card"""
    template_key = card.get("visual_template_key")
    
    if not template_key:
        return None
    
    result = (
        supabase.schema("kuneo")
        .table("visual_templates")
        .select("*")
        .eq("template_key", template_key)
        .limit(1)
        .execute()
    )
    
    return result.data[0] if result.data else None


# =============================================================================
# ENRICHMENT STAGES
# =============================================================================

def stage1_refine_base_card(card: Dict, modules: List[Dict], taxonomies: List[Dict], 
                            visual_template: Optional[Dict], foundations: Dict) -> Dict:
    """
    Stage 1: Refine base card content
    - Improve definition
    - Extract core insight
    - Generate contextualized example
    - Identify main misconception
    - Create visual caption
    """
    print(f"   🔧 Stage 1: Refining base card content...")
    
    payload = {
        "task": "refine_concept_card",
        "card": {
            "id": card["id"],
            "concept_key": card.get("concept_key"),
            "subject": card.get("subject"),
            "grade_range": card.get("grade_range"),
            "difficulty": card.get("difficulty"),
            "definition": card.get("definition"),
            "visual_template_key": card.get("visual_template_key")
        },
        "related_modules": [
            {
                "title": m.get("title"),
                "core_concept": m.get("core_concept"),
                "learning_objective": m.get("learning_objective"),
                "content": str(m.get("content", ""))[:500]  # Limit content to 500 chars
            }
            for m in modules[:5]  # Limit to 5 modules
        ],
        "related_taxonomies": [
            {
                "discipline": t.get("discipline"),
                "thematic": t.get("thematic"),
                "subthematic": t.get("subthematic")
            }
            for t in taxonomies[:10]  # Limit to 10 taxonomies
        ],
        "visual_template": {
            "template_key": visual_template.get("template_key"),
            "template_type": visual_template.get("template_type"),
            "description": visual_template.get("description")
        } if visual_template else None,
        "requirements": {
            "preserve": ["concept_key", "subject", "grade_range", "visual_template_key"],
            "generate": [
                "concept_name",
                "one_line_definition",
                "core_insight",
                "student_friendly_explanation",
                "practical_example",
                "common_misconception",
                "misconception_explanation",
                "hint_prompt",
                "visual_caption"
            ],
            "constraints": {
                "brief": True,
                "one_idea_one_example": True,
                "age_appropriate": True,
                "culturally_inclusive": True,
                "non_judgmental": True
            }
        }
    }
    
    refined = call_llm(build_system_prompt(foundations), payload, temperature=0.35)
    print(f"      ✅ Stage 1 complete")
    
    return refined.get("refined", refined)


def stage2_generate_variants(card: Dict, refined: Dict, foundations: Dict) -> Dict:
    """
    Stage 2: Generate card variants
    - basic: rescue card when stuck
    - hint: guide without revealing answer
    - corrective: address specific misconception
    - reflective: deepen thinking after success
    - deepening (optional): extension for advanced students
    """
    print(f"   🎨 Stage 2: Generating card variants...")
    
    payload = {
        "task": "generate_card_variants",
        "base_card": {
            "concept_key": card.get("concept_key"),
            "subject": card.get("subject"),
            "grade_range": card.get("grade_range"),
            "visual_template_key": card.get("visual_template_key")
        },
        "refined_content": refined,
        "requirements": {
            "generate_variants_as_object_with_keys": {
                "basic": "rescue card when stuck, brief explanation + example",
                "hint": "guide without revealing answer, does_not_reveal_answer=true",
                "corrective": "address misconception non-punitively, name the error",
                "reflective": "deepen thinking after success, metacognitive question",
                "deepening": "connection to other concepts, transfer question (optional)"
            },
            "each_variant_must_include": [
                "title (string)",
                "body (string)",
                "example (string)",
                "tuko_line (string)",
                "when_to_show (ARRAY of strings, NOT a single string)",
                "visual_template_key (string)"
            ],
            "critical_requirement": "when_to_show must ALWAYS be an ARRAY, never a string. Example: ['stuck', 'two_failed_attempts'], NOT 'When student is stuck'",
            "output_format": "Return a JSON object with keys: basic, hint, corrective, reflective, deepening. Each key contains an object with the required fields.",
            "constraints": {
                "max_body_length": 500,
                "max_tuko_line_length": 200,
                "preserve_visual_template_key": True
            }
        }
    }
    
    variants = call_llm(build_system_prompt(foundations), payload, temperature=0.4)
    print(f"      ✅ Stage 2 complete")
    
    return variants.get("variants", variants)


def stage3_generate_error_patterns(card: Dict, refined: Dict, foundations: Dict) -> Dict:
    """
    Stage 3: Generate error patterns
    - Identify likely wrong answers
    - Create diagnostic clues
    - Generate corrective feedback
    - Suggest visual overlays
    """
    print(f"   🔍 Stage 3: Generating error patterns...")
    
    payload = {
        "task": "generate_error_patterns",
        "base_card": {
            "concept_key": card.get("concept_key"),
            "subject": card.get("subject"),
            "grade_range": card.get("grade_range")
        },
        "refined_content": refined,
        "requirements": {
            "generate_array_with_key_patterns": "Return a JSON object with key 'patterns' containing an array of error pattern objects",
            "each_pattern_must_include": [
                "misconception_key",
                "misconception_description",
                "likely_wrong_answers",
                "diagnostic_clue",
                "corrective_feedback",
                "visual_overlay_key",
                "recommended_card_variant (MUST be one of: basic, hint, corrective, reflective, deepening)"
            ],
            "max_patterns": 5,
            "output_format": {
                "patterns": []
            },
            "critical_requirement": "recommended_card_variant must ONLY use these exact values: 'basic', 'hint', 'corrective', 'reflective', 'deepening'. No other values are allowed.",
            "rules": [
                "Focus on common, predictable errors",
                "Corrective feedback must be non-punitive",
                "Diagnostic clues must be actionable",
                "Visual overlays should highlight the error clearly",
                "recommended_card_variant: use 'corrective' for misconceptions, 'hint' for procedural errors, 'basic' for conceptual gaps"
            ]
        }
    }
    
    error_patterns = call_llm(build_system_prompt(foundations), payload, temperature=0.3)
    print(f"      ✅ Stage 3 complete")
    
    return error_patterns


def stage4_generate_adaptive_usage(card: Dict, refined: Dict, foundations: Dict) -> Dict:
    """
    Stage 4: Generate adaptive usage rules
    - Define when to show card
    - Define when NOT to show card
    - Recommend cognitive types
    - Set intervention level
    - Define cooldown rules
    """
    print(f"   ⚙️ Stage 4: Generating adaptive usage rules...")
    
    payload = {
        "task": "generate_adaptive_usage_rules",
        "base_card": {
            "concept_key": card.get("concept_key"),
            "subject": card.get("subject"),
            "grade_range": card.get("grade_range"),
            "difficulty": card.get("difficulty")
        },
        "refined_content": refined,
        "requirements": {
            "generate_fields": {
                "show_when": "array of condition strings",
                "do_not_show_when": "array of condition strings",
                "recommended_cognitive_types": "array of cognitive type strings",
                "recommended_step_types": "array of step type strings",
                "intervention_level": "string (minimal/moderate/intensive/rescue)",
                "cooldown_rules": "object with min_interval_minutes, max_shows_per_session, reset_on_mastery (NOT an array)"
            },
            "critical_requirement": "cooldown_rules must be an OBJECT like {\"min_interval_minutes\": 10, \"max_shows_per_session\": 3}, NOT an array of strings",
            "align_with_tuko_policy": True,
            "rules": [
                "show_when: conditions that trigger card display (array)",
                "do_not_show_when: conditions that prevent card display (array)",
                "recommended_cognitive_types: most useful cognitive contexts (array)",
                "intervention_level: minimal, moderate, intensive, or rescue (string)",
                "cooldown_rules: object with min_interval_minutes, max_shows_per_session, reset_on_mastery"
            ]
        }
    }
    
    adaptive_usage = call_llm(build_system_prompt(foundations), payload, temperature=0.25)
    print(f"      ✅ Stage 4 complete")
    
    return adaptive_usage.get("adaptive_usage", adaptive_usage)


# =============================================================================
# VALIDATION
# =============================================================================

def validate_enriched_card(enriched: Dict) -> bool:
    """Validate enriched card against schema"""
    try:
        schema = load_json(SCHEMA_PATH)
        validate(instance=enriched, schema=schema)
        return True
    except ValidationError as e:
        print(f"   ❌ Validation error: {e.message}")
        print(f"      Path: {' -> '.join(str(p) for p in e.path)}")
        print(f"      Enriched keys: {list(enriched.keys())}")
        # Save to file for debugging
        import json
        debug_path = Path("debug_enriched.json")
        with open(debug_path, "w", encoding="utf-8") as f:
            json.dump(enriched, f, ensure_ascii=False, indent=2)
        print(f"      💾 Saved enriched content to {debug_path} for inspection")
        return False
    except Exception as e:
        print(f"   ❌ Validation error: {e}")
        print(f"      Enriched keys: {list(enriched.keys()) if isinstance(enriched, dict) else type(enriched)}")
        return False


# =============================================================================
# SAVE TO SUPABASE
# =============================================================================

def save_enrichment(card_id: int, enriched: Dict):
    """Save enriched card to Supabase"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = (
        supabase.schema("kuneo")
        .table("concept_cards")
        .update({
            "enriched_content": enriched,
            "enrichment_status": "completed",
            "enriched_at": now,
            "enrichment_version": "0.1"
        })
        .eq("id", card_id)
        .execute()
    )
    
    return result


def mark_failed(card_id: int, error: str):
    """Mark card as failed"""
    now = datetime.now(timezone.utc).isoformat()
    
    supabase.schema("kuneo").table("concept_cards").update({
        "enrichment_status": "failed",
        "enriched_content": {
            "error": str(error),
            "failed_at": now
        }
    }).eq("id", card_id).execute()


# =============================================================================
# MAIN ENRICHMENT PIPELINE
# =============================================================================

def enrich_single_card(card: Dict, foundations: Dict, dry_run: bool = False) -> Optional[Dict]:
    """Enrich a single concept card through all stages"""
    card_id = card["id"]
    concept_key = card.get("concept_key", "unknown")
    subject = card.get("subject", "unknown")
    grade_range = card.get("grade_range", "unknown")
    
    print(f"\n🎯 Enriching card: {concept_key} ({subject}, {grade_range})")
    
    try:
        # Fetch related data
        modules = fetch_related_modules(card)
        taxonomies = fetch_related_taxonomies(card)
        visual_template = fetch_visual_template(card)
        
        print(f"   📊 Context: {len(modules)} modules, {len(taxonomies)} taxonomies, visual: {visual_template.get('template_key') if visual_template else 'none'}")
        
        # Stage 1: Refine base card
        refined = stage1_refine_base_card(card, modules, taxonomies, visual_template, foundations)
        
        # Stage 2: Generate variants
        variants = stage2_generate_variants(card, refined, foundations)
        
        # Stage 3: Generate error patterns
        error_patterns = stage3_generate_error_patterns(card, refined, foundations)
        
        # Stage 4: Generate adaptive usage
        adaptive_usage = stage4_generate_adaptive_usage(card, refined, foundations)
        
        # Assemble final enriched content
        enriched = {
            "version": "0.1",
            "source": "openai_enrichment",
            "refined": refined,
            "variants": variants,
            "error_patterns": error_patterns,
            "adaptive_usage": adaptive_usage,
            "metadata": {
                "model": MODEL,
                "enriched_at": datetime.now(timezone.utc).isoformat()
            }
        }
        
        # Validate
        if not validate_enriched_card(enriched):
            raise ValueError("Enriched card failed validation")
        
        # Save to database (unless dry-run)
        if not dry_run:
            save_enrichment(card_id, enriched)
            print(f"   ✅ Saved to database")
        else:
            print(f"   🔍 DRY RUN - not saved to database")
            print(f"   📄 Enriched content preview:")
            print(f"      - Refined concept: {refined.get('concept_name', 'N/A')}")
            print(f"      - Variants: {', '.join(variants.keys() if isinstance(variants, dict) else [])}")
            print(f"      - Error patterns: {len(error_patterns.get('patterns', []))} patterns")
            print(f"      - Intervention level: {adaptive_usage.get('intervention_level', 'N/A')}")
        
        return enriched
    
    except Exception as e:
        print(f"   ❌ Failed to enrich card: {e}")
        if not dry_run:
            mark_failed(card_id, str(e))
        return None


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description="Enrich concept cards with OpenAI")
    parser.add_argument("--limit", type=int, default=5, help="Number of cards to enrich")
    parser.add_argument("--subject", type=str, default=None, help="Filter by subject (matematicas, ciencias, etc.)")
    parser.add_argument("--grade-range", type=str, default=None, help="Filter by grade range (e.g., 4-5)")
    parser.add_argument("--dry-run", action="store_true", help="Run without saving to database")
    
    args = parser.parse_args()
    
    print("=" * 80)
    print("🚀 KUNEO CONCEPT CARD ENRICHMENT")
    print("=" * 80)
    print(f"Model: {MODEL}")
    print(f"Limit: {args.limit}")
    print(f"Subject filter: {args.subject or 'none'}")
    print(f"Grade range filter: {args.grade_range or 'none'}")
    print(f"Dry run: {args.dry_run}")
    print("=" * 80)
    
    # Load foundations
    foundations = load_foundations()
    
    # Fetch pending cards
    cards = fetch_pending_cards(limit=args.limit, subject=args.subject, grade_range=args.grade_range)
    
    if not cards:
        print("\n✅ No pending concept cards found")
        return
    
    # Enrich cards
    success_count = 0
    failed_count = 0
    
    for i, card in enumerate(cards, 1):
        print(f"\n{'=' * 80}")
        print(f"Processing card {i}/{len(cards)}")
        print(f"{'=' * 80}")
        
        result = enrich_single_card(card, foundations, dry_run=args.dry_run)
        
        if result:
            success_count += 1
            print(f"✅ Success: {card.get('concept_key')}")
        else:
            failed_count += 1
            print(f"❌ Failed: {card.get('concept_key')}")
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 ENRICHMENT SUMMARY")
    print("=" * 80)
    print(f"✅ Success: {success_count}/{len(cards)}")
    print(f"❌ Failed: {failed_count}/{len(cards)}")
    
    if args.dry_run:
        print("\n🔍 DRY RUN MODE - No changes were saved to database")
    
    print("=" * 80)


if __name__ == "__main__":
    main()
