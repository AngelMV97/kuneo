# Prácticas finitas, formatos y generación progresiva — 4 de noviembre de 2026

## Comportamiento

Cada práctica tiene un objetivo de ocho actividades respondidas y ofrece **Finalizar práctica** desde el encabezado. Después de cada respuesta se puede continuar o finalizar antes. En la octava se ofrece **Ver resumen de la práctica**, sin preparar una novena automáticamente. **Comenzar otra práctica** reinicia el contador. Consolidar el módulo sigue requiriendo evidencia por objetivos y habilidades; finalizar una práctica no equivale a dominarlo.

El resumen calcula, a partir de los intentos guardados de ese usuario y módulo: correctas/parciales/por revisar, tiempo registrado, niveles de ayuda, habilidades observadas, fortalezas con evidencia repetida y prioridades de mejora. Recomienda estrategias según la materia y la necesidad de practicar sin pistas. Es una síntesis determinista basada en evaluaciones guardadas, no una nueva calificación subjetiva ni diagnóstico. No atribuye fortalezas a habilidades que no se evaluaron. El resumen depende de la exactitud de las evaluaciones originales.

El navegador conserva los IDs de la práctica en sessionStorage, separados por usuario y módulo. La práctica finalizada vuelve a su resumen al recargar la misma pestaña. No se creó una tabla de sesiones; otro dispositivo o una pestaña nueva no comparte ese estado. Los intentos y el progreso global sí permanecen en Supabase. La respuesta escrita aún no enviada no se considera evidencia guardada. Una interrupción antes de que el navegador reciba el ID de un intento puede dejar ese intento fuera del resumen local, aunque permanezca en el historial global.

## Evaluación y calidad

Se separaron los modelos de actividad/evaluación/apoyo y se fortaleció la evaluación para reconocer evidencia literal de la respuesta y exigir solamente lo pedido. Las mejoras opcionales no deben convertir una respuesta correcta en parcial. La referencia también puede estar equivocada: se solicita comprobación independiente.

Se añadió un comprobador determinista estrecho de expresiones lineales para preguntas que piden simplificar, sin pedir explicación. Maneja suma/resta, productos por constantes, división por constante y paréntesis de una variable, sin eval. Verifica contra la expresión original, no contra una referencia potencialmente incorrecta. Acepta `2a+24` y `9p-41` en los casos del usuario; expresiones fuera de ese dominio o tareas que exigen justificar vuelven al evaluador. No es un sistema algebraico general.

Batería real con OpenAI: **33/33 clasificaciones de referencia coinciden**, frente a 28/30 en la medición previa. Incluye la respuesta del hielo, transferencia de calor y punto de fusión, ahora reconocida como correcta, y las respuestas incompleta/equivocada de contraste. No certifica exactitud universal ni reevalúa intentos históricos guardados. Informe: `reports/hito0-evaluation-after.json`; versión anterior conservada aparte.

Antes de publicar una actividad generada se revisan autocontención, clave, rúbrica y ausencia de hechos falsos. Si falla el contrato o la revisión, se permite una regeneración guiada; después se usa reserva evaluable o se devuelve un error recuperable. No se devuelve una calificación inventada cuando falla un proveedor.

## Cuatro formatos

El motor solicita alternancia entre selección única, respuesta abierta, selección de varias correctas y relacionar columnas, ajustada a la habilidad y la materia. Se permite una abierta si el formato solicitado no permite evaluar honestamente el objetivo. Las selecciones y parejas se evalúan por sus claves estructuradas, con validación de índices, unicidad y completitud; las parejas nuevas se conservan legibles en el historial. Las explicaciones abiertas siguen usando rúbrica.

En el piloto se detectaron claves inconsistentes que la revisión rechazó. Las sumas de enteros en relacionar columnas de primaria (grados 1–5, con objetivo explícito de suma y sin fracciones/álgebra) ahora se generan y calculan localmente, con totales distintos y correspondencias exactas, sin depender de que el modelo cuente emojis o redacte otra suma. No se aplica este generador a otras materias ni a currículo avanzado. Se identifican internamente como `source=computed` y se muestran como actividad personalizada.

## Generación progresiva y latencia

El cliente consume NDJSON autenticado. Se ven fragmentos reales de OpenAI, sin animación artificial de un texto ya terminado. Un parser permite únicamente campos públicos: en la actividad, el enunciado; en la ayuda, título, explicación e idea clave. La clave de respuesta, rúbrica, índices correctos y solución privada nunca se incluyen en los eventos parciales. El formulario queda deshabilitado hasta recibir el resultado validado y su token cifrado.

En ayudas se muestra primero la explicación conceptual en la misma ventana y tarjeta; el ejemplo concreto, sus pasos, resultado y visual se retienen hasta terminar la comprobación. No se presentan soluciones sin revisar para simular velocidad. Si una generación se rechaza, se limpia el borrador antes de reintentar. Si la conexión se interrumpe o falla el proveedor, el cliente recibe un error recuperable; un borrador no cuenta como respuesta ni ayuda nueva entregada.

Medición sintética real con cinco materias y cuatro formatos, antes de la corrección específica de sumas: 19/20 actividades publicables; una de Matemáticas fue bloqueada. Primer texto: mediana **608 ms**, p95 **1.071 ms**. Actividad completa, incluida revisión: mediana **6.685 ms**, p95 **17.049 ms**. No son mediciones del navegador con Supabase real ni de usuarios concurrentes. La verificación completa añade tiempo; el avance temprano reduce espera en blanco, no prueba una reducción equivalente de tiempo total.

La comprobación posterior del caso bloqueado, con correspondencias calculadas, obtuvo matching válido: 2 ms hasta primer texto y 3 ms en total, en proceso local sin llamadas a OpenAI. No se mezcla ese dato con la distribución de actividades de IA. Informes: `reports/learning-session-stream-pilot.json` y `reports/learning-session-targeted-pilot.json`; experimentos previos conservados.

Los cinco ejemplos distintos del último lote se entregaron correctamente, con introducción visible entre 685–835 ms y duración total entre 5,1–12,7 s. Una versión previa llegó a 39,5 s: se añadió un presupuesto compartido de **16 s** para generar, revisar y regenerar una ayuda, sin reintentos ocultos del SDK. Actividades: presupuesto de **22 s** para generación/revisión/regeneración. Esos límites no incluyen autenticación/lecturas de Supabase anteriores a generar. Una caída del proveedor o una revisión negativa todavía puede impedir completar una ayuda; no se garantiza disponibilidad total.

También se evita rechazar toda una ayuda por una tabla opcional mal dimensionada: se omite ese visual y se conserva el texto, siempre que siga siendo autocontenido y supere revisión. Se añadió protección frente a una generalización científica falsa observada durante el piloto sobre evaporación y temperatura constante.

## Arranque y configuración

La precarga masiva del motor antiguo se desactiva por defecto en el arranque activo. Sus cachés conservan lectura bajo demanda y la cola de perfiles se inicializa. Esto evita cargar miles de pasos que no utiliza el flujo nuevo. `LEARNING_LEGACY_WARMUP=true` permite recuperar esa precarga si se necesita para recorridos heredados.

`OPENAI_ACTIVITY_MODEL`, `OPENAI_EVALUATION_MODEL` y `OPENAI_SUPPORT_MODEL` permiten configurar las tres tareas por separado. Los valores por defecto del flujo actualizado usan gpt-4.1-mini, que dio mejores resultados en esta batería que gpt-4o-mini; la configuración heredada OPENAI_MODEL no sustituye los tres valores específicos. El estado de deprecación y la necesidad de validar una futura sustitución están descritos en HITOS_2_3_2026_11.md. No se modificó .env ni ninguna credencial.

Referencias consultadas para la implementación: [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs) y [generación en streaming](https://developers.openai.com/api/docs/guides/streaming-responses). El esquema valida estructura; la revisión y las comprobaciones locales atienden contenido y claves.

## Verificación y prueba

**58 pruebas aprobadas**, incluida una práctica completa de ocho respuestas con los cuatro formatos, resumen limitado al propietario, supresión de la novena preparación, errores de conexión, caracteres UTF-8 fragmentados, ausencia de claves en previews y comprobaciones matemáticas. Lint de los archivos de interfaz modificados y compilación aprobados. No se verificó visualmente este cambio en el navegador del usuario.

Reiniciar server y client desde sus carpetas con `npm run dev`; recargar con Ctrl+Shift+R. Probar un módulo, los formatos, Finalizar práctica anticipadamente, el resumen de ocho respuestas y Comenzar otra práctica. Pedir tarjeta/ejemplo para comprobar explicación progresiva y la revisión del ejemplo. El asistente no inició otro backend en 3001 durante estas pruebas; las pruebas HTTP usaron puertos efímeros y almacenamiento simulado.

No se requieren queries, migraciones ni cambios de RLS. Ninguna prueba de esta entrega insertó, actualizó o eliminó datos en Supabase. Queda pendiente ampliar cobertura de currículo/grados y la comprobación visual con datos reales, sin dar por perfectas las evaluaciones de IA.
