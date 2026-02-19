import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getDockerInstance } from '../src/lib/docker';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function fileExists(p: string) {
    try {
        fs.accessSync(p, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    const host = process.env.DOCKER_HOST || '';
    const tls = (process.env.DOCKER_TLS_VERIFY || '').toString() === '1';
    const certPathRaw = process.env.DOCKER_CERT_PATH || '';
    const certDir = certPathRaw ? (path.isAbsolute(certPathRaw) ? certPathRaw : path.resolve(process.cwd(), certPathRaw)) : '';

    console.log('[Test] DOCKER_HOST:', host || '(missing)');
    console.log('[Test] DOCKER_TLS_VERIFY:', tls ? '1' : '0');
    console.log('[Test] DOCKER_CERT_PATH:', certPathRaw || '(missing)');
    if (certDir) console.log('[Test] DOCKER_CERT_DIR_RESOLVED:', certDir);

    if (tls && certDir) {
        const ca = path.join(certDir, 'ca.pem');
        const certA = path.join(certDir, 'cert.pem');
        const keyA = path.join(certDir, 'key.pem');
        const certB = path.join(certDir, 'client-cert.pem');
        const keyB = path.join(certDir, 'client-key.pem');

        console.log('[Test] ca.pem:', fileExists(ca) ? 'OK' : 'MISSING');
        console.log('[Test] cert.pem:', fileExists(certA) ? 'OK' : 'MISSING');
        console.log('[Test] key.pem:', fileExists(keyA) ? 'OK' : 'MISSING');
        console.log('[Test] client-cert.pem:', fileExists(certB) ? 'OK' : 'MISSING');
        console.log('[Test] client-key.pem:', fileExists(keyB) ? 'OK' : 'MISSING');

        const serverCertPath = path.join(certDir, 'server-cert.pem');
        if (fileExists(serverCertPath)) {
            const x = new crypto.X509Certificate(fs.readFileSync(serverCertPath));
            console.log('[Test] server-cert.pem subject:', x.subject);
            console.log('[Test] server-cert.pem altNames:', x.subjectAltName || '(none)');
        }
    }

    const docker = getDockerInstance();
    await docker.ping();
    const containers = await docker.listContainers({ all: false });
    console.log(`[Test] docker.ping OK`);
    console.log(`[Test] docker.listContainers OK: ${containers.length} containers`);
    process.exit(0);
}

main().catch((err) => {
    console.error('[Test] FAILED:', err?.message || err);
    process.exit(1);
});
