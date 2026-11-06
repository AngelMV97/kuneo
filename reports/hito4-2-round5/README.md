# 4.2 — Lote 5: cinco preguntas cerradas restantes

Fecha: 2026-11-06. Se revisaron las cinco preguntas cerradas todavía pendientes de la cola técnica del snapshot inicial. **No se declara que sus cinco claves sean falsas**: varias son válidas. Los hallazgos están en ayudas que revelan claves, asociaciones temáticas incorrectas, supuestos innecesarios y cobertura insuficiente del objetivo. Se prepararon cinco candidatos locales inactivos con ayudas propias.

## Casos y decisiones

| Original (inicio del ID) | Decisión y límite | Candidato |
| --- | --- | --- |
| 1b6c1319 | Familia es una organización social; clave conservada como válida en el registro original. Las ayudas presuponen una composición y un entorno familiar particulares. La tarjeta enriquecida trata mapas. Reconocer una organización no demuestra formular preguntas sobre ella. | Reconocer una pregunta pertinente sobre acuerdos de un hogar ficticio, sin pedir datos del hogar real. |
| 3e01bd93 | Educación es un derecho; no se corrige esa afirmación. La última pista entrega la respuesta y la tarjeta es de líneas de tiempo. | Identificar educación en una acción concreta de apoyo para seguir aprendiendo. |
| 65590a17 | Mezcla prácticas de periodos amplios y justificaciones sin fuentes. No verifica el objetivo de pensamiento del XIX. El módulo sitúa ese objetivo en 6–7, aunque el estándar MEN lo ubica en 8–9. | Candidato separado de 8–9 con lectura de disposiciones de 1863, su interpretación y límites. No modifica el módulo compartido ni los otros pasos. |
| 724ff139 | Aprender y hacer amigos es una descripción admisible, no una clave demostrada falsa. La pregunta y distractores no comprueban la formulación de preguntas del objetivo; la tarjeta compartida trata mapas/globos. | Reconocer una pregunta pertinente para investigar una decisión del curso. |
| 7f386848 | La selección original de derechos es sustancialmente válida. Una pista enumera respuestas y la tarjeta asociada trata una línea de tiempo. | Aplicar derechos a acciones de participación, educación, juego y descanso en un caso ficticio. |

Los dos ejercicios de preguntas pertinentes son **andamiaje de comprensión**, no prueba de que el estudiante ya produce buenas preguntas de forma autónoma. Se conserva el objetivo del módulo, sin afirmar que estas selecciones por sí solas evalúen toda esa competencia. La parte abierta deberá cubrir producción propia. La lectura histórica es una tarea delimitada, no una evaluación completa de todas las corrientes del XIX o de toda América Latina.

## Contraste documental

- [MEN, Guía 7](https://www.mineducacion.gov.co/1780/articles-81033_archivo_pdf.pdf), páginas impresas 36–37: el objetivo sobre corrientes de pensamiento del XIX está en el conjunto 8–9, no en 6–7. El candidato histórico cambia solo su propio grado local; conserva la huella del original.
- [Constitución de 1863, repositorio de la Secretaría Jurídica Distrital](https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?dt=S&i=13698), artículo 15, numeral 16, y artículo 16: se contrastaron las dos disposiciones utilizadas. El enunciado distingue adaptación didáctica de cita literal y norma histórica de normativa vigente. No infiere prácticas universales a partir de una disposición.
- [UNICEF, Convención en versión infantil](https://www.unicef.org/child-rights-convention/convention-text-childrens-version), introducción y artículos 12, 28 y 31: titularidad de derechos, opinión, educación y juego/descanso. Las ayudas no presentan esos derechos como premios por cumplir tareas.

Se consideró comparar también la Constitución de 1886, pero la recuperación completa del documento falló en las consultas de esta sesión. **El candidato no depende de ella ni de sus fragmentos de resultados de búsqueda**; utiliza únicamente el texto de 1863 que sí se pudo leer. No se cambian normas ni se realizan trámites jurídicos: es una lectura histórica educativa.

## Material y procedencia

`audit.json` conserva módulo, paso, tarjeta y visual originales con sus huellas, además de una prueba del evaluador con la clave original. `candidates.json` conserva los reemplazos, explicaciones específicas, pista, tarjeta, ejemplo y visual. Los casos inventados se identifican como tales. Las tarjetas y visuales compartidos no se sobrescriben; los candidatos desvinculan esas referencias y reciben ayudas propias.

`server/reserveQuarantineRound5.json` excluye los cinco originales de nuevas reservas por los problemas de calidad delimitados; no borra datos ni altera preguntas ya firmadas. La pregunta histórica no se mueve automáticamente entre grados en Supabase. Los reemplazos siguen locales e inactivos; la conexión/versionado/publicación corresponde a 4.4.

## Verificación

- **39 combinaciones completas de respuesta** contrastadas con claves revisadas y explicación por alternativa. Incluye todos los subconjuntos no vacíos en selección múltiple.
- **135 pruebas aprobadas** con `npm test` desde `server`: procedencia, aislamiento, corrección de grado, evaluación exhaustiva y exclusión de los cinco originales de nuevas reservas, más regresiones previas.
- **5/5 vistas verificadas en navegador** con `LearningModule` real y servicios de vista simulados: pregunta, selección/envío, feedback, ayuda centrada, tarjeta, ejemplo y visual; resultado del ejemplo sin tablas incrustadas duplicadas. Respuestas sintéticas, sin cuentas ni Supabase.
- Cero llamadas a modelos y cero consultas/escrituras de base de datos en la construcción y verificación de este lote.

Reproducción:

```powershell
node scripts/quality/hito4-round5.cjs
node scripts/quality/hito4-round5-check.cjs
cd server
npm test
```

Vista de prueba: `node scripts/quality/hito4-repairs-ui.cjs --round5`; abrir la URL local indicada y ejecutar la revisión del lote. Las notas de la página de prueba no forman parte de los flujos del estudiante.

## Estado vigente

**39 originales únicos auditados/excluidos y 39 candidatos locales inactivos; 536 candidatos técnicos pendientes; cero publicados.** De los pendientes, 528 están en la cohorte por palabras clave y ocho se normalizan como texto con estrategia `exact_text`.

La parte cerrada legible de esta cola técnica inicial ya no tiene preguntas pendientes. Esto **no** acredita todo el catálogo: no certifica pasos sin enriquecimiento, fallos técnicos del inventario, recursos compartidos no revisados, generación dinámica ni respuestas abiertas. Los ensayos dinámicos de indagación se mantienen separados de estos conteos.

Siguiente lote de 4.2: las ocho abiertas de coincidencia exacta, seguidas por muestras de la cohorte por palabras clave. Probar paráfrasis correctas, respuestas parcialmente válidas y menciones de palabras sin comprensión, conservando originales y reparando cada hallazgo verificado. La publicación sigue pendiente.
