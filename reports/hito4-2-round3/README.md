# Hito 4.2 — Lote 3 y evaluación del reordenamiento

2026-11-05. **Nueve originales adicionales auditados, nueve reemplazos locales preparados, ninguno publicado en Supabase.** Se mantiene abierto el ciclo de auditoría y corrección.

## Resultado del lote

Se seleccionaron dos originales pendientes de Matemáticas, Lenguaje, Sociales e Inglés y el único candidato técnico restante de Ciencias. No se inventó un segundo caso de Ciencias para llegar a diez. La selección y sus originales/huellas están en `audit.json`; los reemplazos inactivos, en `candidates.json`.

| Caso | Hallazgo | Corrección local |
|---|---|---|
| Matemáticas 3–5: chocolate | 8−3=5 es correcto, pero solo evalúa resta dentro de un objetivo de fracciones; falta feedback específico. | Cantidad y fracción restante: cinco cuadros y 5/8 de la misma unidad de ocho partes iguales. |
| Matemáticas 8–9 | Reflexión genérica por palabras clave; objetivo de funciones y material de fracciones de 1–3 no corresponden. | Ordenar estados de un modelo lineal por tiempos dados, con unidades y dominio. Se declara razonamiento; no se simula evaluar metacognición. |
| Lenguaje 9 | Pregunta genérica sobre argumentación, sin argumento y con tarjeta de otro grado. | Organizar un guion según un plan expresamente acordado, no una estructura universal obligatoria. Se practica planificación escrita, no ejecución oral. |
| Lenguaje 8 | No hay diálogo/contexto para inferir; objetivo auditivo no verificable por escrito. | Diálogo escrito completo, inferencias apoyadas y distractores sobre hechos ausentes. No se atribuye logro de escucha. |
| Ciencias 1–3 | Se exige encontrar un error sin aportar el razonamiento; referencia docente calificada como texto exacto. | Dependencias de medir, registrar y comparar en una tarea imaginada explícita. No se inventan resultados ni se presenta una receta universal del método científico. |
| Sociales 1–3 | Puntuación por tres términos y vínculo simplista entre derechos y deberes; tarjeta de historia y línea de tiempo ajenas al tema. | Reparar un descuido sin humillar ni excluir del aprendizaje. Los derechos no son premios condicionados al cumplimiento de tareas. |
| Sociales 6–7 | No hay investigación/resultados que comunicar; tarjeta introductoria de mapas y visual vacío. | Hitos fechados de un proyecto ficticio para organizar una cartelera. Fechas y carácter simulado explícitos. |
| Inglés 1–3 | Palabras españolas no verifican vocabulario inglés de la escuela; ayuda con saludos españoles. | Reconocer Library en contexto escolar, con distractores explicados y ejemplo diferente. |
| Inglés 10–11 | Reflexión genérica sin instrucciones; misma tarjeta de grado 1. | Reconstruir instrucciones escritas en inglés con before/after. Se declara comprensión, no metacognición ni escucha. |

Las ayudas propias reemplazan en estos candidatos las referencias ficticias, tarjetas desajustadas y visuales vacíos. Los materiales compartidos antiguos permanecen conservados y pendientes de reparación/publicación por versión: este lote no los corrige automáticamente para todos los demás pasos que los referencian. Cuando un objetivo se reformula, se guarda en un módulo candidato separado; no se sobrescriben módulos compartidos con pasos sin auditar.

## Decisión sobre ordenar opciones

**Sí conviene como quinto formato**, cuando hay un orden único verificable: instrucciones, secuencia de un relato, hitos fechados o estados de una cantidad. No corresponde imponerlo a opiniones, procedimientos con acciones intercambiables, cronologías universales o reflexión metacognitiva que exige una respuesta propia.

**Se mantienen ocho actividades.** No hay evidencia de uso con estudiantes que justifique alargar obligatoriamente la práctica a diez solo por añadir un formato. La distribución preparada para el piloto del quinto formato es:

| Posición preferente | Formato |
|---|---|
| 1 | Selección única |
| 2 | Abierta |
| 3 | Selección múltiple |
| 4 | Relacionar |
| 5 | Reordenar |
| 6 | Abierta |
| 7 | Selección única |
| 8 | Selección múltiple |

Es una preferencia de interacción, no una cuota que permita cambiar objetivos. Si ordenar no evalúa honestamente el aprendizaje, la generación puede elegir texto. La práctica se puede finalizar antes. Se conserva la preparación anticipada: usa la misma función de elección de formato que la generación normal.

### Qué quedó implementado

- Contrato de generación: tres elementos en grados 1–5, cuatro en 6–11; alternativa abierta si el objetivo no cabe en ordenar. Elementos breves, distintos y clave como permutación completa.
- Dependencias de generación con citas del enunciado. El servidor comprueba que existan, formen un orden único sin ciclos y concuerden con la clave. Que una cita exista no demuestra por sí solo la verdad de su interpretación: la revisión pedagógica sigue siendo necesaria.
- Mezcla de los elementos conservando la correspondencia de la clave. Nunca se entrega intencionadamente la secuencia ya resuelta como presentación inicial. La clave permanece privada.
- Feedback por posición, con explicación específica, dentro del detalle expandible ya existente.
- Arrastre y botones accesibles **Subir/Bajar**; contenido matemático renderizado y cambios bloqueados tras enviar. Se preserva la respuesta al remontar el componente.
- Elementos originales y respuesta ordenada conservados en los metadatos del intento, detalle del historial y evidencia para el resumen. No se añaden columnas a Supabase.
- Se corrigió además la tolerancia numérica explícita cero: ya no se transforma silenciosamente en 0,01. La alerta histórica correspondiente del inventario queda resuelta en el evaluador actual.

### Qué NO se activó

**La generación dinámica de reordenamiento está desactivada por defecto.** La opción de desarrollo es `LEARNING_ORDERING_ENABLED=true`, pero no se recomienda activarla para estudiantes todavía. No se modificó `.env` ni el modelo de producción.

Se probaron cuatro configuraciones/iteraciones reales, sin Supabase ni datos de estudiantes:

| Ejecución | Modelo | Entregas de reordenamiento válidas / casos |
|---|---|---|
| Inicial | gpt-4.1-mini | 3/5 |
| Citas y dependencias estrictas | gpt-4.1-mini | 0/5 |
| Contraste con modelo mayor | gpt-4.1 | 1/5 |
| Contrato afinado con cantidad explícita y citas sin paráfrasis | gpt-4.1-mini | 4/5 |

Los rechazos incluyeron citas inventadas, cantidades de elementos incoherentes y dependencias no justificadas. En la primera ejecución, una secuencia aprobada por el modelo también resultó pedagógicamente ambigua al revisarla: preparar un cuaderno no siempre debe preceder a observar. **Una aprobación del modelo no certifica por sí sola el contenido.**

La última ejecución aún falla en Sociales por el contrato de evidencia. No se relajó el control para lograr un 5/5. Se conservan todos los intentos y trazas en los cuatro archivos `ordering-live*.json`: 46 llamadas, 107.013 tokens de entrada y 20.531 de salida en total. Las cifras son de pruebas de desarrollo, no una estimación de latencia/coste para todos los usuarios. Las cuatro entregas de la última ejecución tampoco se publicaron como material aprobado.

La aplicación mantiene por defecto su distribución anterior de cuatro formatos. El nuevo contrato y la interfaz están preparados para una activación gradual con reserva revisada en 4.4, no para introducir ahora más esperas o errores. Las instrucciones adicionales del formato solo se envían cuando se prueba reordenamiento; las demás preguntas no reciben ese peso adicional. No se cambió el modelo de producción a uno más caro.

## Verificación

- **113 pruebas automatizadas aprobadas.** Cubren los cinco formatos en una práctica experimental de ocho preguntas, resumen finito, guardado de elementos, claves, mezcla, rechazo de entradas inválidas, dependencias, feedback y cuarentena.
- Los nueve candidatos pasaron sus contratos de actividad y ayuda. Se comprobaron todas las permutaciones de las cinco secuencias en el evaluador, cada alternativa de selección y los subconjuntos no vacíos de selección múltiple. Esa comprobación verifica la calificación contra la clave; la unicidad pedagógica se revisó aparte con los datos del enunciado.
- **9/9 comprobados en navegador** con el componente real LearningModule y servicios de vista simulados: ayudas centradas, envío, feedback y cinco secuencias ordenadas mediante Subir/Bajar. Tras enviar, sus controles permanecen deshabilitados. No se presenta esta vista como prueba de persistencia real ni como ensayo con estudiantes.
- Compilación de producción completada. Sin nuevas dependencias; los avisos existentes de tamaño de bundle/Browserslist no se resolvieron en este lote.
- Cálculos independientes: 8−3=5; 10−4=6; V(0,3,6,9)=(100,70,40,10); 12+4×3=24. Las instrucciones inglesas, relato, plan acordado y fechas ficticias contienen sus propias relaciones verificables.

## Fuentes y límites

- [UNICEF, Convención sobre los Derechos del Niño, versión infantil](https://www.unicef.org/child-rights-convention/convention-text-childrens-version), introducción y apartados 2, 28 y 29, consultada el 5 de noviembre de 2026: derechos de todos los niños, educación y disciplina respetuosa. Se usa como referencia educativa; no es asesoramiento sobre un caso jurídico particular.
- [Documentación oficial de OpenAI, GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1), consultada el mismo día para el contraste acotado de modelo. La decisión de no activarlo se basa en las pruebas locales conservadas, no en una promesa de calidad del proveedor.
- Se conservan las referencias curriculares del MEN registradas en las rondas anteriores. Los objetivos nuevos son formulaciones didácticas de candidatos, no citas literales ni certificación de una competencia completa.

Todos los casos nuevos no históricos se señalan como ficticios, simulados o imaginados. No se inventan hechos de instituciones reales. No se atribuye metacognición a la simple ejecución de una secuencia; cuando se necesita reflexión, debe usarse una tarea que realmente permita expresarla.

## Estado y siguiente lote

**27 originales distintos revisados y excluidos de nuevas reservas; 27 candidatos locales; 0 publicados.** Quedan **548 candidatos técnicos sin auditoría pedagógica**, incluidos **528 con evaluación por palabras clave**, además de los huecos y fallos técnicos ya inventariados. La lista por ID/huella está en `worklist.json`. Seguimos en 4.2; no se certifica el catálogo ni se declara resuelta la latencia inicial.

Reproducir desde la raíz:

```powershell
node scripts/quality/hito4-round3.cjs
npm --prefix server test
node scripts/quality/hito4-round3-close.cjs
node scripts/quality/hito4-repairs-ui.cjs --round3
```

La vista imprime una URL local y tiene el botón «Ejecutar revisión del lote». Repetir las llamadas facturables requiere `node scripts/quality/ordering-live.cjs --run`; máximo 20 llamadas por ejecución. No es necesario repetirlas para usar las correcciones locales.

No hace falta ejecutar SQL. Reiniciar servidor y cliente carga las correcciones de código; los candidatos siguen sin aparecer en la aplicación. El próximo lote debe continuar la revisión por familias de evaluadores/materiales. La activación del quinto formato quedará ligada a contenido aprobado y a una prueba satisfactoria de disponibilidad, no solo a que exista el componente visual.
