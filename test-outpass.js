const API_BASE = 'http://54.198.177.105:8000';
const TENANT_ID = 'd3b07384-d113-4956-a5db-e0e457e51c89';
const DEPT_ID = 'e0c46647-7ee9-4c12-97b7-580ea5d3bc7d';
const PASSWORD = '1234@Uni';
const ROLLNO = 'teststudent123';

async function main() {
  console.log('Registering student...');
  const regRes = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ROLLNO,
      password: PASSWORD,
      tenant_id: TENANT_ID,
      rollno: ROLLNO,
      department_id: DEPT_ID,
      batch_year: 2024
    }),
  });
  const regJson = await regRes.json();
  console.log('Registration status:', regRes.status, regJson);

  console.log('Logging in student...');
  const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ROLLNO,
      password: PASSWORD,
      tenant_id: TENANT_ID,
    }),
  });
  const loginJson = await loginRes.json();
  if (!loginRes.ok || !loginJson.success) {
    console.error('Login failed:', loginJson);
    return;
  }
  const token = loginJson.data.access_token;
  console.log('Login successful. Access Token obtained.');

  console.log('Creating outpass...');
  const now = new Date();
  const exit_time = now.toISOString();
  const return_time = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const createRes = await fetch(`${API_BASE}/api/v1/erp/outpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      reason: 'Grocery shopping;Out of Campus',
      destination: 'Out of Campus',
      exit_time,
      return_time
    })
  });
  const createJson = await createRes.json();
  console.log('Create outpass response status:', createRes.status);
  console.log('Create outpass response:', JSON.stringify(createJson, null, 2));

  console.log('Checking existing outpasses...');
  const getRes = await fetch(`${API_BASE}/api/v1/erp/outpass`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const getJson = await getRes.json();
  console.log('Get outpasses response status:', getRes.status);
  console.log('Get outpasses response:', JSON.stringify(getJson, null, 2));
}

main().catch(err => console.error(err));
