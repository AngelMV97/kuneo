/**
 * Script para poblar visual_templates en Supabase
 * Crea las 23 plantillas visuales parametrizables
 * 
 * Uso: node scripts/populate-visual-templates.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const visualTemplates = [
  // === MATEMÁTICAS - SVG Custom (6) ===
  {
    template_key: 'fraction_part_whole',
    template_name: 'Fracción Parte/Todo',
    description: 'Visualización de fracciones dividiendo un círculo o rectángulo en partes iguales',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      shape: 'circle',
      parts: 4,
      highlighted: 1,
      labels: true,
      colors: ['#3B82F6', '#E5E7EB']
    },
    default_props: { width: 300, height: 300 },
    subject: 'matematicas',
    interaction_level: 'static',
    supported_card_types: ['basic', 'hint', 'corrective', 'reflective'],
    use_cases: ['explanation', 'example', 'misconception']
  },
  {
    template_key: 'angle_measurement',
    template_name: 'Medición de Ángulos',
    description: 'Representación de ángulos con transportador',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      angle: 45,
      showProtractor: true,
      showDegrees: true,
      interactive: true
    },
    default_props: { width: 350, height: 350 },
    subject: 'matematicas',
    interaction_level: 'interactive',
    supported_card_types: ['basic', 'hint', 'corrective'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'equation_balance',
    template_name: 'Balance de Ecuación',
    description: 'Ecuación como balanza equilibrada',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      showBalance: true,
      leftSide: 'x + 3',
      rightSide: '7',
      interactive: true
    },
    default_props: { width: 400, height: 300 },
    subject: 'matematicas',
    interaction_level: 'interactive',
    supported_card_types: ['basic', 'hint', 'corrective', 'reflective'],
    use_cases: ['explanation', 'example', 'misconception']
  },
  {
    template_key: 'geometric_shapes',
    template_name: 'Formas Geométricas',
    description: 'Visualización de formas geométricas con propiedades',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      shape: 'triangle',
      showLabels: true,
      showMeasurements: true
    },
    default_props: { width: 300, height: 300 },
    subject: 'matematicas',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'number_line',
    template_name: 'Recta Numérica',
    description: 'Línea numérica para operaciones y comparaciones',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      min: 0,
      max: 10,
      showTicks: true,
      highlighted: [5]
    },
    default_props: { width: 500, height: 100 },
    subject: 'matematicas',
    interaction_level: 'static',
    supported_card_types: ['basic', 'hint', 'corrective'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'area_comparison',
    template_name: 'Comparación de Áreas',
    description: 'Comparación visual de áreas de diferentes formas',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      shapes: [
        { type: 'rectangle', width: 4, height: 3, color: '#3B82F6' },
        { type: 'square', side: 4, color: '#10B981' }
      ],
      showGrid: true
    },
    default_props: { width: 400, height: 400 },
    subject: 'matematicas',
    interaction_level: 'static',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  },

  // === MATEMÁTICAS - Recharts (4) ===
  {
    template_key: 'proportional_relationship',
    template_name: 'Relación Proporcional',
    description: 'Gráfica de relaciones proporcionales',
    visual_type: 'graph',
    renderer: 'recharts',
    config: {
      chart_type: 'line',
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 3 },
        { x: 2, y: 6 },
        { x: 3, y: 9 }
      ],
      x_label: 'Cantidad',
      y_label: 'Precio',
      show_grid: true
    },
    default_props: { width: 500, height: 300 },
    subject: 'matematicas',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint', 'corrective'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'function_graph',
    template_name: 'Gráfica de Función',
    description: 'Representación de funciones matemáticas',
    visual_type: 'graph',
    renderer: 'recharts',
    config: {
      chart_type: 'line',
      data: [],
      x_label: 'x',
      y_label: 'f(x)',
      show_grid: true
    },
    default_props: { width: 500, height: 300 },
    subject: 'matematicas',
    interaction_level: 'interactive',
    supported_card_types: ['basic', 'hint', 'deepening'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'data_visualization',
    template_name: 'Visualización de Datos',
    description: 'Gráficas de barras para comparación de datos',
    visual_type: 'graph',
    renderer: 'recharts',
    config: {
      chart_type: 'bar',
      data: [
        { x: 'A', y: 4 },
        { x: 'B', y: 7 },
        { x: 'C', y: 3 }
      ],
      x_label: 'Categoría',
      y_label: 'Valor'
    },
    default_props: { width: 500, height: 300 },
    subject: 'matematicas',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'example'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'scatter_distribution',
    template_name: 'Distribución de Puntos',
    description: 'Gráfica de dispersión para análisis de correlación',
    visual_type: 'graph',
    renderer: 'recharts',
    config: {
      chart_type: 'scatter',
      data: [],
      x_label: 'Variable X',
      y_label: 'Variable Y'
    },
    default_props: { width: 500, height: 300 },
    subject: 'matematicas',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'deepening'],
    use_cases: ['explanation', 'example']
  },

  // === CIENCIAS - React Flow (5) ===
  {
    template_key: 'photosynthesis_cycle',
    template_name: 'Ciclo de Fotosíntesis',
    description: 'Proceso de fotosíntesis en plantas',
    visual_type: 'process_diagram',
    renderer: 'react_flow',
    config: {
      nodes: [
        { id: '1', label: 'Luz solar', type: 'input', position: { x: 100, y: 0 } },
        { id: '2', label: 'CO₂ + H₂O', type: 'input', position: { x: 0, y: 100 } },
        { id: '3', label: 'Cloroplasto', type: 'process', position: { x: 150, y: 150 } },
        { id: '4', label: 'Glucosa + O₂', type: 'output', position: { x: 150, y: 250 } }
      ],
      edges: [
        { from: '1', to: '3' },
        { from: '2', to: '3' },
        { from: '3', to: '4' }
      ]
    },
    default_props: { width: 500, height: 400 },
    subject: 'ciencias',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'water_cycle',
    template_name: 'Ciclo del Agua',
    description: 'Circulación del agua en la naturaleza',
    visual_type: 'process_diagram',
    renderer: 'react_flow',
    config: {
      nodes: [
        { id: '1', label: 'Evaporación', type: 'process' },
        { id: '2', label: 'Condensación', type: 'process' },
        { id: '3', label: 'Precipitación', type: 'process' },
        { id: '4', label: 'Escorrentía', type: 'process' }
      ],
      edges: [
        { from: '1', to: '2', animated: true },
        { from: '2', to: '3', animated: true },
        { from: '3', to: '4', animated: true },
        { from: '4', to: '1', animated: true }
      ]
    },
    default_props: { width: 500, height: 400 },
    subject: 'ciencias',
    interaction_level: 'animated',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation']
  },
  {
    template_key: 'cell_diagram',
    template_name: 'Diagrama de Célula',
    description: 'Estructura de célula animal o vegetal',
    visual_type: 'process_diagram',
    renderer: 'react_flow',
    config: {
      cellType: 'animal',
      showLabels: true
    },
    default_props: { width: 500, height: 400 },
    subject: 'ciencias',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation']
  },
  {
    template_key: 'food_chain',
    template_name: 'Cadena Alimenticia',
    description: 'Flujo de energía en ecosistema',
    visual_type: 'process_diagram',
    renderer: 'react_flow',
    config: {
      levels: ['Productores', 'Consumidores Primarios', 'Consumidores Secundarios', 'Descomponedores']
    },
    default_props: { width: 500, height: 400 },
    subject: 'ciencias',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'energy_transformation',
    template_name: 'Transformación de Energía',
    description: 'Conversión entre tipos de energía',
    visual_type: 'process_diagram',
    renderer: 'react_flow',
    config: {
      transformations: ['Química → Térmica', 'Térmica → Mecánica', 'Mecánica → Eléctrica']
    },
    default_props: { width: 500, height: 300 },
    subject: 'ciencias',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint', 'deepening'],
    use_cases: ['explanation', 'example']
  },

  // === SOCIALES - Timeline (1) ===
  {
    template_key: 'timeline',
    template_name: 'Línea de Tiempo',
    description: 'Secuencia cronológica de eventos',
    visual_type: 'timeline',
    renderer: 'timeline',
    config: {
      orientation: 'vertical',
      events: [
        { label: 'Evento 1', description: 'Descripción', date: '2024-01-01' },
        { label: 'Evento 2', description: 'Descripción', date: '2024-06-01' }
      ]
    },
    default_props: { width: 600, height: 400 },
    subject: 'sociales',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  },

  // === SOCIALES - Concept Map (2) ===
  {
    template_key: 'concept_map',
    template_name: 'Mapa Conceptual',
    description: 'Relaciones entre conceptos',
    visual_type: 'concept_map',
    renderer: 'concept_map',
    config: {
      nodes: [],
      connections: []
    },
    default_props: { width: 600, height: 400 },
    subject: 'sociales',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint', 'deepening'],
    use_cases: ['explanation', 'synthesis']
  },
  {
    template_key: 'hierarchical_diagram',
    template_name: 'Diagrama Jerárquico',
    description: 'Estructura de jerarquías y relaciones',
    visual_type: 'concept_map',
    renderer: 'react_flow',
    config: {
      layout: 'tree',
      direction: 'top-bottom'
    },
    default_props: { width: 600, height: 500 },
    subject: 'sociales',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation']
  },

  // === LENGUAJE - Concept Map + SVG (3) ===
  {
    template_key: 'reading_strategy',
    template_name: 'Estrategia de Lectura',
    description: 'Pasos para comprensión lectora',
    visual_type: 'concept_map',
    renderer: 'concept_map',
    config: {
      strategy: 'SQA',
      steps: ['Saber', 'Querer saber', 'Aprender']
    },
    default_props: { width: 500, height: 300 },
    subject: 'lenguaje',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation']
  },
  {
    template_key: 'story_structure',
    template_name: 'Estructura Narrativa',
    description: 'Elementos de una historia',
    visual_type: 'concept_map',
    renderer: 'svg_custom',
    config: {
      elements: ['Inicio', 'Conflicto', 'Clímax', 'Resolución', 'Final']
    },
    default_props: { width: 600, height: 200 },
    subject: 'lenguaje',
    interaction_level: 'static',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'argument_structure',
    template_name: 'Estructura Argumentativa',
    description: 'Componentes de un argumento',
    visual_type: 'concept_map',
    renderer: 'concept_map',
    config: {
      components: ['Tesis', 'Argumentos', 'Evidencia', 'Conclusión']
    },
    default_props: { width: 500, height: 400 },
    subject: 'lenguaje',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint', 'deepening'],
    use_cases: ['explanation', 'example']
  },

  // === INGLÉS - Mermaid (1) ===
  {
    template_key: 'syntax_diagram',
    template_name: 'Diagrama de Sintaxis',
    description: 'Estructura gramatical de oraciones',
    visual_type: 'process_diagram',
    renderer: 'mermaid',
    config: {
      diagram_type: 'flowchart',
      content: 'graph TD\nA[Subject] --> B[Verb]\nB --> C[Object]'
    },
    default_props: { width: 500, height: 300 },
    subject: 'ingles',
    interaction_level: 'static',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  },

  // === MATEMÁTICAS - Adicionales (2) ===
  {
    template_key: 'percentage_visual',
    template_name: 'Visualización de Porcentajes',
    description: 'Representación visual de porcentajes',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      percentage: 50,
      showBar: true,
      showCircle: false
    },
    default_props: { width: 300, height: 100 },
    subject: 'matematicas',
    interaction_level: 'static',
    supported_card_types: ['basic', 'hint', 'corrective'],
    use_cases: ['explanation', 'example']
  },
  {
    template_key: 'ratio_comparison',
    template_name: 'Comparación de Razones',
    description: 'Visualización de razones y proporciones',
    visual_type: 'math_visual',
    renderer: 'svg_custom',
    config: {
      ratio1: { a: 2, b: 3 },
      ratio2: { a: 4, b: 6 },
      showEquivalence: true
    },
    default_props: { width: 400, height: 200 },
    subject: 'matematicas',
    interaction_level: 'static',
    supported_card_types: ['basic', 'hint', 'corrective'],
    use_cases: ['explanation', 'example', 'misconception']
  }
];

async function populateVisualTemplates() {
  console.log('🎨 Iniciando población de visual_templates...\n');

  try {
    // Primero verificar si ya existen templates
    const { data: existing, error: checkError } = await supabase
      .schema('kuneo')
      .from('visual_templates')
      .select('template_key');

    if (checkError) {
      console.error('❌ Error al verificar templates existentes:', checkError.message);
      return;
    }

    if (existing && existing.length > 0) {
      console.log(`⚠️  Ya existen ${existing.length} templates en la base de datos.`);
      console.log('¿Deseas continuar? Esto NO duplicará registros (UNIQUE constraint).\n');
    }

    // Insertar templates (usar upsert para evitar duplicados)
    const { data, error } = await supabase
      .schema('kuneo')
      .from('visual_templates')
      .upsert(visualTemplates, { onConflict: 'template_key' })
      .select('template_key, template_name, renderer');

    if (error) {
      console.error('❌ Error al insertar templates:', error.message);
      return;
    }

    console.log(`✅ ${data.length} visual_templates poblados exitosamente!\n`);

    // Estadísticas por renderer
    const stats = data.reduce((acc, template) => {
      acc[template.renderer] = (acc[template.renderer] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Distribución por renderer:');
    Object.entries(stats).forEach(([renderer, count]) => {
      console.log(`   ${renderer}: ${count} templates`);
    });

    console.log('\n🎯 MVP Renderers listos (15 templates):');
    console.log(`   ✅ svg_custom: ${stats['svg_custom'] || 0}`);
    console.log(`   ✅ recharts: ${stats['recharts'] || 0}`);
    console.log(`   ✅ timeline: ${stats['timeline'] || 0}`);

    console.log('\n⏳ Post-MVP Renderers (8 templates):');
    console.log(`   ⏸️  react_flow: ${stats['react_flow'] || 0}`);
    console.log(`   ⏸️  concept_map: ${stats['concept_map'] || 0}`);
    console.log(`   ⏸️  mermaid: ${stats['mermaid'] || 0}`);

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

// Ejecutar
populateVisualTemplates();
