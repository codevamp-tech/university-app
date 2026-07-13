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
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const json = await response.json();
    console.log(`[API Response] ✅ ${response.status} <- ${path}`, JSON.stringify(json).slice(0, 500));

    if (response.status === 401 && !path.includes('/login') && !path.includes('/register')) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    return { ok: response.ok, status: response.status, json };
  } catch (err) {
    console.warn(`[API Error] ❌ ${path}:`, err.message);
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
export async function loginWithRollNumber(rollNumber, password) {
  const username = rollNumber.trim();
  const passwordToSend = password || DEFAULT_PASSWORD;

  // 1. Try login
  const loginRes = await apiCall('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: passwordToSend,
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
      password: passwordToSend,
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
        password: passwordToSend,
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
  const res = await apiCall('/api/v1/users/me', {
    headers: authHeaders(token),
  });
  return unwrap(res);
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
export async function getAttendance(token, studentId) {
  const url = studentId ? `/api/v1/erp/attendance?student_id=${studentId}` : '/api/v1/erp/attendance';
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
export async function getDetailedResults(token, studentId) {
  const url = studentId ? `/api/v1/erp/results/detailed?student_id=${studentId}` : '/api/v1/erp/results/detailed';
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
export async function createPost(token, { content, media_urls = [], tags = [], post_type = 'post' }) {
  const res = await apiCall('/api/v1/social/posts', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content, media_urls, tags, post_type }),
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

export async function getAllStudents(token) {
  try {
    const res = await apiCall(`/api/v1/users/students`, {
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
export async function getStartups(token, skip = 0, limit = 20, myOnly = false) {
  let url = `/api/v1/venture/startups?skip=${skip}&limit=${limit}`;
  if (myOnly) {
    url += `&my_only=true`;
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
  return unwrap(res);
}




export async function uploadAvatarAPI(token, imageUri) {
  console.log("Token sent to uploadAvatarAPI:", token ? "Exists" : "MISSING");
  const formData = new FormData();
  
  // Extract filename and type from uri
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  });

  const res = await fetch(`${BASE}/api/v1/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do not set Content-Type, fetch will set it with boundary
    },
    body: formData,
  });
  const json = await res.json();
  console.log("Avatar upload status:", res.status);
  console.log("Avatar upload response:", json);
  return { ok: res.ok, status: res.status, json };
}

export async function uploadDocumentAPI(token, fileUri, filename) {
  console.log("Token sent to uploadDocumentAPI:", token ? "Exists" : "MISSING");
  const formData = new FormData();
  const actualFilename = filename || fileUri.split('/').pop() || 'document.pdf';
  formData.append('file', {
    uri: fileUri,
    name: actualFilename,
    type: 'application/pdf',
  });
  const res = await fetch(`${BASE}/api/v1/upload/document`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const json = await res.json();
  console.log("Document upload status:", res.status);
  console.log("Document upload response:", json);
  return { ok: res.ok, status: res.status, json };
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
      priority: payload.priority.toLowerCase(), // E.g. 'low', 'medium', 'high'
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

export async function updateGrievanceStatusAPI(token, grievanceId, status) {
  const res = await apiCall(`/api/v1/grievance/${grievanceId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
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
 * GET /api/v1/faculty/attendance
 * Returns faculty punch history records.
 */
export async function getFacultyAttendance(token, empId = null) {
  const url = empId 
    ? `/api/v1/faculty/attendance?emp_id=${encodeURIComponent(empId)}`
    : '/api/v1/faculty/attendance';
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

// ─── Phase → Subject Batch Year Map ──────────────────────────────────────────
const PHASE_BATCH_YEAR = { '1': '2025', '2': '2024', '3': '2023' };

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
 * Fetch salary slip for a specific month/year directly from live ERP.
 */
export async function getSalarySlip(empId, month, year) {
  if (!empId) return null;
  try {
    const response = await fetch('https://myportal.srms.ac.in/ops/Home/GetEmployeeSalaryslip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empid: String(empId), month: String(month), year: String(year) }),
    });
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const slip = data[0];
      return {
        emp_name: slip.EmpName || '',
        department: slip.Department || '',
        designation: slip.Designation || '',
        category: slip.Categary || '',
        month: month,
        year: year,
        pan_no: slip.PANNo || '',
        account_no: slip.AcNO || '',
        uan: slip.UAN || '',
        basic: slip.EBASIC || 0,
        da: slip.DA || 0,
        hra: slip.HRA || 0,
        other_allowance: slip["OTHER ALLOWANCE"] || 0,
        overtime: slip["OVERTIME/OTHER EARNING"] || 0,
        npa: slip.MONTHLYNPA || 0,
        fix_tf_earning: slip.FIXTFEARN || slip["FIX TF EARNING"] || 0,
        bonus_earn: slip.Bonus_earn || 0,
        gratuity_earn: slip.GratityEarn || 0,
        misc_earn: slip.MISCEARN || 0,
        dean_student_welfare: slip.DEAN_STUDENT_WELFARE || 0,
        vice_principal: slip.VICE_PRINCIPAL || 0,
        dean_pg: slip.DEAN_PG || 0,
        dean_ug: slip.DEAN_UG || 0,
        warden: slip.WARDEN || 0,
        chief_proctor: slip.CHIEF_PROCTOR || 0,
        exam_controller: slip.EXAM_CONTROLLER || 0,
        tds: slip.TDS || 0,
        epf: slip.EPFDEDN || 0,
        esi: slip.ESIDEDN || 0,
        swf: slip.SWF || 0,
        lic: slip.LIC || 0,
        mobile_bill: slip.MOBILEBILL || 0,
        transport: slip.TRANSPORT || 0,
        electricity: slip.ELECTRICITY || 0,
        fix_tf_dedn: slip["FIX TF DEDN"] || 0,
        misc_dedn: slip.MISCDEC || 0,
        gross_salary: slip.GROSS || 0,
        standard_gross: slip["Standard Gross Salary"] || 0,
        gross_deductions: slip.GROSSDED || 0,
        net_salary: slip.NET || 0,
        due_salary: slip["DUE SALARY"] || 0,
        working_days: slip.WD || 0,
        month_days: slip.MnthDays || 0,
        days_worked: slip.DaysWorked || 0,
        days_physically_present: slip.DaysPhyPres || 0,
        lwp: slip.LWP || 0,
        cl: slip.CL || 0,
        el: slip.EL || 0,
        co: slip.CO || 0,
      };
    }
  } catch (err) {
    console.warn('[apiService] getSalarySlip failed:', err);
  }
  return null;
}

/**
 * Fetch leave entitlements, balances, and monthly leave records directly from live ERP.
 */
export async function getLeaveSummary(empId, month, year) {
  if (!empId) return null;
  try {
    // 1. Get entitlements
    const resEnt = await fetch('https://myportal.srms.ac.in/ops/Home/GetLeaveEnt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empId: String(empId) }),
    });
    const dataEnt = await resEnt.json();
    const entitlements = (Array.isArray(dataEnt) && dataEnt.length > 0) ? dataEnt[0] : {};

    // 2. Get balances for CL=2, PL=1, EL=9
    const balances = {};
    for (const [code, name] of [["1", "privilege"], ["2", "casual"], ["9", "earned"]]) {
      const resBal = await fetch('https://myportal.srms.ac.in/ops/Home/GetLeaveBal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId: String(empId), leavecd: code }),
      });
      const dataBal = await resBal.json();
      const bal = (Array.isArray(dataBal) && dataBal.length > 0) ? dataBal[0] : {};
      balances[name] = {
        carry_forward: bal.CF_LV || 0,
        accrued: bal.AC_LV || 0,
        total: bal.TOT_LV || 0,
        opening_balance: bal.OPN_BAL || 0,
      };
    }

    // 3. Get monthly history
    const targetMonth = month || (new Date().getMonth() + 1);
    const targetYear = year || new Date().getFullYear();
    const resHist = await fetch('https://myportal.srms.ac.in/ops/Home/GetEmpAdvLv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empid: String(empId), month: String(targetMonth), yr: String(targetYear) }),
    });
    const dataHist = await resHist.json();

    const leaves_taken = [];
    if (Array.isArray(dataHist)) {
      for (const rec of dataHist) {
        if (!rec.lv_number) continue;
        let leave_date = null;
        const raw_dt = rec.leave_dt || rec.leavedt;
        if (raw_dt && String(raw_dt).includes('/Date(')) {
          try {
            const ts = parseInt(String(raw_dt).split('(')[1].split(')')[0]);
            const istDate = new Date(ts + (5.5 * 3600 * 1000));
            leave_date = istDate.toISOString().split('T')[0];
          } catch {}
        }
        const leave_cd = String(rec.leave_cd || '');
        const leave_type_map = { "1": "Privilege Leave", "2": "Casual Leave", "9": "Earned Leave" };
        leaves_taken.push({
          date: leave_date,
          leave_type: leave_type_map[leave_cd] || `Leave (${leave_cd})`,
          reason: rec.reason_for_leave || '',
          status: rec.appflg === 1 ? 'Approved' : 'Pending',
          work_in_charge: rec.workEmpname || '',
        });
      }
    }

    return {
      entitlements: {
        casual_leave: entitlements.casuallv || 0,
        sick_leave: entitlements.sicklv || 0,
        earned_leave: entitlements.earnedlv || 0,
        maternity_leave: entitlements.maternitylv || 0,
        conference_leave: entitlements.conferencelv || 0,
      },
      balances,
      leaves_taken,
      month: targetMonth,
      year: targetYear,
    };
  } catch (err) {
    console.warn('[apiService] getLeaveSummary failed:', err);
  }
  return null;
}

/**
 * Fetch list of batches for a faculty member directly from live ERP.
 */
export async function getFacultyBatches(empId) {
  if (!empId) return [];
  // Parse colgcd from empid structure e.g. "D/11/093" -> "11"
  const parts = String(empId).split('/');
  const colgcd = parts.length >= 2 ? parts[1] : '11';
  const coursecd = '1'; // Default course is MBBS

  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/GetBatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 * Fetch chat message history for an official batch channel from live ERP.
 */
export async function getFacultyGroupChats(empId, batchName, phase = '1', subphase = '1') {
  if (!empId || !batchName) return [];
  const parts = String(empId).split('/');
  const colgcd = parts.length >= 2 ? parts[1] : '11';
  const coursecd = '1';

  // Default curriculum CBME year to batchName - 1
  let cbmey = '2024';
  try {
    const batchYear = parseInt(batchName);
    if (!isNaN(batchYear)) {
      if (batchYear === 2023) {
        cbmey = '2024';
      } else {
        cbmey = String(batchYear - 1);
      }
    }
  } catch {}

  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/getchats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ChatStudId: String(batchName),
        ChatFacId: String(empId),
        chatid: '0',
        colgcd: String(colgcd),
        coursecd: String(coursecd),
        cbmey: String(cbmey),
        batch: String(batchName),
        phase: String(phase),
        subphase: String(subphase),
        ctype: 'GROUP'
      }),
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(msg => {
        let sentDateStr = msg.sentdate || '';
        // If sent date is /Date(ts)/, parse it
        const raw_dt = msg.Crt_dt;
        if (raw_dt && String(raw_dt).includes('/Date(')) {
          try {
            const ts = parseInt(String(raw_dt).split('(')[1].split(')')[0]);
            const d = new Date(ts);
            sentDateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          } catch {}
        }
        return {
          id: String(msg.chatid || Math.random()),
          text: msg.Chat_Desc || '',
          sender: msg.classlabel === 'left' ? (msg.FacultyName || 'Faculty') : (msg.StudentName || 'Student'),
          isMe: msg.classlabel === 'left' && String(msg.ChatFacId || '').trim().toUpperCase() === String(empId || '').trim().toUpperCase(),
          timestamp: sentDateStr,
          department: msg.department || '',
          attachment: msg.attachfile || null,
          // Raw ERP fields
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
    }
  } catch (err) {
    console.warn('[apiService] getFacultyGroupChats failed:', err);
  }
  return [];
}

/**
 * Send a message to the legacy ERP portal group chat.
 */
export async function sendPortalChatMessage(payload) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/lmschat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
export async function getEBooks(searchQuery = '', colg = '11') {
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

        // Skip books without valid reader link or pdf
        const hasLink = link && String(link).trim() !== '' && String(link) !== '0' && String(link).toLowerCase() !== 'null';
        const hasPdf = pdf && String(pdf).trim() !== '' && String(pdf) !== '0' && String(pdf).toLowerCase() !== 'null';

        if (!hasLink && !hasPdf) continue;

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

        // Resolve Cover Page URL
        let coverUrl = defaultCovers[i % defaultCovers.length];
        const cover = book.coverpage;
        if (cover && String(cover).trim() !== '' && String(cover) !== '0' && String(cover).toLowerCase() !== 'null') {
          let cleanCover = String(cover).replace(/\\/g, '/');
          const idx = cleanCover.toLowerCase().indexOf('/library/cataloguing/');
          if (idx !== -1) {
            coverUrl = 'https://myportal.srms.ac.in' + cleanCover.substring(idx);
          }
        }

        validBooks.push({
          id: book.ttl_id || String(Math.random()),
          title: book.title || 'Untitled E-Book',
          author: book.author_name || 'Unknown Author',
          cover: coverUrl,
          pdfUrl: pdfUrl,
          rating: 4.8,
          category: 'Medical',
          pages: 650,
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
 */
export async function getDepartmentFacultyList(empId) {
  if (!empId) return [];
  try {
    const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/getfaclist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facid: 'ddl_faculty2',
        EmpId: String(empId),
      }),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[apiService] getDepartmentFacultyList failed:', err);
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

