import EducationalText from './EducationalText';
// Small data-only diagrams for live help. No model HTML, scripts or remote SVG.
export default function ActivitySupportVisual({ visual }) {
  if (!visual || visual.kind === 'none') return null;
  return <figure className="text-gray-900 dark:text-gray-100">
    {visual.kind === 'table' && <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
      <thead><tr>{visual.headers.map((header, i) => <th key={i} scope="col" className="text-left border border-gray-400 dark:border-gray-600 p-2 bg-purple-100 dark:bg-purple-900/40"><EducationalText allowTables={false}>{header}</EducationalText></th>)}</tr></thead>
      <tbody>{visual.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-gray-400 dark:border-gray-600 p-2"><EducationalText allowTables={false}>{cell}</EducationalText></td>)}</tr>)}</tbody>
    </table></div>}
    {visual.kind === 'sequence' && <ol className="space-y-3">{visual.steps.map((step, i) => <li key={i} className="flex items-start gap-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3"><span aria-hidden="true" className="rounded-full bg-purple-600 text-white px-2 shrink-0">{i + 1}</span><div><EducationalText allowTables={false}>{step}</EducationalText></div></li>)}</ol>}
    {visual.caption && <figcaption className="mt-3 text-sm text-gray-600 dark:text-gray-300"><EducationalText allowTables={false}>{visual.caption}</EducationalText></figcaption>}
  </figure>;
}
