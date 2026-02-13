import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

export function initTracing(serviceName: string) {
    if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
        console.log('[Observability] Tracing disabled (no endpoint configured)');
        return;
    }

    try {
        const sdk = new NodeSDK({
            resource: resourceFromAttributes({
                [ATTR_SERVICE_NAME]: serviceName,
            }),
            spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
        });

        sdk.start();
        console.log(`[Observability] OpenTelemetry started for ${serviceName}`);

        // Gracefully shut down the SDK on process exit
        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => console.log('[Observability] Tracing terminated'))
                .catch((error) => console.log('[Observability] Error terminating tracing', error))
                .finally(() => process.exit(0));
        });

    } catch (err: any) {
        console.warn('[Observability] Failed to start OpenTelemetry:', err.message);
    }
}
