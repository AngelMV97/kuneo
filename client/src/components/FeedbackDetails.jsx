import EducationalText from './EducationalText';
export default function FeedbackDetails({ details = [] }) {
  if (!details.length) return null;
  return <details className="group mt-4 rounded-xl border border-gray-500/30 p-4">
    <summary className="cursor-pointer flex items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden">
      <span className="font-semibold">Revisemos tu respuesta</span>
      <span className="text-sm text-purple-300 shrink-0"><span className="group-open:hidden">▼</span><span className="hidden group-open:inline">▲</span></span>
    </summary>
    <div className="mt-4 space-y-3">{details.map((item, i) => <section key={i} className={`rounded-xl p-4 border ${item.correct ? 'border-green-500/40' : 'border-amber-400/50'} space-y-2`}>
    <div className="font-semibold"><EducationalText>{item.label}</EducationalText></div>
    <div className="text-sm"><span className="text-gray-300">Tu respuesta: </span><EducationalText>{item.selected}</EducationalText></div>
    <div className="text-sm"><span className="text-purple-300">Relación esperada: </span><EducationalText>{item.expected}</EducationalText></div>
    {item.explanation && <EducationalText>{item.explanation}</EducationalText>}
  </section>)}</div></details>;
}
