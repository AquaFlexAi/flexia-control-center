
const BASE_URL = 'http://localhost:3000/api/agent-zero';

async function test() {
  try {
    // 1. Get CSRF Token
    console.log('Fetching CSRF token...');
    const csrfRes = await fetch(`${BASE_URL}/csrf_token`);
    if (!csrfRes.ok) throw new Error(`CSRF fetch failed: ${csrfRes.status}`);
    const csrfData = await csrfRes.json();
    console.log('CSRF Token:', csrfData.token);
    const token = csrfData.token;

    // 2. Poll (requires token)
    console.log('Polling...');
    const pollRes = await fetch(`${BASE_URL}/poll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify({ context: null })
    });
    
    if (!pollRes.ok) {
        const text = await pollRes.text();
        throw new Error(`Poll failed: ${pollRes.status} - ${text}`);
    }
    const pollData = await pollRes.json();
    console.log('Poll Success:', Object.keys(pollData));
    
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

test();
