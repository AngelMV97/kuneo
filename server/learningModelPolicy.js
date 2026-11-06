// Keep answer grading and support independent from generation/review experiments.
function modelOptions(model, task, effort) {
  const supportsNone = /^(?:gpt-6-luna|gpt-6\.1-terra|gpt-5\.4-(?:mini|nano))(?:-|$)/.test(model);
  const options = {};
  if (supportsNone) options.reasoning_effort = effort || 'none';
  if ((task === 'kuneo_evaluation' || task.endsWith('_review')) && /^gpt-(?:4o|4\.1)/.test(model)) options.temperature = 0;
  return options;
}
const COMPACT_ACTIVITY = 'Evita redundancia sin reducir la calidad: en preguntas cerradas expected_text="" (la clave ya está en los índices) y rubric es una o dos frases verificables. En abiertas conserva una respuesta de referencia y la rúbrica completa de todos los requisitos. explanation explica la estrategia en 1-3 frases; no repitas allí el análisis de cada alternativa que ya está en option_explanations o pair_explanations. Cada justificación conserva su evidencia o cálculo, en una o dos frases claras. Enunciado autocontenido, datos, texto, contexto de aplicación y pistas siguen completos. Nunca acortes omitiendo datos ni criterios de corrección.';
const COMPACT_REVIEW = 'En verification resuelve y contrasta la clave y sus justificaciones de forma concisa, con cálculos/evidencia concretos; evita copiar el enunciado o repetir explicaciones. Procura no superar 100 palabras, pero revisa TODAS las opciones o parejas y no apruebes contenido ambiguo o sin datos. Si rechazas, issue identifica una corrección específica en una o dos frases.';
module.exports = { modelOptions, COMPACT_ACTIVITY, COMPACT_REVIEW };
