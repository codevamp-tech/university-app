/**
 * useSocket.js
 * ─────────────
 * React hook for persistent WebSocket connection to the UniCampus backend.
 * Handles authentication, auto-reconnect, keepalive ping, and event dispatch.
 *
 * Usage:
 *   const { isConnected } = useSocket(accessToken, {
 *     onPostLike:    (data) => ...,
 *     onNewComment:  (data) => ...,
 *     onNewPost:     (data) => ...,
 *     onNotification:(data) => ...,
 *   });
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { APP_CONFIG } from '../config/appConfig';

// Derive WebSocket URL from the HTTP base URL
const getWsUrl = (token) => {
  const httpBase = APP_CONFIG.API_BASE_URL || '';
  const wsBase = httpBase.replace(/^http/, 'ws');
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
};

const PING_INTERVAL_MS = 25000;  // Send ping every 25 seconds
const RECONNECT_DELAY_MS = 3000; // Wait 3 seconds before reconnecting
const MAX_RECONNECT_ATTEMPTS = 10;

export function useSocket(accessToken, handlers = {}) {
  const wsRef = useRef(null);
  const pingRef = useRef(null);
  const reconnectRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  const {
    onPostLike,
    onPostReaction,
    onNewComment,
    onNewPost,
    onNotification,
  } = handlers;

  const clearPing = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  }, []);

  const clearReconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!accessToken || !isMounted.current) return;

    // Close any existing connection cleanly
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnect loop on intentional close
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = getWsUrl(accessToken);
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.warn('[WS] Failed to create WebSocket:', err);
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      console.log('[WS] Connected ✅');
      setIsConnected(true);
      reconnectAttempts.current = 0;

      // Start keepalive ping
      clearPing();
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'post_like':
            onPostLike?.(msg);
            break;
          case 'post_reaction':
            onPostReaction?.(msg);
            break;
          case 'new_comment':
            onNewComment?.(msg);
            break;
          case 'new_post':
            onNewPost?.(msg);
            break;
          case 'notification':
            onNotification?.(msg);
            break;
          case 'connected':
            console.log('[WS] Server confirmed connection for user:', msg.user_id);
            break;
          case 'pong':
            // Keepalive acknowledged — connection is healthy
            break;
          default:
            break;
        }
      } catch (err) {
        console.warn('[WS] Failed to parse message:', event.data, err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WS] Error:', err?.message || err);
    };

    ws.onclose = (event) => {
      if (!isMounted.current) return;
      console.log(`[WS] Disconnected (code=${event.code}). Will reconnect...`);
      setIsConnected(false);
      clearPing();

      // Don't reconnect on auth failure (4001) or intentional close (1000)
      if (event.code === 4001 || event.code === 1000) return;

      // Exponential backoff reconnect
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts.current);
        reconnectAttempts.current += 1;
        reconnectRef.current = setTimeout(connect, Math.min(delay, 30000));
      }
    };
  }, [accessToken, clearPing, onPostLike, onPostReaction, onNewComment, onNewPost, onNotification]);

  useEffect(() => {
    isMounted.current = true;
    if (accessToken) {
      connect();
    }
    return () => {
      isMounted.current = false;
      clearPing();
      clearReconnect();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000);
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [accessToken]); // Only reconnect when token changes

  return { isConnected };
}
