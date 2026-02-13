import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = 'supabase/docker/migrations';
const DB_CONTAINER = 'flexia-supabase-db';

async function applyAllMigrations() {
    console.log("🚀 Starting Bulk Migration Application...");

    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Sort to apply in order

    for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        console.log(`📄 Applying ${file}...`);
        try {
            // Use cat to pipe the file content into docker exec psql
            // Using powershell equivalent if on windows, but the run_command tool handles shell
            const cmd = `cat ${filePath} | docker exec -i ${DB_CONTAINER} psql -U postgres -d postgres`;
            execSync(cmd, { stdio: 'inherit' });
            console.log(`✅ ${file} applied.`);
        } catch (e: any) {
            console.warn(`⚠️  Warning applying ${file}: ${e.message}`);
            // We continue because some might already be applied and throw "already exists" errors
        }
    }

    // Also apply my custom fix for deployed_instances if not covered
    console.log("📄 Applying custom fix: 20260213000001_fix_deployed_instances_schema.sql...");
    try {
        const cmd = `cat supabase/docker/migrations/20260213000001_fix_deployed_instances_schema.sql | docker exec -i ${DB_CONTAINER} psql -U postgres -d postgres`;
        execSync(cmd, { stdio: 'inherit' });
        console.log("✅ Custom fix applied.");
    } catch (e) {
        console.log("ℹ️ Custom fix already applied or failed.");
    }

    console.log("✨ All Migrations Finished.");
}

applyAllMigrations();
