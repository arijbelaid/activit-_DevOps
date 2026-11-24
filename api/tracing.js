'use strict';

// Pas de tracing pendant les tests Jest ni si on le desactive explicitement.
const disabled =
  process.env.NODE_ENV === 'test' || process.env.OTEL_SDK_DISABLED === 'true';

if (disabled) {
  module.exports = {};
} else {
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
  const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

  // Collecteur configure (ex. Jaeger) : export OTLP/HTTP.
  // Sinon : les spans sont affiches dans les logs du conteneur (exporteur console).
  const useOtlp = Boolean(
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  );
  if (!useOtlp && !process.env.OTEL_TRACES_EXPORTER) {
    process.env.OTEL_TRACES_EXPORTER = 'console';
  }

  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'portfolio-api',
    traceExporter: useOtlp ? new OTLPTraceExporter() : undefined,
    instrumentations: [
      new HttpInstrumentation({
        // On ignore /metrics : Prometheus l'appelle toutes les quelques secondes.
        ignoreIncomingRequestHook: (req) => req.url === '/metrics',
      }),
      new ExpressInstrumentation(),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
  });

  module.exports = { sdk };
}
