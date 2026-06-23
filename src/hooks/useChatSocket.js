/**
 * useChatSocket — re-exports from ChatSocketContext.
 *
 * The actual WebSocket logic now lives in ChatSocketContext.js as a
 * singleton Provider at the app root. This file exists for backward
 * compatibility so any import of useChatSocket() still works.
 */
export { useChatSocketContext as useChatSocket } from '../context/ChatSocketContext';
