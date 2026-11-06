# Inventario técnico 4.1

No implica aprobación pedagógica ni modifica la selección del motor. Instantánea: `4baf73f3227ea219926b67a31f632b8e82362cba46000eeb34f3a3e9bdcabba8`.

| Unidad | Cantidad |
| --- | ---: |
| modules | 1427 |
| steps | 11411 |
| stepsWithEnrichment | 3343 |
| stepsMarkedCompleted | 154 |
| questions | 11579 |
| questionsInEnrichedArrays | 208 |
| runtimeReadableQuestions | 1516 |
| technicalCandidates | 575 |
| cards | 44 |
| cardVariants | 220 |
| visuals | 29 |
| enrichedVisuals | 23 |
| approved | 0 |

## Candidatos técnicos por materia y grupo

Se cuenta intersección de grados: una fila 3-5 puede contribuir a dos columnas. No sumar como preguntas únicas.

| Materia | 1-3 | 4-5 | 6-7 | 8-9 | 10-11 |
| --- | ---: | ---: | ---: | ---: | ---: |
| mathematics | 3 | 3 | 0 | 2 | 0 |
| language | 34 | 23 | 24 | 23 | 22 |
| natural_sciences | 6 | 0 | 0 | 0 | 0 |
| social_studies | 78 | 61 | 69 | 56 | 74 |
| english | 86 | 0 | 0 | 0 | 14 |

## Reglas detectadas

| Regla | Registros |
| --- | ---: |
| RUNTIME_UNREADABLE | 10063 |
| CARD_GRADE_DISJOINT | 9056 |
| MISSING_OR_INVALID_KEY | 8279 |
| DIMENSION_IMPLICIT_COMPREHENSION | 8084 |
| CONTENT_STATUS_DISAGREEMENT | 3261 |
| BROKEN_CONCEPT_CARD_KEY | 2871 |
| GENERIC_SCAFFOLD | 1650 |
| PLACEHOLDER_OPTIONS | 1528 |
| NO_GENERAL_FEEDBACK | 1516 |
| UNSUPPORTED_QUESTION_FORMAT | 883 |
| KEYWORD_GRADING_REVIEW | 546 |
| NO_OPTION_RATIONALES | 545 |
| UNKNOWN_EVALUATOR | 408 |
| PLACEHOLDER_QUESTION | 208 |
| UNKNOWN_DIMENSION | 169 |
| COMPLETED_WITHOUT_CONTENT | 72 |
| CHOICE_KEY_OUT_OF_RANGE | 56 |
| RUNTIME_UNKNOWN_DIMENSION | 13 |
| INVALID_NUMERIC_KEY | 9 |
| UNSUPPORTED_LEGACY_RENDERER | 8 |
| NO_PAIR_RATIONALES | 4 |
| ZERO_TOLERANCE_RUNTIME_REVIEW | 1 |

Los hallazgos incluyen IDs en `findings.csv`. Los originales están en la instantánea; las huellas vinculan cada candidato a su versión. `audit-queue.json` prepara las rondas de 4.2 y registra huecos sin sustituirlos por otros grados.

- Technical checks only; no content is pedagogically approved.
- exclude_recommended is an inventory recommendation, not a database/runtime change.
- Grade coverage uses intersection: ranges may contribute to multiple grade groups; do not sum cells as unique counts.
- runtimeReadable mirrors normalizeStored; technicalCandidate adds inventory guards and still requires pedagogical review.
- The active LearningModule uses generated support cards/visuals; legacy association/render support does not prove current display or pedagogical usefulness.
- Reading-dependency and same-stem flags are candidates for manual examination, not proven factual errors.
