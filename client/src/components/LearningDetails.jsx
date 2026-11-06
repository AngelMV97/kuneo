import EducationalText from './EducationalText';
import FeedbackDetails from './FeedbackDetails';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningApi, dimensionInfo } from '../utils/learningApi';

const results = { correct: 'Correcta', partial: 'Parcial', incorrect: 'Incorrecta', skipped: 'Omitida' };
const dateLabel = value => new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export function ActivityHistory({ subject, dimension, onSelect }) {
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const active = useRef(0);
  const busy = useRef(false);
  const load = useCallback(async (offset = 0, before) => {
    if (busy.current) return;
    busy.current = true;
    const version = active.current;
    setLoading(true); setError(null);
    try {
      const value = await learningApi.history({ subject, dimension, offset, before, limit: 15 });
      if (version !== active.current) return;
      setPage(previous => ({ ...value, items: offset ? [...(previous?.items || []), ...value.items.filter(item => !previous?.items.some(old => old.id === item.id))] : value.items }));
    } catch (err) { if (version === active.current) setError(err.message); }
    finally { if (version === active.current) { busy.current = false; setLoading(false); } }
  }, [subject, dimension]);
  useEffect(() => {
    active.current += 1;
    busy.current = false;
    setPage(null);
    load();
    return () => { active.current += 1; };
  }, [load]);
  return <div className="space-y-3">
    {page && <p className="text-sm text-gray-500">{page.items.length} de {page.total} intentos registrados</p>}
    {page?.items.map(activity => <button key={activity.id} type="button" onClick={() => onSelect(activity)} className="w-full text-left text-gray-900 dark:text-white bg-white dark:bg-[#1e2439] border border-gray-200 dark:border-[#343b54] rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-[#2a3149] focus-visible:ring-2 focus-visible:ring-purple-500">
      <span className="block text-xs text-purple-600 dark:text-purple-300">{activity.subject} · {dateLabel(activity.date)}</span>
      <span className="block font-semibold mt-1">{activity.title}</span>
      <span className="block text-sm text-gray-600 dark:text-gray-400 mt-1">{results[activity.result] || activity.result} · Ver intento →</span>
    </button>)}
    {page?.total === 0 && <p className="text-gray-500">Todavía no hay intentos registrados en esta sección.</p>}
    {error && <p role="alert" className="text-red-500">{error}</p>}
    {loading && <p role="status" className="text-gray-500">Cargando actividades…</p>}
    {!loading && ((page && page.nextOffset !== null) || error) && <button type="button" onClick={() => load(page?.nextOffset || 0, page?.before)} className="w-full py-3 rounded-xl bg-purple-600 text-white">
      {error ? 'Reintentar' : 'Cargar más actividades'}
    </button>}
    {page?.total > 0 && page.nextOffset === null && <p className="text-sm text-gray-500">Has visto todo el historial de esta consulta.</p>}
  </div>;
}

function AttemptDetail({ id, onNavigate }) {
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setAttempt(null); setError(null);
    learningApi.attempt(id).then(data => { if (active) setAttempt(data); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id, retry]);
  let answer = attempt?.questionType === 'option' && /^\d+$/.test(attempt.answer) ? attempt.options[Number(attempt.answer)] ?? attempt.answer : attempt?.answer;
  try {
    if (attempt?.questionType === 'multiple_select') answer = JSON.parse(attempt.answer).map(i => attempt.options[i] ?? i).join('\n');
    if (attempt?.questionType === 'matching') answer = JSON.parse(attempt.answer).map(([a, b]) => `${attempt.leftItems?.[a] ?? a} → ${attempt.rightItems?.[b] ?? b}`).join('\n');
    if (attempt?.questionType === 'ordering') answer = JSON.parse(attempt.answer).map((index,position) => `${position+1}. ${attempt.items?.[index] ?? index}`).join('\n');
  } catch { /* Keep historical text when no structured answer was stored. */ }
  return <section className="space-y-4">
    {error ? <p role="alert">{error} <button onClick={() => setRetry(value => value + 1)} className="underline">Reintentar</button></p> : !attempt ? <p role="status">Cargando intento…</p> : <>
      <p className="text-sm text-gray-500">{attempt.subject} · {dateLabel(attempt.date)}</p>
      <h3 className="font-bold text-lg">{attempt.moduleTitle}</h3>
      <EducationalText>{attempt.question || 'El enunciado original no quedó guardado en este intento antiguo.'}</EducationalText>
      {attempt.options.length > 0 && <ul className="list-disc pl-6">{attempt.options.map((option, index) => <li key={index}><EducationalText>{option}</EducationalText></li>)}</ul>}
      <div className="bg-gray-100 dark:bg-[#13172a] p-4 rounded-xl"><h4 className="font-semibold mb-2">Tu respuesta</h4><EducationalText>{answer || 'Sin respuesta guardada.'}</EducationalText></div>
      <p>{results[attempt.result] || attempt.result} · {dimensionInfo.find(d => d.id === attempt.dimension)?.name || attempt.dimension}</p>
      <p className="text-sm text-gray-500">{attempt.hints} pistas · {attempt.seconds} segundos registrados</p>
      <EducationalText>{attempt.feedback || 'Este intento antiguo no conserva retroalimentación detallada.'}</EducationalText><FeedbackDetails details={attempt.feedbackDetails} />
      <button type="button" onClick={() => onNavigate(`/module/${attempt.moduleId}`)} className="bg-purple-600 text-white rounded-xl p-3">Abrir módulo</button>
    </>}
  </section>;
}

export default function LearningDetails({ selection, onClose }) {
  const dialog = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const node = dialog.current;
    if (!selection || !node) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => { node.close(); document.body.style.overflow = previous; };
  }, [selection]);
  if (!selection) return null;
  const { kind } = selection;
  const go = path => { onClose(); navigate(path); };
  return <dialog ref={dialog} aria-labelledby="learning-detail-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, margin: 'auto', height: 'fit-content' }} className="w-[calc(100%_-_2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl p-0 bg-white dark:bg-[#1e2439] text-gray-900 dark:text-white backdrop:bg-black/60">
    <div className="p-6" onClick={event => event.stopPropagation()}>
      <header className="flex items-start justify-between gap-4 mb-5">
        <h2 id="learning-detail-title" className="font-bold text-xl">{kind === 'info' ? 'Cómo interpretar tus resultados' : 'Detalle del intento'}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg px-3 py-1 hover:bg-gray-100 dark:hover:bg-[#343b54]">✕</button>
      </header>
      {kind === 'info' ? <div className="space-y-3">
        <p>Cada habilidad usa hasta 20 intentos recientes. Un acierto vale 1, una respuesta parcial 0,4 y una incorrecta 0. Cada pista reduce el peso de un acierto en 0,15, con un mínimo de 0,5.</p>
        <p>El promedio solo incluye habilidades evaluadas. Una habilidad sin evidencia no cuenta como un cero. El desempeño por materia incluye todos sus intentos.</p>
        <p>Los objetivos se consolidan con dos aciertos consecutivos sin pistas. El módulo también requiere consolidar las cinco habilidades. Estos indicadores describen práctica registrada; no son un diagnóstico.</p>
      </div> : <AttemptDetail id={selection.item.id} onNavigate={go} />}
    </div>
  </dialog>;
}
