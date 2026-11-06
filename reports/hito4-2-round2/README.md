# Hito 4.2 — Ampliación y corrección, ronda 2

Fecha: 2026-11-05. **Seguimos en el ciclo de auditoría/corrección; no se declara terminado todo el catálogo.**

## Qué se cerró en este lote

| Medida | Resultado |
|---|---:|
| Celdas materia/grupo de grado previstas | 25 |
| Celdas con una pregunta seleccionable en la instantánea | 16 |
| Celdas sin candidato técnico compatible | 9 |
| Preguntas seleccionadas ya revisadas en el piloto | 3 |
| Preguntas nuevas auditadas y con reemplazo preparado | 13 |
| Originales distintos revisados entre las dos rondas | 18 |
| Reemplazos publicados en Supabase | 0 |

Una celda no equivale a un grado individual ni a todos sus objetivos. Matemáticas 1–3 usa un original de rango 3–5 cuya intersección es solo grado 3; el reemplazo se restringe a 3. No se anuncia cobertura de 1 y 2 por esa pregunta. Tampoco se rellenaron celdas vacías con contenido inventado para simular cobertura.

Los nueve huecos siguen siendo: Matemáticas 6–7 y 10–11; Ciencias 4–5, 6–7, 8–9 y 10–11; Inglés 4–5, 6–7 y 8–9. Son falta de material compatible en esta selección, no nueve preguntas auditadas con éxito.

## Hallazgos y correcciones

Los originales completos, metadatos, tarjetas y visuales asociados se conservan en `audit.json`; cada dictamen se vincula a la huella del original y de su reemplazo. Los nuevos contenidos están en `candidates.json`. Son candidatos aislados e inactivos, no escrituras sobre módulos compartidos.

| Materia y grado | Diagnóstico comprobado | Corrección local preparada |
|---|---|---|
| Matemáticas 3 | «parte todo» recibe correcto sin explicar una fracción. | Arepa en cuatro porciones iguales; rúbrica por significado de ambos números e igualdad de tamaño. |
| Matemáticas 4–5 | Pregunta y clave 1/4 correctas; falta feedback específico. | Se conserva ese problema; se explican 1/4 y los tres distractores, con tarjeta y ejemplo propios. No se califica la clave original como falsa. |
| Lenguaje 1–3 | Reflexión sin lectura; referencia docente evaluada por coincidencia exacta. | Relato inventado completo; inferencia, pista y estrategia de relectura. Una misma frase puede ser pista y comprobación. |
| Lenguaje 7 | Pregunta genérica sin texto para el objetivo de clasificar información. | Noticia escolar inventada para relacionar dato, fuente y opinión. |
| Lenguaje 8 | Inferencia/intención sin discurso ni contexto. | Aviso completo: interpretar su intención sin inventar prohibiciones o resultados. |
| Lenguaje 11 | Objetivo de comparar textos sin presentar ninguno. | Dos textos ficticios; comparar propuesta, evidencia y condición pendiente. |
| Ciencias 1–3 | Se exige aplicar en «situación nueva» que no se proporciona; opciones vacías y formato incoherente. | Comparación imaginada de superficies para un carrito; mantener condiciones y no inventar resultados. |
| Sociales 1–3 | Clave de organizaciones razonable; texto base incoherente con la pregunta enriquecida y ayudas/explicaciones no transportadas. | Situaciones concretas de personas organizadas; clave y justificación por opción. El motor actual prioriza la pregunta enriquecida: no se atribuye al alumno un texto base que no ve. |
| Sociales 4–5 | Cronología universal agricultura/domesticación/aldeas, sin delimitar región; además no corresponde al objetivo espacial. | Recorrido con orientación cardinal explícita, vinculado al objetivo espacial. Se retira la falsa secuencia universal, no se inventa otra. |
| Sociales 6–7 | Parejas históricas exclusivas sin fuentes, fechas ni contexto suficiente; categorías pueden solaparse; objetivo del XIX mal asignado. | Análisis de argumentos expresamente ficticios, sin atribuirlos como citas históricas ni avalar prejuicios. Objetivo didáctico corregido y separado. |
| Sociales 8–9 | Pregunta genérica y lista de palabras que recibe correcto sin relaciones explicadas. | Caso ficticio de feria comunitaria: relacionar necesidades, medida y beneficiarios; admite diferentes propuestas justificadas. |
| Sociales 10–11 | Se pide detectar un error sin mostrar razonamiento; objetivo remite a «estos modelos» sin identificarlos. | Comparación de usos de una plaza y crítica a una conclusión universal sin datos suficientes. |
| Inglés 1–3 | Pregunta genérica en español, sin práctica del inglés y con puntuación por palabras españolas. | Saludo «Hello» en situación explícita; función de cada expresión y ejemplo distinto de agradecimiento. Es lectura, no certificación de escucha o pronunciación. |

**No se publican objetivos nuevos silenciosamente en módulos viejos.** Las reformulaciones son objetivos didácticos del candidato, no supuestas citas literales del MEN. En los casos en que cambió la tarea para corregir un desacople, su correspondencia curricular definitiva debe resolverse antes de activarla. No se declara un logro oral o auditivo a partir de lectura/escritura.

### Tarjetas, pistas y visuales

Los trece reemplazos incluyen pista inmediata, tarjeta conceptual, ejemplo distinto y datos visuales compatibles con los componentes actuales. Se eliminan sus dependencias de IDs ficticios, diagramas vacíos y tarjetas de otro grado. Las conclusiones de los ejemplos están en prosa; tablas y secuencias van separadas.

Los materiales compartidos del legado no se certifican por estar asociados. Por ejemplo, reglas que tratan la igualdad válida `1/1 = 1` como respuesta errónea no deben usarse como diagnóstico automático; las nuevas ayudas no reutilizan esas reglas. La revisión curricular y del material compartido seguirá por familias. Preparar sustitutos aislados **no modifica** esas tarjetas originales en toda la base.

## Corrección del evaluador detectada en la prueba real

La primera versión no pasó: hubo crédito a listas de palabras y atribuciones al alumno de ideas presentes solo en la referencia. Un ajuste general de instrucciones también perjudicó algunas respuestas equivalentes del piloto anterior. Se conservan esas ejecuciones fallidas: `live-evaluation-before-fix.json`, `live-evaluation-intermediate.json`, `live-evaluation-pre-criteria.json` y `pilot-regression-before-criteria.json`. No se cambió la etiqueta de una respuesta correcta para ocultar el fallo.

La solución final para las **cinco preguntas abiertas corregidas** (tres nuevas y dos del piloto) usa criterios explícitos:

1. Se separan `student_response` y `reference_answer`.
2. El modelo declara cada criterio cumplido y aporta una cita del texto del estudiante.
3. El servidor verifica IDs, cantidad de criterios y existencia literal de las citas. Una salida inconsistente se trata como fallo recuperable; no se publica una calificación inventada.
4. El servidor calcula correcto/parcial/incorrecto según criterios cumplidos, en vez de aceptar una etiqueta global contradictoria.

Una cita existente no prueba por sí sola que su interpretación semántica sea correcta: se conserva esa limitación y se prueba con respuestas etiquetadas. No se usa conteo de palabras como criterio de aprendizaje.

El camino de rúbricas antiguas **sin criterios** conserva la solicitud que usaba antes de esta intervención. No se despliega a todo el alumnado el ajuste general que falló la regresión. No se cambiaron modelos de producción ni la preparación anticipada; este cambio no pretende resolver la latencia inicial.

## Verificación completada

- **105 pruebas automatizadas aprobadas**, incluidas claves/distractores, contratos de las 26 ayudas nuevas, evidencia de rúbrica y exclusión efectiva de los 13 originales en la ruta de selección de reservas.
- **20 respuestas sintéticas a los originales** reproducen los defectos y comprueban las claves cerradas. Aceptar una clave almacenada no certifica su verdad histórica.
- **24/24 evaluaciones reales finales** en las tres rúbricas nuevas, dos vueltas a 12 respuestas, con `gpt-4.1-mini`. **16/16 regresiones finales** en las dos rúbricas del piloto. Se incluyen paráfrasis, lenguaje cotidiano, respuestas incompletas y listas de palabras.
- **13/13 preguntas comprobadas en navegador** usando el componente real `LearningModule`: cuatro formatos, respuesta, feedback, tres niveles de ayuda, modal centrado y visual de datos. Servicios de vista simulados y calificaciones precalculadas con el evaluador real; no es verificación de persistencia en Supabase. Los cinco reemplazos del primer piloto ya tenían comprobación visual; sus preguntas y ayudas no cambiaron al añadir criterios.
- Puerta `hito4-round2-close.cjs`: comprueba que las pruebas de modelo corresponden a las huellas actuales de cada candidato abierto. Rechaza evidencia obsoleta.
- Ninguna consulta de cuentas, ninguna escritura en Supabase, ningún reemplazo habilitado como banco persistente.

Las pruebas del modelo son una muestra, no garantía para cualquier respuesta futura. Las ejecuciones facturables de esta intervención están preservadas, incluidas las fallidas; las 40 comprobaciones finales no deben confundirse con el total de llamadas de desarrollo.

Total de las seis ejecuciones guardadas en este lote: **128 llamadas**, 96.756 tokens de entrada y 13.780 de salida. No incluye las pruebas realizadas en intervenciones anteriores. No hubo generación masiva de contenido ni llamadas a modelos para redactar los trece reemplazos.

## Fuentes y veracidad

Consultas del 5 de noviembre de 2026. Los escenarios didácticos nuevos se señalan como inventados, imaginados o simulados. No se presentan sondeos, carteleras ni experimentos ficticios como evidencia de escuelas reales. Los resultados numéricos se calculan aparte; las lecturas lingüísticas contienen sus propios datos.

- [Natural History Museum, investigación sobre perros preagrícolas](https://www.nhm.ac.uk/press-office/press-releases/world-s-oldest-genetic-evidence-for-domestic-dogs-identified-in-.html), 25-03-2026, introducción del estudio: evidencia genética de perros en contextos anteriores a la agricultura. Basta como contraejemplo a la regla general de que toda domesticación animal ocurrió después de la agricultura. No establece una única cronología para todas las regiones/especies.
- [Shannon y colaboradores, PNAS, estudio genético de perros](https://pmc.ncbi.nlm.nih.gov/articles/PMC4640804/), introducción y discusión: marco y límites de las inferencias sobre domesticación. No se usa para afirmar un lugar/origen definitivo.
- [MEN, Guía 7](https://www.mineducacion.gov.co/1780/articles-81033_archivo_pdf.pdf), grupos de grado de Naturales y Sociales: referencia para revisar los desacoples de objetivos y el trabajo de comparación/ubicación. No certifica por sí sola los contenidos.
- [MEN, DBA Lenguaje V2](https://colombiaaprende.edu.co/sites/default/files/files_public/2022-06/DBA_Lenguaje-min.pdf): referencia curricular de clasificación de información, intención y comparación de textos. Los objetivos de cada candidato son formulaciones didácticas y no se presentan como reproducción literal de un DBA completo.
- [MEN, Guía 22 de Inglés](https://colombiaaprende.edu.co/sites/default/files/files_public/2022-06/Estandares_Basicos_Competencia_en_Lenguas_Extranjeras_%20Ingles-min.pdf): referencia de grado y función comunicativa; la actividad sencilla de saludo no acredita toda la competencia ni escucha.

Los artículos de Nature localizados remitían a un portal de identificación no accesible desde la herramienta; no se simuló haber leído su texto completo. Para el contraejemplo se consultó la comunicación del instituto participante y el estudio primario abierto en PMC. No se publican en el ejercicio nuevas afirmaciones arqueológicas dudosas: se reemplazó el desacople por una tarea de orientación espacial.

## Qué significa «permanecer en 4.2»

Usaremos **4.2 como ciclo abierto de revisión y corrección por lotes**. Las reparaciones son técnicamente trabajo de 4.3; publicar versiones y conectarlas al motor corresponde a 4.4. No se cerrará una incidencia simplemente por haberla contado. Cada una debe registrar:

- Original e identificador/huella.
- Problema confirmado y evidencia.
- Corrección candidata o retirada justificada mientras no haya corrección.
- Pruebas de contenido, evaluación y presentación que cierren el caso localmente.
- Estado de publicación separado.

**Estado actual:** 18 originales distintos apartados de nuevas reservas, 18 reemplazos locales y 0 publicados. Quedan **557 candidatos técnicos sin auditoría pedagógica**, entre ellos **535 de evaluación por palabras clave**, listados por ID y versión en `worklist.json`. Además quedan los pasos sin enriquecimiento o con fallos técnicos del inventario de 4.1; no forman parte de esos 557 y no desaparecen del trabajo pendiente.

El siguiente lote se priorizará por familias de preguntas que comparten esos evaluadores/materiales defectuosos, conservando lotes limitados y verificables. No se certifica el catálogo, no se declara resuelta la cobertura de las 125 combinaciones y todavía no hay una reserva publicada para resolver la primera actividad en frío.

## Reproducción y acciones del usuario

```powershell
node scripts/quality/hito4-round2-repairs.cjs
node scripts/quality/hito4-round2-audit.cjs
npm --prefix server test
node scripts/quality/hito4-round2-close.cjs
node scripts/quality/hito4-repairs-ui.cjs --round2
```

La última orden abre un servidor de loopback e imprime la URL; el botón «Ejecutar revisión del lote» realiza las comprobaciones de vista. Las evaluaciones facturables, opcionales al reproducir, son `node scripts/quality/hito4-repairs-live.cjs --run --round2` (máximo 24 llamadas) y `--run --recheck-pilot` (máximo 16). No reejecutar para disimular fallos: conservar ejecuciones y analizar su causa.

No hace falta ejecutar SQL ahora. Reiniciar `server` carga la cuarentena y el evaluador actualizado. Las actividades generadas normalmente siguen funcionando; si fallan y no existe reserva utilizable para ese objetivo, se mantiene la salida recuperable. Los candidatos preparados no aparecerán todavía en la aplicación.
