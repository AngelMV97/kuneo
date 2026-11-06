// Browser fixture: no OpenAI, Supabase, real users or authentication dialogs.
const pause = () => new Promise(resolve => setTimeout(resolve, 40));
const fixture = globalThis.hito4Fixture = {
  user: 'synthetic-user', listeners: new Set(), type: 'text', failure: 'before', calls: 0, generations: 0, saved: null, pending: null,
  reset(type, failure = 'before') { this.type = type; this.failure = failure; this.calls = 0; this.generations = 0; this.saved = null; this.pending = null; this.user = 'synthetic-user'; sessionStorage.clear(); },
  changeUser(user) { this.user = user; for (const callback of this.listeners) callback('SIGNED_OUT', user ? { user: { id: user } } : null); }
};
export const supabase = { auth: {
  async getSession() { await pause(); return { data: { session: fixture.user ? { user: { id: fixture.user } } : null } }; },
  onAuthStateChange(callback) { fixture.listeners.add(callback); return { data: { subscription: { unsubscribe() { fixture.listeners.delete(callback); } } } }; }
} };
export const modules = { async getModule() { await pause(); return { title: 'Biblioteca escolar · prueba local' }; } };
export const dimensionInfo = [{ id: 'comprension', name: 'Comprensión' }];
export const learningApi = {
  async activity(moduleId, onProgress) {
    // An older server might still emit previews: the new page ignores them too.
    onProgress?.({ question: 'BORRADOR_NO_APROBADO' }); await pause();
    onProgress?.({ reset: true, question: 'OTRO_BORRADOR_NO_APROBADO' }); await pause();
    if (!fixture.pending || fixture.saved) {
      fixture.generations++; fixture.saved = null;
      fixture.pending = { token: `synthetic-token-${fixture.generations}`, complete: false, activity: {
        id: `synthetic-activity-${fixture.generations}`, step_id: 'objective', type: fixture.type, source: 'generated', cognitive_dimension: 'comprension',
        question: 'En la biblioteca del colegio juntan 3 libros de una caja y 5 de otra. ¿Cuántos libros reúnen? Explica o selecciona tu respuesta.',
        options: ['8 libros', '6 libros', '5 libros'], left_items: ['3 + 5', '2 + 4'], right_items: ['6 libros', '8 libros'], items: ['Primero', 'Después']
      } };
    }
    return structuredClone(fixture.pending);
  },
  async answer({ answer }) {
    fixture.calls++; await pause();
    if (fixture.failure === 'expired') throw Object.assign(Error('La actividad caducó.'), { status: 410 });
    if (fixture.failure === 'before' && fixture.calls === 1) throw Object.assign(Error('Fallo simulado al guardar. Tu actividad sigue disponible.'), { status: 503 });
    fixture.saved ||= { success: true, attemptId: 'synthetic-attempt', result: 'correct', feedback: 'Explicaste cómo reuniste los libros.', feedbackDetails: [], submittedAnswer: answer, complete: false };
    if (fixture.failure === 'lost' && fixture.calls === 1) throw Object.assign(Error('Se perdió la confirmación.'), { status: 503 });
    return structuredClone(fixture.saved);
  },
  async resume() { await pause(); return { ...structuredClone(fixture.pending), feedback: structuredClone(fixture.saved) }; },
  async finishPractice() {
    fixture.summaryCalls = (fixture.summaryCalls || 0) + 1;
    await new Promise(resolve => setTimeout(resolve, 250));
    if (fixture.summaryFailure) { fixture.summaryFailure = false; throw Error('Fallo simulado preparando el resumen.'); }
    return { overview: 'Resumen simulado.', strengths: [], improvements: [], nextSteps: [], seconds: 0, hints: 0, correct: 0, partial: 0, incorrect: 0 };
  }
};
