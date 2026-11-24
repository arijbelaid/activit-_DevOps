export async function register() {
  // Le SDK OpenTelemetry n'est charge que cote serveur Node (pas en edge runtime).
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node');
  }
}
