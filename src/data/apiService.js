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


// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function apiCall(path, options = {}) {
  const url = `${BASE}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
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
export async function getDetailedResults(token) {
  const res = await apiCall('/api/v1/erp/results/detailed', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/papers
 * All exam papers grouped by subject for the current student's batch.
 */
export async function getPaperList(token) {
  const res = await apiCall('/api/v1/erp/papers', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/papers/:paperCode/competencies
 * Competency-based marks for a specific paper.
 */
export async function getPaperCompetencies(token, paperCode) {
  const res = await apiCall(`/api/v1/erp/papers/${encodeURIComponent(paperCode)}/competencies`, {
    headers: authHeaders(token),
  });
  return unwrap(res, {});
}

/**
 * GET /api/v1/erp/papers/:paperCode/attempted
 * Attempted exam paper with sections, questions and obtained marks.
 */
export async function getAttemptedPaper(token, paperCode) {
  const res = await apiCall(`/api/v1/erp/papers/${encodeURIComponent(paperCode)}/attempted`, {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/papers/:paperCode/chart?phase=1
 * Competency pie chart data for a paper.
 */
export async function getCompetencyChart(token, paperCode, phase = '1') {
  const res = await apiCall(
    `/api/v1/erp/papers/${encodeURIComponent(paperCode)}/chart?phase=${phase}`,
    { headers: authHeaders(token) }
  );
  return unwrap(res, { data: [] });
}

/**
 * GET /api/v1/erp/logbook
 * UG logbook activities with attempt status and faculty verification.
 */
export async function getLogbook(token) {
  const res = await apiCall('/api/v1/erp/logbook', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/erp/schedule
 * Student weekly class schedule from ERP timetable.
 */
export async function getStudentSchedule(token) {
  const res = await apiCall('/api/v1/erp/schedule', {
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
export async function searchUsersAPI(token, query) {
  try {
    const res = await apiCall(`/api/v1/social/users/search?q=${encodeURIComponent(query)}`, {
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
      followers: Math.floor(Math.random() * 500) + 1,
      connections: Math.floor(Math.random() * 300) + 1,
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
  const res = await apiCall('/api/v1/grievance', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      category: payload.category,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority.toLowerCase(), // E.g. 'low', 'medium', 'high'
    }),
  });

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

export async function actionWardenOutpass(token, outpassId, status) {
  const res = await apiCall(`/api/v1/erp/outpass/${outpassId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
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
export async function getFacultyTimetable(token) {
  const res = await apiCall('/api/v1/faculty/timetable', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
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
export async function getFacultyAttendance(token) {
  const res = await apiCall('/api/v1/faculty/attendance', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
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
