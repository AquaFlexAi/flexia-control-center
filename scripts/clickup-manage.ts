#!/usr/bin/env tsx
/**
 * ClickUp Management CLI — System Instance Operations
 *
 * Usage:
 *   yarn tsx scripts/clickup-manage.ts <command> [options]
 *
 * Commands:
 *   spaces            — List all spaces in the team
 *   lists [spaceId]   — List all lists (folders → lists) in a space
 *   tasks [listId]    — List tasks in a list
 *   create <listId> <title> [--status <s>] [--priority <1-4>] [--desc <d>] [--tag <t>] [--github <url>]
 *   update <taskId> [--status <s>] [--priority <1-4>] [--github <url>] [--done]
 *   link <taskId> <githubUrl>  — Attach a GitHub PR/commit URL to a task
 *   progress <listId>  — Show progress summary for a list
 *   find <query>       — Search tasks by name across the team
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLICKUP_API = 'https://api.clickup.com/api/v2';

/* ── Load System Token ── */

async function getSystemToken(): Promise<{ token: string; teamId: string }> {
    // Priority 1: CLICKUP_API_KEY env var (personal API token — easiest for dev)
    if (process.env.CLICKUP_API_KEY) {
        const teamId = process.env.CLICKUP_TEAM_ID || '90121490159';
        return { token: process.env.CLICKUP_API_KEY, teamId };
    }

    // Priority 2: System connection in database (from OAuth flow)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('clickup_connections')
        .select('access_token, team_id')
        .eq('is_system', true)
        .single();

    if (error || !data) {
        console.error('❌ No system ClickUp connection found.');
        console.error('   Set CLICKUP_API_KEY in .env.local, or complete OAuth at /api/clickup/auth');
        process.exit(1);
    }

    if (data.access_token === 'system-token-placeholder') {
        console.error('❌ System connection has placeholder token.');
        console.error('   Option 1: Set CLICKUP_API_KEY=pk_... in .env.local (personal API token)');
        console.error('   Option 2: Login as admin@flexia.io and complete OAuth at /api/clickup/auth');
        process.exit(1);
    }

    return { token: data.access_token, teamId: data.team_id };
}

async function apiCall(path: string, token: string, method = 'GET', body?: any): Promise<any> {
    const opts: RequestInit = {
        method,
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const resp = await fetch(`${CLICKUP_API}${path}`, opts);

    if (!resp.ok) {
        const text = await resp.text();
        console.error(`❌ API Error (${resp.status}): ${text}`);
        process.exit(1);
    }

    return resp.json();
}

/* ── Commands ── */

async function listSpaces(token: string, teamId: string) {
    const data = await apiCall(`/team/${teamId}/space?archived=false`, token);
    console.log('\n📁 Spaces:\n');
    for (const space of data.spaces) {
        console.log(`  [${space.id}] ${space.name}`);
    }
}

async function listLists(token: string, spaceId: string) {
    // Get folders first
    const folders = await apiCall(`/space/${spaceId}/folder?archived=false`, token);
    console.log('\n📋 Lists:\n');

    for (const folder of folders.folders) {
        console.log(`  📁 ${folder.name}`);
        for (const list of folder.lists) {
            const countData = await apiCall(`/list/${list.id}`, token);
            console.log(`     [${list.id}] ${list.name} (${countData.task_count || '?'} tasks)`);
        }
    }

    // Folderless lists
    const folderless = await apiCall(`/space/${spaceId}/list?archived=false`, token);
    if (folderless.lists?.length > 0) {
        console.log(`  📄 (No folder)`);
        for (const list of folderless.lists) {
            console.log(`     [${list.id}] ${list.name}`);
        }
    }
}

async function listTasks(token: string, listId: string) {
    const data = await apiCall(`/list/${listId}/task?archived=false&subtasks=true`, token);
    console.log(`\n📋 Tasks in list ${listId}:\n`);

    const STATUS_ICONS: Record<string, string> = {
        'to do': '⬜', 'open': '⬜',
        'in progress': '🔵', 'in development': '🔵',
        'review': '🟡', 'in review': '🟡',
        'complete': '✅', 'closed': '✅',
        'testing': '🟠',
    };

    const PRIORITY_LABELS: Record<string, string> = {
        '1': '🔴 Urgent', '2': '🟠 High', '3': '🟡 Normal', '4': '🔵 Low',
    };

    for (const task of data.tasks) {
        const icon = STATUS_ICONS[task.status.status.toLowerCase()] || '⬜';
        const pri = PRIORITY_LABELS[task.priority?.id] || '   Normal';
        const github = task.custom_fields?.find((f: any) => f.name?.toLowerCase().includes('github'))?.value || '';
        const ghIcon = github ? ` 🔗` : '';
        console.log(`  ${icon} [${task.id}] ${task.name} (${pri})${ghIcon}`);
    }

    // Summary
    const total = data.tasks.length;
    const done = data.tasks.filter((t: any) => ['complete', 'closed'].includes(t.status.status.toLowerCase())).length;
    console.log(`\n  Progress: ${done}/${total} (${total > 0 ? Math.round(done / total * 100) : 0}%)`);
}

async function createTask(token: string, listId: string, title: string, opts: any) {
    const body: any = {
        name: title,
        description: opts.desc || '',
        status: opts.status || 'to do',
    };

    if (opts.priority) body.priority = parseInt(opts.priority);
    if (opts.tag) body.tags = [opts.tag];

    const task = await apiCall(`/list/${listId}/task`, token, 'POST', body);
    console.log(`\n✅ Task created: [${task.id}] ${task.name}`);
    console.log(`   URL: ${task.url}`);

    // Attach GitHub link if provided
    if (opts.github) {
        await attachGithubLink(token, task.id, opts.github);
    }

    return task;
}

async function updateTask(token: string, taskId: string, opts: any) {
    const body: any = {};

    if (opts.status) body.status = opts.status;
    if (opts.done) body.status = 'complete';
    if (opts.priority) body.priority = parseInt(opts.priority);

    const task = await apiCall(`/task/${taskId}`, token, 'PUT', body);
    console.log(`\n✅ Task updated: [${task.id}] ${task.name} → ${task.status.status}`);

    if (opts.github) {
        await attachGithubLink(token, taskId, opts.github);
    }
}

async function attachGithubLink(token: string, taskId: string, url: string) {
    // Use ClickUp's task link feature (external link)
    await apiCall(`/task/${taskId}/link`, token, 'POST', { url });
    console.log(`   🔗 GitHub linked: ${url}`);
}

async function showProgress(token: string, listId: string) {
    const data = await apiCall(`/list/${listId}/task?archived=false&subtasks=true`, token);

    const statuses: Record<string, number> = {};
    const priorities: Record<string, number> = {};

    for (const task of data.tasks) {
        const s = task.status.status;
        statuses[s] = (statuses[s] || 0) + 1;
        const p = task.priority?.priority || 'normal';
        priorities[p] = (priorities[p] || 0) + 1;
    }

    const total = data.tasks.length;
    const done = data.tasks.filter((t: any) => ['complete', 'closed'].includes(t.status.status.toLowerCase())).length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;

    console.log(`\n📊 Progress Report — List ${listId}\n`);
    console.log(`  Total: ${total}  |  Done: ${done}  |  Remaining: ${total - done}  |  ${pct}%`);

    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    console.log(`  [${bar}] ${pct}%\n`);

    console.log('  By Status:');
    Object.entries(statuses).sort().forEach(([k, v]) => console.log(`    ${k}: ${v}`));

    console.log('\n  By Priority:');
    Object.entries(priorities).sort().forEach(([k, v]) => console.log(`    ${k}: ${v}`));
}

async function findTasks(token: string, teamId: string, query: string) {
    // ClickUp doesn't have a search API for free plans, so we fetch all and filter
    const data = await apiCall(`/team/${teamId}/task?archived=false&subtasks=true`, token);
    const q = query.toLowerCase();
    const matches = data.tasks.filter((t: any) => t.name.toLowerCase().includes(q));

    console.log(`\n🔍 Found ${matches.length} tasks matching "${query}":\n`);
    for (const task of matches) {
        console.log(`  [${task.id}] ${task.name} (${task.status.status}) — ${task.list?.name || 'Unknown List'}`);
    }
}

/* ── CLI Router ── */

function parseArgs(args: string[]): { command: string; positional: string[]; flags: Record<string, string> } {
    const command = args[0] || 'help';
    const positional: string[] = [];
    const flags: Record<string, string> = {};

    for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].slice(2);
            flags[key] = args[i + 1] || 'true';
            i++;
        } else {
            positional.push(args[i]);
        }
    }

    return { command, positional, flags };
}

async function main() {
    const { command, positional, flags } = parseArgs(process.argv.slice(2));

    // Show help without requiring a token
    if (command === 'help' || !command) {
        console.log(`
╔══════════════════════════════════════════════════╗
║      ClickUp Management CLI — FlexAI             ║
╚══════════════════════════════════════════════════╝

Commands:
  spaces                  List all spaces in the team
  lists <spaceId>         List all lists in a space
  tasks <listId>          List tasks in a list
  create <listId> <title> Create a new task
    --status <s>           Set status (default: "to do")
    --priority <1-4>       1=Urgent, 2=High, 3=Normal, 4=Low
    --desc <description>   Task description
    --tag <tag>            Add a tag
    --github <url>         Attach a GitHub link
  update <taskId>         Update a task
    --status <s>           Change status
    --priority <1-4>       Change priority
    --done                 Mark as complete
    --github <url>         Attach a GitHub link
  link <taskId> <url>     Attach a GitHub PR/commit URL
  progress <listId>       Show progress summary
  find <query>            Search tasks by name
`);
        return;
    }

    const { token, teamId } = await getSystemToken();

    switch (command) {
        case 'spaces':
            await listSpaces(token, teamId);
            break;

        case 'lists':
            if (!positional[0]) { console.error('Usage: lists <spaceId>'); process.exit(1); }
            await listLists(token, positional[0]);
            break;

        case 'tasks':
            if (!positional[0]) { console.error('Usage: tasks <listId>'); process.exit(1); }
            await listTasks(token, positional[0]);
            break;

        case 'create':
            if (!positional[0] || !positional[1]) {
                console.error('Usage: create <listId> <title> [--status <s>] [--priority <1-4>] [--desc <d>] [--github <url>]');
                process.exit(1);
            }
            await createTask(token, positional[0], positional.slice(1).join(' '), flags);
            break;

        case 'update':
            if (!positional[0]) {
                console.error('Usage: update <taskId> [--status <s>] [--priority <1-4>] [--done] [--github <url>]');
                process.exit(1);
            }
            await updateTask(token, positional[0], flags);
            break;

        case 'link':
            if (!positional[0] || !positional[1]) {
                console.error('Usage: link <taskId> <githubUrl>');
                process.exit(1);
            }
            await attachGithubLink(token, positional[0], positional[1]);
            break;

        case 'progress':
            if (!positional[0]) { console.error('Usage: progress <listId>'); process.exit(1); }
            await showProgress(token, positional[0]);
            break;

        case 'find':
            if (!positional[0]) { console.error('Usage: find <query>'); process.exit(1); }
            await findTasks(token, teamId, positional.join(' '));
            break;

        default:
            console.log(`
╔══════════════════════════════════════════════════╗
║      ClickUp Management CLI — FlexAI             ║
╚══════════════════════════════════════════════════╝

Commands:
  spaces                  List all spaces in the team
  lists <spaceId>         List all lists in a space
  tasks <listId>          List tasks in a list
  create <listId> <title> Create a new task
    --status <s>           Set status (default: "to do")
    --priority <1-4>       1=Urgent, 2=High, 3=Normal, 4=Low
    --desc <description>   Task description
    --tag <tag>            Add a tag
    --github <url>         Attach a GitHub link
  update <taskId>         Update a task
    --status <s>           Change status
    --priority <1-4>       Change priority
    --done                 Mark as complete
    --github <url>         Attach a GitHub link
  link <taskId> <url>     Attach a GitHub PR/commit URL
  progress <listId>       Show progress summary
  find <query>            Search tasks by name
`);
    }
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
