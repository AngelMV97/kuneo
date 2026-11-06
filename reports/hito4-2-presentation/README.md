# 4.2 — Regresión de presentación: alternativas duplicadas

Se reproduce el defecto observado en actividades dinámicas: alternativas A/B/C en el enunciado y controles; en relacionar, tabla de hipótesis repetida antes de los controles.

Corrección local en `server/learningPresentation.js`, aplicada por `learningContent.js` a generación antes de revisión, normalización de reserva y entrega de nuevas actividades. Elimina exclusivamente bloques independientes que coinciden con alternativas existentes: listas rotuladas, alternativas separadas bajo un encabezado explícito y tablas de respuestas de una columna. Conserva tablas de datos de varias columnas, tablas de observaciones, menciones integradas, citas y bloques que no coinciden. No transforma paráfrasis mediante similitud ni inventa un enunciado si faltaba. Preguntas abiertas permanecen intactas. Las claves y los índices no se modifican.

La generación y revisión reciben instrucciones de separar alternativas y datos. No se agrega otra llamada de IA ni se modifica el prefetch, el modelo o el número de actividades. Las actividades pendientes ya firmadas se conservan para no cambiar una pregunta que el alumno ya empezó; la corrección aplica a nuevas entregas. No hay cambios de Supabase.

Verificación reproducible:

- `node --test server/learningPresentation.test.js`: casos estructurales equivalentes a las capturas, listas Markdown y líneas partidas, conservación de contexto/tablas/citas, idempotencia, claves intactas y evaluación correcta/incorrecta. Integración con modelo simulado: dos llamadas habituales (generación y revisión), pregunta corregida idéntica en revisión, entrega y token firmado.
- `node scripts/quality/hito4-presentation-audit.cjs`: recorre el snapshot histórico sin modificarlo, preserva huellas y guarda los hallazgos en `audit.json`. No consulta cuentas, red ni Supabase; no constituye aprobación factual o curricular.
- `npm test` desde `server`: suite completa, incluidos contratos, reserva, evaluación y prefetch.

El resultado de esta revisión de presentación no aumenta las 27 preguntas pedagógicamente auditadas ni reduce los 548 candidatos pendientes del lote anterior. Los 27 reemplazos siguen locales/inactivos; cero publicados. Continuar por lotes con evidencia, reparación y verificación antes de habilitar material.
