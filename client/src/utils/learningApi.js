import { readLearningStream } from './readLearningStream';
import { supabase } from '../supabaseClient';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export async function apiFetch(url, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Inicia sesión para continuar.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  return fetch(url, { ...options, headers });
}
async function request(path, body) {
  const response = await apiFetch(`${API_BASE}/api/learning${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'No se pudo completar la operación.'), { status: response.status });
  return result;
}
async function streamed(path, body, onProgress) {
  const response = await apiFetch(`${API_BASE}/api/learning${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, stream: true }) } : {});
  if (!response.ok || !response.headers.get('content-type')?.includes('application/x-ndjson')) {
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || 'No se pudo preparar el contenido.'), { status: response.status });
    return result;
  }
  return readLearningStream(response, onProgress);
}
export const learningApi = {
  overview: () => request('/me'),
  history: (filters = {}) => request(`/history?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null))}`),
  attempt: id => request(`/attempts/${encodeURIComponent(id)}`),
  moduleSummary: moduleId => request(`/modules/${encodeURIComponent(moduleId)}/summary`),
  activity: (moduleId, onProgress) => onProgress ? streamed(`/modules/${encodeURIComponent(moduleId)}/activity?stream=1`, null, onProgress) : request(`/modules/${encodeURIComponent(moduleId)}/activity`),
  resume: (moduleId, token) => request('/resume', { moduleId, token }),
  answer: body => request('/answers', body),
  hint: (token, level = 1, onProgress) => onProgress ? streamed('/hint', { token, level }, onProgress) : request('/hint', { token, level }),
  finishPractice: (moduleId, attemptIds) => request('/session-summary', { moduleId, attemptIds })
};
export const dimensionInfo = [
  { id: 'comprension', name: 'Comprensión', description: 'Entender, interpretar y explicar ideas.', color: 'purple', icon: 'brain' },
  { id: 'razonamiento', name: 'Razonamiento', description: 'Analizar, inferir y evaluar argumentos.', color: 'green', icon: 'check' },
  { id: 'representacion', name: 'Representación', description: 'Representar y conectar conceptos.', color: 'blue', icon: 'cube' },
  { id: 'transferencia', name: 'Transferencia', description: 'Aplicar estrategias para resolver retos.', color: 'orange', icon: 'transfer' },
  { id: 'metacognicion', name: 'Metacognición', description: 'Planificar, monitorear y reflexionar.', color: 'yellow', icon: 'lightbulb' }
];
export const scoreLevel = (score, count) => !count ? 'Sin evaluar' : score >= 80 ? 'Consolidando' : score >= 50 ? 'En desarrollo' : 'Necesita práctica';
export function cognitiveView(data) {
  const assessedDimensions = dimensionInfo.filter(d => data.dimensions[d.id]?.count).length;
  return { overallScore: data.overallScore, assessedDimensions, level: assessedDimensions ? `${assessedDimensions} de 5 habilidades evaluadas` : 'Sin evaluar',
    dimensions: dimensionInfo.map(d => ({ ...d, ...data.dimensions[d.id], level: scoreLevel(data.dimensions[d.id].score, data.dimensions[d.id].count) })) };
}
