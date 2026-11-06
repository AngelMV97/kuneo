# Preparación durante la actividad y fallos de contrato

## Diagnóstico con los registros reales

El prefetch no se había desactivado, pero comenzaba después de evaluar y guardar la respuesta, no al publicar la actividad actual. Mi explicación anterior de ese momento fue imprecisa.

En `server/logs/learning-runtime.jsonl` se observaron preparaciones fallidas de aproximadamente 9,5–11,2 segundos, con dos generaciones rechazadas por `contract` y sin llegar a revisión pedagógica. El diagnóstico antiguo no registraba el subcampo fallido; no permite afirmar cuál era en cada una de esas solicitudes.

También hay un ejemplo de preparación correcta que tardó 6,6 s después de responder: el estudiante pidió continuar antes de que terminara y esperó todavía 4,6 s. Que la respuesta fuera finalmente una entrega de caché no significaba que ya estuviera lista cuando la pidió.

## Cambios

### Preparar durante la lectura y respuesta

`learningLookahead.js` calcula el siguiente objetivo/habilidad para todos los resultados posibles (`correct`, `partial`, `incorrect`) y niveles de ayuda 0–3. Solo prepara anticipadamente si todos coinciden y la siguiente habilidad es distinta de la actual. Si una respuesta puede consolidar el objetivo o cambiar la habilidad siguiente, conserva la preparación posterior a la evaluación.

No se inventa ni guarda una respuesta para hacer la predicción. El generador recibe exclusivamente evidencia real anterior, el objetivo acordado por todas las posibilidades y el formato de la siguiente posición. No recibe un acierto hipotético como evidencia. La actividad en pantalla se excluye de las preguntas a repetir.

- La llamada al modelo no toma el bloqueo de envío/pistas del estudiante.
- Hay como máximo una generación especulativa activa por estudiante. Solo se inicia para una actividad entregada, nunca encadenando generaciones desde tareas de fondo.
- El candidato permanece privado hasta generar, validar y revisar por completo.
- Tras guardar la respuesta real, se comprueba otra vez el objetivo, habilidad, posición de formato, grado y una huella del currículo e historial anteriores. Si cambió algo relevante, se descarta y se prepara con la evidencia actual.
- Una entrega desde la caché inicia la preparación de la siguiente; recargar o repetir peticiones no genera otra para la misma actividad.
- Un fallo de la preparación anticipada no sustituye la actividad actual ni crea intentos. Se conserva la vía normal después de guardar.
- La preparación puede implicar una actividad no utilizada si el estudiante sale. Para desactivarla conservando el prefetch posterior a responder: `LEARNING_LOOKAHEAD=false`. `LEARNING_PREFETCH=false` desactiva ambas vías. No se modificó el `.env` activo.

### Contrato por tipo de pregunta

La reproducción sintética mostró fallos en justificaciones, opciones/claves y selección múltiple. El esquema anterior admitía combinaciones estructuralmente incompatibles que solo se rechazaban después de generarlas.

`learningActivitySchema.js` ahora solicita únicamente los campos del formato correspondiente, con límites nativos de longitud de arrays e índices. Mantiene una alternativa de respuesta abierta cuando el formato cerrado no evalúa honestamente el objetivo. Las preguntas abiertas requieren una referencia no vacía; selección y parejas conservan las justificaciones necesarias. Este uso de restricciones y alternativas anidadas sigue la [documentación de Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

No se rellena una clave ni se inventa una justificación faltante. Se elimina únicamente metadata de explicaciones que no aplica al formato —por ejemplo, explicaciones de parejas en una pregunta de selección—. Los errores de reparación identifican ahora el campo y la cantidad esperada. Las métricas y la consola distinguen `explanations_count`, `choices_or_key`, `multiple_selection`, `matching_pairs`, `expected_answer`, etc., sin registrar enunciados, respuestas o claves de API.

La revisión pedagógica continúa después de validar el formato. Un JSON válido no demuestra corrección de contenido.

### Reserva compatible

Además del material almacenado compatible, el servicio conserva temporalmente hasta 200 actividades generadas/revisadas, durante una hora. **200 es el límite total por proceso de servidor, no un lote que se genere al comenzar ni una cuota por usuario.** La caché empieza vacía y se llena con las actividades que ya se generan en el flujo habitual (incluida la siguiente anticipada); no provoca llamadas adicionales a OpenAI para llenarse. Cada entrada se distingue por usuario, módulo, paso, grado, habilidad y huella del currículo. Conserva la última actividad de cada combinación; otra nueva de esa combinación sustituye a la anterior. También puede conservar actividades calculadas por el motor sin usar IA. Ante un fallo puede reutilizarse una de esas actividades del mismo contexto; se firma un token con identidad nueva para no confundirla con un intento ya evaluado. Puede repetir una pregunta anterior en una contingencia.

Esta reserva vive en memoria, se pierde al reiniciar el servidor y no escribe contenido ni intentos en Supabase. No se comparte entre cuentas ni se reutiliza si cambió el grado o el currículo.

Si es la primera actividad de un contexto y no existe ni una reserva compatible almacenada ni una temporal revisada, sigue siendo posible un error recuperable. Esta corrección no transforma preguntas de otra habilidad en reservas ni completa el material pendiente del Hito 4.1/4.2.

## Verificación

- **85 pruebas del servidor aprobadas.** Incluyen preparación antes de responder sin bloqueo de pistas/envío, promoción del mismo candidato, no duplicar intentos, fallo de preparación anticipada, descarte tras cambiar el grado/currículo/evidencia, resultados inciertos, privacidad y reservas separadas por usuario/grado/objetivo. Las pruebas del antiguo prefetch se conservan explícitamente con lookahead desactivado, además de las nuevas pruebas con él activado.
- Tres tandas de diez actividades sintéticas con OpenAI real: la segunda reprodujo dos fallos finales de contrato; la tercera, con el esquema específico, terminó **10/10 sin rechazo de contrato**. Archivos: `reports/latency-prefetch-contracts*.json`. Coste estimado de esas tres tandas, incluidas sus auditorías: 0,142 USD. Muestra pequeña; no garantiza ausencia futura de errores. El auditor adicional sigue detectando objeciones semánticas: no es una certificación de calidad de las diez actividades.
- **Prueba de extremo a extremo con el modelo real y el router real**, usando una base sintética en memoria, sin Supabase: primera entrega 5.587 ms; siguiente candidato listo antes de responder; guardado 61 ms; entrega siguiente **8 ms**, con exactamente la identidad del candidato revisado y un único intento guardado. Cuatro llamadas al proveedor. Evidencia: `reports/lookahead-live.json`; reproducción explícita con coste: `node scripts/quality/lookahead-live.cjs`.
- Los 8 ms no incluyen la autenticación/consultas de Supabase reales ni establecen un objetivo de producción. La primera pregunta sigue generándose en frío. Si se continúa antes de terminar la preparación, o el resultado cambia la ruta, puede haber espera.
- Las métricas incluyen `activity_lookahead`, su uso/descarte y los subtipos de fallo de contrato. Un prefetch fallido ya no tiene que diagnosticarse solo como «503».

No hay queries ni migraciones que ejecutar. Reiniciar únicamente el servidor habitual para cargar el cambio; el cliente no fue modificado en esta intervención. No se avanzó al inventario 4.1.
