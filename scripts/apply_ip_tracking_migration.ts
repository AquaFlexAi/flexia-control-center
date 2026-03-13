
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILE = 'scripts/migrations/002_add_ip_tracking.sql';
const DB_CONTAINER = 'flexia-supabase-db';

async function applyMigration() {
    console.log(`📄 Applying ${MIGRATION_FILE}...`);
    try {
        const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf-8');
        execSync(`docker exec -i ${DB_CONTAINER} psql -U postgres -d postgres`, { 
            input: sqlContent,
            stdio: ['pipe', 'inherit', 'inherit'] 
        });
        console.log(`✅ Applied.`);
    } catch (e: any) {
        console.error(`❌ Failed: ${e.message}`);
        process.exit(1);
    }
}

applyMigration();
