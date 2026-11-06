#!/usr/bin/env python3
"""
Script: enrich_visual_templates.py
Purpose: Enrich visual_templates with pedagogical visual enhancements
Created: 2026-05-15

This script enriches visual_templates WITHOUT changing their technical structure.
It preserves: template_key, renderer, visual_type, subject, base config

It generates:
- Pedagogical visual framing (captions, questions, focus points)
- Labels and accessibility text
- Overlays (explanation, misconception, hint, corrective)
- Animation steps for guided exploration
- Interaction rules by renderer type
- Usage guidelines by card type

Usage:
    python scripts/openai_enrichment/enrich_visual_templates.py --limit 5 --dry-run
    python scripts/openai_enrichment/enrich_visual_templates.py --limit 5 --renderer svg_custom
    python scripts/openai_enrichment/enrich_visual_templates.py --limit 23
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

# =============================================================================
# LOAD PEDAGOGICAL FOUNDATIONS
# =============================================================================

def load_foundations() -> Dict:
    """Load all pedagogical foundation files"""
    print(f"📚 Loading pedagogical foundations...")
    
    foundations_dir = project_root / "pedagogical_foundations"
    foundations = {}
    
    # Load policy files
    policy_files = [
        "pedagogical_principles.json",
        "llm_enrichment_policy.json",
        "tuko_intervention_policy.json",
        "feedback_policy.json",
        "reflection_policy.json",
        "socioemotional_policy.json",
        "assessment_policy.json"
    ]
    
    for filename in policy_files:
        filepath = foundations_dir / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                foundations[filename.replace('.json', '')] = json.load(f)
    
    # Load markdown documentation
    md_files = [
        "system_pedagogy.md",
        "feedback_rules.md",
        "tuko_voice.md",
        "metacognition_rules.md",
        "safety_and_quality.md"
    ]
    
    for filename in md_files:
        filepath = foundations_dir / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                foundations[filename.replace('.md', '')] = f.read()
    
    print(f"   ✅ Loaded {len(foundations)} foundation files")
    return foundations

# Load foundations once
FOUNDATIONS = load_foundations()

# Load JSON schema for validation
SCHEMA_PATH = project_root / "pedagogical_foundations" / "schemas" / "visual_enriched_config.schema.json"
with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
    ENRICHED_CONFIG_SCHEMA = json.load(f)

# =============================================================================
# SYSTEM PROMPT
# =============================================================================

def build_system_prompt(foundations: Dict) -> str:
    """Build system prompt from pedagogical foundations"""
    
    prompt = f"""You are an expert educational visual designer and pedagogue specializing in creating pedagogically-rich visual learning materials for the KUNEO adaptive learning platform.

Your task is to enrich visual templates with pedagogical enhancements WITHOUT changing their technical structure (renderer, visual_type, base config).

# PEDAGOGICAL FOUNDATIONS

{foundations.get('pedagogical_principles', {})}

# TUKO'S VOICE (our learning companion)
{foundations.get('tuko_voice', '')}

# VISUAL PEDAGOGY PRINCIPLES

1. **Visual Clarity**: Labels and captions should guide attention without overwhelming
2. **Progressive Disclosure**: Animation steps reveal complexity gradually
3. **Error-Aware**: Overlays address specific misconceptions visually
4. **Accessibility**: All visuals must have descriptive text for screen readers
5. **Card-Type Aware**: Different card types (basic, hint, corrective, etc.) need different visual emphasis

# MISCONCEPTION VISUAL STRATEGIES

- **highlight**: Draw attention to key element
- **dim**: De-emphasize distractors
- **compare**: Show correct vs incorrect side-by-side
- **annotate**: Add arrows, labels, or callouts
- **isolate**: Focus on single element, hide others
- **connect**: Show relationships with lines/arrows
- **zoom**: Magnify important detail

# ANIMATION GUIDELINES

- Keep animations SHORT (300-900ms per step)
- Maximum 5-7 steps for any concept
- Each step must have clear pedagogical purpose
- Animation should be CALM, not distracting
- Use delays strategically to allow comprehension

# INTERACTION DESIGN

Match interactions to renderer capabilities:
- **svg_custom**: hover highlights, click to reveal, drag to compare
- **recharts**: hover datapoints, toggle series, zoom regions
- **react_flow**: expand nodes, follow edges, filter view
- **mermaid**: step-by-step reveal, highlight paths
- **timeline**: scrub through events, compare periods

# OUTPUT REQUIREMENTS

Generate pedagogically-rich enrichments that:
1. Have a clear main_question to focus student attention
2. Provide step-by-step visual guidance through animation_steps
3. Include overlays for common misconceptions
4. Specify interaction rules appropriate for the renderer
5. Differentiate usage by card type (basic vs corrective vs reflective)
6. Include accessibility_text for screen readers

# SAFETY & QUALITY
{foundations.get('safety_and_quality', '')}

# CRITICAL OUTPUT INSTRUCTIONS

You will receive a JSON payload with:
- task: Description of what to generate
- template: Information about the visual template
- output_structure: EXACT structure you must return
- instruction: Specific instructions for this task

**YOU MUST:**
1. Generate ONLY the structure specified in "output_structure"
2. Do NOT echo back the input payload (task, template, requirements, etc.)
3. Return valid JSON matching EXACTLY the structure in "output_structure"
4. Include ALL required fields specified in the schema
5. Use only the enum values specified for constrained fields

**EXAMPLE:**
If output_structure specifies to return overlays object, return ONLY that object.
Do NOT return the task, template, or requirements fields.

Return valid JSON matching the required schema. Be specific, pedagogical, and age-appropriate."""
    
    return prompt

# =============================================================================
# LLM CALL
# =============================================================================

def call_llm(system_prompt: str, payload: Dict, temperature: float = 0.3) -> Dict:
    """
    Call OpenAI API with structured output
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            temperature=temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}
            ]
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    
    except json.JSONDecodeError as e:
        print(f"      ❌ JSON decode error: {e}")
        print(f"      Raw response: {content[:200]}...")
        raise
    except Exception as e:
        print(f"      ❌ LLM call failed: {e}")
        raise

# =============================================================================
# FETCH DATA FROM SUPABASE
# =============================================================================

def fetch_pending_templates(limit: int = 10, visual_type: Optional[str] = None, renderer: Optional[str] = None) -> List[Dict]:
    """Fetch pending visual templates from Supabase"""
    print(f"🔍 Fetching pending visual templates (limit={limit})...")
    
    # Build query
    query = supabase.schema("kuneo").table("visual_templates").select("*")
    
    # Filter by enrichment status
    query = query.or_("enrichment_status.is.null,enrichment_status.eq.pending,enrichment_status.eq.failed")
    
    # Apply visual_type filter if provided
    if visual_type:
        query = query.eq("visual_type", visual_type)
        print(f"   📌 Filtering by visual_type: {visual_type}")
    
    # Apply renderer filter if provided
    if renderer:
        query = query.eq("renderer", renderer)
        print(f"   📌 Filtering by renderer: {renderer}")
    
    # Execute query
    result = query.limit(limit).order("id").execute()
    
    templates = result.data or []
    print(f"   ✅ Found {len(templates)} pending visual templates")
    
    return templates

# =============================================================================
# ENRICHMENT STAGES
# =============================================================================

def stage1_enrich_base_visual(template: Dict, foundations: Dict) -> Dict:
    """
    Stage 1: Generate pedagogical visual framing
    - caption
    - main_question
    - student_focus
    - labels
    - accessibility_text
    """
    print(f"   🔧 Stage 1: Enriching base visual pedagogy...")
    
    payload = {
        "task": "Generate pedagogical visual framing for this template",
        "template": {
            "template_key": template.get("template_key"),
            "visual_type": template.get("visual_type"),
            "renderer": template.get("renderer"),
            "subject": template.get("subject"),
            "base_config": str(template.get("config", ""))[:1000]
        },
        "requirements": [
            "Use clear, educational language appropriate for elementary to middle school",
            "Focus on conceptual understanding, not just labels",
            "Accessibility text should be comprehensive but concise",
            "Labels should guide attention to pedagogically important elements"
        ],
        "output_structure": {
            "pedagogical_visual": {
                "caption": "Clear pedagogical caption (10-500 chars) explaining what to observe",
                "main_question": "Guiding question to focus student attention (10-300 chars)",
                "student_focus": "What the student should look at first (10-300 chars)",
                "accessibility_text": "Full description for screen readers (20-800 chars)"
            },
            "labels": {
                "title": "Visual title (3-100 chars)",
                "elements": "Array of {element_id, label, purpose} for key visual elements",
                "legend": "Optional array of {symbol, meaning} for colors/shapes used (can be empty array)"
            }
        },
        "instruction": "Generate ONLY the JSON structure specified in output_structure. Do not return the input payload."
    }
    
    result = call_llm(build_system_prompt(foundations), payload, temperature=0.35)
    print(f"      ✅ Stage 1 complete")
    
    return result

def stage2_generate_misconception_overlays(template: Dict, base_visual: Dict, foundations: Dict) -> Dict:
    """
    Stage 2: Generate overlays for addressing misconceptions
    Each overlay: {misconception_key, target, visual_action, message, card_variant}
    """
    print(f"   🎨 Stage 2: Generating misconception overlays...")
    
    payload = {
        "task": "Generate visual overlays for different pedagogical contexts",
        "template": {
            "template_key": template.get("template_key"),
            "visual_type": template.get("visual_type"),
            "subject": template.get("subject")
        },
        "base_visual": base_visual,
        "requirements": [
            "Focus on common, predictable misconceptions for this subject",
            "Visual actions should clarify, not confuse",
            "Messages should be non-punitive and constructive",
            "Use 'compare' action to show correct vs incorrect",
            "Maximum 3-5 misconception overlays per template"
        ],
        "output_structure": {
            "overlays": {
                "explanation": "Array of 1-3 general explanatory overlays. Each overlay MUST have: {overlay_id:string, target:string, visual_action:enum, message:string, position:enum}",
                "misconception": "Array of 3-5 misconception overlays. Each overlay MUST have: {misconception_key:string, target:string, visual_action:enum, message:string, card_variant:enum}",
                "hint": "Array of 1-2 hint overlays. Each overlay MUST have: {overlay_id:string, target:string, visual_action:enum, message:string, position:enum}",
                "corrective": "Array of 1-2 corrective overlays. Each overlay MUST have: {overlay_id:string, target:string, visual_action:enum, message:string, position:enum}"
            }
        },
        "critical_constraints": [
            "visual_action MUST ONLY be one of: highlight, dim, compare, annotate, isolate, connect, zoom (NO other values)",
            "card_variant MUST ONLY be one of: basic, hint, corrective, reflective, deepening (NO other values)",
            "position MUST ONLY be one of: top, bottom, left, right, center, auto (NO 'above', 'below', 'middle' or other values)"
        ],
        "instruction": "Generate ONLY the JSON structure with 'overlays' key containing explanation, misconception, hint, and corrective arrays."
    }
    
    result = call_llm(build_system_prompt(foundations), payload, temperature=0.3)
    print(f"      ✅ Stage 2 complete")
    
    return result

def stage3_generate_animation_steps(template: Dict, base_visual: Dict, overlays: Dict, foundations: Dict) -> Dict:
    """
    Stage 3: Generate animation steps for guided exploration
    Each step: {step, action, target, caption, duration_ms, delay_ms}
    """
    print(f"   🎬 Stage 3: Generating animation steps...")
    
    payload = {
        "task": "Generate animation sequence for pedagogical visual exploration",
        "template": {
            "template_key": template.get("template_key"),
            "visual_type": template.get("visual_type"),
            "renderer": template.get("renderer")
        },
        "base_visual": base_visual,
        "overlays": overlays,
        "animation_principles": [
            "Start with context (show overall structure)",
            "Highlight key elements one at a time",
            "Use 'compare' to contrast concepts",
            "End with synthesis (show complete picture)",
            "Keep animations CALM and purposeful",
            "Maximum 7 steps total",
            "Each step should have clear pedagogical purpose"
        ],
        "output_structure": {
            "animation_steps": "Array of 3-7 steps. Each step MUST have: {step:integer, action:enum, target:string, caption:string, duration_ms:integer, delay_ms:optional_integer}. NO other fields."
        },
        "critical_constraints": [
            "action MUST ONLY be one of: show, hide, highlight, dim, move, connect, compare, reveal, annotate (NO 'zoom', 'focus' or other values)",
            "duration_ms MUST be integer between 100-3000",
            "step MUST be sequential integers starting from 1 (1, 2, 3, ...)",
            "delay_ms if present MUST be integer between 0-2000"
        ],
        "instruction": "Generate ONLY the JSON with 'animation_steps' array. Do not include task or template in output."
    }
    
    result = call_llm(build_system_prompt(foundations), payload, temperature=0.3)
    print(f"      ✅ Stage 3 complete")
    
    return result

def stage4_generate_interaction_rules(template: Dict, base_visual: Dict, foundations: Dict) -> Dict:
    """
    Stage 4: Generate interaction rules appropriate for renderer
    Rules vary by renderer: svg_custom, recharts, react_flow, mermaid, etc.
    """
    print(f"   ⚙️ Stage 4: Generating interaction rules...")
    
    renderer = template.get("renderer", "svg_custom")
    
    # Define renderer-specific interaction capabilities
    interaction_capabilities = {
        "svg_custom": ["hover", "click", "drag"],
        "recharts": ["hover", "click"],
        "react_flow": ["hover", "click", "drag"],
        "mermaid": ["click"],
        "timeline": ["hover", "click"],
        "concept_map": ["hover", "click", "drag"]
    }
    
    available_interactions = interaction_capabilities.get(renderer, ["hover", "click"])
    
    payload = {
        "task": "Generate interaction rules and usage by card type",
        "template": {
            "template_key": template.get("template_key"),
            "visual_type": template.get("visual_type"),
            "renderer": renderer,
            "available_interactions": available_interactions
        },
        "base_visual": base_visual,
        "interaction_guidelines": [
            "Interactions should support learning, not distract",
            "Hover feedback should be immediate and clear",
            "Click interactions should reveal additional insight",
            f"Only use interactions available for {renderer}: {', '.join(available_interactions)}"
        ],
        "output_structure": {
            "interaction_rules": {
                "hover": "Array of hover rules (if supported, else empty []). Each rule MUST have: {target:string, action:string, feedback:string, conditions:array}. conditions MUST be array of strings (can be empty []).",
                "click": "Array of click rules (if supported, else empty []). Each rule MUST have: {target:string, action:string, feedback:string, conditions:array}. conditions MUST be array of strings (can be empty []).",
                "drag": "Array of drag rules (if supported, else empty []). Each rule MUST have: {target:string, action:string, feedback:string, conditions:array}. conditions MUST be array of strings (can be empty []).",
                "slider": "Array of slider rules (if supported, else empty []). Each rule MUST have: {target:string, action:string, feedback:string, conditions:array}. conditions MUST be array of strings (can be empty []).",
                "fallback_static": "String message when interactions unavailable"
            },
            "usage_by_card_type": {
                "basic": "{recommended_overlays: string[], recommended_animations: int[], emphasis: string, interaction_level: 'passive'|'guided'|'exploratory'|'full'}",
                "hint": "Same structure as basic",
                "corrective": "Same structure as basic",
                "reflective": "Same structure as basic",
                "deepening": "Same structure as basic"
            }
        },
        "critical_constraints": [
            "conditions field MUST ALWAYS be an array of strings (can be empty [] but NEVER null, string, or omitted)",
            "interaction_level MUST ONLY be one of: passive, guided, exploratory, full",
            f"Only include interaction types supported by {renderer}: {', '.join(available_interactions)}"
        ],
        "instruction": "Generate ONLY the JSON with 'interaction_rules' and 'usage_by_card_type' objects. All 5 card types (basic, hint, corrective, reflective, deepening) must be present in usage_by_card_type. The conditions field in every interaction rule MUST be an array."
    }
    
    result = call_llm(build_system_prompt(foundations), payload, temperature=0.25)
    print(f"      ✅ Stage 4 complete")
    
    return result

# =============================================================================
# VALIDATION
# =============================================================================

def validate_enriched_config(enriched: Dict, template_key: str) -> bool:
    """Validate enriched config against JSON schema"""
    try:
        validate(instance=enriched, schema=ENRICHED_CONFIG_SCHEMA)
        return True
    except ValidationError as e:
        print(f"   ❌ Validation error: {e.message}")
        print(f"      Path: {' -> '.join(str(p) for p in e.path)}")
        print(f"      Enriched keys: {list(enriched.keys())}")
        
        # Save debug output
        debug_path = project_root / "debug_enriched_visual.json"
        with open(debug_path, 'w', encoding='utf-8') as f:
            json.dump(enriched, f, indent=2, ensure_ascii=False)
        print(f"      💾 Saved enriched content to debug_enriched_visual.json for inspection")
        
        return False

# =============================================================================
# MAIN ENRICHMENT FUNCTION
# =============================================================================

def enrich_single_template(template: Dict, foundations: Dict, dry_run: bool = False) -> bool:
    """
    Enrich a single visual template through all stages
    Returns True if successful, False otherwise
    """
    template_key = template.get("template_key", "unknown")
    visual_type = template.get("visual_type", "unknown")
    renderer = template.get("renderer", "unknown")
    
    try:
        # Update status to in_progress
        if not dry_run:
            supabase.schema("kuneo").table("visual_templates").update({
                "enrichment_status": "in_progress"
            }).eq("id", template["id"]).execute()
        
        # Stage 1: Base visual
        base_visual = stage1_enrich_base_visual(template, foundations)
        
        # Stage 2: Misconception overlays
        overlays = stage2_generate_misconception_overlays(template, base_visual, foundations)
        
        # Stage 3: Animation steps
        animations = stage3_generate_animation_steps(template, base_visual, overlays, foundations)
        
        # Stage 4: Interaction rules
        interactions = stage4_generate_interaction_rules(template, base_visual, foundations)
        
        # Combine all stages into enriched_config
        enriched_config = {
            "version": "0.1",
            "source": "openai_enrichment",
            "pedagogical_visual": base_visual.get("pedagogical_visual", base_visual.get("base_visual", {})),
            "labels": base_visual.get("labels", {}),
            "overlays": overlays.get("overlays", {}),
            "animation_steps": animations.get("animation_steps", []),
            "interaction_rules": interactions.get("interaction_rules", {}),
            "usage_by_card_type": interactions.get("usage_by_card_type", {}),
            "metadata": {
                "model": MODEL,
                "enriched_at": datetime.now(timezone.utc).isoformat(),
                "template_key": template_key,
                "renderer": renderer,
                "visual_type": visual_type
            }
        }
        
        # Validate against schema
        if not validate_enriched_config(enriched_config, template_key):
            raise ValueError("Enriched config failed validation")
        
        # Save to Supabase or show preview
        if dry_run:
            print(f"   🔍 DRY RUN - not saved to database")
            print(f"   📄 Enriched config preview:")
            print(f"      - Caption: {enriched_config['pedagogical_visual'].get('caption', '')[:80]}...")
            print(f"      - Misconception overlays: {len(enriched_config['overlays'].get('misconception', []))}")
            print(f"      - Animation steps: {len(enriched_config['animation_steps'])}")
            print(f"      - Interaction types: {', '.join(k for k, v in enriched_config['interaction_rules'].items() if v and k != 'fallback_static')}")
        else:
            supabase.schema("kuneo").table("visual_templates").update({
                "enriched_config": enriched_config,
                "enrichment_status": "completed",
                "enriched_at": datetime.now(timezone.utc).isoformat(),
                "enrichment_version": "0.1"
            }).eq("id", template["id"]).execute()
            print(f"   ✅ Saved to database")
        
        return True
    
    except Exception as e:
        print(f"   ❌ Failed to enrich template: {e}")
        
        # Update status to failed
        if not dry_run:
            supabase.schema("kuneo").table("visual_templates").update({
                "enrichment_status": "failed"
            }).eq("id", template["id"]).execute()
        
        return False

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Enrich visual templates with pedagogical enhancements")
    parser.add_argument("--limit", type=int, default=10, help="Maximum number of templates to enrich")
    parser.add_argument("--visual-type", type=str, help="Filter by visual_type (e.g., math_visual)")
    parser.add_argument("--renderer", type=str, help="Filter by renderer (e.g., svg_custom)")
    parser.add_argument("--dry-run", action="store_true", help="Run without saving to database")
    
    args = parser.parse_args()
    
    print("=" * 80)
    print("🚀 KUNEO VISUAL TEMPLATE ENRICHMENT")
    print("=" * 80)
    print(f"Model: {MODEL}")
    print(f"Limit: {args.limit}")
    print(f"Visual type filter: {args.visual_type or 'none'}")
    print(f"Renderer filter: {args.renderer or 'none'}")
    print(f"Dry run: {args.dry_run}")
    print("=" * 80)
    
    # Fetch pending templates
    templates = fetch_pending_templates(
        limit=args.limit,
        visual_type=args.visual_type,
        renderer=args.renderer
    )
    
    if not templates:
        print("No pending templates found")
        return
    
    print()
    
    # Enrich each template
    success_count = 0
    failed_count = 0
    
    for i, template in enumerate(templates, 1):
        template_key = template.get("template_key", "unknown")
        visual_type = template.get("visual_type", "unknown")
        renderer = template.get("renderer", "unknown")
        
        print("=" * 80)
        print(f"Processing template {i}/{len(templates)}")
        print("=" * 80)
        print(f"🎯 Enriching template: {template_key} ({visual_type}, {renderer})")
        
        success = enrich_single_template(template, FOUNDATIONS, dry_run=args.dry_run)
        
        if success:
            success_count += 1
            print(f"✅ Success: {template_key}")
        else:
            failed_count += 1
            print(f"❌ Failed: {template_key}")
        
        print()
    
    # Summary
    print("=" * 80)
    print("📊 ENRICHMENT SUMMARY")
    print("=" * 80)
    print(f"✅ Success: {success_count}/{len(templates)}")
    print(f"❌ Failed: {failed_count}/{len(templates)}")
    
    if args.dry_run:
        print(f"\n🔍 DRY RUN MODE - No changes were saved to database")
    
    print("=" * 80)

if __name__ == "__main__":
    main()
