import { APP_CONFIG } from '../config/appConfig';

/**
 * Normalizes and fixes image URLs for reliable rendering on iOS and Android APKs.
 * - Converts Google Drive thumbnail/file URLs to direct Google CDN image URLs (`lh3.googleusercontent.com/d/ID`)
 * - Resolves relative backend paths (`/static/...` -> `http://107.22.126.116:8000/...`)
 * - Fixes casing for SRMS ERP student photos (`srMSERP` -> `SRMSERP`)
 *
 * @param {string} url
 * @returns {string}
 */
export function fixImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();

  // Convert Google Drive thumbnail/file URLs to direct Google CDN image URL
  if (clean.includes('drive.google.com')) {
    const idMatch = clean.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }

  // Ensure relative backend URLs are resolved to full HTTP(S) URL
  if (clean.startsWith('/')) {
    clean = `${APP_CONFIG.API_BASE_URL}${clean}`;
  }

  // Fix casing for SRMS ERP student photos
  if (clean.includes('srMSERP')) {
    clean = clean.replace('srMSERP', 'SRMSERP');
  }

  return clean;
}
