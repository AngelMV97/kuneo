const crypto = require("crypto");

function buildModuleFromCompetencyUnit(unit) {
  validateCompetencyUnit(unit);

  const content = unit.content;

  const interpretation = interpretCompetencyUnit(unit);
  const narrative = generateModuleNarrative(unit, interpretation);
  const diagnostic = buildDiagnostic(unit, interpretation);
  const progression = buildProgression(unit, interpretation);
  const exercises = generateExercises(unit, interpretation);
  const errorMap = generateErrorMap(unit, interpretation);
  const hints = generateHints(unit, interpretation);
  const reflections = generateReflectionPrompts(unit, interpretation);
  const evaluation = buildEvaluation(unit, interpretation);
  const visualTriggers = buildVisualTriggers(errorMap);

  return {
    module_id: crypto.randomUUID(),

    source_unit_id: unit.id,
    source: unit.source,

    subject: unit.subject,
    grade_range: unit.grade_range,
    difficulty: unit.difficulty,

    title: narrative.title,
    learning_objective: narrative.learning_objective,
    context: narrative.context,

    core_concept: interpretation.core_concept,
    concepts: interpretation.concepts,
    cognitive_type: interpretation.cognitive_type,
    skills: interpretation.skills,

    diagnostic,

    phases: progression,

    guided_exercises: exercises,

    error_map: errorMap,

    hints,
    reflection_prompts: reflections,

    evaluation,
    visual_triggers: visualTriggers,

    metadata: {
      generated_from: "competency_unit",
      original_metadata: content.metadata || {}
    }
  };
}

function validateCompetencyUnit(unit) {
  if (!unit || unit.type !== "competency_unit") {
    throw new Error("Input must be a competency_unit");
  }

  if (!unit.content?.competency) {
    throw new Error("competency_unit missing content.competency");
  }
}

function interpretCompetencyUnit(unit) {
  const text = [
    unit.content.competency,
    ...(unit.content.evidence || []),
    unit.content.example || ""
  ].join(" ");

  return {
    core_concept: inferCoreConcept(unit),
    concepts: unit.content.concepts || [],
    skills: inferSkills(unit.content.evidence || []),
    cognitive_type: classifyCognitiveType(text)
  };
}

function inferCoreConcept(unit) {
  const competency = unit.content.competency.toLowerCase();
  const concepts = unit.content.concepts || [];
  
  // Mapeo de conceptos relevantes por materia
  const SUBJECT_CONCEPTS = {
    mathematics: [
      "fracciones", "proporcionalidad", "area_perimetro", "geometria",
      "probabilidad", "estadistica", "ecuaciones", "potenciacion",
      "raiz_cuadrada", "numeros_naturales", "operaciones_basicas",
      "sistema_metrico", "medicion", "angulos", "transformaciones"
    ],
    natural_sciences: [
      "ecosistema", "celula", "energia", "movimiento", "electricidad",
      "magnetismo", "reacciones_quimicas", "sistema_solar", "materia",
      "ciclo_agua", "fotosintesis", "cadena_alimenticia", "adaptacion"
    ],
    social_studies: [
      "territorio", "historia", "sociedad", "cultura", "economia",
      "politica", "constitucion", "derechos", "democracia", "conflicto",
      "migracion", "urbanizacion", "colonizacion"
    ],
    language: [
      "lectura_inferencial", "lectura_literal", "lectura_critica",
      "argumentacion", "narracion", "descripcion", "exposicion",
      "gramatica", "ortografia", "generos_literarios", "comprension_lectora"
    ],
    english: [
      "reading", "writing", "listening", "speaking", "grammar",
      "vocabulary", "pronunciation", "comprehension"
    ]
  };

  // Filtrar conceptos relevantes para esta materia
  const relevantConcepts = concepts.filter(c => 
    SUBJECT_CONCEPTS[unit.subject]?.includes(c.toLowerCase())
  );

  if (relevantConcepts.length > 0) {
    return relevantConcepts[0];
  }

  // Inferir desde texto de competencia - MATEMÁTICAS
  if (unit.subject === "mathematics") {
    if (competency.includes("fracción") || competency.includes("fracciones")) return "fracciones";
    if (competency.includes("proporción") || competency.includes("razón") || competency.includes("proporcionalidad")) return "proporcionalidad";
    if (competency.includes("área") || competency.includes("perímetro")) return "area_perimetro";
    if (competency.includes("ecuación") || competency.includes("ecuaciones")) return "ecuaciones";
    if (competency.includes("probabilidad")) return "probabilidad";
    if (competency.includes("estadística") || competency.includes("dato") || competency.includes("gráfica")) return "estadistica";
    if (competency.includes("geometría") || competency.includes("figura") || competency.includes("triángulo") || competency.includes("cuadrilátero")) return "geometria";
    if (competency.includes("potencia") || competency.includes("potenciación")) return "potenciacion";
    if (competency.includes("raíz")) return "raiz_cuadrada";
    if (competency.includes("medición") || competency.includes("medida") || competency.includes("metro") || competency.includes("kilogramo")) return "sistema_metrico";
    if (competency.includes("ángulo") || competency.includes("grados")) return "angulos";
    if (competency.includes("suma") || competency.includes("resta") || competency.includes("multiplicación") || competency.includes("división")) return "operaciones_basicas";
    return "numeros_y_operaciones";
  }

  // CIENCIAS NATURALES
  if (unit.subject === "natural_sciences") {
    if (competency.includes("ecosistema") || competency.includes("hábitat")) return "ecosistema";
    if (competency.includes("célula") || competency.includes("tejido") || competency.includes("órgano")) return "celula";
    if (competency.includes("energía") || competency.includes("fuerza")) return "energia";
    if (competency.includes("movimiento") || competency.includes("velocidad")) return "movimiento";
    if (competency.includes("electricidad") || competency.includes("circuito") || competency.includes("corriente")) return "electricidad";
    if (competency.includes("magnetismo") || competency.includes("imán")) return "magnetismo";
    if (competency.includes("reacción") || competency.includes("química")) return "reacciones_quimicas";
    if (competency.includes("planeta") || competency.includes("solar") || competency.includes("tierra")) return "sistema_solar";
    if (competency.includes("materia") || competency.includes("masa") || competency.includes("volumen")) return "materia";
    if (competency.includes("agua") || competency.includes("ciclo")) return "ciclo_agua";
    if (competency.includes("fotosíntesis") || competency.includes("planta")) return "fotosintesis";
    if (competency.includes("alimenticia") || competency.includes("depredador") || competency.includes("presa")) return "cadena_alimenticia";
    return "ciencias_naturales";
  }

  // CIENCIAS SOCIALES
  if (unit.subject === "social_studies") {
    if (competency.includes("territorio") || competency.includes("espacio") || competency.includes("región")) return "territorio";
    if (competency.includes("historia") || competency.includes("época") || competency.includes("período")) return "historia";
    if (competency.includes("sociedad") || competency.includes("comunidad") || competency.includes("grupo social")) return "sociedad";
    if (competency.includes("cultura") || competency.includes("tradición") || competency.includes("costumbre")) return "cultura";
    if (competency.includes("economía") || competency.includes("producción") || competency.includes("comercio")) return "economia";
    if (competency.includes("política") || competency.includes("gobierno") || competency.includes("estado")) return "politica";
    if (competency.includes("constitución") || competency.includes("ley")) return "constitucion";
    if (competency.includes("derecho") || competency.includes("derechos")) return "derechos";
    if (competency.includes("democracia") || competency.includes("participación")) return "democracia";
    if (competency.includes("conflicto") || competency.includes("paz")) return "conflicto";
    if (competency.includes("migración") || competency.includes("desplazamiento")) return "migracion";
    if (competency.includes("ciudad") || competency.includes("urbano")) return "urbanizacion";
    return "estudios_sociales";
  }

  // LENGUAJE
  if (unit.subject === "language") {
    if (competency.includes("interpreta") || competency.includes("inferencia") || competency.includes("implícito")) return "lectura_inferencial";
    if (competency.includes("literal") || competency.includes("explícito") || competency.includes("identifica información")) return "lectura_literal";
    if (competency.includes("crítico") || competency.includes("evalúa") || competency.includes("postura")) return "lectura_critica";
    if (competency.includes("argumento") || competency.includes("argumenta") || competency.includes("justifica")) return "argumentacion";
    if (competency.includes("narra") || competency.includes("relato") || competency.includes("historia")) return "narracion";
    if (competency.includes("describe") || competency.includes("descripción")) return "descripcion";
    if (competency.includes("expone") || competency.includes("exposición") || competency.includes("explica")) return "exposicion";
    if (competency.includes("gramática") || competency.includes("sintaxis")) return "gramatica";
    if (competency.includes("ortografía") || competency.includes("acentuación")) return "ortografia";
    if (competency.includes("género literario") || competency.includes("cuento") || competency.includes("poema")) return "generos_literarios";
    return "comprension_lectora";
  }

  // INGLÉS
  if (unit.subject === "english") {
    if (competency.includes("read") || competency.includes("reading")) return "reading";
    if (competency.includes("write") || competency.includes("writing")) return "writing";
    if (competency.includes("listen") || competency.includes("listening")) return "listening";
    if (competency.includes("speak") || competency.includes("speaking")) return "speaking";
    if (competency.includes("grammar") || competency.includes("structure")) return "grammar";
    if (competency.includes("vocabulary") || competency.includes("words")) return "vocabulary";
    return "english_communication";
  }

  return "concepto_central";
}

function inferSkills(evidence) {
  return evidence.map(ev => {
    const t = ev.toLowerCase();

    if (t.startsWith("identifica")) return "identificar";
    if (t.startsWith("explica")) return "explicar";
    if (t.startsWith("interpreta")) return "interpretar";
    if (t.startsWith("representa")) return "representar";
    if (t.startsWith("resuelve")) return "resolver";
    if (t.startsWith("argumenta")) return "argumentar";
    if (t.startsWith("compara")) return "comparar";
    if (t.startsWith("construye")) return "construir";

    return "comprender";
  });
}

function classifyCognitiveType(text) {
  const t = text.toLowerCase();

  if (t.includes("explica") || t.includes("por qué")) return "causal_reasoning";
  if (t.includes("representa") || t.includes("gráfica")) return "representational_thinking";
  if (t.includes("argumenta") || t.includes("justifica")) return "argumentative_reasoning";
  if (t.includes("resuelve") || t.includes("problema")) return "problem_solving";
  if (t.includes("interpreta")) return "interpretation";

  return "conceptual_understanding";
}

function generateModuleNarrative(unit, interpretation) {
  return {
    title: generateTitle(unit, interpretation),
    learning_objective: unit.content.competency,
    context: unit.content.example || generateFallbackContext(unit, interpretation)
  };
}

function generateTitle(unit, interpretation) {
  const concept = interpretation.core_concept;

  if (unit.subject === "mathematics") {
    return `¿Cómo entender ${concept}?`;
  }

  if (unit.subject === "natural_sciences") {
    return `¿Cómo funciona ${concept}?`;
  }

  if (unit.subject === "language") {
    return `¿Cómo interpretar mejor una idea?`;
  }

  if (unit.subject === "social_studies") {
    return `¿Cómo analizar una situación social?`;
  }

  if (unit.subject === "english") {
    return `How can you understand this better?`;
  }

  return `Exploremos ${concept}`;
}

function generateFallbackContext(unit, interpretation) {
  return `Vamos a explorar ${interpretation.core_concept} a partir de una situación sencilla y cercana.`;
}

function buildDiagnostic(unit, interpretation) {
  return {
    type: "open_question",
    question: buildDiagnosticQuestion(unit, interpretation),
    expected_signals: interpretation.concepts,
    detects: [
      "prior_knowledge",
      "misconception",
      "explanation_depth"
    ]
  };
}

function buildDiagnosticQuestion(unit, interpretation) {
  if (unit.subject === "mathematics") {
    return `¿Qué entiendes por ${interpretation.core_concept}? Explícalo con tus palabras.`;
  }

  if (unit.subject === "natural_sciences") {
    return `¿Por qué crees que ocurre algo relacionado con ${interpretation.core_concept}?`;
  }

  if (unit.subject === "language") {
    return "¿Qué crees que significa realmente la idea central de un texto?";
  }

  return `¿Qué sabes sobre ${interpretation.core_concept}?`;
}

function buildProgression(unit, interpretation) {
  return [
    {
      phase: "exploration",
      goal: "activar conocimiento previo",
      tutor_state: "thinking"
    },
    {
      phase: "concept_formation",
      goal: "construir el concepto central",
      tutor_state: "hint"
    },
    {
      phase: "guided_application",
      goal: "aplicar con apoyo",
      tutor_state: "encouragement"
    },
    {
      phase: "transfer",
      goal: "usar la idea en un nuevo contexto",
      tutor_state: "reflection"
    },
    {
      phase: "metacognition",
      goal: "reflexionar sobre cómo cambió el pensamiento",
      tutor_state: "reflection"
    }
  ];
}

function generateExercises(unit, interpretation) {
  const evidence = unit.content.evidence || [];

  return evidence.map((ev, index) => ({
    id: crypto.randomUUID(),
    evidence_source: ev,
    type: exerciseTypeFromEvidence(ev),
    prompt: buildExercisePrompt(ev, unit, interpretation),
    expected_answer: "",
    hints: buildExerciseHints(ev, interpretation),
    evaluates: mapEvidenceToDimensions(ev),
    difficulty: unit.difficulty,
    order: index + 1
  }));
}

function exerciseTypeFromEvidence(evidence) {
  const t = evidence.toLowerCase();

  if (t.includes("identifica")) return "classification";
  if (t.includes("explica")) return "explanation";
  if (t.includes("relaciona")) return "matching";
  if (t.includes("representa")) return "representation";
  if (t.includes("resuelve")) return "problem_solving";
  if (t.includes("argumenta") || t.includes("justifica")) return "argumentation";
  if (t.includes("construye")) return "simulation_or_construction";

  return "open_response";
}

function buildExercisePrompt(evidence, unit, interpretation) {
  const type = exerciseTypeFromEvidence(evidence);

  if (type === "classification") {
    return `Clasifica ejemplos relacionados con ${interpretation.core_concept} y explica tu criterio.`;
  }

  if (type === "explanation") {
    return `Explica con tus palabras: ${evidence}`;
  }

  if (type === "representation") {
    return `Representa la idea de ${interpretation.core_concept} usando un esquema, tabla o dibujo mental.`;
  }

  if (type === "problem_solving") {
    return `Resuelve una situación donde necesites aplicar ${interpretation.core_concept}. Explica tu proceso.`;
  }

  if (type === "argumentation") {
    return `Justifica tu respuesta usando evidencia o razones claras.`;
  }

  return `Trabajemos esta evidencia: ${evidence}`;
}

function buildExerciseHints(evidence, interpretation) {
  return [
    `Piensa primero en la idea de ${interpretation.core_concept}.`,
    "¿Qué información es importante y cuál no?",
    "Explícalo con tus palabras antes de buscar una respuesta final."
  ];
}

function mapEvidenceToDimensions(evidence) {
  const t = evidence.toLowerCase();
  const dimensions = ["comprension"];

  if (t.includes("representa") || t.includes("gráfica")) dimensions.push("representacion");
  if (t.includes("explica") || t.includes("justifica")) dimensions.push("razonamiento");
  if (t.includes("resuelve") || t.includes("aplica")) dimensions.push("transferencia");
  if (t.includes("argumenta")) dimensions.push("argumentacion");

  return [...new Set(dimensions)];
}

function generateErrorMap(unit, interpretation) {
  const misconceptions = unit.content.misconceptions || [];

  const base = {};

  misconceptions.forEach((m, index) => {
    base[`misconception_${index + 1}`] = {
      description: m,
      pattern: m,
      feedback: `Revisemos esta idea: ${m}`,
      visual: suggestVisualTemplate(unit, interpretation, m),
      intervention_level: 2
    };
  });

  if (Object.keys(base).length === 0) {
    base.generic_shallow_response = {
      description: "respuesta superficial o sin justificación",
      pattern: "respuesta corta sin explicación",
      feedback: "Tu respuesta va en una dirección, pero necesitamos justificarla mejor.",
      visual: suggestVisualTemplate(unit, interpretation, ""),
      intervention_level: 1
    };
  }

  return base;
}

function suggestVisualTemplate(unit, interpretation, misconception) {
  const text = [
    unit.subject,
    interpretation.core_concept,
    misconception
  ].join(" ").toLowerCase();

  if (text.includes("fraccion")) return "fraction_part_whole";
  if (text.includes("proporcionalidad")) return "proportion_table_graph";
  if (text.includes("area") || text.includes("perimetro")) return "area_perimeter_comparison";
  if (text.includes("probabilidad")) return "sample_space_diagram";
  if (text.includes("electricidad") || text.includes("circuito")) return "circuit_conductor_insulator";
  if (text.includes("texto") || text.includes("lectura")) return "idea_evidence_map";

  return "concept_map";
}

function generateHints(unit, interpretation) {
  return [
    `¿Qué sabes ya sobre ${interpretation.core_concept}?`,
    "¿Qué parte del problema te da una pista?",
    "¿Cómo podrías explicarlo sin usar una fórmula todavía?"
  ];
}

function generateReflectionPrompts(unit, interpretation) {
  return [
    `¿Qué cambió en tu forma de entender ${interpretation.core_concept}?`,
    "¿Qué estrategia te ayudó más?",
    "¿Dónde podrías aplicar esta idea en otro contexto?"
  ];
}

function buildEvaluation(unit, interpretation) {
  return {
    dimensions: [
      "comprension",
      "representacion",
      "razonamiento",
      "transferencia",
      "metacognicion"
    ],
    rubric: {
      comprension: "Identifica la idea central y la explica con sus palabras.",
      representacion: "Puede expresar la idea con una tabla, dibujo, esquema o ejemplo.",
      razonamiento: "Justifica su respuesta con relaciones o evidencia.",
      transferencia: "Aplica la idea en una situación nueva.",
      metacognicion: "Reconoce cómo cambió su forma de pensar."
    },
    pass_condition: {
      minimum_dimensions: 3,
      minimum_level: "basic"
    }
  };
}

function buildVisualTriggers(errorMap) {
  return Object.entries(errorMap).map(([key, value]) => ({
    error_key: key,
    visual_template: value.visual,
    trigger: value.pattern,
    intervention_level: value.intervention_level
  }));
}

module.exports = {
  buildModuleFromCompetencyUnit
};
