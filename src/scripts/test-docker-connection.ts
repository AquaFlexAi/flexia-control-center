import Docker from 'dockerode';

const connections = [
    { socketPath: '//./pipe/docker_engine', name: 'Standard Pipe' },
    { socketPath: 'npipe:////./pipe/docker_engine', name: 'Npipe Protocol Standard' },
    { socketPath: '\\\\.\\pipe\\docker_engine', name: 'Escaped Pipe' },
    { socketPath: '//./pipe/dockerDesktopEngine', name: 'Docker Desktop Engine Pipe' },
    { socketPath: 'npipe:////./pipe/dockerDesktopEngine', name: 'Npipe Docker Desktop Engine' },
    { socketPath: '//./pipe/dockerDesktopLinuxEngine', name: 'Docker Desktop Linux Engine Pipe' },
    { host: '127.0.0.1', port: 2375, name: 'Localhost TCP (IP)' },
    { host: 'localhost', port: 2375, name: 'Localhost TCP (DNS)' }
];

async function testConnections() {
    console.log('--- Starting Docker Connection Diagnostic ---');
    console.log(`Platform: ${process.platform}\n`);

    for (const conn of connections) {
        console.log(`Testing: ${conn.name}`);
        console.log(`Config: ${JSON.stringify(conn)}`);

        try {
            const docker = new Docker(conn);
            const start = Date.now();
            const info = await Promise.race([
                docker.version(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 3s')), 3000))
            ]);
            const duration = Date.now() - start;

            console.log('✅ SUCCESS!');
            console.log(`   Version: ${(info as any).Version}`);
            console.log(`   Time: ${duration}ms\n`);

            // If we found a working one, let's keep going but highlight it
        } catch (err: any) {
            console.error(`❌ FAILED: ${err.message}\n`);
        }
    }

    console.log('--- Diagnostic Complete ---');
}

testConnections().catch(console.error);
