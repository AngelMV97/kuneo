# 4.2 — Variedad de tareas dentro de una práctica

Caso reportado: mismo experimento de tres vasos al sol con pequeñas variaciones, repetido como abierta, selección y relacionar. Variar formato no demuestra transferencia ni representación.

## Cambios

- `learningVariety.js`: orientación de tarea por dimensión y ocho contextos por materia, subordinados al grado y objetivo. La generación recibe una tarea concreta por turno; las preguntas anteriores se tratan como exclusiones, no plantillas.
- El revisor existente recibe ahora las últimas ocho preguntas, incluida la actividad pendiente cuando se usa lookahead. Puede rechazar repeticiones semánticas y solicitar una reparación dentro del límite ya existente. No se añade otro revisor ni se cambia de modelo.
- La reserva temporal y curricular no vuelve a entregar una pregunta exacta ya vista en el contexto disponible. Si no existe una alternativa válida, se mantiene el error recuperable; no se fabrica progreso ni se repite silenciosamente.
- La ruta calculada de sumas de primaria tampoco repite el mismo planteamiento de jornada de lectura con otras cifras; si ya se mostró, pasa por la generación normal.
- No se modifica el prefetch, la sesión de ocho, el currículo, las respuestas guardadas o Supabase. No se activa reordenamiento experimental.

## Ensayos y límites

`node scripts/quality/hito4-variety-live.cjs --run` ejecuta ocho actividades sintéticas de Ciencias, sin consultar ni escribir Supabase. Las respuestas parciales son exclusivamente datos sintéticos de encaminamiento; no se presentaron como evaluaciones de alumnos reales. Modelo de ensayo: gpt-4.1-mini; no cambia configuración de producción.

- `live-network-unavailable.json`: intento sin conectividad; cero tokens informados, no es evidencia de calidad.
- `live-initial.json`: 19 llamadas, 8 entregas. Detectado que una reserva reutilizó la pregunta del turno 2 en el 7. Corregido después con exclusión y prueba local.
- `live-second.json`: 20 llamadas, 8 entregas. Cambia escenarios pero siguen problemas de alineación de tarea y justificación. No aprobado.
- `live.json`: último ensayo, 16 llamadas, 8 entregas, sin repetir enunciados exactos, escenarios más diversos y planificación explícita en metacognición. Todavía **no aprobado como lote pedagógico**: cambiar escenario no basta para acreditar todas las dimensiones ni la veracidad de cada explicación.

La lectura manual detectó en los primeros ensayos: elección arbitraria de una hipótesis «mejor» cuando ambas reciben apoyo, propiedades de materiales inferidas sin aparecer en los datos, tareas de representación que volvían a pedir elegir hipótesis y objetivos de cambios físicos desviados hacia crecimiento biológico. Se reforzaron instrucciones de generación/revisión, pero el último ensayo conserva material por verificar: caracterización física de cambios de color (turnos 1–2), alcance curricular del consumo de agua (4), condiciones y seguridad del experimento sugerido (5), inferencias causales sin control suficiente (6) y plausibilidad de magnitudes térmicas (8). **No se certifican esos contenidos ni se publican como reserva.** Sus trazas se conservan para el siguiente lote de corrección; no basta con que el modelo los apruebe.

Las duraciones registradas son generaciones secuenciales de laboratorio, no tiempos de espera del estudiante con prefetch. No se afirma que se haya resuelto la latencia inicial. La revisión de variedad comparte las dos llamadas habituales; un rechazo puede consumir el reintento existente.

## Regresión reproducible

`server/learningVariety.test.js` comprueba las cinco materias, separación de actividad pendiente/evidencia del alumno, paso de exclusiones a generación y revisión, reparación antes de entrega, reserva ya vista y ruta calculada de primaria. La suite completa conserva pruebas de lookahead, persistencia y recuperación. Estos tests verifican el flujo; no sustituyen juicio pedagógico ni garantizan que un modelo nunca repita.

Sigue abierto 4.2. Este lote dinámico se registra separado del catálogo histórico: siguen 27 originales revisados, 27 reemplazos locales inactivos, 548 candidatos técnicos pendientes de auditoría pedagógica y cero publicados.
