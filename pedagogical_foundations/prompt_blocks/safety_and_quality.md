# Safety, Quality, and Content Validation Rules

## Purpose

Ensure all generated content is **safe, accurate, culturally sensitive, and pedagogically sound**. These rules act as validation checkpoints before any content is saved to the database.

---

## Safety Rules (MUST COMPLY)

### ❌ Content Must NEVER Include:

1. **Violence or Disturbing Scenarios**
   - No graphic descriptions of harm, death, injury, or conflict
   - Avoid war, disaster, or traumatic contexts unless pedagogically essential (e.g., historical events)

2. **Punitive or Stress-Inducing Language**
   - No "You must" or "If you fail..."
   - No timed tests with scary consequences
   - No shaming or blame

3. **Inappropriate Topics**
   - No political propaganda
   - No religious proselytizing
   - No commercial advertising
   - No discriminatory content (racism, sexism, ableism, etc.)

4. **Unsafe Instructions**
   - No instructions that could cause physical harm (e.g., dangerous experiments)
   - No advice on bypassing safety measures

---

## Quality Validation Checklist

### ✅ 1. **Age-Appropriate Language**

| Grade Range | Vocabulary | Sentence Complexity | Context |
|-------------|------------|---------------------|---------|
| **4-5** | Simple, concrete | Short (max 10 words/sentence) | Familiar, visual |
| **6-7** | Accessible, some technical | Moderate (max 15 words/sentence) | School + everyday |
| **8-9** | Technical with explanations | Standard (max 20 words/sentence) | Diverse, some abstract |
| **10-11** | Academic, technical | Complex allowed | Abstract + applied |

**Validation:** Does the language match the grade_range?

---

### ✅ 2. **Factual Accuracy**

- All factual claims must be verifiable
- Align with Colombian curricular standards (MEN)
- No outdated scientific information (e.g., "Pluto is a planet")
- No unverified historical claims

**Validation:** Is the content factually correct according to current standards?

---

### ✅ 3. **Cultural Sensitivity**

#### **Names in Examples:**
- Use diverse Latinoamerican names
- Gender-balanced representation
- No stereotypical name-activity associations (e.g., "María always cooks")

#### **Contexts in Problems:**
- School scenarios (accessible to all)
- Everyday situations (shopping, cooking, playing)
- Family contexts (diverse family structures: single-parent, extended, etc.)
- Community contexts (urban AND rural)

#### **Avoid:**
- Assumptions about socioeconomic status ("Everyone has a car")
- Stereotypes ("All farmers are poor", "All doctors are wealthy")
- Culturally exclusive references (sports only popular in certain regions)
- Gender role stereotypes ("Only moms cook", "Only dads work")

**Validation:** Is the content inclusive and free of stereotypes?

---

### ✅ 4. **Brevity**

- **Prompts:** Max 2-3 sentences
- **Hints (short_hint):** Max 35 words
- **Cards:** Max 50 words
- **Feedback:** Max 20-30 words

**Validation:** Is the content concise and to the point?

---

### ✅ 5. **Pedagogical Coherence**

- Does the content align with Kuneo's **8 core principles**? (See system_pedagogy.md)
- Does it respect the **cognitive progression** (exploración → metacognición)?
- Does it promote **reasoning over recall**?
- Does it treat **errors as information, not failure**?

**Validation:** Is the content pedagogically aligned?

---

### ✅ 6. **Preservation of Structure**

Ensure the following fields are **NEVER modified** during enrichment:

🔒 **subject** (matematicas, ciencias, sociales, lenguaje, ingles)  
🔒 **grade_range** (4-5, 6-7, 8-9, 10-11)  
🔒 **competency_unit**  
🔒 **core_concept**  
🔒 **cognitive_type** (exploracion, representacion, etc.)  
🔒 **module_step_sequence** (steps 1-8)  
🔒 **visual_template_key**  
🔒 **concept_card_id**

**Validation:** Are all structural fields preserved?

---

### ✅ 7. **Non-Punitive Tone**

- No words like: "wrong", "incorrect", "failed", "bad"
- No shame-inducing language: "You should know this", "Everyone else got it"
- No pressure: "Hurry up", "You're taking too long"

**Validation:** Is the tone formative and empathetic?

---

## Validation Process (Before Saving)

### Step-by-Step Validation:

1. **Load pedagogical_foundations before enrichment**
   - Load all JSON policies
   - Load all prompt_blocks
   - Inject into system prompt

2. **Generate content with LLM**

3. **Validate against safety rules**
   - Check for prohibited content (violence, punitive language, stereotypes)
   - If FAIL → REJECT, do not save

4. **Validate against quality checklist**
   - Age-appropriate language?
   - Factually accurate?
   - Culturally sensitive?
   - Brief?
   - Pedagogically coherent?
   - Structural fields preserved?
   - Non-punitive tone?

5. **Validate against JSON schemas** (if applicable)
   - Does enriched_step match enriched_step.schema.json?
   - Does enriched_concept_card match enriched_concept_card.schema.json?
   - Does enriched_visual_template match enriched_visual_template.schema.json?

6. **If all validations pass → SAVE**

7. **If any validation fails → REGENERATE or REJECT**

---

## Alert Cases (Flag for Human Review)

Some content may require human oversight even if it passes automated checks:

### 🚨 Flag for Review:

1. **Sensitive Historical Topics**
   - Colonization, slavery, dictatorship, war
   - **Why:** Requires nuanced, age-appropriate framing

2. **Evolution or Religious Topics**
   - Evolution, origin of universe, religious diversity
   - **Why:** Must be factual but respectful of diverse beliefs

3. **Gender or Sexual Topics**
   - Reproductive biology, gender identity
   - **Why:** Must be age-appropriate and inclusive

4. **Socioeconomic Inequality**
   - Poverty, wealth disparity
   - **Why:** Must avoid stereotypes or stigmatizing language

5. **Repeated Student Struggle Patterns**
   - Student showing signs of persistent misconception or frustration
   - **Why:** May need human teacher intervention

---

## Socioemotional Quality

Content should promote:

✅ **Autonomy:** Student feels in control  
✅ **Empathy:** Recognize emotions (frustration, joy, confusion)  
✅ **Inclusivity:** Diverse contexts, no stereotypes  
✅ **Encouragement:** Specific acknowledgment, not empty praise  
✅ **Growth Mindset:** Frame errors as learning opportunities

(See socioemotional_policy.json for detailed rules)

---

## Testing and Monitoring

### During Development:
- Test with sample content from all grade ranges
- Test with diverse student personas (struggling, excelling, bored)
- Test for edge cases (very long responses, very short responses, gibberish)

### After Deployment:
- Monitor for unexpected patterns (e.g., all students struggling on same step)
- Collect feedback from teachers and students
- Regularly audit generated content for quality and safety

---

## Emergency Protocols

### If Unsafe Content is Detected:
1. **Immediate:** Remove from database
2. **Alert:** Flag for human review
3. **Investigate:** Determine how it passed validation
4. **Fix:** Update validation rules to prevent recurrence

### If Factually Incorrect Content is Detected:
1. **Immediate:** Mark for correction
2. **Review:** Verify correct information with MEN standards
3. **Update:** Regenerate with correct information
4. **Test:** Ensure correction propagates to all affected modules

---

**Remember:** These rules exist to protect students and maintain Kuneo's commitment to high-quality, inclusive, empowering education. When in doubt, err on the side of caution and flag for human review.
