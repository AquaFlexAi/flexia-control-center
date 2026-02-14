import { listContainers, inspectContainerState } from '../src/lib/docker';

async function verify() {
    console.log('--- Verifying Docker Fallbacks ---');

    console.log('1. Listing Containers...');
    const containers = await listContainers();
    console.log(`   Found ${containers.length} containers.`);

    if (containers.length === 0) {
        console.warn('   No containers found to test inspect with.');
        return;
    }

    const target = containers[0];
    const name = target.Names[0].replace('/', '');
    console.log(`2. Inspecting ${name}...`);

    try {
        const state = await inspectContainerState(name);
        console.log(`   Result: Running=${state.Running}, Status=${state.Status}, Missing=${state.Missing}`);

        if (state.Status !== 'missing' && state.Status !== 'unknown') {
            console.log('✅ verification PASSED: CLI fallback for inspect is working.');
        } else {
            console.error('❌ verification FAILED: Status is unknown or missing unexpectedly.');
        }
    } catch (err: any) {
        console.error('❌ verification CRASHED:', err);
    }
}

verify();
