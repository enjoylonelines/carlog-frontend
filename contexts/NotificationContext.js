'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import {
  getNotifications,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  subscribeNotifications,
} from '../api/notification';
import { avatarColor } from '@/app/utils/avatar';

export const NotificationContext = createContext({
  items: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
});

function toItem(n) {
  return {
    id: n.notificationId,
    type: n.type,
    senderId: n.senderId,
    actorUsername: n.senderUsername ?? `user${n.senderId}`,
    actorProfileImageUrl: n.senderProfileImageUrl ?? null,
    actorColor: avatarColor(n.senderId),
    boardId: n.boardId,
    createdAt: n.createdAt,
    isRead: n.read,
  };
}

export default function NotificationContextProvider({ children }) {
  const { userId } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  // 초기 목록 로드
  useEffect(() => {
    if (!userId) return;
    getNotifications(userId).then((data) => setItems(data.map(toItem)));
  }, [userId]);

  // 전역 SSE 구독 — 페이지와 무관하게 연결 유지
  useEffect(() => {
    if (!userId) return;
    const es = subscribeNotifications(userId, (newNotif) => {
      setItems((prev) => [toItem(newNotif), ...prev]);
    });
    return () => es.close();
  }, [userId]);

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await apiMarkRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await apiMarkAllRead(userId);
  }, [userId]);

  // 동일 발신자의 특정 타입 알림을 한 번에 읽음 처리
  const markReadBySenderAndType = useCallback(
    async (senderId, type) => {
      const ids = items
        .filter((n) => n.senderId === senderId && n.type === type && !n.isRead)
        .map((n) => n.id);
      if (!ids.length) return;
      setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
      await Promise.all(ids.map((id) => apiMarkRead(id)));
    },
    [items],
  );

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ items, unreadCount, markRead, markAllRead, markReadBySenderAndType }}>
      {children}
    </NotificationContext.Provider>
  );
}
