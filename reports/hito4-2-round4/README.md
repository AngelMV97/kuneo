# 4.2 — Lote 4: orientación espacial, derechos y análisis de fuentes

Fecha: 2026-11-06. Lote acotado de **siete originales** de los 548 candidatos técnicos pendientes. No se seleccionan siete preguntas por estar equivocadas sus claves numéricas, sino por desajustes verificables de objetivo, evidencia, ayudas o asociaciones. Todos los reemplazos son locales e inactivos, con pista, tarjeta, ejemplo distinto, visual y justificaciones por alternativa/pareja.

## Hallazgos y reparación

| Original (inicio del ID de paso) | Hallazgo delimitado | Reparación local |
| --- | --- | --- |
| 066775e5 | Definir nomadismo no verifica orientación espacial. La pista final revela la respuesta. | Leer la orientación explícita de un croquis y ubicar un destino. |
| 47ac5367 | Relaciona residencia, actividades y procesos históricos bajo un objetivo espacial; descripciones solapables. | Relacionar recorridos de una cuadra con puntos cardinales usando un croquis completo. |
| c879893e | Clasifica actividades atribuidas a nómadas; no evalúa el objetivo espacial y usa generalizaciones sin delimitación. | Comprobar ida y regreso por los mismos tramos en un recorrido simulado. |
| 6d43606d | Las parejas describen responsabilidades posibles, no son todas falsas. Las ayudas no distinguen acuerdos de convivencia, obligaciones de adultos y titularidad de derechos. La tarjeta asociada trata líneas de tiempo. | Relacionar acciones de protección con derechos concretos, aclarando que no son premios por cumplir tareas. |
| 36e47290 | Una tendencia sobre globalización y desigualdad se presenta como respuesta única sin caso, indicadores o fuentes para contrastarla. No se demuestra que sea falsa en todo contexto. | Comparar brecha absoluta y razón entre ingresos ficticios; distinguir cálculo de atribución causal. |
| 98eaf119 | Pregunta sobre polarización política actual sin población, periodo, plataforma ni evidencia; el evaluador acepta la clave sin comprobar la afirmación causal. | Analizar una encuesta ficticia y sus límites de causalidad y generalización. |
| fe134a7d | Impone una explicación general de desigualdad en países en desarrollo sin información contextual. | Contrastar un registro de ventas, un testimonio salarial y una generalización que excede la evidencia. |

No se declara que todo contenido sobre nomadismo sea incorrecto ni que una posición económica deba sustituirse por la contraria. Se corrigen el desajuste curricular y la falta de evidencia para evaluar una respuesta cerrada.

## Contraste con fuentes primarias

- [MEN, Guía 7: estándares de Ciencias Sociales](https://www.mineducacion.gov.co/1780/articles-81033_archivo_pdf.pdf), páginas impresas 32–33: orientación por referentes espaciales para 4–5. Se comprobó texto y tabla del PDF. El nuevo contenido conserva ese objetivo; los ejercicios históricos originales no lo verificaban.
- Mismo documento, páginas impresas 38–39: clasificación, comparación e interpretación de fuentes y herramientas de Ciencias Sociales para 10–11. Los tres candidatos mayores se basan en información suministrada y límites de inferencia, sin presentar una postura sobre globalización o redes como única verdad general.
- [UNICEF, versión infantil de la Convención](https://www.unicef.org/child-rights-convention/convention-text-childrens-version): introducción y artículos 12, 28 y 31, sobre titularidad de derechos, opinión, educación y descanso/juego. La reparación no convierte los derechos en condiciones o recompensas por cumplir responsabilidades. Es material educativo, sin pretender resolver situaciones jurídicas individuales.

Los mapas, ingresos, entrevistas y encuestas de los candidatos se identifican como simulados o ficticios. No se presentan como estadísticas o acontecimientos reales de Colombia.

## Material asociado

`audit.json` conserva íntegros los siete módulos/pasos originales y sus tarjetas y visuales asociados, con huellas por entidad. Se conserva también una prueba del evaluador original: su aceptación de la clave no acredita la veracidad o alineación de la pregunta.

Seis pasos comparten la tarjeta `7f7a0a85...`: el cuerpo habla de organizaciones sociales de grado 1 y el enriquecimiento desarrolla mapas/globos. No constituye ayuda específica para nomadismo, desigualdad o polarización de esos pasos. El paso de derechos tiene la tarjeta `93480eef...`, enriquecida como línea de tiempo. Sus visuales asociados son un mapa conceptual genérico o una línea de tiempo; no aportan los croquis, datos o relaciones necesarios para los nuevos ejercicios.

Los candidatos incorporan ayudas propias y desvinculan referencias compartidas (`concept_card_id` y `visual_template_key` nulos en el paso local). **No se sobrescriben esas tarjetas ni visuales compartidos**, porque otros usos no auditados podrían depender de ellos. Las asociaciones de todos los originales quedan preservadas para una reparación/versionado posterior.

## Verificación y efecto en ejecución

- `node scripts/quality/hito4-round4.cjs`: verifica el snapshot y las huellas de origen; reconstruye candidatos y paquetes de auditoría. Cero llamadas de modelo o base de datos.
- `node scripts/quality/hito4-round4-check.cjs`: comprueba las claves revisadas y **54 respuestas completas posibles**, incluyendo todas las permutaciones de relacionar y selecciones múltiples no vacías. Comprueba también explicaciones por alternativa/pareja y ayudas separadas del ejercicio. Produce `verification.json` y `worklist.json`.
- `npm test` en `server`: **132 pruebas aprobadas**, incluidas procedencia/aislamiento de candidatos, las 54 respuestas y exclusión de estos siete originales de nuevas reservas.
- Navegador local con `LearningModule` real: **7/7 vistas aprobadas**, con respuestas sintéticas y servicios de vista simulados. Se verificaron tablas, selecciones y parejas, envío/feedback, ayuda centrada, tarjeta y ejemplo distinto, visual presente y ausencia de tabla duplicada en Resultado del ejemplo. No se usaron cuentas ni Supabase. Reproducción: `node scripts/quality/hito4-repairs-ui.cjs --round4`, abrir la URL local y ejecutar la revisión del lote.

`server/reserveQuarantineRound4.json` excluye los siete originales de nuevas entregas de reserva. Esto no borra datos de Supabase, no altera intentos históricos ni preguntas ya firmadas y no publica los candidatos. La generación dinámica permanece disponible; la exclusión no constituye un banco de reemplazos conectado a producción.

## Estado acumulado y siguiente límite

**34 originales únicos auditados/excluidos; 34 candidatos locales inactivos; 541 candidatos técnicos todavía pendientes, de los cuales 528 usan palabras clave; cero publicados.** Cinco preguntas cerradas restantes del inventario siguen pendientes de auditoría; no se declaran defectuosas por pertenecer al mismo tema. Las reparaciones de otros lotes permanecen separadas.

Seguir en 4.2 por lotes: revisar esas preguntas de derechos/organizaciones e historia antes de ampliar la cohorte abierta por palabras clave. La publicación y conexión de ayudas/reserva persistente siguen en 4.4. Este lote no modifica modelos, latencia ni planificación de prefetch.
