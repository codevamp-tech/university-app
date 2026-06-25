/**
 * useHealthMetrics.js
 * ───────────────────
 * React hook that fetches live health metrics from HealthKit / Health Connect.
 * Refreshes on mount and whenever the screen gains focus.
 *
 * Returns:
 *   metrics:           { steps, calories, sleepHours, focusMinutes }
 *   goals:             { steps, calories, sleep, focus }
 *   loading:           boolean
 *   permissionGranted: boolean
 *   refresh:           () => void
 *   requestAccess:     () => void  (re-triggers the permission flow)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { HealthService } from '../data/healthService';
import { getFitnessGoalsAPI, updateFitnessGoalsAPI, createOrUpdateHealthMetricAPI } from '../data/apiService';
import { useUser } from '../context/UserContext';

const DEFAULT_GOALS = {
  steps: 10000,
  calories: 500,
  sleep: 8.0,
  focus: 60,
};

export function useHealthMetrics() {
  const [metrics, setMetrics] = useState({
    steps: 0,
    calories: 0,
    sleepHours: 0,
    focusMinutes: 0,
  });
  const [weeklySteps, setWeeklySteps] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const navigation = useNavigation();

  const { accessToken } = useUser();

  const loadGoals = useCallback(async () => {
    if (!accessToken) return;
    try {
      const dbGoals = await getFitnessGoalsAPI(accessToken);
      if (dbGoals) {
        setGoals({
          steps: dbGoals.target_steps,
          calories: dbGoals.target_calories,
          sleep: dbGoals.target_sleep_hours,
          focus: dbGoals.target_focus_minutes
        });
      }
    } catch (err) {
      console.warn(err);
    }
  }, [accessToken]);

  const updateGoal = async (key, value) => {
    const updated = { ...goals, [key]: value };
    setGoals(updated);
    if (!accessToken) return;
    
    // Map internal key to DB schema
    const payloadMap = {
      steps: 'target_steps',
      calories: 'target_calories',
      sleep: 'target_sleep_hours',
      focus: 'target_focus_minutes'
    };
    
    try {
      await updateFitnessGoalsAPI(accessToken, { [payloadMap[key]]: value });
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const [steps, calories, sleep, focus, wSteps] = await Promise.all([
        HealthService.getTodaySteps(),
        HealthService.getTodayCalories(),
        HealthService.getSleepDuration(),
        HealthService.getFocusMinutes(),
        HealthService.getWeeklySteps(),
      ]);
      setMetrics({
        steps,
        calories,
        sleepHours: sleep,
        focusMinutes: focus,
      });
      setWeeklySteps(wSteps);
      
      if (accessToken) {
        const todayStr = new Date().toISOString().slice(0, 10);
        await createOrUpdateHealthMetricAPI(accessToken, {
          date: todayStr,
          steps,
          calories,
          sleep_hours: sleep,
          distance_km: steps * 0.0008, // rough estimation
        });
      }
    } catch (err) {
      console.warn('[useHealthMetrics] Fetch error:', err.message);
    }
  }, [accessToken]);

  const requestAccess = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await HealthService.requestPermissions();
      setPermissionGranted(granted);
      await fetchMetrics();
    } catch (err) {
      console.warn('[useHealthMetrics] Permission error:', err.message);
      await fetchMetrics();
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchMetrics();
    setLoading(false);
  }, [fetchMetrics]);

  // Initial permission request + data fetch
  useEffect(() => {
    loadGoals();
    requestAccess();
  }, [requestAccess, loadGoals]);

  // Refresh on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMetrics();
      loadGoals();
    });
    return unsubscribe;
  }, [navigation, fetchMetrics, loadGoals]);

  return {
    metrics,
    weeklySteps,
    goals,
    loading,
    permissionGranted,
    refresh,
    requestAccess,
    updateGoal,
  };
}
