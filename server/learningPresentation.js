const APPLICATION_POLICY = 'Prioriza actividades de aplicación contextualizadas en situaciones cercanas a estudiantes de Colombia, en TODAS las materias y formatos, según grado y objetivo. El contexto debe ser necesario para razonar, no solo añadir un nombre o ciudad a un ejercicio abstracto. Varía situaciones urbanas y rurales: colegio, biblioteca, huerta, tienda, transporte, deporte, convivencia, ambiente y comunidad; no estereotipes regiones ni supongas ingresos, costumbres o experiencias personales. Matemáticas modela cantidades con unidades, dominio físico válido y datos coherentes; Lenguaje incluye textos breves completos en español y una intención comunicativa; Ciencias usa observaciones o experimentos seguros con datos proporcionados; Sociales contrasta perspectivas y evidencia de fuentes identificadas como simuladas cuando sean inventadas, sin presentar ficción como historia real; Inglés usa intercambios o textos en inglés adecuados al grado en situaciones cercanas, con instrucciones en español. Transferencia pide usar lo aprendido para resolver o justificar una situación nueva; metacognición pide planificar, comprobar o reflexionar sobre una estrategia en ese contexto. No exijas investigación ni hechos locales no suministrados. No fuerces una historia larga: en 1-3 usa pocas frases y datos pequeños. Aún no hay un renderizador de gráficas en las actividades: no pidas observar una gráfica inexistente, usa una tabla Markdown con datos o solicita explicar cómo la representarías. Las tablas referidas deben aparecer completas en question o en los elementos mostrados. Una representación simbólica puede acompañar el problema de aplicación, no reemplazarlo.';

// Remove only a complete standalone copy of controls, never an embedded
// mention, a reading passage or a multi-column table of problem data.
function cleanActivityPresentation(item) {
  const choices=item.type==='matching'?[...(item.left_items||[]),...(item.right_items||[])]:item.type==='ordering'?(item.items||[]):['option','multiple_select'].includes(item.type)?(item.options||[]):[];
  if(choices.length<2||typeof item.question!=='string')return item;
  const stripLabel=text=>text.replace(/^\s*(?:[-*+]\s+)?(?:[a-f]|\d{1,2})[.)]\s+/i,'').replace(/^\s*[-*+]\s+/, '');
  const norm=text=>stripLabel(String(text).replace(/\*\*|__|`/g,'')).normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase().replace(/[.;:]$/,'');
  const heading=text=>/^\s*(?:opciones(?: de respuesta)?|alternativas|respuestas|options|choices|answer choices)\s*:\s*$/i.test(text);
  const known=new Set(choices.map(norm));
  // A second answer table with additional columns cannot be safely deleted:
  // it may contain a third relation not supported by matching controls.
  if(item.type==='matching'){
    for(const block of item.question.split(/\n[ \t]*\n/)){
      const lines=block.split('\n').filter(s=>s.trim());
      if(lines.length<4||!lines.every(s=>s.trim().startsWith('|')))continue;
      const rows=lines.map(s=>s.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(s=>s.trim()));
      if(rows[0].length<2)continue;
      const responseHeader=value=>/hip[oó]tesis|fortaleza|revisi[oó]n|error|respuesta|opcion|opci[oó]n|cambios en|emparejamiento/i.test(value);
      if(rows[0].filter(responseHeader).length>=2&&rows[0].some((_,col)=>rows.slice(2).length>=2&&rows.slice(2).every(row=>/^\s*(?:[a-f]|\d{1,2})[.)]\s+/i.test(row[col]||''))))throw Error('Invalid activity presentation: hay una segunda tabla de alternativas; expresa una sola relación en los controles y conserva aparte los datos.');
      for(let col=0;col<rows[0].length;col++){
        const values=rows.slice(2).map(row=>row[col]||'');
        const otherResponse=rows[0].some((header,j)=>j!==col&&(responseHeader(header)||rows.slice(2).every(row=>known.has(norm(row[j]||'')))));
        if(responseHeader(rows[0][col])&&otherResponse&&values.length>=2&&values.every(v=>known.has(norm(v))))throw Error('Invalid activity presentation: tabla de respuestas redundante o relación adicional; conserva solo datos necesarios y una pareja por elemento.');
      }
    }
  }
  const copy=values=>values.length>=2&&new Set(values.map(norm)).size>=2&&values.every(value=>known.has(norm(value)));
  let removed=false;
  const blocks=item.question.split(/\n[ \t]*\n/);
  const kept=blocks.map(block=>{
    const lines=block.split('\n');
    // A one-column table consisting exclusively of interactive choices.
    // Multi-column tables can contain indispensable quantities/observations.
    if(lines.length>=4&&lines.every(line=>line.trim().startsWith('|'))){
      const cells=lines.map(line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(s=>s.trim()));
      if(cells.every(row=>row.length===1)&&/opci[oó]n|alternativa|hip[oó]tesis|afirmaci[oó]n|respuesta|choices|options|elementos para (?:ordenar|relacionar)/i.test(cells[0][0])&&/^:?-{3,}:?$/.test(cells[1][0])&&copy(cells.slice(2).map(row=>row[0]))){removed=true;return '';}
    }
    const marker=line=>/^\s*(?:[-*+]\s+|(?:[a-f]|\d{1,2})[.)]\s+)/i.test(line.replace(/\*\*|__/g,''));
    const start=lines.findIndex(marker),prefix=start>0?lines.slice(0,start):[];
    const parts=[];
    for(const line of lines.slice(Math.max(start,0))){
      const plain=line.replace(/\*\*|__/g,'');
      if(!parts.length&&heading(plain))continue;
      if(/^\s*(?:[-*+]\s+|(?:[a-f]|\d{1,2})[.)]\s+)/i.test(plain))parts.push(stripLabel(plain));
      else if(parts.length&&plain.trim())parts[parts.length-1]+=' '+plain.trim();
      else if(line.trim()){parts.length=0;break;}
    }
    if(copy(parts)){removed=true;return prefix.filter(line=>!heading(line)).join('\n');}
    // Plain options in a paragraph each are handled only as an entire run below.
    return block;
  }).filter(block=>block.trim());
  for(let i=0;i<kept.length;){
    let end=i;while(end<kept.length&&known.has(norm(kept[end])))end++;
    if(i>0&&heading(kept[i-1])&&copy(kept.slice(i,end))){kept.splice(i,end-i);removed=true;}else i=end>i?end:i+1;
  }
  // Individually separated A./B. paragraphs are an unambiguous list only if
  // at least two exact copies occur. Unmatched context paragraphs survive.
  const labelled=kept.filter(b=>/^\s*(?:[-*+]\s+|(?:[a-f]|\d{1,2})[.)]\s+)/i.test(b.replace(/\*\*|__/g,''))&&known.has(norm(b)));
  if(copy(labelled)){for(let i=kept.length-1;i>=0;i--)if(labelled.includes(kept[i]))kept.splice(i,1);removed=true;}
  if(!removed)return item;
  const question=kept.filter(b=>!heading(b)).join('\n\n').trim();
  // A prompt made only of options is incomplete. Leave it for validation;
  // never manufacture a question or silently publish an empty one.
  if(question.length<12)throw new Error('Invalid activity presentation: falta el enunciado tras separar las opciones.');
  return {...item,question};
}
function validatePresentation(item) {
  const text = item.question || '';
  const controls=[...(item.options||[]),...(item.left_items||[]),...(item.right_items||[]),...(item.items||[])];
  if(controls.some(value=>/asignad[oa]\s+(?:al?\s+|a la\s+)?(?:estudiante|opci[oó]n|elemento)|no repetir (?:a )?la misma izquierda|correct_(?:pairs|index|indices)|(?:nota|instrucci[oó]n) (?:interna|para el (?:modelo|generador))|(?:pareja|respuesta) correcta\s*[:=]/i.test(value)))throw Error('Invalid activity presentation: las opciones contienen claves o instrucciones internas; reescribe elementos limpios sin revelar la solución.');
  if(item.type==='matching'&&controls.some(value=>/\n[^\n]*(?:estudiante|elemento)\s+[a-f1-9][^\n]*(?:error|revisi[oó]n|considerar)/i.test(value)))throw Error('Invalid activity presentation: cada elemento de relacionar debe ser una sola unidad, no varios estudiantes o tareas agrupadas.');
  if(item.type==='matching'&&/(?:fortaleza[^.\n]{0,120}(?:y|con) (?:un |una |sus |los )?(?:posible )?(?:error|debilidad)|pares entre[^.\n]*fortalezas[^.\n]*errores)/i.test(text))throw Error('Invalid activity presentation: la consigna pide varias relaciones; usa una sola pareja por elemento o una respuesta abierta.');
  if (/(?:su gr[aá]fica|(?:la|esta|siguiente) gr[aá]fica (?:adjunta|mostrada|en el plano)|(?:observa|mira|interpreta|analiza)[^.?!\n]{0,120}\bgr[aá]fica\b)/i.test(text)) throw new Error('Invalid activity presentation: no hay una gráfica visible; proporciona datos en tabla y pide interpretarlos, sin afirmar que se muestra una gráfica.');
  const refersToTable = /(?:(?:observa|consulta|lee|interpreta|analiza|compara)[^.?!\n]{0,100}\btabla\b|(?:la|esta) (?:siguiente )?tabla (?:muestra|presenta|contiene|siguiente|adjunta)|la siguiente tabla\b)/i.test(text);
  const shown = [text, ...(item.left_items || []), ...(item.right_items || [])].join('\n');
  if (refersToTable && !/^\s*\|?\s*:?-{3,}:?\s*\|/m.test(shown)) throw new Error('Invalid activity presentation: se menciona una tabla ausente; inclúyela con encabezados, separador Markdown y filas de datos.');
}
module.exports = { APPLICATION_POLICY, validatePresentation, cleanActivityPresentation };
