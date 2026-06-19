/**
 * useChatSocket — manages the WebSocket connection lifecycle.
 *
 * Handles:
 * - Connect/disconnect with JWT auth
 * - Automatic reconnect with exponential backoff
 * - Heartbeat every 30s to keep presence alive
 * - Incoming message routing (channel msg, DM, notification, presence, connection_accepted)
 * - Exposing sendChannelMessage / sendDM helpers
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { useUser } from '../context/UserContext';

const WS_BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/^http/, 'ws') || 'ws://192.168.1.4:8000';
const HEARTBEAT_INTERVAL = 30_000; // 30s
const MAX_BACKOFF = 30_000;        // cap at 30s

export function useChatSocket() {
  const { accessToken } = useUser();
  const ws = useRef(null);
  const heartbeatTimer = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);

  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  // channel messages: { [channelId]: GiftedChat message[] }
  const [channelMessages, setChannelMessages] = useState({});
  // DM messages: { [userId]: GiftedChat message[] }
  const [dmMessages, setDmMessages] = useState({});
  // Unread notifications
  const [notifications, setNotifications] = useState([]);
  // New connection accepted events
  const [newConnections, setNewConnections] = useState([]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const toGiftedMsg = (raw, isMine) => ({
    _id: raw.id || String(Date.now()),
    text: raw.content,
    createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
    user: {
      _id: raw.sender_id,
      name: raw.sender?.username || 'Unknown',
      avatar: raw.sender?.avatar_url || null,
    },
  });

  const prependToChannel = (channelId, msg) => {
    setChannelMessages(prev => ({
      ...prev,
      [channelId]: [msg, ...(prev[channelId] || [])],
    }));
  };

  const prependToDm = (userId, msg) => {
    setDmMessages(prev => ({
      ...prev,
      [userId]: [msg, ...(prev[userId] || [])],
    }));
  };

  // ── Connect ───────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!accessToken || !isMounted.current) return;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    const url = `${WS_BASE}/api/v1/chat/ws/${accessToken}`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      if (!isMounted.current) return;
      reconnectAttempts.current = 0;
      setConnected(true);
      // Start heartbeat
      heartbeatTimer.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, HEARTBEAT_INTERVAL);
    };

    socket.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const data = JSON.parse(event.data);
        handleIncoming(data);
      } catch (_) {}
    };

    socket.onclose = () => {
      if (!isMounted.current) return;
      setConnected(false);
      clearInterval(heartbeatTimer.current);
      scheduleReconnect();
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [accessToken]);

  const scheduleReconnect = () => {
    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, MAX_BACKOFF);
    reconnectAttempts.current += 1;
    reconnectTimer.current = setTimeout(() => {
      if (isMounted.current) connect();
    }, delay);
  };

  // ── Incoming message router ───────────────────────────────────────────────

  const handleIncoming = (data) => {
    switch (data.type) {
      case 'connected':
        setOnlineUsers(data.online_users || []);
        break;

      case 'message': {
        // Channel message from another user
        const gMsg = toGiftedMsg(data);
        if (data.channel_id) prependToChannel(data.channel_id, gMsg);
        break;
      }

      case 'message_sent': {
        // Our own message echoed back with server ID + timestamp
        const gMsg = toGiftedMsg(data);
        if (data.channel_id) prependToChannel(data.channel_id, gMsg);
        break;
      }

      case 'dm': {
        // DM received
        const gMsg = toGiftedMsg(data);
        prependToDm(data.sender_id, gMsg);
        setNotifications(prev => [
          { id: String(Date.now()), kind: 'dm', from: data.sender?.username || 'Someone', message: data.content, ts: new Date() },
          ...prev,
        ]);
        break;
      }

      case 'dm_sent': {
        // Our sent DM echoed back
        const gMsg = toGiftedMsg(data);
        prependToDm(data.recipient_id, gMsg);
        break;
      }

      case 'presence_update':
        setOnlineUsers(prev => {
          if (data.status === 'online') {
            return prev.includes(data.user_id) ? prev : [...prev, data.user_id];
          } else {
            return prev.filter(id => id !== data.user_id);
          }
        });
        break;

      case 'notification':
        setNotifications(prev => [
          { id: String(Date.now()), kind: data.kind, post_id: data.post_id, actor_id: data.actor_id, message: data.message, ts: new Date() },
          ...prev,
        ]);
        break;

      case 'connection_accepted':
        // A follow request was accepted — DMs are now unlocked with this user
        setNewConnections(prev => [...prev, data]);
        setNotifications(prev => [
          { id: String(Date.now()), kind: 'connection', message: data.message, accepted_by_id: data.accepted_by_id, ts: new Date() },
          ...prev,
        ]);
        break;

      default:
        break;
    }
  };

  // ── Send helpers ──────────────────────────────────────────────────────────

  const sendChannelMessage = useCallback((channelId, content) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return false;
    ws.current.send(JSON.stringify({ type: 'send_message', channel_id: channelId, content }));
    return true;
  }, []);

  const sendDM = useCallback((recipientId, content) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return false;
    ws.current.send(JSON.stringify({ type: 'send_dm', recipient_id: recipientId, content }));
    return true;
  }, []);

  const joinChannel = useCallback((channelId) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'join_channel', channel_id: channelId }));
  }, []);

  const loadChannelHistory = useCallback((channelId, history) => {
    setChannelMessages(prev => ({
      ...prev,
      [channelId]: history.map(m => toGiftedMsg(m)),
    }));
  }, []);

  const loadDmHistory = useCallback((userId, history) => {
    setDmMessages(prev => ({
      ...prev,
      [userId]: history.map(m => toGiftedMsg(m)),
    }));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    if (accessToken) connect();

    // Reconnect when app comes back to foreground
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

  return {
    connected,
    onlineUsers,
    channelMessages,
    dmMessages,
    notifications,
    newConnections,
    sendChannelMessage,
    sendDM,
    joinChannel,
    loadChannelHistory,
    loadDmHistory,
    clearNotifications,
  };
}
