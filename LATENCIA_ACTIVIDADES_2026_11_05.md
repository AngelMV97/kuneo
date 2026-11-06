# Latencia de actividades — 5 de noviembre de 2026

**Actualización posterior:** la observación del usuario y los registros motivaron una corrección adicional del momento del prefetch y del contrato. Ver `PREFETCH_Y_CONTRATOS_2026_11_05.md`. Este documento conserva los resultados de la comparación anterior; no describe por sí solo el flujo actual.

## Resultado y decisión

La espera en frío sigue existiendo: generar una actividad completa y revisarla son dos operaciones dependientes. No se elimina publicando un borrador ni simulando escritura. Esta investigación mejora el flujo, pero **no declara resuelta definitivamente la latencia** ni cierra la verificación de calidad del Hito 4.

Se conserva `gpt-4.1-mini` para generación, revisión, evaluación y ayudas, salvo configuración explícita previa. Se activa una instrucción de concisión en generación/revisión: omitir duplicación de la clave en `expected_text` de preguntas cerradas, evitar repetir cada justificación en la explicación general y mantener datos, rúbricas y razonamiento. No se reducen límites de salida ni se elimina la revisión independiente. Puede revertirse con `LEARNING_ACTIVITY_COMPACT=false`.

Los modelos alternativos y Fast mode quedan configurables, pero **no se activan por defecto**: ninguna alternativa demostró una mejora consistente de tiempo y calidad suficiente para justificar una migración automática. El evaluador de respuestas abiertas y los modelos de ayudas/resumen no cambian al configurar generación/revisión.

## Experimento real y reproducible

Script: `scripts/quality/latency-experiment.cjs`. Resultados completos: `reports/latency-*.json`.

- 115 intentos de generar actividades sintéticas, 13 configuraciones, cuatro modelos de OpenAI: 4.1 mini, 5.4 nano, 6 Luna y 6.1 Terra.
- Cinco materias y cinco grupos de grado; diez escenarios cubren también las cinco habilidades y cuatro formatos. Las primeras tres configuraciones usaron cinco escenarios; las siguientes, diez. Esto NO cubre las 125 combinaciones ni certifica el currículo.
- Se ejecutó el generador real con validación, reparación limitada y revisión antes de publicación. No se consultó Supabase ni se enviaron cuentas, respuestas o historial de estudiantes.
- Una auditoría adicional de Terra examinó cada actividad terminada; su tiempo y coste se excluyen de la latencia/coste de ejecución de las tablas. Sigue siendo una comprobación automatizada, no una certificación pedagógica.
- También se ensayaron ocho controles con errores conocidos. El control llamado `good-english` contiene un defecto en la propia fixture: hereda `learning_focus: Sumar cantidades`. Su expectativa `true` es incorrecta y **se excluye de cualquier comparación válida de calidad**. Se conservan los registros originales para no esconderlo.
- Algunas objeciones del auditor confunden índices desde cero con listas visibles o consideran decorativos contextos sencillos válidos. Las cifras `independentApproved` no deben tratarse como porcentajes definitivos de calidad. La revisión de producción aclara la convención de índices y no exige complejidad innecesaria en primaria; mantiene el requisito explícito de estrategia/comprobación para metacognición.
- Hubo siete ejecuciones del script: 478 solicitudes al proveedor, incluidas reparaciones, controles y auditorías. Coste total **estimado**: 0,765 USD. No es una factura; se contabilizó conservadoramente la escritura de caché y el recargo de Fast mode.

### Tiempo hasta actividad aprobada

Valores observados, en segundos, incluyendo reparaciones exitosas. Los fallos aparecen en la columna de disponibilidad y NO se esconden como éxitos rápidos. Los tiempos excluyen autenticación, consultas a Supabase, red del navegador y renderizado.

| Configuración / archivo | Terminadas | Mediana | p95 observado | Coste de generación y revisión por 1.000 intentos, estimado |
| --- | ---: | ---: | ---: | ---: |
| baseline: 4.1 mini, original | 5/5 | 6,34 | 7,38 | 2,76 USD |
| luna: Luna, estándar | 4/5 | 8,48 | 11,82 | 0,69 USD |
| nano: 5.4 nano, estándar | 4/5 | 9,31 | 19,91 | 3,04 USD |
| mini-compact: 4.1 mini, conciso | 10/10 | 4,93 | 11,49 | 2,78 USD |
| luna-compact: Luna, conciso | 9/10 | 7,25 | 16,20 | 0,73 USD |
| luna-terra: Luna + revisión Terra | 9/10 | 7,49 | 17,84 | 3,13 USD |
| luna-fast: Luna en Fast | 9/10 | 5,52 | 11,78 | 1,57 USD |
| luna-terra-fast: Luna + Terra en Fast | 10/10 | 5,73 | 11,47 | 6,44 USD |
| baseline-v2: 4.1 mini, revisión aclarada | 8/10 | 5,34 | 12,18 | 3,31 USD |
| candidate-v2: Luna + Terra Fast, revisión aclarada | 9/10 | 6,24 | 13,30 | 4,86 USD |
| mini-fast: 4.1 mini conciso en Fast | 9/10 | 4,71 | 5,82 | 5,74 USD |
| luna-mini-fast: Luna + revisión 4.1 mini Fast | 10/10 | 5,73 | 15,26 | 2,96 USD |
| terra-fast: Terra en ambas etapas, Fast | 10/10 | 6,77 | 10,07 | 7,40 USD |

Muestras pequeñas, ejecuciones secuenciales en distintos momentos y contenido estocástico: no son un ensayo A/B ni una garantía de p95 en producción. Con diez casos, el p95 observado coincide prácticamente con el máximo. El cambio de revisión entre rondas también impide atribuir todas las diferencias exclusivamente al modelo. La variante concisa conserva los criterios de corrección; su mejora de mediana es prometedora, pero no garantiza un porcentaje fijo de reducción.

Terra detectó más defectos semánticos en los controles, pero añadió coste y no redujo la espera. 5.4 nano produjo más salida y reparaciones, anulando su supuesta ventaja. Fast mode fue confirmado en `service_tier` (`priority` para 4.1 mini), no inferido solo de lo solicitado. No se activa un servicio más caro por una ventaja pequeña e inestable.

## Cambios de experiencia y caché

1. Al finalizar, la actividad y su feedback se ocultan mientras aparece **«Preparando el resumen de tu práctica…»**. Incluye recuperación de resúmenes guardados y reintento específico si fallan. No se borra la respuesta ni se inventan resultados.
2. Mientras se genera/lee el resumen se prepara **una sola actividad** para una posible nueva práctica. Se reutiliza la pendiente, se usan las respuestas ya persistidas y se conserva la revisión completa. Recargar el mismo resumen no vuelve a generar. No se prepara si no hay intentos, el módulo está consolidado o `LEARNING_PREFETCH=false`.
3. Esa preparación es independiente del resumen: si falla, el resumen sigue disponible. No escribe un intento ni concede progreso. Puede implicar el coste de una actividad no utilizada si el estudiante decide salir; está acotado a una por resumen nuevo y es desactivable.
4. `Comenzar otra práctica` era rápido cuando ya quedaba una actividad preparada; antes no estaba garantizado después de la octava respuesta, que suprime el prefetch normal. Ahora también se cubre ese cierre.
5. Las métricas separan `openai_generation`, `openai_review` y evaluación. El informe incluye `practice_restart_prefetch`, además de preparación en frío y prefetch tras respuesta.

La primera entrada a un módulo sin actividad preparada aún requiere generación y revisión. No se generan automáticamente todos los módulos visitados ni se comparte una pregunta privada entre cuentas. Para un inicio casi instantáneo y verificable hará falta un banco aprobado compatible con objetivo/grado/habilidad, que depende precisamente de inventariar y auditar en 4.1/4.2. Esto no autoriza a usar como aprobado el material heredado sin comprobarlo.

## Investigación de proveedores y estrategias

- OpenAI recomienda reducir salida redundante, evitar pasos seriales innecesarios, mantener prefijos estables y anticipar trabajo cuando existe contexto suficiente: https://developers.openai.com/api/docs/guides/latency-optimization . Aquí la revisión depende de la pregunta terminada; no se paraleliza ficticiamente ni se suprime.
- Fast mode usa `service_tier: fast`, con precio distinto y posible degradación a estándar según disponibilidad: https://developers.openai.com/api/docs/guides/fast-mode . Se comprobó el nivel devuelto en las solicitudes reales.
- Precios/modelos consultados: https://developers.openai.com/api/docs/pricing y las fichas de https://developers.openai.com/api/docs/models . Precios orientativos a la fecha, no previsión contractual.
- Anthropic documenta Haiku 5.5 para menor coste/latencia y caché de prefijos: https://platform.claude.com/docs/en/models/haiku-5-5/overview y https://platform.claude.com/docs/en/build-with-claude/prompt-caching . Se investigó; **no se probó**, porque no existe una clave configurada. Tampoco se atribuye al proyecto una latencia observada de Claude.
- Google tiene alternativas Flash/Lite: https://ai.google.dev/gemini-api/docs/models . No se probó ni se integró otro proveedor sin credenciales. Cambiar SDK, contrato JSON y políticas de revisión sin una comparación equivalente añadiría riesgos y no demuestra una mejora.

No se generó texto ficticio de carga ni se volvió a publicar una pregunta incompleta. La caché de prompts ayuda al prefijo; no evita generar la salida ni demuestra por sí sola latencia baja.

## Verificación y uso

- 78 pruebas del servidor aprobadas. Incluyen aislamiento de modelos frente al evaluador, revisión/privacidad, cuatro formatos en una práctica finita de ocho actividades, prefetch de reinicio único y fallo de prefetch sin bloquear el resumen.
- Diez comprobaciones de interfaz en navegador con el componente real y servicios simulados: cuatro formatos conservados, guardado perdido, caducidad, cambio de cuenta, ausencia de borradores y carga/reintento/recarga del resumen.
- Build del cliente correcto; ESLint del archivo modificado correcto. El lint global reporta 25 errores y 3 avisos en otros archivos no modificados; no se ocultan ni se arreglan como parte de esta investigación.
- No hay migraciones ni queries que ejecutar en Supabase. No se cambiaron claves ni el `.env` activo.
- Reiniciar el servidor habitual y actualizar el navegador. El cliente de desarrollo recarga los cambios; no abrir otro servidor sobre 3001.
- Para comparar posteriormente: `node scripts/quality/latency-experiment.cjs --variants=baseline-v2,mini-compact --limit=10 --controls` usa la API y genera costes. El script tiene límites por ejecución; no ejecutarlo masivamente ni tratar el auditor como verdad final.

Antes de declarar cerrado el problema, medir tráfico real anonimizado con `scripts/quality/hito4-metrics.cjs`: separar entrada fría, entrega preparada, reparaciones y fallos. Esta investigación no avanza ni modifica el inventario 4.1.
