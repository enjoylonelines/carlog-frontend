'use client';
import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationContext } from '../../../contexts/NotificationContext';
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

// API 응답 → 화면 아이템 변환
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

function NotifItem({ item, onRead, onReadBySenderAndType }) {
  const router = useRouter();
  const meta = TYPE_META[item.type] ?? TYPE_META.COMMENT;

  const handleClick = () => {
    if (item.type === 'NEW_POST') {
      onReadBySenderAndType(item.senderId, 'NEW_POST');
    } else {
      onRead(item.id);
    }
    if (item.type === 'FOLLOW') {
      router.push(`/users/${item.senderId}`);
    } else if (item.boardId) {
      router.push(`/boards/${item.boardId}`);
    }
  };

  return (
    <button className={`${styles.item} ${!item.isRead ? styles.unread : ''}`} onClick={handleClick}>
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
        <span className={styles.time}>{timeAgo(item.createdAt)}</span>
      </div>
      {!item.isRead && <div className={styles.dot} />}
    </button>
  );
}

export default function NotificationsView() {
  const { items, unreadCount, markRead, markAllRead, markReadBySenderAndType } = useContext(NotificationContext);

  const todayItems = items.filter((n) => Date.now() - new Date(n.createdAt) < 86400 * 1000);
  const olderItems = items.filter((n) => Date.now() - new Date(n.createdAt) >= 86400 * 1000);

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>알림</h1>
        {unreadCount > 0 && (
          <button className={styles.readAllBtn} onClick={markAllRead}>
            모두 읽음
          </button>
        )}
      </div>

      {todayItems.length > 0 && (
        <section>
          <div className={styles.sectionLabel}>오늘</div>
          {todayItems.map((n) => (
            <NotifItem key={n.id} item={n} onRead={markRead} onReadBySenderAndType={markReadBySenderAndType} />
          ))}
        </section>
      )}

      {olderItems.length > 0 && (
        <section>
          <div className={styles.sectionLabel}>이번 주</div>
          {olderItems.map((n) => (
            <NotifItem key={n.id} item={n} onRead={markRead} onReadBySenderAndType={markReadBySenderAndType} />
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
