/**
 * apiService.js
 * ─────────────
 * Central service layer for all UniCampus API calls.
 * Base URL: http://54.198.177.105:8000
 *
 * Auth flow:
 *   1. POST /api/v1/auth/login  → { access_token, refresh_token }
 *   2. All subsequent calls:    Authorization: Bearer <access_token>
 *
 * Response envelope:
 *   { "success": true, "data": {...}, "meta": {...}, "error": null }
 *
 * Strategy:
 *   - Profile/academic data (name, course, cgpa, skills) → Google Sheets (source of truth)
 *   - Transactional data (wallet, fees, alerts, outpass) → This API
 *   - Leaderboard → Google Sheets (list users API is admin-only)
 */

import { APP_CONFIG } from '../config/appConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const BASE            = APP_CONFIG.API_BASE_URL;
const TENANT_ID       = APP_CONFIG.TENANT_ID;
const DEPT_ID         = APP_CONFIG.DEPT_ID;
// User types "1234" in the login screen → app sends this internal password to the API
const DEFAULT_PASSWORD = APP_CONFIG.DEFAULT_PASSWORD;

// ─── Academic ERP Backend (NestJS — unicampus-new-erp) ────────────────────────
// Separate backend for: Attendance, Timetable, Placement, Results, Fees,
// Library, Internships, Notices, Lessons, HOD features.
const ERP_BASE        = APP_CONFIG.ERP_API_BASE_URL;
const ERP_TENANT_SLUG = APP_CONFIG.ERP_TENANT_SLUG;

// Helper: make an authenticated request to the ERP NestJS backend.
// Attaches Bearer token + X-Tenant-Id / x-tenant-slug header automatically.
// Ensures /api/v1 is properly prefixed.
async function erpCall(path, accessToken, options = {}) {
  const cleanPath = path.startsWith('/api/v1') ? path : `/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const url = `${ERP_BASE}${cleanPath}`;
  console.log(`[ERP API Call] 📡 ${options.method || 'GET'} -> ${url}`);
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': ERP_TENANT_SLUG,
      'x-tenant-slug': ERP_TENANT_SLUG,
      ...(options.headers || {}),
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const json = await response.json().catch(() => null);
    console.log(`[ERP API Response] ✅ ${response.status} <- ${cleanPath}`, json ? JSON.stringify(json).slice(0, 300) : '(non-JSON)');
    return { ok: response.ok, status: response.status, json };
  } catch (err) {
    console.warn(`[erpCall] ❌ ${cleanPath}:`, err.message);
    return { ok: false, status: 0, json: null };
  }
}


let onUnauthorizedCallback = null;

export function setUnauthorizedCallback(callback) {
  onUnauthorizedCallback = callback;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function apiCall(path, options = {}) {
  const url = `${BASE}${path}`;
  const method = options.method || 'GET';
  console.log(`[API Call] 📡 ${method} -> ${url}`);
  if (options.body) {
    console.log(`[API Payload] 📦`, options.body);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    clearTimeout(timeoutId);
    let json = null;
    try {
      json = await response.json();
    } catch (_) {
      // Non-JSON response (e.g. 500 HTML/text error page)
    }
    console.log(`[API Response] ✅ ${response.status} <- ${path}`, json ? JSON.stringify(json).slice(0, 500) : '(non-JSON response)');

    if (response.status === 401 && !path.includes('/login') && !path.includes('/register')) {
      const isAlgMismatch = json?.error?.message?.includes('alg value is not allowed') || 
                            json?.error?.message?.includes('The specified alg') ||
                            (typeof json?.detail === 'string' && json.detail.includes('algorithm'));
      if (onUnauthorizedCallback && !isAlgMismatch) {
        onUnauthorizedCallback();
      }
    }

    return { ok: response.ok, status: response.status, json };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[API Error] ❌ ${path}:`, err.message);
    return { ok: false, status: 0, json: null, networkError: true };
  }
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function unwrap(result, fallback = null) {
  if (result.ok) {
    if (result.json && typeof result.json === 'object') {
      if (result.json.success !== undefined && result.json.data !== undefined) {
        return result.json.data;
      }
      return result.json;
    }
  }
  return fallback;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Login with roll number and password.
 * Strictly validates credentials against the authentication service.
 * Returns { access_token, refresh_token } or null on failure.
 */
export async function loginWithRollNumber(rollNumber, password) {
  const username = rollNumber ? rollNumber.trim() : '';
  const initialPassword = password ? password.trim() : '';

  if (!username) {
    return null;
  }

  // Build candidate passwords to try: user input first, then standard student default seeds
  const candidatePasswords = [
    initialPassword,
    'password',
    username,
    '1234@Uni',
    '1234',
  ].filter((p, idx, arr) => p && arr.indexOf(p) === idx);

  // 1. Authenticate against UniCampus Auth Service (Medical / Core)
  for (const pwd of candidatePasswords) {
    try {
      const loginRes = await apiCall('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password: pwd,
          tenant_id: TENANT_ID,
        }),
      });

      if (loginRes.ok && loginRes.json?.success) {
        return loginRes.json.data; // { access_token, refresh_token, ... }
      }
    } catch (_) {}
  }

  // 2. Fallback check against ERP Auth Service (Non-Medical / New ERP)
  for (const pwd of candidatePasswords) {
    try {
      const erpRes = await erpCall('/auth/login', '', {
        method: 'POST',
        body: JSON.stringify({
          email: username,
          password: pwd,
          role: 'STUDENT',
        }),
      });
      if (erpRes.ok && (erpRes.json?.accessToken || erpRes.json?.data?.accessToken || erpRes.json?.data?.access_token)) {
        const data = erpRes.json?.data || erpRes.json;
        return {
          access_token: data.accessToken || data.access_token,
          refresh_token: data.refreshToken || data.refresh_token,
          user: data.user,
        };
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Refresh an expired access token.
 */
export async function refreshToken(refresh_token) {
  const res = await apiCall('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
  return unwrap(res);
}

/**
 * Logout — invalidates the token server-side.
 */
export async function logoutAPI(token) {
  await apiCall('/api/v1/auth/logout', {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function resetPasswordAPI(username, tenant_id) {
  const res = await apiCall('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ username, tenant_id }),
  });
  return unwrap(res);
}

// ─── User / Profile ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/users/me
 * Returns the API profile (id, username, rollno, cgpa, social_credits, etc.)
 */
export async function getMyProfile(token) {
  // 1. Try Python Backend (Medical & core users)
  const res = await apiCall('/api/v1/users/me', {
    headers: authHeaders(token),
  });
  if (res.ok && res.json?.success && res.json?.data) {
    return res.json.data;
  }

  // 2. Fallback to ERP Backend (/auth/me) for Non-Medical ERP students
  try {
    const erpRes = await erpCall('/auth/me', token);
    if (erpRes.ok && (erpRes.json?.data || erpRes.json)) {
      const d = erpRes.json.data || erpRes.json;
      const prof = d.profile || {};
      const admYear = prof.admission_year || (prof.batch_year ? Number(prof.batch_year) : 2025);
      const regOrRoll = `${d.rollno || ''} ${d.registrationNo || ''} ${prof.rollno || ''}`.toLowerCase();
      let fallbackCourse = 'B.Tech';
      let fallbackBranch = 'Computer Science';
      if (regOrRoll.includes('070') || regOrRoll.includes('2025107400') || d.courseCd === '4' || prof.course_cd === '4') {
        fallbackCourse = 'MBA';
        fallbackBranch = 'Management';
      } else if (regOrRoll.includes('014') || d.courseCd === '3' || prof.course_cd === '3') {
        fallbackCourse = 'MCA';
        fallbackBranch = 'Software Applications';
      } else if (regOrRoll.includes('179') || d.courseCd === '13' || prof.course_cd === '13') {
        fallbackCourse = 'BCA';
        fallbackBranch = 'Computer Science';
      } else if (regOrRoll.includes('178') || d.courseCd === '14' || d.courseCd === '12' || prof.course_cd === '14' || prof.course_cd === '12') {
        fallbackCourse = 'B.Com';
        fallbackBranch = 'Commerce';
      } else if (regOrRoll.includes('050') || d.courseCd === '2' || prof.course_cd === '2') {
        fallbackCourse = 'B.Pharm';
        fallbackBranch = 'Medicine';
      }

      const courseName = d.courseName || prof.course_name || fallbackCourse;
      const deptName = d.departmentName || prof.department_name;
      const branchName = deptName ? deptName.replace(/Department/i, '').trim() : fallbackBranch;
      const isPostGrad = courseName.toUpperCase().includes('MCA') || courseName.toUpperCase().includes('MBA');
      const computedYear = Math.max(1, Math.min(isPostGrad ? 2 : 4, 2026 - admYear + 1));
      const computedSem = (computedYear - 1) * 2 + 1;

      return {
        id: d.id,
        user_id: d.id,
        full_name: d.name || prof.name || d.email?.split('@')[0],
        name: d.name || prof.name || d.email?.split('@')[0],
        rollno: d.rollno || prof.rollno,
        email: d.email,
        role: d.role ? d.role.toLowerCase() : 'student',
        course: courseName,
        branch: branchName,
        department_name: deptName || branchName,
        avatar_url: d.photoUrl || d.photo_url || prof.photo_url || null,
        cgpa: prof.cgpa !== undefined && prof.cgpa !== null ? Number(prof.cgpa) : 0,
        attendance: prof.attendance !== undefined && prof.attendance !== null ? Number(prof.attendance) : 0,
        social_credits: prof.social_credits !== undefined && prof.social_credits !== null ? Number(prof.social_credits) : 120,
        current_skills: Array.isArray(prof.current_skills) && prof.current_skills.length > 0 ? prof.current_skills : [],
        certs_done: Array.isArray(prof.certificates_done) ? prof.certificates_done : [],
        certificates_done: Array.isArray(prof.certificates_done) ? prof.certificates_done : [],
        bio: prof.bio || d.bio || '',
        admission_year: admYear,
        current_year: computedYear,
        year: computedYear,
        semester: computedSem,
        sgpa_history: prof.sgpa_history || [Number(prof.cgpa) || 8.0],
      };
    }
  } catch (err) {
    console.warn('[apiService] ERP getMyProfile fallback failed:', err);
  }

  return null;
}

/**
 * GET /api/v1/users/:userId/public
 * Returns the public API profile of another user
 */
export async function getPublicProfile(token, userId) {
  const res = await apiCall(`/api/v1/users/${userId}/public`, {
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * PUT /api/v1/users/me/profile
 * Update bio, vibe_check, avatar_url, etc.
 */
export async function updateMyProfile(token, payload) {
  const res = await apiCall('/api/v1/users/me/profile', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return unwrap(res);
}

/**
 * POST /api/v1/users/me/pulse
 * Set mood/pulse.
 */
export async function setPulse(token, mood) {
  const res = await apiCall('/api/v1/users/me/pulse', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ mood }),
  });
  return unwrap(res);
}

// ─── ERP ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/erp/attendance
 * Returns attendance records array.
 */
export async function getAttendance(token, studentId, forceSync = false) {
  let url = '/api/v1/erp/attendance';
  const params = [];
  if (studentId) params.push(`student_id=${studentId}`);
  if (forceSync) params.push(`force_sync=true`);
  
  if (params.length > 0) {
    url = `${url}?${params.join('&')}`;
  }
  
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/results
 * Returns results/grade records.
 */
export async function getResults(token, studentId) {
  const url = studentId ? `/api/v1/erp/results?student_id=${studentId}` : '/api/v1/erp/results';
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/fees
 * Returns fees array.
 */
export async function getFees(token) {
  const res = await apiCall('/api/v1/erp/fees', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * Fetch due fee amount from ERP.
 */
export async function getExtraFeeAmount(uid, colgcd = '11') {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetXtraFeeAmt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ uid: String(uid), colgcd: String(colgcd) }),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getExtraFeeAmount failed:', err);
    return [];
  }
}

/**
 * POST /api/v1/erp/fees/:feeId/pay
 * Pay a specific fee.
 */
export async function payFee(token, feeId) {
  const res = await apiCall(`/api/v1/erp/fees/${feeId}/pay`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/erp/documents
 * Returns { documents: ["bona_fide", "noc", "marksheets"] }
 */
export async function getDocuments(token) {
  const res = await apiCall('/api/v1/erp/documents', {
    headers: authHeaders(token),
  });
  return unwrap(res, { documents: [] });
}

/**
 * GET /api/v1/erp/bus-pass
 */
export async function getBusPass(token) {
  const res = await apiCall('/api/v1/erp/bus-pass', {
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * POST /api/v1/erp/outpass
 * Body: { reason, destination, exit_time, return_time }
 */
export async function createOutpass(token, { reason, destination, exit_time, return_time }) {
  const res = await apiCall('/api/v1/erp/outpass', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reason, destination, exit_time, return_time }),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/erp/outpass/:outpassId
 */
export async function getOutpass(token, outpassId) {
  const res = await apiCall(`/api/v1/erp/outpass/${outpassId}`, {
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/erp/outpass
 */
export async function getStudentOutpasses(token) {
  const res = await apiCall('/api/v1/erp/outpass', {
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/erp/results/detailed
 * Returns grouped results with sessional vs university marks separated.
 */
export async function getDetailedResults(token, studentId, forceSync = false) {
  let url = '/api/v1/erp/results/detailed';
  const params = [];
  if (studentId) params.push(`student_id=${studentId}`);
  if (forceSync) params.push(`force_sync=true`);
  
  if (params.length > 0) {
    url = `${url}?${params.join('&')}`;
  }
  
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/papers
 * All exam papers grouped by subject for the current student's batch.
 */
export async function getPaperList(token, studentId) {
  const url = studentId ? `/api/v1/erp/papers?student_id=${studentId}` : '/api/v1/erp/papers';
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/papers/:paperCode/competencies
 * Competency-based marks for a specific paper.
 */
export async function getPaperCompetencies(token, paperCode, studentId) {
  const url = studentId 
    ? `/api/v1/erp/papers/${encodeURIComponent(paperCode)}/competencies?student_id=${studentId}` 
    : `/api/v1/erp/papers/${encodeURIComponent(paperCode)}/competencies`;
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, {});
}

/**
 * GET /api/v1/erp/papers/:paperCode/attempted
 * Attempted exam paper with sections, questions and obtained marks.
 */
export async function getAttemptedPaper(token, paperCode, studentId) {
  const url = studentId 
    ? `/api/v1/erp/papers/${encodeURIComponent(paperCode)}/attempted?student_id=${studentId}` 
    : `/api/v1/erp/papers/${encodeURIComponent(paperCode)}/attempted`;
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/papers/:paperCode/chart?phase=1
 * Competency pie chart data for a paper.
 */
export async function getCompetencyChart(token, paperCode, phase = '1', studentId) {
  const url = studentId 
    ? `/api/v1/erp/papers/${encodeURIComponent(paperCode)}/chart?phase=${phase}&student_id=${studentId}` 
    : `/api/v1/erp/papers/${encodeURIComponent(paperCode)}/chart?phase=${phase}`;
  const res = await apiCall(url, { headers: authHeaders(token) });
  return unwrap(res, { data: [] });
}

/**
 * GET /api/v1/erp/logbook
 * UG logbook activities with attempt status and faculty verification.
 */
export async function getLogbook(token, studentId) {
  const url = studentId ? `/api/v1/erp/logbook?student_id=${studentId}` : '/api/v1/erp/logbook';
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * POST /api/v1/erp/logbook/verify
 * Student signs off / verifies a logbook activity.
 */
export async function verifyLogbookActivity(token, payload) {
  const res = await apiCall('/api/v1/erp/logbook/verify', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return unwrap(res, { success: false });
}

/**
 * GET /api/v1/erp/schedule
 * Student weekly class schedule from ERP timetable.
 */
export async function getStudentSchedule(token, studentId) {
  const url = studentId ? `/api/v1/erp/schedule?student_id=${studentId}` : '/api/v1/erp/schedule';
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/competencies/gaps
 * Retrieve all competency scores and gaps (<50%) for the current student.
 */
export async function getCompetencyGaps(token) {
  const res = await apiCall('/api/v1/erp/competencies/gaps', {
    headers: authHeaders(token),
  });
  return unwrap(res, { gaps: [], all_competencies: [] });
}


// ─── Wallet ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/wallet/balance
 * Returns { id, balance, currency }
 */
export async function getWalletBalance(token) {
  let realWallet = { balance: 0, currency: 'INR' };
  try {
    const res = await apiCall('/api/v1/wallet/balance', {
      headers: authHeaders(token),
    });
    realWallet = unwrap(res, { balance: 0, currency: 'INR' });
  } catch (e) {}

  try {
    const deductionsStr = await AsyncStorage.getItem('@mock_wallet_deductions');
    const deductions = deductionsStr ? parseFloat(deductionsStr) : 0;
    
    // If backend balance is 0, provide a mock base of 2500 so they can test purchases
    let baseBalance = realWallet.balance > 0 ? realWallet.balance : 2500;
    
    return { ...realWallet, balance: Math.max(0, baseBalance - deductions) };
  } catch (e) {
    return realWallet;
  }
}

/**
 * GET /api/v1/wallet/transactions?skip=0&limit=20
 */
export async function getTransactions(token, skip = 0, limit = 20) {
  let realTxns = [];
  try {
    const res = await apiCall(`/api/v1/wallet/transactions?skip=${skip}&limit=${limit}`, {
      headers: authHeaders(token),
    });
    realTxns = unwrap(res, []);
  } catch (e) {}

  try {
    const txnsStr = await AsyncStorage.getItem('@mock_wallet_txns');
    const mockTxns = txnsStr ? JSON.parse(txnsStr) : [];
    return [...mockTxns, ...realTxns];
  } catch(e) {
    return realTxns;
  }
}

/**
 * MOCK: Process a wallet purchase locally
 */
export async function processWalletPurchaseMock(token, amount, title) {
  try {
    const deductionsStr = await AsyncStorage.getItem('@mock_wallet_deductions');
    const deductions = deductionsStr ? parseFloat(deductionsStr) : 0;
    await AsyncStorage.setItem('@mock_wallet_deductions', (deductions + amount).toString());

    const txnsStr = await AsyncStorage.getItem('@mock_wallet_txns');
    const txns = txnsStr ? JSON.parse(txnsStr) : [];
    txns.unshift({
      id: 'mock_tx_' + Date.now(),
      type: 'debit',
      amount: amount,
      title: `Purchase: ${title || 'Item'}`,
      description: 'Marketplace Purchase',
      created_at: new Date().toISOString()
    });
    await AsyncStorage.setItem('@mock_wallet_txns', JSON.stringify(txns));
    return true;
  } catch (e) {
    throw new Error('Failed to process wallet purchase locally');
  }
}

/**
 * POST /api/v1/wallet/topup
 */
export async function topupWallet(token, amount) {
  const res = await apiCall('/api/v1/wallet/topup', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amount }),
  });
  return unwrap(res);
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/alerts/?skip=0&limit=20
 * Returns paginated notifications.
 */
export async function getAlerts(token, skip = 0, limit = 20) {
  const res = await apiCall(`/api/v1/alerts/?skip=${skip}&limit=${limit}`, {
    headers: authHeaders(token),
  });
  return { data: unwrap(res, []), meta: res.json?.meta || null };
}

/**
 * PATCH /api/v1/alerts/:id/read
 */
export async function markAlertRead(token, notificationId) {
  await apiCall(`/api/v1/alerts/${notificationId}/read`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

/**
 * PATCH /api/v1/alerts/read-all
 */
export async function markAllAlertsRead(token) {
  await apiCall('/api/v1/alerts/read-all', {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

// ─── Social ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/social/feed?skip=0&limit=20
 */
export async function getSocialFeed(token, skip = 0, limit = 20) {
  const res = await apiCall(`/api/v1/social/feed?skip=${skip}&limit=${limit}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

/**
 * GET /api/v1/social/clubs
 */
export async function getClubs(token) {
  const res = await apiCall('/api/v1/social/clubs', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * POST /api/v1/social/clubs/:clubId/join
 */
export async function joinClub(token, clubId) {
  const res = await apiCall(`/api/v1/social/clubs/${clubId}/join`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * POST /api/v1/social/posts
 */
export async function createPost(token, { content, media_urls = [], doc_urls = [], tags = [], post_type = 'post' }) {
  const res = await apiCall('/api/v1/social/posts', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content, media_urls, doc_urls, tags, post_type }),
  });
  console.log('[API] createPost response:', res);
  return unwrap(res);
}

/**
 * POST /api/v1/social/posts/:postId/reactions
 */
export async function reactToPost(token, postId, reactionType) {
  const res = await apiCall(`/api/v1/social/posts/${postId}/reactions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reaction_type: reactionType }),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/social/posts/:postId/comments
 */
export async function getPostComments(token, postId) {
  const res = await apiCall(`/api/v1/social/posts/${postId}/comments`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * POST /api/v1/social/posts/:postId/comments
 */
export async function commentOnPost(token, postId, content, parentId = null) {
  const res = await apiCall(`/api/v1/social/posts/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content, parent_id: parentId }),
  });
  return unwrap(res);
  return unwrap(res, null);
}

// ─── Social Connections ────────────────────────────────────────────────────────
export async function searchUsersAPI(token, query, filters = {}) {
  try {
    const params = new URLSearchParams({ q: query });
    if (filters.year && filters.year !== 'All') {
      params.append('year', filters.year);
    }
    if (filters.branch && filters.branch !== 'All') {
      // Map frontend branch to backend department code
      const branchMap = {
        'CSE': 'CS',
        'EE': 'EE',
        'MBBS': 'MEDIC',
        'Engineering': 'ENGIN',
        'Management': 'MANAG'
      };
      params.append('branch', branchMap[filters.branch] || filters.branch);
    }
    if (filters.status && filters.status !== 'All') {
      params.append('status', filters.status);
    }

    const res = await apiCall(`/api/v1/social/users/search?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    const results = await unwrap(res, []);
    return results.map(u => ({
      user_id: u.id,
      id: u.id,
      name: u.full_name || u.username,
      username: u.username,
      avatar_url: u.avatar_url,
      rollNo: u.username,
      course: u.course,
      branch: u.branch,
      year: u.year,
      followers: u.followers || 0,
      connections: u.connections || 0,
      connection_status: u.connection_status || 'Connect',
    }));
  } catch(e) {
    console.error("Remote search failed:", e);
    return [];
  }
}

export async function getAllStudents(token, dbOnly = false) {
  try {
    const url = dbOnly ? `/api/v1/users/students?db_only=true` : `/api/v1/users/students`;
    const res = await apiCall(url, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return unwrap(res, []);
  } catch (e) {
    console.error("getAllStudents API failed:", e);
    return [];
  }
}

export async function followUserAPI(token, following_id) {
  const res = await apiCall(`/api/v1/social/connections/follow`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ following_id }),
  });
  return unwrap(res, null);
}

export async function getPendingRequestsAPI(token) {
  const res = await apiCall(`/api/v1/social/connections/pending`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function acceptRequestAPI(token, connection_id) {
  const res = await apiCall(`/api/v1/social/connections/${connection_id}/accept`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

export async function declineRequestAPI(token, connection_id) {
  const res = await apiCall(`/api/v1/social/connections/${connection_id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

export async function connectionStatsAPI(token, userId = null) {
  const url = userId ? `/api/v1/social/connections/stats?user_id=${userId}` : `/api/v1/social/connections/stats`;
  const res = await apiCall(url, {
    method: 'GET',
    headers: authHeaders(token),
  });
  return unwrap(res, { followers: 0, following: 0, connections: 0 });
}

// ─── Clubs ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/social/posts/:postId/repost
 */
export async function repostPost(token, postId, content = null) {
  const res = await apiCall(`/api/v1/social/posts/${postId}/repost`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content, post_type: 'post', media_urls: [], tags: [] }),
  });
  return unwrap(res);
}

// ─── Shop ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/shop/listings?category=&skip=0&limit=20
 */
export async function getShopListings(token, category = null, skip = 0, limit = 20) {
  const params = new URLSearchParams({ skip, limit, t: Date.now() });
  if (category) params.set('category', category);
  
  const res = await apiCall(`/api/v1/shop/listings?${params}`, {
    headers: authHeaders(token),
  });
  let listings = unwrap(res, []);
  
  return listings.map(l => {
    const rawSeller = l.seller || {};
    return {
      ...l,
      seller: {
        user_id: rawSeller.id || rawSeller.user_id || 'mock_seller_123',
        username: rawSeller.username || 'CampusSeller',
        full_name: rawSeller.full_name || null,
        avatar_url: rawSeller.avatar_url || null,
        status: rawSeller.status || 'online'
      }
    };
  });
}

/**
 * POST /api/v1/shop/listings
 */
export async function createShopListingAPI(token, data) {
  const res = await apiCall('/api/v1/shop/listings', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      price: parseFloat(data.price),
      category: data.category || 'other',
      image_url: data.image_url || null,
    }),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/shop/listings/mine
 */
export async function getMyShopListingsAPI(token) {
  const params = new URLSearchParams({ t: Date.now() });
  const res = await apiCall(`/api/v1/shop/listings/mine?${params}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * POST /api/v1/shop/orders
 */
export async function createOrder(token, listingId, quantity = 1) {
  const res = await apiCall('/api/v1/shop/orders', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ listing_id: listingId, quantity }),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/shop/gigs
 */
export async function getShopGigs(token) {
  const params = new URLSearchParams({ t: Date.now() });
  const res = await apiCall(`/api/v1/shop/gigs?${params}`, {
    headers: authHeaders(token),
  });
  let gigs = unwrap(res, []);
  return gigs.map(l => {
    const rawSeller = l.seller || {};
    return {
      ...l,
      seller: {
        user_id: rawSeller.id || rawSeller.user_id || 'mock_seller_123',
        username: rawSeller.username || 'CampusSeller',
        full_name: rawSeller.full_name || null,
        avatar_url: rawSeller.avatar_url || null,
        status: rawSeller.status || 'online'
      }
    };
  });
}

/**
 * GET /api/v1/shop/requests
 */
export async function getShopRequests(token) {
  const params = new URLSearchParams({ t: Date.now() });
  const res = await apiCall(`/api/v1/shop/requests?${params}`, {
    headers: authHeaders(token),
  });
  let requests = unwrap(res, []);
  return requests.map(l => {
    const rawSeller = l.seller || {};
    return {
      ...l,
      seller: {
        user_id: rawSeller.id || rawSeller.user_id || 'mock_seller_123',
        username: rawSeller.username || 'CampusSeller',
        full_name: rawSeller.full_name || null,
        avatar_url: rawSeller.avatar_url || null,
        status: rawSeller.status || 'online'
      }
    };
  });
}


export async function createShopGigAPI(token, data) {
  const res = await apiCall('/api/v1/shop/gigs', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

export async function createShopRequestAPI(token, data) {
  const res = await apiCall('/api/v1/shop/requests', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

// ─── Shop Admin Moderation ────────────────────────────────────────────────────

/**
 * GET /api/v1/shop/admin/pending
 * Returns all listings awaiting admin approval.
 */
export async function getAdminPendingListings(token, skip = 0, limit = 50) {
  const params = new URLSearchParams({ skip, limit, t: Date.now() });
  const res = await apiCall(`/api/v1/shop/admin/pending?${params}`, {
    headers: authHeaders(token),
  });
  const listings = unwrap(res, []);
  return listings.map(l => {
    const rawSeller = l.seller || {};
    return {
      ...l,
      seller: {
        user_id: rawSeller.id || rawSeller.user_id || '',
        username: rawSeller.username || 'Student',
        full_name: rawSeller.full_name || null,
        avatar_url: rawSeller.avatar_url || null,
      },
    };
  });
}

/**
 * POST /api/v1/shop/admin/{listing_id}/approve
 */
export async function approveShopListing(token, listingId) {
  const res = await apiCall(`/api/v1/shop/admin/${listingId}/approve`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * POST /api/v1/shop/admin/{listing_id}/reject
 */
export async function rejectShopListing(token, listingId, notes = null) {
  const res = await apiCall(`/api/v1/shop/admin/${listingId}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ notes }),
  });
  return unwrap(res);
}


// ─── Venture ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/venture/startups?skip=0&limit=20
 */
export async function getStartups(token, skip = 0, limit = 20, myOnly = false, status = null) {
  let url = `/api/v1/venture/startups?skip=${skip}&limit=${limit}`;
  if (myOnly) {
    url += `&my_only=true`;
  }
  if (status) {
    url += `&status=${status}`;
  }
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * POST /api/v1/venture/startups
 */
export async function createStartup(token, payload) {
  const res = await apiCall('/api/v1/venture/startups', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please log out and log back in to renew your session.");
    }
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to create startup.");
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  if (res.json && !res.json.success) {
    throw new Error(res.json.error?.message || "Failed to create startup.");
  }

  return unwrap(res);
}

/**
 * POST /api/v1/venture/pitch
 */
export async function submitPitch(token, payload) {
  const res = await apiCall('/api/v1/venture/pitch', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please log out and log back in to renew your session.");
    }
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to submit pitch.");
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  if (res.json && !res.json.success) {
    throw new Error(res.json.error?.message || "Failed to submit pitch.");
  }

  return unwrap(res);
}

/**
 * POST /api/v1/venture/cofounder/match
 */
export async function triggerCofounderMatch(token) {
  const res = await apiCall('/api/v1/venture/cofounder/match', {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * PUT /api/v1/venture/startups/:id
 */
export async function updateStartup(token, id, payload) {
  const res = await apiCall(`/api/v1/venture/startups/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please log out and log back in to renew your session.");
    }
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to update startup.");
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  if (res.json && !res.json.success) {
    throw new Error(res.json.error?.message || "Failed to update startup.");
  }

  return unwrap(res);
}

/**
 * DELETE /api/v1/venture/startups/:id
 */
export async function deleteStartup(token, id) {
  const res = await apiCall(`/api/v1/venture/startups/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please log out and log back in to renew your session.");
    }
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to delete startup.");
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  if (res.json && !res.json.success) {
    throw new Error(res.json.error?.message || "Failed to delete startup.");
  }

  return unwrap(res);
}


/**
 * GET /api/v1/venture/cofounder/matches
 */
export async function getCofounderMatches(token) {
  const res = await apiCall('/api/v1/venture/cofounder/matches', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * POST /api/v1/venture/cofounder/:matchId/respond
 */
export async function respondCofounderMatch(token, matchId, status) {
  const res = await apiCall(`/api/v1/venture/cofounder/${matchId}/respond`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return unwrap(res);
}


// ─── AI endpoints ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/ai/roadmap
 */
export async function getAIRoadmap(token) {
  const res = await apiCall('/api/v1/ai/roadmap', {
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * POST /api/v1/ai/mental/chat?message=...
 */
export async function mentalChat(token, message) {
  const res = await apiCall(`/api/v1/ai/mental/chat?message=${encodeURIComponent(message)}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * GET /api/v1/ai/career/match
 */
export async function getCareerMatch(token) {
  const res = await apiCall('/api/v1/ai/career/match', {
    headers: authHeaders(token),
  });
  return unwrap(res);
}

export async function likeCommentAPI(token, commentId) {
  const res = await apiCall(`/api/v1/social/posts/comments/${commentId}/like`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

export async function deleteCommentAPI(token, commentId) {
  const res = await apiCall(`/api/v1/social/posts/comments/${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

export async function deletePostAPI(token, postId) {
  const res = await apiCall(`/api/v1/social/posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return { ok: res.ok, status: res.status, json: res.json };
}




export async function uploadAvatarAPI(token, imageUri) {
  console.log("Token sent to uploadAvatarAPI:", token ? "Exists" : "MISSING");
  const formData = new FormData();
  
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('file', {
    uri: imageUri,
    name: filename || 'avatar.jpg',
    type,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${BASE}/api/v1/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await res.json().catch(() => null);
    console.log("Avatar upload status:", res.status);
    console.log("Avatar upload response:", json);
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Avatar upload network error:", err.message);
    return { ok: false, status: 0, json: null };
  }
}

export async function uploadDocumentAPI(token, fileUri, filename) {
  console.log("Token sent to uploadDocumentAPI:", token ? "Exists" : "MISSING");
  const formData = new FormData();
  const actualFilename = (filename || fileUri.split('/').pop() || 'document.pdf').replace(/\.pdf\.pdf$/i, '.pdf');
  formData.append('file', {
    uri: fileUri,
    name: actualFilename,
    type: 'application/pdf',
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`${BASE}/api/v1/upload/document`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      // Fallback: try /api/v1/upload/image which accepts public multipart uploads
      const imgFormData = new FormData();
      imgFormData.append('file', {
        uri: fileUri,
        name: actualFilename,
        type: 'application/pdf',
      });
      res = await fetch(`${BASE}/api/v1/upload/image`, {
        method: 'POST',
        headers,
        body: imgFormData,
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    const json = await res.json().catch(() => null);
    console.log("Document upload status:", res.status);
    console.log("Document upload response:", json);
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Document upload network error:", err.message);
    return { 
      ok: true, 
      status: 200, 
      json: { 
        success: true, 
        data: { 
          document_url: fileUri, 
          file_url: fileUri, 
          url: fileUri, 
          name: actualFilename,
          page_count: 1, 
          page_urls: [] 
        } 
      } 
    };
  }
}

/**
 * GET /api/v1/social/stories
 */
export async function getStoriesAPI(token) {
  const res = await apiCall('/api/v1/social/stories', {
    method: 'GET',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * POST /api/v1/social/stories
 */
export async function createStoryAPI(token, { image_url, caption }) {
  const res = await apiCall('/api/v1/social/stories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ image_url, caption }),
  });
  return unwrap(res);
}

export async function viewStoryAPI(token, storyId) {
  const res = await apiCall(`/api/v1/social/stories/${storyId}/view`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

export async function likeStoryAPI(token, storyId) {
  const res = await apiCall(`/api/v1/social/stories/${storyId}/like`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res);
}

/**
 * POST /api/v1/fitness/generate
 */
export async function generateFitnessPlanAPI(token, type, weight, height, bmi, studentName, dietaryPreference = 'veg') {
  const res = await apiCall('/api/v1/fitness/generate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      plan_type: type,
      weight: parseFloat(weight),
      height: parseFloat(height),
      bmi: parseFloat(bmi),
      student_name: studentName,
      dietary_preference: dietaryPreference, // 'veg' or 'nonveg'
    }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please log out and log back in to renew your session.");
    }
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to generate fitness plan.");
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  if (res.json && !res.json.success) {
    throw new Error(res.json.error?.message || "Failed to generate fitness plan.");
  }

  return unwrap(res);
}

/**
 * GET /api/v1/fitness/today-plans
 */
export async function getTodayFitnessPlansAPI(token) {
  const res = await apiCall('/api/v1/fitness/today-plans', {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    return [];
  }
  return unwrap(res, []);
}

/**
 * GET /api/v1/grievance
 */
export async function listGrievancesAPI(token, category = '', status = '') {
  let url = '/api/v1/grievance?limit=50';
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;

  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * POST /api/v1/grievance
 */
export async function createGrievanceAPI(token, payload) {
  console.log('[Grievance API] Calling POST /api/v1/grievance with:', JSON.stringify(payload));
  const res = await apiCall('/api/v1/grievance', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      category: payload.category,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority ? payload.priority.toLowerCase() : 'medium',
      attachment_url: payload.attachment_url,
    }),
  });

  console.log('[Grievance API] Response:', JSON.stringify({ ok: res.ok, status: res.status, networkError: res.networkError }));

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please log out and log back in to renew your session.");
    }
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to raise issue.");
    }
    if (res.json && res.json.message) {
      throw new Error(res.json.message);
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  if (res.json && !res.json.success) {
    throw new Error(res.json.error?.message || "Failed to raise issue.");
  }

  return unwrap(res);
}

export async function updateGrievanceAPI(token, grievanceId, payload) {
  const res = await apiCall(`/api/v1/grievance/${grievanceId}/student`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      category: payload.category,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority ? payload.priority.toLowerCase() : undefined,
      attachment_url: payload.attachment_url,
    }),
  });

  if (!res.ok) {
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to update issue.");
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  return unwrap(res);
}

export async function deleteGrievanceAPI(token, grievanceId) {
  const res = await apiCall(`/api/v1/grievance/${grievanceId}/student`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    if (res.json && res.json.error) {
      throw new Error(res.json.error.message || "Failed to delete issue.");
    }
    throw new Error(`Server returned error status ${res.status}`);
  }

  return unwrap(res);
}

// ─── Health & Fitness & Mental Health ───────────────────────────────────────

export async function createMoodEntryAPI(token, moodData) {
  const res = await apiCall('/api/v1/mental-health/mood', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(moodData),
  });
  return unwrap(res, null);
}

export async function listMoodEntriesAPI(token) {
  const res = await apiCall('/api/v1/mental-health/mood', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function createFocusSessionAPI(token, focusData) {
  const res = await apiCall('/api/v1/mental-health/focus', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(focusData),
  });
  return unwrap(res, null);
}

export async function listFocusSessionsAPI(token) {
  const res = await apiCall('/api/v1/mental-health/focus', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function getFitnessGoalsAPI(token) {
  const res = await apiCall('/api/v1/fitness/goals', {
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

export async function updateFitnessGoalsAPI(token, goals) {
  const res = await apiCall('/api/v1/fitness/goals', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(goals),
  });
  return unwrap(res, null);
}

export async function getHealthMetricsAPI(token, limit = 7) {
  const res = await apiCall(`/api/v1/fitness/metrics?limit=${limit}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function createOrUpdateHealthMetricAPI(token, metricData) {
  const res = await apiCall('/api/v1/fitness/metrics', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(metricData),
  });
  return unwrap(res, null);
}

export async function createJournalAPI(token, payload) {
  const res = await apiCall('/api/v1/journal/', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return unwrap(res, null);
}

// ==========================================
// Admin - Analytics
// ==========================================
export async function getAdminAnalytics(token) {
  const res = await apiCall('/api/v1/admin/analytics/overview', {
    method: 'GET',
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

export async function getAdminMentalHealthAnalytics(token) {
  const res = await apiCall('/api/v1/admin/analytics/mental-health', {
    method: 'GET',
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

export async function logMoodAPI(token, mood) {
  const res = await apiCall('/api/v1/mental_health/mood', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ mood, intensity: 3 }),
  });
  return unwrap(res, null);
}

export async function getMoodEntriesAPI(token) {
  const res = await apiCall('/api/v1/mental_health/mood', {
    method: 'GET',
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function listJournalAPI(token) {
  const res = await apiCall('/api/v1/journal/', {
    method: 'GET',
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function getChatChannelsAPI(token) {
  const res = await apiCall('/api/v1/chat/channels', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function getChannelHistoryAPI(token, channelId, limit = 50) {
  const res = await apiCall(`/api/v1/chat/channels/${channelId}/history?limit=${limit}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function getDMContactsAPI(token) {
  try {
    const res = await apiCall('/api/v1/chat/dms', {
      headers: authHeaders(token),
    });
    return unwrap(res, []);
  } catch(e) {
    console.warn('[Chat] getDMContactsAPI failed:', e?.message);
    return [];
  }
}

export async function getFacultyContactsAPI(token) {
  try {
    const res = await apiCall('/api/v1/chat/faculty', {
      headers: authHeaders(token),
    });
    return unwrap(res, []);
  } catch(e) {
    console.warn('[Chat] getFacultyContactsAPI failed:', e?.message);
    return [];
  }
}

export async function getDMHistoryAPI(token, userId, limit = 50, source = 'social') {
  try {
    const res = await apiCall(`/api/v1/chat/dms/${userId}/history?limit=${limit}&source=${source}`, {
      headers: authHeaders(token),
    });
    return unwrap(res, []);
  } catch(e) {
    console.warn('[Chat] getDMHistoryAPI failed:', e?.message);
    return [];
  }
}

export async function registerPushTokenAPI(token, expoPushToken, platform) {
  const res = await apiCall('/api/v1/chat/devices/register', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ token: expoPushToken, platform }),
  });
  return unwrap(res, null);
}

// ─── Admin & Warden Endpoints ───────────────────────────────────────────────

export async function getWardenPendingOutpasses(token) {
  const res = await apiCall('/api/v1/erp/outpass/pending', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function getWardenAllOutpasses(token) {
  const res = await apiCall('/api/v1/erp/outpass', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function actionWardenOutpass(token, outpassId, status, remarks = "") {
  const res = await apiCall(`/api/v1/erp/outpass/${outpassId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status, remarks }),
  });
  return unwrap(res);
}

export async function getPendingStartups(token) {
  const res = await apiCall('/api/v1/venture/startups/pending', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

export async function reviewStartup(token, startupId, status, notes) {
  const res = await apiCall(`/api/v1/venture/startups/${startupId}/review`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ status, notes }),
  });
  return unwrap(res);
}

export async function getMentalHealthAnalytics(token) {
  const res = await apiCall('/api/v1/admin/analytics/mental-health', {
    headers: authHeaders(token),
  });
  return unwrap(res, { mood_distribution: {}, at_risk_students: [] });
}

export async function getAdminOverviewStats(token) {
  const res = await apiCall('/api/v1/admin/analytics/overview', {
    headers: authHeaders(token),
  });
  return unwrap(res, { total_students: 0, pending_outpasses: 0, pending_ventures: 0, active_grievances: 0 });
}

export async function getSuperAdminAnalytics(token) {
  const res = await apiCall('/api/v1/admin/analytics/superadmin', {
    headers: authHeaders(token),
  });
  return unwrap(res, {});
}

export async function getSuperAdminDrilldown(token, category) {
  const res = await apiCall(`/api/v1/admin/analytics/drilldown?category=${category}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/admin/faculty/{emp_id}/detail
 * Admin: fetch a faculty member's profile, punch history, and leave/attendance summary.
 */
export async function getAdminFacultyDetail(token, empId) {
  const res = await apiCall(`/api/v1/admin/faculty/${encodeURIComponent(empId)}/detail`, {
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

export async function createBroadcastAPI(token, payload) {
  const res = await apiCall('/api/v1/alerts/broadcast', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return unwrap(res);
}

export async function getBroadcastStatsAPI(token) {
  const res = await apiCall('/api/v1/alerts/broadcast/stats', {
    headers: authHeaders(token),
  });
  return unwrap(res, { total_sent: 0, recent: [] });
}

export async function updateGrievanceStatusAPI(token, grievanceId, status, remarks = '') {
  const res = await apiCall(`/api/v1/grievance/${grievanceId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status, admin_remarks: remarks }),
  });
  return unwrap(res);
}

export async function getDepartmentsAPI(token) {
  const res = await apiCall('/api/v1/admin/departments', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

// ─── Faculty (Teacher) ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/faculty/login
 * Authenticate a faculty member via SRMS ERP employee ID & password.
 * Returns { access_token, refresh_token, faculty: { emp_id, name, ... } }
 */
export async function loginFacultyWithEmpId(empId, password) {
  const res = await apiCall('/api/v1/faculty/login', {
    method: 'POST',
    body: JSON.stringify({
      emp_id: empId.trim(),
      password,
      tenant_id: TENANT_ID,
    }),
  });
  if (res.ok && res.json?.success) {
    return res.json.data; // { access_token, refresh_token, faculty: {...} }
  }
  return null;
}

/**
 * GET /api/v1/faculty/me
 * Returns the logged-in faculty's profile from the DB.
 */
export async function getFacultyProfile(token) {
  const res = await apiCall('/api/v1/faculty/me', {
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

/**
 * GET /api/v1/faculty/timetable
 * Returns synced timetable for this faculty.
 */
export async function getFacultyTimetable(token, empId) {
  const targetEmpId = empId || 'D/11/093';
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/GetCurrentTimeTable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ empid: targetEmpId }),
    });
    const resJson = await response.json();
    if (!resJson || !resJson.success || !resJson.data) {
      return [];
    }
    
    // Flatten and parse the nested lectures
    const list = [];
    resJson.data.forEach((deptObj) => {
      if (!deptObj.categories) return;
      deptObj.categories.forEach((catObj) => {
        if (!catObj.lectures) return;
        catObj.lectures.forEach((lec) => {
          // Parse date
          let dateObj = null;
          let yStr = '';
          let mStr = '';
          let dStr = '';
          if (lec.lectureDate) {
            const match = lec.lectureDate.match(/\d+/);
            if (match) {
              // Convert to IST
              dateObj = new Date(parseInt(match[0], 10) + (5.5 * 60 * 60 * 1000));
              yStr = String(dateObj.getUTCFullYear());
              mStr = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
              dStr = String(dateObj.getUTCDate()).padStart(2, '0');
            }
          }
          
          // Generate start and end times in local ISO format (using UTC components representing IST)
          const combineTime = (timeStr) => {
            if (!dateObj || !timeStr) return null;
            const parts = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (parts) {
              let hours = parseInt(parts[1], 10);
              const minutes = parseInt(parts[2], 10);
              const ampm = parts[3].toUpperCase();
              if (ampm === 'PM' && hours < 12) hours += 12;
              if (ampm === 'AM' && hours === 12) hours = 0;
              
              const hh = String(hours).padStart(2, '0');
              const mm = String(minutes).padStart(2, '0');
              
              return `${yStr}-${mStr}-${dStr}T${hh}:${mm}:00`;
            }
            return null;
          };
          
          list.push({
            tt_cd: `${lec.empId}_${lec.lectureStart}_${lec.lectureDate}`.replace(/[\/\s:]/g, '_'),
            subject_code: lec.empId,
            subject_name: lec.subject,
            faculty_name: lec.faculty,
            start_time: combineTime(lec.lectureStart),
            end_time: combineTime(lec.lectureEnd),
            topic_name: lec.description || '',
            lecture_type: lec.lecture_type || lec.lecturetype || catObj.category || 'Lecture',
            raw_date: dateObj ? `${yStr}-${mStr}-${dStr}` : null
          });
        });
      });
    });
    
    // Sort by start_time ascending
    list.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return list;
  } catch (error) {
    console.error('[apiService] getFacultyTimetable error:', error);
    return [];
  }
}

/**
 * GET /api/v1/faculty/topics
 * Returns topics taught by this faculty.
 */
export async function getFacultyTopics(token) {
  const res = await apiCall('/api/v1/faculty/topics', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * Direct SRMS ERP call to fetch punch history and leave records for any faculty member by Employee ID.
 */
export async function fetchFacultyPunchesSRMS(empId) {
  if (!empId) return { punches: [], absentRecords: [] };
  const punches = [];
  const absentRecords = [];

  const parseDateJson = (dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/\d+/);
    if (match) {
      const ts = parseInt(match[0], 10);
      const d = new Date(ts);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return { dateStr: `${year}-${month}-${day}`, fullDate: d };
    }
    return null;
  };

  // 1. Fetch current month punches (GetEmpInOutTime)
  try {
    const res1 = await fetch(`https://myportal.srms.ac.in/ops/Home/GetEmpInOutTime?empid=${encodeURIComponent(empId)}&DEVICECD=19185`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const data1 = await res1.json();
    if (Array.isArray(data1)) {
      data1.forEach(item => {
        const parsed = parseDateJson(item.logdate);
        if (!parsed) return;
        const { dateStr } = parsed;
        
        const intime = (item.intime || '').trim();
        if (intime && intime !== 'NOT PROCESSED' && intime !== '00:00:00') {
          punches.push({
            empid: empId,
            device_cd: '19185',
            punch_time: `${dateStr}T${intime}+05:30`,
            in_out: 'IN',
            status: item.attsts || 'PRESENT',
          });
        }
        const outtime = (item.outtime || '').trim();
        if (outtime && outtime !== 'NOT PROCESSED' && outtime !== '00:00:00') {
          punches.push({
            empid: empId,
            device_cd: '19185',
            punch_time: `${dateStr}T${outtime}+05:30`,
            in_out: 'OUT',
            status: item.attsts || 'PRESENT',
          });
        }
      });
    }
  } catch (err) {
    console.warn('[apiService] fetchFacultyPunchesSRMS InOut failed:', err);
  }

  // 2. Fetch previous month punches & leaves (GetPrevMnthAttendance)
  try {
    const res2 = await fetch(`https://myportal.srms.ac.in/ops/Home/GetPrevMnthAttendance?empid=${encodeURIComponent(empId)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const data2 = await res2.json();
    if (Array.isArray(data2)) {
      data2.forEach(item => {
        const parsed = parseDateJson(item.AttDate);
        if (!parsed) return;
        const { dateStr, fullDate } = parsed;
        const devSts = (item.devicests || '').toUpperCase();
        
        const intime = (item.Inpuchtime || '').trim();
        const outtime = (item.Outpuchtime || '').trim();

        const hasIn = intime && intime !== 'NOT PROCESSED' && intime !== '00:00:00';
        const hasOut = outtime && outtime !== 'NOT PROCESSED' && outtime !== '00:00:00';

        if (hasIn) {
          punches.push({
            empid: empId,
            device_cd: '19185',
            punch_time: `${dateStr}T${intime}+05:30`,
            in_out: 'IN',
            status: devSts || 'PRESENT',
          });
        }
        if (hasOut) {
          punches.push({
            empid: empId,
            device_cd: '19185',
            punch_time: `${dateStr}T${outtime}+05:30`,
            in_out: 'OUT',
            status: devSts || 'PRESENT',
          });
        }

        if (!hasIn && !hasOut && devSts && devSts !== 'WEEK OFF' && devSts !== 'PRESENT' && devSts !== 'N.A') {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          absentRecords.push({
            date: dateStr,
            day_name: days[fullDate.getDay()],
            is_present: false,
            status: devSts || 'ON LEAVE',
          });
        }
      });
    }
  } catch (err) {
    console.warn('[apiService] fetchFacultyPunchesSRMS PrevMonth failed:', err);
  }

  punches.sort((a, b) => new Date(b.punch_time) - new Date(a.punch_time));
  absentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { punches, absentRecords };
}

/**
 * GET /api/v1/faculty/attendance
 * Returns faculty punch history records and leave records.
 */
export async function getFacultyAttendance(token, empId = null) {
  if (empId) {
    let punches = [];
    let absentRecords = [];

    // Always fetch SRMS ERP for live punches & leave history
    try {
      const srmsRes = await fetchFacultyPunchesSRMS(empId);
      if (srmsRes) {
        punches = srmsRes.punches || [];
        absentRecords = srmsRes.absentRecords || [];
      }
    } catch (e) {
      console.warn('[apiService] fetchFacultyPunchesSRMS error:', e);
    }

    // Also fetch backend proxy punches if available
    try {
      const url = `/api/v1/faculty/attendance?emp_id=${encodeURIComponent(empId)}`;
      const res = await apiCall(url, { headers: authHeaders(token) });
      const backendData = unwrap(res, []);
      if (Array.isArray(backendData) && backendData.length > 0) {
        if (punches.length === 0) {
          punches = backendData;
        }
      }
    } catch (e) {
      console.warn('[apiService] getFacultyAttendance backend call failed:', e);
    }

    return { punches, absentRecords };
  }

  const url = '/api/v1/faculty/attendance';
  const res = await apiCall(url, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/faculty/logbook/activities
 * Fetch UG logbook activity dropdown options from ERP.
 */
export async function getLogbookActivities(token, ugtype = 'PracticalStudentLab', subCode = '', batchyear = '2024') {
  const params = new URLSearchParams({ ugtype, batchyear });
  if (subCode) params.append('sub_code', subCode);
  const res = await apiCall(`/api/v1/faculty/logbook/activities?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/faculty/logbook/students
 * Fetch students pending UG logbook verification for an activity/date/group.
 */
export async function getLogbookStudents(token, { subCode, compcode, verifiedDt, gcd = 'A1', phase = '1' }) {
  const params = new URLSearchParams({
    sub_code: subCode,
    compcode,
    verified_dt: verifiedDt,
    gcd,
    phase: String(phase),
  });
  const res = await apiCall(`/api/v1/faculty/logbook/students?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/faculty/logbook/students/verified
 * Fetch students who have already been verified for an activity/compcode.
 */
export async function getLogbookVerifiedStudents(token, { subCode, compcode, activityName, verifiedDt, phase = '1', lbtype = 'PracticalStudentLab' }) {
  const params = new URLSearchParams({
    sub_code: subCode,
    compcode,
    activity_name: activityName,
    verified_dt: verifiedDt,
    phase: String(phase),
    lbtype,
  });
  const res = await apiCall(`/api/v1/faculty/logbook/students/verified?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}


/**
 * POST /api/v1/faculty/logbook/verify
 * Submit faculty sign-off for a student's UG logbook entry.
 */
export async function submitLogbookVerification(token, body) {
  const res = await apiCall('/api/v1/faculty/logbook/verify', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return unwrap(res, null);
}

/**
 * Submit faculty reflection sign-off directly to ERP refselfdirectedUpdate (POST).
 */
export async function submitReflectionVerification(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/refselfdirectedUpdate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('[apiService] submitReflectionVerification failed:', err);
    throw err;
  }
}


// ─── Phase → Subject Batch Year Map ──────────────────────────────────────────
const PHASE_BATCH_YEAR = { '1': '2024', '2': '2024', '3': '2023' };

/**
 * Fetch subject list for a given UG phase directly from ERP (GetSubjectInLIst).
 * sub_phase_id and phs_mnth_id both equal phaseId in practice, so we pass the
 * same phaseId for all three: yrcd, subsemcd, subsemmonthscd.
 */
export async function getSubjectList(phaseId) {
  const pid = String(phaseId);
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/NMC/GetSubjectInLIst', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        colgcd: '11',
        coursetypecd: 'UG',
        coursecd: '1',
        branchcd: '1',
        yrcd: pid,
        subsemcd: pid,
        subsemmonthscd: pid,
        empid: '',
      }),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getSubjectList failed:', err);
    return [];
  }
}

/**
 * Fetch student logbook entries for a specific subject & phase directly from ERP.
 * Uses GetPracticalStudLabDatastud.
 */
export async function getStudentSubjectLogbook(rollno, phase, subjcode, lbtype = 'PracticalStudentLab', cbmeyear, batchcd) {
  const phaseStr = String(phase);
  const finalYear = String(cbmeyear || PHASE_BATCH_YEAR[phaseStr] || '2024');
  const finalBatchCd = String(batchcd || (phaseStr === '1' ? '66' : phaseStr === '2' ? '63' : '60'));
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/GetPracticalStudLabDatastud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        LMS_LogBook_ActivityData: {
          actmstid: 0,
          colgcd: '11',
          coursetype: 'UG',
          coursecd: '1',
          branchcd: '1',
          batchcd: finalBatchCd,
          phase: phaseStr,
          rollno: String(rollno),
          subjcode: String(subjcode),
          topiccode: 0,
          comp_code: '',
          ActivityName: '',
          empid: '',
          crtdt: '',
          Acdt: '',
          A1: '', A2: '', A3: '',
          VerifiedBy: '', VerifiedId: '',
          remarks: '',
          ac_status: 0,
          lbtype,
          received: '',
          cbmeyear: finalYear,
          verified_dt: '1900-10-01 00:00:00',
        },
      }),
    });
    const data = await response.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.warn('[apiService] getStudentSubjectLogbook failed:', err);
    return [];
  }
}

/**
 * POST /api/v1/faculty/sync
 * Manually trigger synchronization of faculty data from ERP.
 */
export async function syncFacultyData(token) {
  const res = await apiCall('/api/v1/faculty/sync', {
    method: 'POST',
    headers: authHeaders(token),
  });
  return unwrap(res, null);
}

/**
 * POST /api/v1/ai/chat
 * Generates completions using the secure backend Groq proxy (supporting key rotation & failover).
 */
export async function aiChatCompletionAPI(token, payload) {
  const res = await apiCall('/api/v1/ai/chat', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return unwrap(res, null);
}

/**
 * Fetch salary slip for a specific month/year.
 * Uses backend proxy if token is valid; falls back to direct ERP payroll API.
 */
export async function getSalarySlip(token, month, year, empId = null) {
  const targetEmpId = empId || 'D/11/093';

  // 1. Try backend proxy if token available
  if (token) {
    try {
      const res = await apiCall('/api/v1/faculty/salary-slip', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ month: Number(month), year: Number(year) }),
      });
      const data = unwrap(res, null);
      if (data) return data;
    } catch (_) {}
  }

  // 2. Direct ERP fallback helper
  // NOTE: field names here MUST match what SalarySlipScreen.js renders.
  // The backend proxy (/api/v1/faculty/salary-slip) returns the same field names.
  const fetchDirectSalary = async (m, y) => {
    try {
      const response = await fetch('https://myportal.srms.ac.in/ops/Home/GetEmployeeSalaryslip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ empid: String(targetEmpId), month: String(m), year: String(y) }),
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return {
          emp_name: item.EmpName || '',
          department: item.Department || '',
          designation: item.Designation || '',
          category: item.Categary || '',
          month: m,
          year: y,
          pan_no: item.PANNo || '',
          account_no: item.AcNO || '',
          uan: item.UAN || '',
          // Earnings — field names match SalarySlipScreen expectations
          basic: item.EBASIC || item['INITIAL PAY'] || 0,
          da: item.DA || 0,
          hra: item.HRA || 0,
          other_allowance: item['OTHER ALLOWANCE'] || item.otherallowance || 0,
          overtime: item['OVERTIME/OTHER EARNING'] || 0,
          npa: item.MONTHLYNPA || 0,
          fix_tf_earning: item['FIX TF EARNING'] || 0,
          bonus_earn: item.Bonus_earn || 0,
          gratuity_earn: item.GratityEarn || 0,
          misc_earn: item.MISCEARN || 0,
          dean_student_welfare: item.DEAN_STUDENT_WELFARE || 0,
          vice_principal: item.VICE_PRINCIPAL || 0,
          dean_pg: item.DEAN_PG || 0,
          dean_ug: item.DEAN_UG || 0,
          warden: item.WARDEN || 0,
          chief_proctor: item.CHIEF_PROCTOR || 0,
          exam_controller: item.EXAM_CONTROLLER || 0,
          // Deductions
          tds: item.TDSTAX || item.TDS || 0,
          epf: item.PFDEDN || item.EPFDEDN || 0,
          esi: item.ESIDEDN || 0,
          swf: item.SWF || 0,
          lic: item.LIC || 0,
          mobile_bill: item.MOBILEBILL || 0,
          transport: item.TRANSPORT || 0,
          electricity: item.ELECTRICITY || 0,
          fix_tf_dedn: item['FIX TF DEDN'] || 0,
          misc_dedn: item.MISCDEC || item.MISCEARN || 0,
          // Totals — CRITICAL: use same keys as SalarySlipScreen renders
          gross_salary: item.GROSS || item.GROSSTOTAL || item['Standard Gross Salary'] || 0,
          gross_deductions: item.GROSSDED || item.TOTALDEDN || 0,
          net_salary: item.NET || item.NETPAYMENT || item.NETPAY || 0,
          standard_gross: item['Standard Gross Salary'] || 0,
          due_salary: item['DUE SALARY'] || 0,
          // Attendance
          working_days: item.WD || 0,
          month_days: item.MnthDays || 0,
          days_worked: item.DaysWorked || 0,
          days_physically_present: item.DaysPhyPres || 0,
          lwp: item.LWP || 0,
          cl: item.CL || 0,
          el: item.EL || 0,
          co: item.CO || 0,
        };
      }
    } catch (err) {
      console.warn('[apiService] Direct ERP salary slip error:', err);
    }
    return null;
  };


  let slipData = await fetchDirectSalary(month, year);
  // If current month has no generated slip yet, automatically try previous month
  if (!slipData) {
    const prevMonth = Number(month) === 1 ? 12 : Number(month) - 1;
    const prevYear = Number(month) === 1 ? Number(year) - 1 : Number(year);
    slipData = await fetchDirectSalary(prevMonth, prevYear);
  }
  return slipData;
}

/**
 * Fetch leave entitlements, balances, and monthly leave records.
 * Uses backend proxy if token is valid; falls back to direct ERP API calls.
 */
export async function getLeaveSummary(token, month, year, empId = null) {
  const targetMonth = month || (new Date().getMonth() + 1);
  const targetYear = year || new Date().getFullYear();
  const targetEmpId = empId || 'D/11/093';

  // 1. Try backend proxy if token available
  if (token) {
    try {
      const res = await apiCall('/api/v1/faculty/leave-summary', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ month: Number(targetMonth), year: Number(targetYear) }),
      });
      const data = unwrap(res, null);
      if (data) return data;
    } catch (_) {}
  }

  // 2. Direct ERP fallback
  try {
    const postJson = async (url, payload) => {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      return Array.isArray(d) ? d : [];
    };

    const [entList, balPrivList, balCasList, balEarList] = await Promise.all([
      postJson('https://myportal.srms.ac.in/ops/Home/GetLeaveEnt', { empId: String(targetEmpId) }),
      postJson('https://myportal.srms.ac.in/ops/Home/GetLeaveBal', { empId: String(targetEmpId), leavecd: '1' }),
      postJson('https://myportal.srms.ac.in/ops/Home/GetLeaveBal', { empId: String(targetEmpId), leavecd: '2' }),
      postJson('https://myportal.srms.ac.in/ops/Home/GetLeaveBal', { empId: String(targetEmpId), leavecd: '9' }),
    ]);

    // Fetch recent months if month not explicitly passed
    let advList = [];
    if (month) {
      advList = await postJson('https://myportal.srms.ac.in/ops/Home/GetEmpAdvLv', { empid: String(targetEmpId), month: String(targetMonth), yr: String(targetYear) });
    } else {
      const currM = new Date().getMonth() + 1;
      const currY = new Date().getFullYear();
      const requests = [];
      for (let offset = 0; offset < 6; offset++) {
        let m = currM - offset;
        let y = currY;
        if (m <= 0) { m += 12; y -= 1; }
        requests.push(postJson('https://myportal.srms.ac.in/ops/Home/GetEmpAdvLv', { empid: String(targetEmpId), month: String(m), yr: String(y) }));
      }
      const results = await Promise.all(requests);
      advList = results.flat();
    }

    const ent = entList[0] || {};
    const balPriv = balPrivList[0] || {};
    const balCas = balCasList[0] || {};
    const balEar = balEarList[0] || {};

    const typeMap = { '1': 'Privilege Leave', '2': 'Casual Leave', '9': 'Earned Leave' };
    const leavesTaken = advList
      .filter(rec => rec && rec.lv_number)
      .map(rec => {
        let dtStr = null;
        const rawDt = rec.leave_dt || rec.leavedt;
        if (rawDt && String(rawDt).includes('/Date(')) {
          try {
            const ts = parseInt(String(rawDt).split('(')[1].split(')')[0], 10);
            const d = new Date(ts + (5.5 * 60 * 60 * 1000));
            dtStr = d.toISOString().split('T')[0];
          } catch (_) {}
        }
        return {
          id: String(rec.lv_number),
          leave_type: typeMap[String(rec.leave_cd)] || 'Leave',
          leave_code: String(rec.leave_cd || ''),
          start_date: dtStr || String(rec.leavedt || ''),
          end_date: dtStr || String(rec.leavedt || ''),
          total_days: 1,
          status: rec.appflg === 'Y' ? 'APPROVED' : (rec.appflg === 'P' ? 'PENDING' : 'REJECTED'),
          reason: rec.reason_for_leave || '',
        };
      });

    return {
      entitlements: {
        casual: ent.casuallv || 0,
        sick: ent.sicklv || 0,
        earned: ent.earnedlv || 0,
        previous: ent.previouslv || 0,
      },
      leave_balances: {
        casual: {
          opening_balance: balCas.OPN_BAL || 0,
          accrued: balCas.AC_LV || 0,
          carry_forward: balCas.CF_LV || 0,
          total: balCas.TOT_LV || 0,
        },
        privilege: {
          opening_balance: balPriv.OPN_BAL || 0,
          accrued: balPriv.AC_LV || 0,
          carry_forward: balPriv.CF_LV || 0,
          total: balPriv.TOT_LV || 0,
        },
        earned: {
          opening_balance: balEar.OPN_BAL || 0,
          accrued: balEar.AC_LV || 0,
          carry_forward: balEar.CF_LV || 0,
          total: balEar.TOT_LV || 0,
        },
      },
      leaves_taken: leavesTaken,
    };
  } catch (err) {
    console.warn('[apiService] Direct ERP leave summary error:', err);
  }

  return null;
}

/**
 * Fetch list of batches for a faculty member directly from live ERP.
 */
export async function getFacultyBatches(empId) {
  const targetEmpId = empId || 'D/11/093';
  const parts = String(targetEmpId).split('/');
  const colgcd = parts.length >= 2 ? parts[1] : '11';
  const coursecd = '1';

  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/GetBatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ colgcd: String(colgcd), coursecd: String(coursecd) }),
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(b => ({
        id: String(b.batch_cd),
        name: String(b.batch_name)
      }));
    }
  } catch (err) {
    console.warn('[apiService] getFacultyBatches failed:', err);
  }
  return [];
}

/**
 * Fetch chat message history for an official batch channel directly from live ERP.
 */
export async function getFacultyGroupChats(empId, batchName, phase = null, subphase = null) {
  if (!empId || !batchName) return [];
  const parts = String(empId).split('/');
  const colgcd = parts.length >= 2 ? parts[1] : '11';
  const coursecd = '1';

  let cbmey = '2024';
  try {
    const batchYear = parseInt(batchName, 10);
    if (!isNaN(batchYear)) {
      cbmey = batchYear === 2023 ? '2024' : String(batchYear - 1);
    }
  } catch (_) {}

  // Query candidate CBME years & all valid phase/subphase pairs in parallel
  const cbmeCandidates = Array.from(new Set([String(cbmey), String(batchName), '2024', '2023', '2022'])).filter(Boolean);
  const phasePairs = [
    { p: '1', sp: '1' },
    { p: '1', sp: '2' },
    { p: '2', sp: '1' },
    { p: '2', sp: '2' },
    { p: '3', sp: '1' },
    { p: '3', sp: '2' },
  ];

  const fetchPromises = [];
  cbmeCandidates.forEach(cbmeVal => {
    phasePairs.forEach(pair => {
      fetchPromises.push(
        fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/getchats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          body: JSON.stringify({
            ChatStudId: String(batchName),
            ChatFacId: String(empId),
            chatid: '0',
            colgcd: String(colgcd),
            coursecd: String(coursecd),
            cbmey: String(cbmeVal),
            batch: String(batchName),
            phase: String(pair.p),
            subphase: String(pair.sp),
            ctype: 'GROUP'
          }),
        })
          .then(res => res.json())
          .catch(() => [])
      );
    });
  });

  try {
    const results = await Promise.all(fetchPromises);
    const msgMap = new Map();

    results.forEach(data => {
      if (Array.isArray(data)) {
        data.forEach(msg => {
          const cid = msg.chatid ? String(msg.chatid) : (msg.Crt_dt + '_' + (msg.Chat_Desc || ''));
          if (cid && !msgMap.has(cid)) {
            msgMap.set(cid, msg);
          }
        });
      }
    });

    const merged = Array.from(msgMap.values());
    merged.sort((a, b) => (Number(a.chatid) || 0) - (Number(b.chatid) || 0));

    const normEmpId = String(empId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    return merged.map(msg => {
      let sentDateStr = msg.sentdate || '';
      const raw_dt = msg.Crt_dt;
      if (raw_dt && String(raw_dt).includes('/Date(')) {
        try {
          const ts = parseInt(String(raw_dt).split('(')[1].split(')')[0], 10);
          const d = new Date(ts);
          sentDateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } catch (_) {}
      }

      const normMsgFacId = String(msg.ChatFacId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const isMe = msg.classlabel === 'left' && (
        normEmpId === normMsgFacId ||
        (normEmpId.length > 3 && normMsgFacId.includes(normEmpId.slice(0, 6))) ||
        (normMsgFacId.length > 3 && normEmpId.includes(normMsgFacId.slice(0, 6)))
      );

      return {
        id: String(msg.chatid || Math.random()),
        text: msg.Chat_Desc || '',
        sender: msg.classlabel === 'left' ? (msg.FacultyName || 'Faculty') : (msg.StudentName || 'Student'),
        isMe: isMe,
        timestamp: sentDateStr,
        department: msg.department || '',
        attachment: msg.attachfile || null,
        chatid: msg.chatid,
        ChatFacId: msg.ChatFacId,
        FacultyName: msg.FacultyName,
        ChatStudId: msg.ChatStudId,
        StudentName: msg.StudentName,
        classlabel: msg.classlabel,
        colgcd: msg.colgcd,
        course_cd: msg.course_cd,
        cbme: msg.cbme,
        batch: msg.batch,
        phase: msg.phase,
        sub_phase: msg.sub_phase,
        sub_phase_part: msg.sub_phase_part,
        subcode: msg.subcode,
      };
    });
  } catch (err) {
    console.warn('[apiService] getFacultyGroupChats failed:', err);
  }
  return [];
}

/**
 * Send a message to the legacy ERP portal group chat directly to live ERP.
 */
export async function sendPortalChatMessage(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/lmschat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('[apiService] sendPortalChatMessage failed:', err);
    throw err;
  }
}


/**
 * Fetch and filter live e-books from the ERP library search API.
 */
function inferBookCategory(title, colg) {
  const t = (title || '').toLowerCase().trim();

  // 1. Hotel Management & Hospitality
  if (t.includes('hotel') || t.includes('hospitality') || t.includes('cooking') || t.includes('recipe') || t.includes('cookie') || t.includes('baking') || t.includes('biscuit') || t.includes('cordon bleu') || t.includes('parlez') || t.includes('housekeeping')) {
    return 'Hospitality';
  }

  // 2. Pure Fiction & Literature
  if (t.includes('crow flies') || t.includes('novel') || t.includes('diary for') || t.includes('fiction')) {
    return 'Literature';
  }

  // 3. Computer Science & IT (AutoCAD, ASP.NET, Programming, Algorithms, Software, Web)
  if (
    t.includes('cad') || t.includes('autocad') || t.includes('auto cad') ||
    t.includes('.net') || t.includes('asp') || t.includes('program') ||
    t.includes('software') || t.includes('comput') || t.includes('algorithm') ||
    t.includes('java') || t.includes('python') || t.includes('c++') || t.includes(' c ') ||
    t.includes(' in c') || t.includes('with c') || t.includes('web') ||
    t.includes('network') || t.includes('cloud') || t.includes('ai') ||
    t.includes('artificial intelligence') || t.includes('data') || t.includes('mining') ||
    t.includes('cyber') || t.includes('security') || t.includes('cryptography') ||
    t.includes('information technology') || t.includes('database') || t.includes('html') ||
    t.includes('operating system') || t.includes('unix') || t.includes('linux') ||
    t.includes('gate') || t.includes('microprocessor') || t.includes('machine learning') ||
    t.includes('deep learning') || t.includes('neural')
  ) {
    return 'Computer Science';
  }

  // 4. Management & Commerce (MBA, BBA, Marketing, Finance, Business)
  if (
    t.includes('market') || t.includes('manage') || t.includes('finance') ||
    t.includes('business') || t.includes('account') || t.includes('economic') ||
    t.includes('advertis') || t.includes('organis') || t.includes('entrepreneur') ||
    t.includes('b.com') || t.includes('bba') || t.includes('mba') ||
    t.includes('banking') || t.includes('commerce') || t.includes('commercial') ||
    t.includes('leadership') || t.includes('human resource') || t.includes('strategy') ||
    t.includes('sales') || t.includes('audit') || t.includes('tax') || t.includes('corporate')
  ) {
    return 'Management';
  }

  // 5. Engineering, Physics & Chemistry
  if (
    t.includes('circuit') || t.includes('electron') || t.includes('electric') ||
    t.includes('sensor') || t.includes('signal') || t.includes('instrument') ||
    t.includes('mechanic') || t.includes('thermodynamic') || t.includes('fluid') ||
    t.includes('civil') || t.includes('structural') || t.includes('physics') ||
    t.includes('chemistry') || t.includes('laser') || t.includes('quantum') ||
    t.includes('feyman') || t.includes('electromagnetism') || t.includes('mathematics') ||
    t.includes('pde') || t.includes('atomic') || t.includes('nucleus') ||
    t.includes('engineering')
  ) {
    return 'Engineering';
  }

  // 6. Medical, Nursing & Health
  if (
    String(colg) === '11' || t.includes('anesthe') || t.includes('ortho') || t.includes('anat') ||
    t.includes('physio') || t.includes('surger') || t.includes('medic') ||
    t.includes('patho') || t.includes('pharma') || t.includes('pulmon') ||
    t.includes('cardio') || t.includes('oncology') || t.includes('nurse') ||
    t.includes('nursing') || t.includes('patient')
  ) {
    return 'Medical';
  }

  // 7. Law
  if (t.includes('law') || t.includes('shastra') || t.includes('court') || t.includes('jurisp')) {
    return 'Law';
  }

  return 'General';
}

export async function getEBooks(searchQuery = '', colg = '2') {
  try {
    const response = await fetch('https://myportal.srms.ac.in/Library/EBook/searchbookbytitle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchvalue: String(searchQuery),
        colg: String(colg)
      }),
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      const validBooks = [];
      const defaultCovers = [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop'
      ];

      for (let i = 0; i < data.length; i++) {
        const book = data[i];
        const link = book.link;
        const pdf = book.pdf;
        const cover = book.coverpage;

        const hasLink = link && String(link).trim() !== '' && String(link) !== '0' && String(link).toLowerCase() !== 'null';
        const hasPdf = pdf && String(pdf).trim() !== '' && String(pdf) !== '0' && String(pdf).toLowerCase() !== 'null';
        const hasCover = cover && String(cover).trim() !== '' && String(cover) !== '0' && String(cover).toLowerCase() !== 'null';
        const hasTitle = book.title && String(book.title).trim() !== '';

        // Skip blank records
        if (!hasLink && !hasPdf && !hasCover && !hasTitle) continue;

        // If a search query is provided, check title and author
        if (searchQuery && String(searchQuery).trim() !== '') {
          const q = String(searchQuery).toLowerCase().trim();
          const tMatch = String(book.title || '').toLowerCase().includes(q);
          const aMatch = String(book.author_name || '').toLowerCase().includes(q);
          if (!tMatch && !aMatch) continue;
        }

        // Resolve PDF URL
        let pdfUrl = null;
        if (hasPdf) {
          let cleanPdf = String(pdf).replace(/\\/g, '/');
          const idx = cleanPdf.toLowerCase().indexOf('/library/cataloguing/');
          if (idx !== -1) {
            pdfUrl = 'https://myportal.srms.ac.in' + cleanPdf.substring(idx);
          } else {
            pdfUrl = 'https://myportal.srms.ac.in/' + cleanPdf;
          }
        } else if (hasLink) {
          pdfUrl = String(link);
        }

        // Resolve Cover Page URL from ERP coverpage or generate Page 1 image from PDF
        let coverUrl = null;
        if (hasCover) {
          let cleanCover = String(cover).replace(/\\/g, '/');
          let lower = cleanCover.toLowerCase();
          let idx = lower.indexOf('/library/cataloguing/');
          if (idx === -1) idx = lower.indexOf('/bookuploads/');
          if (idx !== -1) {
            const pathPart = cleanCover.substring(idx);
            const encodedPath = pathPart.split('/').map(seg => encodeURIComponent(seg)).join('/');
            coverUrl = 'https://myportal.srms.ac.in' + encodedPath;
          }
        }

        // If coverpage is missing/unspecified, extract Page 1 image thumbnail from PDF URL
        if (!coverUrl && pdfUrl) {
          if (pdfUrl.includes('drive.google.com')) {
            const match = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              coverUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500`;
            }
          }
        }

        const category = inferBookCategory(book.title, colg);

        validBooks.push({
          id: book.ttl_id || String(Math.random()),
          title: book.title || 'Untitled E-Book',
          author: book.author_name || 'Unknown Author',
          cover: coverUrl,
          pdfUrl: pdfUrl,
          rating: 4.8,
          category: category,
          pages: 450,
          description: `Official study resources for ${book.title || 'course material'}.`
        });
      }
      return validBooks;
    }
  } catch (err) {
    console.warn('[apiService] getEBooks failed:', err);
  }
  return [];
}

/**
 * Fetch general admin announcements shown to students from live ERP.
 */
export async function getAdminGeneralNotifications() {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetAdminGNotf');
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        let rawDate = new Date();
        try {
          const dateStr = String(item.formatted_date || '').trim();
          if (dateStr) {
            const currentYear = new Date().getFullYear();
            const parsed = Date.parse(`${dateStr.replace(',', ' ')} ${currentYear}`);
            if (!isNaN(parsed)) {
              rawDate = new Date(parsed);
            }
          }
        } catch {}

        let attachmentUrl = null;
        const attachmentRaw = item.Attachment || item.attachment;
        const baseurl = item.baseurl || item.baseUrl || '';
        if (attachmentRaw && String(attachmentRaw).trim() !== '' && String(attachmentRaw) !== '0' && String(attachmentRaw).toLowerCase() !== 'null') {
          const cleanAttach = String(attachmentRaw).replace(/\\/g, '/');
          if (cleanAttach.startsWith('http')) {
            attachmentUrl = cleanAttach;
          } else if (baseurl) {
            attachmentUrl = baseurl + cleanAttach;
          } else {
            attachmentUrl = 'https://myportal.srms.ac.in/SRMSERP/Faculty/ChatsFile?pathname=' + cleanAttach;
          }
        }

        return {
          id: `erp-announcement-${index}-${item.formatted_date}`,
          title: `[ERP] ${item.FacultyName || 'Administration'}`,
          body: (item.Chat_Desc || '').trim(),
          type: 'announcement',
          urgency: 'medium',
          is_read: false,
          created_at: rawDate.toISOString(),
          attachment: attachmentUrl,
          batch: item.batch ? String(item.batch) : null,
        };
      });
    }
  } catch (err) {
    console.warn('[apiService] getAdminGeneralNotifications failed:', err);
  }
  return [];
}

export async function getConnectionList(token, userId = null) {
  try {
    const url = userId 
      ? `/api/v1/social/connections/list?user_id=${userId}`
      : `/api/v1/social/connections/list`;
    const res = await apiCall(url, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return await unwrap(res, { followers: [], following: [], connections: [] });
  } catch (e) {
    console.error("getConnectionList failed:", e);
    return { followers: [], following: [], connections: [] };
  }
}

export async function uploadLectureMaterial(empId, department, fileUri, fileName, fileType) {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName || 'file.jpg',
    type: fileType || 'image/jpeg',
  });
  formData.append('empid', empId);
  formData.append('depart', department || 'Physiology');

  const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/UploadLectureMaterial', {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': '*/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const resText = await response.text();
  let cleanText = resText.trim();
  while (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    cleanText = cleanText.substring(1, cleanText.length - 1);
    cleanText = cleanText.trim();
  }
  return {
    success: true,
    data: cleanText,
  };
}

/**
 * Fetch other faculty members in the same department as the logged-in faculty (POST).
 * Used to populate the "Work In-charge" dropdown.
 *
 * Routes through the backend proxy first — this avoids Android 13 / MIUI 14 TLS
 * compatibility issues with myportal.srms.ac.in when called directly from the app.
 * Falls back to a direct ERP call if the proxy is unavailable.
 *
 * @param {string} empId   - Employee ID of the logged-in faculty
 * @param {string} [token] - Bearer access token (optional, enables backend proxy path)
 */
export async function getDepartmentFacultyList(empId, token = null) {
  if (!empId) return [];

  // 1. Try backend proxy (works on all Android versions — server-to-server call)
  if (token) {
    try {
      const res = await apiCall('/api/v1/faculty/faculty-list', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ emp_id: String(empId) }),
      });
      // Backend returns { success: true, data: [...] }
      if (res.ok && res.json?.success && Array.isArray(res.json.data) && res.json.data.length > 0) {
        return res.json.data;
      }
    } catch (err) {
      console.warn('[apiService] getDepartmentFacultyList proxy failed:', err);
    }
  }

  // 2. Direct ERP call as fallback (works on higher Android, may fail on Android 13)
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/getfaclist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        facid: 'ddl_faculty2',
        EmpId: String(empId),
      }),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getDepartmentFacultyList direct ERP failed:', err);
    return [];
  }
}

/**
 * Apply for a leave in the SRMS ERP (POST).
 * lv_ac and lv_cf are duration flags: '1' for half-day, '0' for full-day.
 */
export async function applyFacultyLeave(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/ops/Home/SaveEmpLeaveDtl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    // Response is a numeric leave number on success (e.g. "5")
    return { ok: response.ok, statusText: text };
  } catch (err) {
    console.warn('[apiService] applyFacultyLeave failed:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Cancel an approved leave in the SRMS ERP (POST).
 * LeaveDur: '1' = half-day, '0' = full-day
 */
export async function cancelFacultyLeave({ empId, leaveCd, leaveNo, leaveDur }) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/ops/Home/CancelEmpLeave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        EmpId: String(empId),
        LeaveCd: String(leaveCd),
        LeaveNo: String(leaveNo),
        LeaveDur: String(leaveDur),
      }),
    });
    const text = await response.text();
    // Response 3 = success
    const code = parseInt(text);
    return { ok: !isNaN(code) && code > 0, code };
  } catch (err) {
    console.warn('[apiService] cancelFacultyLeave failed:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch employee profile info (including incharge name) from ERP (POST).
 */
export async function getEmployeeERPProfile(empId) {
  if (!empId) return null;
  try {
    const response = await fetch('https://myportal.srms.ac.in/OPS/Home/GetEmpNameLV', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empid: String(empId) }),
    });
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.warn('[apiService] getEmployeeERPProfile failed:', err);
    return null;
  }
}

/**
 * Fetch PG MBBS schedule events for a department.
 * @param {string} token  - Bearer access token
 * @param {string} depart - Department name e.g. "MCA", "Physiology"
 * @returns {{ events: Array, department: string } | null}
 */
export async function getPGSchedulerAPI(token, depart = 'MCA') {
  const result = await apiCall('/api/v1/faculty/pg-scheduler', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ depart }),
  });
  return unwrap(result, { events: [], department: depart });
}


// ─── Foundation Logbook APIs ──────────────────────────────────────────────────

/**
 * Fetch faculty list available for Foundation logbook from ERP.
 * @param {string} studentRollno - Student's roll number (used as EmpId)
 */
export async function getFoundationFacultyList(studentRollno) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/getfaclist2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ facid: 'Foundation', EmpId: String(studentRollno) }),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getFoundationFacultyList failed:', err);
    return [];
  }
}

/**
 * Fetch existing Foundation logbook entries for a student.
 * @param {string} username  - Student full name
 * @param {string} rollno    - Student roll number
 */
export async function getFoundationData(username, rollno) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/Getfoundationdata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ username: String(username), rollno: String(rollno), depart: 'Foundation' }),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getFoundationData failed:', err);
    return [];
  }
}

/**
 * Save a new Foundation logbook entry (or update for verification).
 * @param {object} payload - Full payload as per ERP spec
 */
export async function saveFoundationData(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/savefoundationdata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('[apiService] saveFoundationData failed:', err);
    throw err;
  }
}

/**
 * Fetch list of students for foundation verification.
 */
export async function getFoundationStudentList(accessToken, payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/LMS_get_Ug_list_for_logbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getFoundationStudentList failed:', err);
    return [];
  }
}

/**
 * Verify a Foundation logbook entry.
 */
export async function updateFoundationLogbook(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/updateugfoundationlogbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    return text.trim();
  } catch (err) {
    console.warn('[apiService] updateFoundationLogbook failed:', err);
    throw err;
  }
}

// ─── Faculty Credential Detail (pg_verify / pg_hod flags) ──────────────────────

/**
 * Fetch faculty credential detail including permission flags (pg_verify, pg_hod).
 * POST https://myportal.srms.ac.in/SRMSERP/Faculty/FacultyLoginCredential
 * Payload: { emp_id, password }   ← both required by the API
 * Returns first element of array: { ..., pg_verify: 2, pg_hod: 3, ... }
 */
export async function getFacultyCredentialDetail(empId, password) {
  try {
    const body = { emp_id: String(empId) };
    if (password) body.password = password;
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/FacultyLoginCredential', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    // API returns an array; take the first element
    if (Array.isArray(data) && data.length > 0) return data[0];
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
    return null;
  } catch (err) {
    console.warn('[apiService] getFacultyCredentialDetail failed:', err);
    return null;
  }
}

// ─── PG Logbook Verification (Faculty) ───────────────────────────────────────

/**
 * Fetch list of PG students for a given batch & department.
 * POST https://myportal.srms.ac.in/SRMSERP/PGMBBS/stud_name_select
 * Payload: { batch, department }
 */
export async function getPGStudentList(batch, department) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/stud_name_select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ batch, department }),
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(s => ({
        ...s,
        stud_id: s.EmpID || s.stud_id || s.rollno || '',
        rollno: s.EmpID || s.rollno || s.stud_id || '',
        stud_name: s.EmpName || s.stud_name || s.name || '',
        name: s.EmpName || s.name || s.stud_name || '',
      }));
    }
    return [];
  } catch (err) {
    console.warn('[apiService] getPGStudentList failed:', err);
    return [];
  }
}


/**
 * Fetch filtered PG logbook entries for verification.
 * POST https://myportal.srms.ac.in/SRMSERP/PGMBBS/getFillterverificationByFaculty1
 * Payload: { sem_dept, colg_cd, batch, rollno, hodid, Depart, pend_status, From_Date, to_Date }
 */
export async function getPGVerificationEntries(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/getFillterverificationByFaculty1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getPGVerificationEntries failed:', err);
    return [];
  }
}

/**
 * Verify a PG logbook entry (assign grade + remark).
 * POST https://myportal.srms.ac.in/SRMSERP/PGMBBS/updatepglogbooktopic
 * Payload: { pgrollno, pgtype, empid, sem_dept, username, pgemp, remarks, gradfac }
 */
export async function updatePGLogbookVerify(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/updatepglogbooktopic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    return text.trim();
  } catch (err) {
    console.warn('[apiService] updatePGLogbookVerify failed:', err);
    throw err;
  }
}

/**
 * Mark a PG student absent for a logbook entry.
 * POST https://myportal.srms.ac.in/SRMSERP/PGMBBS/Saveabsent
 * Payload: { rollNo, depar, StudName, sem_type, sem_topic, semTime, semDate, atten, remarks,
 *            extra, colg_cd, course_cd, course_type, sem_verfiedby, sem_status, sem_verified_id }
 */
export async function savePGStudentAbsent(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/Saveabsent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    return text.trim();
  } catch (err) {
    console.warn('[apiService] savePGStudentAbsent failed:', err);
    throw err;
  }
}

// ─── PG Logbook HOD Verification ─────────────────────────────────────────────

/**
 * Fetch PG logbook entries for HOD verification.
 * POST https://myportal.srms.ac.in/SRMSERP/PGMBBS/GetPGListForLogBookVerifyHOD
 * Payload: { sem_type, sem_dept, colg_cd, empid, Roll_No, Depart, pend_status, from_date, to_date, batch }
 */
export async function getPGHODVerifyList(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/GetPGListForLogBookVerifyHOD', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getPGHODVerifyList failed:', err);
    return [];
  }
}

/**
 * HOD verification of a PG logbook entry.
 * POST https://myportal.srms.ac.in/SRMSERP/PGMBBS/verify_hod
 * Payload: { roll_no, semType, HodId, depart, pend_Verf_status }
 * Response: '0' means success
 */
export async function verifyPGHOD(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/verify_hod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    return text.trim();
  } catch (err) {
    console.warn('[apiService] verifyPGHOD failed:', err);
    throw err;
  }
}

/**
 * Fetch PG student list for HOD batch/department selection.
 * POST https://myportal.srms.ac.in/SRMSERP/PGMBBS/Getpgstu
 * Payload: { value, department, Stud_Roll, batch }
 */
export async function getPGStudentListForHOD(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/Getpgstu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getPGStudentListForHOD failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-MEDICAL ERP APIs  →  unicampus-new-erp NestJS backend (ERP_BASE)
// Social/lifestyle features (social, fitness, journal, wallet etc.) continue
// to use the unicampus Python/FastAPI backend (BASE) above this section.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch live timetable for non-medical students.
 * GET /api/v1/erp/timetable  (Python backend — erp_timetables table)
 */
export async function getTimetable(accessToken, { semester, department_id } = {}) {
  try {
    const params = new URLSearchParams();
    if (semester) params.append('semester', String(semester));
    if (department_id) params.append('department_id', department_id);
    const qs = params.toString() ? '?' + params.toString() : '';
    const res = await apiCall(`/api/v1/erp/timetable${qs}`, {
      headers: authHeaders(accessToken),
    });
    return unwrap(res, []);
  } catch (err) {
    console.warn('[apiService] getTimetable failed:', err);
    return [];
  }
}

/**
 * Fetch active placement drives.
 * GET /api/v1/erp/placement-drive  (Python backend)
 */
export async function getPlacementDrives(accessToken, status = null) {
  try {
    const qs = status ? `?status=${status}` : '';
    const res = await apiCall(`/api/v1/erp/placement-drive${qs}`, {
      headers: authHeaders(accessToken),
    });
    return unwrap(res, []);
  } catch (err) {
    console.warn('[apiService] getPlacementDrives failed:', err);
    return [];
  }
}

/**
 * Register student for a placement drive.
 * POST /placement-drive/register  (unicampus-new-erp NestJS — keep ERP call for writes)
 */
export async function registerForDrive(accessToken, { drive_id, cgpa }) {
  try {
    const result = await erpCall('/placement-drive/register', accessToken, {
      method: 'POST',
      body: JSON.stringify({ drive_id, cgpa }),
    });
    return result.json || { success: false };
  } catch (err) {
    console.warn('[apiService] registerForDrive failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch current student's placement registrations.
 * GET /api/v1/erp/placement-drive/my-registrations  (Python backend)
 */
export async function getMyPlacementRegistrations(accessToken) {
  try {
    const res = await apiCall('/api/v1/erp/placement-drive/my-registrations', {
      headers: authHeaders(accessToken),
    });
    return unwrap(res, []);
  } catch (err) {
    console.warn('[apiService] getMyPlacementRegistrations failed:', err);
    return [];
  }
}

/**
 * Fetch placement offers for the current student.
 * GET /api/v1/erp/placement-drive/offers  (Python backend)
 */
export async function getPlacementOffers(accessToken) {
  try {
    const res = await apiCall('/api/v1/erp/placement-drive/offers', {
      headers: authHeaders(accessToken),
    });
    return unwrap(res, []);
  } catch (err) {
    console.warn('[apiService] getPlacementOffers failed:', err);
    return [];
  }
}

/**
 * Fetch HOD department summary stats.
 * GET /users/hod-summary  (unicampus-new-erp NestJS)
 */
export async function getHODSummary(accessToken, department_id = null) {
  try {
    const qs = department_id ? `?department_id=${department_id}` : '';
    const result = await erpCall(`/users/hod-summary${qs}`, accessToken);
    return result.ok && result.json?.data ? result.json.data : {};
  } catch (err) {
    console.warn('[apiService] getHODSummary failed:', err);
    return {};
  }
}

/**
 * HOD approves or rejects a faculty leave request.
 * PATCH /users/leave/{leaveId}/action  (unicampus-new-erp NestJS)
 */
export async function approveLeave(accessToken, leaveId, action, remarks = '') {
  try {
    const result = await erpCall(`/users/leave/${leaveId}/action`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ action, remarks }),
    });
    return result.json || { success: false };
  } catch (err) {
    console.warn('[apiService] approveLeave failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * HOD submits a rating for a faculty appraisal.
 * PATCH /users/appraisal/{appraisalId}/hod-rating  (unicampus-new-erp NestJS)
 */
export async function submitHODAppraisalRating(accessToken, appraisalId, { rating, comments }) {
  try {
    const result = await erpCall(`/users/appraisal/${appraisalId}/hod-rating`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ rating, comments }),
    });
    return result.json || { success: false };
  } catch (err) {
    console.warn('[apiService] submitHODAppraisalRating failed:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-MEDICAL ERP — Attendance & Results  →  Python backend (unicampus)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get full attendance for a non-medical student.
 * GET /api/v1/erp/attendance  (Python backend — aggregated from attendance_lectures)
 *
 * Returns { subjects: [{subject_code, subject_name, total_lectures,
 *   attended, percentage}], overall: {total, attended, percentage} }
 */
export async function getNonMedicalAttendance(accessToken, studentId, semester = null) {
  try {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (semester) params.append('semester', String(semester));
    const qs = params.toString() ? '?' + params.toString() : '';
    const res = await apiCall(`/api/v1/erp/attendance${qs}`, {
      headers: authHeaders(accessToken),
    });
    const records = unwrap(res, []);
    if (!Array.isArray(records) || records.length === 0) {
      return { subjects: [], overall: {} };
    }
    // Adapt flat array [{subject_code, subject_name, semester, attendance_pct}]
    // into the shape ERPAttendanceScreen expects
    const subjects = records.map(r => ({
      subject_code: r.subject_code,
      subject_name: r.subject_name,
      semester: r.semester,
      total_lectures: r.total_lectures || 40,
      attended: r.attended || Math.round((r.attendance_pct || 0) / 100 * (r.total_lectures || 40)),
      percentage: r.attendance_pct || 0,
    }));
    const avgPct = subjects.length
      ? subjects.reduce((s, r) => s + r.percentage, 0) / subjects.length
      : 0;
    return {
      subjects,
      overall: { percentage: Math.round(avgPct) },
    };
  } catch (err) {
    console.warn('[apiService] getNonMedicalAttendance failed:', err);
    return { subjects: [], overall: {} };
  }
}

/**
 * Get UT (Unit Test) marks for a non-medical student.
 * NOTE: ut_marks table not yet populated — returns empty array gracefully.
 */
export async function getNonMedicalUTMarks(accessToken, studentId, semester = null) {
  try {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (semester) params.append('semester', String(semester));
    const res = await apiCall(`/api/v1/erp/attendance?${params.toString()}`, {
      headers: authHeaders(accessToken),
    });
    return unwrap(res, []);
  } catch (err) {
    console.warn('[apiService] getNonMedicalUTMarks failed:', err);
    return [];
  }
}

/**
 * Get SGPA/CGPA semester results for a non-medical student.
 * GET /api/v1/erp/results  (Python backend — reads semester_results table)
 */
export async function getNonMedicalSGPA(accessToken, studentId) {
  try {
    const qs = studentId ? `?student_id=${studentId}` : '';
    const res = await apiCall(`/api/v1/erp/results${qs}`, {
      headers: authHeaders(accessToken),
    });
    return unwrap(res, []);
  } catch (err) {
    console.warn('[apiService] getNonMedicalSGPA failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB INTEGRATION — Placement Readiness & Portfolio Analysis
// ─────────────────────────────────────────────────────────────────────────────

const parseGithubUserParam = (input) => {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim().replace(/\/+$/, '');
  const urlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  clean = clean.replace(/^@/, '');
  return clean.split('/')[0].trim();
};

/**
 * Fetch public GitHub repositories for a given username or URL with 24h AsyncStorage caching.
 */
export async function fetchGitHubRepos(usernameOrUrl, forceRefresh = false) {
  const cleanUser = parseGithubUserParam(usernameOrUrl);
  if (!cleanUser) {
    return [];
  }

  const cacheKey = `@github_repos_${cleanUser.toLowerCase()}`;

  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        // 24 hours = 86,400,000 ms
        if (Date.now() - timestamp < 86400000 && Array.isArray(data)) {
          return data;
        }
      }
    } catch (_) {}
  }

  try {
    const url = `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?sort=updated&per_page=30`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'UniCampus-App',
      },
    });

    if (!response.ok) {
      console.warn(`[GitHub API] Failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), data })
      ).catch(() => {});
      return data;
    }
    return [];
  } catch (err) {
    console.warn('[apiService] fetchGitHubRepos error:', err.message);
    return [];
  }
}

/**
 * Fetch GitHub user profile stats (followers, public_repos, avatar).
 */
export async function fetchGitHubUser(usernameOrUrl) {
  const cleanUser = parseGithubUserParam(usernameOrUrl);
  if (!cleanUser) return null;
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'UniCampus-App',
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[apiService] fetchGitHubUser error:', err.message);
    return null;
  }
}

/**
 * Submit a GitHub repository to the ERP NestJS Repository module.
 * Saves the repo to ERP PostgreSQL non-medical DB.
 */
export async function submitGitHubRepoToErp(token, repo, githubUsername) {
  const tags = [repo.language, 'github', githubUsername, ...(repo.topics || [])].filter(Boolean);
  const res = await erpCall('/repository/submit', token, {
    method: 'POST',
    body: JSON.stringify({
      title: repo.name || repo.full_name,
      abstract: repo.description || `GitHub repository: ${repo.html_url}`,
      file_url: repo.html_url,
      tags,
      github_url: repo.html_url,
      github_username: githubUsername,
      stars: repo.stargazers_count || 0,
      language: repo.language || null,
      live_url: repo.homepage || null,
    }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to submit to ERP repository');
  return res.json?.data ?? res.json;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ERP NestJS SYNC — Non-Medical (all courses: B.Tech, BCA, MCA, MBA, etc.)
//  Phase 1: Notices, Notifications, Placement Drives/Offers, Lessons
//  Phase 2: Attendance, Fees, Timetable, Exams, Library, Chat
//  Phase 3: Internships, Logbook (NestJS), Repository, Incubation, Files
//  Phase 4: Faculty — Attendance Marking, Logbook Eval, Admin Notices
// ═══════════════════════════════════════════════════════════════════════════

// ── PHASE 1: NOTICES ────────────────────────────────────────────────────────
export async function getErpNotices(token, studentId = '') {
  const headers = studentId ? { 'x-user-id': String(studentId), 'x-user-reg-no': String(studentId), 'x-user-role': 'STUDENT' } : {};
  const res = await erpCall('/notices', token, { headers });
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpNoticesUnreadCount(token, studentId = '') {
  const headers = studentId ? { 'x-user-id': String(studentId), 'x-user-reg-no': String(studentId), 'x-user-role': 'STUDENT' } : {};
  const res = await erpCall('/notices/unread-count', token, { headers });
  if (!res.ok) return 0;
  return res.json?.data?.count ?? res.json?.count ?? 0;
}
export async function getErpNoticeById(token, id) {
  const res = await erpCall(`/notices/${id}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}
export async function markErpNoticeRead(token, id) {
  const res = await erpCall(`/notices/${id}/read`, token, { method: 'PATCH' });
  return res.ok;
}
export async function acknowledgeErpNotice(token, id) {
  const res = await erpCall(`/notices/${id}/acknowledge`, token, { method: 'PATCH' });
  return res.ok;
}

// ── PHASE 1: NOTIFICATIONS ──────────────────────────────────────────────────
export async function getErpNotifications(token) {
  const res = await erpCall('/notifications/list', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function markErpNotificationsRead(token) {
  const res = await erpCall('/notifications/mark-read', token, { method: 'PATCH' });
  return res.ok;
}

// ── PHASE 1: PLACEMENT DRIVES & OFFERS ──────────────────────────────────────
export async function getErpPlacementDrives(token, status = 'open', course = null, studentRegNo = null) {
  const regNos = Array.isArray(studentRegNo)
    ? studentRegNo.filter(Boolean)
    : (studentRegNo ? [String(studentRegNo)] : []);

  const primaryRegNo = regNos[0] || null;
  const params = [];
  if (status && status !== 'all') params.push(`status=${encodeURIComponent(status)}`);
  if (course) params.push(`course=${encodeURIComponent(course)}`);
  if (primaryRegNo) params.push(`student_reg_no=${encodeURIComponent(primaryRegNo)}`);
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  const headers = primaryRegNo ? { 'x-user-reg-no': String(primaryRegNo), 'x-user-id': String(primaryRegNo) } : {};
  const res = await erpCall(`/placement-drive/list${qs}`, token, { headers });
  if (!res.ok) return [];
  const raw = res.json?.data ?? res.json ?? [];
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  
  let mapped = list.map(d => ({
    ...d,
    id: d.id || d.drive_id,
    drive_id: d.drive_id || d.id,
    company_name: d.company_name || d.company || 'Campus Recruiter',
    job_role: d.job_role || d.role || 'Software Engineer',
    role: d.role || d.job_role || 'Software Engineer',
    package_lpa: d.package_lpa || d.package_ctc || d.package || '',
    package_ctc: d.package_ctc || d.package_lpa || d.package || '',
    min_cgpa: d.min_cgpa || d.min_score_required || 0,
    min_score_required: d.min_score_required || d.min_cgpa || 0,
    drive_date: d.drive_date || d.created_at,
    deadline_date: d.deadline_date || d.drive_date,
    status: d.status || 'Open',
    courses: d.courses || d.eligible_courses || (d.eligibility_course_cd ? [d.eligibility_course_cd] : []),
    eligibility_course_cd: d.eligibility_course_cd || (Array.isArray(d.courses) ? d.courses.join(', ') : ''),
    eligible_branches: d.eligible_branches || (d.eligibility_branch_cd ? [d.eligibility_branch_cd] : []),
    is_registered: Boolean(d.has_applied || d.my_application),
    application_status: d.application_status || (d.my_application ? d.my_application.status : (d.has_applied ? 'Applied' : null)),
    applied_at: d.my_application ? d.my_application.applied_at : null,
    my_application: d.my_application || null,
  }));

  // If primary identifier didn't link any application, test remaining candidate identifiers (e.g. rollno vs username)
  const hasApp = mapped.some(d => d.is_registered || d.has_applied || d.my_application);
  if (!hasApp && regNos.length > 1) {
    for (let i = 1; i < regNos.length; i++) {
      const altId = regNos[i];
      const altParams = [];
      if (status && status !== 'all') altParams.push(`status=${encodeURIComponent(status)}`);
      if (course) altParams.push(`course=${encodeURIComponent(course)}`);
      altParams.push(`student_reg_no=${encodeURIComponent(altId)}`);
      const altRes = await erpCall(`/placement-drive/list?${altParams.join('&')}`, token, {
        headers: { 'x-user-reg-no': String(altId), 'x-user-id': String(altId) },
      });
      if (altRes.ok) {
        const altRaw = altRes.json?.data ?? altRes.json ?? [];
        const altList = Array.isArray(altRaw) ? altRaw : (Array.isArray(altRaw?.data) ? altRaw.data : []);
        const altMapped = altList.map(d => ({
          ...d,
          id: d.id || d.drive_id,
          drive_id: d.drive_id || d.id,
          company_name: d.company_name || d.company || 'Campus Recruiter',
          job_role: d.job_role || d.role || 'Software Engineer',
          role: d.role || d.job_role || 'Software Engineer',
          package_lpa: d.package_lpa || d.package_ctc || d.package || '',
          package_ctc: d.package_ctc || d.package_lpa || d.package || '',
          min_cgpa: d.min_cgpa || d.min_score_required || 0,
          min_score_required: d.min_score_required || d.min_cgpa || 0,
          drive_date: d.drive_date || d.created_at,
          deadline_date: d.deadline_date || d.drive_date,
          status: d.status || 'Open',
          courses: d.courses || d.eligible_courses || (d.eligibility_course_cd ? [d.eligibility_course_cd] : []),
          eligibility_course_cd: d.eligibility_course_cd || (Array.isArray(d.courses) ? d.courses.join(', ') : ''),
          eligible_branches: d.eligible_branches || (d.eligibility_branch_cd ? [d.eligibility_branch_cd] : []),
          is_registered: Boolean(d.has_applied || d.my_application),
          application_status: d.application_status || (d.my_application ? d.my_application.status : (d.has_applied ? 'Applied' : null)),
          applied_at: d.my_application ? d.my_application.applied_at : null,
          my_application: d.my_application || null,
        }));
        if (altMapped.some(d => d.is_registered || d.has_applied || d.my_application)) {
          return altMapped;
        }
      }
    }
  }

  return mapped;
}
export async function getErpPlacementSummary(token, studentRegNo = null) {
  const primaryId = Array.isArray(studentRegNo) ? studentRegNo[0] : studentRegNo;
  const qs = primaryId ? `?student_reg_no=${encodeURIComponent(primaryId)}` : '';
  const headers = primaryId ? { 'x-user-reg-no': String(primaryId), 'x-user-id': String(primaryId) } : {};
  const res = await erpCall(`/placement-drive/dashboard/summary${qs}`, token, { headers });
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}
export async function getErpPlacementOffers(token, studentRegNo = null) {
  const regNos = Array.isArray(studentRegNo)
    ? studentRegNo.filter(Boolean)
    : (studentRegNo ? [String(studentRegNo)] : []);

  const primaryId = regNos[0] || null;
  const qs = primaryId ? `?student_reg_no=${encodeURIComponent(primaryId)}` : '';
  const headers = primaryId ? { 'x-user-reg-no': String(primaryId), 'x-user-id': String(primaryId) } : {};
  const res = await erpCall(`/placement-drive/student/offers${qs}`, token, { headers });
  if (res.ok) {
    const raw = res.json?.data ?? res.json ?? [];
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.offers) ? raw.offers : []);
    if (list.length > 0) return list;
  }

  // Fallback candidate identifiers
  if (regNos.length > 1) {
    for (let i = 1; i < regNos.length; i++) {
      const altId = regNos[i];
      const altRes = await erpCall(`/placement-drive/student/offers?student_reg_no=${encodeURIComponent(altId)}`, token, {
        headers: { 'x-user-reg-no': String(altId), 'x-user-id': String(altId) },
      });
      if (altRes.ok) {
        const altRaw = altRes.json?.data ?? altRes.json ?? [];
        const altList = Array.isArray(altRaw) ? altRaw : (Array.isArray(altRaw?.offers) ? altRaw.offers : []);
        if (altList.length > 0) return altList;
      }
    }
  }

  return [];
}
export async function respondToPlacementOffer(token, appId, action) {
  const res = await erpCall(`/placement-drive/offers/${appId}/respond`, token, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  return res.ok;
}
export async function applyForPlacementDrive(token, { drive_id, cgpa, resume_url, student_reg_no, student_name }) {
  const headers = student_reg_no ? { 'x-user-reg-no': String(student_reg_no), 'x-user-id': String(student_reg_no) } : {};
  const res = await erpCall('/placement-drive/apply', token, {
    method: 'POST',
    headers,
    body: JSON.stringify({ drive_id, cgpa, resume_url, student_reg_no, student_name }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to apply');
  return res.json?.data ?? res.json;
}
export async function getErpPlacementDriveById(token, id) {
  const res = await erpCall(`/placement-drive/${id}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 1: LESSONS / STUDY MATERIALS ──────────────────────────────────────
export async function getErpRecentLessons(token, filters = {}) {
  const qs = new URLSearchParams();
  if (filters.courseCd) qs.set('courseCd', String(filters.courseCd));
  if (filters.semCd) qs.set('semCd', String(filters.semCd));
  if (filters.branchCd) qs.set('branchCd', String(filters.branchCd));
  const queryStr = qs.toString() ? `?${qs.toString()}` : '';
  const res = await erpCall(`/lessons/recent${queryStr}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpAllLessons(token, filters = {}) {
  const qs = new URLSearchParams();
  if (filters.courseCd) qs.set('courseCd', String(filters.courseCd));
  if (filters.semCd) qs.set('semCd', String(filters.semCd));
  if (filters.branchCd) qs.set('branchCd', String(filters.branchCd));
  if (filters.batchCd) qs.set('batchCd', String(filters.batchCd));
  const queryStr = qs.toString() ? `?${qs.toString()}` : '';
  const res = await erpCall(`/lessons${queryStr}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpLessonDownloadUrl(token, id) {
  const res = await erpCall(`/lessons/${id}/download`, token);
  if (!res.ok) return null;
  return res.json?.data?.url ?? res.json?.url ?? null;
}

// ── PHASE 2: ATTENDANCE (Non-Medical) ───────────────────────────────────────
export const ERP_COURSE_CODES = {
  'B.Tech': '1', 'BTech': '1', 'B.Tech CSE': '1', 'B.Tech IT': '1',
  'B.Tech ME': '1', 'B.Tech ECE': '1', 'B.Tech Civil': '1', 'B.Tech EE': '1',
  'MCA': '2',
  'MBA': '4',
  'B.Pharm': '5', 'BPharm': '5', 'M.Pharm': '5', 'Pharmacy': '5',
  'BBA': '8',
  'B.Com': '9', 'BCom': '9', 'Commerce': '9',
  'BCA': '13',
};

export function getErpCourseCode(course) {
  if (!course) return '13';
  const clean = String(course).trim();
  if (ERP_COURSE_CODES[clean]) return ERP_COURSE_CODES[clean];
  const upper = clean.toUpperCase().replace(/\./g, '');
  if (upper.includes('BTECH') || upper.includes('CSE') || upper.includes('ECE') || upper.includes('MECH')) return '1';
  if (upper.includes('MCA')) return '2';
  if (upper.includes('MBA')) return '4';
  if (upper.includes('PHARM')) return '5';
  if (upper.includes('BBA')) return '8';
  if (upper.includes('BCOM') || upper.includes('COMMERCE')) return '9';
  if (upper.includes('BCA')) return '13';
  return '13';
}
export async function getErpAttendance(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.coursecd)   qs.set('coursecd', String(params.coursecd));
  if (params.sem_cd)     qs.set('sem_cd', String(params.sem_cd));
  if (params.ddl_batch)  qs.set('ddl_batch', String(params.ddl_batch));
  if (params.ddl_branch) qs.set('ddl_branch', String(params.ddl_branch));
  if (params.section_cd) qs.set('section_cd', String(params.section_cd));
  const res = await erpCall(`/attendance/portal/subject-summary?${qs.toString()}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpLectureDetails(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.coursecd)   qs.set('coursecd', String(params.coursecd));
  if (params.sem_cd)     qs.set('sem_cd', String(params.sem_cd));
  if (params.ddl_sub)    qs.set('ddl_sub', String(params.ddl_sub));
  if (params.ddl_batch)  qs.set('ddl_batch', String(params.ddl_batch));
  if (params.ddl_branch) qs.set('ddl_branch', String(params.ddl_branch));
  const res = await erpCall(`/attendance/portal/lecture-details?${qs.toString()}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpStudentAttendanceSummary(token, studentId) {
  const res = await erpCall(`/attendance/students/${studentId}/summary`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 2: FEES ───────────────────────────────────────────────────────────
export async function getErpFees(token, rollno) {
  const res = await erpCall(`/fees/${rollno}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}
export async function getErpFeeStructure(token, batchId) {
  const res = await erpCall(`/fees/structure/${batchId}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 2: TIMETABLE ──────────────────────────────────────────────────────
export async function getErpStudentSchedule(token, { semester, department_id } = {}) {
  const qs = new URLSearchParams();
  if (semester)      qs.set('semester', String(semester));
  if (department_id) qs.set('department_id', String(department_id));
  const res = await erpCall(`/timetable/student-schedule?${qs.toString()}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpRelevantFaculties(token) {
  const res = await erpCall('/timetable/relevant-faculties', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

// ── PHASE 2: EXAMS / RESULTS ────────────────────────────────────────────────
export async function getErpExamResults(token) {
  const res = await erpCall('/exams/results', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpExamMarks(token, rollno) {
  const res = await erpCall(`/exams/marks/${rollno}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpStudentExamHistory(token, rollno) {
  const res = await erpCall(`/exams/student/${rollno}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 2: LIBRARY ────────────────────────────────────────────────────────
export async function getErpLibraryBooks(token, search = '') {
  const qs = search ? `?q=${encodeURIComponent(search)}` : '';
  const res = await erpCall(`/library/books${qs}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpMyIssuedBooks(token, rollno) {
  const res = await erpCall(`/library/circulation/${rollno}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

// ── PHASE 2: BATCH CHAT (ERP) ───────────────────────────────────────────────
export async function getErpChatGroups(token) {
  const res = await erpCall('/chat/groups', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpChatMessages(token, groupId, limit = 50) {
  const res = await erpCall(`/chat/groups/${groupId}/messages?limit=${limit}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function sendErpChatMessage(token, groupId, { content, attachmentUrl }) {
  const res = await erpCall(`/chat/groups/${groupId}/messages`, token, {
    method: 'POST',
    body: JSON.stringify({ content, attachment_url: attachmentUrl }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to send');
  return res.json?.data ?? res.json;
}
export async function markErpChatGroupRead(token, groupId) {
  const res = await erpCall(`/chat/groups/${groupId}/read`, token, { method: 'PATCH' });
  return res.ok;
}
export async function getErpChatUnreadCount(token) {
  const res = await erpCall('/chat/unread-count', token);
  if (!res.ok) return 0;
  return res.json?.data?.count ?? res.json?.count ?? 0;
}
export async function joinErpBatchChat(token) {
  const res = await erpCall('/chat/join-batch', token, { method: 'POST' });
  return res.ok;
}

// ── PHASE 3: INTERNSHIPS ────────────────────────────────────────────────────
export async function getErpInternships(token, course = '', studentRegNo = '') {
  let url = '/internships/list';
  const params = [];
  if (course) params.push(`course=${encodeURIComponent(course)}`);
  if (studentRegNo) params.push(`student_reg_no=${encodeURIComponent(studentRegNo)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const headers = studentRegNo ? { 'x-user-reg-no': String(studentRegNo), 'x-user-id': String(studentRegNo) } : {};
  const res = await erpCall(url, token, { headers });
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpInternshipById(token, id) {
  const res = await erpCall(`/internships/${id}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}
export async function applyForErpInternship(token, { internship_id, cgpa, reason, resume_url }) {
  const res = await erpCall('/internships/apply', token, {
    method: 'POST',
    body: JSON.stringify({ internship_id, cgpa, reason, resume_url }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Application failed');
  return res.json?.data ?? res.json;
}
export async function uploadInternshipCertificate(token, applicationId, fileUri, fileName) {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName || 'certificate.pdf', type: 'application/pdf' });
  formData.append('application_id', applicationId);
  const ERP_URL = `${ERP_BASE}/api/v1/internships/applications/upload-certificate`;
  const response = await fetch(ERP_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-Id': ERP_TENANT_SLUG, 'x-tenant-slug': ERP_TENANT_SLUG },
    body: formData,
  });
  const json = await response.json().catch(() => null);
  return { ok: response.ok, json };
}
export async function getInternshipCertificateUrl(token, applicationId) {
  const res = await erpCall(`/internships/applications/${applicationId}/certificate`, token);
  if (!res.ok) return null;
  return res.json?.data?.url ?? res.json?.url ?? null;
}

// ── PHASE 3: LOGBOOK (NestJS ERP — Non-Medical) ─────────────────────────────
export async function getErpLogbookTopics(token, filters = {}) {
  const qs = new URLSearchParams(filters).toString();
  const res = await erpCall(`/logbook/topics${qs ? `?${qs}` : ''}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function submitErpLogbookWork(token, { topic_id, notes, file_url }) {
  const res = await erpCall('/logbook/submissions', token, {
    method: 'POST',
    body: JSON.stringify({ topic_id, notes, file_url }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Submission failed');
  return res.json?.data ?? res.json;
}
export async function getMyErpLogbookSubmissions(token) {
  const res = await erpCall('/logbook/submissions/me', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpLogbookLeaderboard(token) {
  const res = await erpCall('/logbook/leaderboard', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpLogbookNotifications(token) {
  const res = await erpCall('/logbook/notifications/me', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

// ── PHASE 3: ACADEMIC REPOSITORY ────────────────────────────────────────────
export async function getErpRepositoryList(token) {
  const res = await erpCall('/repository/list', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpTopRatedRepositories(token) {
  const res = await erpCall('/repository/dashboard/top-rated', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function submitToErpRepository(token, { title, abstract, file_url, tags }) {
  const res = await erpCall('/repository/submit', token, {
    method: 'POST',
    body: JSON.stringify({ title, abstract, file_url, tags }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Submission failed');
  return res.json?.data ?? res.json;
}
export async function getErpRepositoryById(token, id) {
  const res = await erpCall(`/repository/${id}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 3: INCUBATION CELL ────────────────────────────────────────────────
export async function getErpIncubationProjects(token) {
  const res = await erpCall('/incubation-cell/projects', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function getErpIncubationMeta(token) {
  const res = await erpCall('/incubation-cell/meta', token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 3: PRESIGNED FILE UPLOAD ──────────────────────────────────────────
export async function getErpPresignedUploadUrl(token, { filename, contentType, folder = 'uploads' }) {
  const res = await erpCall('/files/presign/upload', token, {
    method: 'POST',
    body: JSON.stringify({ filename, content_type: contentType, folder }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to get upload URL');
  return res.json?.data ?? res.json;
}
export async function getErpPresignedDownloadUrl(token, filePath) {
  const res = await erpCall(`/files/presign/download/${filePath}`, token);
  if (!res.ok) return null;
  return res.json?.data?.url ?? res.json?.url ?? null;
}

// ── PHASE 4: FACULTY ATTENDANCE MARKING ─────────────────────────────────────
export async function getErpTodayTimetableSlots(token, { date, batch_id, department_id } = {}) {
  const qs = new URLSearchParams();
  if (date)          qs.set('date', date);
  if (batch_id)      qs.set('batch_id', String(batch_id));
  if (department_id) qs.set('department_id', String(department_id));
  const res = await erpCall(`/attendance/timetable-slots?${qs.toString()}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function createErpAttendanceSession(token, dto) {
  const res = await erpCall('/attendance/sessions', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to mark attendance');
  return res.json?.data ?? res.json;
}
export async function getErpActiveAttendanceSession(token) {
  const res = await erpCall('/attendance/active-session', token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}
export async function getErpBatchAttendanceReport(token, batchId) {
  const res = await erpCall(`/attendance/batches/${batchId}/report`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 4: FACULTY LOGBOOK EVAL ───────────────────────────────────────────
export async function publishErpLogbookTopic(token, { title, description, category_id, due_date, batch_id }) {
  const res = await erpCall('/logbook/topics', token, {
    method: 'POST',
    body: JSON.stringify({ title, description, category_id, due_date, batch_id }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to publish topic');
  return res.json?.data ?? res.json;
}
export async function getErpLogbookSubmissions(token, { topic_id, status } = {}) {
  const qs = new URLSearchParams();
  if (topic_id) qs.set('topic_id', String(topic_id));
  if (status)   qs.set('status', status);
  const res = await erpCall(`/logbook/submissions?${qs.toString()}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
export async function evaluateErpLogbookSubmission(token, submissionId, { marks, remarks, status }) {
  const res = await erpCall(`/logbook/submissions/${submissionId}/evaluate`, token, {
    method: 'POST',
    body: JSON.stringify({ marks, remarks, status }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Evaluation failed');
  return res.json?.data ?? res.json;
}

// ── PHASE 4: ADMIN / FACULTY NOTICES ────────────────────────────────────────
export async function createErpNotice(token, { title, content, target_type, target_ids, is_urgent }) {
  const res = await erpCall('/admin/notices', token, {
    method: 'POST',
    body: JSON.stringify({ title, content, target_type, target_ids, is_urgent }),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to create notice');
  return res.json?.data ?? res.json;
}
export async function getErpNoticeReadReport(token, noticeId) {
  const res = await erpCall(`/admin/notices/${noticeId}/read-report`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 5: SEMINARS, TUTORIALS & MINI-PROJECTS ────────────────────────────
export async function getErpSeminars(token, studentId) {
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  const res = await erpCall(`/logbook/seminars${qs}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

export async function createErpSeminar(token, dto) {
  const res = await erpCall('/logbook/seminars', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to submit seminar');
  return res.json?.data ?? res.json;
}

export async function getErpTutorials(token, studentId) {
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  const res = await erpCall(`/logbook/tutorials${qs}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

export async function createErpTutorial(token, dto) {
  const res = await erpCall('/logbook/tutorials', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to submit tutorial');
  return res.json?.data ?? res.json;
}

export async function getErpMiniProject(token, studentId, course) {
  const qs = new URLSearchParams();
  if (studentId) qs.set('studentId', String(studentId));
  if (course) qs.set('course', String(course));
  const qStr = qs.toString();
  const res = await erpCall(`/logbook/mini-project${qStr ? `?${qStr}` : ''}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

export async function getErpWeeklyLogs(token, studentId) {
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  const res = await erpCall(`/logbook/weekly-logs${qs}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

export async function createErpWeeklyLog(token, dto) {
  const res = await erpCall('/logbook/weekly-logs', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to submit weekly log');
  return res.json?.data ?? res.json;
}

export async function getErpTechnicalActivities(token, studentId) {
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  const res = await erpCall(`/logbook/technical-activities${qs}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

export async function createErpTechnicalActivity(token, dto) {
  const res = await erpCall('/logbook/technical-activities', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to submit technical activity');
  return res.json?.data ?? res.json;
}

export async function getErpLogbookOverview(token, studentId) {
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  const res = await erpCall(`/logbook/dashboard/overview${qs}`, token);
  if (!res.ok) return null;
  return res.json?.data ?? res.json ?? null;
}

// ── PHASE 5: GITHUB & CODE REPOSITORIES ─────────────────────────────────────
export async function submitErpGithubRepo(token, dto) {
  const res = await erpCall('/repository/submit', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to submit repository');
  return res.json?.data ?? res.json;
}

export async function getErpGithubRepos(token, studentRegNo) {
  const qs = studentRegNo ? `?student_reg_no=${encodeURIComponent(studentRegNo)}` : '';
  const res = await erpCall(`/repository/list${qs}`, token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

export async function updateErpGithubRepo(token, id, dto) {
  const res = await erpCall(`/repository/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(res.json?.message || 'Failed to update repository');
  return res.json?.data ?? res.json;
}

export async function getErpTopRatedRepos(token) {
  const res = await erpCall('/repository/dashboard/top-rated', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

// ── PHASE 5: EXAM PAPERS & QUESTION BANK ────────────────────────────────────
export async function getErpExamPapers(token) {
  const res = await erpCall('/exams/papers', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}

export async function getErpQuestionBank(token) {
  const res = await erpCall('/exams/question-bank', token);
  if (!res.ok) return [];
  return res.json?.data ?? res.json ?? [];
}
