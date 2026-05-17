'use client';
import { useCallback } from 'react';
import {
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  deleteNotification as apiDeleteOne,
  deleteAllNotifications as apiDeleteAll,
} from '../../api/notification';

export function useNotificationActions(userId, items, setItems) {
  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await apiMarkRead(id);
  }, [setItems]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await apiMarkAllRead(userId);
  }, [userId, setItems]);

  const markReadBySenderAndType = useCallback(
    async (senderId, type) => {
      const ids = items
        .filter((n) => n.senderId === senderId && n.type === type && !n.isRead)
        .map((n) => n.id);
      if (!ids.length) return;
      setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
      await Promise.all(ids.map((id) => apiMarkRead(id)));
    },
    [items, setItems],
  );

  const deleteOne = useCallback(async (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await apiDeleteOne(id);
  }, [setItems]);

  const deleteAll = useCallback(async () => {
    if (!userId) return;
    setItems([]);
    await apiDeleteAll(userId);
  }, [userId, setItems]);

  const deleteByBoardId = useCallback((boardId) => {
    const id = Number(boardId);
    setItems((prev) => prev.filter((n) => n.boardId !== id));
  }, [setItems]);

  const updateCommentContent = useCallback((boardId, senderId, oldContent, newContent) => {
    const bid = Number(boardId);
    const sid = Number(senderId);
    setItems((prev) =>
      prev.map((n) =>
        n.boardId === bid && n.senderId === sid && n.type === 'COMMENT' && n.content === oldContent
          ? { ...n, content: newContent }
          : n,
      ),
    );
  }, [setItems]);

  return { markRead, markAllRead, markReadBySenderAndType, deleteOne, deleteAll, deleteByBoardId, updateCommentContent };
}
