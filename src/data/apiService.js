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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchStudentsFromSheet } from './googleSheetsService';

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
    let cached = await AsyncStorage.getItem('@unicampus_students');
    let allStudents = [];
    if (cached) {
      allStudents = JSON.parse(cached);
    } else {
      allStudents = await fetchStudentsFromSheet();
      await AsyncStorage.setItem('@unicampus_students', JSON.stringify(allStudents));
    }
    
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    const results = allStudents.filter(s => 
      s.name?.toLowerCase().includes(lowerQuery) || 
      s.id?.toLowerCase().includes(lowerQuery) ||
      s.course?.toLowerCase().includes(lowerQuery)
    );
    
    return results.slice(0, 15).map(s => ({
      user_id: s.id,
      id: s.id,
      name: s.name,
      username: s.name,
      avatar_url: null,
      rollNo: s.id,
      course: s.course,
      branch: s.branch,
      year: s.year,
      followers: Math.floor(Math.random() * 500) + 1,
      connections: Math.floor(Math.random() * 300) + 1,
    }));
  } catch(e) {
    console.error("Local search failed:", e);
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

export async function connectionStatsAPI(token) {
  const res = await apiCall(`/api/v1/social/connections/stats`, {
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

/**
 * GET /api/v1/shop/gigs
 */
export async function getShopGigs(token) {
  const res = await apiCall('/api/v1/shop/gigs', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
}

/**
 * GET /api/v1/shop/requests
 */
export async function getShopRequests(token) {
  const res = await apiCall('/api/v1/shop/requests', {
    headers: authHeaders(token),
  });
  return unwrap(res, []);
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

/**
 * POST /api/v1/fitness/generate
 */
export async function generateFitnessPlanAPI(token, type, weight, height, bmi, studentName) {
  const res = await apiCall('/api/v1/fitness/generate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      plan_type: type,
      weight: parseFloat(weight),
      height: parseFloat(height),
      bmi: parseFloat(bmi),
      student_name: studentName,
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
    const contacts = unwrap(res, []);
    if (contacts.length > 0) return contacts;
  } catch(e) {
    console.warn("getDMContactsAPI failed, returning mock contacts");
  }
  
  return [
    {
      user_id: 'mock_student_1',
      username: 'Priya Sharma',
      avatar_url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
      last_message: 'Hey, are you going to the hackathon?',
    },
    {
      user_id: 'mock_student_2',
      username: 'Rohan Gupta',
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      last_message: 'Can you share the notes for OS?',
    }
  ];
}

export async function getDMHistoryAPI(token, userId, limit = 50) {
  try {
    const res = await apiCall(`/api/v1/chat/dms/${userId}/history?limit=${limit}`, {
      headers: authHeaders(token),
    });
    const history = unwrap(res, []);
    if (history && history.length > 0) return history;
  } catch(e) {
    console.warn("getDMHistoryAPI failed, returning mock history");
  }
  
  const isPriya = userId === 'mock_student_1';
  return [
    {
      _id: 'mock_msg_2',
      text: isPriya ? 'Hey, are you going to the hackathon?' : 'Can you share the notes for OS?',
      createdAt: new Date().toISOString(),
      user: {
        _id: userId,
        name: isPriya ? 'Priya Sharma' : 'Rohan Gupta',
        avatar: isPriya 
          ? 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150' 
          : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      },
    }
  ];
}

export async function registerPushTokenAPI(token, expoPushToken, platform) {
  const res = await apiCall('/api/v1/chat/devices/register', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ token: expoPushToken, platform }),
  });
  return unwrap(res, null);
}
