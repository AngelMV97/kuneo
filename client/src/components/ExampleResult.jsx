import EducationalText from './EducationalText';
export default function ExampleResult({ text, hasVisual }) {
  // Also protect help already loaded by an older server before validation.
  const hasEmbeddedVisual = /(?:\|\s*:?-{3,}:?\s*\||<\s*\/?\s*(?:table|svg|img|canvas)\b|!\[[^\]]*\]\(|```)/i.test(text || '');
  return <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
    <h4 className="font-semibold mb-1">Resultado del ejemplo</h4>
    <div className="break-words"><EducationalText allowTables={false}>{hasEmbeddedVisual
      ? hasVisual ? 'Consulta la representación del resultado en el bloque visual inferior.' : 'Este resultado tiene un formato incompatible. Solicita una nueva ayuda al volver a abrir la actividad.'
      : text}</EducationalText></div>
  </div>;
}
