/**
 * ChatSocketContext — singleton WebSocket connection for the entire app.
 *
 * Key features:
 * - One WS connection shared across all screens (no per-screen reconnect delay)
 * - Pending message queue: if a message is sent while still connecting,
 *   it is queued and flushed automatically once the socket opens
 * - Automatic reconnect with exponential backoff
 * - Heartbeat every 30s to keep presence alive
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { AppState } from 'react-native';
import { useUser } from './UserContext';

const WS_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/^http/, 'ws') ||
  'ws://192.168.1.4:8000';
const HEARTBEAT_INTERVAL = 30_000;
const MAX_BACKOFF = 30_000;

const ChatSocketContext = createContext(null);

export function ChatSocketProvider({ children }) {
  const { accessToken } = useUser();
  const ws = useRef(null);
  const heartbeatTimer = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);

  // ── Pending queue: messages buffered while socket is CONNECTING ────────────
  // Each item: { payload: string (JSON), optimisticFn?: () => void }
  const pendingQueue = useRef([]);

  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [channelMessages, setChannelMessages] = useState({});
  const [dmMessages, setDmMessages] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [newConnections, setNewConnections] = useState([]);
  const [lastError, setLastError] = useState(null);

  // ── Stable state helpers ───────────────────────────────────────────────────

  const toGiftedMsg = (raw) => ({
    _id: raw.id || String(Date.now()),
    text: raw.content,
    createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
    user: {
      _id: raw.sender_id,
      name: raw.sender?.name || raw.sender?.username || 'Unknown',
      avatar: raw.sender?.avatar_url || null,
    },
  });

  const prependToChannel = useCallback((channelId, msg) => {
    setChannelMessages((prev) => ({
      ...prev,
      [channelId]: [msg, ...(prev[channelId] || [])],
    }));
  }, []);

  const prependToDm = useCallback((userId, msg) => {
    setDmMessages((prev) => ({
      ...prev,
      [userId]: [msg, ...(prev[userId] || [])],
    }));
  }, []);

  // ── Flush pending queue once the socket is open ────────────────────────────

  const flushQueue = useCallback(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    while (pendingQueue.current.length > 0) {
      const item = pendingQueue.current.shift();
      try {
        ws.current.send(item.payload);
        // Apply the optimistic update that was deferred
        item.optimisticFn?.();
      } catch (e) {
        console.warn('[WS] Failed to flush queued message', e);
      }
    }
  }, []);

  // ── Enqueue or send immediately ────────────────────────────────────────────

  const sendOrQueue = useCallback((payload, optimisticFn) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(payload);
      optimisticFn?.();
      return true;
    }
    // Socket is CONNECTING or not yet created — queue it
    pendingQueue.current.push({ payload, optimisticFn });
    // Trigger a connect attempt if the socket is completely gone
    if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
      // connect() will be called by the lifecycle effect, but nudge it here too
      connectRef.current?.();
    }
    return true; // Return true optimistically — the message WILL be sent
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect ────────────────────────────────────────────────────────────────

  // Keep a ref to connect() so sendOrQueue can call it without stale closure
  const connectRef = useRef(null);

  const connect = useCallback(() => {
    if (!accessToken || !isMounted.current) return;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      flushQueue(); // already open — just flush any queued messages
      return;
    }
    if (
      ws.current &&
      ws.current.readyState === WebSocket.CONNECTING
    ) {
      return; // already connecting — the onopen handler will flush
    }
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close();
    }

    const url = `${WS_BASE}/api/v1/chat/ws/${accessToken}`;
    console.log('[WS] Connecting to', url);
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      if (!isMounted.current) return;
      console.log('[WS] Connected ✓');
      reconnectAttempts.current = 0;
      setConnected(true);
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, HEARTBEAT_INTERVAL);
      // ← Flush any messages that were queued while connecting
      flushQueue();
    };

    socket.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const data = JSON.parse(event.data);
        handleIncoming(data);
      } catch (_) {}
    };

    socket.onclose = (event) => {
      if (!isMounted.current) return;
      console.log('[WS] Closed', event.code, event.reason);
      setConnected(false);
      clearInterval(heartbeatTimer.current);
      scheduleReconnect();
    };

    socket.onerror = (e) => {
      console.warn('[WS] Error', e?.message);
      socket.close();
    };
  }, [accessToken, flushQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep connectRef in sync
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const scheduleReconnect = () => {
    clearTimeout(reconnectTimer.current);
    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, MAX_BACKOFF);
    reconnectAttempts.current += 1;
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
    reconnectTimer.current = setTimeout(() => {
      if (isMounted.current) connectRef.current?.();
    }, delay);
  };

  // ── Incoming message router ────────────────────────────────────────────────

  const handleIncoming = (data) => {
    switch (data.type) {
      case 'connected':
        setOnlineUsers(data.online_users || []);
        break;

      case 'message': {
        const gMsg = toGiftedMsg(data);
        if (data.channel_id) prependToChannel(data.channel_id, gMsg);
        break;
      }

      case 'message_sent': {
        // Server echo — replace the matching optimistic message
        const gMsg = toGiftedMsg(data);
        if (data.channel_id) {
          setChannelMessages((prev) => {
            const existing = prev[data.channel_id] || [];
            const filtered = existing.filter(
              (m) => !(m.pending && m.text === gMsg.text)
            );
            return { ...prev, [data.channel_id]: [gMsg, ...filtered] };
          });
        }
        break;
      }

      case 'dm': {
        const gMsg = toGiftedMsg(data);
        prependToDm(data.sender_id, gMsg);
        setNotifications((prev) => [
          {
            id: String(Date.now()),
            kind: 'dm',
            from: data.sender?.username || 'Someone',
            message: data.content,
            ts: new Date(),
          },
          ...prev,
        ]);
        break;
      }

      case 'dm_sent': {
        // Server echo — replace the matching optimistic DM
        const gMsg = toGiftedMsg(data);
        if (data.recipient_id) {
          setDmMessages((prev) => {
            const existing = prev[data.recipient_id] || [];
            const filtered = existing.filter(
              (m) => !(m.pending && m.text === gMsg.text)
            );
            return { ...prev, [data.recipient_id]: [gMsg, ...filtered] };
          });
        }
        break;
      }

      case 'presence_update':
        setOnlineUsers((prev) => {
          if (data.status === 'online') {
            return prev.includes(data.user_id) ? prev : [...prev, data.user_id];
          }
          return prev.filter((id) => id !== data.user_id);
        });
        break;

      case 'notification':
        setNotifications((prev) => [
          {
            id: String(Date.now()),
            kind: data.kind,
            post_id: data.post_id,
            actor_id: data.actor_id,
            message: data.message,
            ts: new Date(),
          },
          ...prev,
        ]);
        break;

      case 'connection_accepted':
        setNewConnections((prev) => [...prev, data]);
        setNotifications((prev) => [
          {
            id: String(Date.now()),
            kind: 'connection',
            message: data.message,
            accepted_by_id: data.accepted_by_id,
            ts: new Date(),
          },
          ...prev,
        ]);
        break;

      case 'error':
        console.warn('[WS] Server error:', data.message);
        setLastError(data.message || 'Something went wrong');
        break;

      default:
        break;
    }
  };

  // ── Send helpers ───────────────────────────────────────────────────────────

  const sendChannelMessage = useCallback(
    (channelId, content, senderInfo = {}) => {
      const payload = JSON.stringify({ type: 'send_message', channel_id: channelId, content });
      const optimisticMsg = {
        _id: 'opt_' + Date.now(),
        text: content,
        createdAt: new Date(),
        user: {
          _id: senderInfo.id || 'me',
          name: senderInfo.name || senderInfo.username || 'You',
          avatar: senderInfo.avatar_url || null,
        },
        pending: true,
      };
      // Show optimistic message immediately regardless of connection state
      prependToChannel(channelId, optimisticMsg);
      // Send now if open, queue if connecting
      sendOrQueue(payload, null); // optimistic already applied above
      return true;
    },
    [prependToChannel, sendOrQueue]
  );

  const sendDM = useCallback(
    (recipientId, content, senderInfo = {}, source = 'social') => {
      const payload = JSON.stringify({
        type: 'send_dm',
        recipient_id: recipientId,
        content,
        source,
      });
      const optimisticMsg = {
        _id: 'opt_' + Date.now(),
        text: content,
        createdAt: new Date(),
        user: {
          _id: senderInfo.id || 'me',
          name: senderInfo.name || senderInfo.username || 'You',
          avatar: senderInfo.avatar_url || null,
        },
        pending: true,
      };
      // Show optimistic message immediately
      prependToDm(recipientId, optimisticMsg);
      // Send now if open, queue if connecting
      sendOrQueue(payload, null); // optimistic already applied above
      return true; // always return true — message will be delivered
    },
    [prependToDm, sendOrQueue]
  );

  const joinChannel = useCallback((channelId) => {
    const payload = JSON.stringify({ type: 'join_channel', channel_id: channelId });
    sendOrQueue(payload, null);
  }, [sendOrQueue]);

  const loadChannelHistory = useCallback((channelId, history) => {
    const reversed = [...history].reverse();
    setChannelMessages((prev) => ({
      ...prev,
      [channelId]: reversed.map((m) => toGiftedMsg(m)),
    }));
  }, []);

  const loadDmHistory = useCallback((userId, history) => {
    const reversed = [...history].reverse();
    setDmMessages((prev) => ({
      ...prev,
      [userId]: reversed.map((m) => toGiftedMsg(m)),
    }));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);
  const clearError = useCallback(() => setLastError(null), []);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    if (accessToken) connect();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && accessToken) {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    });

    return () => {
      isMounted.current = false;
      clearInterval(heartbeatTimer.current);
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
      sub.remove();
    };
  }, [accessToken, connect]);

  const value = {
    connected,
    onlineUsers,
    channelMessages,
    dmMessages,
    notifications,
    newConnections,
    lastError,
    sendChannelMessage,
    sendDM,
    joinChannel,
    loadChannelHistory,
    loadDmHistory,
    clearNotifications,
    clearError,
  };

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}

/** Use inside any screen to access the shared WebSocket state */
export function useChatSocketContext() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    throw new Error('useChatSocketContext must be used inside <ChatSocketProvider>');
  }
  return ctx;
}
