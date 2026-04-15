// Quick test
async function test() {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: [
          { role: 'user', content: 'Say hello' }
        ],
        stream: false
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data.message?.content);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
