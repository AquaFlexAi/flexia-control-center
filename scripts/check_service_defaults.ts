import { SERVICE_CONTAINER_MAP, SERVICE_DEFAULTS } from '../src/lib/docker';

const requiredNames = [
    'AI Router',
    'AI Router Service',
    'AI Router Swarm',
    'Agent Zero',
    'Agent Zero Swarm',
    'Agent Zero Cluster'
];

let ok = true;

for (const name of requiredNames) {
    const hasDefaults = Boolean(SERVICE_DEFAULTS[name]);
    const containerBase = SERVICE_CONTAINER_MAP[name];
    if (!hasDefaults || !containerBase) ok = false;
    console.log(`${name}: defaults=${hasDefaults} container=${containerBase || ''}`);
}

process.exit(ok ? 0 : 1);
