'use client';
import { useEffect } from 'react';
import { subscribeNotifications } from '../../api/notification';
import { avatarColor } from '../utils/avatar';
import { emitFeedEvent } from '../utils/feedEventBus';

export function toItem(n) {
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

const FEED_TYPE_MAP = {
  LIKE: 'UNLIKE',
  COMMENT: 'COMMENT_DELETED',
  BOARD_DELETED: 'BOARD_DELETED',
};

export function useNotificationSSE(userId, setItems) {
  useEffect(() => {
    if (!userId) return;
    const es = subscribeNotifications(
      userId,
      (newNotif) => {
        setItems((prev) => {
          let base = prev;
          if (newNotif.type === 'LIKE' && newNotif.boardId) {
            base = prev.filter(
              (n) => !(n.type === 'LIKE' && n.boardId === newNotif.boardId && n.senderId === newNotif.senderId),
            );
          }
          return [toItem(newNotif), ...base];
        });
        if (newNotif.boardId) {
          emitFeedEvent({ type: newNotif.type, boardId: Number(newNotif.boardId) });
        }
      },
      (removed) => {
        setItems((prev) => {
          const boardId = removed.boardId != null ? Number(removed.boardId) : null;
          const senderId = removed.senderId != null ? Number(removed.senderId) : null;

          if (removed.type === 'BOARD_DELETED') {
            return prev.filter((n) => n.boardId !== boardId);
          }
          if (removed.type === 'LIKE') {
            return prev.filter((n) => !(n.type === 'LIKE' && n.boardId === boardId && n.senderId === senderId));
          }
          if (removed.type === 'COMMENT') {
            const target = prev.find(
              (n) => n.type === 'COMMENT' && n.boardId === boardId && n.senderId === senderId && n.content === removed.content,
            );
            if (!target) return prev;
            return prev.filter((n) => n.id !== target.id);
          }
          if (removed.type === 'FOLLOW') {
            return prev.filter((n) => !(n.type === 'FOLLOW' && n.senderId === senderId));
          }
          return prev;
        });

        const feedType = FEED_TYPE_MAP[removed.type];
        if (feedType && removed.boardId) {
          emitFeedEvent({ type: feedType, boardId: Number(removed.boardId) });
        }
      },
    );
    return () => es.close();
  }, [userId, setItems]);
}
