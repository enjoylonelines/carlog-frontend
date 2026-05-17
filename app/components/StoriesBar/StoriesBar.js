'use client';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import { getFollowings, increaseBoardHit } from '@/api';
import { avatarColor } from '@/app/utils/avatar';
import { onFollowEvent } from '@/app/utils/followCache';
import FetchedAvatar from '../FetchedAvatar/FetchedAvatar';
import styles from './StoriesBar.module.css';

// 세션 내 읽은 스토리 기록 — 컴포넌트 재마운트 후에도 유지
const viewedStoryIds = new Set();

const NEW_POST_TYPES = new Set(['NEW_POST', 'POST', 'BOARD']);

function StoryAvatar({ src, color, initial }) {
  return <FetchedAvatar src={src} fallbackChar={initial} fallbackColor={color} className={styles.avatar} />;
}

export default function StoriesBar() {
  const { userId } = useContext(AuthContext);
  const { items, markReadBySenderAndType } = useContext(NotificationContext);
  const router = useRouter();
  const [followings, setFollowings] = useState([]);
  const [viewedVersion, setViewedVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    getFollowings(userId).then((data) => {
      if (Array.isArray(data)) setFollowings(data);
    });
  }, [userId]);

  // 팔로우/언팔로우 이벤트 수신 → 스토리 목록 즉시 반영
  useEffect(() => {
    return onFollowEvent(({ type, targetId, username, profileImageUrl }) => {
      if (type === 'follow') {
        setFollowings((prev) => {
          if (prev.some((f) => f.targetId === targetId)) return prev;
          return [...prev, { targetId, username, profileImageUrl }];
        });
      } else {
        setFollowings((prev) => prev.filter((f) => f.targetId !== targetId));
      }
    });
  }, []);

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

  // 활성(미읽음) 앞, 읽은 것 뒤, 나머지 중간
  const sorted = useMemo(() => {
    const score = (user) => {
      if (user.targetId in activeBoardMap) return 2;
      if (viewedStoryIds.has(user.targetId)) return 0;
      return 1;
    };
    return [...followings].sort((a, b) => score(b) - score(a));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followings, activeBoardMap, viewedVersion]);

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
                  viewedStoryIds.add(user.targetId);
                  setViewedVersion((v) => v + 1);
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
