import Docker from 'dockerode';

const docker = new Docker();

async function listContainers() {
    try {
        const containers = await docker.listContainers();
        console.log('Running Containers:');
        containers.forEach(c => {
            console.log(`- ${c.Names[0]} (Image: ${c.Image})`);
        });
    } catch (err) {
        console.error('Error listing containers:', err);
    }
}

listContainers();
