import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Markdown from '../components/EducationalText';
import FeedbackDetails from '../components/FeedbackDetails';
import 'katex/dist/katex.min.css';
import { supabase } from '../supabaseClient';
import { modules } from '../utils/kuneoApi';
import { learningApi, dimensionInfo } from '../utils/learningApi';
import { readActivityDraft, writeActivityDraft, responseDraft } from '../utils/activityDraft';
import { ArrowLeftIcon, LightBulbIcon } from '../components/icons/MinimalIcons';
import MultipleSelectQuestion from '../components/QuestionTypes/MultipleSelectQuestion';
import MatchingQuestion from '../components/QuestionTypes/MatchingQuestion';
import OrderingQuestion from '../components/QuestionTypes/OrderingQuestion';
import ConceptCard from '../components/ConceptCard';
import ActivitySupportVisual from '../components/ActivitySupportVisual';
import ActivitySupportDialog from '../components/ActivitySupportDialog';
import ExampleResult from '../components/ExampleResult';
import PracticeSummary from '../components/PracticeSummary';
const PRACTICE_LENGTH = 8;
const readPractice = key => {
  try { const value = JSON.parse(sessionStorage.getItem(key)); return Array.isArray(value?.attemptIds) && value.attemptIds.every(id => typeof id === 'string') && value.attemptIds.length <= 100 ? value : { attemptIds: [] }; } catch { return { attemptIds: [] }; }
};

export default function LearningModule() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintError, setHintError] = useState(null);
  const [requestedHintLevel, setRequestedHintLevel] = useState(1);
  const [complete, setComplete] = useState(false);
  const [blockedActivity, setBlockedActivity] = useState(false);
  const [errorAction, setErrorAction] = useState(null);
  const [resumeVersion, setResumeVersion] = useState(0);
  const [hintDraft, setHintDraft] = useState(null);
  const [practice, setPractice] = useState({ attemptIds: [] });
  const [practiceResult, setPracticeResult] = useState(null);
  const [preparingSummary, setPreparingSummary] = useState(false);
  const practiceKey = useRef(null);
  const identity = useRef(null);
  const owner = useRef(null);
  const preparing = useRef(false);
  const started = useRef(Date.now());
  const mounted = useRef(false);
  const requestId = useRef(0);
  const busyRef = useRef(false);

  const invalidateRequests = useCallback(() => { requestId.current += 1; }, []);
  const nextActivity = useCallback(async () => {
    if (preparing.current || busyRef.current) return;
    preparing.current = true;
    const id = ++requestId.current;
    setLoading(true);
    setActivityData(null); setFeedback(null); setHint(null); setBlockedActivity(false);
    setAnswer(''); setSelection([]);
    try { sessionStorage.removeItem(identity.current); } catch { /* optional */ }
    setHintOpen(false);
    setError(null);
    try {
      const value = await learningApi.activity(moduleId, () => {});
      if (!mounted.current || id !== requestId.current) return;
      setActivityData(value);
      setComplete(value.complete);
      setFeedback(null);
      setHint(null);
      setHintOpen(false);
      setAnswer('');
      setSelection([]);
      started.current = Date.now();

    } catch (err) { if (mounted.current && id === requestId.current) { setError(err.message); setErrorAction('prepare'); } }
    finally { if (mounted.current && id === requestId.current) { preparing.current = false; setLoading(false); } }
  }, [moduleId]);

  useEffect(() => {
    mounted.current = true;
    const id = ++requestId.current;
    setLoading(true);
    preparing.current = true;
    setComplete(false); setBlockedActivity(false); setErrorAction(null); setPreparingSummary(false);
    setActivityData(null); setModule(null); setFeedback(null); setHint(null); setHintError(null); setHintDraft(null);
    setHintOpen(false);
    setError(null); setAnswer(''); setSelection([]);
    busyRef.current = false; setBusy(false);
    async function initialize() {
      let cached, recoveringSummary = false;
      try {
        const { data, error: authError } = await supabase.auth.getSession();
        if (!mounted.current || id !== requestId.current) return;
        if (authError || !data.session?.user) { navigate('/login'); return; }
        owner.current = data.session.user.id;
        identity.current = `kuneo_activity:${data.session.user.id}:${moduleId}`;
        practiceKey.current = `kuneo_practice:${data.session.user.id}:${moduleId}`;
        const savedPractice = readPractice(practiceKey.current);
        setPractice(savedPractice); setPracticeResult(null);
        if (savedPractice.finished || savedPractice.attemptIds.length >= PRACTICE_LENGTH) {
          recoveringSummary = true; setPreparingSummary(true);
          const [details, summary] = await Promise.all([modules.getModule(moduleId), learningApi.finishPractice(moduleId, savedPractice.attemptIds)]);
          if (!mounted.current || id !== requestId.current) return;
          setModule(details); setPracticeResult(summary); setLoading(false); return;
        }
        try { cached = readActivityDraft(sessionStorage, identity.current); } catch { /* Storage may be disabled. */ }
        // Resume through the server; it verifies ownership, expiry and whether
        // a submission succeeded even when its response never reached us.
        const [details, value] = await Promise.all([modules.getModule(moduleId), cached ? learningApi.resume(moduleId, cached.value.token) : learningApi.activity(moduleId, () => {})]);
        if (!mounted.current || id !== requestId.current) return;
        setModule(details);
        setActivityData(value); setComplete(value.complete);
        const draft = value.feedback?.submittedAnswer !== undefined ? responseDraft(value.activity, value.feedback.submittedAnswer) : cached || { answer: '', selection: [] };
        setAnswer(draft.answer); setSelection(draft.selection); setFeedback(value.feedback || null); setHint(null); setHintOpen(false);
        if (value.feedback?.attemptId) {
          const recovered = { attemptIds: [...new Set([...savedPractice.attemptIds, value.feedback.attemptId])] };
          setPractice(recovered);
          try { sessionStorage.setItem(practiceKey.current, JSON.stringify(recovered)); sessionStorage.removeItem(identity.current); } catch { /* optional */ }
        }
        started.current = cached?.startedAt || Date.now(); setLoading(false);
  
      } catch (err) {
        if (mounted.current && id === requestId.current) {
          setError(err.message); setLoading(false);
          if (cached) {
            setActivityData(cached.value); setAnswer(cached.answer); setSelection(cached.selection); started.current = cached.startedAt;
            setBlockedActivity(true); setErrorAction([403, 409, 410].includes(err.status) ? 'expired' : 'resume');
          } else setErrorAction(recoveringSummary ? 'summary' : 'prepare');
        }
      }
      finally { if (mounted.current && id === requestId.current) { preparing.current = false; setPreparingSummary(false); } }
    }
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (owner.current && session?.user?.id !== owner.current) {
        invalidateRequests(); owner.current = null; identity.current = null; practiceKey.current = null; preparing.current = false; busyRef.current = false;
        setActivityData(null); setAnswer(''); setSelection([]); setFeedback(null); setHint(null); setHintDraft(null); setHintOpen(false);
        setPractice({ attemptIds: [] }); setPracticeResult(null); setPreparingSummary(false); setModule(null); setError(null); setLoading(true);
        navigate('/login', { replace: true });
      }
    });
    initialize();
    return () => { mounted.current = false; invalidateRequests(); authListener.subscription.unsubscribe(); };
  }, [moduleId, navigate, nextActivity, invalidateRequests, resumeVersion]); // There is no test-user fallback.

  useEffect(() => {
    try { if (activityData?.token && !feedback && identity.current && owner.current) writeActivityDraft(sessionStorage, identity.current, activityData, answer, selection, started.current); } catch { /* Storage may be disabled. */ }
  }, [activityData, answer, selection, feedback]);

  async function submit(event) {
    event?.preventDefault();
    if (busyRef.current || feedback || blockedActivity || !activityData?.token) return;
    const type = activityData.activity.type;
    const response = ['multiple_select', 'matching', 'ordering'].includes(type) ? JSON.stringify(selection) : answer;
    if (!response.trim() || (['multiple_select', 'matching', 'ordering'].includes(type) && !selection.length) || (type === 'matching' && selection.length !== activityData.activity.left_items.length)) return;
    busyRef.current = true; setBusy(true); setError(null);
    const epoch = requestId.current;
    try {
      const result = await learningApi.answer({ token: activityData.token, answer: response, time_on_task: Math.round((Date.now() - started.current) / 1000), finish_session: practice.attemptIds.length + 1 >= PRACTICE_LENGTH });
      if (!mounted.current || epoch !== requestId.current) return;
      setFeedback(result); setErrorAction(null);
      if (result.submittedAnswer !== undefined) { const draft = responseDraft(activityData.activity, result.submittedAnswer); setAnswer(draft.answer); setSelection(draft.selection); }
      setComplete(result.complete);
      if (result.attemptId) {
        const updatedPractice = { attemptIds: [...new Set([...practice.attemptIds, result.attemptId])] };
        setPractice(updatedPractice);
        try { sessionStorage.setItem(practiceKey.current, JSON.stringify(updatedPractice)); } catch { /* optional */ }
      }
      try { sessionStorage.removeItem(identity.current); } catch { /* optional */ }
    } catch (err) {
      if (mounted.current && epoch === requestId.current) {
        setError(err.message);
        setErrorAction('submit');
        if ([403, 409, 410].includes(err.status)) { setBlockedActivity(true); setErrorAction('expired'); }
      }
    }
    finally { if (epoch === requestId.current) { busyRef.current = false; if (mounted.current) setBusy(false); } }
  }

  async function showHint(level = 1) {
    if (busyRef.current || !activityData?.token || feedback || blockedActivity) return;
    busyRef.current = true; setBusy(true); setHintError(null);
    setRequestedHintLevel(level); setHintOpen(true);
    setHintDraft(null);
    const epoch = requestId.current;
    try {
      const result = await learningApi.hint(activityData.token, level, draft => { if (mounted.current && epoch === requestId.current) setHintDraft(draft.reset ? null : draft); });
      if (!mounted.current || epoch !== requestId.current) return;
      const updated = { ...activityData, token: result.token };
      setActivityData(updated); setHint(result);
      setHintDraft(null);
    } catch (err) { if (mounted.current && epoch === requestId.current) setHintError(err.message); }
    finally { if (epoch === requestId.current) { busyRef.current = false; if (mounted.current) setBusy(false); } }
  }

  async function finishPractice() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setPreparingSummary(true); setError(null); setHintOpen(false);
    const epoch = requestId.current;
    try {
      const summary = await learningApi.finishPractice(moduleId, practice.attemptIds);
      if (mounted.current && epoch === requestId.current) {
        setPracticeResult(summary);
        const finished = { ...practice, finished: true }; setPractice(finished);
        try { sessionStorage.setItem(practiceKey.current, JSON.stringify(finished)); } catch { /* optional */ }
      }
    } catch (err) { if (mounted.current && epoch === requestId.current) { setError(err.message); setErrorAction('summary'); } }
    finally { if (epoch === requestId.current) { busyRef.current = false; if (mounted.current) { setBusy(false); setPreparingSummary(false); } } }
  }
  function restartPractice() {
    const empty = { attemptIds: [] }; setPractice(empty); setPracticeResult(null);
    try { sessionStorage.setItem(practiceKey.current, JSON.stringify(empty)); } catch { /* optional */ }
    nextActivity();
  }

  const activity = activityData?.activity;
  const dimension = dimensionInfo.find(d => d.id === activity?.cognitive_dimension)?.name;
  const formatLabel = { option: 'Selección única', text: 'Respuesta abierta', multiple_select: 'Selección múltiple', matching: 'Relacionar columnas', ordering: 'Ordenar elementos', numeric: 'Respuesta numérica' }[activity?.type];
  return <main className="min-h-screen bg-[#13172a] text-white px-4 py-6">
    <div className="max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/catalog')} aria-label="Volver al catálogo" className="p-2"><ArrowLeftIcon /></button>
        <div className="flex-1 px-3"><h1 className="text-lg font-bold">{module?.title || 'Aprender con Tuko'}</h1>{!practiceResult && <p className="text-xs text-gray-400 mt-1">{practice.attemptIds.length} de {PRACTICE_LENGTH} actividades respondidas</p>}</div>
        {!practiceResult && <button type="button" onClick={finishPractice} disabled={busy || loading} className="text-sm underline disabled:opacity-40 mr-2">Finalizar práctica</button>}
        <button onClick={() => hint ? setHintOpen(value => !value) : showHint(1)} disabled={busy || loading || !!feedback || complete || blockedActivity} aria-label={hintOpen ? 'Cerrar ayuda' : 'Pedir una pista'} aria-expanded={hintOpen} aria-controls="activity-support" className="p-2 text-yellow-400 disabled:opacity-40"><LightBulbIcon /></button>
      </header>
      <img src="/image/characters/tuko-home.png" alt="Tuko" className="w-32 h-32 object-contain mx-auto mb-4" />
      {error && <div role="alert" className="bg-red-900/30 border border-red-400 rounded-xl p-4 mb-4">
        {error} <button type="button" disabled={busy || loading} onClick={() => {
          if (errorAction === 'resume') { setResumeVersion(value => value + 1); return; }
          if (errorAction === 'summary') { finishPractice(); return; }
          if (errorAction === 'prepare' || errorAction === 'expired') { nextActivity(); return; }
          setError(null); setErrorAction(null);
        }} className="underline ml-2">{errorAction === 'summary' ? 'Reintentar resumen' : errorAction === 'expired' ? 'Preparar otra actividad' : ['resume', 'prepare'].includes(errorAction) ? 'Reintentar' : 'Cerrar'}</button>
        {blockedActivity && <p className="text-sm mt-2">Tu respuesta sigue aquí. {errorAction === 'expired' ? 'Cópiala antes de preparar otra actividad.' : 'Reintenta para retomar la misma actividad.'}</p>}
      </div>}
      {preparingSummary ? <section className="bg-[#1e2439] rounded-3xl p-6" aria-busy="true"><p role="status" className="text-purple-300">Preparando el resumen de tu práctica…</p></section> : practiceResult ? <PracticeSummary summary={practiceResult} onContinue={restartPractice} onExit={() => navigate('/catalog')} /> : loading ? <section className="bg-[#1e2439] rounded-3xl p-6"><p role="status" className="text-sm text-purple-300">Preparando tu próxima actividad…</p></section> : complete ? <section className="bg-[#1e2439] rounded-3xl p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">¡Objetivos del módulo consolidados!</h2>
        {feedback && <div className="mb-4"><Markdown>{feedback.feedback}</Markdown></div>}
        <p className="mb-4">Lograste dos aciertos consecutivos sin pistas por objetivo y por cada una de las cinco habilidades.</p>
        <button type="button" onClick={finishPractice} disabled={busy} className="bg-purple-600 p-3 rounded-xl mr-2">Ver resumen de la práctica</button>
        <button onClick={() => navigate('/catalog')} className="bg-purple-600 p-3 rounded-xl">Explorar otro módulo</button>
      </section> : activity && <>
        <div className="text-sm text-purple-300 mb-3">{dimension} · {formatLabel} · {activity.source === 'stored' ? 'Contenido de reserva' : 'Actividad personalizada'}</div>
        {activity.notice && <p role="status" className="text-amber-300 mb-3 text-sm">{activity.notice}</p>}
        <div className="bg-[#1e2439] rounded-3xl p-6" key={activity.id}>
          <div className="text-xl mb-6 leading-relaxed"><Markdown>{activity.question}</Markdown></div>
          {activity.type === 'option' ? <div className="space-y-3 mb-4">{activity.options.map((option, index) => <button key={index} type="button" aria-pressed={answer === String(index)} disabled={busy || !!feedback || blockedActivity} onClick={() => setAnswer(String(index))}
            className={`w-full text-left p-4 rounded-xl ${answer === String(index) ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-[#2a3149]'}`}><Markdown>{option}</Markdown></button>)}</div>
            : activity.type === 'multiple_select' ? <MultipleSelectQuestion key={feedback?.attemptId || activity.id} initialAnswer={selection} options={activity.options} onAnswerChange={setSelection} disabled={busy || !!feedback || blockedActivity} />
            : activity.type === 'matching' ? <MatchingQuestion key={feedback?.attemptId || activity.id} initialAnswer={selection} leftItems={activity.left_items} rightItems={activity.right_items} onAnswerChange={setSelection} disabled={busy || !!feedback || blockedActivity} />
            : activity.type === 'ordering' ? <OrderingQuestion key={feedback?.attemptId || activity.id} initialAnswer={selection} items={activity.items} onAnswerChange={setSelection} disabled={busy || !!feedback || blockedActivity} />
            : <textarea aria-label="Tu respuesta" value={answer} onChange={e => setAnswer(e.target.value)} readOnly={busy || !!feedback || blockedActivity} maxLength={6000} rows={5} placeholder="Explica lo que piensas…" className="w-full bg-[#2a3149] rounded-xl p-4 mb-4" />}
          {!feedback && !blockedActivity && <button type="button" onClick={submit} disabled={busy || (!answer.trim() && !selection.length) || (activity.type === 'matching' && selection.length !== activity.left_items.length)} className="w-full bg-orange-500 rounded-xl p-4 font-bold disabled:opacity-40">{busy ? 'Un momento…' : errorAction === 'submit' ? 'Reintentar respuesta' : 'Enviar respuesta'}</button>}
        </div>
        <ActivitySupportDialog open={hintOpen && !loading && !feedback} onClose={() => setHintOpen(false)}>
          <div className="flex flex-wrap gap-2 mb-4" aria-label="Niveles de ayuda">{['Pista', 'Tarjeta conceptual', 'Ejemplo distinto'].map((label, i) => <button key={label} type="button" disabled={busy || !!feedback || i + 1 > (hint?.hints_used || 0) + 1} aria-pressed={hint?.level === i + 1} onClick={() => showHint(i + 1)} className={`rounded-lg px-3 py-2 text-sm disabled:opacity-40 ${hint?.level === i + 1 ? 'bg-purple-600' : 'bg-[#2a3149]'}`}>{label}</button>)}</div>
          {hintError && <div role="alert" className="bg-red-900/30 border border-red-400 rounded-xl p-4 mb-4">{hintError}<button type="button" disabled={busy} onClick={() => showHint(requestedHintLevel)} className="underline ml-2">Reintentar ayuda</button></div>}
          {busy && <p role="status" className="text-sm text-purple-300 mb-4">Preparando la ayuda…</p>}
          {busy && hintDraft?.body ? <ConceptCard key={`draft:${requestedHintLevel}`} title={hintDraft.title || 'Una idea para empezar'} content={<><Markdown>{hintDraft.body}</Markdown><p role="status" className="mt-3 text-sm text-purple-300">{requestedHintLevel === 3 ? 'Comprobando el ejemplo, los pasos y el resultado…' : 'Completando la tarjeta…'}</p></>} initiallyExpanded /> : hint?.level === 1 ? <ConceptCard key={`${activity.id}:1`} title="Piensa en el primer paso" content={hint.hint} type="reflection" initiallyExpanded />
            : hint?.card && <ConceptCard key={`${activity.id}:${hint.level}`} title={hint.level === 3 ? `Ejemplo distinto: ${hint.card.title}` : hint.card.title} content={<Markdown>{hint.card.body}</Markdown>} insight={hint.card.insight} type={hint.level === 3 ? 'example' : 'concept'} visual={<>
              {hint.card.example_problem && <section className="text-gray-900 dark:text-gray-100 mb-4 space-y-3"><h3 className="font-semibold">Probemos con otro caso</h3><Markdown>{hint.card.example_problem}</Markdown><ol className="list-decimal pl-5 space-y-2">{hint.card.example_steps.map((step, i) => <li key={i}><Markdown>{step}</Markdown></li>)}</ol><ExampleResult text={hint.card.example_result} hasVisual={hint.card.visual?.kind !== 'none'} /></section>}
              <ActivitySupportVisual visual={hint.card.visual} />
            </>} initiallyExpanded />}
        </ActivitySupportDialog>
        {feedback && <section aria-live="polite" className="bg-[#1e2439] rounded-xl p-5 mt-4">
          <h2 className="font-bold mb-2">{feedback.result === 'correct' ? '¡Buen trabajo!' : feedback.result === 'partial' ? 'Vas por buen camino' : 'Sigamos practicando'}</h2>
          <Markdown>{feedback.feedback}</Markdown>
          <FeedbackDetails details={feedback.feedbackDetails} />
          {feedback.syncPending && <p className="text-amber-300 text-sm mt-2">Tu intento quedó guardado. Hay una actualización de progreso pendiente.</p>}
          <button onClick={practice.attemptIds.length >= PRACTICE_LENGTH ? finishPractice : nextActivity} disabled={busy} className="mt-4 w-full bg-purple-600 rounded-xl p-3">{practice.attemptIds.length >= PRACTICE_LENGTH ? 'Ver resumen de la práctica' : 'Continuar con otra actividad'}</button>
          {practice.attemptIds.length < PRACTICE_LENGTH && <button type="button" onClick={finishPractice} disabled={busy} className="mt-3 w-full underline text-sm">Finalizar ahora y ver mi resumen</button>}
        </section>}
      </>}
    </div>
  </main>;
}
