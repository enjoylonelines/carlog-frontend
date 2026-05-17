'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import {
  getNotifications,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  deleteNotification as apiDeleteOne,
  deleteAllNotifications as apiDeleteAll,
  subscribeNotifications,
} from '../api/notification';
import { avatarColor } from '@/app/utils/avatar';

export const NotificationContext = createContext({
  items: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  deleteOne: () => {},
  deleteAll: () => {},
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
    content: n.content ?? null,
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
      setItems((prev) => {
        // LIKE는 같은 sender+board의 기존 항목을 교체 (중복 방지)
        let base = prev;
        if (newNotif.type === 'LIKE' && newNotif.boardId) {
          base = prev.filter(
            (n) => !(n.type === 'LIKE' && n.boardId === newNotif.boardId && n.senderId === newNotif.senderId),
          );
        }
        return [toItem(newNotif), ...base];
      });
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

  const deleteOne = useCallback(async (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await apiDeleteOne(id);
  }, []);

  const deleteAll = useCallback(async () => {
    if (!userId) return;
    setItems([]);
    await apiDeleteAll(userId);
  }, [userId]);

  const deleteByBoardId = useCallback((boardId) => {
    const id = Number(boardId);
    setItems((prev) => prev.filter((n) => n.boardId !== id));
  }, []);

  const updateCommentContent = useCallback((boardId, senderId, oldContent, newContent) => {
    const bid = Number(boardId);
    const sid = Number(senderId);
    setItems((prev) =>
      prev.map((n) =>
        n.boardId === bid && n.senderId === sid && n.type === 'COMMENT' && n.content === oldContent
          ? { ...n, content: newContent }
          : n
      )
    );
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ items, unreadCount, markRead, markAllRead, markReadBySenderAndType, deleteOne, deleteAll, deleteByBoardId, updateCommentContent }}>
      {children}
    </NotificationContext.Provider>
  );
}
