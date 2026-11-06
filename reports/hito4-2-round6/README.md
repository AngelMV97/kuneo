# Hito 4.2 · Lote 6 · 2026-11-06

Ocho originales de respuesta abierta evaluados mediante coincidencia exacta, en Ciencias Sociales 10–11, Lenguaje 1–3 y Ciencias Naturales 1–3. Los originales y sus asociaciones completas permanecen en `audit.json`, con huellas del snapshot, módulos, tarjetas y visuales. No se modificó Supabase.

## Hallazgos y correcciones

Las 32 pruebas de los originales muestran que copiar la referencia se acepta en los ocho casos; cambiar la puntuación o parafrasearla se rechaza. Seis referencias son instrucciones sobre cómo evaluar, no respuestas resueltas. Las paráfrasis de esas referencias demuestran fragilidad literal: no acreditan resolver las tareas originales, que carecen de situaciones o textos necesarios.

Se prepararon ocho candidatos autocontenidos, con situaciones ficticias, dos criterios explícitos por actividad y ayudas propias. Los casos económicos separan cifras proyectadas de resultados observados y permiten decisiones justificadas diferentes. Lenguaje evalúa preparar/revisar un mensaje escrito, sin atribuir desempeño oral. Ciencias evalúa planear/revisar diseños hipotéticos, sin atribuir ejecución experimental. Cada candidato tiene tarjeta conceptual y ejemplo con otros datos; no se sobrescriben recursos compartidos. Los candidatos están inactivos y **ninguno fue publicado**.

Contraste curricular:

- [MEN, Estándares de Ciencias y Ciencias Sociales](https://www.mineducacion.gov.co/1780/articles-81033_archivo_pdf.pdf), páginas impresas 14 y 39. El antecedente de «estos modelos» es el desarrollo económico; el tema genérico territorio del original no basta. El diseño y ejecución de experiencias exige distinguir qué evidencia recoge una interfaz escrita.
- [MEN, Estándares Básicos de Competencias](https://www.mineducacion.gov.co/1621/articles-340021_recurso_1.pdf), página impresa 32: producción oral de primero a tercero incluye aspectos que una respuesta escrita no permite comprobar. El alcance del reemplazo se declara más limitado.

## Evaluación y error reproducido

El ensayo inicial obtuvo 31/32 resultados esperados (`live-initial.json`; versiones iniciales de candidatos y auditoría conservadas). El segundo, con un reintento acotado, volvió a fallar en una respuesta sobre papel y agua (`live-evidence-retry-failed.json`). Sus trazas muestran que el evaluador identificó los criterios correctamente, pero alteró la cita del estudiante: primero una tilde y luego una letra visualmente parecida. La validación rechazó ambas citas.

La evaluación por criterios ahora proporciona fragmentos exactos de la respuesta con identificadores. El modelo señala esos identificadores y el servidor recupera el texto original. Continúa validándose que la evidencia pertenezca a la respuesta; no se flexibilizó mediante equivalencia semántica de citas. Se conserva compatibilidad con citas literales válidas. Hay como máximo una reparación del contrato, dentro de un plazo total de 12 segundos; no hay reintentos ilimitados ni nota inventada si falla. Las rúbricas sin criterios explícitos y la comparación exacta de otras tareas no se convierten automáticamente.

El ensayo final (`live-evaluation.json`) completó **32/32** resultados esperados: por candidato, dos respuestas correctas parafraseadas, una parcial y una lista de palabras incorrecta. Usó gpt-4.1-mini, 32 llamadas, 18.371 tokens de entrada y 2.360 de salida, sin reparación adicional. Los tres ensayos suman 97 llamadas. Son respuestas sintéticas y una muestra acotada; no prueban infalibilidad del evaluador ni aprobación global del catálogo. La huella del evaluador del ensayo final precede únicamente a añadir la importación de la cuarentena del lote 6; `verification.json` registra la versión final del archivo.

## Verificación reproducible

Desde la raíz:

```powershell
node scripts/quality/hito4-round6.cjs
node scripts/quality/hito4-round6-check.cjs
node scripts/quality/hito4-repairs-ui.cjs --round6
```

Desde `server`, `npm test`: **138 aprobadas**, incluidas exclusión efectiva de las ocho reservas y reparación/rechazo de evidencias inválidas. Registro: `unit-tests.txt`.

Ocho vistas verificadas en navegador con `LearningModule` real y servicios de vista simulados: pregunta, entrada de respuesta, feedback precalculado por el evaluador real, ventana de ayuda centrada, tarjeta, ejemplo y visual. Resultado visible del piloto: **PASS 8/8**. No se usaron cuentas, respuestas reales ni llamadas de IA durante esa comprobación visual.

## Estado y siguiente lote

**47 originales únicos auditados/excluidos, 47 reemplazos locales inactivos, 528 candidatos técnicos pendientes —todos de la cohorte por palabras clave— y cero publicados.** No quedan abiertas `exact_text` ni preguntas cerradas legibles pendientes de la cola técnica inicial. Esto no certifica las 528 restantes, los huecos ni los fallos técnicos del inventario.

Seguimos en 4.2. El siguiente lote debe muestrear esa cohorte por objetivo, grado y materia disponible, comprobar el enunciado y la referencia antes de enriquecer, y probar paráfrasis, respuesta parcial y palabras sueltas. Conservar los hallazgos y ensayos fallidos. La publicación de reservas y el banco persistente pertenecen a fases posteriores; la latencia inicial sigue pendiente.
