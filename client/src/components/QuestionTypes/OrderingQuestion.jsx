import {useEffect,useState} from 'react';
import {Reorder} from 'framer-motion';
import EducationalText from '../EducationalText';

export default function OrderingQuestion({items=[],onAnswerChange,disabled=false,initialAnswer=[]}){
  const [order,setOrder]=useState(()=>initialAnswer.length===items.length&&new Set(initialAnswer).size===items.length&&initialAnswer.every(i=>Number.isInteger(i)&&i>=0&&i<items.length)?initialAnswer:items.map((_,i)=>i));
  useEffect(()=>{onAnswerChange(order);},[order,onAnswerChange]);
  const move=(index,delta)=>{
    if(disabled||index+delta<0||index+delta>=order.length)return;
    setOrder(previous=>{const next=[...previous];[next[index],next[index+delta]]=[next[index+delta],next[index]];return next;});
  };
  return <div className="mb-4">
    <p className="text-gray-400 text-sm mb-4">Ordena los elementos. Puedes arrastrarlos o usar los botones Subir y Bajar.</p>
    <Reorder.Group axis="y" values={order} onReorder={disabled?()=>{}:setOrder} className="space-y-3" aria-label="Elementos para ordenar">
      {order.map((id,index)=><Reorder.Item key={id} value={id} data-order-id={id} dragListener={!disabled} drag={disabled?false:undefined} className={`bg-[#2a3149] text-white rounded-2xl p-4 ${disabled?'opacity-75':'cursor-move'}`}>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-purple-600 px-3 py-1 shrink-0" aria-label={`Posición ${index+1}`}>{index+1}</span>
          <div className="flex-1 min-w-0"><EducationalText>{items[id]}</EducationalText></div>
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" aria-label={`Subir elemento ${index+1}`} disabled={disabled||index===0} onClick={()=>move(index,-1)} className="rounded p-2 bg-purple-800 disabled:opacity-30">↑</button>
            <button type="button" aria-label={`Bajar elemento ${index+1}`} disabled={disabled||index===order.length-1} onClick={()=>move(index,1)} className="rounded p-2 bg-purple-800 disabled:opacity-30">↓</button>
          </div>
        </div>
      </Reorder.Item>)}
    </Reorder.Group>
    <p aria-live="polite" className="text-sm text-gray-400 mt-3">Revisa toda la secuencia antes de enviarla.</p>
  </div>;
}
