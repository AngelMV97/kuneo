import EducationalText from './EducationalText';
export default function PracticeSummary({ summary, onContinue, onExit }) {
  return <section className="rounded-3xl bg-[#1e2439] p-5 sm:p-7 space-y-5" aria-labelledby="practice-summary-title">
    <h2 id="practice-summary-title" className="text-2xl font-bold">Resumen de tu práctica</h2>
    <EducationalText>{summary.overview}</EducationalText>
    {summary.strengths.length > 0 && <div><h3 className="font-semibold text-green-300 mb-2">Lo que hiciste bien</h3><ul className="list-disc pl-5 space-y-2">{summary.strengths.map(text => <li key={text}><EducationalText>{text}</EducationalText></li>)}</ul></div>}
    {summary.improvements.length > 0 && <div><h3 className="font-semibold text-amber-300 mb-2">Qué puedes reforzar</h3><ul className="list-disc pl-5 space-y-2">{summary.improvements.map(text => <li key={text}><EducationalText>{text}</EducationalText></li>)}</ul></div>}
    <div><h3 className="font-semibold text-purple-300 mb-2">Cómo seguir mejorando</h3><ul className="list-disc pl-5 space-y-2">{summary.nextSteps.map(text => <li key={text}><EducationalText>{text}</EducationalText></li>)}</ul></div>
<details className="rounded-xl bg-[#151b2d] p-4"><summary className="cursor-pointer text-gray-300">Ver detalles de la práctica</summary><div className="mt-4 space-y-3"><div className="grid grid-cols-3 gap-3 text-center">{[[summary.correct, 'Correctas'], [summary.partial, 'Parciales'], [summary.incorrect, 'Por revisar']].map(([number, label]) => <div key={label} className="rounded-xl bg-[#2a3149] p-3"><strong className="block text-2xl">{number}</strong><span className="text-sm">{label}</span></div>)}</div>
    <p className="text-sm text-gray-300">{Math.floor(summary.seconds / 60)} min {summary.seconds % 60} s registrados · {summary.hints} niveles de ayuda consultados</p></div></details>
    <p className="text-sm text-gray-400">{summary.notice}</p>
    <div className="flex flex-col sm:flex-row gap-3"><button type="button" onClick={onContinue} className="bg-purple-600 rounded-xl px-4 py-3">Comenzar otra práctica</button><button type="button" onClick={onExit} className="bg-[#2a3149] rounded-xl px-4 py-3">Volver a Explorar</button></div>
  </section>;
}
