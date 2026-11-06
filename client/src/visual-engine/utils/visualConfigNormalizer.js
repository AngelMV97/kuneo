/**
 * Normaliza config + enriched_config de un visual_template
 * @param {object} template - Template desde Supabase
 * @returns {object} Visual normalizado
 */
export function normalizeVisualConfig(template) {
  if (!template) return null;

  const config = template.config || {};
  const enriched = template.enriched_config || {};

  return {
    templateKey: template.template_key,
    templateName: template.template_name,
    renderer: template.renderer,
    visualType: template.visual_type,
    interactionLevel: template.interaction_level || "static",
    
    // Configuraciones base
    config,
    enrichedConfig: enriched,
    
    // Pedagogical visual
    caption:
      enriched?.pedagogical_visual?.caption ||
      config?.caption ||
      template.description ||
      "",
    mainQuestion: enriched?.pedagogical_visual?.main_question || "",
    studentFocus: enriched?.pedagogical_visual?.student_focus || "",
    accessibilityText:
      enriched?.pedagogical_visual?.accessibility_text || 
      config?.accessibility_text ||
      "",
    
    // Labels
    labels: enriched?.labels || config?.labels || {},
    
    // Overlays
    overlays: enriched?.overlays || {},
    
    // Animation steps
    animationSteps: enriched?.animation_steps || [],
    
    // Interaction rules
    interactionRules: enriched?.interaction_rules || {},
    
    // Usage by card type
    usageByCardType: enriched?.usage_by_card_type || {},
    
    // Metadata
    metadata: enriched?.metadata || {},
  };
}
