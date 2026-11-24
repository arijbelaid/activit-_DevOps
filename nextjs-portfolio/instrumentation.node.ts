import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Collecteur configure (ex. Jaeger) : export OTLP/HTTP.
// Sinon : les spans sont affiches dans les logs du conteneur (exporteur console).
const useOtlp = Boolean(
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
);
if (!useOtlp && !process.env.OTEL_TRACES_EXPORTER) {
  process.env.OTEL_TRACES_EXPORTER = 'console';
}

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME || 'portfolio-frontend',
  traceExporter: useOtlp ? new OTLPTraceExporter() : undefined,
});

sdk.start();
