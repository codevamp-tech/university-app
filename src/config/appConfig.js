// ──────────────────────────────────────────────────────────────
// App Configuration
// ──────────────────────────────────────────────────────────────
// Sensitive keys (API keys, spreadsheet IDs) are read from
// environment variables defined in .env (never committed to git).
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

  // ─── Loaded from .env — see .env.example for setup instructions ────────────
  GOOGLE_SHEETS_SPREADSHEET_ID: process.env.EXPO_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID,
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY,
};
