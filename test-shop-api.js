const API_BASE = 'http://54.174.185.143:8000';
const TENANT_ID = 'd3b07384-d113-4956-a5db-e0e457e51c89';
const PASSWORD = '1234@Uni';
const username = '2200030010'; // typical roll number

async function run() {
  const loginRes = await fetch(API_BASE + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: PASSWORD, tenant_id: TENANT_ID })
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data.access_token;
  
  // Test create gig
  const gigRes = await fetch(API_BASE + '/api/v1/shop/gigs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title: 'Test Gig', description: 'Test', price: 100 })
  });
  console.log('Gig POST status:', gigRes.status);
  console.log('Gig POST response:', await gigRes.text());
}
run();
