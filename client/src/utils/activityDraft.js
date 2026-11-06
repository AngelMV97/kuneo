// A draft is scoped to the signed-in user and module. The server revalidates
// its encrypted activity token before resuming; storage is never grading truth.
export function responseDraft(activity, submitted = '', selection = []) {
  if (!['multiple_select', 'matching', 'ordering'].includes(activity?.type)) return { answer: typeof submitted === 'string' ? submitted.slice(0, 6000) : '', selection: [] };
  let items = selection;
  if (submitted) { try { items = JSON.parse(submitted); } catch { items = []; } }
  if (!Array.isArray(items)) items = [];
  const validIndex = (i, n) => Number.isInteger(i) && i >= 0 && i < n;
  if (activity.type === 'matching') {
    const n = activity.left_items?.length || 0;
    if (items.some(p => !Array.isArray(p) || p.length !== 2 || !validIndex(p[0], n) || !validIndex(p[1], activity.right_items?.length || 0)) || new Set(items.map(p => p[0])).size !== items.length || new Set(items.map(p => p[1])).size !== items.length) items = [];
  } else {
    const n = activity.type === 'ordering' ? activity.items?.length || 0 : activity.options?.length || 0;
    if (items.some(i => !validIndex(i, n)) || new Set(items).size !== items.length || (activity.type === 'ordering' && items.length !== n)) items = [];
  }
  return { answer: '', selection: items };
}
export function readActivityDraft(storage, key) {
  try {
    const saved = JSON.parse(storage.getItem(key));
    const value = saved?.value;
    if (typeof value?.token !== 'string' || value.token.length > 50000 || typeof value.activity?.id !== 'string' || typeof value.activity?.question !== 'string') return null;
    return { value, ...responseDraft(value.activity, saved.answer, saved.selection), startedAt: Number.isFinite(saved.startedAt) ? saved.startedAt : Date.now() };
  } catch { return null; }
}
export function writeActivityDraft(storage, key, value, answer, selection, startedAt) {
  try { if (key && value?.token && value.activity) storage.setItem(key, JSON.stringify({ value, ...responseDraft(value.activity, answer, selection), startedAt })); } catch { /* Storage is optional. */ }
}
