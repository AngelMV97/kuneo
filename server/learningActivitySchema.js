// Constrain each format at the provider boundary instead of asking one loose
// schema to express incompatible keys and array lengths. A text alternative
// stays available when a closed format cannot assess the objective honestly.
function activityWireSchema(base, format, grade) {
  const text = { type: 'string', pattern: '\\S' };
  function variant(type) {
    const count = type === 'option' && grade <= 3 ? 3 : type === 'matching' ? 3 : 4;
    const array = (items, size) => ({ type: 'array', items, minItems: size, maxItems: size });
    const properties = {
      question: { ...base.properties.question, pattern: '\\S' },
      type: { type: 'string', enum: [type] },
      rubric: text, hint: text, explanation: text, learning_focus: text
    };
    if (type === 'text') properties.expected_text = { ...text, description: 'Respuesta de referencia completa, no vacía, para evaluar respuestas equivalentes.' };
    if (['option', 'multiple_select'].includes(type)) {
      properties.options = array(text, count);
      properties.option_explanations = { ...array(text, count), description: 'Una justificación por opción, exactamente en su orden.' };
      if (type === 'option') properties.correct_index = { type: 'integer', minimum: 0, maximum: count - 1 };
      else properties.correct_indices = { type: 'array', minItems: 2, maxItems: count - 1, items: { type: 'integer', minimum: 0, maximum: count - 1 }, description: 'Índices correctos desde cero, todos distintos.' };
    }
    if (type === 'matching') {
      properties.left_items = array(text, count); properties.right_items = array(text, count);
      properties.correct_pairs = { ...array(array({ type: 'integer', minimum: 0, maximum: count - 1 }, 2), count), description: 'Biyectiva: cada índice izquierdo y derecho aparece exactamente una vez.' };
      properties.pair_explanations = { ...array(text, count), description: 'Una justificación por elemento izquierdo, en su orden.' };
    }
    if(type==='ordering'){
      const size=grade<=5?3:4;
      properties.items={...array({...text,maxLength:220},size),description:`Exactamente ${size} elementos distintos, sin números de posición ni pistas de la clave. No añadir más elementos en el enunciado.`};
      properties.correct_order={...array({type:'integer',minimum:0,maximum:size-1},size),description:'Permutación completa de índices desde cero; orden único sustentado por el enunciado.'};
      properties.order_explanations={...array(text,size),description:'Justificación por posición de la secuencia CORRECTA, no por posición inicial.'};
      properties.order_constraints=array({type:'object',additionalProperties:false,properties:{before:{type:'integer',minimum:0,maximum:size-1},after:{type:'integer',minimum:0,maximum:size-1},evidence:{...text,maxLength:1200,description:'Copia un fragmento continuo EXACTO de question. Sin comillas añadidas, sin puntos suspensivos añadidos, sin paráfrasis ni explicaciones. Puede copiar filas consecutivas de una tabla. La justificación va en order_explanations.'}},required:['before','after','evidence']},size-1);
    }
    return { type: 'object', additionalProperties: false, properties, required: Object.keys(properties) };
  }
  return { type: 'object', additionalProperties: false, properties: {
    activity: format === 'text' ? variant('text') : { anyOf: [variant(format), variant('text')] }
  }, required: ['activity'] };
}
module.exports = { activityWireSchema };
