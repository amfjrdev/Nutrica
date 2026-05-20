import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { getMyNotifications, markNotificationRead } from '../services/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const connectionRef = useRef(null);

  // Fetch stored notifications from REST (handles offline delivery)
  const fetchHistory = useCallback(async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch {
      // silently ignore — SignalR will still deliver real-time ones
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();

    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/notifications', {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (n) => {
      setNotifications((prev) => {
        // deduplicate by id
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev];
      });
    });

    connection.start().catch(() => {/* reconnect handles retries */});
    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [fetchHistory]);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {/* ignore */}
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.allSettled(unread.map((n) => markNotificationRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, loading, unreadCount, markRead, markAllRead };
};
