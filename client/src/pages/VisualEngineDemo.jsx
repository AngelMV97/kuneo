import { useState } from "react";
import { VisualEngine } from "../visual-engine";

/**
 * VisualEngineDemo - Componente de ejemplo para probar el Visual Engine
 * Muestra diferentes renderers, card variants y misconceptions
 */

export function VisualEngineDemo() {
  const [selectedTemplate, setSelectedTemplate] = useState("fraction_part_whole");
  const [cardVariant, setCardVariant] = useState("basic");
  const [misconceptionKey, setMisconceptionKey] = useState(null);

  const templates = [
    { key: "fraction_part_whole", name: "Fracción Parte/Todo", renderer: "svg_custom" },
    { key: "angle_measurement", name: "Medición de Ángulos", renderer: "svg_custom" },
    { key: "equation_balance", name: "Balance de Ecuación", renderer: "svg_custom" },
    { key: "proportional_relationship", name: "Relación Proporcional", renderer: "recharts" },
    { key: "data_visualization", name: "Visualización de Datos", renderer: "recharts" },
    { key: "timeline", name: "Línea de Tiempo", renderer: "timeline" },
  ];

  const variants = ["basic", "hint", "corrective", "reflective", "deepening"];
  
  const misconceptions = [
    { key: null, name: "Ninguno" },
    { key: "confunde_numerador_denominador", name: "Confunde numerador/denominador" },
    { key: "no_cuenta_todas_las_partes", name: "No cuenta todas las partes" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-white">
          🎨 Visual Engine Runtime Demo
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Controls */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold text-white">Visual Template</h2>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
              >
                {templates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.name} ({template.renderer})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold text-white">Card Variant</h2>
              <div className="space-y-2">
                {variants.map((variant) => (
                  <label key={variant} className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="radio"
                      name="variant"
                      value={variant}
                      checked={cardVariant === variant}
                      onChange={(e) => setCardVariant(e.target.value)}
                      className="text-blue-500"
                    />
                    {variant}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="mb-3 text-lg font-semibold text-white">Misconception</h2>
              <div className="space-y-2">
                {misconceptions.map((misconception) => (
                  <label key={misconception.key || "none"} className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="radio"
                      name="misconception"
                      value={misconception.key || ""}
                      checked={misconceptionKey === misconception.key}
                      onChange={(e) => setMisconceptionKey(e.target.value || null)}
                      className="text-blue-500"
                    />
                    {misconception.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300">
              <p className="font-medium">ℹ️ MVP Soportado:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>✅ svg_custom</li>
                <li>✅ recharts</li>
                <li>✅ timeline</li>
                <li>✅ overlays básicos</li>
                <li>✅ captions</li>
                <li>❌ react_flow (post-MVP)</li>
                <li>❌ animaciones (post-MVP)</li>
              </ul>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Preview</h2>
              
              <VisualEngine
                visualTemplateKey={selectedTemplate}
                cardVariant={cardVariant}
                cognitiveType="representacion"
                misconceptionKey={misconceptionKey}
                showCaption={true}
                showOverlay={true}
              />

              <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-medium text-white/60">Configuración Actual:</p>
                <pre className="mt-2 text-xs text-white/80">
                  {JSON.stringify(
                    {
                      visualTemplateKey: selectedTemplate,
                      cardVariant,
                      misconceptionKey: misconceptionKey || "null",
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Uso en Código</h2>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-sm text-green-300">
            {`import { VisualEngine } from './visual-engine';

<VisualEngine
  visualTemplateKey="${selectedTemplate}"
  cardVariant="${cardVariant}"
  cognitiveType="representacion"
  misconceptionKey="${misconceptionKey || "null"}"
  showCaption={true}
  showOverlay={true}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
