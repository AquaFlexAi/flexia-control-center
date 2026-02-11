import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';

const docker = new Docker();
const CONTAINER_NAME = 'flexia-supabase-db';
const MIGRATION_FILE = 'supabase/docker/migrations/20260210050000_crypto_staking_billing.sql';

async function applyMigration() {
    console.log(`Applying migration: ${MIGRATION_FILE}`);

    // 1. Read SQL
    const sqlPath = path.resolve(process.cwd(), MIGRATION_FILE);
    if (!fs.existsSync(sqlPath)) {
        console.error('Migration file not found:', sqlPath);
        process.exit(1);
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // 2. Find Container
    const container = docker.getContainer(CONTAINER_NAME);
    try {
        const info = await container.inspect();
        if (!info.State.Running) {
            console.error('Container is not running');
            process.exit(1);
        }
    } catch (e) {
        console.error('Container not found:', e);
        process.exit(1);
    }

    // 3. Exec psql
    console.log('Executing SQL inside container...');
    const exec = await container.exec({
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ['psql', '-U', 'postgres', '-d', 'postgres']
    });

    const stream = await exec.start({ hijack: true, stdin: true });

    // 4. Send SQL
    stream.write(sqlContent);
    stream.end();

    // 5. Read output
    let output = '';
    stream.on('data', (chunk) => {
        output += chunk.toString();
    });

    stream.on('end', () => {
        console.log('Migration output:', output);
        console.log('Done.');
    });
}

applyMigration().catch(console.error);
