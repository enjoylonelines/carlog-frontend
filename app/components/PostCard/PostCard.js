'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PostCard.module.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

const AVATAR_COLORS = ['#E03131', '#45B7D1', '#6C5CE7', '#96CEB4', '#FD9644', '#2196F3', '#FF9800'];
const colorFromId = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

export default function PostCard({ post }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [following, setFollowing] = useState(false);

  const { boardId, userId, username, avatarColor, content, hitcount, createdAt, tags, imageUrl, commentCount } = post;
  const color = avatarColor || colorFromId(userId);
  const isLong = content && content.length > 80;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar} style={{ background: color }}>
          {(username || 'U')[0].toUpperCase()}
        </div>
        <div className={styles.meta}>
          <span className={styles.username}>{username || '알 수 없음'}</span>
          <span className={styles.time}>{timeAgo(createdAt)}</span>
        </div>
        <button
          className={`${styles.followBtn} ${following ? styles.following : ''}`}
          onClick={() => setFollowing(f => !f)}
        >
          {following ? '팔로잉' : '팔로우'}
        </button>
      </div>

      <div
        className={styles.cardLink}
        onClick={() => router.push(`/boards/${boardId}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && router.push(`/boards/${boardId}`)}
      >
      {imageUrl && (
        <div className={styles.imageWrap}>
          <img
            src={imageUrl}
            alt={`${username}의 게시물`}
            className={styles.image}
            loading="lazy"
          />
        </div>
      )}

      <div className={styles.body}>
        {tags && tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map(tag => (
              <span key={tag} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}

        {content && (
          <p className={styles.content}>
            {!expanded && isLong ? (
              <>
                {content.slice(0, 80)}
                {'... '}
                <button className={styles.moreBtn} onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>더보기</button>
              </>
            ) : content}
          </p>
        )}

        <div className={styles.stats}>
        <span className={styles.stat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {(hitcount || 0).toLocaleString()}
        </span>
        <span className={styles.stat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {(commentCount || 0).toLocaleString()}
        </span>
        </div>
      </div>
      </div>
    </article>
  );
}
