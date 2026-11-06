import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * RechartsRenderer - Renderiza gráficas matemáticas
 * Soporte para: line, bar, scatter
 */

export function RechartsRenderer({ visual }) {
  const { config, enrichedConfig } = visual;
  const title = enrichedConfig?.labels?.title || config?.title || "Gráfica";
  
  const data = config?.data || [
    { x: 0, y: 0 },
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
  ];

  const chartType = config?.chart_type || config?.type || "line";
  const xLabel = config?.x_label || "X";
  const yLabel = config?.y_label || "Y";
  const showGrid = config?.show_grid !== false;

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      
      <div className="h-56 w-full rounded-lg bg-white/5 p-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
              <XAxis 
                dataKey="x" 
                label={{ value: xLabel, position: "insideBottom", offset: -5 }}
                stroke="currentColor"
                opacity={0.5}
              />
              <YAxis 
                label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                stroke="currentColor"
                opacity={0.5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(0,0,0,0.8)", 
                  border: "none", 
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Bar dataKey="y" fill="#3B82F6" opacity={0.8} />
            </BarChart>
          ) : chartType === "scatter" ? (
            <ScatterChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
              <XAxis 
                dataKey="x" 
                label={{ value: xLabel, position: "insideBottom", offset: -5 }}
                stroke="currentColor"
                opacity={0.5}
              />
              <YAxis 
                label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                stroke="currentColor"
                opacity={0.5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(0,0,0,0.8)", 
                  border: "none", 
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Scatter dataKey="y" fill="#10B981" />
            </ScatterChart>
          ) : (
            <LineChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
              <XAxis 
                dataKey="x" 
                label={{ value: xLabel, position: "insideBottom", offset: -5 }}
                stroke="currentColor"
                opacity={0.5}
              />
              <YAxis 
                label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                stroke="currentColor"
                opacity={0.5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(0,0,0,0.8)", 
                  border: "none", 
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
