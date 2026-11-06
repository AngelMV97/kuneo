"""
OpenAI Enrichment Pipeline for Module Steps
=============================================

Purpose:
- Enrich module_steps with pedagogically sound content using OpenAI
- Apply pedagogical_foundations policies to all generated content
- Multi-stage enrichment: exercise → hints → feedback → cards → visual → metacognition

Architecture:
1. Load pedagogical_foundations (policies, prompt blocks)
2. Fetch pending steps from Supabase
3. Enrich each step through 6 stages
4. Validate against JSON schemas
5. Save to enriched_content field

Usage:
    python scripts/openai_enrichment/enrich_module_steps.py --limit 10 --subject matematicas

Author: Kuneo Team
Version: 0.1
"""

import os
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any

from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv
import jsonschema

# Load environment variables
load_dotenv("server/.env")

# =========================
# CONFIG
# =========================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables")

client = OpenAI(api_key=OPENAI_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FOUNDATIONS_DIR = Path("pedagogical_foundations")
SCHEMA_PATH = FOUNDATIONS_DIR / "schemas" / "enriched_step.schema.json"

MODEL = "gpt-4o-mini"  # Using gpt-4o-mini for cost-effectiveness
ENRICHMENT_VERSION = "0.1"

# Subject mapping: CLI (Spanish) -> DB (English)
SUBJECT_MAPPER = {
    "matematicas": "mathematics",
    "ciencias": "natural_sciences",
    "sociales": "social_studies",
    "lenguaje": "language",
    "ingles": "english"
}

# =========================
# LOAD FOUNDATIONS
# =========================

def load_json(path: Path) -> Dict:
    """Load JSON file with UTF-8 encoding"""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_text(path: Path) -> str:
    """Load text file with UTF-8 encoding"""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_foundations() -> Dict[str, Any]:
    """
    Load all pedagogical foundations files into memory.
    These will be injected into system prompts for all LLM calls.
    """
    print("📚 Loading pedagogical foundations...")
    
    foundations = {
        # JSON Policies
        "principles": load_json(FOUNDATIONS_DIR / "pedagogical_principles.json"),
        "llm_policy": load_json(FOUNDATIONS_DIR / "llm_enrichment_policy.json"),
        "tuko_policy": load_json(FOUNDATIONS_DIR / "tuko_intervention_policy.json"),
        "feedback_policy": load_json(FOUNDATIONS_DIR / "feedback_policy.json"),
        "reflection_policy": load_json(FOUNDATIONS_DIR / "reflection_policy.json"),
        "socioemotional_policy": load_json(FOUNDATIONS_DIR / "socioemotional_policy.json"),
        "assessment_policy": load_json(FOUNDATIONS_DIR / "assessment_policy.json"),
        
        # Markdown Prompt Blocks
        "system_pedagogy": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "system_pedagogy.md"),
        "feedback_rules": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "feedback_rules.md"),
        "tuko_voice": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "tuko_voice.md"),
        "metacognition_rules": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "metacognition_rules.md"),
        "safety_and_quality": load_text(FOUNDATIONS_DIR / "prompt_blocks" / "safety_and_quality.md"),
        
        # JSON Schema for validation
        "schema": load_json(SCHEMA_PATH)
    }
    
    print("✅ Foundations loaded successfully")
    return foundations


# =========================
# SYSTEM PROMPT BUILDER
# =========================

def build_system_prompt(foundations: Dict, stage: str) -> str:
    """
    Build system prompt by injecting pedagogical foundations.
    Different stages may emphasize different aspects.
    
    Args:
        foundations: Loaded pedagogical foundations
        stage: Current enrichment stage (exercise, hints, feedback, cards, visual, metacognition)
    """
    
    # Base system pedagogy (always included)
    base = foundations["system_pedagogy"]
    
    # Stage-specific emphasis
    stage_emphasis = {
        "exercise": f"""
## CURRENT TASK: Exercise Generation

You are generating the core exercise content (prompt, options, correct answer).

**Focus on:**
- {foundations['principles']['principles'][0]['rule']}
- {foundations['principles']['principles'][4]['rule']}
- Age-appropriate language from safety_and_quality.md
- Contextual examples that connect to student's life

**Generate:**
- `prompt`: The actual question (max 2-3 sentences, max 500 chars)
- `options`: Answer choices (2-6 options, include misconception distractors)
- `correct_answer`: The correct answer ID(s)
- `explanation`: Why this answer is correct (max 300 chars)
- `input_mode`: How student provides answer (multiple_choice, open_text, numeric, etc.)

**Remember:** You CANNOT change subject, grade_range, cognitive_type, or core_concept. These are fixed.
""",
        
        "hints": f"""
## CURRENT TASK: Hint Generation

You are generating progressive hints that scaffold without revealing the answer.

**Tuko's Voice:**
{foundations['tuko_voice']}

**Hint Progression:**
1. **hint_level_1** (short_hint): 1-2 sentences, guiding question (max 35 words)
2. **hint_level_2**: More explicit or visual reference (max 50 words)
3. **worked_example**: Step-by-step solution of similar problem (max 500 chars)
4. **visual_hint**: Reference to visual_template_key with overlay instructions

**Critical Rule:** {foundations['principles']['principles'][3]['rule']}
""",
        
        "feedback": f"""
## CURRENT TASK: Feedback Generation

You are generating formative feedback that diagnoses thinking, not judges.

**Feedback Rules:**
{foundations['feedback_rules']}

**Generate:**
- `correct_feedback`: Brief confirmation + reason (max 20 words)
- `incorrect_feedback`: Non-punitive guidance (max 25 words)
- `misconception_feedback`: Object mapping misconception → specific feedback (max 30 words each)
- `partial_feedback`: For partially correct answers (if applicable)

**Tone:** {foundations['tuko_policy']['voice']['tone']}
""",
        
        "cards": f"""
## CURRENT TASK: Concept Card Variants

You are generating card variants for Tuko intervention (hint, corrective, reflective).

**Card Philosophy:**
- One idea, one example, one visual per card
- Max 50 words per card
- Link to visual_template_key

**Intervention Policy:**
{json.dumps(foundations['tuko_policy']['card_types_by_situation'], ensure_ascii=False, indent=2)}

**Generate:**
- `hint_card`: Guides observation without revealing (for exploration)
- `corrective_card`: Explains common misconception (for error_analysis)
- `reflective_card`: Prompts metacognition (for success after struggle)
""",
        
        "visual": f"""
## CURRENT TASK: Visual Template Enrichment

You are enriching visual_template with labels, captions, and overlays.

**Generate:**
- `caption`: Explanatory text below visual (max 200 chars)
- `labels`: Object with title, legend items
- `overlays.highlight`: Array of elements to highlight for hints
- `overlays.misconception`: Array of elements showing common errors

**Remember:** You CANNOT change renderer or template_key. Only enrich labels/overlays.
""",
        
        "metacognition": f"""
## CURRENT TASK: Metacognitive Prompt Generation

You are generating reflection prompts for step 8 (metacognicion).

**Metacognition Rules:**
{foundations['metacognition_rules']}

**Generate:**
- `reflection_prompt`: Main metacognitive question (adapted to grade_range)
- `confidence_question`: Self-assessment of mastery
- `self_assessment_prompt`: "What helped you most?" type question

**Question Types:** how_did_you_know, what_changed, where_else, what_error, self_assessment
"""
    }
    
    prompt = f"""{base}

---

{stage_emphasis.get(stage, "")}

---

## LLM Policy (MUST COMPLY)

{json.dumps(foundations['llm_policy'], ensure_ascii=False, indent=2)}

---

## Safety and Quality Validation

{foundations['safety_and_quality']}

---

**OUTPUT FORMAT:** Return ONLY valid JSON matching the expected structure for this stage.
**NO MARKDOWN:** Do not wrap JSON in ```json blocks. Return raw JSON only.
"""
    
    return prompt


# =========================
# LLM CALL WRAPPER
# =========================

def call_llm(system_prompt: str, user_payload: Dict, temperature: float = 0.4) -> Dict:
    """
    Generic wrapper for OpenAI API calls.
    
    Args:
        system_prompt: System prompt with foundations injected
        user_payload: User message (task description + data)
        temperature: Sampling temperature (0.4 for more deterministic, 0.7 for more creative)
    
    Returns:
        Parsed JSON response
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"Response content: {content}")
        raise
    except Exception as e:
        print(f"❌ LLM call failed: {e}")
        raise


# =========================
# ENRICHMENT PIPELINE (6 STAGES)
# =========================

def enrich_exercise(
    step: Dict,
    module: Dict,
    concept_card: Optional[Dict],
    visual_template: Optional[Dict],
    foundations: Dict
) -> Dict:
    """
    Stage 1: Generate exercise content (prompt, options, correct_answer)
    """
    
    print(f"  📝 Stage 1: Exercise generation...")
    
    payload = {
        "task": "generate_exercise_content",
        "step": {
            "step_number": step["step_order"],
            "cognitive_type": step["cognitive_type"],
            "title": step["title"],
            "instruction": step["instruction"],
            "expected_response_type": step["expected_response_type"]
        },
        "module": {
            "subject": module["subject"],
            "grade_range": module["grade_range"],
            "core_concept": module["core_concept"],
            "learning_objective": module.get("learning_objective")
        },
        "concept_card": {
            "core_concept": concept_card.get("core_concept"),
            "one_line_definition": concept_card.get("one_line_definition"),
            "common_misconception": concept_card.get("common_misconception")
        } if concept_card else None,
        "visual_template": {
            "template_key": visual_template["template_key"],
            "template_name": visual_template["template_name"]
        } if visual_template else None,
        "requirements": {
            "preserve_cognitive_type": True,
            "preserve_subject": True,
            "preserve_grade_range": True,
            "preserve_core_concept": True,
            "generate": [
                "prompt",
                "context (optional)",
                "options (if multiple_choice)",
                "correct_answer",
                "explanation",
                "input_mode"
            ],
            "include_misconception_distractors": True,
            "max_prompt_length": 500,
            "max_option_length": 200
        }
    }
    
    system_prompt = build_system_prompt(foundations, "exercise")
    result = call_llm(system_prompt, payload, temperature=0.5)
    
    return result


def enrich_hints(step: Dict, exercise: Dict, foundations: Dict) -> Dict:
    """
    Stage 2: Generate progressive hints (short_hint → visual_hint → worked_example)
    """
    
    print(f"  💡 Stage 2: Hint generation...")
    
    payload = {
        "task": "generate_progressive_hints",
        "step": {
            "cognitive_type": step["cognitive_type"],
            "title": step["title"]
        },
        "exercise": exercise,
        "requirements": {
            "hint_levels": ["hint_level_1", "hint_level_2", "worked_example", "visual_hint"],
            "do_not_reveal_answer_too_early": True,
            "hint_level_1_max_words": 35,
            "hint_level_2_max_words": 50,
            "worked_example_max_chars": 500,
            "tone": "calm, brief, guiding"
        }
    }
    
    system_prompt = build_system_prompt(foundations, "hints")
    result = call_llm(system_prompt, payload, temperature=0.4)
    
    return result


def enrich_feedback(step: Dict, exercise: Dict, hints: Dict, foundations: Dict) -> Dict:
    """
    Stage 3: Generate formative feedback (correct, incorrect, misconception-specific)
    """
    
    print(f"  💬 Stage 3: Feedback generation...")
    
    payload = {
        "task": "generate_feedback",
        "step": {
            "cognitive_type": step["cognitive_type"]
        },
        "exercise": exercise,
        "hints": hints,
        "requirements": {
            "feedback_types": [
                "correct_feedback",
                "incorrect_feedback",
                "misconception_feedback",
                "partial_feedback (if applicable)"
            ],
            "tone": "brief, calm, non-judgmental",
            "correct_feedback_max_words": 20,
            "incorrect_feedback_max_words": 25,
            "misconception_feedback_max_words": 30
        }
    }
    
    system_prompt = build_system_prompt(foundations, "feedback")
    result = call_llm(system_prompt, payload, temperature=0.4)
    
    return result


def enrich_cards(
    step: Dict,
    module: Dict,
    concept_card: Optional[Dict],
    exercise: Dict,
    foundations: Dict
) -> Dict:
    """
    Stage 4: Generate concept card variants (hint, corrective, reflective)
    """
    
    print(f"  🎴 Stage 4: Card variant generation...")
    
    payload = {
        "task": "generate_concept_card_variants",
        "step": {
            "cognitive_type": step["cognitive_type"],
            "title": step["title"]
        },
        "module": {
            "subject": module["subject"],
            "grade_range": module["grade_range"],
            "core_concept": module["core_concept"]
        },
        "base_concept_card": concept_card if concept_card else None,
        "exercise": exercise,
        "requirements": {
            "card_types": ["hint", "corrective", "reflective"],
            "one_idea_one_example_one_visual": True,
            "max_words_per_card": 50,
            "link_to_visual_template": True
        }
    }
    
    system_prompt = build_system_prompt(foundations, "cards")
    result = call_llm(system_prompt, payload, temperature=0.5)
    
    return result


def enrich_visual(
    step: Dict,
    visual_template: Optional[Dict],
    exercise: Dict,
    foundations: Dict
) -> Optional[Dict]:
    """
    Stage 5: Enrich visual template with labels, captions, overlays
    """
    
    if not visual_template:
        print(f"  ⏭️  Stage 5: No visual template, skipping...")
        return None
    
    print(f"  🎨 Stage 5: Visual enrichment...")
    
    payload = {
        "task": "enrich_visual_template",
        "step": {
            "cognitive_type": step["cognitive_type"]
        },
        "visual_template": {
            "template_key": visual_template["template_key"],
            "template_name": visual_template["template_name"],
            "visual_type": visual_template["visual_type"],
            "renderer": visual_template["renderer"],
            "config": visual_template["config"]
        },
        "exercise": exercise,
        "requirements": {
            "generate": [
                "caption",
                "labels (title, legend)",
                "overlays.highlight (for hints)",
                "overlays.misconception (for errors)"
            ],
            "preserve_renderer": True,
            "preserve_template_key": True,
            "caption_max_chars": 200
        }
    }
    
    system_prompt = build_system_prompt(foundations, "visual")
    result = call_llm(system_prompt, payload, temperature=0.4)
    
    return result


def enrich_metacognition(step: Dict, exercise: Dict, module: Dict, foundations: Dict) -> Optional[Dict]:
    """
    Stage 6: Generate metacognitive prompts (only for step 8: metacognicion)
    """
    
    if step["cognitive_type"] != "metacognicion":
        return None
    
    print(f"  🤔 Stage 6: Metacognition prompt generation...")
    
    payload = {
        "task": "generate_metacognitive_prompt",
        "step": {
            "cognitive_type": step["cognitive_type"],
            "title": step["title"]
        },
        "module": {
            "grade_range": module["grade_range"],
            "core_concept": module["core_concept"]
        },
        "exercise": exercise,
        "requirements": {
            "generate": [
                "reflection_prompt",
                "confidence_question",
                "self_assessment_prompt"
            ],
            "question_types": ["how_did_you_know", "what_changed", "where_else", "self_assessment"],
            "adapt_to_grade_range": True
        }
    }
    
    system_prompt = build_system_prompt(foundations, "metacognition")
    result = call_llm(system_prompt, payload, temperature=0.5)
    
    return result


# =========================
# COMPLETE ENRICHMENT
# =========================

def enrich_step(
    step: Dict,
    module: Dict,
    concept_card: Optional[Dict],
    visual_template: Optional[Dict],
    foundations: Dict
) -> Dict:
    """
    Complete enrichment pipeline for one step.
    Runs all 6 stages sequentially.
    
    Returns:
        Enriched content dictionary
    """
    
    print(f"\n🔄 Enriching step {step['step_order']} ({step['cognitive_type']})...")
    
    # Stage 1: Exercise
    exercise = enrich_exercise(step, module, concept_card, visual_template, foundations)
    
    # Stage 2: Hints
    hints = enrich_hints(step, exercise, foundations)
    
    # Stage 3: Feedback
    feedback = enrich_feedback(step, exercise, hints, foundations)
    
    # Stage 4: Cards
    cards = enrich_cards(step, module, concept_card, exercise, foundations)
    
    # Stage 5: Visual
    visual = enrich_visual(step, visual_template, exercise, foundations)
    
    # Stage 6: Metacognition (only if cognitive_type == metacognicion)
    metacognition = enrich_metacognition(step, exercise, module, foundations)
    
    enriched_content = {
        "exercise": exercise,
        "hints": hints,
        "feedback": feedback,
        "concept_card_variants": cards,
        "visual_enrichment": visual,
        "metacognition": metacognition,
        "enriched_at": datetime.utcnow().isoformat(),
        "enrichment_version": ENRICHMENT_VERSION
    }
    
    print(f"✅ Step {step['step_order']} enriched successfully")
    
    return enriched_content


# =========================
# VALIDATION
# =========================

def validate_enriched_content(enriched_content: Dict, schema: Dict) -> bool:
    """
    Validate enriched content against JSON schema.
    Note: This validates the structure, not the full step.
    
    Returns:
        True if valid, raises ValidationError otherwise
    """
    
    try:
        # For now, just check that required keys exist
        # Full schema validation would require restructuring to match enriched_step.schema.json
        required_keys = ["exercise", "hints", "feedback"]
        for key in required_keys:
            if key not in enriched_content:
                raise ValueError(f"Missing required key: {key}")
        
        return True
    
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        raise


# =========================
# DATABASE OPERATIONS
# =========================

def fetch_pending_steps(limit: int = 10, subject: Optional[str] = None, grade_range: Optional[str] = None) -> List[Dict]:
    """
    Fetch pending steps from Supabase with related data (module, concept_card).
    
    Args:
        limit: Max number of steps to fetch
        subject: Filter by subject (matematicas, ciencias, etc.)
        grade_range: Filter by grade_range (4-5, 6-7, etc.)
    
    Returns:
        List of step dictionaries with joined data
    """
    
    print(f"\n🔍 Fetching pending steps (limit={limit}, subject={subject}, grade_range={grade_range})...")
    
    # Convert subject from Spanish (CLI) to English (DB)
    db_subject = SUBJECT_MAPPER.get(subject) if subject else None
    
    # First, get module_ids that match subject/grade_range filters
    module_ids = None
    if db_subject or grade_range:
        module_query = supabase.schema("kuneo").table("modules").select("id")
        if db_subject:
            module_query = module_query.eq("subject", db_subject)
        if grade_range:
            module_query = module_query.eq("grade_range", grade_range)
        module_result = module_query.execute()
        module_ids = [m["id"] for m in module_result.data]
        
        if not module_ids:
            print("⚠️  No modules found matching filters")
            return []
    
    # Fetch pending steps
    query = (
        supabase.schema("kuneo")
        .table("module_steps")
        .select("*")
        .eq("enrichment_status", "pending")
        .order("module_id", desc=False)
        .order("step_order", desc=False)
        .limit(limit * 3 if module_ids else limit)  # Fetch more if filtering
    )
    
    if module_ids:
        query = query.in_("module_id", module_ids)
    
    result = query.execute()
    steps = result.data[:limit]
    
    # Fetch related modules and concept_cards
    for step in steps:
        module_id = step.get("module_id")
        concept_card_id = step.get("concept_card_id")
        
        # Fetch module
        module_result = (
            supabase.schema("kuneo")
            .table("modules")
            .select("*")
            .eq("id", module_id)
            .single()
            .execute()
        )
        step["modules"] = module_result.data
        
        # Fetch concept_card if exists
        if concept_card_id:
            try:
                card_result = (
                    supabase.schema("kuneo")
                    .table("concept_cards")
                    .select("*")
                    .eq("id", concept_card_id)
                    .single()
                    .execute()
                )
                step["concept_cards"] = card_result.data
            except:
                step["concept_cards"] = None
        else:
            step["concept_cards"] = None
    
    print(f"✅ Found {len(steps)} pending steps")
    
    return steps


def fetch_visual_template(template_key: str) -> Optional[Dict]:
    """Fetch visual template by template_key"""
    
    if not template_key:
        return None
    
    try:
        result = (
            supabase.schema("kuneo")
            .table("visual_templates")
            .select("*")
            .eq("template_key", template_key)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        return None


def mark_step_in_progress(step_id: str):
    """Mark step as in_progress before enrichment"""
    
    supabase.schema("kuneo").table("module_steps").update({
        "enrichment_status": "in_progress"
    }).eq("id", step_id).execute()


def save_enrichment(step_id: str, enriched_content: Dict):
    """Save enriched content to database"""
    
    supabase.schema("kuneo").table("module_steps").update({
        "enriched_content": enriched_content,
        "enrichment_status": "completed",
        "enriched_at": datetime.utcnow().isoformat(),
        "enrichment_version": ENRICHMENT_VERSION
    }).eq("id", step_id).execute()


def mark_step_failed(step_id: str, error: str):
    """Mark step as failed with error message"""
    
    supabase.schema("kuneo").table("module_steps").update({
        "enrichment_status": "failed",
        "enriched_content": {"error": str(error), "failed_at": datetime.utcnow().isoformat()}
    }).eq("id", step_id).execute()


# =========================
# MAIN PIPELINE
# =========================

def main(limit: int = 10, subject: Optional[str] = None, grade_range: Optional[str] = None, dry_run: bool = False):
    """
    Main enrichment pipeline.
    
    Args:
        limit: Max number of steps to enrich
        subject: Filter by subject
        grade_range: Filter by grade range
        dry_run: If True, don't save to database (for testing)
    """
    
    print("=" * 60)
    print("🚀 OpenAI Enrichment Pipeline for Module Steps")
    print("=" * 60)
    
    # Load foundations
    foundations = load_foundations()
    
    # Fetch pending steps
    steps = fetch_pending_steps(limit=limit, subject=subject, grade_range=grade_range)
    
    if not steps:
        print("\n✅ No pending steps found. All done!")
        return
    
    # Enrich each step
    success_count = 0
    failed_count = 0
    
    for i, step in enumerate(steps, 1):
        try:
            print(f"\n{'=' * 60}")
            print(f"Processing step {i}/{len(steps)}")
            print(f"Module: {step['modules']['core_concept']} ({step['modules']['subject']}, {step['modules']['grade_range']})")
            print(f"Step: {step['step_order']} - {step['cognitive_type']}")
            print(f"{'=' * 60}")
            
            # Mark as in progress
            if not dry_run:
                mark_step_in_progress(step["id"])
            
            # Get related data
            module = step["modules"]
            concept_card = step.get("concept_cards")
            visual_template = fetch_visual_template(step.get("visual_template_key"))
            
            # Enrich
            enriched = enrich_step(
                step=step,
                module=module,
                concept_card=concept_card,
                visual_template=visual_template,
                foundations=foundations
            )
            
            # Validate
            validate_enriched_content(enriched, foundations["schema"])
            
            # Save
            if not dry_run:
                save_enrichment(step["id"], enriched)
                print(f"💾 Saved to database")
            else:
                print(f"🔍 DRY RUN - Not saved to database")
                print(f"Preview: {json.dumps(enriched, ensure_ascii=False, indent=2)[:500]}...")
            
            success_count += 1
            
        except Exception as e:
            print(f"\n❌ Failed to enrich step {step['id']}: {e}")
            
            if not dry_run:
                mark_step_failed(step["id"], str(e))
            
            failed_count += 1
            
            # Continue with next step
            continue
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 ENRICHMENT SUMMARY")
    print("=" * 60)
    print(f"✅ Success: {success_count}/{len(steps)}")
    print(f"❌ Failed: {failed_count}/{len(steps)}")
    
    if dry_run:
        print("\n🔍 DRY RUN MODE - No changes saved to database")
    
    print("=" * 60)


# =========================
# CLI
# =========================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Enrich module steps with OpenAI using pedagogical foundations"
    )
    
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Max number of steps to enrich (default: 10)"
    )
    
    parser.add_argument(
        "--subject",
        type=str,
        choices=["matematicas", "ciencias", "sociales", "lenguaje", "ingles"],
        help="Filter by subject"
    )
    
    parser.add_argument(
        "--grade-range",
        type=str,
        choices=["4-5", "6-7", "8-9", "10-11"],
        help="Filter by grade range"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without saving to database (for testing)"
    )
    
    args = parser.parse_args()
    
    main(
        limit=args.limit,
        subject=args.subject,
        grade_range=args.grade_range,
        dry_run=args.dry_run
    )
