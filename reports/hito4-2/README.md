# Hito 4.2 — Primera ronda, 2026-11-05

**Actualización posterior:** este documento conserva el diagnóstico de los originales. Los reemplazos y correcciones posteriores están en `../hito4-3-pilot/README.md`. El script de auditoría escribe ahora `recheck-current.json`, sin sobrescribir el `pilot.json` histórico; los tres casos de secuencias inválidas ya se rechazan y se registran como resueltos. Los originales defectuosos quedaron excluidos de nuevas reservas, sin borrar sus registros.

**Resultado: cinco versiones revisadas; ninguna propuesta para habilitar.** No se ha certificado el catálogo ni completado la segunda ronda. No se modificó Supabase ni el motor de generación/evaluación. No se efectuaron llamadas a modelos.

## Reproducción y alcance

Desde la raíz: `node scripts/quality/hito4-audit.cjs`. Requiere las dependencias existentes de `server`. Verifica la integridad de la instantánea de 4.1 y las cinco huellas de la cola, extrae módulos/pasos/tarjetas/visuales y ejecuta 16 respuestas sintéticas contra `createContentService.evaluate`. `pilot.json` conserva originales completos, actividad normalizada, huellas de asociaciones, archivos del evaluador y resultados.

Las expectativas de las pruebas son **observaciones de defectos existentes**, no resultados deseables ni correcciones. Si cambia un resultado, el script exige revisar el dictamen. No hay conexión de red: la consulta de metadatos que hace el evaluador legado al terminar se sustituye por un stub estricto. Esto prueba calificación local, no persistencia, autorización, selección de reservas ni comportamiento completo en navegador.

La revisión de tarjetas/visuales es documental y del contrato/código asociado; no incluye una nueva comprobación visual en navegador. Las ayudas de niveles 2 y 3 del flujo actual se generan separadamente: el contenido legado asociado **no demuestra** qué ejemplo verá hoy el estudiante. No se generaron ejemplos nuevos para simular una certificación de esas ayudas.

## Dictámenes por versión

### Matemáticas, 8–9

Paso `4a1680e1-ab6d-48f0-8938-f97518deab93`, pregunta `:q:0`.

- Enunciado genérico sobre cómo funcionan las fracciones; no proporciona caso, cantidades o representación que permitan definir una solución única. El objetivo del módulo trata cambios de familias de funciones y representaciones cartesianas: **sí corresponde a 8–9 en el MEN**, pero esta pregunta no demuestra ese objetivo [M1].
- La explicación alternativa de mitad/dos cuartos se califica incorrecta. La lista «razonamiento fracciones funcionamiento» se califica correcta. La presencia de términos no prueba razonamiento. No existe rúbrica semántica ni feedback explicativo normalizado.
- Las tres pistas aportan orientación general de parte-todo y comparación, pero no concretan qué debe explicar el alumno. No hay distractores: es abierta.
- La tarjeta asociada declara 1–3. Su ejemplo `2/8 = 1/4` es aritméticamente correcto: `2×4 = 1×8`. Ello no acredita alineación con funciones de 8–9. La visual de una parte entre cuatro es compatible con su configuración; no resuelve la falta de contexto del enunciado. Las referencias de `step_config` son marcadores, distintas de los IDs reales asociados.
- **Dictamen:** reparar enunciado/objetivo/rúbrica y referencias; después revisar nuevamente pregunta y ayuda juntas. No basta cambiar palabras clave.

### Lenguaje, grado 5

Paso `00b5fbfc-1431-4de4-83cd-786933d2b9f0`, pregunta `:q:0`.

- Pregunta por qué funciona la argumentación sin presentar argumento, interlocutor o situación. El DBA del módulo es producción oral contextualizada de grado 5 [L1]; la pregunta abstracta no acredita esa actuación.
- Una explicación con propuesta, motivos, datos y objeción se califica incorrecta; «razón evidencia persuasión» se califica correcta. Una mención aislada de razón se califica incorrecta. No hay explicación específica normalizada de esas decisiones ni distractores.
- Las pistas sugieren argumentos y evidencias, pero no subsanan la situación ausente. La tarjeta asociada declara grado 10 y sus definiciones generales no aportan una actividad de grado 5. Sus ejemplos hipotéticos no pueden tratarse como estudios o resultados verificados.
- La visual asociada `reading_strategy` declara `concept_map`, con nodos/aristas vacíos; ese renderer no está soportado por el renderer legado inspeccionado. No es una representación verificable de un argumento.
- **Dictamen:** reconstruir una tarea contextualizada apropiada para grado 5, con evidencia y criterios observables; revisar tarjeta, idioma y visual pertinentes.

### Ciencias Naturales, 1–3

Paso `307726e0-3dc0-4abe-97f7-337118de708c`, pregunta `:q:0`.

- Pide clasificar «estos» ejemplos pero no proporciona ejemplos ni elementos arrastrables. **No hay solución independiente calificable**. El objetivo curricular de experimentar sí pertenece al grupo 1–3 [C1], pero esta clasificación incompleta no lo demuestra.
- El contenido declara arrastrar/soltar; el adaptador devuelve respuesta de texto. La referencia es una explicación general convertida a coincidencia textual exacta. Copiarla obtiene correcto; una paráfrasis compatible obtiene incorrecto. Ninguno de esos resultados prueba que se haya clasificado algo.
- `scaffolding_hints` contiene pistas heredadas, pero el adaptador no las lee: normaliza una pista genérica. El feedback explicativo normalizado está vacío.
- La lista heredada de errores excluye tecnología de manera general, una regla inadecuada para el currículo de Ciencias Naturales, que incluye ciencia, tecnología y sociedad en 1–3 [C1]. No usar esa exclusión como criterio universal.
- La tarjeta introductoria declara grado 1, compatible con el grupo, pero no proporciona los elementos a clasificar. La visual `diagram` tiene nodos/aristas vacíos, mientras su texto enriquecido anuncia fotosíntesis: el código genérico no representa esas etapas. No se certifica aquí una ilustración científica que no existe en la configuración.
- **Dictamen:** reemplazar la tarea incompleta por una autocontenida; definir formato, elementos, claves y feedback; validar la visual contra datos realmente suministrados.

### Ciencias Sociales, 6–7

Paso `cd032bdb-1d1b-4638-9ff3-ee9776205b6e`, pregunta `:q:0`.

- Ordenamiento de cinco eventos: no precisa territorio para abolición de esclavitud/Inquisición ni alcance de movimientos civiles. No puede certificarse la clave continental como cronología única. «Primeras declaraciones de independencia en América (siglo XIX)» es demasiado amplio: Estados Unidos declaró su independencia en **1776** [H1]. No se corrige silenciosamente suponiendo que quiso decir Hispanoamérica.
- El objetivo del módulo sobre corrientes de pensamiento del siglo XIX pertenece a **8–9**, según la Guía 7 del MEN, aunque el módulo declara 6–7 [C1]. Además, el paso declara transferencia y el enriquecido comprensión.
- La secuencia almacenada `[3,4,0,1,2]` obtiene correcto, pero eso solo acredita coincidencia con la clave. Una secuencia con un sexto elemento repetido también obtiene correcto; omitir el último o repetirlo obtiene parcial. Estas últimas son pruebas de contrato del evaluador: no afirmamos que el componente de arrastre normal construya esas entradas inválidas.
- La tercera pista heredada enumera el orden completo. No se está afirmando que el flujo actual la muestre: solo se lee la primera como pista inmediata; antes de activar el conjunto completo habría que retirar esa filtración. El feedback normalizado no explica relaciones históricas.
- Tarjeta de historia de grado 1: insuficiente para la tarea. La visual asociada solo representa dos hitos colombianos, 1810/1819; no los cinco eventos preguntados. Su configuración es vertical y el texto de accesibilidad afirma horizontal. La etiqueta de 1810 requiere distinguir inicio/conmemoración de independencia de un proceso histórico, no presentarlo como hecho consumado sin matiz.
- **Dictamen:** delimitar hechos, territorio, fechas y fuente por evento; resolver cronología independientemente; alinear grado/habilidad y validar permutaciones completas antes de volver a auditar.

### Inglés, 10–11

Paso `0d19e23a-ab7e-4b86-84ea-44855c227097`, pregunta `:q:0`.

- Reflexión en español sobre lo aprendido de `english_communication`, sin conversación ni experiencia delimitada. Puede inspirar un cierre de sesión, pero aislada no acredita el objetivo de escucha del módulo. Este objetivo **sí es de 10–11** en la Guía 22 [E1]; no se atribuye al MEN un grado incorrecto.
- Una reflexión en inglés con estrategia de reescucha y contexto obtiene incorrecto; una frase que reúne las palabras exigidas y propone dejar de escuchar/comprender obtiene correcto. Una respuesta mínima obtiene incorrecto. Falta rúbrica de reflexión/aplicación y feedback explicativo normalizado.
- No se configura una pista concreta: el adaptador usa su frase genérica. La tarjeta declara grado 1 y presenta saludos en español; no aporta el material lingüístico en inglés correspondiente al objetivo de 10–11. La misma visual vacía/no soportada `reading_strategy` de Lenguaje no acredita escucha.
- **Dictamen:** definir si es actividad de escucha o reflexión de cierre; proporcionar insumo pertinente, inglés de práctica y rúbrica adecuada. No confundir reflexión plausible con evidencia de una conversación no incluida.

## Fuentes y criterios de verdad

Consultadas el **5 de noviembre de 2026**. Los enlaces institucionales sustentan hechos o alineación indicados; el juicio sobre suficiencia de una pregunta es una inferencia de auditoría. La exactitud aritmética se verificó por cálculo independiente; un documento curricular no certifica una clave.

| ID | Fuente y localización | Qué respalda |
|---|---|---|
| M1 | [MEN, Estándares Básicos, Matemáticas](https://www.mineducacion.gov.co/1621/articles-340021_recurso_1.pdf), pp. 86–87, pensamiento variacional | Grupo 8–9 y objetivo de representaciones/funciones del módulo; no una certificación de su pregunta de fracciones. |
| L1 | [MEN, DBA Lenguaje V2](https://colombiaaprende.edu.co/sites/default/files/files_public/2022-06/DBA_Lenguaje-min.pdf), p. 27, grado 5, DBA 7 | Producción oral según situación, destinatarios e intención. |
| C1 | [MEN, Guía 7](https://www.mineducacion.gov.co/1780/articles-81033_archivo_pdf.pdf), pp. 14–15 y 36–37 | Experimentación y ciencia/tecnología en 1–3; objetivo de corrientes del siglo XIX en Sociales 8–9. |
| E1 | [MEN, Guía 22 completa](https://colombiaaprende.edu.co/sites/default/files/files_public/2022-06/Estandares_Basicos_Competencia_en_Lenguas_Extranjeras_%20Ingles-min.pdf), p. 26, 10–11, escucha | Objetivo de reconocer personas, situaciones, lugares y tema de conversaciones. |
| H1 | [National Archives, Declaration of Independence](https://www.archives.gov/milestone-documents/declaration-of-independence), introducción del documento | Adopción el 4 de julio de 1776; contraejemplo a la generalización continental del enunciado. No resuelve las otras ambigüedades de la cronología. |

## Puerta de avance

Se identificaron **544 candidatos técnicos** con evaluación por palabras clave en la instantánea. Sus IDs y huellas están en `pilot.json`, como cohorte relacionada pendiente de revisión: no significa que 544 preguntas hayan sido auditadas semánticamente o tengan exactamente el mismo error.

Los defectos repetidos del piloto activan la condición del plan de ajustar el procedimiento antes de ampliar. Segunda ronda de hasta 25: **no iniciada**, con los nueve huecos de cobertura previamente identificados en 4.1 conservados. No se sustituyeron por otros grados ni por contenido inventado. Ninguna etiqueta de este informe retira automáticamente reservas del motor; tampoco las habilita.

Antes de ampliar: preparar versiones candidatas separadas de estos cinco casos, con objetivo explícito, insumo autocontenido, solución independiente y rúbrica/clave revisada; repetir pruebas de equivalencia y errores, luego renderizar y comprobar en navegador. Solo un lote sin errores críticos conocidos puede proponerse para habilitar. El banco persistente y su efecto sobre latencia continúan en 4.3–4.4; aquí no se promete haber reducido esa espera.
