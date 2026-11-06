-- 🎨 Script de población de visual_templates
-- Ejecutar en Supabase Studio > SQL Editor

-- Primero, deshabilitar RLS temporalmente (si está habilitado)
ALTER TABLE kuneo.visual_templates DISABLE ROW LEVEL SECURITY;

-- Poblar visual_templates (MVP: 15 templates)
INSERT INTO kuneo.visual_templates (
  template_key,
  template_name,
  description,
  visual_type,
  renderer,
  config,
  default_props,
  subject,
  interaction_level,
  supported_card_types,
  use_cases
) VALUES
-- === MATEMÁTICAS - SVG Custom (6) ===
(
  'fraction_part_whole',
  'Fracción Parte/Todo',
  'Visualización de fracciones dividiendo un círculo o rectángulo en partes iguales',
  'math_visual',
  'svg_custom',
  '{"shape": "circle", "parts": 4, "highlighted": 1, "labels": true, "colors": ["#3B82F6", "#E5E7EB"]}'::jsonb,
  '{"width": 300, "height": 300}'::jsonb,
  'matematicas',
  'static',
  ARRAY['basic', 'hint', 'corrective', 'reflective'],
  ARRAY['explanation', 'example', 'misconception']
),
(
  'angle_measurement',
  'Medición de Ángulos',
  'Representación de ángulos con transportador',
  'math_visual',
  'svg_custom',
  '{"angle": 45, "showProtractor": true, "showDegrees": true, "interactive": true}'::jsonb,
  '{"width": 350, "height": 350}'::jsonb,
  'matematicas',
  'interactive',
  ARRAY['basic', 'hint', 'corrective'],
  ARRAY['explanation', 'example']
),
(
  'equation_balance',
  'Balance de Ecuación',
  'Ecuación como balanza equilibrada',
  'math_visual',
  'svg_custom',
  '{"showBalance": true, "leftSide": "x + 3", "rightSide": "7", "interactive": true}'::jsonb,
  '{"width": 400, "height": 300}'::jsonb,
  'matematicas',
  'interactive',
  ARRAY['basic', 'hint', 'corrective', 'reflective'],
  ARRAY['explanation', 'example', 'misconception']
),
(
  'geometric_shapes',
  'Formas Geométricas',
  'Visualización de formas geométricas con propiedades',
  'math_visual',
  'svg_custom',
  '{"shape": "triangle", "showLabels": true, "showMeasurements": true}'::jsonb,
  '{"width": 300, "height": 300}'::jsonb,
  'matematicas',
  'hoverable',
  ARRAY['basic', 'hint'],
  ARRAY['explanation', 'example']
),
(
  'number_line',
  'Recta Numérica',
  'Línea numérica para operaciones y comparaciones',
  'math_visual',
  'svg_custom',
  '{"min": 0, "max": 10, "showTicks": true, "highlighted": [5]}'::jsonb,
  '{"width": 500, "height": 100}'::jsonb,
  'matematicas',
  'static',
  ARRAY['basic', 'hint', 'corrective'],
  ARRAY['explanation', 'example']
),
(
  'area_comparison',
  'Comparación de Áreas',
  'Comparación visual de áreas de diferentes formas',
  'math_visual',
  'svg_custom',
  '{"shapes": [{"type": "rectangle", "width": 4, "height": 3, "color": "#3B82F6"}, {"type": "square", "side": 4, "color": "#10B981"}], "showGrid": true}'::jsonb,
  '{"width": 400, "height": 400}'::jsonb,
  'matematicas',
  'static',
  ARRAY['basic', 'hint'],
  ARRAY['explanation', 'example']
),
(
  'percentage_visual',
  'Visualización de Porcentajes',
  'Representación visual de porcentajes',
  'math_visual',
  'svg_custom',
  '{"percentage": 50, "showBar": true, "showCircle": false}'::jsonb,
  '{"width": 300, "height": 100}'::jsonb,
  'matematicas',
  'static',
  ARRAY['basic', 'hint', 'corrective'],
  ARRAY['explanation', 'example']
),
(
  'ratio_comparison',
  'Comparación de Razones',
  'Visualización de razones y proporciones',
  'math_visual',
  'svg_custom',
  '{"ratio1": {"a": 2, "b": 3}, "ratio2": {"a": 4, "b": 6}, "showEquivalence": true}'::jsonb,
  '{"width": 400, "height": 200}'::jsonb,
  'matematicas',
  'static',
  ARRAY['basic', 'hint', 'corrective'],
  ARRAY['explanation', 'example', 'misconception']
),
(
  'story_structure',
  'Estructura Narrativa',
  'Elementos de una historia',
  'concept_map',
  'svg_custom',
  '{"elements": ["Inicio", "Conflicto", "Clímax", "Resolución", "Final"]}'::jsonb,
  '{"width": 600, "height": 200}'::jsonb,
  'lenguaje',
  'static',
  ARRAY['basic', 'hint'],
  ARRAY['explanation', 'example']
),

-- === MATEMÁTICAS - Recharts (4) ===
(
  'proportional_relationship',
  'Relación Proporcional',
  'Gráfica de relaciones proporcionales',
  'graph',
  'recharts',
  '{"chart_type": "line", "data": [{"x": 0, "y": 0}, {"x": 1, "y": 3}, {"x": 2, "y": 6}, {"x": 3, "y": 9}], "x_label": "Cantidad", "y_label": "Precio", "show_grid": true}'::jsonb,
  '{"width": 500, "height": 300}'::jsonb,
  'matematicas',
  'hoverable',
  ARRAY['basic', 'hint', 'corrective'],
  ARRAY['explanation', 'example']
),
(
  'function_graph',
  'Gráfica de Función',
  'Representación de funciones matemáticas',
  'graph',
  'recharts',
  '{"chart_type": "line", "data": [], "x_label": "x", "y_label": "f(x)", "show_grid": true}'::jsonb,
  '{"width": 500, "height": 300}'::jsonb,
  'matematicas',
  'interactive',
  ARRAY['basic', 'hint', 'deepening'],
  ARRAY['explanation', 'example']
),
(
  'data_visualization',
  'Visualización de Datos',
  'Gráficas de barras para comparación de datos',
  'graph',
  'recharts',
  '{"chart_type": "bar", "data": [{"x": "A", "y": 4}, {"x": "B", "y": 7}, {"x": "C", "y": 3}], "x_label": "Categoría", "y_label": "Valor"}'::jsonb,
  '{"width": 500, "height": 300}'::jsonb,
  'matematicas',
  'hoverable',
  ARRAY['basic', 'example'],
  ARRAY['explanation', 'example']
),
(
  'scatter_distribution',
  'Distribución de Puntos',
  'Gráfica de dispersión para análisis de correlación',
  'graph',
  'recharts',
  '{"chart_type": "scatter", "data": [], "x_label": "Variable X", "y_label": "Variable Y"}'::jsonb,
  '{"width": 500, "height": 300}'::jsonb,
  'matematicas',
  'hoverable',
  ARRAY['basic', 'deepening'],
  ARRAY['explanation', 'example']
),

-- === SOCIALES - Timeline (1) ===
(
  'timeline',
  'Línea de Tiempo',
  'Secuencia cronológica de eventos',
  'timeline',
  'timeline',
  '{"orientation": "vertical", "events": [{"label": "Independencia", "description": "Colombia se independiza de España", "date": "1810"}, {"label": "República", "description": "Formación de la Gran Colombia", "date": "1819"}]}'::jsonb,
  '{"width": 600, "height": 400}'::jsonb,
  'sociales',
  'hoverable',
  ARRAY['basic', 'hint'],
  ARRAY['explanation', 'example']
)
ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  description = EXCLUDED.description,
  visual_type = EXCLUDED.visual_type,
  renderer = EXCLUDED.renderer,
  config = EXCLUDED.config,
  default_props = EXCLUDED.default_props,
  subject = EXCLUDED.subject,
  interaction_level = EXCLUDED.interaction_level,
  supported_card_types = EXCLUDED.supported_card_types,
  use_cases = EXCLUDED.use_cases,
  updated_at = NOW();

-- Reactivar RLS
ALTER TABLE kuneo.visual_templates ENABLE ROW LEVEL SECURITY;

-- Crear política para SELECT público (necesaria para el Visual Engine)
DROP POLICY IF EXISTS "visual_templates_select_policy" ON kuneo.visual_templates;
CREATE POLICY "visual_templates_select_policy"
ON kuneo.visual_templates
FOR SELECT
TO anon, authenticated
USING (true);

-- Verificar la población
SELECT 
  renderer,
  COUNT(*) as count,
  array_agg(template_key ORDER BY template_key) as templates
FROM kuneo.visual_templates
GROUP BY renderer
ORDER BY count DESC;

-- Mostrar total
SELECT COUNT(*) as total_templates FROM kuneo.visual_templates;
