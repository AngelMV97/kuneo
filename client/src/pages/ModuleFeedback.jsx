import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { learningApi, cognitiveView } from '../utils/learningApi';

export default function ModuleFeedback() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    learningApi.moduleSummary(moduleId).then(value => { if (active) setData(value); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [moduleId]);
  return <main className="min-h-screen bg-gray-50 dark:bg-[#13172a] dark:text-white p-6">
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate('/catalog')} className="text-purple-500">Volver al catálogo</button>
      {error ? <p role="alert">{error}</p> : !data ? <p role="status">Cargando tu actividad…</p> : <>
        <h1 className="font-bold text-2xl">{data.title}</h1>
        <p>{data.hasActivity ? `${data.attempts} intentos registrados en este módulo.` : 'Todavía no has respondido actividades en este módulo.'}</p>
        {cognitiveView(data).dimensions.map(d => <section key={d.id} className="rounded-2xl bg-white dark:bg-[#1e2439] p-5">
          <h2 className="font-bold">{d.name}</h2>
          <p>{d.count ? `${d.score}% · ${d.level}` : 'Sin evaluar'}</p>
        </section>)}
        <button onClick={() => navigate(`/module/${moduleId}`)} className="bg-purple-600 text-white p-3 rounded-xl">Continuar practicando</button>
      </>}
    </div>
  </main>;
}
