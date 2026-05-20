import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = `${window.location.origin}/hubs/chat`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the logged-in user's ID from localStorage (set by the login response). */
export const getStoredUserId = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')?.userId ?? '';
  } catch {
    return '';
  }
};

/** Normalise a raw message object from either MessageHistory or ReceiveMessage. */
const normalize = (senderUserId, senderRole, message, sentAt) => ({
  id:           `${Date.now()}-${Math.random()}`,
  senderUserId: senderUserId ?? '',
  // Always lowercase so UI comparisons are consistent: 'client' | 'nutritionist'
  senderRole:   (senderRole ?? '').toLowerCase(),
  message:      message ?? '',
  // sentAt arrives as an ISO string with 'Z' suffix (backend guarantees Kind=Utc)
  sentAt:       sentAt ?? new Date().toISOString(),
  system:       false,
});

/** Build a fresh SignalR connection — called once per effect run. */
const buildConnection = () =>
  new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      transport: signalR.HttpTransportType.WebSockets,
      skipNegotiation: true,
      // accessTokenFactory is the correct way to pass a JWT to SignalR.
      // Using ?access_token= in the URL exposes the token in server logs.
      accessTokenFactory: () => localStorage.getItem('token') ?? '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

// ---------------------------------------------------------------------------
// useChat hook
// ---------------------------------------------------------------------------

/**
 * Manages the full SignalR lifecycle for one appointment chat session.
 *
 * @param {string|null} appointmentId  UUID of the active appointment.
 * @returns {{ messages, connected, error, sendMessage }}
 */
export const useChat = (appointmentId) => {
  // connRef holds the active connection so sendMessage can reach it without
  // being inside the effect closure.
  const connRef = useRef(null);

  const [messages,  setMessages]  = useState([]);
  const [connected, setConnected] = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!appointmentId) return;

    // `cancelled` is set to true in the cleanup function.
    // Every async callback checks it before touching React state, preventing
    // stale updates after the component unmounts or appointmentId changes.
    let cancelled = false;

    const currentUserId = getStoredUserId();
    console.log('[useChat] starting | appt:', appointmentId, '| user:', currentUserId);

    const conn = buildConnection();

    // ------------------------------------------------------------------
    // Register all server → client event handlers BEFORE calling start().
    // SignalR buffers events that arrive before handlers are registered,
    // but registering first is the safest pattern.
    // ------------------------------------------------------------------

    /** Full history sent by the server immediately after JoinSession. */
    conn.on('MessageHistory', (history) => {
      if (cancelled || !Array.isArray(history)) return;
      console.log('[useChat] MessageHistory:', history.length, 'messages');
      setMessages(
        history.map((m) => normalize(m.senderUserId, m.senderRole, m.message, m.sentAt))
      );
    });

    /** A new message broadcast to everyone in the room. */
    conn.on('ReceiveMessage', (senderUserId, senderRole, message, sentAt) => {
      if (cancelled) return;
      console.log('[useChat] ReceiveMessage | isOwn:',
        senderUserId?.toLowerCase() === currentUserId?.toLowerCase());
      setMessages((prev) => [
        ...prev,
        normalize(senderUserId, senderRole, message, sentAt),
      ]);
    });

    conn.on('UserJoined', () => {
      if (cancelled) return;
      setMessages((prev) => [
        ...prev,
        { id: `sys-${Date.now()}`, system: true, message: 'User joined the session.' },
      ]);
    });

    conn.on('UserLeft', () => {
      if (cancelled) return;
      setMessages((prev) => [
        ...prev,
        { id: `sys-${Date.now()}`, system: true, message: 'User left the session.' },
      ]);
    });

    conn.on('Error', (msg) => {
      if (cancelled) return;
      console.error('[useChat] server error:', msg);
      setError(msg);
    });

    // ------------------------------------------------------------------
    // Reset UI state synchronously, then start the connection.
    // Resetting here (not in cleanup) guarantees the reset always happens
    // before MessageHistory arrives — never after.
    // ------------------------------------------------------------------
    setMessages([]);
    setConnected(false);
    setError('');

    const run = async () => {
      // Stop the previous connection before starting a new one.
      // We clear connRef first so the cleanup function can't double-stop
      // the same instance if it fires concurrently.
      const prev = connRef.current;
      connRef.current = null;

      if (prev && prev.state !== signalR.HubConnectionState.Disconnected) {
        try { await prev.stop(); } catch { /* already stopped — safe to ignore */ }
      }

      if (cancelled) return;

      connRef.current = conn;

      try {
        await conn.start();

        if (cancelled) {
          // Component unmounted while we were connecting — clean up immediately.
          conn.stop();
          return;
        }

        console.log('[useChat] connected — invoking JoinSession');
        setConnected(true);

        // JoinSession triggers MessageHistory on the server side.
        await conn.invoke('JoinSession', appointmentId);
      } catch (err) {
        if (cancelled) return;
        console.error('[useChat] connection failed:', err);
        setError('Failed to connect to chat. Retrying…');
      }
    };

    run();

    // ------------------------------------------------------------------
    // Cleanup — runs when appointmentId changes or component unmounts.
    // ------------------------------------------------------------------
    return () => {
      cancelled = true;
      setConnected(false);

      // Grab and clear the ref so run() can't double-stop.
      const active = connRef.current;
      connRef.current = null;

      if (active) {
        if (active.state === signalR.HubConnectionState.Connected) {
          // Best-effort LeaveSession — fire and forget.
          active.invoke('LeaveSession', appointmentId).catch(() => {});
        }
        active.stop().catch(() => {});
      }
    };
  }, [appointmentId]);

  /** Send a message to the active appointment room. */
  const sendMessage = useCallback(async (message) => {
    const conn = connRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    await conn.invoke('SendMessage', appointmentId, message);
  }, [appointmentId]);

  return { messages, connected, error, sendMessage };
};
