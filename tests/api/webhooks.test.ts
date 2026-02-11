import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestSeeder } from '../factories';
import { exportTraces } from '../helpers/trace-reporter';
import { BASE_URL, supabaseAdmin } from '../setup';
import crypto from 'crypto';

describe('Webhooks API', () => {
    beforeAll(async () => {
        await TestSeeder.seedAll();
    });

    afterAll(() => {
        exportTraces('webhooks');
    });

    // ─── POST /api/webhooks/stripe ──────────────────────────
    describe('POST /api/webhooks/stripe', () => {
        it('should reject request without stripe-signature', async () => {
            const res = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'test', data: {} }),
            });

            expect(res.status).toBe(400);
        });

        it('should reject request with invalid signature', async () => {
            const payload = JSON.stringify({
                id: 'evt_test_123',
                type: 'checkout.session.completed',
                data: { object: {} },
            });

            const res = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': 't=1234567890,v1=invalid_signature',
                },
                body: payload,
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toContain('Webhook Error');
        });

        it('should verify stripe-signature is required for security', async () => {
            // This test validates that the Stripe webhook endpoint
            // properly verifies signatures and doesn't process unsigned events
            const payloads = [
                { type: 'checkout.session.completed', data: { object: { metadata: { userId: 'test' } } } },
                { type: 'customer.subscription.updated', data: { object: { customer: 'cus_test' } } },
                { type: 'invoice.payment_succeeded', data: { object: { customer: 'cus_test' } } },
            ];

            for (const payload of payloads) {
                const res = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${crypto.randomBytes(32).toString('hex')}`,
                    },
                    body: JSON.stringify(payload),
                });

                // Should always reject invalid signatures
                expect(res.status, `Event type ${payload.type} should reject invalid signature`).toBe(400);
            }
        });
    });
});
