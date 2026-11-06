import { useVisualTemplate } from "./hooks/useVisualTemplate";
import { normalizeVisualConfig } from "./utils/visualConfigNormalizer";
import { VisualRenderer } from "./VisualRenderer";
import { OverlayManager } from "./OverlayManager";

/**
 * VisualEngine - Motor principal de renderizado de visuales
 * 
 * @param {string} visualTemplateKey - template_key del visual
 * @param {string} cardVariant - Tipo de tarjeta (basic, hint, corrective, reflective, deepening)
 * @param {string} cognitiveType - Tipo cognitivo del step (representacion, analisis_de_error, etc.)
 * @param {string} misconceptionKey - Key del misconception específico (opcional)
 * @param {boolean} showCaption - Mostrar caption pedagógico
 * @param {boolean} showOverlay - Mostrar overlay adaptativo
 * 
 * @example
 * <VisualEngine
 *   visualTemplateKey="fraction_part_whole"
 *   cardVariant="corrective"
 *   cognitiveType="analisis_de_error"
 *   misconceptionKey="confunde_numerador_denominador"
 * />
 */

export function VisualEngine({
  visualTemplateKey,
  cardVariant = "basic",
  cognitiveType = "representacion",
  misconceptionKey = null,
  showCaption = true,
  showOverlay = true,
  className = "",
}) {
  const { template, loading, error } = useVisualTemplate(visualTemplateKey);

  // Estados de carga
  if (!visualTemplateKey) {
    return null;
  }

  if (loading) {
    return (
      <div className={`animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="mt-4 h-48 rounded bg-white/10" />
        <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 ${className}`}>
        <p className="font-medium">Error al cargar visual</p>
        <p className="mt-1 text-xs opacity-70">{error}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className={`rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-300 ${className}`}>
        <p>Visual no disponible</p>
        <p className="mt-1 text-xs opacity-70">Template: {visualTemplateKey}</p>
      </div>
    );
  }

  // Normalizar configuración
  const visual = normalizeVisualConfig(template);

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>
      {/* Renderizar visual */}
      <VisualRenderer visual={visual} />

      {/* Overlay adaptativo */}
      {showOverlay && (
        <OverlayManager
          enrichedConfig={visual.enrichedConfig}
          cardVariant={cardVariant}
          cognitiveType={cognitiveType}
          misconceptionKey={misconceptionKey}
        />
      )}

      {/* Caption pedagógico */}
      {showCaption && visual.caption && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {visual.caption}
        </p>
      )}

      {/* Accessibility text (hidden, solo para screen readers) */}
      {visual.accessibilityText && (
        <p className="sr-only">{visual.accessibilityText}</p>
      )}

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Debug Info
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-black/20 p-2 text-xs">
            {JSON.stringify(
              {
                templateKey: visual.templateKey,
                renderer: visual.renderer,
                visualType: visual.visualType,
                interactionLevel: visual.interactionLevel,
                cardVariant,
                cognitiveType,
                misconceptionKey,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
