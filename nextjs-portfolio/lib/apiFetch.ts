// Genere un identifiant de correlation. randomUUID n'est disponible qu'en contexte
// securise (HTTPS ou localhost) : on garde un repli pour le HTTP simple.
export function newCorrelationId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// fetch() qui transmet X-Correlation-ID a l'API.
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('X-Correlation-ID')) {
    headers.set('X-Correlation-ID', newCorrelationId());
  }
  // Contexte de trace W3C : l'identifiant de correlation sert d'identifiant de trace,
  // ce qui relie la requete du navigateur a la trace Tempo de l'API.
  if (!headers.has('traceparent')) {
    const traceId = headers.get('X-Correlation-ID')!.replace(/-/g, '').padEnd(32, '0').slice(0, 32);
    const spanId = newCorrelationId().replace(/-/g, '').slice(0, 16);
    headers.set('traceparent', `00-${traceId}-${spanId}-01`);
  }
  return fetch(input, { ...init, headers });
}
