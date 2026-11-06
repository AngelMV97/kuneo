import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { normalizeEducationalText } from '../utils/educationalText';
const components = {
  table: ({ children }) => <div className="overflow-x-auto my-4 max-w-full"><table className="w-full border-collapse text-sm text-left">{children}</table></div>,
  th: ({ children }) => <th scope="col" className="border border-gray-500 p-2 bg-purple-500/15">{children}</th>,
  td: ({ children }) => <td className="border border-gray-500 p-2 align-top">{children}</td>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
  p: ({ children }) => <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>,
  img: () => null
};
export default function EducationalText({ children, allowTables = true }) {
  return <ReactMarkdown skipHtml remarkPlugins={allowTables ? [remarkGfm, remarkMath] : [remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, trust: false }]]} components={components}>{normalizeEducationalText(children)}</ReactMarkdown>;
}
