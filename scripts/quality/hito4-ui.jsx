import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LearningModule from '../../client/src/pages/LearningModule.jsx';
import './hito4-ui-mocks.js';
const fixture = globalThis.hito4Fixture;
let root;
const logs = document.getElementById('results');
const log = message => { logs.textContent += `${message}\n`; };
const ensure = (condition, message) => { if (!condition) throw Error(message); };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate) { for (let i = 0; i < 150; i++) { if (predicate()) return; await delay(20); } throw Error('Tiempo agotado esperando la interfaz.'); }
const button = text => [...document.querySelectorAll('#app button')].find(node => node.textContent.trim() === text);
function mount() {
  root?.unmount(); root = createRoot(document.getElementById('app'));
  root.render(<MemoryRouter initialEntries={['/module/synthetic-module']}><Routes><Route path="/module/:moduleId" element={<LearningModule />} /><Route path="*" element={<p>Sesión de prueba cerrada</p>} /></Routes></MemoryRouter>);
}
function typeAnswer(text) {
  const input = document.querySelector('#app textarea');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
let leaked = false;
new MutationObserver(() => { if (document.getElementById('app').textContent.includes('BORRADOR_NO_APROBADO')) leaked = true; }).observe(document.getElementById('app'), { childList: true, subtree: true, characterData: true });
async function run() {
  document.getElementById('run').disabled = true; logs.textContent = ''; leaked = false;
  try {
    for (const type of ['text', 'option', 'multiple_select', 'matching']) {
      fixture.reset(type); mount(); await until(() => button('Enviar respuesta'));
      ensure(!leaked, 'Se mostró un borrador no aprobado.');
      if (type === 'text') typeAnswer('Junto los 3 libros con los 5 y obtengo 8.');
      if (type === 'option' || type === 'multiple_select') button('8 libros').click();
      if (type === 'matching') { button('3 + 5').click(); await delay(30); button('8 libros').click(); await delay(30); button('2 + 4').click(); await delay(30); button('6 libros').click(); }
      await until(() => button('Enviar respuesta') && !button('Enviar respuesta').disabled); button('Enviar respuesta').click();
      await until(() => button('Reintentar respuesta')); ensure(fixture.generations === 1, 'El error generó otra pregunta.');
      if (type === 'text') ensure(document.querySelector('#app textarea').value.includes('obtengo 8'), 'Se perdió el texto.');
      mount(); await until(() => button('Enviar respuesta'));
      if (type === 'text') ensure(document.querySelector('#app textarea').value.includes('obtengo 8'), 'Se perdió el texto al retomar.');
      ensure(!button('Enviar respuesta').disabled, 'Se perdieron las selecciones al retomar.');
      ensure(fixture.generations === 1, 'Retomar cambió de actividad.');
      button('Enviar respuesta').click(); await until(() => button('Continuar con otra actividad'));
      ensure(fixture.calls === 2, 'Se enviaron intentos adicionales.'); log(`PASS · ${type}: respuesta conservada, recarga y reintento sin sustituir pregunta.`);
    }
    fixture.reset('text', 'lost'); mount(); await until(() => button('Enviar respuesta'));
    typeAnswer('Los libros son ocho.'); await until(() => !button('Enviar respuesta').disabled); button('Enviar respuesta').click();
    await until(() => button('Reintentar respuesta')); mount(); await until(() => button('Continuar con otra actividad'));
    ensure(fixture.calls === 1, 'Se repitió el envío tras recuperar el resultado.'); ensure(fixture.generations === 1, 'Se sustituyó una actividad ya guardada.');
    ensure(document.querySelector('#app textarea').value === 'Los libros son ocho.', 'No se recuperó la respuesta evaluada.');
    log('PASS · Confirmación perdida: se recupera el feedback sin reenviar la respuesta.');
    fixture.summaryFailure = true;
    button('Finalizar práctica').click();
    await until(() => document.querySelector('#app [aria-busy="true"]'));
    ensure(!document.querySelector('#app textarea'), 'La actividad sigue visible mientras se prepara el resumen.');
    await until(() => button('Reintentar resumen')); button('Reintentar resumen').click();
    await until(() => button('Comenzar otra práctica'));
    ensure(document.getElementById('app').textContent.includes('Resumen simulado.'), 'No se mostró el resumen tras reintentar.');
    log('PASS · Resumen: carga visible, actividad oculta y reintento tras fallo.');
    mount(); await until(() => document.querySelector('#app [aria-busy="true"]'));
    ensure(!document.querySelector('#app textarea'), 'La recarga del resumen muestra una actividad antigua.');
    await until(() => button('Comenzar otra práctica'));
    button('Comenzar otra práctica').click(); await until(() => button('Enviar respuesta'));
    log('PASS · Resumen guardado: recarga con estado de preparación y comienzo de otra práctica.');
    fixture.reset('text', 'expired'); mount(); await until(() => button('Enviar respuesta'));
    typeAnswer('Conservo esta explicación para copiarla.'); await until(() => !button('Enviar respuesta').disabled); button('Enviar respuesta').click();
    await until(() => button('Preparar otra actividad')); ensure(document.querySelector('#app textarea').value.includes('Conservo'), 'La caducidad borró el texto.');
    ensure(fixture.generations === 1, 'La caducidad sustituyó la pregunta automáticamente.'); log('PASS · Caducidad: conserva el texto y requiere elegir otra actividad explícitamente.');
    fixture.changeUser(null); await until(() => document.getElementById('app').textContent.includes('Sesión de prueba cerrada'));
    ensure(!document.querySelector('#app textarea'), 'La sesión cerrada conserva datos visibles.'); log('PASS · Cambio de sesión: se retiran la actividad y la respuesta.');
    ensure(!leaked, 'Se mostró un borrador no aprobado.'); log('PASS · Ningún borrador no aprobado apareció en el DOM.');
    document.title = 'Kuneo 4.0 · Pruebas aprobadas'; document.getElementById('status').textContent = '10 comprobaciones aprobadas · datos simulados · sin Supabase';
  } catch (error) { log(`FAIL · ${error.message}`); document.title = 'Kuneo 4.0 · Error en pruebas'; document.getElementById('status').textContent = 'Hay una comprobación pendiente'; }
  document.getElementById('run').disabled = false;
}
document.getElementById('run').addEventListener('click', run);
fixture.reset('text'); mount();
