// ──────────────────────────────────────────────────────────────
// App Configuration
// ──────────────────────────────────────────────────────────────
// Sensitive keys (API keys) are read from environment variables
// defined in .env (never committed to git).
//
// In Expo, variables prefixed with EXPO_PUBLIC_ are available
// at runtime via process.env.EXPO_PUBLIC_*
// ──────────────────────────────────────────────────────────────


export const APP_CONFIG = {
  UNIVERSITY_NAME: 'UniCampus',
  UNIVERSITY_SHORT_NAME: 'UniCampus',
  CAMPUS_BITES_NAME: 'Campus Bites',
  AI_ASSISTANT_NAME: 'Campus AI',
  STUDENT_EMAIL_DOMAIN: 'university.edu',
  UNIVERSITY_DOMAIN: 'university.edu',
  UNIVERSITY_ID_PREFIX: 'Uni',
  CAMPUS_LOCATION: 'Main Campus',
  UNIVERSITY_WEBSITE: 'https://quantumuniversity.edu.in/',
  CONTACT_EMAIL: 'support@quantumuniversity.edu.in',
  PRIMARY_COLOR: '#EA580C',

  // ─── UniCampus Backend API ───────────────────────────────────────────────
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://54.198.177.105:8000',
  TENANT_ID:    process.env.EXPO_PUBLIC_TENANT_ID    || 'd3b07384-d113-4956-a5db-e0e457e51c89',
  DEPT_ID:      process.env.EXPO_PUBLIC_DEPT_ID      || 'e0c46647-7ee9-4c12-97b7-580ea5d3bc7d',
  // Internal password — user types '1234' in app, this is what gets sent to the API
  DEFAULT_PASSWORD: '1234@Uni',
};
