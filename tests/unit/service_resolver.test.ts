import { describe, it, expect } from 'vitest';
import { defaultSlugFromKind, resolveDefaultsKeyFromKind, resolveServiceKind } from '@/lib/service-resolver';
import { SERVICE_KIND_DEFAULTS } from '@/lib/docker';

describe('service resolver', () => {
    it('resolves kind from explicit service_kind', () => {
        expect(resolveServiceKind({ service_kind: 'ai_router' })).toBe('ai_router');
        expect(resolveServiceKind({ service_kind: 'agent-zero' })).toBe('agent_zero');
    });

    it('infers kind from name/image when service_kind missing', () => {
        expect(resolveServiceKind({ name: 'AI Router Service', image: 'ai-router-service:latest' })).toBe('ai_router');
        expect(resolveServiceKind({ name: 'Agent Zero Swarm', image: 'flexia/agent-zero:latest' })).toBe('agent_zero');
        expect(resolveServiceKind({ name: 'OpenCode IDE', image: 'flexia/opencode:latest' })).toBe('opencode');
        expect(resolveServiceKind({ name: 'FlexIA Blockchain', type: 'infrastructure' })).toBe('blockchain');
    });

    it('maps kind to canonical defaults keys and slugs', () => {
        expect(resolveDefaultsKeyFromKind('ai_router')).toBe('AI Router Swarm');
        expect(defaultSlugFromKind('ai_router')).toBe('flexia-ai-router');
    });

    it('has defaults for core service kinds', () => {
        expect(SERVICE_KIND_DEFAULTS.ai_router?.image).toBeTruthy();
        expect(SERVICE_KIND_DEFAULTS.agent_zero?.image).toBeTruthy();
        expect(SERVICE_KIND_DEFAULTS.opencode?.image).toBeTruthy();
        expect(SERVICE_KIND_DEFAULTS.blockchain?.image).toBeTruthy();
    });
});
