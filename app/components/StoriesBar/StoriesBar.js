'use client';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import { getFollowings, increaseBoardHit } from '@/api';
import { avatarColor } from '@/app/utils/avatar';
import FetchedAvatar from '../FetchedAvatar/FetchedAvatar';
import styles from './StoriesBar.module.css';

const NEW_POST_TYPES = new Set(['NEW_POST', 'POST', 'BOARD']);

function StoryAvatar({ src, color, initial }) {
  return <FetchedAvatar src={src} fallbackChar={initial} fallbackColor={color} className={styles.avatar} />;
}

export default function StoriesBar() {
  const { userId } = useContext(AuthContext);
  const { items, markReadBySenderAndType } = useContext(NotificationContext);
  const router = useRouter();
  const [followings, setFollowings] = useState([]);

  useEffect(() => {
    if (!userId) return;
    getFollowings(userId).then((data) => {
      if (Array.isArray(data)) setFollowings(data);
    });
  }, [userId]);

  // 팔로잉한 사람이 보낸 읽지 않은 새 게시물 알림에서 senderId → { boardId, notifId }
  const activeBoardMap = useMemo(() => {
    const followingTargetIds = new Set(followings.map((f) => f.targetId));
    const map = {};
    for (const item of items) {
      if (
        item.boardId &&
        !item.isRead &&
        NEW_POST_TYPES.has(item.type) &&
        followingTargetIds.has(item.senderId) &&
        !(item.senderId in map)
      ) {
        map[item.senderId] = { boardId: item.boardId, notifId: item.id };
      }
    }
    return map;
  }, [items, followings]);

  // 활성(미읽음) 앞으로 정렬
  const sorted = useMemo(() => {
    return [...followings].sort((a, b) => {
      const aActive = a.targetId in activeBoardMap ? 1 : 0;
      const bActive = b.targetId in activeBoardMap ? 1 : 0;
      return bActive - aActive;
    });
  }, [followings, activeBoardMap]);

  if (!userId || sorted.length === 0) return null;

  const openBoard = async (boardId) => {
    try {
      await increaseBoardHit(boardId);
    } finally {
      router.push(`/boards/${boardId}`);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.track}>
        {sorted.map((user) => {
          const active = activeBoardMap[user.targetId];
          const color = avatarColor(user.targetId);
          const initial = (user.username || '?')[0].toUpperCase();

          return (
            <button
              key={`${user.userId}-${user.targetId}`}
              className={styles.story}
              onClick={() => {
                if (active) {
                  markReadBySenderAndType(user.targetId, 'NEW_POST');
                  openBoard(active.boardId);
                } else {
                  router.push(`/users/${user.targetId}`);
                }
              }}
            >
              <div className={`${styles.ring} ${active ? styles.ringActive : ''}`}>
                <StoryAvatar
                  src={user.profileImageUrl}
                  color={color}
                  initial={initial}
                />
              </div>
              <span className={styles.name}>{user.username}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
