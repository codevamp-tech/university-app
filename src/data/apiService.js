/**
 * apiService.js
 * ─────────────
 * Central service layer for all UniCampus API calls.
 * Base URL: http://54.174.185.143:8000
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

const BASE            = APP_CONFIG.API_BASE_URL;
const TENANT_ID       = APP_CONFIG.TENANT_ID;
const DEPT_ID         = APP_CONFIG.DEPT_ID;
// User types "1234" in the login screen → app sends this internal password to the API
const DEFAULT_PASSWORD = APP_CONFIG.DEFAULT_PASSWORD;


// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function apiCall(path, options = {}) {
  const url = `${BASE}${path}`;
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const json = await response.json();
    return { ok: response.ok, status: response.status, json };
  } catch (err) {
    console.warn(`[API] Network error on ${path}:`, err.message);
    return { ok: false, status: 0, json: null, networkError: true };
  }
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function unwrap(result, fallback = null) {
  if (result.ok && result.json?.success) return result.json.data;
  return fallback;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Login with roll number. Uses roll_number as both username and password.
 * If user doesn't exist (404), auto-registers them first.
 * Returns { access_token, refresh_token } or null on failure.
 */
export async function loginWithRollNumber(rollNumber) {
  const username = rollNumber.trim();

  // 1. Try login
  const loginRes = await apiCall('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: DEFAULT_PASSWORD,
      tenant_id: TENANT_ID,
    }),
  });

  if (loginRes.ok && loginRes.json?.success) {
    return loginRes.json.data; // { access_token, refresh_token, ... }
  }

  // 2. If login failed, try auto-register then login
  const registerRes = await apiCall('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: DEFAULT_PASSWORD,
      tenant_id: TENANT_ID,
      rollno: username,
      department_id: DEPT_ID,
      batch_year: new Date().getFullYear(),
    }),
  });

  if (registerRes.ok && registerRes.json?.success) {
    // Re-login after successful registration
    const retryRes = await apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password: DEFAULT_PASSWORD,
        tenant_id: TENANT_ID,
      }),
    });
    if (retryRes.ok && retryRes.json?.success) {
      return retryRes.json.data;
    }
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

// ─── User / Profile ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/users/me
 * Returns the API profile (id, username, rollno, cgpa, social_credits, etc.)
 */
export async function getMyProfile(token) {
  const res = await apiCall('/api/v1/users/me', {
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
export async function getAttendance(token) {
  const res = await apiCall('/api/v1/erp/attendance', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/results
 * Returns results/grade records.
 */
export async function getResults(token) {
  const res = await apiCall('/api/v1/erp/results', {
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

// ─── Wallet ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/wallet/balance
 * Returns { id, balance, currency }
 */
export async function getWalletBalance(token) {
  const res = await apiCall('/api/v1/wallet/balance', {
    headers: authHeaders(token),
  });
  return unwrap(res, { balance: 0, currency: 'INR' });
}

/**
 * GET /api/v1/wallet/transactions?skip=0&limit=20
 */
export async function getTransactions(token, skip = 0, limit = 20) {
  const res = await apiCall(`/api/v1/wallet/transactions?skip=${skip}&limit=${limit}`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
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
  return unwrap(res, []);
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
export async function createPost(token, { content, media_url }) {
  const res = await apiCall('/api/v1/social/posts', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content, media_url }),
  });
  return unwrap(res);
}

// ─── Shop ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/shop/listings?category=&skip=0&limit=20
 */
export async function getShopListings(token, category = null, skip = 0, limit = 20) {
  const params = new URLSearchParams({ skip, limit });
  if (category) params.set('category', category);
  const res = await apiCall(`/api/v1/shop/listings?${params}`, {
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

// ─── Venture ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/venture/startups?skip=0&limit=20
 */
export async function getStartups(token, skip = 0, limit = 20) {
  const res = await apiCall(`/api/v1/venture/startups?skip=${skip}&limit=${limit}`, {
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
