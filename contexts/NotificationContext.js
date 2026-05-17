'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { getNotifications } from '../api/notification';
import { toItem, useNotificationSSE } from '../app/hooks/useNotificationSSE';
import { useNotificationActions } from '../app/hooks/useNotificationActions';

export const NotificationContext = createContext({
  items: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  deleteOne: () => {},
  deleteAll: () => {},
});

export default function NotificationContextProvider({ children }) {
  const { userId } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!userId) return;
    getNotifications(userId).then((data) => setItems(data.map(toItem)));
  }, [userId]);

  useNotificationSSE(userId, setItems);
  const actions = useNotificationActions(userId, items, setItems);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ items, unreadCount, ...actions }}>
      {children}
    </NotificationContext.Provider>
  );
}
