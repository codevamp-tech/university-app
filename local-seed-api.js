/**
 * seed-api.js
 * ───────────
 * Reads all students from the Google Sheet and registers each one
 * on the UniCampus API using:
 *   username  = roll number
 *   password  = "1234@Uni" (8-char minimum required by API, maps from user-facing "1234")
 *
 * Run:
 *   node seed-api.js
 *
 * Requirements:
 *   - Node 18+ (uses built-in fetch)
 *   - Internet access to the Google Sheet and API
 */

const SHEET_ID     = '1ARaan06jKrkkmysnReBIPX-YUT_thaRyG1jKrcvnp6E';
const API_BASE     = 'http://192.168.1.4:8000';
const TENANT_ID    = 'd3b07384-d113-4956-a5db-e0e457e51c89';
const DEPT_ID      = 'e0c46647-7ee9-4c12-97b7-580ea5d3bc7d';
const PASSWORD     = '1234@Uni'; // Internal password (8 chars min). User types "1234" in app.
const BATCH_YEAR   = 2024;
const CONCURRENCY  = 3;          // Max parallel registrations

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const result = [];
  let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (inQuotes) {
      if (ch === '"') { if (next === '"') { cell += '"'; i++; } else inQuotes = false; }
      else cell += ch;
    } else {
      if (ch === '"')      inQuotes = true;
      else if (ch === ',') { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        row.push(cell.trim());
        if (row.length > 1 || row[0]) result.push(row);
        row = []; cell = '';
        if (ch === '\r' && next === '\n') i++;
      } else cell += ch;
    }
  }
  if (cell || row.length > 0) { row.push(cell.trim()); result.push(row); }
  return result;
}

let COL = {};
function buildColMap(headers) {
  COL = {};
  headers.forEach((h, i) => {
    COL[h.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')] = i;
  });
}
function get(row, key) { return COL[key] !== undefined ? (row[COL[key]] || '').toString().trim() : ''; }

// ─── API call helper ──────────────────────────────────────────────────────────
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

// ─── Register a single student ────────────────────────────────────────────────
async function registerStudent(rollNo, name) {
  const username = rollNo.trim();
  if (!username) return { status: 'skip', reason: 'empty roll number' };

  // 1. Try login first (idempotent — don't re-register if already exists)
  const loginRes = await apiPost('/api/v1/auth/login', {
    username,
    password: PASSWORD,
    tenant_id: TENANT_ID,
  });

  if (loginRes.status === 200 && loginRes.json?.success) {
    return { status: 'exists', rollNo };
  }

  // 2. Register
  const regRes = await apiPost('/api/v1/auth/register', {
    username,
    password: PASSWORD,
    tenant_id: TENANT_ID,
    rollno: username,
    department_id: DEPT_ID,
    batch_year: BATCH_YEAR,
  });

  if (regRes.status === 200 && regRes.json?.success) {
    return { status: 'registered', rollNo, name };
  }

  // Already registered but wrong password or other conflict
  if (regRes.json?.detail?.code === 'ALREADY_EXISTS' ||
      regRes.json?.detail?.includes?.('already')) {
    return { status: 'exists', rollNo };
  }

  return {
    status: 'error',
    rollNo,
    name,
    error: regRes.json?.detail?.message || regRes.json?.detail || JSON.stringify(regRes.json),
  };
}

// ─── Run with concurrency control ─────────────────────────────────────────────
async function runBatch(items, concurrency, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  UniCampus API Seed Script');
  console.log('══════════════════════════════════════');
  console.log(`📡  API      : ${API_BASE}`);
  console.log(`🏫  Tenant   : ${TENANT_ID}`);
  console.log(`🔑  Password : ${PASSWORD}  (user types "1234" in app)`);
  console.log('══════════════════════════════════════\n');

  // 1. Fetch sheet
  console.log('📥  Fetching Google Sheet...');
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
  let sheetRes;
  try { sheetRes = await fetch(sheetUrl); }
  catch (e) { console.error('❌  Network error:', e.message); process.exit(1); }
  if (!sheetRes.ok) { console.error(`❌  Sheet HTTP ${sheetRes.status}`); process.exit(1); }

  const csv   = await sheetRes.text();
  const rows  = parseCSV(csv);
  if (rows.length < 2) { console.error('❌  Sheet appears empty'); process.exit(1); }

  buildColMap(rows[0]);
  const dataRows = rows.slice(1).filter(r => r.length > 2 && r[0]);

  // Extract roll numbers and names
  const students = dataRows.map(row => ({
    rollNo: get(row, 'ROLLNO') || get(row, 'STUDENTID') || get(row, 'ROLLNUMBER'),
    name:   get(row, 'NAME'),
  })).filter(s => s.rollNo);

  console.log(`✅  Found ${students.length} students in sheet\n`);
  console.log(`🔄  Registering (concurrency: ${CONCURRENCY})...\n`);

  // 2. Register all students
  const results = await runBatch(students, CONCURRENCY, ({ rollNo, name }) =>
    registerStudent(rollNo, name)
  );

  // 3. Summary
  const registered = results.filter(r => r.status === 'registered');
  const existing   = results.filter(r => r.status === 'exists');
  const errors     = results.filter(r => r.status === 'error');
  const skipped    = results.filter(r => r.status === 'skip');

  console.log('\n══════════════════════════════════════');
  console.log('📊  SEED SUMMARY');
  console.log('══════════════════════════════════════');
  console.log(`  ✅ Newly registered : ${registered.length}`);
  console.log(`  ♻️  Already existed  : ${existing.length}`);
  console.log(`  ⚠️  Errors           : ${errors.length}`);
  console.log(`  ⏭️  Skipped          : ${skipped.length}`);
  console.log(`  📦 Total processed  : ${students.length}`);
  console.log('══════════════════════════════════════');

  if (registered.length > 0) {
    console.log('\n✅  Newly registered students:');
    registered.forEach(r => console.log(`    • ${r.rollNo}  ${r.name}`));
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(r => console.log(`    • ${r.rollNo} (${r.name}): ${r.error}`));
  }

  console.log(`\n🎉  Done! Students can now log in with:\n`);
  console.log(`    Roll Number  →  username`);
  console.log(`    1234         →  password\n`);
}

main().catch(err => { console.error('❌ Fatal:', err); process.exit(1); });
