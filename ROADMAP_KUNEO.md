# Roadmap de Kuneo

Roadmap actualizado el 3 de noviembre de 2026, basada en la aplicación activa `client/` + `server/`, sus documentos y las pruebas del usuario. Estado de ejecución: Hito 0 con instrumentación y línea base, pero dos casos pedagógicos pendientes; Hito 1 con búsqueda corregida e inventario real. Detalles y límites en HITOS_0_1_2026_11.md. No se modificaron datos de Supabase.

## Dirección del producto

Kuneo debe ofrecer un ciclo coherente de aprendizaje: descubrir un objetivo curricular, practicar con actividades nuevas, recibir apoyo gradual, comprobar el progreso, repasar y transferir lo aprendido a otros contextos. Abrir más secciones no sustituye mejorar ese ciclo.

Alcance: cinco materias (Matemáticas, Lenguaje, Ciencias Naturales, Ciencias Sociales e Inglés), cinco grupos de grados (1–3, 4–5, 6–7, 8–9 y 10–11) y cinco habilidades (Comprensión, Razonamiento, Representación, Transferencia y Metacognición). Son 125 combinaciones de cobertura de prueba, no 125 conceptos ni una exigencia de enseñar todos los conceptos en todos los grados.

## Hallazgos comprobados

| Área | Estado y evidencia |
|---|---|
| Inicio, progreso y perfiles | Usan intentos del usuario; existen filtros e historial. El usuario confirmó el SQL de propietario de las cuatro funciones de perfiles. |
| Competencias | `server/competencies.js` genera un embedding y llama a la RPC semántica. `SemanticSearch.jsx` solicita umbral 0,5 y límite 10. El SQL local descarta filas sin embedding y aplica igualdad exacta a `grade_range`. No hay recuperación léxica complementaria en ese flujo. |
| Contenido local | `all_competency_units.json` contiene 1.426 registros. Una inspección textual normalizada del campo `content` encontró 27 con «energia» y 91 con la raíz «funcion». Esto incluye acepciones distintas y no acredita qué filas están actualmente en Supabase. Hay grados individuales y rangos mezclados. |
| Pistas | La generación actual produce una sola frase `hint`. El endpoint devuelve esa frase; repetirla no añade otra ayuda. `learningContent.js` solo asigna `visual_template_key` al contenido de reserva. No existe aún la tarjeta progresiva equivalente para la actividad generada. |
| Tarjetas y visuales | `CONCEPT_CARDS_SYSTEM.md` documenta 44 tarjetas y `VISUAL_TEMPLATES_SYSTEM.md`, 23 plantillas: cifras históricas. `VISUAL_ENGINE_RUNTIME.md` describe su conexión. El código activo admite `svg_custom`, `recharts` y `timeline`; varios tipos descritos en los documentos todavía no tienen renderer activo. |
| Latencia | El frontend solicita primero el detalle del módulo y después la actividad. El servidor consulta perfil, pasos e historial antes de generar. La caché actual conserva actividades pendientes, pero no prepara la siguiente con el resultado recién obtenido. El motor nuevo no reutiliza automáticamente todas las optimizaciones del motor antiguo. No hay una medición actual de p50/p95 por etapa. |
| Repaso | Botón deshabilitado en `Home.jsx`, sin recorrido activo. |
| Transferencia / ICFES | El botón Transferencia abre `/icfes`; `IcfesPrep.jsx` muestra un placeholder por asignatura. Hay un servicio ICFES en `backend/`, pero esa carpeta no forma parte del servidor activo y no debe darse por integrada. |
| Reserva enriquecida | El reporte histórico del 20 de mayo registra 2.243 de 11.411 pasos enriquecidos (19,7%) y 33 módulos completos. Hace falta un inventario actual de cobertura y calidad; esos números no son una consulta viva. |

## Orden de ejecución

### Hito 0. Establecer la base de validación

Registrar una batería pequeña de consultas curriculares y actividades de referencia; medir generación, evaluación, consulta de datos, guardado y carga de pistas por separado. Distinguir primera carga, actividad pendiente recuperada y transición entre actividades, con p50/p95 y coste por sesión.

Revisar también la calidad pedagógica: actividades autocontenidas, adecuación al grado, correspondencia entre pregunta y habilidad, aceptación de respuestas equivalentes, rúbricas sin exigencias que no aparecen en el enunciado y ausencia de revelación prematura de la solución. Una solicitud de «investiga» requiere recursos y una intención explícita; no debe sustituir involuntariamente una actividad resoluble dentro de Kuneo.

**Cierre:** línea base reproducible y ejemplos correctos, parciales e incorrectos que permitan detectar regresiones. Los antiguos porcentajes de tests exitosos no equivalen a validar la calidad de todas las actividades generadas.

### Hito 1. Corregir Competencias y la cobertura curricular

1. Comparar el catálogo local con Supabase: conteos por fuente, materia y grado; embeddings ausentes, repetidos o desactualizados; texto realmente indexado; modelo y dimensiones del embedding; relaciones competencia → módulo → objetivo.
2. Interpretar correctamente grados individuales y rangos: un filtro 4–5 debe incluir un registro de grado 4 o 5, no solo una cadena exactamente igual a «4-5».
3. Combinar recuperación léxica y semántica. Normalizar tildes, variantes y plurales, conservando las acepciones de cada materia. Calibrar el umbral con ejemplos; no bajarlo indiscriminadamente para llenar resultados irrelevantes.
4. Mostrar fuente, materia y grado; paginar y agrupar cuando ayude a comparar la progresión del concepto. Permitir abrir los módulos relacionados, indicando si no hay módulo asociado.

**Cierre:** «energía/energia» y «función/funcion/funciones», además de consultas de las otras materias, recuperan los registros pertinentes existentes y respetan filtros. El conjunto de referencia debe comprobar relevancia y cobertura; no imponer un número artificial de resultados ni fabricar competencias ausentes.

### Hito 2. Recuperar pistas, tarjetas y visuales del tutor

Adaptar el contrato de actividad para ayudas progresivas: orientación breve → tarjeta conceptual y visual pertinente → ejemplo análogo explicado. El ejemplo usa otros datos/contexto y no entrega la solución de la actividad pendiente.

Reutilizar `ConceptCard` y `VisualEngine` antes de crear otro sistema. Vincular visuales al concepto, grado y datos de la actividad generada; una gráfica de reserva con números distintos puede confundir. Inicialmente usar los renderers realmente soportados y configuraciones validadas, no HTML o SVG arbitrarios del modelo.

Cargar el apoyo cerca de la pregunta, con apertura/cierre claro, lectura móvil y estados de carga/fallo. Conservar una ayuda textual útil si no existe un visual adecuado: no toda actividad necesita ilustración. Registrar qué nivel se consultó y evitar contar dos veces la misma ayuda.

**Cierre:** las actividades generadas también disponen de tarjetas contextualizadas; los ejemplos representativos de las cinco materias muestran apoyo adecuado, sin revelar respuestas ni depender de contenido de demostración. Verificarlo en escritorio y móvil con ejemplos por grupo de grado.

### Hito 3. Reducir la espera medida

La medición empieza en el hito 0; aquí se aplican y comparan las mejoras:

- Evitar solicitudes y consultas duplicadas y cachear catálogo y plantillas compartidas. Mantener aislados por usuario los datos personales y las actividades.
- Consultar evidencia reciente y agregados necesarios en lugar de releer siempre todo el historial para decidir la siguiente actividad.
- Acortar la salida y el contexto enviados al modelo sin eliminar objetivos o rúbricas esenciales. Comparar resultados pedagógicos y coste antes de cambiar de modelo.
- Preparar la siguiente actividad después de evaluar la respuesta, mientras el estudiante lee el feedback. Predecir antes de conocer el resultado exige variantes y descarte seguro: no fijar una actividad basada en evidencia obsoleta.
- Mantener como máximo una actividad siguiente pendiente por usuario/módulo, con caducidad, cancelación y límites de consumo. Guardar una versión del estado usado para generarla.
- Presentar feedback de forma inmediata cuando esté listo. Una animación o streaming parcial no sustituye tener una actividad íntegra y validada para responder.

**Cierre:** comparación p50/p95 contra la línea base, separando transiciones preparadas de generaciones en frío; reducción sustancial de la espera sin empeorar calidad, duplicar preguntas, mezclar cuentas ni disparar costes. Los objetivos absolutos se fijan con la medición real, no con el antiguo objetivo de <500 ms de otro motor.

Referencia técnica: [optimización de latencia de OpenAI](https://developers.openai.com/api/docs/guides/latency-optimization).

### Hito 4. Construir una reserva útil y verificable

**Avance del 5 de noviembre:** 4.0 implementado: publicación final sin borradores, recuperación de respuestas y resultados guardados, reserva limitada al objetivo/habilidad y clasificación de fallos. 76 pruebas automatizadas y ocho comprobaciones de navegador con servicios simulados aprobadas. Detalles y límites: [HITO_4_0_2026_11_05.md](HITO_4_0_2026_11_05.md). El inventario y la auditoría de veracidad continúan pendientes; no se modificó Supabase.

Plan de ejecución por etapas y puertas de verificación: [PLAN_HITO_4.md](PLAN_HITO_4.md). Prioridad inicial: evitar publicar borradores que luego se sustituyen, inventariar mediante lectura y auditar material ya enriquecido en rondas de cinco y hasta 25 preguntas. Reparación/enriquecimiento posterior en lotes de 10–20 candidatos, con verificación de fuentes, versiones y reversión; el inventario no acredita veracidad.

Inventariar las 125 combinaciones, además de conceptos prioritarios y objetivos; distinguir ausencia de material, material no enriquecido, material inválido y material listo. Seleccionar primero lo más usado y las carencias críticas.

Validar enunciado, clave, distractores, rúbrica, pistas y visual asociado antes de aumentar volumen. Ejecutar procesos reanudables con presupuesto máximo, trazabilidad y un informe de cobertura. Mantener el contenido reservado separado de la evidencia personal y evitar usarlo como vía para fingir variedad ilimitada.

**Cierre:** un conjunto mínimo acordado de actividades validadas por combinación pertinente y un ensayo de caída de OpenAI que mantenga un recorrido educativo útil. Si se necesita una prueba gratuita, definir cuotas y consumo por cuenta en el servidor.

**Límite:** la reserva actual requiere backend y Supabase. El offline completo implica descarga, autenticación local, caché, cola de intentos y resolución de conflictos; es una fase distinta.

### Hito 5. Implementar Repaso

Crear una sesión breve a partir de conceptos débiles, errores recientes y tiempo transcurrido desde la práctica. Generar problemas nuevos equivalentes, respetando materia, grado y habilidad, con pistas disponibles. Empezar con una política de revisión simple y explícita, sin atribuirle validación científica que todavía no tiene.

No borrar ni reemplazar el progreso del módulo. Distinguir un intento de repaso de un intento de avance y definir cómo cada uno aporta evidencia. Conservar una salida clara para cuentas sin historial y permitir elegir materia o duración.

**Cierre:** un usuario con historial recibe un repaso fundamentado en su evidencia; un usuario nuevo puede comenzar sin recibir una recomendación ficticia; los resultados se guardan y se ven en Actividad.

### Hito 6. Resolver Transferencia e implementar el simulacro

**Propuesta de producto:** Transferencia ofrece retos de aplicación en contextos nuevos, adecuados a todos los grupos de grado. La preparación Saber 11 es un recorrido identificado como tal, inicialmente para 10–11. No son sinónimos ni deben confundirse con la habilidad cognitiva Transferencia.

Si se prefiere conservar el acceso actual, el botón debe llamarse «Preparación ICFES» y definir explícitamente su público. Esta elección debe resolverse antes de construir la sección.

Para Saber 11, seguir las cinco pruebas y sus marcos: Matemáticas, Lectura Crítica, Ciencias Naturales, Sociales y Ciudadanas e Inglés. Separar práctica guiada y simulacro: en el segundo, el cuadernillo queda fijo antes de empezar, se conserva el avance y la devolución llega al terminar. El comportamiento del cronómetro debe estar definido para recargas y reanudación.

Persistir intentos, preguntas, opciones, versiones y criterios de corrección; mostrar análisis por competencia y rutas de repaso. No presentar un porcentaje interno como puntaje oficial ICFES ni como predicción validada.

**Cierre:** recorrido completo en cada prueba, guardado y reanudación, corrección consistente, revisión de respuestas y recomendaciones conectadas con Repaso. Revisar el servicio antiguo de `backend/` como referencia, no activar toda esa arquitectura para reutilizar un archivo.

Referencias oficiales: [Saber 11](https://www.icfes.gov.co/evaluaciones-icfes/saber-11/) y [marcos de referencia](https://www.icfes.gov.co/marcos-de-referencia-examen-saber-11/).

## Trabajo transversal y salida a una prueba piloto

- Mantener la propiedad de datos, RLS y pruebas con dos cuentas. Preservar los datos de Aula Nativa que comparten proyecto.
- Asegurar persistencia e idempotencia en base de datos antes de varias instancias de servidor; las colas/cachés actuales están en memoria. Versionar pregunta, rúbrica y evaluación para poder revisar resultados de forma reproducible.
- Conectar las instrucciones de `pedagogical_foundations/` con el motor en vivo; resolver diferencias de alcance de grados y no asumir que la mera existencia de esos archivos significa que se estén aplicando.
- Antes de usuarios reales: recuperación de contraseña completa, SMTP probado, límites de consumo y errores comprensibles. No convertir estos pendientes en requisito para continuar las pruebas locales actuales.
- Validar primero un recorrido de extremo a extremo representativo, luego ampliar la matriz de materias/grados/habilidades. Registrar qué se verificó automáticamente, qué se revisó pedagógicamente y qué se observó en el navegador.

## Primer bloque propuesto

Ejecutar el hito 0 y el diagnóstico del hito 1; después recuperar las tarjetas del hito 2 y aplicar las mejoras de latencia identificadas. Esto cierra las limitaciones del tutor que ya utiliza el estudiante antes de abrir Repaso o el simulacro. La reserva se amplía selectivamente conforme aparezcan huecos; no es necesario enriquecer masivamente todo el catálogo para empezar.

## Alcance confirmado por el usuario

Transferencia ofrece retos de aplicación para todos los grupos de grados; preparación Saber 11 es un recorrido específico de 10–11. El servicio ICFES de backend/ es legado de Aula Nativa y no determina el alcance de Kuneo.

## Avance de Hitos 2–3

Ayudas progresivas, tarjetas y ejemplos distintos implementados, con revisión y recuperación ante errores. Lecturas iniciales paralelas y preparación anticipada tras guardar un intento. Pilotos y límites: HITOS_2_3_2026_11.md. Pendientes validación visual y pedagógica ampliada, gráficas especializadas y medición completa con navegador/Supabase. Los dos fallos de evaluación abierta del Hito 0 siguen pendientes.

## Mejora del ciclo de práctica — 4 de noviembre

Prácticas de ocho respuestas con finalización anticipada y resumen; cuatro formatos; evaluación con evidencia; generación progresiva autenticada y claves revisadas. Batería de evaluación ampliada: 33/33 en el piloto actual; no supone exactitud universal. Detalles, límites y experimentos: PRACTICAS_Y_STREAMING_2026_11_04.md. El generador de ejemplos puede seguir fallando por disponibilidad o revisión negativa; conserva recuperación y tiempo máximo.

### Feedback y presentación

Justificaciones por alternativa y pareja, resumen narrativo basado en intentos propios, tablas/listas en actividades y fórmulas en ayudas y devoluciones. Revisión previa reforzada para datos ausentes y claves ambiguas. Los números del resumen quedan como detalle opcional. Registro y pruebas: [FEEDBACK_Y_PRESENTACION_2026_11_04.md](FEEDBACK_Y_PRESENTACION_2026_11_04.md). El aviso de reserva se mantiene para pruebas; ampliar la cobertura curricular y validar calidad a escala sigue pendiente.

El detalle por alternativa es ahora desplegable. Las parejas se mezclan y sus claves se remapean en el servidor; se refuerzan los problemas de aplicación adecuados al contexto colombiano. La batería alcanza 65 pruebas. El siguiente bloque es el inventario y validación selectiva de reserva del Hito 4; se conserva la evaluación del resumen confirmada por el usuario.
