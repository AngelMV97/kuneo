-- KUNEO - Datos de Ejemplo para Testing
-- Ejecutar después de schema.sql
-- IMPORTANTE: Usar schema kuneo para todas las tablas
-- 
-- NOTA: Este archivo está alineado con schema.sql
-- Columnas de kuneo.modules:
--   subject (kuneo.subject_enum): 'matematicas', 'lenguaje', 'ciencias', 'sociales', 'ingles'
--   title (TEXT)
--   description (TEXT)
--   difficulty (INTEGER 1-5): 1=muy fácil, 2=fácil, 3=intermedio, 4=difícil, 5=muy difícil
--   grade_level (INTEGER 1-11): grado escolar principal
--   structure (JSONB): estructura del módulo
--   order_index (INTEGER): orden de presentación
--   is_active (BOOLEAN): si está activo

-- ========================================
-- MÓDULOS DE EJEMPLO
-- ========================================

-- Ciencias - Física (3 módulos)
INSERT INTO kuneo.modules (subject, title, description, difficulty, grade_level, structure, order_index) VALUES
(
  'ciencias',
  'Gravedad: Conceptos Básicos',
  'Explora qué es la gravedad y cómo afecta a los objetos en la Tierra',
  2,
  6,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "goal": "Entender qué es la gravedad", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "goal": "Modelar fenómenos gravitacionales", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "goal": "Razonar sobre la gravedad", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "goal": "Transferir a nuevos contextos", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "goal": "Reflexionar sobre lo aprendido", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Definir gravedad con sus propias palabras",
      "Explicar por qué los objetos caen",
      "Relacionar masa y fuerza de gravedad"
    ],
    "linked_standards": ["MEN-CN-6-1"],
    "content_tags": ["fisica", "gravedad", "fuerzas"]
  }'::jsonb,
  1
),
(
  'ciencias',
  'Fuerzas en Equilibrio',
  'Comprende cómo las fuerzas se equilibran y cómo analizar sistemas en equilibrio',
  3,
  8,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Identificar fuerzas en equilibrio",
      "Dibujar diagramas de cuerpo libre",
      "Resolver problemas de equilibrio estático"
    ],
    "linked_standards": ["MEN-CN-8-2"],
    "content_tags": ["fisica", "equilibrio", "fuerzas"]
  }'::jsonb,
  2
),
(
  'ciencias',
  'Energía Cinética y Potencial',
  'Descubre cómo la energía se transforma entre diferentes formas',
  3,
  9,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Distinguir energía cinética y potencial",
      "Aplicar conservación de energía",
      "Calcular transformaciones energéticas"
    ],
    "linked_standards": ["MEN-CN-9-3"],
    "content_tags": ["fisica", "energia", "conservacion"]
  }'::jsonb,
  3
);

-- Matemáticas - Álgebra (3 módulos)
INSERT INTO kuneo.modules (subject, title, description, difficulty, grade_level, structure, order_index) VALUES
(
  'matematicas',
  'Ecuaciones Lineales: Introducción',
  'Aprende a resolver ecuaciones lineales paso a paso',
  2,
  7,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Comprender qué es una ecuación",
      "Resolver ecuaciones de una variable",
      "Verificar soluciones"
    ],
    "linked_standards": ["MEN-MAT-7-1"],
    "content_tags": ["algebra", "ecuaciones", "variables"]
  }'::jsonb,
  1
),
(
  'matematicas',
  'Sistemas de Ecuaciones',
  'Resuelve sistemas de ecuaciones con múltiples métodos',
  3,
  9,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Resolver sistemas por sustitución",
      "Aplicar método de eliminación",
      "Interpretar soluciones geométricamente"
    ],
    "linked_standards": ["MEN-MAT-9-2"],
    "content_tags": ["algebra", "sistemas", "metodos"]
  }'::jsonb,
  2
),
(
  'matematicas',
  'Funciones Cuadráticas',
  'Explora las funciones cuadráticas y sus aplicaciones',
  4,
  10,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Graficar funciones cuadráticas",
      "Encontrar vértices y raíces",
      "Aplicar en problemas de optimización"
    ],
    "linked_standards": ["MEN-MAT-10-3"],
    "content_tags": ["funciones", "cuadraticas", "parabolas"]
  }'::jsonb,
  3
);

-- Lenguaje - Comprensión Lectora (2 módulos)
INSERT INTO kuneo.modules (subject, title, description, difficulty, grade_level, structure, order_index) VALUES
(
  'lenguaje',
  'Idea Principal y Secundarias',
  'Aprende a identificar las ideas clave en cualquier texto',
  2,
  6,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Identificar idea principal",
      "Distinguir ideas secundarias",
      "Resumir textos"
    ],
    "linked_standards": ["MEN-LEN-6-1"],
    "content_tags": ["lectura", "comprension", "ideas"]
  }'::jsonb,
  1
),
(
  'lenguaje',
  'Inferencias y Conclusiones',
  'Desarrolla habilidades de pensamiento crítico en la lectura',
  3,
  8,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Hacer inferencias válidas",
      "Usar evidencia textual",
      "Llegar a conclusiones fundamentadas"
    ],
    "linked_standards": ["MEN-LEN-8-2"],
    "content_tags": ["lectura", "inferencias", "critico"]
  }'::jsonb,
  2
);

-- Ciencias Sociales (1 módulo)
INSERT INTO kuneo.modules (subject, title, description, difficulty, grade_level, structure, order_index) VALUES
(
  'sociales',
  'La Revolución Industrial',
  'Explora cómo la Revolución Industrial cambió el mundo',
  3,
  8,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploración", "dimension": "comprension"},
      {"id": "representacion", "name": "Representación", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinamiento", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Aplicación", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognición", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Comprender causas de la Revolución Industrial",
      "Analizar impactos sociales y económicos",
      "Conectar con el mundo actual"
    ],
    "linked_standards": ["MEN-SOC-8-1"],
    "content_tags": ["historia", "industrializacion", "sociedad"]
  }'::jsonb,
  1
);

-- Inglés (1 módulo)
INSERT INTO kuneo.modules (subject, title, description, difficulty, grade_level, structure, order_index) VALUES
(
  'ingles',
  'Present Simple and Continuous',
  'Master the present tenses in English',
  2,
  7,
  '{
    "phases": [
      {"id": "exploracion", "name": "Exploration", "dimension": "comprension"},
      {"id": "representacion", "name": "Representation", "dimension": "representacion"},
      {"id": "refinamiento", "name": "Refinement", "dimension": "razonamiento"},
      {"id": "aplicacion", "name": "Application", "dimension": "transferencia"},
      {"id": "metacognicion", "name": "Metacognition", "dimension": "metacognicion"}
    ],
    "expected_outcomes": [
      "Distinguish between present simple and continuous",
      "Use correct verb forms",
      "Apply in real situations"
    ],
    "linked_standards": ["MEN-ENG-7-1"],
    "content_tags": ["grammar", "tenses", "present"]
  }'::jsonb,
  1
);

-- ========================================
-- NOTAS SOBRE PREREQUISITOS
-- ========================================

-- Para agregar prerequisitos, primero obtén los UUIDs de los módulos:

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver todos los módulos insertados:
-- SELECT id, title, subject, difficulty, grade_level, order_index 
-- FROM kuneo.modules 
-- ORDER BY subject, order_index;

-- Contar módulos por asignatura:
-- SELECT subject, COUNT(*) as total 
-- FROM kuneo.modules 
-- GROUP BY subject
-- ORDER BY subject;

-- Ver estructura de un módulo específico:
-- SELECT title, structure 
-- FROM kuneo.modules 
-- WHERE title = 'Gravedad: Conceptos Básicos';

-- ========================================
-- NOTA: El schema NO incluye campos para prerequisites ni estimated_duration
-- Si necesitas esos campos en el futuro, deberás modificar schema.sql primero:
--   ALTER TABLE kuneo.modules ADD COLUMN prerequisites UUID[];
--   ALTER TABLE kuneo.modules ADD COLUMN estimated_duration INTEGER;
-- ========================================

