import { expect } from 'vitest';
import { supabaseAdmin } from '../setup';

/**
 * Assert that a JSON response has the expected shape (keys exist)
 */
export function assertJsonShape(data: any, expectedKeys: string[]) {
    for (const key of expectedKeys) {
        expect(data, `Missing key '${key}' in response`).toHaveProperty(key);
    }
}

/**
 * Assert a record exists in the DB with expected values
 */
export async function assertDbRecord(
    table: string,
    filter: Record<string, any>,
    expected?: Record<string, any>
) {
    let query = supabaseAdmin.from(table).select('*');

    for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value);
    }

    const { data, error } = await query.maybeSingle();

    expect(error, `DB query error on ${table}: ${error?.message}`).toBeNull();
    expect(data, `No record found in ${table} matching ${JSON.stringify(filter)}`).not.toBeNull();

    if (expected && data) {
        for (const [key, value] of Object.entries(expected)) {
            expect(data[key], `${table}.${key}: expected ${value}, got ${data[key]}`).toEqual(value);
        }
    }

    return data;
}

/**
 * Assert a record does NOT exist in the DB
 */
export async function assertDbRecordNotExists(
    table: string,
    filter: Record<string, any>
) {
    let query = supabaseAdmin.from(table).select('id');

    for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value);
    }

    const { data } = await query.maybeSingle();
    expect(data, `Record unexpectedly exists in ${table}: ${JSON.stringify(filter)}`).toBeNull();
}

/**
 * Wait for a condition to be true (polling)
 */
export async function waitFor(
    check: () => Promise<boolean>,
    timeoutMs = 10000,
    intervalMs = 500,
    label = 'condition'
): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (await check()) return;
        await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error(`Timeout waiting for ${label} after ${timeoutMs}ms`);
}

/**
 * Parse JSON response body safely
 */
export async function parseJson(res: Response): Promise<any> {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Failed to parse JSON response (status ${res.status}): ${text.slice(0, 200)}`);
    }
}
