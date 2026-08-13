import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Reads the correct medical academic percentage (e.g. 46%) that was
 * computed and cached by ERPResultsScreen. Tries all possible cache key
 * variants since different screens may use id vs username vs rollno.
 *
 * Priority:
 *  1. @erp_results_cache_{userId}   → overallPct written by ERPResultsScreen
 *  2. @erp_overall_pct_{userId}     → written by ERPResultsScreen directly
 *  3. Same as above for username / rollno variants
 *
 * @param {object} user  - the user object from UserContext
 * @returns {Promise<number|null>} percentage (e.g. 46) or null if unavailable
 */
export async function readCachedMedicalPct(user) {
  const keys = [user?.id, user?.username, user?.rollno].filter(Boolean);

  for (const key of keys) {
    try {
      // Try the full results cache first — ERPResultsScreen writes overallPct here
      const cacheStr = await AsyncStorage.getItem(`@erp_results_cache_${key}`);
      if (cacheStr) {
        const parsed = JSON.parse(cacheStr);
        if (parsed?.overallPct && parsed.overallPct > 0) {
          return Math.round(parsed.overallPct);
        }
        // Fallback: recompute from phases if overallPct missing
        if (parsed?.phases && Array.isArray(parsed.phases)) {
          const taken = parsed.phases.filter(p => p.combinedPct !== null && p.combinedPct > 0);
          if (taken.length > 0) {
            return Math.round(taken.reduce((s, p) => s + p.combinedPct, 0) / taken.length);
          }
        }
      }
    } catch (_) {}

    try {
      // Try direct pct key
      const directPct = await AsyncStorage.getItem(`@erp_overall_pct_${key}`);
      if (directPct !== null) {
        const val = parseInt(directPct, 10);
        if (!isNaN(val) && val > 0) {
          return val;
        }
      }
    } catch (_) {}
  }

  return null;
}
