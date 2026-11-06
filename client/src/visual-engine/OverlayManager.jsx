/**
 * OverlayManager - Decide qué overlay mostrar
 * Prioridad:
 * 1. misconception overlay (si hay misconceptionKey)
 * 2. overlay por cardVariant (corrective, hint, etc.)
 * 3. explanation overlay
 * 4. ninguno
 */

export function OverlayManager({
  enrichedConfig,
  cardVariant = "basic",
  cognitiveType,
  misconceptionKey = null,
}) {
  const overlays = enrichedConfig?.overlays || {};

  // 1. Buscar overlay específico de misconception
  if (misconceptionKey && overlays?.misconception) {
    const misconceptionOverlay = overlays.misconception.find(
      (item) => item.misconception_key === misconceptionKey
    );

    if (misconceptionOverlay) {
      return (
        <OverlayCard
          type="misconception"
          message={misconceptionOverlay.message}
          visualAction={misconceptionOverlay.visual_action}
          cardVariant={misconceptionOverlay.card_variant}
        />
      );
    }
  }

  // 2. Overlay por cardVariant
  const variantOverlays = overlays?.[cardVariant];
  if (variantOverlays && variantOverlays.length > 0) {
    const overlay = variantOverlays[0];
    return (
      <OverlayCard
        type={cardVariant}
        message={overlay.message || overlay.explanation}
        visualAction={overlay.visual_action}
      />
    );
  }

  // 3. Overlay de explanation (fallback)
  if (overlays?.explanation && overlays.explanation.length > 0) {
    const overlay = overlays.explanation[0];
    return (
      <OverlayCard
        type="explanation"
        message={overlay.message}
        visualAction={overlay.visual_action}
      />
    );
  }

  // 4. Sin overlay
  return null;
}

function OverlayCard({ type, message, visualAction, cardVariant }) {
  const styles = {
    misconception: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300",
    corrective: "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300",
    hint: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    explanation: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
    reflective: "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300",
  };

  const icons = {
    misconception: "⚠️",
    corrective: "🔧",
    hint: "💡",
    explanation: "ℹ️",
    reflective: "🤔",
  };

  const style = styles[type] || styles.explanation;
  const icon = icons[type] || icons.explanation;

  return (
    <div className={`mt-3 rounded-xl border p-3 text-sm ${style}`}>
      <div className="flex items-start gap-2">
        <span className="text-base">{icon}</span>
        <div className="flex-1">
          <p>{message}</p>
          {visualAction && (
            <p className="mt-1 text-xs opacity-60">
              Acción visual: {visualAction}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
