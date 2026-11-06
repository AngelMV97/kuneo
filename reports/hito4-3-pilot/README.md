# Reparación del piloto antes de ampliar 4.2

**Actualización posterior de la ronda 2:** las dos preguntas abiertas del piloto también usan ahora criterios explícitos y se regeneró `candidates.json` con sus nuevas huellas. La versión previa se conserva en `candidates-before-criteria.json`. La regresión actual está en `../hito4-2-round2/pilot-regression.json` (16/16); `live-evaluation.json` conserva la prueba histórica de la versión anterior. Preguntas, ejemplos y visuales no cambiaron al añadir criterios. Ver `../hito4-2-round2/README.md` para el cierre posterior.

Fecha: 2026-11-05. Lote correctivo excepcional de cinco preguntas, las cinco de la primera ronda. No se inició una generación masiva ni se amplió todavía a 25. Los escenarios fueron redactados y revisados en este lote; no se utilizó un modelo para inventar los candidatos.

## Estado concreto

- **Cinco originales excluidos de nuevas selecciones de reserva** mediante `server/reserveQuarantine.json`. Conservan sus registros e historial en Supabase. La exclusión es por ID de paso hasta una revisión explícita: editarlo no elimina automáticamente la cuarentena.
- **Cinco reemplazos completos preparados y verificados localmente**, con originales/huellas, metadatos propios, pregunta, clave/rúbrica, feedback, pista, tarjeta conceptual, ejemplo distinto y visual estructurado. Se conservan en `candidates.json`, con `candidate_not_published` y módulos inactivos.
- **Sin escrituras en Supabase ni publicación de reemplazos.** Las ayudas preparadas tampoco están conectadas a las solicitudes reales del alumnado. Esto es un lote listo para preparar su activación gradual de 4.4, no un banco ya desplegado.
- Los tokens de actividades ya entregadas no se invalidan por la cuarentena. Cuando falla la generación y el único respaldo es uno de estos pasos, se conserva el estado recuperable de reintento; no se sirve material conocido como defectuoso ni se cambia a otro objetivo.

## Qué se corrigió

| Materia/grado | Reemplazo y corrección |
|---|---|
| Matemáticas 8–9 | Modelo lineal del agua de una huerta, con dominio físico, tasa y unidades explícitos. Cálculo independiente de todas las alternativas. El objetivo de funciones del original se conserva conceptualmente; se elimina la pregunta genérica de fracciones y se corrigen título/concepto del candidato. |
| Lenguaje 5 | Guion de un mensaje para el curso con datos de un sondeo simulado. Admite defender cualquiera de dos propuestas, incluida la minoritaria. La rúbrica pide propuesta, dato bien atribuido y reconocimiento respetuoso. No afirma evaluar ejecución oral a partir de un texto. |
| Ciencias 1–3 | Selección de dos acciones para comparar el efecto de la luz. Todas las condiciones están descritas. Distingue plan experimental de resultados y no exige realizar la experiencia. Retira la clasificación incompleta y la exclusión indiscriminada de tecnología. |
| Sociales 6–7 | Relacionar tres hechos delimitados del territorio colombiano con fechas suministradas y contrastadas. Distingue hito/proceso y sanción de ley/vigencia. No reutiliza la cronología continental ambigua ni el objetivo de corrientes del siglo XIX asignado al grado incorrecto. |
| Inglés 10–11 | Mensaje escrito EN INGLÉS, con fecha, lugar y vía de consulta. Rúbrica semántica que acepta español/inglés y paráfrasis. Se declara lectura, no escucha: sin audio no se atribuye un logro de escucha. |

Se retiraron de los candidatos las referencias a tarjetas de otro grado, claves ficticias y diagramas vacíos. Cada reemplazo tiene dos tarjetas propias (conceptual/ejemplo), visuales de datos compatibles con el componente actual y resultado del ejemplo únicamente en prosa. Los ejemplos cambian el contexto y no revelan la respuesta pendiente.

**Cambio de objetivo controlado:** Sociales e Inglés requieren objetivos corregidos, no un simple reemplazo del enunciado en el módulo original. Por eso se preparan módulos/IDs separados y no se escriben sobre módulos compartidos con pasos no auditados. Antes de publicar se deberá decidir su correspondencia curricular exacta; no se anuncia que estas preguntas cubren por sí solas el objetivo completo del módulo antiguo. Las formulaciones de objetivo son didácticas del candidato, no citas literales del MEN.

## Correcciones del motor que sí están implementadas

1. `normalizeStored` conserva las explicaciones por opción/pareja, el foco de aprendizaje y la rúbrica de los nuevos registros. Las claves siguen privadas en el token, no en la actividad pública.
2. El evaluador actual y el endpoint adaptativo legado rechazan ordenamientos incompletos, añadidos, repetidos, fuera de rango o mal formados con error recuperable 400. No les asignan un acierto o parcial ficticio. Los ordenamientos completos conservan su criterio de calificación.
3. Las cinco versiones defectuosas conocidas quedan fuera de nuevas reservas, sin bloquear todo el catálogo ni adjudicar defectos no comprobados a los otros 544 candidatos que requieren revisión.

Estas correcciones se aplican por formato/contrato en todas las materias. El contenido particular de cada candidato respeta su disciplina y grado. No se cambió la generación, la preparación anticipada ni los modelos configurados para la aplicación.

## Evidencias

- **99 pruebas automatizadas aprobadas**: suite existente más procedencia, contratos de candidatos, claves/distractores, ayudas, aritmética independiente, cuarentena en selección real y rechazo de secuencias inválidas en ambos evaluadores.
- **16 evaluaciones reales de rúbrica**, con `gpt-4.1-mini`, dos vueltas a ocho respuestas sintéticas de Lenguaje/Inglés. Resultado: 16/16 coinciden con las etiquetas de prueba; 12.886 tokens de entrada y 1.897 de salida. Sin usuarios ni DB. No se cambió el modelo de producción.
- Incluyen respuestas equivalentes en dos idiomas, defensa de la minoría con un dato correcto, respuestas incompletas y listas de palabras clave. `live-evaluation.json` conserva respuesta, resultado, feedback y huella de candidato. Dos vueltas de esta muestra **no garantizan** acierto para toda respuesta futura ni sustituyen revisión docente.
- **Navegador, componente real `LearningModule`: cinco de cinco materias verificadas**, cuatro formatos (única, múltiple, relacionar, abierta), envío de respuesta sintética, feedback, tres niveles de ayuda, modal centrado y tablas de ejemplo no duplicadas. La vista usa servicios simulados y calificaciones precalculadas con el evaluador real: no es una prueba de persistencia ni una llamada real a Supabase. El fixture inicial necesitó corregir su devolución del token de ayuda; no era un fallo del producto.
- Compilación de producción del cliente completada. Persisten los avisos existentes de tamaño de bundle/datos de Browserslist; no son fallos de esta reparación.
- `reports/hito4-2/recheck-current.json`: conserva la auditoría de los originales con el motor actual. Tres entradas inválidas de ordenamiento ahora se rechazan. `pilot.json` original permanece intacto como evidencia histórica, no se reescribe para ocultar el defecto.

## Veracidad y fuentes

Los escenarios de huerta, curso, plantas, ahorro y avisos escolares se identifican como simulados; no se atribuyen sondeos o resultados experimentales a una población real. La aritmética se prueba directamente. Los mensajes lingüísticos contienen todos sus datos, sin requerir investigación ni vocabulario literal para la calificación abierta.

- [MEN, Estándares Básicos de Competencias](https://www.mineducacion.gov.co/1621/articles-340021_recurso_1.pdf), pp. 86–87: referencia curricular de funciones para Matemáticas 8–9. No prueba por sí misma la solución del ejercicio; esa se calculó aparte.
- [MEN, DBA Lenguaje V2](https://colombiaaprende.edu.co/sites/default/files/files_public/2022-06/DBA_Lenguaje-min.pdf), p. 27, grado 5, DBA 7: planificación según situación, interlocutor e intención; se practica el guion, no se certifica oralidad.
- [MEN, Guía 7](https://www.mineducacion.gov.co/1780/articles-81033_archivo_pdf.pdf), pp. 14–15 y 34–37: referencia para comparación científica y delimitación por grupos de grado en Sociales. Los objetivos nuevos se registran como formulaciones didácticas.
- [Banco de la República, documentos del Bicentenario](https://www.banrepcultural.org/bicentenario-2010/documentos.html), enlaces al proceso del 20 de julio de 1810 y a la batalla del 7 de agosto de 1819: fechas y distinción del proceso, sin afirmar independencia consumada en 1810.
- [Archivo General de la Nación, Yugo y Libertad](https://www.archivogeneral.gov.co/exposicion_esclavitud_colombia), introducción: ley del 21 de mayo de 1851 y aplicación desde el 1 de enero de 1852. La pregunta solicita explícitamente la primera fecha.
- [MEN, Guía 22 completa](https://colombiaaprende.edu.co/sites/default/files/files_public/2022-06/Estandares_Basicos_Competencia_en_Lenguas_Extranjeras_%20Ingles-min.pdf): marco de referencia de Inglés. Cambiar de escucha a lectura en el candidato se declara; no se presenta como cumplimiento de escucha sin audio.
- [OpenAI, prácticas de evaluación](https://developers.openai.com/api/docs/guides/evaluation-best-practices): pruebas de rúbrica con etiquetas de referencia y casos límite. El modelo comprueba comportamiento del evaluador; **no es fuente de verdad histórica ni certificador curricular**.

Fuentes nuevas de historia y evaluación consultadas el 5 de noviembre de 2026; referencias curriculares y localizaciones comprobadas en la auditoría del mismo día.

## Repetir las verificaciones

Desde la raíz del proyecto:

```powershell
node scripts/quality/hito4-repairs.cjs
node scripts/quality/hito4-audit.cjs
npm --prefix server test
npm --prefix client run build
node scripts/quality/hito4-repairs-ui.cjs
```

El último comando imprime una URL de loopback. En esa vista, «Ejecutar revisión de las cinco materias» hace las comprobaciones visuales. Solo acepta las respuestas sintéticas documentadas. Para repetir las pruebas de modelo (facturables, opt-in explícito): `node scripts/quality/hito4-repairs-live.cjs --run`, límite 16 llamadas sin reintentos de SDK, hasta 700 tokens de salida por llamada. El resultado visual debe repetirse si cambia la huella de los candidatos.

## Próximo paso

La primera ronda ya tiene reemplazos comprobables y un procedimiento de corrección. Continuar con la segunda ronda de 4.2, hasta las 25 celdas previstas, conservando huecos reales; no publicar estos cinco como banco suficiente para todos los módulos. Cada nuevo defecto confirmado tendrá original/huella, acción (corregir o excluir), candidato cuando proceda y prueba de cierre. Los casos de dominio dudosos permanecen excluidos hasta resolverlos; no se marcan corregidos por haber sido inventariados.

Para habilitar el lote en 4.4 faltan correspondencia definitiva de objetivos, persistencia/versionado, lectura de ayudas predefinidas y migración verificable/reversible. Por ahora no hace falta ejecutar SQL. Reiniciar `server` carga las correcciones de código y la cuarentena; los candidatos no aparecerán en la aplicación hasta su activación posterior.
