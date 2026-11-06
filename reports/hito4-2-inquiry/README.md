# 4.2 — Indagación, relaciones inválidas y anticipación (2026-11-06)

## Diagnóstico y alcance

El mismo título genérico «¿Cómo funciona ciencias_naturales?» corresponde a numerosos objetivos del snapshot. No se identifica de forma única el módulo o el grado de la cuenta del usuario por la captura. Se confirmó en el catálogo la competencia general «Formulo hipótesis, con base en el conocimiento cotidiano, teorías y modelos científicos» de 8–9 y su variante sin coma de 10–11. No debe confundirse con las competencias específicas de extinción o evolución.

Las correcciones previas basadas solo en instrucciones de variedad no eran suficientes. Las preguntas de experimentos anteriores seguían sirviendo de ancla. Ahora `learningInquiry.js` proporciona ocho casos de partida independientes y datos simulados para esos objetivos generales de proceso. El generador redacta la actividad, las alternativas, rúbricas y feedback; el revisor conserva su función. Los casos no son actividades de reserva publicadas ni un banco persistente. La selección por turno se comparte con lookahead, contando la pregunta pendiente como exclusión, sin inventar una respuesta del alumno. El ámbito se limita expresamente a objetivos generales de proceso; no desplaza el tema de una lección de evaporación, extinción u otro contenido específico.

Se conservan por separado lectura manual, prueba del evaluador y aprobación del modelo. No se certifica toda la materia ni el catálogo por haber generado ocho actividades.

## Correcciones de las capturas

- Tablas de alternativas con varias columnas: se rechazan si duplican controles o presentan una segunda lista de respuestas rotuladas. No se borran tablas de mediciones necesarias ni se usa coincidencia semántica imprecisa para recortar el enunciado.
- Una consigna de relacionar no puede pedir simultáneamente estudiante, fortaleza y error con controles de dos columnas. Se rechaza y se pide una tarea con una sola relación o una abierta.
- Se rechazan controles con asignaciones de solución, claves técnicas, notas internas y varios elementos agrupados como una sola opción.
- Los casos de indagación se presentan como simulados. No se publica una sustitución a mitad de la actividad; la validación y reparación ocurren antes de entregarla. Las preguntas ya firmadas se conservan.

## Prefetch y límites de latencia

Se reprodujo una limitación real en una prueba completa: al cerrar la primera vuelta de habilidades, distintos resultados llevan a habilidades siguientes diferentes. El planificador anterior esperaba, incluso cuando el paso curricular permanecía estable.

Ahora puede anticipar **una sola** candidata de otra habilidad para la ruta más frecuente entre las simulaciones de encaminamiento. No genera ramas completas ni predice una respuesta del estudiante. La candidata se reutiliza únicamente si la respuesta realmente guardada selecciona ese mismo paso, habilidad y formato, y coinciden usuario, actividad previa, grado, currículo y evidencia anterior. Si el paso puede cambiar o el módulo puede completarse, se mantiene la espera. Tampoco anticipa un refuerzo de la misma habilidad que necesita feedback. Si el resultado real selecciona otra ruta, se descarta la candidata.

Pruebas HTTP con servicios sintéticos diferidos cubren ocho actividades más reinicio, candidatos ya preparados, respuestas guardadas una sola vez y descarte de una candidata condicional cuando la habilidad real difiere. No se añade una cola ilimitada ni se modifica la sesión de ocho.

Se agregaron mediciones separadas de cola por usuario, espera de lookahead y motivos de no anticipación. Una actividad esperada de lookahead ya no se cuenta como una generación fría. «Request was aborted» tiene categoría timeout en lugar de unknown. Estas mediciones no eliminan el tiempo del proveedor; una candidata no terminada, rechazada o descartada todavía puede producir espera. No se promete latencia cero ni se considera resuelta la primera entrada.

## Evidencia del lote

`live-rejected-scope.json` conserva un ensayo descartado: se seleccionó por error el objetivo específico de extinción y el filtro de alcance fue demasiado amplio. Se corrigieron tanto el filtro como la selección del ensayo; ese archivo NO es prueba de contenido apto. También registra un aborto de proveedor a los 22 segundos. Una prueba local impide aplicar el nuevo caso general a esa competencia de extinción.

`live.json`: ocho entregas reales con gpt-4.1-mini, 16 llamadas, objetivo general de 10–11 (`ff3f722e-1646-43a5-bf73-c0434421ac75`). El resultado no identifica la cuenta o práctica del usuario. Duraciones de generación y revisión secuenciales: aproximadamente 5–7 segundos por actividad; no representan espera de navegador con anticipación. No se cambió el modelo de producción.

En la pregunta 4 se detectaron descripciones de emparejamiento demasiado parecidas y resultados inventados para una observación aún no realizada. Se reemplazó su caso por tres diseños explícitos (cambian dos variables, solo distancia o solo volumen), cada uno con alcance distinto. `live-slot-4.json` conserva la comprobación enfocada de esa reparación: dos llamadas, una entrega. El lote verificado combina los otros siete turnos de `live.json` con esta revisión del cuarto turno. No oculta ni sobrescribe el primer resultado.

`verification.json`: ocho preguntas con huellas, ocho casos diferentes, claves cerradas contrastadas y 50 combinaciones evaluadas localmente. Rúbricas abiertas revisadas por lectura; **no se probaron respuestas reales de alumnos ni evaluaciones abiertas reales en este lote**. No se publicaron estas actividades ni se incorporaron al banco de reserva.

Reproducción sin red:

```powershell
node scripts/quality/hito4-inquiry-check.cjs
cd server
npm test
```

Las pruebas de red son opcionales y acotadas (`hito4-variety-live.cjs --run --inquiry`, o `--slot=4` para una sola pregunta); no se ejecutan con `npm test` ni consultan Supabase. El script completo escribe un nuevo ensayo; conservar la evidencia anterior antes de repetirlo.

## Estado de 4.2

Este es un lote dinámico separado. Se mantienen los conteos del catálogo: 27 originales auditados/excluidos, 27 reemplazos locales inactivos, 548 candidatos técnicos pendientes de auditoría pedagógica, cero publicados. Quedan la ampliación por lotes, la comprobación curricular y factual de materiales asociados, y la reserva persistente/versionada de 4.4. Ocho casos de partida no equivalen a actividad infinita ni a un catálogo aprobado; su ampliación también necesita revisión.
