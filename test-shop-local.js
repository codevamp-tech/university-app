const API_BASE = 'http://192.168.1.4:8000';
const TENANT_ID = 'd3b07384-d113-4956-a5db-e0e457e51c89';
const PASSWORD = '1234@Uni';
const username = '2500141790001'; 

async function run() {
  const loginRes = await fetch(API_BASE + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: PASSWORD, tenant_id: TENANT_ID })
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data.access_token;
  
  // POST to listings with category 'misc'
  const listRes = await fetch(API_BASE + '/api/v1/shop/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title: 'Test Item', description: 'Test', price: 100, category: 'misc', image_url: null })
  });
  console.log('Listing POST status:', listRes.status);
  console.log('Listing POST response:', await listRes.text());
}
run();
