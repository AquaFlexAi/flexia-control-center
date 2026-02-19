export type ServiceKind = 'ai_router' | 'agent_zero' | 'opencode' | 'blockchain' | 'custom';

export function normalizeServiceKind(kind?: string | null): ServiceKind | null {
    if (!kind) return null;
    const k = kind.trim().toLowerCase();
    if (k === 'ai_router' || k === 'ai-router' || k === 'router') return 'ai_router';
    if (k === 'agent_zero' || k === 'agent-zero' || k === 'agent') return 'agent_zero';
    if (k === 'opencode' || k === 'opencode_ide' || k === 'ide') return 'opencode';
    if (k === 'blockchain' || k === 'flexia_blockchain') return 'blockchain';
    if (k === 'custom') return 'custom';
    return null;
}

export function inferServiceKind(input: { name?: string | null; type?: string | null; image?: string | null }): ServiceKind {
    const name = (input.name || '').toLowerCase();
    const type = (input.type || '').toLowerCase();
    const image = (input.image || '').toLowerCase();

    if (name.includes('router') || image.includes('ai-router-service')) return 'ai_router';
    if (name.includes('agent zero') || image.includes('agent-zero')) return 'agent_zero';
    if (name.includes('opencode') || image.includes('opencode')) return 'opencode';
    if (name.includes('blockchain') || image.includes('blockchain') || type === 'infrastructure') return 'blockchain';
    return 'custom';
}

export function resolveServiceKind(input: { service_kind?: string | null; name?: string | null; type?: string | null; image?: string | null }): ServiceKind {
    return normalizeServiceKind(input.service_kind) || inferServiceKind(input);
}

export function resolveDefaultsKeyFromKind(kind: ServiceKind): string | null {
    if (kind === 'ai_router') return 'AI Router Swarm';
    if (kind === 'agent_zero') return 'Agent Zero Cluster';
    if (kind === 'opencode') return 'OpenCode IDE';
    if (kind === 'blockchain') return 'FlexIA Blockchain';
    return null;
}

export function resolveContainerKeyFromKind(kind: ServiceKind): string | null {
    return resolveDefaultsKeyFromKind(kind);
}

export function defaultSlugFromKind(kind: ServiceKind): string | null {
    if (kind === 'ai_router') return 'flexia-ai-router';
    if (kind === 'agent_zero') return 'flexia-agent-zero';
    if (kind === 'opencode') return 'flexia-opencode';
    if (kind === 'blockchain') return 'flexia-blockchain';
    return null;
}
