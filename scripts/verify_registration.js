// Native fetch is available in Node 18+
// Verification script for Instance Registration

async function verifyRegistration() {
    const url = 'http://localhost:3000/api/instances/register';
    const inviteToken = 'dev_invite_secret_123';

    console.log(`Testing Registration at ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inviteToken,
                name: 'Test-Instance-01',
                provider: 'local-test',
                region: 'dev-machine',
                version: '1.0.0',
                config: { max_model_len: 4096 }
            })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Status: ${status}`);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.log('Response (Text):', text);
            return;
        }

        if (status === 200) {
            console.log('✅ Registration Successful!');
            console.log('Instance ID:', data.instanceId);
            console.log('API Key:', data.apiKey);
            console.log('Message:', data.message);

            if (!data.apiKey.startsWith('sk-inst-')) {
                console.error('❌ API Key format incorrect');
            }
        } else {
            console.error('❌ Registration Failed:', data);
        }

    } catch (error) {
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.log('❌ Connection Refused. Please start the server (npm run dev).');
        } else {
            console.error('❌ Error:', error);
        }
    }
}

verifyRegistration();
