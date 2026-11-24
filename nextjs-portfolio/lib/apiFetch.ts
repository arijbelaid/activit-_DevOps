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
  return fetch(input, { ...init, headers });
}
