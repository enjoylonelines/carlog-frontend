'use client';
import { useState } from 'react';
import styles from './NotificationsView.module.css';

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
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const CommentBadge = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const TYPE_META = {
  FOLLOW:  { label: '팔로우',  badgeBg: '#3897F0', Badge: FollowBadge },
  COMMENT: { label: '댓글',    badgeBg: '#E03131', Badge: CommentBadge },
};

const now = Date.now();
const MOCK_NOTIFICATIONS = [
  {
    id: 1, type: 'FOLLOW',
    actorUsername: 'speedking_kim', actorColor: '#E03131',
    message: '회원님을 팔로우하기 시작했습니다.',
    createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 2, type: 'COMMENT',
    actorUsername: 'porsche_diary', actorColor: '#45B7D1',
    message: '댓글을 남겼습니다: "정말 멋진 차네요! 저도 드라이브 가고 싶어지네요 😍"',
    createdAt: new Date(now - 32 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 3, type: 'FOLLOW',
    actorUsername: 'ev_pioneer_choi', actorColor: '#96CEB4',
    message: '회원님을 팔로우하기 시작했습니다.',
    createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 4, type: 'COMMENT',
    actorUsername: 'tuning_master', actorColor: '#6C5CE7',
    message: '댓글을 남겼습니다: "저도 같은 모델 타는데 공감 100%입니다 👍"',
    createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 5, type: 'FOLLOW',
    actorUsername: 'lambo_seoul', actorColor: '#FD9644',
    message: '회원님을 팔로우하기 시작했습니다.',
    createdAt: new Date(now - 1 * 86400 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 6, type: 'COMMENT',
    actorUsername: 'bmw_lover99', actorColor: '#2196F3',
    message: '댓글을 남겼습니다: "오 저도 다음 주 드라이브 계획 중인데 코스 공유해주실 수 있나요?"',
    createdAt: new Date(now - 2 * 86400 * 1000).toISOString(),
    isRead: true,
  },
];

function NotifItem({ item, onRead }) {
  const meta = TYPE_META[item.type];
  return (
    <button
      className={`${styles.item} ${!item.isRead ? styles.unread : ''}`}
      onClick={() => onRead(item.id)}
    >
      <div className={styles.avatarWrap}>
        <div className={styles.avatar} style={{ background: item.actorColor }}>
          {item.actorUsername[0].toUpperCase()}
        </div>
        <span className={styles.badge} style={{ background: meta.badgeBg }}>
          <meta.Badge />
        </span>
      </div>
      <div className={styles.textWrap}>
        <p className={styles.message}>
          <strong>{item.actorUsername}</strong>
          {' '}
          {item.message}
        </p>
        <span className={styles.time}>{timeAgo(item.createdAt)}</span>
      </div>
      {!item.isRead && <div className={styles.dot} />}
    </button>
  );
}

export default function NotificationsView() {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);

  const markRead = (id) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));

  const unreadCount = items.filter((n) => !n.isRead).length;

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
          {todayItems.map((n) => <NotifItem key={n.id} item={n} onRead={markRead} />)}
        </section>
      )}

      {olderItems.length > 0 && (
        <section>
          <div className={styles.sectionLabel}>이번 주</div>
          {olderItems.map((n) => <NotifItem key={n.id} item={n} onRead={markRead} />)}
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
