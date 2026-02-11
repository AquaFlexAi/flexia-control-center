import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';

const docker = new Docker();
const CONTAINER_NAME = 'flexia-supabase-db';
const MIGRATIONS_DIR = 'supabase/docker/migrations';

async function applyAllMigrations() {
    console.log(`🔍 Looking for migrations in: ${MIGRATIONS_DIR}`);

    const migrationsDir = path.resolve(process.cwd(), MIGRATIONS_DIR);
    if (!fs.existsSync(migrationsDir)) {
        console.error('Migrations directory not found:', migrationsDir);
        process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir).sort();
    console.log(`📂 Found ${files.length} migrations.`);

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

    for (const file of files) {
        if (!file.endsWith('.sql')) continue;

        console.log(`🚀 Applying migration: ${file}`);
        const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        const exec = await container.exec({
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Cmd: ['psql', '-U', 'postgres', '-d', 'postgres']
        });

        const stream = await exec.start({ hijack: true, stdin: true });
        stream.write(sqlContent);
        stream.end();

        await new Promise((resolve) => {
            let output = '';
            stream.on('data', (chunk) => output += chunk.toString());
            stream.on('end', () => {
                // console.log(`Done ${file}`);
                resolve(null);
            });
        });
    }

    console.log('✅ All migrations applied.');
}

applyAllMigrations().catch(console.error);
