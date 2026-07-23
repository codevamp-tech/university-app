/**
 * NotificationService.js
 *
 * Centralized wrapper around expo-notifications.
 * - Call initialize() once after login to request permissions and set handlers.
 * - Call showLocalNotification(title, body, data?) to fire an immediate banner
 *   (works even while the app is in the foreground).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications as banners even when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let _initialized = false;

/**
 * Request notification permissions and set up the handler.
 * Safe to call multiple times — only runs once per session.
 */
export async function initialize() {
  if (_initialized) return;
  _initialized = true;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EA580C',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Permission not granted — banners will not appear.');
    } else {
      console.log('[NotificationService] Permissions granted ✓');
    }
  } catch (e) {
    console.warn('[NotificationService] initialize error:', e);
  }
}

/**
 * Schedule an immediate local notification banner.
 *
 * @param {string} title  - Bold notification title
 * @param {string} body   - Message body text
 * @param {object} [data] - Optional extra payload (for tap-to-navigate)
 */
export async function showLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    console.warn('[NotificationService] showLocalNotification error:', e);
  }
}

export default { initialize, showLocalNotification };
