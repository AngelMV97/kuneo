/**
 * Mapea renderer type a componente React
 * Útil para validación y debugging
 */

export const SUPPORTED_RENDERERS = {
  svg_custom: "SvgCustomRenderer",
  recharts: "RechartsRenderer",
  timeline: "TimelineRenderer",
  // Post-MVP:
  // react_flow: "ReactFlowRenderer",
  // concept_map: "ConceptMapRenderer",
  // mermaid: "MermaidRenderer",
};

export function isRendererSupported(renderer) {
  return renderer in SUPPORTED_RENDERERS;
}

export function getRendererName(renderer) {
  return SUPPORTED_RENDERERS[renderer] || "UnsupportedRenderer";
}

export function getSupportedRenderersList() {
  return Object.keys(SUPPORTED_RENDERERS);
}
