/**
 * TimelineRenderer - Renderiza líneas de tiempo
 * Soporte para: eventos históricos, procesos secuenciales
 */

export function TimelineRenderer({ visual }) {
  const { config, enrichedConfig } = visual;
  const title = enrichedConfig?.labels?.title || config?.title || "Línea de Tiempo";
  
  const events = config?.events || [
    { label: "Inicio", description: "Primer momento", date: "" },
    { label: "Desarrollo", description: "Proceso principal", date: "" },
    { label: "Conclusión", description: "Resultado final", date: "" },
  ];

  const orientation = config?.orientation || "vertical";

  if (orientation === "horizontal") {
    return <HorizontalTimeline title={title} events={events} />;
  }

  return <VerticalTimeline title={title} events={events} />;
}

function VerticalTimeline({ title, events }) {
  return (
    <div className="w-full">
      <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-medium text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
                {index + 1}
              </div>
              {index < events.length - 1 && (
                <div className="h-full w-0.5 bg-blue-500/30 dark:bg-blue-400/30" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-4">
              <div className="rounded-lg bg-white/5 p-3">
                {event.date && (
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {event.date}
                  </p>
                )}
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {event.label}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalTimeline({ title, events }) {
  return (
    <div className="w-full">
      <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {events.map((event, index) => (
            <div key={index} className="relative flex flex-col items-center">
              {/* Connector line */}
              {index < events.length - 1 && (
                <div className="absolute left-1/2 top-4 h-0.5 w-full bg-blue-500/30 dark:bg-blue-400/30" />
              )}

              {/* Event marker */}
              <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-medium text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
                {index + 1}
              </div>

              {/* Event content */}
              <div className="mt-3 w-40 rounded-lg bg-white/5 p-3 text-center">
                {event.date && (
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {event.date}
                  </p>
                )}
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {event.label}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
