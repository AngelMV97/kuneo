/**
 * Visual Engine Runtime - Sistema de renderizado dinámico de visuales
 * 
 * Exporta:
 * - VisualEngine: Componente principal
 * - useVisualTemplate: Hook para cargar templates
 * - normalizeVisualConfig: Utilidad de normalización
 */

export { VisualEngine } from "./VisualEngine";
export { VisualRenderer } from "./VisualRenderer";
export { OverlayManager } from "./OverlayManager";
export { useVisualTemplate } from "./hooks/useVisualTemplate";
export { normalizeVisualConfig } from "./utils/visualConfigNormalizer";
export { 
  isRendererSupported, 
  getRendererName, 
  getSupportedRenderersList 
} from "./utils/rendererMapper";
