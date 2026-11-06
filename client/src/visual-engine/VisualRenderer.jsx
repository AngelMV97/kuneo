import { SvgCustomRenderer } from "./renderers/SvgCustomRenderer";
import { RechartsRenderer } from "./renderers/RechartsRenderer";
import { TimelineRenderer } from "./renderers/TimelineRenderer";
import { isRendererSupported, getRendererName } from "./utils/rendererMapper";

/**
 * VisualRenderer - Router de renderers
 * Decide qué componente usar según visual.renderer
 */

export function VisualRenderer({ visual }) {
  if (!visual) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
        Error: Visual no proporcionado
      </div>
    );
  }

  const renderer = visual.renderer;

  // Validar soporte
  if (!isRendererSupported(renderer)) {
    return (
      <div className="rounded-lg bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
        <p className="font-medium">Renderer no soportado todavía: {renderer}</p>
        <p className="mt-1 text-xs opacity-70">
          Componente: {getRendererName(renderer)}
        </p>
        <p className="mt-2 text-xs opacity-70">
          Template: {visual.templateKey}
        </p>
      </div>
    );
  }

  // Renderizar según tipo
  switch (renderer) {
    case "svg_custom":
      return <SvgCustomRenderer visual={visual} />;

    case "recharts":
      return <RechartsRenderer visual={visual} />;

    case "timeline":
      return <TimelineRenderer visual={visual} />;

    // Post-MVP renderers:
    // case "react_flow":
    //   return <ReactFlowRenderer visual={visual} />;
    
    // case "concept_map":
    //   return <ConceptMapRenderer visual={visual} />;
    
    // case "mermaid":
    //   return <MermaidRenderer visual={visual} />;

    default:
      return (
        <div className="rounded-lg bg-gray-500/10 p-4 text-sm text-gray-600 dark:text-gray-400">
          Renderer desconocido: {renderer}
        </div>
      );
  }
}
