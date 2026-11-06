/**
 * Mock data para visual_templates
 * Usar solo en desarrollo cuando la BD no tiene datos
 */

export const mockVisualTemplates = {
  fraction_part_whole: {
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
  
  angle_measurement: {
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
  
  equation_balance: {
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
  
  proportional_relationship: {
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
  
  data_visualization: {
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
  
  timeline: {
    template_key: 'timeline',
    template_name: 'Línea de Tiempo',
    description: 'Secuencia cronológica de eventos',
    visual_type: 'timeline',
    renderer: 'timeline',
    config: {
      orientation: 'vertical',
      events: [
        {
          label: 'Independencia',
          description: 'Colombia se independiza de España',
          date: '1810'
        },
        {
          label: 'República',
          description: 'Formación de la Gran Colombia',
          date: '1819'
        },
        {
          label: 'Separación',
          description: 'Disolución de la Gran Colombia',
          date: '1830'
        }
      ]
    },
    default_props: { width: 600, height: 400 },
    subject: 'sociales',
    interaction_level: 'hoverable',
    supported_card_types: ['basic', 'hint'],
    use_cases: ['explanation', 'example']
  }
};

export function getMockTemplate(templateKey) {
  return mockVisualTemplates[templateKey] || null;
}
