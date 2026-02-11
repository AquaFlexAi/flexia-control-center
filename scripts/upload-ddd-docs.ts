#!/usr/bin/env tsx
/**
 * Upload DDD Documentation to ClickUp Task
 * 
 * Attaches the 11 DDD report files to the "[DevOps] DDD Documentation Suite (10 docs)" task.
 * 
 * Task ID: 869c3e3n4
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

console.log('Script starting...');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log(`Loading .env from ${envPath}`);
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️ .env.local not found!');
}

const TASK_ID = '869c3e3n4';
// Use .. to go up from flexia-control-center to root
const DOCS_DIR = path.resolve(process.cwd(), '../docs/reports/DDD');

async function getToken(): Promise<string> {
    console.log('Resolving token...');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase env vars');
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
        .from('clickup_connections')
        .select('access_token')
        .eq('is_system', true)
        .single();

    if (error || !data || !data.access_token || data.access_token === 'system-token-placeholder') {
        throw new Error('❌ System token invalid or missing.');
    }

    return data.access_token;
}

async function uploadFile(token: string, filePath: string): Promise<string> {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    // Create multipart/form-data boundary
    const boundary = '----ClickUpUpload' + Math.random().toString(16).substr(2);

    // Construct the body parts
    const header = `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="attachment"; filename="${fileName}"\r\n` +
        `Content-Type: text/markdown\r\n\r\n`;

    const footer = `\r\n--${boundary}--\r\n`;

    const buffer = Buffer.concat([
        Buffer.from(header, 'utf8'),
        fileContent,
        Buffer.from(footer, 'utf8')
    ]);

    return new Promise((resolve, reject) => {
        const req = https.request({
            method: 'POST',
            hostname: 'api.clickup.com',
            path: `/api/v2/task/${TASK_ID}/attachment`,
            headers: {
                'Authorization': token,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': buffer.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.id || 'ok');
                    } catch { resolve('ok'); }
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(buffer);
        req.end();
    });
}

async function main() {
    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║   FlexAi → ClickUp Docs Uploader                    ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);

    try {
        const token = await getToken();
        console.log('✅ Using Valid System Token from Database');

        if (!fs.existsSync(DOCS_DIR)) {
            console.error(`❌ Docs directory not found: ${DOCS_DIR}`);
            process.exit(1);
        }

        const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
        console.log(`  📂 Found ${files.length} markdown files in ${DOCS_DIR}\n`);

        let success = 0;
        let fail = 0;

        for (const file of files) {
            process.stdout.write(`  ⬆️  Uploading: ${file}... `);
            try {
                await uploadFile(token, path.join(DOCS_DIR, file));
                console.log(`✅ Done.`);
                success++;
            } catch (e: any) {
                console.log(`❌ Failed: ${e.message}`);
                fail++;
            }
        }

        console.log(`\n══════════════════════════════════════════════════════`);
        console.log(`  📊 Upload Complete: ${success} uploaded, ${fail} failed`);
        console.log(`══════════════════════════════════════════════════════\n`);
    } catch (e: any) {
        console.error('Fatal Error:', e.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
