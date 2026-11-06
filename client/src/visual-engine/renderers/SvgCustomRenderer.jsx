/**
 * SvgCustomRenderer - Renderiza SVG personalizados
 * Soporte para: fracciones, geometría, diagramas simples
 */

export function SvgCustomRenderer({ visual }) {
  const { config, enrichedConfig, templateKey } = visual;
  const title = enrichedConfig?.labels?.title || config?.title || "Visual";
  const labels = enrichedConfig?.labels?.elements || [];

  // Detectar tipo de SVG según template_key
  if (templateKey?.includes("fraction")) {
    return <FractionVisual config={config} title={title} labels={labels} />;
  }

  if (templateKey?.includes("angle") || templateKey?.includes("geometric")) {
    return <GeometricVisual config={config} title={title} labels={labels} />;
  }

  if (templateKey?.includes("equation")) {
    return <EquationVisual config={config} title={title} labels={labels} />;
  }

  // Fallback genérico
  return <GenericSvgVisual config={config} title={title} labels={labels} />;
}

// Fracciones (parte/todo)
function FractionVisual({ config, title, labels }) {
  const parts = config?.parts || 4;
  const highlighted = config?.highlighted || 1;
  const shape = config?.shape || "circle";
  const colors = config?.colors || ["#3B82F6", "#E5E7EB"];

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      
      <svg viewBox="0 0 300 200" className="h-48 w-full">
        {shape === "circle" ? (
          <g>
            <circle cx="150" cy="100" r="70" fill={colors[1]} stroke="currentColor" strokeWidth="2" opacity="0.3" />
            {Array.from({ length: parts }).map((_, i) => {
              const angle = (360 / parts) * i - 90;
              const nextAngle = (360 / parts) * (i + 1) - 90;
              const isHighlighted = i < highlighted;

              const x1 = 150 + 70 * Math.cos((angle * Math.PI) / 180);
              const y1 = 100 + 70 * Math.sin((angle * Math.PI) / 180);
              const x2 = 150 + 70 * Math.cos((nextAngle * Math.PI) / 180);
              const y2 = 100 + 70 * Math.sin((nextAngle * Math.PI) / 180);

              return (
                <path
                  key={i}
                  d={`M 150 100 L ${x1} ${y1} A 70 70 0 0 1 ${x2} ${y2} Z`}
                  fill={isHighlighted ? colors[0] : "transparent"}
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity={isHighlighted ? 0.8 : 0.2}
                />
              );
            })}
          </g>
        ) : (
          <g>
            {Array.from({ length: parts }).map((_, i) => {
              const width = 240 / parts;
              const isHighlighted = i < highlighted;
              return (
                <rect
                  key={i}
                  x={30 + i * width}
                  y="60"
                  width={width - 4}
                  height="80"
                  rx="4"
                  fill={isHighlighted ? colors[0] : colors[1]}
                  opacity={isHighlighted ? 0.8 : 0.3}
                  stroke="currentColor"
                  strokeWidth="2"
                />
              );
            })}
          </g>
        )}

        {/* Labels */}
        {config?.labels && (
          <text x="150" y="185" textAnchor="middle" className="text-xs fill-current">
            {highlighted}/{parts}
          </text>
        )}
      </svg>
    </div>
  );
}

// Geometría (ángulos, figuras)
function GeometricVisual({ config, title }) {
  const showProtractor = config?.showProtractor;
  const angle = config?.angle || 45;

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      
      <svg viewBox="0 0 300 200" className="h-48 w-full">
        {/* Base line */}
        <line x1="50" y1="150" x2="250" y2="150" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        
        {/* Angle arc */}
        <path
          d={`M 180 150 A 50 50 0 0 1 ${180 + 50 * Math.cos((angle * Math.PI) / 180)} ${150 - 50 * Math.sin((angle * Math.PI) / 180)}`}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          opacity="0.7"
        />
        
        {/* Angle line */}
        <line
          x1="180"
          y1="150"
          x2={180 + 120 * Math.cos((angle * Math.PI) / 180)}
          y2={150 - 120 * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        
        {/* Angle label */}
        <text x="200" y="140" className="text-sm fill-current font-medium">
          {angle}°
        </text>
        
        {showProtractor && (
          <path
            d="M 130 150 A 50 50 0 0 1 230 150"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.3"
          />
        )}
      </svg>
    </div>
  );
}

// Ecuaciones (balance)
function EquationVisual({ config, title }) {
  const leftSide = config?.leftSide || "x + 3";
  const rightSide = config?.rightSide || "7";

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      
      <svg viewBox="0 0 300 200" className="h-48 w-full">
        {/* Balance base */}
        <line x1="100" y1="120" x2="200" y2="120" stroke="currentColor" strokeWidth="3" />
        <line x1="150" y1="120" x2="150" y2="160" stroke="currentColor" strokeWidth="3" />
        <circle cx="150" cy="165" r="5" fill="currentColor" />
        
        {/* Left side */}
        <rect x="80" y="80" width="60" height="35" rx="4" fill="#3B82F6" opacity="0.7" />
        <text x="110" y="102" textAnchor="middle" className="text-sm fill-white font-medium">
          {leftSide}
        </text>
        
        {/* Right side */}
        <rect x="160" y="80" width="60" height="35" rx="4" fill="#10B981" opacity="0.7" />
        <text x="190" y="102" textAnchor="middle" className="text-sm fill-white font-medium">
          {rightSide}
        </text>
      </svg>
    </div>
  );
}

// Genérico (placeholder)
function GenericSvgVisual({ title }) {
  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      
      <svg viewBox="0 0 300 180" className="h-44 w-full">
        <rect x="20" y="30" width="260" height="120" rx="16" fill="currentColor" opacity="0.08" />
        <circle cx="90" cy="90" r="32" fill="currentColor" opacity="0.25" />
        <circle cx="150" cy="90" r="32" fill="currentColor" opacity="0.12" />
        <circle cx="210" cy="90" r="32" fill="currentColor" opacity="0.12" />
        <text x="150" y="95" textAnchor="middle" className="text-xs fill-current opacity-40">
          SVG Visual
        </text>
      </svg>
    </div>
  );
}
