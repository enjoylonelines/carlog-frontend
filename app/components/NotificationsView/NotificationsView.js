'use client';
import { useContext, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationContext } from '../../../contexts/NotificationContext';
import { increaseBoardHit } from '../../../api';
import { avatarColor } from '../../utils/avatar';
import styles from './NotificationsView.module.css';

function NotifAvatar({ src, fallbackColor, username }) {
  const [errSrc, setErrSrc] = useState(null);
  if (src && src !== errSrc) {
    return <img src={src} alt={username} className={styles.avatarImg} onError={() => setErrSrc(src)} />;
  }
  return (
    <div className={styles.avatar} style={{ background: fallbackColor }}>
      {username[0].toUpperCase()}
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

const FollowBadge = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const CommentBadge = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PostBadge = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TYPE_META = {
  FOLLOW: {
    label: '팔로우',
    badgeBg: '#3897F0',
    Badge: FollowBadge,
    message: '회원님을 팔로우하기 시작했습니다.',
  },
  COMMENT: {
    label: '댓글',
    badgeBg: '#E03131',
    Badge: CommentBadge,
    message: '댓글을 남겼습니다.',
  },
  NEW_POST: {
    label: '새 게시글',
    badgeBg: '#F76707',
    Badge: PostBadge,
    message: '게시글이 추가되었습니다.',
  },
};

const SWIPE_THRESHOLD = 60;
const DELETE_SNAP = 72;

function SwipeableNotifItem({ item, onRead, onReadBySenderAndType, onDelete }) {
  const router = useRouter();
  const meta = TYPE_META[item.type] ?? TYPE_META.COMMENT;

  const startXRef = useRef(null);
  const currentXRef = useRef(0);
  const innerRef = useRef(null);
  const [swiped, setSwiped] = useState(false);

  const snapTo = useCallback((x, animate = true) => {
    const el = innerRef.current;
    if (!el) return;
    if (animate) el.style.transition = 'transform 0.2s ease';
    else el.style.transition = 'none';
    el.style.transform = `translateX(${x}px)`;
    currentXRef.current = x;
  }, []);

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    if (innerRef.current) innerRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const base = swiped ? -DELETE_SNAP : 0;
    const next = Math.min(0, Math.max(-DELETE_SNAP - 10, base + dx));
    if (innerRef.current) innerRef.current.style.transform = `translateX(${next}px)`;
  };

  const handleTouchEnd = (e) => {
    if (startXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - startXRef.current;
    startXRef.current = null;

    if (!swiped && dx < -SWIPE_THRESHOLD) {
      snapTo(-DELETE_SNAP);
      setSwiped(true);
    } else if (swiped && dx > SWIPE_THRESHOLD) {
      snapTo(0);
      setSwiped(false);
    } else {
      snapTo(swiped ? -DELETE_SNAP : 0);
    }
  };

  const openBoard = async (boardId) => {
    try {
      await increaseBoardHit(boardId);
    } finally {
      router.push(`/boards/${boardId}`);
    }
  };

  const handleItemClick = () => {
    if (swiped) {
      snapTo(0);
      setSwiped(false);
      return;
    }
    if (item.type === 'NEW_POST') {
      onReadBySenderAndType(item.senderId, 'NEW_POST');
    } else {
      onRead(item.id);
    }
    if (item.type === 'FOLLOW') {
      router.push(`/users/${item.senderId}`);
    } else if (item.boardId) {
      openBoard(item.boardId);
    }
  };

  return (
    <div className={styles.swipeRow}>
      <div
        ref={innerRef}
        className={styles.swipeInner}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button className={`${styles.item} ${!item.isRead ? styles.unread : ''}`} onClick={handleItemClick}>
          <div className={styles.avatarWrap}>
            {item.actorProfileImageUrl ? (
              <NotifAvatar src={item.actorProfileImageUrl} fallbackColor={item.actorColor} username={item.actorUsername} />
            ) : (
              <div className={styles.avatar} style={{ background: item.actorColor }}>
                {item.actorUsername[0].toUpperCase()}
              </div>
            )}
            <span className={styles.badge} style={{ background: meta.badgeBg }}>
              <meta.Badge />
            </span>
          </div>
          <div className={styles.textWrap}>
            <p className={styles.message}>
              <strong>{item.actorUsername}</strong> {meta.message}
            </p>
            {item.content && (
              <p className={styles.commentPreview}>{item.content}</p>
            )}
            <span className={styles.time}>{timeAgo(item.createdAt)}</span>
          </div>
          {!item.isRead && <div className={styles.dot} />}
        </button>
      </div>
      <button className={styles.deleteReveal} onClick={() => onDelete(item.id)} aria-label="삭제">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}

export default function NotificationsView() {
  const { items, unreadCount, markRead, markAllRead, markReadBySenderAndType, deleteOne, deleteAll } =
    useContext(NotificationContext);

  const todayItems = items.filter((n) => Date.now() - new Date(n.createdAt) < 86400 * 1000);
  const olderItems = items.filter((n) => Date.now() - new Date(n.createdAt) >= 86400 * 1000);

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>알림</h1>
        <div className={styles.topActions}>
          {unreadCount > 0 && (
            <button className={styles.readAllBtn} onClick={markAllRead}>
              모두 읽음
            </button>
          )}
          {items.length > 0 && (
            <button className={styles.deleteAllBtn} onClick={deleteAll}>
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {todayItems.length > 0 && (
        <section>
          <div className={styles.sectionLabel}>오늘</div>
          {todayItems.map((n) => (
            <SwipeableNotifItem
              key={n.id}
              item={n}
              onRead={markRead}
              onReadBySenderAndType={markReadBySenderAndType}
              onDelete={deleteOne}
            />
          ))}
        </section>
      )}

      {olderItems.length > 0 && (
        <section>
          <div className={styles.sectionLabel}>이번 주</div>
          {olderItems.map((n) => (
            <SwipeableNotifItem
              key={n.id}
              item={n}
              onRead={markRead}
              onReadBySenderAndType={markReadBySenderAndType}
              onDelete={deleteOne}
            />
          ))}
        </section>
      )}

      {items.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔔</span>
          <p>아직 알림이 없어요.</p>
        </div>
      )}
    </div>
  );
}
