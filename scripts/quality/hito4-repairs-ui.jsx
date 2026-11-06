import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import LearningModule from '../../client/src/pages/LearningModule.jsx';
import './hito4-repairs-ui-mocks.js';
const fixture=globalThis.repairFixture;
const packets=await fetch('/packets.json').then(r=>r.json());
let root;
function mount(index){root?.unmount();sessionStorage.clear();fixture.index=index;fixture.packet=packets[index];fixture.saved=null;fixture.pending={complete:false,token:`repair-token-${index}`,activity:{...fixture.packet.activity,id:`repair-activity-${index}`,step_id:`repair-step-${index}`,source:'stored',cognitive_dimension:fixture.packet.activity.dimension}};root=createRoot(document.getElementById('app'));root.render(<MemoryRouter initialEntries={[`/module/${fixture.packet.module.id}`]}><Routes><Route path="/module/:moduleId" element={<LearningModule/>}/></Routes></MemoryRouter>);}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let i=0;i<150;i++){if(check())return;await pause(30);}throw Error('Interfaz no disponible a tiempo');}
const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
const assert=(ok,message)=>{if(!ok)throw Error(message);};
for(let i=0;i<packets.length;i++){const b=document.createElement('button');b.textContent=packets[i].module.subject;b.onclick=()=>mount(i);document.getElementById('subjects').append(b);}
document.getElementById('run').onclick=async()=>{
 const output=document.getElementById('results');output.textContent='';
 try{
  for(let i=0;i<packets.length;i++){
   mount(i);await until(()=>button('Enviar respuesta'));
   const packet=packets[i];assert(document.getElementById('app').textContent.includes(packet.activity.question.split('\n')[0].replaceAll('$',''))||document.getElementById('app').querySelector('.katex'),'Falta el enunciado');
   document.querySelector('[aria-label="Pedir una pista"]').click();await until(()=>document.querySelector('dialog[open]'));
   await until(()=>button('Tarjeta conceptual')&&!button('Tarjeta conceptual').disabled);
   button('Tarjeta conceptual').click();await until(()=>document.querySelector('dialog').textContent.includes(packet.supports[0].title));
   await until(()=>button('Ejemplo distinto')&&!button('Ejemplo distinto').disabled);
   button('Ejemplo distinto').click();await until(()=>document.querySelector('dialog').textContent.includes('Resultado del ejemplo'));
   await pause(350);
   const dialog=document.querySelector('dialog'),rect=dialog.getBoundingClientRect();
   assert(Math.abs(rect.x+rect.width/2-innerWidth/2)<4,'Ayuda no centrada horizontalmente');
   assert(Math.abs(rect.y+rect.height/2-innerHeight/2)<4,'Ayuda no centrada verticalmente');
   assert(!dialog.querySelector('.example-result table'),'Tabla duplicada en resultado');
   if(packet.supports[1].visual.kind==='table')assert(dialog.querySelectorAll('table').length===1,'Falta o se duplica la tabla de ayuda');
   assert(!dialog.textContent.includes('\\sqrt'),'LaTeX sin renderizar');
   dialog.querySelector('[aria-label="Cerrar ayuda"]').click();await until(()=>!document.querySelector('dialog[open]'));
   const answer=packet.answer;
   if(packet.activity.type==='text'){
    const input=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,answer);input.dispatchEvent(new Event('input',{bubbles:true}));
   }else if(packet.activity.type==='option')button(packet.activity.options[Number(answer)]).click();
   else if(packet.activity.type==='multiple_select')for(const index of JSON.parse(answer)){button(packet.activity.options[index]).click();await pause(30);}
   else if(packet.activity.type==='ordering'){
    const desired=JSON.parse(answer);
    for(let position=0;position<desired.length;position++){
      let current=[...document.querySelectorAll('[data-order-id]')].findIndex(n=>Number(n.dataset.orderId)===desired[position]);
      while(current>position){document.querySelector(`[aria-label="Subir elemento ${current+1}"]`).click();await pause(40);current--;}
    }
   }else for(const [l,r]of JSON.parse(answer)){button(packet.activity.left_items[l]).click();await pause(30);button(packet.activity.right_items[r]).click();await pause(30);}
   await until(()=>button('Enviar respuesta')&&!button('Enviar respuesta').disabled);button('Enviar respuesta').click();await until(()=>button('Continuar con otra actividad'));
   assert(document.getElementById('app').textContent.includes(packet.feedback.feedback),'Falta feedback revisado');
   if(packet.activity.type==='ordering')assert([...document.querySelectorAll('[data-order-id] button')].every(b=>b.disabled),'Orden editable después de enviar');
   output.textContent+=`PASS ${packet.module.subject}: pregunta, respuesta, ayuda centrada, ejemplo y visual.\n`;
  }
  output.textContent+=`PASS ${packets.length}/${packets.length} · servicios de vista simulados; calificaciones precalculadas con el evaluador real.\n`;
 }catch(error){output.textContent+='FAIL '+error.message+'\n';}
};
mount(0);
