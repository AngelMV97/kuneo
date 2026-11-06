export async function readLearningStream(response, onProgress) {
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let pending = '', completed, streamError;
  const consume = line => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === 'done') completed = event.data;
    else if (event.type === 'error') streamError = Object.assign(new Error(event.data.error), { status: event.data.status });
    else if (event.type === 'preview') onProgress?.(event.data);
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (pending.length > 300000) throw new Error('El contenido recibido supera el límite permitido.');
      let newline;
      while ((newline = pending.indexOf('\n')) >= 0) { consume(pending.slice(0, newline)); pending = pending.slice(newline + 1); }
      if (done) break;
    }
    if (pending.trim()) consume(pending);
    if (streamError) throw streamError;
    if (!completed) throw Object.assign(new Error('La conexión se interrumpió. Vuelve a cargar la actividad.'), { status: 503 });
    return completed;
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
