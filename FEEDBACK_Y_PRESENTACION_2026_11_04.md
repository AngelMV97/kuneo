# Feedback y presentación de actividades — 4 de noviembre de 2026

## Cambios

- Las actividades generadas de selección única, selección múltiple y parejas incluyen justificaciones específicas por alternativa o pareja. La clave y estas justificaciones permanecen en el token cifrado hasta responder; no se publican en los avances de generación.
- La calificación cerrada sigue siendo determinista. Después de responder se muestran la elección del estudiante, la relación esperada y su explicación. La devolución detallada se guarda en el mismo registro del intento y se recupera en el historial y en envíos repetidos.
- La generación solicita conjuntos de datos en tablas Markdown válidas o listas, también dentro de las columnas cuando corresponde. El cliente comparte un renderizador de tablas, listas y fórmulas en actividades, ayudas, resultados, feedback e historial. Las tablas pueden desplazarse horizontalmente.
- Se normalizan delimitadores matemáticos antiguos y comandos comunes sin delimitadores, incluyendo raíces y fracciones anidadas. El renderizador no ejecuta HTML ni permite imágenes generadas dentro de estos textos.
- «Resultado del ejemplo» conserva su protección contra tablas, gráficos e imágenes. Admite fórmulas en su conclusión; la representación visual continúa debajo.
- El resumen analiza enunciados, respuestas, resultados y explicaciones de los intentos seleccionados del usuario. Prioriza observaciones concretas, aspectos pendientes y una propuesta de práctica. Los recuentos y tiempos quedan dentro de «Ver detalles de la práctica».
- Las observaciones del resumen deben citar intentos existentes y compatibles con el resultado descrito. Se descartan afirmaciones individuales con referencias incompatibles; ante fallo de proveedor o contrato se utiliza el feedback guardado, sin inventar resultados. Un ejercicio nuevo propuesto puede no citar un intento porque es una recomendación, no una observación.
- El resumen tiene un presupuesto de 12 segundos y caché de diez minutos por usuario, módulo y conjunto de intentos, con límite de 100 entradas. La revisión de propiedad se realiza incluso al reutilizar caché.
- Las parejas conectadas se muestran en morado antes de evaluar; el verde ya no sugiere que una conexión sea correcta por el mero hecho de estar seleccionada.

El aviso técnico de contenido de reserva se conserva durante las pruebas, según lo solicitado. No se enriquecieron masivamente los pasos ni se alteraron los datos de Aula Nativa.

## Revisión de contenido

El primer piloto detectó preguntas que mencionaban tablas ausentes y confundían opiniones citadas con hechos. La revisión previa ahora exige resolver la actividad antes de aprobarla y comprobar explícitamente autocontención, conjuntos seleccionables, ambigüedad, justificaciones y distinción entre hechos y opiniones. Se mantienen reparación y reserva ante rechazo.

Esto reduce casos detectados, pero no garantiza exactitud pedagógica universal. Continúa siendo necesaria la revisión ampliada de materias, grados y habilidades prevista en el roadmap.

## Comprobaciones

- 62 pruebas automáticas del servidor aprobadas: propiedad de datos, idempotencia, cuatro formatos, justificaciones privadas y persistidas, validación de evidencia del resumen y normalización matemática, entre otras.
- Compilación de producción del cliente y ESLint de los archivos modificados aprobados.
- Renderizado real de React en servidor: tablas, listas y KaTeX presentes, sin errores de KaTeX en las muestras; HTML e imágenes rechazados; tabla ausente en «Resultado del ejemplo».
- Piloto sintético de OpenAI en cinco materias: selección única en Matemáticas y Sociales, múltiple en Lenguaje e Inglés, parejas en Ciencias. Las cinco generaron explicaciones y admitieron la respuesta de referencia y rechazaron una respuesta errónea construida para la prueba. Generación y revisión completas: aproximadamente 4,5–6,2 segundos en esa muestra.
- Tras ajustar el tratamiento de referencias para recomendaciones nuevas, una comprobación adicional de los cinco resúmenes produjo análisis narrativo en las cinco materias.
- Los pilotos no crean usuarios ni escriben intentos en Supabase. Los resultados sintéticos locales están en `recovery/feedback-coaching-pilot.json`; comprobación mediante `node scripts/quality/feedback-coaching.cjs` y, reutilizando las muestras, `--summary-only`.

La comprobación de renderizado es estructural, no una inspección visual del navegador ni una medición completa de latencia de usuario.

## Para probar

No se requieren queries ni migraciones en Supabase. Reiniciar el servidor y actualizar el cliente. La dependencia añadida es `remark-gfm` y está registrada en el lockfile.

Comenzar una práctica nueva: las preguntas y devoluciones antiguas no se reescriben retroactivamente. Probar una elección correcta, una incorrecta, una omisión en selección múltiple y parejas equivocadas; finalizar y revisar el resumen. Confirmar fórmulas y tablas con los casos nuevos. Las respuestas abiertas conservan su evaluador actual.

## Ajuste posterior: detalle opcional, parejas y aplicación

- «Revisemos tu respuesta» se presenta cerrado por defecto mediante un desplegable nativo con «Ver más» / «Ver menos» y flechas. Se aplica tanto a la devolución inmediata como al historial; la explicación general permanece visible. El resumen de práctica conserva su diseño.
- La mezcla de parejas ahora se realiza en el servidor después de seleccionar el contenido y antes de cifrarlo. Remapea los índices de la clave, conserva las explicaciones por elemento izquierdo y sirve también para reserva y actividades calculadas. Ninguna pareja correcta ocupa la misma fila. Se usa mezcla aleatoria con intentos acotados y alternativa válida; con dos parejas solo existe una disposición sin coincidencias de fila, una limitación combinatoria inevitable.
- La generación y revisión priorizan problemas de aplicación contextualizados para Colombia, con situaciones urbanas y rurales variadas y adecuadas al grado. Se especifican diferencias por materia y habilidad; se pide que el contexto intervenga en el razonamiento y que los textos/fuentes simuladas se identifiquen como tales.
- No se añadió un motor de gráficas. Un control previo rechaza solicitudes de observar gráficas no disponibles y referencias directas a tablas ausentes. Se solicitan datos completos en tablas o tareas para explicar cómo representar esos datos.
- Verificación: 65 pruebas de servidor aprobadas; ESLint del componente modificado y compilación de producción aprobados. Las pruebas nuevas cubren permutaciones y remapeo de claves, preservación de explicaciones, generación/reserva y las referencias a tablas/gráficas ausentes.

La contextualización generativa sigue requiriendo revisión pedagógica. En el piloto de cinco materias hubo un rechazo en Lenguaje; el caso sintético dirigido posterior sí generó una actividad. El control ampliado de tablas rechazó después una propuesta de Matemáticas que seguía mencionando una tabla sin incluirla, incluso tras reparación. El caso sintético carece deliberadamente de reserva y terminó con error recuperable. Se aclaró también en el esquema que los datos deben estar en el enunciado público, no en rúbricas o explicaciones privadas. Estos ensayos no acreditan cobertura total ni eliminan la posibilidad de usar reserva.

Siguiente bloque del roadmap: Hito 4, reserva útil y verificable. Empezar con inventario por materia, grupo de grado, habilidad y objetivo; separar contenido ausente, sin enriquecer, inválido y listo. Priorizar los casos de reserva genérica observados en pruebas antes de ampliar volumen. No enriquecer masivamente ni escribir en Supabase hasta definir el conjunto y verificar las claves.
