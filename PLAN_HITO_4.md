# Hito 4: reserva verificada y publicación estable

Plan propuesto el 4 de noviembre de 2026. Este documento no modifica el comportamiento de la aplicación ni ejecuta escrituras en Supabase.

Actualización del 5 de noviembre: 4.0 implementado y comprobado mediante pruebas de servidor y navegador con servicios simulados. Registro de cambios, evidencias y límites en [HITO_4_0_2026_11_05.md](HITO_4_0_2026_11_05.md). La medición y validación operativa con infraestructura real siguen separadas de estas pruebas; 4.1 y la auditoría del contenido aún no se han ejecutado.

Actualización posterior del 5 de noviembre: **4.1 completado como inventario técnico de solo lectura**, con dos lecturas coincidentes del currículo real, recuentos conciliados y cola de auditoría. Ver [HITO_4_1_2026_11_05.md](HITO_4_1_2026_11_05.md). No se concedió ninguna aprobación pedagógica ni se modificó la reserva; 4.2 sigue pendiente. La latencia inicial permanece registrada como pendiente.

## Resultado esperado

Una actividad completa y aprobada se presenta una sola vez. La reserva conserva el objetivo pedagógico, el grado y la habilidad requeridos. El contenido existente se revisa antes de considerarlo confiable; tener `enriched_content` no equivale a estar validado.

No se intentará enriquecer todo el catálogo de una vez. Cada etapa entrega resultados verificables y puede detenerse sin perder lo aprobado anteriormente.

## Hallazgos que determinan el orden

- `learningContent.js` transmite el borrador del enunciado antes de validar formato y realizar la revisión independiente. Puede emitir un reinicio durante reparación y finalmente seleccionar reserva.
- `LearningModule.jsx` muestra ese borrador durante la preparación. Por eso el estudiante puede leer una pregunta que después desaparece.
- La reserva actual busca otras preguntas del módulo y puede cambiar el paso objetivo; la correspondencia pedagógica requiere una regla explícita, no solo pertenecer al mismo módulo.
- `check-enrichment-status.sql` distingue contenido nulo/no nulo. Sirve para un recuento, pero no comprueba veracidad, claves, renderizado ni compatibilidad con el motor actual.
- Los scripts históricos de enriquecimiento deben inspeccionarse y adaptarse antes de ejecutarlos. No son una autorización para sobrescribir el material actual.

## Etapa 4.0 — Publicar una sola actividad estable

Primero corregir la exposición prematura de borradores y clasificar fallos de generación.

1. Separar preparación y publicación: generar, validar, revisar, reparar si procede, seleccionar una reserva compatible si hace falta y solo después enviar contenido al estudiante.
2. Mientras se prepara, transmitir únicamente estados breves y estables. No mostrar texto de una pregunta todavía no aprobada. La aparición progresiva de texto aprobado sería una opción visual posterior; no se presentará como reducción del tiempo real de generación.
3. Conservar la preparación anticipada después de guardar una respuesta. Medir por separado la primera pregunta en frío y las siguientes ya preparadas.
4. Una vez publicada, conservar identidad, enunciado, opciones, clave y ayudas asociadas. Un fallo de guardado o evaluación permite reintentar la misma actividad; no debe reemplazarla ni borrar la respuesta.
5. Distinguir disponibilidad/red, límite de proveedor, salida incompleta, tiempo agotado, contrato inválido y rechazo pedagógico. Los diagnósticos técnicos permanecen en registros de desarrollo, sin claves ni respuestas personales innecesarias.
6. Si no existe una actividad aprobada ni una reserva compatible, mostrar un estado recuperable sin inventar preguntas, cambiar de objetivo ni contabilizar un intento.

**Verificación:** fallos provocados al comenzar, a mitad de generación, durante revisión, durante reparación y durante guardado. Incluir desconexión, reintento, petición duplicada y cambio de cuenta/módulo. Ningún evento anterior a la aprobación contiene el enunciado; lo mostrado coincide con el token evaluado; no aparecen dos preguntas distintas en una misma preparación ni intentos duplicados. Comprobar en navegador, además de pruebas automatizadas.

**Medición:** tiempo hasta actividad aprobada, p50/p95 en frío y con preparación anticipada, proporción de reparaciones/rechazos/reservas y causa final. Una animación más rápida no cuenta como menor latencia.

## Etapa 4.1 — Inventario técnico reproducible, sin modificar contenidos

**Revisión de latencia previa (2026-11-05):** ver `LATENCIA_ACTIVIDADES_2026_11_05.md`. Se probaron 115 actividades sintéticas con cuatro modelos y 13 configuraciones. Se mantiene la publicación posterior a validación/revisión, se reduce redundancia y se prepara una actividad durante el resumen. La primera entrada en frío sigue teniendo espera; no se declara resuelta definitivamente ni se inicia 4.1 en esa intervención.

Obtener una instantánea de lectura de módulos y pasos activos de `kuneo`, sin exportar cuentas ni historial personal. Conservar identificadores, materia, grado, objetivo, habilidad declarada, formato, material asociado y huella del contenido.

Ejecutar primero controles automáticos económicos, sin llamadas masivas a modelos:

- JSON y contratos legibles por el motor activo; campos obligatorios y formatos realmente reconocidos.
- Claves dentro de rango, opciones distintas, parejas completas/no ambiguas y rúbricas presentes.
- Textos genéricos como «Opción A», datos ausentes, dependencias de lecturas/gráficas no incluidas y referencias a visuales inexistentes.
- Correspondencia entre materia, grado, objetivo y metadatos; duplicados exactos y candidatos a duplicación.
- Distinguir unidades de medida: pasos, preguntas individuales, tarjetas y visuales. Un paso puede contener varias preguntas.

Clasificar como ausente, pendiente de enriquecimiento, fallo técnico, candidato a revisión, aprobado para una versión concreta o retirado de selección por defecto conocido. «Candidato» nunca significa «veraz».

**Cierre:** recuentos reconciliados y reproducibles, lista de defectos con IDs y reglas que los detectaron, e identificación de las primeras preguntas a auditar. Puede leerse todo el catálogo para contar; no se tratará esa lectura como una revisión pedagógica completa.

## Etapa 4.2 — Auditar material ya enriquecido en muestras pequeñas

**Primera ronda:** cinco preguntas existentes, una por materia y con grados variados. Recorrer cada una completa: enunciado, solución independiente, clave/rúbrica, distractores, feedback, pistas, ejemplo y visual. Validar así el procedimiento antes de ampliarlo.

**Segunda ronda:** ampliar hasta 25 preguntas existentes, cubriendo las cinco materias por los cinco grupos de grado. Distribuir las cinco habilidades y los cuatro formatos dentro de la muestra, incluyendo casos con tablas/fórmulas y preguntas sospechosas detectadas en 4.1. Si falta material en una celda, registrar la ausencia; no reemplazarla por otro grado ni inventar cobertura.

La muestra diagnostica el material heredado; no certifica las 125 combinaciones ni todos los objetivos.

### Criterios de veracidad y utilidad

- Resolver sin asumir que la clave o respuesta de referencia sean correctas. En preguntas cerradas, revisar cada opción o pareja, no solo la marcada como correcta.
- Comprobar cálculos y equivalencias por procedimientos independientes cuando sea viable. No presentar una comprobación numérica parcial como prueba universal de equivalencia.
- Contrastar afirmaciones científicas, históricas, lingüísticas y curriculares con fuentes primarias o institucionales pertinentes. Los estándares curriculares comprueban alineación, no demuestran por sí solos cada afirmación factual.
- Registrar fuente, localización o enlace, fecha de consulta y qué afirmación respalda. Identificar relatos, encuestas y escenarios ficticios como simulados cuando puedan confundirse con hechos reales.
- Verificar unidades, dominios físicos, tablas y conclusiones; fidelidad entre visual y datos; idioma y complejidad por grado; diversidad y pertinencia del contexto colombiano.
- En abiertas, aceptar respuestas equivalentes y alternativas justificadas. No imponer una opinión como única respuesta verdadera.
- Probar respuestas correctas alternativas, errores plausibles, respuestas parciales y selecciones omitidas/añadidas. Verificar el feedback y las ayudas, incluida la ausencia de filtración de la solución pendiente.

La IA puede ayudar a revisar, pero una segunda respuesta de IA no constituye una fuente ni una certificación. Los casos no resueltos se mantienen pendientes; las dudas especializadas se derivan a revisión de dominio.

**Cierre por ronda:** cada elemento tiene un dictamen, evidencia y versión revisada. No quedan errores críticos conocidos en el lote que se propone habilitar. Si falla el método o aparecen defectos repetidos, se ajusta la regla y se revisan las preguntas relacionadas antes de ampliar.

## Etapa 4.3 — Reparar y enriquecer por lotes limitados

Priorizar preguntas defectuosas con posibilidades claras de reparación y huecos de reserva en recorridos que ya se utilizan. Después ampliar según uso, carencias y diversidad curricular.

- Lotes de entre 10 y 20 preguntas; presupuesto de coste, llamadas y tiempo fijado antes de cada ejecución, con parada automática y como máximo una reparación automática por candidato.
- Separar candidatos del contenido publicado. Generar o corregir no implica habilitar.
- Usar el mismo procedimiento de revisión para material antiguo reparado y nuevo; no dar trato de confianza al contenido heredado.
- Guardar original y candidato, motivo del cambio, fuentes, resultados de pruebas y huella de versión. Reanudar por IDs pendientes sin duplicar trabajo ni facturación innecesaria.
- Un defecto crítico bloquea ese candidato, no obliga a sobrescribir o descartar todo el catálogo.

**Cierre por lote:** revisar todos los candidatos del lote, probar su renderizado y evaluación, e informar aprobados, rechazados, pendientes, coste y cobertura realmente añadida. No iniciar el siguiente lote para compensar un porcentaje bajo sin entender las causas.

## Etapa 4.4 — Activar reserva aprobada de forma gradual

Definir una correspondencia explícita entre reserva y materia/grado/objetivo/habilidad. No seleccionar «cualquier pregunta del módulo» ni otro objetivo silenciosamente. La aprobación se vincula a una versión: una modificación invalida el dictamen anterior.

Activar primero un recorrido pequeño con reserva suficiente y luego ampliar por lotes. Probar con dos cuentas, respuestas nuevas y antiguas, repetición de solicitudes, caída de OpenAI y latencia elevada. Si la reserva se agota, informar de forma comprensible y permitir reintento o salida; no prometer variedad infinita de un banco finito.

**Reversión:** deshabilitar el lote sin borrar el original ni alterar intentos anteriores. Los intentos deben seguir identificando la versión que se mostró y evaluó.

Los cambios de esquema necesarios para estados/versiones se diseñarán después del piloto. Se prepararán las migraciones y verificaciones exactas para Supabase antes de ejecutarlas; no reutilizar scripts históricos de limpieza.

## Etapa 4.5 — Ampliar cobertura con seguimiento

Extender por celdas prioritarias de materia/grado/habilidad y por objetivos concretos. Las 125 combinaciones son una guía de cobertura, no el tamaño total del currículo ni una prueba de suficiencia.

Mantener un panel o informe que separe cantidad existente, técnicamente válida, pedagógicamente revisada y habilitada. Revisar regresiones tras cambiar generador, evaluador, esquema o visuales. Una muestra posterior puede detectar regresiones, pero no sustituye la revisión inicial de los candidatos que se habilitan.

**Cierre del hito:** reserva mínima y recorridos prioritarios acordados con cobertura explícita; cada contenido habilitado tiene validación trazable; caída del proveedor demostrada sin sustitución visible, cambios de objetivo ni pérdida de respuestas. Persisten como trabajos distintos el offline completo y la expansión exhaustiva del currículo.

## Próximo bloque de trabajo

Ejecutar 4.0 y construir el diagnóstico de lectura de 4.1. Entregar las pruebas del flujo estable y el primer informe de candidatos. Después auditar las cinco preguntas de 4.2 antes de decidir el primer lote de reparación. En esta fase no hace falta que el usuario ejecute consultas o escrituras en Supabase.

### Actualización 2026-11-05 — 4.2, primera ronda

Se revisaron las cinco preguntas seleccionadas en 4.1, con originales/huellas, contraste curricular/factual y 16 pruebas locales reproducibles del evaluador legado. **Ninguna de las cinco versiones se propone para habilitar.** Ver `reports/hito4-2/README.md` y ejecutar `node scripts/quality/hito4-audit.cjs`.

La segunda ronda no se inicia aún: los defectos repetidos requieren ajustar pregunta/rúbrica/asociaciones antes de ampliar, conforme a la puerta de cierre de 4.2. La cohorte de 544 candidatos por palabras clave se identifica para revisar, sin certificación masiva. Pendientes: candidatos de reparación separados, nueva auditoría y comprobación de renderizado en navegador. Sin cambios de base de datos ni del motor activo; sin coste de modelos.

### Actualización posterior 2026-11-05 — Reparación del piloto

Se corrigieron los cinco casos mediante reemplazos aislados con pregunta, rúbrica/clave, feedback, pista, tarjeta conceptual, ejemplo y visual. Se verificaron con 99 pruebas, 16 evaluaciones reales de rúbricas y navegador en las cinco materias. Originales conocidos excluidos de nuevas reservas; contratos de ordenamiento y conservación de explicaciones corregidos. Ver `reports/hito4-3-pilot/README.md`.

Los candidatos siguen inactivos y sin publicar en Supabase. Sociales/Inglés requieren objetivos propios corregidos: no se sobrescriben módulos compartidos con pasos sin auditar. La publicación/versionado y conexión de ayudas quedan en 4.4. **Próximo lote: segunda ronda de 4.2**, registrando y corrigiendo cada inconsistencia confirmada, con exclusión mientras no haya un cierre verificable. No usar conteos de inventario como sustituto de esa corrección.

### Actualización posterior — Segunda ronda y ciclo abierto de 4.2

Por indicación del usuario, mantener abierto el ciclo 4.2 hasta corregir y verificar los hallazgos de los lotes auditados. Auditar es 4.2; reparar contenido es 4.3; persistir/publicar y conectar reserva aprobada es 4.4. Sus estados deben permanecer separados, aunque se ejecuten de forma iterativa por lote.

Ronda 2: 25 celdas planificadas, 16 seleccionadas, 9 vacías; 3 preguntas reutilizadas del piloto y 13 nuevas. Se prepararon y verificaron 13 reemplazos adicionales; 18 originales únicos excluidos de nuevas reservas y 18 candidatos inactivos en total. Rúbricas abiertas corregidas mediante criterios con evidencia; 105 pruebas, 24 evaluaciones reales nuevas y 16 regresiones finales aprobadas; 13 vistas comprobadas. Ejecuciones fallidas preservadas. Ver `reports/hito4-2-round2/README.md`.

**No se cierra el catálogo ni la publicación.** Pendientes: 557 candidatos técnicos sin auditoría pedagógica (535 por palabras clave), materiales compartidos asociados, huecos y fallos técnicos de 4.1. Próximo lote por familias de defectos, con evidencia y corrección verificable, sin aprobación masiva por similitud. Lista versionada en `reports/hito4-2-round2/worklist.json`.

### Actualización posterior — Lote 3 y quinto formato

Nueve originales adicionales auditados y con reemplazos locales, cinco de reordenamiento. Total: 27 originales revisados/excluidos y 27 candidatos inactivos, cero publicados. 113 pruebas aprobadas, compilación y nueve vistas verificadas. Corregida también la tolerancia numérica cero. Pendientes: 548 candidatos técnicos, 528 por palabras clave, más huecos/fallos técnicos anteriores. Ver `reports/hito4-2-round3/README.md` y `worklist.json`.

Reordenar es pertinente solo con orden único sustentado. Se conserva la sesión de ocho; se preparó una redistribución experimental que incorpora el quinto formato, sin aumentar automáticamente a diez. Generación, revisión, evaluación, mezcla, historial y controles accesibles implementados. **Generación dinámica desactivada por defecto**: el último ensayo alcanza 4/5 y no permite activar sin nuevas esperas/errores. No cambiar el modelo de producción ni activar `LEARNING_ORDERING_ENABLED` para estudiantes hasta cerrar esa prueba o habilitar reserva revisada en 4.4. Mantener separación entre contenido local corregido y publicación.

### Regresión posterior — Opciones duplicadas en enunciados

Corregida la presentación de nuevas actividades cuando se repiten exactamente las opciones como lista o tabla de respuestas. Se preservan tablas de datos y claves; prevención en generación/revisión y pruebas de integración sin llamadas adicionales. Revisión automática específica del snapshot, sin aprobación pedagógica masiva ni cambios de Supabase. Ver `reports/hito4-2-presentation/README.md`. Sigue abierto 4.2, con 27 originales revisados y 548 candidatos pendientes de auditoría pedagógica.

### Lote dinámico — Variedad dentro de la práctica

Revisor compara ahora preguntas previas y pendiente de lookahead; generación recibe tarea por dimensión y orientación de contexto. Reservas ya vistas y plantilla calculada de sumas dejan de reciclarse silenciosamente. Tres ensayos acotados de ocho actividades de Ciencias conservados; último entrega ocho con 16 llamadas y mejora escenarios, pero no cierra validación pedagógica. Pendientes explícitos y trazas en `reports/hito4-2-variety/README.md`. No confundir entrega válida técnicamente con contenido aprobado; no publicar estos ensayos en el banco. Sin modificación de Supabase ni activación de modelos/formatos experimentales.

### 2026-11-06 — Alcance de indagación y anticipación condicional

Reproducidas las limitaciones de las instrucciones generales de variedad y de la anticipación cuando la siguiente habilidad depende de la respuesta. Corregidos casos generales de indagación sin desplazar objetivos específicos; bloqueo de tablas adicionales de respuestas, relaciones triples y notas/claves internas. Prefetch puede preparar una candidata condicional solo con paso estable, validada contra la ruta real tras guardar; nunca genera respuestas ficticias de alumnos ni utiliza una habilidad que no corresponde. Prueba completa de ocho actividades y reinicio, diagnóstico de esperas y descarte por resultado distinto. Ocho actividades de ensayo real más reparación enfocada; 50 combinaciones cerradas verificadas. Ver `reports/hito4-2-inquiry/README.md`, incluyendo el ensayo de alcance equivocado descartado, las limitaciones de evaluación abierta y el estado del catálogo que sigue pendiente. No se cierra 4.2 ni se publica contenido en Supabase.

### 2026-11-06 — Lote 4 del catálogo

Siete originales adicionales de Ciencias Sociales auditados y con reemplazos locales: tres tareas históricas bajo un objetivo espacial, tres preguntas generales sobre desigualdad/polarización sin evidencia suficiente para una clave única y una asociación de derechos con ayudas imprecisas y tarjeta de línea de tiempo. Se preservan objetivos, fuentes y asociaciones; se crean ayudas propias sin sobrescribir recursos compartidos. Contraste con MEN/UNICEF, 54 respuestas cerradas verificadas, 132 pruebas aprobadas y siete vistas en navegador comprobadas con servicios simulados. Originales excluidos de nuevas reservas; candidatos inactivos, sin publicar ni conectar a Supabase. Ver `reports/hito4-2-round4/README.md`.

Estado vigente del catálogo: **34 originales únicos auditados/excluidos, 34 candidatos locales inactivos, 541 candidatos técnicos pendientes (528 por palabras clave), cero publicados**. La lista actual está en `reports/hito4-2-round4/worklist.json`. Mantener abierto 4.2: siguientes cinco preguntas cerradas y luego cohorte abierta; no inferir aprobación o defecto por parecido temático.

### 2026-11-06 — Lote 5: cierre de la parte cerrada de la cola técnica

Cinco originales adicionales revisados y reemplazos preparados: organizaciones, derechos y una lectura histórica. Se preservan claves válidas como tales; se corrigen ayudas que revelaban respuestas, tarjetas de otros temas y cobertura de objetivos. El candidato histórico se aísla en 8–9 tras contrastar MEN y una fuente primaria de 1863; no se reclasifica el módulo compartido ni se publica contenido. 39 combinaciones de respuesta verificadas, 135 pruebas aprobadas y cinco vistas comprobadas con servicios simulados. Ver `reports/hito4-2-round5/README.md`.

Estado al finalizar lote 5: **39 originales únicos auditados/excluidos, 39 candidatos locales inactivos, 536 candidatos técnicos pendientes (528 por palabras clave y ocho abiertas con coincidencia exacta), cero publicados**. Ya no quedan preguntas cerradas legibles pendientes en esa cola inicial; esto no certifica el catálogo completo ni cierra 4.2. Lista histórica: `reports/hito4-2-round5/worklist.json`.

### 2026-11-06 — Lote 6: ocho abiertas con coincidencia exacta

Auditados los ocho originales restantes de ese grupo y excluidos de nuevas reservas. Ocho candidatos locales con situaciones completas, criterios explícitos y ayudas propias; alcance escrito declarado para objetivos orales o de ejecución experimental. Ensayo final 32/32 respuestas sintéticas clasificadas como se esperaba, 138 pruebas aprobadas y ocho vistas comprobadas. Reparada la validación de citas mediante referencias a fragmentos originales del estudiante y una reparación acotada; trazas fallidas conservadas. Ver `reports/hito4-2-round6/README.md`.

Estado vigente: **47 originales auditados/excluidos, 47 candidatos locales inactivos, 528 candidatos técnicos pendientes por palabras clave, cero publicados**. Lista: `reports/hito4-2-round6/worklist.json`. Continuar 4.2 con muestras por objetivo/grado/materia disponibles, verificación de fuentes y pruebas de respuestas equivalentes, parciales y sin razonamiento. No publicar automáticamente ni dar por resuelta la latencia inicial o cerrado el catálogo.
