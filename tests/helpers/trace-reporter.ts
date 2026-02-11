import { ApiClient } from '../helpers/api-client';
import fs from 'fs';
import path from 'path';

/**
 * Export traces to a JSON file after a test run
 */
export function exportTraces(suiteName: string) {
    const traces = ApiClient.getTraces();
    const summary = ApiClient.getTraceSummary();

    const report = {
        suite: suiteName,
        timestamp: new Date().toISOString(),
        summary,
        traces,
    };

    const dir = path.resolve(process.cwd(), 'tests', 'traces');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `${suiteName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(report, null, 2));

    console.log(`\n📊 Trace Report: ${summary.total} requests, ${summary.passed} passed, ${summary.failed} failed, avg ${summary.avgDuration}ms`);
    console.log(`   Saved to: tests/traces/${filename}\n`);
}

/**
 * Print trace summary to console
 */
export function printTraceSummary() {
    const summary = ApiClient.getTraceSummary();
    const traces = ApiClient.getTraces();

    console.log('\n' + '═'.repeat(60));
    console.log('  📊 API Trace Summary');
    console.log('═'.repeat(60));
    console.log(`  Total Requests:  ${summary.total}`);
    console.log(`  Passed (2xx/3xx): ${summary.passed}`);
    console.log(`  Failed (4xx/5xx): ${summary.failed}`);
    console.log(`  Avg Duration:    ${summary.avgDuration}ms`);
    console.log('─'.repeat(60));

    // Show failed requests
    const failed = traces.filter(t => t.status >= 400 && t.status !== 401 && t.status !== 403);
    if (failed.length > 0) {
        console.log('  ❌ Unexpected Failures:');
        for (const t of failed) {
            console.log(`     ${t.method} ${t.url} → ${t.status} (${t.durationMs}ms)`);
        }
    }

    console.log('═'.repeat(60) + '\n');
}
