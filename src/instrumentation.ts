export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Dynamic import to avoid bundling issues in edge runtime (if any)
        try {
            const { initTracing } = await import('@/lib/tracing');
            initTracing('flexia-control-center');
        } catch (err: any) {
            console.warn('[Observability] Failed to register tracing:', err.message);
        }
    }
}
